import { create } from 'zustand';
import { ExpenseRepo } from '@/../database/repositories/expense.repo';
import type { Expense, ExpenseInput } from '@/lib/types';

interface ExpenseStore {
    expenses: Expense[];
    stats: {
        total: number;
        byCategory: { category: string; total: number }[];
    };
    isLoading: boolean;
    error: string | null;

    loadExpenses: (filters?: { startDate?: string; endDate?: string; category?: string }) => Promise<void>;
    addExpense: (expense: ExpenseInput) => Promise<void>;
    deleteExpense: (id: number) => Promise<void>;
    loadStats: (startDate?: string, endDate?: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
    expenses: [],
    stats: { total: 0, byCategory: [] },
    isLoading: false,
    error: null,

    loadExpenses: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const expenses = await ExpenseRepo.getAll(filters);
            set({ expenses });
        } catch (error) {
            set({ error: (error as Error).message });
        } finally {
            set({ isLoading: false });
        }
    },

    addExpense: async (expense) => {
        set({ isLoading: true, error: null });
        try {
            await ExpenseRepo.create(expense);
            await get().loadExpenses();
            await get().loadStats();
        } catch (error) {
            set({ error: (error as Error).message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await ExpenseRepo.delete(id);
            await get().loadExpenses();
            await get().loadStats();
        } catch (error) {
            set({ error: (error as Error).message });
        } finally {
            set({ isLoading: false });
        }
    },

    loadStats: async (startDate, endDate) => {
        try {
            const stats = await ExpenseRepo.getStats(startDate, endDate);
            set({ stats });
        } catch (error) {
            console.error('Failed to load expense stats:', error);
        }
    }
}));
