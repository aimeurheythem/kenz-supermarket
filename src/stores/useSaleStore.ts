import { create } from 'zustand';
import type { Sale, CartItem } from '@/lib/types';
import { SaleRepo } from '../../database/repositories/sale.repo';

interface SaleStore {
    sales: Sale[];
    recentSales: Sale[];
    todayStats: { revenue: number; orders: number };
    cart: CartItem[];

    loadSales: (filters?: { from?: string; to?: string }) => void;
    loadRecent: () => void;
    loadTodayStats: () => void;

    // Cart operations
    addToCart: (item: CartItem) => void;
    updateCartItem: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;

    // Checkout
    checkout: (payment: { method: string; customer_name?: string; tax_rate?: number; discount?: number }, userId?: number, sessionId?: number) => Sale;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
    sales: [],
    recentSales: [],
    todayStats: { revenue: 0, orders: 0 },
    cart: [],

    loadSales: (filters) => {
        const sales = SaleRepo.getAll(filters);
        set({ sales });
    },

    loadRecent: () => {
        const recentSales = SaleRepo.getRecentSales(5);
        set({ recentSales });
    },

    loadTodayStats: () => {
        const todayStats = SaleRepo.getTodayStats();
        set({ todayStats });
    },

    addToCart: (item: CartItem) => {
        const { cart } = get();
        const existing = cart.find((c) => c.product.id === item.product.id);
        if (existing) {
            set({
                cart: cart.map((c) =>
                    c.product.id === item.product.id
                        ? { ...c, quantity: c.quantity + item.quantity }
                        : c
                ),
            });
        } else {
            set({ cart: [...cart, item] });
        }
    },

    updateCartItem: (productId: number, quantity: number) => {
        const { cart } = get();
        if (quantity <= 0) {
            set({ cart: cart.filter((c) => c.product.id !== productId) });
        } else {
            set({
                cart: cart.map((c) =>
                    c.product.id === productId ? { ...c, quantity } : c
                ),
            });
        }
    },

    removeFromCart: (productId: number) => {
        set({ cart: get().cart.filter((c) => c.product.id !== productId) });
    },

    clearCart: () => set({ cart: [] }),

    getCartTotal: () => {
        return get().cart.reduce(
            (sum, item) => sum + item.product.selling_price * item.quantity - item.discount,
            0
        );
    },

    checkout: (payment, userId, sessionId) => {
        const { cart } = get();
        if (cart.length === 0) throw new Error('Cart is empty');

        const sale = SaleRepo.createFromCart(cart, payment, userId, sessionId);
        set({ cart: [] });
        get().loadSales();
        get().loadRecent();
        get().loadTodayStats();
        return sale;
    },
}));
