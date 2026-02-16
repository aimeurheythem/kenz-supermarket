import { create } from 'zustand';
import type { Category, CategoryInput } from '@/lib/types';
import { CategoryRepo } from '../../database/repositories/category.repo';

interface CategoryStore {
    categories: Category[];
    isLoading: boolean;
    loadCategories: () => Promise<void>;
    addCategory: (input: CategoryInput) => Promise<Category>;
    updateCategory: (id: number, input: Partial<CategoryInput>) => Promise<Category>;
    deleteCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],
    isLoading: false,

    loadCategories: async () => {
        set({ isLoading: true });
        const categories = await CategoryRepo.getAll();
        set({ categories, isLoading: false });
    },

    addCategory: async (input: CategoryInput) => {
        const category = await CategoryRepo.create(input);
        await get().loadCategories();
        return category;
    },

    updateCategory: async (id: number, input: Partial<CategoryInput>) => {
        const category = await CategoryRepo.update(id, input);
        await get().loadCategories();
        return category;
    },

    deleteCategory: async (id: number) => {
        await CategoryRepo.delete(id);
        await get().loadCategories();
    },
}));
