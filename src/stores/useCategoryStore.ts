import { create } from 'zustand';
import type { Category, CategoryInput } from '@/lib/types';
import { CategoryRepo } from '../../database/repositories/category.repo';

interface CategoryStore {
    categories: Category[];
    loadCategories: () => void;
    addCategory: (input: CategoryInput) => Category;
    updateCategory: (id: number, input: Partial<CategoryInput>) => Category;
    deleteCategory: (id: number) => void;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],

    loadCategories: () => {
        const categories = CategoryRepo.getAll();
        set({ categories });
    },

    addCategory: (input: CategoryInput) => {
        const category = CategoryRepo.create(input);
        get().loadCategories();
        return category;
    },

    updateCategory: (id: number, input: Partial<CategoryInput>) => {
        const category = CategoryRepo.update(id, input);
        get().loadCategories();
        return category;
    },

    deleteCategory: (id: number) => {
        CategoryRepo.delete(id);
        get().loadCategories();
    },
}));
