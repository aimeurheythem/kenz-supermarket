import { create } from 'zustand';
import type { Supplier, SupplierInput } from '@/lib/types';
import { SupplierRepo } from '../../database/repositories/supplier.repo';

interface SupplierStore {
    suppliers: Supplier[];
    loadSuppliers: () => void;
    addSupplier: (input: SupplierInput) => Supplier;
    updateSupplier: (id: number, input: Partial<SupplierInput>) => Supplier;
    deleteSupplier: (id: number) => void;
    addPayment: (id: number, amount: number) => void;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
    suppliers: [],

    loadSuppliers: () => {
        const suppliers = SupplierRepo.getAll();
        set({ suppliers });
    },

    addSupplier: (input: SupplierInput) => {
        const supplier = SupplierRepo.create(input);
        get().loadSuppliers();
        return supplier;
    },

    updateSupplier: (id: number, input: Partial<SupplierInput>) => {
        const supplier = SupplierRepo.update(id, input);
        get().loadSuppliers();
        return supplier;
    },

    deleteSupplier: (id: number) => {
        SupplierRepo.delete(id);
        get().loadSuppliers();
    },

    addPayment: (id: number, amount: number) => {
        SupplierRepo.updateBalance(id, -amount);
        get().loadSuppliers();
    },
}));
