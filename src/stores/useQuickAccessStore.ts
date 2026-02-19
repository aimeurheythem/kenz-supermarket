import { create } from 'zustand';
import type { QuickAccessItem, QuickAccessItemInput } from '../lib/types';
import { QuickAccessRepo } from '../../database/repositories/quick_access.repo';

interface QuickAccessState {
    items: QuickAccessItem[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;

    fetchItems: () => Promise<void>;
    addItem: (input: QuickAccessItemInput) => Promise<void>;
    updateItem: (id: number, input: Partial<QuickAccessItemInput>) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
}

export const useQuickAccessStore = create<QuickAccessState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
            const items = await QuickAccessRepo.getAll();
            set({ items });
        } catch (err) {
            set({ error: (err as Error).message });
        } finally {
            set({ isLoading: false });
        }
    },

    addItem: async (input) => {
        try {
            set({ error: null });
            const newItem = await QuickAccessRepo.create(input);
            if (newItem) {
                set({ items: [newItem, ...get().items] });
            }
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    updateItem: async (id, input) => {
        try {
            set({ error: null });
            const updated = await QuickAccessRepo.update(id, input);
            if (updated) {
                set({
                    items: get().items.map((item) => (item.id === id ? updated : item)),
                });
            }
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    deleteItem: async (id) => {
        try {
            set({ error: null });
            await QuickAccessRepo.delete(id);
            set({
                items: get().items.filter((item) => item.id !== id),
            });
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },
}));
