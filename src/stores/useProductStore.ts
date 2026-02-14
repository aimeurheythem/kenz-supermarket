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

    loadProducts: () => void;
    loadLowStock: () => void;
    setFilters: (filters: ProductFilters) => void;
    addProduct: (input: ProductInput) => Product;
    updateProduct: (id: number, input: Partial<ProductInput>) => Product;
    deleteProduct: (id: number) => void;
    getByBarcode: (barcode: string) => Product | undefined;
}

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    lowStockProducts: [],
    isLoading: false,
    filters: {},

    loadProducts: () => {
        const { filters } = get();
        const products = ProductRepo.getAll(filters);
        set({ products });
    },

    loadLowStock: () => {
        const lowStockProducts = ProductRepo.getLowStock();
        set({ lowStockProducts });
    },

    setFilters: (filters: ProductFilters) => {
        set({ filters });
        get().loadProducts();
    },

    addProduct: (input: ProductInput) => {
        const product = ProductRepo.create(input);
        get().loadProducts();
        get().loadLowStock();
        return product;
    },

    updateProduct: (id: number, input: Partial<ProductInput>) => {
        const product = ProductRepo.update(id, input);
        get().loadProducts();
        get().loadLowStock();
        return product;
    },

    deleteProduct: (id: number) => {
        ProductRepo.delete(id);
        get().loadProducts();
        get().loadLowStock();
    },

    getByBarcode: (barcode: string) => {
        return ProductRepo.getByBarcode(barcode);
    },
}));
