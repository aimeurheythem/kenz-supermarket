import { create } from 'zustand';
import type { PurchaseOrder, PurchaseOrderItem } from '@/lib/types';
import { PurchaseRepo } from '../../database/repositories/purchase.repo';

interface PurchaseStore {
    orders: PurchaseOrder[];
    currentOrderItems: PurchaseOrderItem[];
    loadOrders: () => void;
    loadOrderItems: (orderId: number) => void;
    createOrder: (data: { supplier_id: number; status: string; notes?: string; items: { product_id: number; quantity: number; unit_cost: number }[] }) => void;
    receiveOrder: (id: number) => void;
    updateStatus: (id: number, status: string) => void;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
    orders: [],
    currentOrderItems: [],

    loadOrders: () => {
        const orders = PurchaseRepo.getAll();
        set({ orders });
    },

    loadOrderItems: (orderId: number) => {
        const items = PurchaseRepo.getItems(orderId);
        set({ currentOrderItems: items });
    },

    createOrder: (data) => {
        PurchaseRepo.create(data);
        get().loadOrders();
    },

    receiveOrder: (id: number) => {
        PurchaseRepo.receive(id);
        get().loadOrders();
    },

    updateStatus: (id: number, status: string) => {
        PurchaseRepo.updateStatus(id, status);
        get().loadOrders();
    }
}));
