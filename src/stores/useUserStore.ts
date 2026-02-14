import { create } from 'zustand';
import type { User, UserInput, CashierSession } from '@/lib/types';
import { UserRepo } from '../../database';
import { CashierSessionRepo } from '../../database';

interface UserStore {
    users: User[];
    cashierSessions: CashierSession[];
    loadUsers: () => void;
    addUser: (input: UserInput) => void;
    updateUser: (id: number, input: Partial<UserInput & { is_active?: number }>) => void;
    deleteUser: (id: number) => void;
    loadCashierSessions: (cashierId?: number) => void;
    getCashierPerformance: (cashierId: number) => {
        total_sessions: number;
        total_sales: number;
        total_transactions: number;
        average_sale: number;
        total_hours: number;
    };
}

export const useUserStore = create<UserStore>((set, get) => ({
    users: [],
    cashierSessions: [],

    loadUsers: () => {
        const users = UserRepo.getAll();
        set({ users });
    },

    addUser: (input) => {
        UserRepo.create(input);
        get().loadUsers();
    },

    updateUser: (id, input) => {
        UserRepo.update(id, input);
        get().loadUsers();
    },

    deleteUser: (id) => {
        UserRepo.delete(id); // This is soft delete (is_active = 0)
        get().loadUsers();
    },

    loadCashierSessions: (cashierId) => {
        const sessions = CashierSessionRepo.getAll(cashierId ? { cashier_id: cashierId } : undefined);
        set({ cashierSessions: sessions });
    },

    getCashierPerformance: (cashierId) => {
        return CashierSessionRepo.getCashierPerformance(cashierId);
    }
}));
