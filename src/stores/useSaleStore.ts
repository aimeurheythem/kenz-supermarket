import { create } from 'zustand';
import type { Sale, CartItem } from '@/lib/types';
import { SaleRepo } from '../../database/repositories/sale.repo';
import { ProductRepo } from '../../database/repositories/product.repo';

interface SaleStore {
    sales: Sale[];
    recentSales: Sale[];
    todayStats: { revenue: number; orders: number; profit: number };
    cart: CartItem[];
    isLoading: boolean;
    error: string | null;

    clearError: () => void;
    loadSales: (filters?: { from?: string; to?: string }) => Promise<void>;
    loadRecent: () => Promise<void>;
    loadTodayStats: () => Promise<void>;

    // Cart operations
    addToCart: (item: CartItem) => Promise<void>;
    updateCartItem: (productId: number, quantity: number) => Promise<void>;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;

    // Checkout
    checkout: (
        payment: {
            method: string;
            customer_name?: string;
            customer_id?: number | null;
            tax_rate?: number;
            discount?: number;
        },
        userId?: number,
        sessionId?: number,
    ) => Promise<Sale>;

    // Analytics
    getTopProductsByProfit: (
        limit?: number,
        userId?: number,
    ) => Promise<{ name: string; profit: number; total_sold: number }[]>;
    getTodayStatsForUser: (userId: number) => Promise<{ revenue: number; orders: number; profit: number }>;
    getHourlyRevenue: (userId?: number) => Promise<{ time: string; revenue: number }[]>;
    getDailyRevenue: (userId?: number) => Promise<{ day: string; revenue: number }[]>;
    getMonthlyRevenue: (userId?: number) => Promise<{ month: string; revenue: number }[]>;
    getPeakHours: (userId?: number) => Promise<{ hour: string; density: number }[]>;
    getItems: (saleId: number) => Promise<import('@/lib/types').SaleItem[]>;

    // Stock error handling
    stockError: { productName: string; available: number } | null;
    clearStockError: () => void;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
    sales: [],
    recentSales: [],
    todayStats: { revenue: 0, orders: 0, profit: 0 },
    cart: [],
    isLoading: false,
    error: null,
    stockError: null,

    clearError: () => set({ error: null }),

    loadSales: async (filters) => {
        try {
            set({ isLoading: true, error: null });
            const sales = await SaleRepo.getAll(filters);
            set({ sales });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    loadRecent: async () => {
        try {
            set({ error: null });
            const recentSales = await SaleRepo.getRecentSales(10);
            set({ recentSales });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    loadTodayStats: async () => {
        try {
            set({ error: null });
            const todayStats = await SaleRepo.getTodayStats();
            set({ todayStats });
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    addToCart: async (item: CartItem) => {
        const { cart } = get();
        const existing = cart.find((c) => c.product.id === item.product.id);
        const currentQty = existing ? existing.quantity : 0;

        // Clamp discount: must be non-negative and not exceed item total
        const itemTotal = item.product.selling_price * item.quantity;
        const safeDiscount = Math.max(0, Math.min(item.discount, itemTotal));
        const safeItem = safeDiscount !== item.discount ? { ...item, discount: safeDiscount } : item;

        // Fetch fresh stock from DB to avoid stale data
        const freshProduct = await ProductRepo.getById(item.product.id);
        const availableStock = freshProduct?.stock_quantity ?? item.product.stock_quantity;

        if (currentQty + safeItem.quantity > availableStock) {
            set({ stockError: { productName: safeItem.product.name, available: availableStock } });
            return;
        }

        if (existing) {
            set({
                cart: cart.map((c) =>
                    c.product.id === safeItem.product.id ? { ...c, quantity: c.quantity + safeItem.quantity } : c,
                ),
            });
        } else {
            set({ cart: [...cart, safeItem] });
        }
    },

    updateCartItem: async (productId: number, quantity: number) => {
        const { cart } = get();
        const item = cart.find((c) => c.product.id === productId);
        if (!item) return;

        // Fetch fresh stock from DB to avoid stale data
        const freshProduct = await ProductRepo.getById(productId);
        const availableStock = freshProduct?.stock_quantity ?? item.product.stock_quantity;

        if (quantity > availableStock) {
            set({ stockError: { productName: item.product.name, available: availableStock } });
            return;
        }

        if (quantity <= 0) {
            set({ cart: cart.filter((c) => c.product.id !== productId) });
        } else {
            set({
                cart: cart.map((c) => (c.product.id === productId ? { ...c, quantity } : c)),
            });
        }
    },

    removeFromCart: (productId: number) => {
        set({ cart: get().cart.filter((c) => c.product.id !== productId) });
    },

    clearCart: () => set({ cart: [] }),

    checkout: async (payment, userId, sessionId) => {
        const { cart } = get();
        if (cart.length === 0) throw new Error('Cart is empty');

        try {
            set({ isLoading: true, error: null });
            const sale = await SaleRepo.createFromCart(cart, payment, userId, sessionId);
            set({ cart: [] });
            await get().loadSales();
            await get().loadRecent();
            await get().loadTodayStats();
            return sale;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },

    getTopProductsByProfit: async (limit = 5, userId?) => {
        return SaleRepo.getTopProductsByProfit(limit, userId);
    },

    getTodayStatsForUser: async (userId) => {
        return SaleRepo.getTodayStats(userId);
    },

    getHourlyRevenue: async (userId?) => {
        return SaleRepo.getHourlyRevenue(userId);
    },

    getDailyRevenue: async (userId?) => {
        return SaleRepo.getDailyRevenue(userId);
    },

    getMonthlyRevenue: async (userId?) => {
        return SaleRepo.getMonthlyRevenue(userId);
    },

    getPeakHours: async (userId?) => {
        return SaleRepo.getPeakHours(userId);
    },

    getItems: async (saleId) => {
        return SaleRepo.getItems(saleId);
    },

    clearStockError: () => set({ stockError: null }),
}));

/** Derived selector — computes cart total from current cart state */
export const selectCartTotal = (state: SaleStore) =>
    state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
