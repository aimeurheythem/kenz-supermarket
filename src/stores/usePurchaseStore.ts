import { create } from 'zustand';
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/types';
import { PurchaseRepo } from '../../database/repositories/purchase.repo';

interface PurchaseStore {
    orders: PurchaseOrder[];
    currentOrderItems: PurchaseOrderItem[];
    isLoading: boolean;
    loadOrders: () => Promise<void>;
    loadOrderItems: (orderId: number) => Promise<void>;
    createOrder: (data: { supplier_id: number; status: string; notes?: string; items: { product_id: number; quantity: number; unit_cost: number }[] }) => Promise<void>;
    receiveOrder: (id: number) => Promise<void>;
    updateStatus: (id: number, status: string) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
    orders: [],
    currentOrderItems: [],
    isLoading: false,

    loadOrders: async () => {
        set({ isLoading: true });
        const orders = await PurchaseRepo.getAll();
        set({ orders, isLoading: false });
    },

    loadOrderItems: async (orderId: number) => {
        set({ isLoading: true });
        const items = await PurchaseRepo.getItems(orderId);
        set({ currentOrderItems: items, isLoading: false });
    },

    createOrder: async (data) => {
        await PurchaseRepo.create(data);
        await get().loadOrders();
    },

    receiveOrder: async (id: number) => {
        await PurchaseRepo.receive(id);
        await get().loadOrders();
    },

    updateStatus: async (id: number, status: string) => {
        await PurchaseRepo.updateStatus(id, status);
        await get().loadOrders();
    }
}));
