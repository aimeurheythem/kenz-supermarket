import { create } from 'zustand';
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/types';
import { PurchaseRepo } from '../../database/repositories/purchase.repo';

interface PurchaseStore {
    orders: PurchaseOrder[];
    currentOrderItems: PurchaseOrderItem[];
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    loadOrders: () => Promise<void>;
    loadOrderItems: (orderId: number) => Promise<void>;
    createOrder: (data: {
        supplier_id: number;
        status: string;
        notes?: string;
        items: { product_id: number; quantity: number; unit_cost: number }[];
    }) => Promise<void>;
    receiveOrder: (id: number) => Promise<void>;
    updateStatus: (id: number, status: string) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
    orders: [],
    currentOrderItems: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    loadOrders: async () => {
        try {
            set({ isLoading: true, error: null });
            const orders = await PurchaseRepo.getAll();
            set({ orders });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    loadOrderItems: async (orderId: number) => {
        try {
            set({ isLoading: true, error: null });
            const items = await PurchaseRepo.getItems(orderId);
            set({ currentOrderItems: items });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    createOrder: async (data) => {
        try {
            set({ error: null });
            await PurchaseRepo.create(data);
            await get().loadOrders();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    receiveOrder: async (id: number) => {
        try {
            set({ error: null });
            await PurchaseRepo.receive(id);
            await get().loadOrders();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateStatus: async (id: number, status: string) => {
        try {
            set({ error: null });
            await PurchaseRepo.updateStatus(id, status);
            await get().loadOrders();
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },
}));
