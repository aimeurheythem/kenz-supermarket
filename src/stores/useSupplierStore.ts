import { create } from 'zustand';
import type { Supplier, SupplierInput } from '@/lib/types';
import { SupplierRepo } from '../../database/repositories/supplier.repo';

interface SupplierStore {
    suppliers: Supplier[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadSuppliers: () => Promise<void>;
    addSupplier: (input: SupplierInput) => Promise<Supplier>;
    updateSupplier: (id: number, input: Partial<SupplierInput>) => Promise<Supplier>;
    deleteSupplier: (id: number) => Promise<void>;
    addPayment: (id: number, amount: number) => Promise<void>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
    suppliers: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadSuppliers: async () => {
        try {
            set({ isLoading: true, error: null });
            const suppliers = await SupplierRepo.getAll();
            set({ suppliers });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    addSupplier: async (input: SupplierInput) => {
        try {
            set({ error: null });
            const supplier = await SupplierRepo.create(input);
            await get().loadSuppliers();
            return supplier;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateSupplier: async (id: number, input: Partial<SupplierInput>) => {
        try {
            set({ error: null });
            const supplier = await SupplierRepo.update(id, input);
            await get().loadSuppliers();
            return supplier;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    deleteSupplier: async (id: number) => {
        try {
            set({ error: null });
            await SupplierRepo.delete(id);
            await get().loadSuppliers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    addPayment: async (id: number, amount: number) => {
        try {
            set({ error: null });
            await SupplierRepo.updateBalance(id, -amount);
            await get().loadSuppliers();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },
}));
