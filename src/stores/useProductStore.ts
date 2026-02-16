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
    filters: ProductFilters;

    loadProducts: () => Promise<void>;
    loadLowStock: () => Promise<void>;
    setFilters: (filters: ProductFilters) => void;
    addProduct: (input: ProductInput) => Promise<Product>;
    updateProduct: (id: number, input: Partial<ProductInput>) => Promise<Product>;
    deleteProduct: (id: number) => Promise<void>;
    getByBarcode: (barcode: string) => Promise<Product | undefined>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    lowStockProducts: [],
    isLoading: false,
    filters: {},

    loadProducts: async () => {
        set({ isLoading: true });
        const { filters } = get();
        const products = await ProductRepo.getAll(filters);
        set({ products, isLoading: false });
    },

    loadLowStock: async () => {
        const lowStockProducts = await ProductRepo.getLowStock();
        set({ lowStockProducts });
    },

    setFilters: (filters: ProductFilters) => {
        set({ filters });
        // Don't auto-load here - let the component handle it
    },

    addProduct: async (input: ProductInput) => {
        const product = await ProductRepo.create(input);
        await get().loadProducts();
        await get().loadLowStock();
        return product;
    },

    updateProduct: async (id: number, input: Partial<ProductInput>) => {
        const product = await ProductRepo.update(id, input);
        await get().loadProducts();
        await get().loadLowStock();
        return product;
    },

    deleteProduct: async (id: number) => {
        await ProductRepo.delete(id);
        await get().loadProducts();
        await get().loadLowStock();
    },

    getByBarcode: async (barcode: string) => {
        return ProductRepo.getByBarcode(barcode);
    },
}));
