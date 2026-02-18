import { create } from 'zustand';
import type { User, UserInput, CashierSession } from '@/lib/types';
import { UserRepo } from '../../database';
import { CashierSessionRepo } from '../../database';

interface UserStore {
    users: User[];
    cashierSessions: CashierSession[];
    isLoadingUsers: boolean;
    isLoadingSessions: boolean;
    error: string | null;
    clearError: () => void;
    loadUsers: () => Promise<void>;
    addUser: (input: UserInput) => Promise<void>;
    updateUser: (id: number, input: Partial<UserInput & { is_active?: number }>) => Promise<void>;
    deleteUser: (id: number) => Promise<void>;
    loadCashierSessions: (cashierId?: number) => Promise<void>;
    getCashierPerformance: (cashierId: number) => Promise<{
        total_sessions: number;
        total_sales: number;
        total_transactions: number;
        average_sale: number;
        total_hours: number;
    }>;
}

export const useUserStore = create<UserStore>((set, get) => ({
    users: [],
    cashierSessions: [],
    isLoadingUsers: false,
    isLoadingSessions: false,
    error: null,

    clearError: () => set({ error: null }),

    loadUsers: async () => {
        try {
            set({ isLoadingUsers: true, error: null });
            const users = await UserRepo.getAll();
            set({ users });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingUsers: false });
        }
    },

    addUser: async (input) => {
        try {
            set({ error: null });
            await UserRepo.create(input);
            await get().loadUsers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateUser: async (id, input) => {
        try {
            set({ error: null });
            await UserRepo.update(id, input);
            await get().loadUsers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    deleteUser: async (id) => {
        try {
            set({ error: null });
            await UserRepo.delete(id);
            await get().loadUsers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    loadCashierSessions: async (cashierId) => {
        try {
            set({ isLoadingSessions: true, error: null });
            const sessions = await CashierSessionRepo.getAll(cashierId ? { cashier_id: cashierId } : undefined);
            set({ cashierSessions: sessions });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoadingSessions: false });
        }
    },

    getCashierPerformance: async (cashierId) => {
        try {
            set({ error: null });
            return await CashierSessionRepo.getCashierPerformance(cashierId);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    }
}));
