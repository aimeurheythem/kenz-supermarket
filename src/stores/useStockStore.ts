import { create } from 'zustand';
import { StockRepo } from '../../database/repositories/stock.repo';
import type { StockMovement } from '@/lib/types';

interface StockStore {
    movements: StockMovement[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadMovements: (filters?: { product_id?: number; type?: string; limit?: number }) => Promise<void>;
    addStock: (
        productId: number,
        quantity: number,
        reason: string,
        referenceId?: number,
        referenceType?: string,
    ) => Promise<void>;
    removeStock: (productId: number, quantity: number, reason: string) => Promise<void>;
    adjustStock: (productId: number, newQuantity: number, reason: string) => Promise<void>;
}

export const useStockStore = create<StockStore>((set) => ({
    movements: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadMovements: async (filters) => {
        try {
            set({ isLoading: true, error: null });
            const movements = await StockRepo.getMovements(filters);
            set({ movements });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    addStock: async (productId, quantity, reason, referenceId?, referenceType?) => {
        try {
            set({ isLoading: true, error: null });
            await StockRepo.addStock(productId, quantity, reason, referenceId, referenceType);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    removeStock: async (productId, quantity, reason) => {
        try {
            set({ isLoading: true, error: null });
            await StockRepo.removeStock(productId, quantity, reason);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    adjustStock: async (productId, newQuantity, reason) => {
        try {
            set({ isLoading: true, error: null });
            await StockRepo.adjustStock(productId, newQuantity, reason);
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },
}));
