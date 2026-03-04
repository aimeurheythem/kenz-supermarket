import { create } from 'zustand';
import type { Sale, CartItem, PromotionApplicationResult, ManualDiscount, PaymentEntryInput, ReturnRequest } from '@/lib/types';
import { SaleRepo } from '../../database/repositories/sale.repo';
import { ProductRepo } from '../../database/repositories/product.repo';
import { PromotionRepo } from '../../database/repositories/promotion.repo';
import { computeCartPromotions } from '@/services/promotionEngine';

interface SaleStore {
    sales: Sale[];
    recentSales: Sale[];
    todayStats: { revenue: number; orders: number; profit: number };
    cart: CartItem[];
    cartDiscount: ManualDiscount | null;
    promotionResult: PromotionApplicationResult | null;
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

    // Manual discounts
    setItemManualDiscount: (productId: number, discount: ManualDiscount) => void;
    clearItemManualDiscount: (productId: number) => void;
    setCartDiscount: (discount: ManualDiscount) => void;
    clearCartDiscount: () => void;

    // Split payment checkout
    checkoutWithSplitPayment: (
        entries: PaymentEntryInput[],
        customer: { name: string; id?: number },
        userId?: number,
        sessionId?: number,
    ) => Promise<Sale>;

    // Returns
    processReturn: (request: ReturnRequest) => Promise<Sale>;
}

export const useSaleStore = create<SaleStore>((set, get) => {
    /** Recompute active promotions against current cart and persist the result in state. */
    const recomputePromotions = async () => {
        const { cart } = get();
        if (cart.length === 0) {
            set({ promotionResult: null });
            return;
        }
        try {
            const activePromotions = await PromotionRepo.getActiveForCheckout();
            const result = computeCartPromotions(cart, activePromotions);
            set({ promotionResult: result });
        } catch {
            // Non-critical — silently ignore if promotions unavailable
            set({ promotionResult: null });
        }
    };

    return {
    sales: [],
    recentSales: [],
    todayStats: { revenue: 0, orders: 0, profit: 0 },
    cart: [],
    cartDiscount: null,
    promotionResult: null,
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
        await recomputePromotions();
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
        await recomputePromotions();
    },

    removeFromCart: (productId: number) => {
        set({ cart: get().cart.filter((c) => c.product.id !== productId) });
        recomputePromotions();
    },

    clearCart: () => set({ cart: [], promotionResult: null }),

    checkout: async (payment, userId, sessionId) => {
        const { cart, promotionResult } = get();
        if (cart.length === 0) throw new Error('Cart is empty');

        try {
            set({ isLoading: true, error: null });
            const sale = await SaleRepo.createFromCart(cart, payment, userId, sessionId, promotionResult ?? undefined);
            set({ cart: [], promotionResult: null });
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

    // Manual discounts
    setItemManualDiscount: (productId, discount) => {
        const { cart } = get();
        set({
            cart: cart.map((c) =>
                c.product.id === productId ? { ...c, manualDiscount: discount } : c,
            ),
        });
    },

    clearItemManualDiscount: (productId) => {
        const { cart } = get();
        set({
            cart: cart.map((c) =>
                c.product.id === productId ? { ...c, manualDiscount: undefined } : c,
            ),
        });
    },

    setCartDiscount: (discount) => set({ cartDiscount: discount }),
    clearCartDiscount: () => set({ cartDiscount: null }),

    // Split payment checkout
    checkoutWithSplitPayment: async (entries, customer, userId, sessionId) => {
        const { cart, promotionResult, cartDiscount } = get();
        if (cart.length === 0) throw new Error('Cart is empty');

        try {
            set({ isLoading: true, error: null });
            const sale = await SaleRepo.createFromCartWithSplitPayment(
                cart,
                entries,
                customer,
                userId,
                sessionId,
                promotionResult ?? undefined,
                cartDiscount ?? undefined,
            );
            set({ cart: [], cartDiscount: null, promotionResult: null });
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

    // Returns
    processReturn: async (request) => {
        try {
            set({ isLoading: true, error: null });
            const returnSale = await SaleRepo.createPartialReturn(request);
            await get().loadSales();
            await get().loadRecent();
            await get().loadTodayStats();
            return returnSale;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        } finally {
            set({ isLoading: false });
        }
    },
    };
});

/** Derived selector — computes cart total from current cart state (before promotions) */
export const selectCartTotal = (state: SaleStore) =>
    state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);

/** Derived selector — computes cart total after promotion savings are applied */
export const selectCartTotalWithPromotions = (state: SaleStore) => {
    const base = state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
    return base - (state.promotionResult?.totalSavings ?? 0);
};

/** Derived selector — computes manual discount amount from cart items + cart-level discount */
export const selectManualDiscountTotal = (state: SaleStore) => {
    // Sum item-level manual discounts
    const itemDiscounts = state.cart.reduce((sum, item) => {
        if (!item.manualDiscount) return sum;
        const lineTotal = item.product.selling_price * item.quantity;
        return sum + (item.manualDiscount.type === 'percentage'
            ? lineTotal * (item.manualDiscount.value / 100)
            : item.manualDiscount.value);
    }, 0);

    // Cart-level discount
    const subtotal = state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity - item.discount, 0);
    const cartDisc = state.cartDiscount
        ? state.cartDiscount.type === 'percentage'
            ? subtotal * (state.cartDiscount.value / 100)
            : state.cartDiscount.value
        : 0;

    return itemDiscounts + cartDisc;
};

/** Derived selector — grand total after all discounts (promo + manual) + VAT */
export const selectGrandTotal = (vatRate: number) => (state: SaleStore) => {
    const subtotal = selectCartTotal(state);
    const promoSavings = state.promotionResult?.totalSavings ?? 0;
    const manualDiscount = selectManualDiscountTotal(state);
    const afterDiscounts = subtotal - promoSavings - manualDiscount;
    return afterDiscounts + afterDiscounts * vatRate;
};
