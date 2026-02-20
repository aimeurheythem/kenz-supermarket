import type { Supplier, SupplierInput } from '@/lib/types';
import { SupplierRepo } from '../../database/repositories/supplier.repo';
import { createCrudStore } from './createCrudStore';

interface SupplierExtras {
    loadSuppliers: () => Promise<void>;
    addSupplier: (input: SupplierInput) => Promise<Supplier>;
    updateSupplier: (id: number, input: Partial<SupplierInput>) => Promise<Supplier>;
    deleteSupplier: (id: number) => Promise<void>;
    addPayment: (id: number, amount: number) => Promise<void>;
}

/**
 * Supplier store — use `items` for the supplier list.
 * Destructure as `{ items: suppliers }` in components for a friendly alias.
 */
export const useSupplierStore = createCrudStore<Supplier, SupplierInput, SupplierExtras>({
    repo: SupplierRepo,
    extend: (set, get) => ({
        loadSuppliers: () => get().loadAll(),
        addSupplier: (input: SupplierInput) => get().add(input),
        updateSupplier: (id: number, input: Partial<SupplierInput>) => get().update(id, input),
        deleteSupplier: (id: number) => get().remove(id),
        addPayment: async (id: number, amount: number) => {
            try {
                set({ error: null } as never);
                await SupplierRepo.updateBalance(id, -amount);
                await get().loadAll();
            } catch (e) {
                set({ error: (e as Error).message } as never);
                throw e;
            }
        },
    }),
});
