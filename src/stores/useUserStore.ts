import { create } from 'zustand';
import type { User, UserInput, CashierSession } from '@/lib/types';
import { UserRepo } from '../../database';
import { CashierSessionRepo } from '../../database';

interface UserStore {
    users: User[];
    cashierSessions: CashierSession[];
    isLoading: boolean;
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
    isLoading: false,

    loadUsers: async () => {
        set({ isLoading: true });
        const users = await UserRepo.getAll();
        set({ users, isLoading: false });
    },

    addUser: async (input) => {
        await UserRepo.create(input);
        await get().loadUsers();
    },

    updateUser: async (id, input) => {
        await UserRepo.update(id, input);
        await get().loadUsers();
    },

    deleteUser: async (id) => {
        await UserRepo.delete(id); // This is soft delete (is_active = 0)
        await get().loadUsers();
    },

    loadCashierSessions: async (cashierId) => {
        set({ isLoading: true });
        const sessions = await CashierSessionRepo.getAll(cashierId ? { cashier_id: cashierId } : undefined);
        set({ cashierSessions: sessions, isLoading: false });
    },

    getCashierPerformance: async (cashierId) => {
        return await CashierSessionRepo.getCashierPerformance(cashierId);
    }
}));
