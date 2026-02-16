import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CashierSession } from '@/lib/types';
import { UserRepo } from '../../database';
import { CashierSessionRepo } from '../../database';

interface SessionInfo {
    session: CashierSession;
    openingCash: number;
}

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    currentSession: SessionInfo | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (username: string, password: string) => Promise<boolean>;
    loginCashier: (cashierId: number, pinCode: string) => Promise<boolean>;
    startCashierSession: (cashierId: number, openingCash: number) => Promise<CashierSession | null>;
    closeCashierSession: (closingCash: number, notes?: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    changePassword: (current: string, newPass: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => boolean;
    hasPermission: (permission: Permission) => boolean;

    // Getters
    getUserRole: () => 'admin' | 'manager' | 'cashier' | null;
    getCurrentSessionId: () => number | null;
}

export type Permission =
    | 'view_dashboard'
    | 'view_inventory'
    | 'edit_inventory'
    | 'view_reports'
    | 'view_users'
    | 'edit_users'
    | 'view_settings'
    | 'edit_settings'
    | 'use_pos'
    | 'process_refunds'
    | 'view_suppliers'
    | 'edit_suppliers';

// Permission matrix
const PERMISSIONS: Record<string, Permission[]> = {
    admin: [
        'view_dashboard', 'view_inventory', 'edit_inventory',
        'view_reports', 'view_users', 'edit_users',
        'view_settings', 'edit_settings', 'use_pos',
        'process_refunds', 'view_suppliers', 'edit_suppliers'
    ],
    manager: [
        'view_dashboard', 'view_inventory', 'edit_inventory',
        'view_reports', 'view_users', 'use_pos',
        'process_refunds', 'view_suppliers', 'edit_suppliers'
    ],
    cashier: [
        'use_pos'
    ]
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            currentSession: null as SessionInfo | null,
            isLoading: false,
            error: null,

            login: async (username: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const user = await UserRepo.authenticate(username, password);
                    if (user) {
                        set({ user, isAuthenticated: true, currentSession: null, isLoading: false });
                        return true;
                    }
                    set({ error: 'Invalid username or password', isLoading: false });
                    return false;
                } catch (error: any) {
                    set({ error: error.message || 'Login failed', isLoading: false });
                    return false;
                }
            },

            loginCashier: async (cashierId: number, pinCode: string) => {
                set({ isLoading: true, error: null });
                try {
                    const user = await UserRepo.authenticateWithPin(cashierId, pinCode);
                    if (user) {
                        set({ user, isAuthenticated: true, isLoading: false });
                        return true;
                    }
                    set({ error: 'Invalid PIN code', isLoading: false });
                    return false;
                } catch (error: any) {
                    set({ error: error.message || 'Login failed', isLoading: false });
                    return false;
                }
            },

            startCashierSession: async (cashierId: number, openingCash: number) => {
                try {
                    const session = await CashierSessionRepo.startSession({
                        cashier_id: cashierId,
                        opening_cash: openingCash
                    });
                    if (session && session.id) {
                        set({
                            currentSession: { session, openingCash }
                        });
                        return session;
                    }
                    console.error('AuthStore: Session creation returned null or invalid session');
                    return null;
                } catch (e) {
                    console.error('AuthStore: Failed to start session:', e);
                    return null;
                }
            },

            closeCashierSession: async (closingCash: number, notes?: string) => {
                const { currentSession } = get();
                if (currentSession?.session?.id) {
                    try {
                        await CashierSessionRepo.closeSession({
                            session_id: currentSession.session.id,
                            closing_cash: closingCash,
                            notes
                        });
                        set({ currentSession: null });
                    } catch (e) {
                        console.error('Failed to close session:', e);
                    }
                }
            },

            logout: () => {
                // Close session if active
                const { currentSession } = get();
                if (currentSession) {
                    get().closeCashierSession(0, 'Auto-closed on logout');
                }
                set({ user: null, isAuthenticated: false, currentSession: null, error: null });
            },

            updateProfile: async (data: Partial<User>) => {
                const currentUser = get().user;
                if (!currentUser) return false;

                try {
                    // Type assertion needed because User model has 'null' for pin_code while UpdateInput expects 'undefined'
                    const updatedUser = await UserRepo.update(currentUser.id, data as any);
                    set({ user: updatedUser });
                    return true;
                } catch (error) {
                    console.error('Failed to update profile:', error);
                    return false;
                }
            },

            changePassword: async (current: string, newPass: string) => {
                const currentUser = get().user;
                if (!currentUser) return false;

                try {
                    const success = await UserRepo.updatePassword(currentUser.id, current, newPass);
                    return success;
                } catch (error) {
                    console.error('Failed to change password:', error);
                    return false;
                }
            },

            checkAuth: () => {
                return get().isAuthenticated;
            },

            hasPermission: (permission: Permission) => {
                const { user } = get();
                if (!user) return false;
                const rolePerms = PERMISSIONS[user.role] || [];
                return rolePerms.includes(permission);
            },

            getUserRole: () => {
                return get().user?.role || null;
            },

            getCurrentSessionId: () => {
                return get().currentSession?.session?.id || null;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                currentSession: state.currentSession
            })
        }
    )
);

// Navigation items with required permissions
export const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', permission: 'view_dashboard' as Permission },
    { path: '/pos', label: 'POS', icon: 'ShoppingCart', permission: 'use_pos' as Permission },
    { path: '/inventory', label: 'Inventory', icon: 'Package', permission: 'view_inventory' as Permission },
    { path: '/stock', label: 'Stock Control', icon: 'ClipboardList', permission: 'view_inventory' as Permission },
    { path: '/suppliers', label: 'Suppliers', icon: 'Truck', permission: 'view_suppliers' as Permission },
    { path: '/purchases', label: 'Purchases', icon: 'FileText', permission: 'view_suppliers' as Permission },
    { path: '/reports', label: 'Reports', icon: 'BarChart3', permission: 'view_reports' as Permission },
    { path: '/users', label: 'Users', icon: 'Users', permission: 'view_users' as Permission },
    { path: '/credit', label: 'Credit', icon: 'CreditCard', permission: 'view_reports' as Permission },
    { path: '/settings', label: 'Settings', icon: 'Settings', permission: 'view_settings' as Permission },
    { path: '/help', label: 'Help', icon: 'HelpCircle', permission: null }, // No permission needed
];
