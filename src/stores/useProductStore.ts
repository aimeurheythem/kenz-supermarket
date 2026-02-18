import { create } from 'zustand';
import type { Product, ProductInput } from '@/lib/types';
import { ProductRepo } from '../../database/repositories/product.repo';

interface ProductFilters {
    search?: string;
    category_id?: number;
    low_stock?: boolean;
}

interface ProductStore {
    products: Product[];
    lowStockProducts: Product[];
    isLoading: boolean;
    error: string | null;
    filters: ProductFilters;

    clearError: () => void;
    loadProducts: () => Promise<void>;
    loadLowStock: () => Promise<void>;
    setFilters: (filters: ProductFilters) => Promise<void>;
    addProduct: (input: ProductInput) => Promise<Product>;
    updateProduct: (id: number, input: Partial<ProductInput>) => Promise<Product>;
    deleteProduct: (id: number) => Promise<void>;
    getByBarcode: (barcode: string) => Promise<Product | undefined>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
        products: [],
        lowStockProducts: [],
        isLoading: false,
        error: null,
        filters: { active_only: true },

        clearError: () => set({ error: null }),

        loadProducts: async () => {
            try {
                set({ isLoading: true, error: null });
                const products = await ProductRepo.getAll(get().filters);
                set({ products });
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            } finally {
                set({ isLoading: false });
            }
        },

        loadLowStock: async () => {
            try {
                set({ error: null });
                const products = await ProductRepo.getAll({ low_stock: true });
                set({ lowStockProducts: products });
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            }
        },

        setFilters: async (filters) => {
            set({ filters: { ...get().filters, ...filters } });
            await get().loadProducts();
        },

        addProduct: async (input) => {
            try {
                set({ error: null });
                const product = await ProductRepo.create(input);
                await get().loadProducts();
                return product;
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            }
        },

        updateProduct: async (id, input) => {
            try {
                set({ error: null });
                const product = await ProductRepo.update(id, input);
                await get().loadProducts();
                return product;
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            }
        },

        deleteProduct: async (id) => {
            try {
                set({ error: null });
                await ProductRepo.delete(id);
                await get().loadProducts();
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            }
        },

        getByBarcode: async (barcode) => {
            try {
                set({ error: null });
                return await ProductRepo.getByBarcode(barcode);
            } catch (e) {
                set({ error: (e as Error).message });
                throw e;
            }
        },
}));
