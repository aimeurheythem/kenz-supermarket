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

    // Actions
    login: (username: string, password: string) => boolean;
    loginCashier: (cashierId: number, pinCode: string) => boolean;
    startCashierSession: (cashierId: number, openingCash: number) => CashierSession | null;
    closeCashierSession: (closingCash: number, notes?: string) => void;
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

            login: (username: string, password: string) => {
                const user = UserRepo.authenticate(username, password);
                if (user) {
                    set({ user, isAuthenticated: true, currentSession: null });
                    return true;
                }
                return false;
            },

            loginCashier: (cashierId: number, pinCode: string) => {
                const user = UserRepo.authenticateWithPin(cashierId, pinCode);
                if (user) {
                    set({ user, isAuthenticated: true });
                    return true;
                }
                return false;
            },

            startCashierSession: (cashierId: number, openingCash: number) => {
                try {
                    console.log('AuthStore: Starting session for cashier', cashierId);
                    const session = CashierSessionRepo.startSession({
                        cashier_id: cashierId,
                        opening_cash: openingCash
                    });
                    console.log('AuthStore: Session created:', session);
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

            closeCashierSession: (closingCash: number, notes?: string) => {
                const { currentSession } = get();
                if (currentSession?.session?.id) {
                    try {
                        CashierSessionRepo.closeSession({
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
                set({ user: null, isAuthenticated: false, currentSession: null });
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
