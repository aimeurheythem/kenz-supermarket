import type { Category, CategoryInput } from '@/lib/types';
import { CategoryRepo } from '../../database/repositories/category.repo';
import { createCrudStore } from './createCrudStore';

interface CategoryExtras {
    loadCategories: () => Promise<void>;
    addCategory: (input: CategoryInput) => Promise<Category>;
    updateCategory: (id: number, input: Partial<CategoryInput>) => Promise<Category>;
    deleteCategory: (id: number) => Promise<void>;
}

/**
 * Category store — use `items` for the category list.
 * Destructure as `{ items: categories }` in components for a friendly alias.
 */
export const useCategoryStore = createCrudStore<Category, CategoryInput, CategoryExtras>({
    repo: CategoryRepo,
    extend: (_set, get) => ({
        loadCategories: () => get().loadAll(),
        addCategory: (input: CategoryInput) => get().add(input),
        updateCategory: (id: number, input: Partial<CategoryInput>) => get().update(id, input),
        deleteCategory: (id: number) => get().remove(id),
    }),
});
