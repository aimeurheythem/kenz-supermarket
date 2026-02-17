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

// Cross-window synchronization using storage events (more reliable in some Electron versions)
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'product-update-signal') {
            useProductStore.getState().loadProducts();
            useProductStore.getState().loadLowStock();
        }
    });

    // Refresh when window becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            useProductStore.getState().loadProducts();
            useProductStore.getState().loadLowStock();
        }
    });
}

export const useProductStore = create<ProductStore>((set, get) => {
    const notifyOtherWindows = () => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('product-update-signal', Date.now().toString());
        }
    };

    return {
        products: [],
        lowStockProducts: [],
        isLoading: false,
        filters: { active_only: true },

        loadProducts: async () => {
            set({ isLoading: true });
            try {
                const products = await ProductRepo.getAll(get().filters);
                set({ products });
            } finally {
                set({ isLoading: false });
            }
        },

        loadLowStock: async () => {
            const products = await ProductRepo.getAll({ low_stock: true });
            set({ lowStockProducts: products });
        },

        setFilters: (filters) => {
            set({ filters: { ...get().filters, ...filters } });
            get().loadProducts();
        },

        addProduct: async (input) => {
            const product = await ProductRepo.create(input);
            // Optimistic update: Add to list immediately
            set(state => ({
                products: [product, ...state.products],
                filters: { ...state.filters, search: undefined, category_id: undefined } // Reset filters in store
            }));
            await get().loadProducts();
            notifyOtherWindows();
            return product;
        },

        updateProduct: async (id, input) => {
            const product = await ProductRepo.update(id, input);
            await get().loadProducts();
            notifyOtherWindows();
            return product;
        },

        deleteProduct: async (id) => {
            await ProductRepo.delete(id);
            await get().loadProducts();
            notifyOtherWindows();
        },

        getByBarcode: async (barcode) => {
            return ProductRepo.getByBarcode(barcode);
        },
    };
});
