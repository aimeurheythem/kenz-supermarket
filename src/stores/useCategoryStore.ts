import { create } from 'zustand';
import type { Category, CategoryInput } from '@/lib/types';
import { CategoryRepo } from '../../database/repositories/category.repo';

interface CategoryStore {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadCategories: () => Promise<void>;
    addCategory: (input: CategoryInput) => Promise<Category>;
    updateCategory: (id: number, input: Partial<CategoryInput>) => Promise<Category>;
    deleteCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadCategories: async () => {
        try {
            set({ isLoading: true, error: null });
            const categories = await CategoryRepo.getAll();
            set({ categories });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    addCategory: async (input: CategoryInput) => {
        try {
            set({ error: null });
            const category = await CategoryRepo.create(input);
            await get().loadCategories();
            return category;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateCategory: async (id: number, input: Partial<CategoryInput>) => {
        try {
            set({ error: null });
            const category = await CategoryRepo.update(id, input);
            await get().loadCategories();
            return category;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    deleteCategory: async (id: number) => {
        try {
            set({ error: null });
            await CategoryRepo.delete(id);
            await get().loadCategories();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },
}));
