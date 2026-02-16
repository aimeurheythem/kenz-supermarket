import { create } from 'zustand';
import type { QuickAccessItem, QuickAccessItemInput } from '../lib/types';

interface QuickAccessState {
    items: QuickAccessItem[];
    loading: boolean;
    error: string | null;

    fetchItems: () => Promise<void>;
    addItem: (input: QuickAccessItemInput) => Promise<void>;
    updateItem: (id: number, input: Partial<QuickAccessItemInput>) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
}

export const useQuickAccessStore = create<QuickAccessState>((set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchItems: async () => {
        set({ loading: true });
        try {
            const { QuickAccessRepo } = await import('../../database/repositories/quick_access.repo');
            const items = await QuickAccessRepo.getAll();
            set({ items, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    addItem: async (input) => {
        try {
            const { QuickAccessRepo } = await import('../../database/repositories/quick_access.repo');
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
            const { QuickAccessRepo } = await import('../../database/repositories/quick_access.repo');
            const updated = await QuickAccessRepo.update(id, input);
            if (updated) {
                set({
                    items: get().items.map(item => item.id === id ? updated : item)
                });
            }
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    deleteItem: async (id) => {
        try {
            const { QuickAccessRepo } = await import('../../database/repositories/quick_access.repo');
            await QuickAccessRepo.delete(id);
            set({
                items: get().items.filter(item => item.id !== id)
            });
        } catch (err) {
            set({ error: (err as Error).message });
        }
    }
}));
