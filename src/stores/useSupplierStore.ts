import { create } from 'zustand';
import type { Supplier, SupplierInput } from '@/lib/types';
import { SupplierRepo } from '../../database/repositories/supplier.repo';

interface SupplierStore {
    suppliers: Supplier[];
    isLoading: boolean;
    loadSuppliers: () => Promise<void>;
    addSupplier: (input: SupplierInput) => Promise<Supplier>;
    updateSupplier: (id: number, input: Partial<SupplierInput>) => Promise<Supplier>;
    deleteSupplier: (id: number) => Promise<void>;
    addPayment: (id: number, amount: number) => Promise<void>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
    suppliers: [],
    isLoading: false,

    loadSuppliers: async () => {
        set({ isLoading: true });
        const suppliers = await SupplierRepo.getAll();
        set({ suppliers, isLoading: false });
    },

    addSupplier: async (input: SupplierInput) => {
        const supplier = await SupplierRepo.create(input);
        await get().loadSuppliers();
        return supplier;
    },

    updateSupplier: async (id: number, input: Partial<SupplierInput>) => {
        const supplier = await SupplierRepo.update(id, input);
        await get().loadSuppliers();
        return supplier;
    },

    deleteSupplier: async (id: number) => {
        await SupplierRepo.delete(id);
        await get().loadSuppliers();
    },

    addPayment: async (id: number, amount: number) => {
        await SupplierRepo.updateBalance(id, -amount);
        await get().loadSuppliers();
    },
}));
