/**
 * Unit Tests — useSaleStore
 *
 * Covers:
 *  - checkout() — clears cart on success, sets error on failure, toggles isLoading
 *  - addToCart() — new item, existing item merge, stock limit, discount clamping
 *  - updateCartItem() — quantity update, removal at 0, stock limit
 *  - removeFromCart(), clearCart()
 *  - selectCartTotal — derived selector
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { Product, Sale, CartItem } from '@/lib/types';

// ── Mock Repos (vi.hoisted so they're available in vi.mock factories) ─

const { mockSaleRepo, mockProductRepo } = vi.hoisted(() => ({
    mockSaleRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getRecentSales: vi.fn().mockResolvedValue([]),
        getTodayStats: vi.fn().mockResolvedValue({ revenue: 0, orders: 0, profit: 0 }),
        createFromCart: vi.fn(),
        getItems: vi.fn().mockResolvedValue([]),
        getTopProductsByProfit: vi.fn().mockResolvedValue([]),
        getHourlyRevenue: vi.fn().mockResolvedValue([]),
        getDailyRevenue: vi.fn().mockResolvedValue([]),
        getMonthlyRevenue: vi.fn().mockResolvedValue([]),
        getPeakHours: vi.fn().mockResolvedValue([]),
    },
    mockProductRepo: {
        getById: vi.fn(),
        getAll: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getByBarcode: vi.fn(),
    },
}));

vi.mock('../../database/repositories/sale.repo', () => ({
    SaleRepo: mockSaleRepo,
}));

vi.mock('../../database/repositories/product.repo', () => ({
    ProductRepo: mockProductRepo,
}));

import { useSaleStore, selectCartTotal } from '../stores/useSaleStore';

// ── Fixtures ─────────────────────────────────────────────────────────

const PRODUCT: Product = {
    id: 1,
    barcode: '123456',
    name: 'Widget',
    description: '',
    category_id: 1,
    cost_price: 50,
    selling_price: 100,
    stock_quantity: 20,
    reorder_level: 5,
    unit: 'piece',
    image_url: '',
    is_active: 1,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
};

const PRODUCT_B: Product = {
    ...PRODUCT,
    id: 2,
    name: 'Gadget',
    selling_price: 200,
};

const CART_ITEM: CartItem = {
    product: PRODUCT,
    quantity: 2,
    discount: 0,
};

const SALE: Sale = {
    id: 10,
    user_id: 1,
    session_id: 1,
    customer_id: null,
    sale_date: '2026-01-15',
    subtotal: 200,
    tax_amount: 0,
    discount_amount: 0,
    total: 200,
    payment_method: 'cash',
    customer_name: '',
    status: 'completed',
    created_at: '2026-01-15',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('useSaleStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the store to initial state
        useSaleStore.setState({
            sales: [],
            recentSales: [],
            todayStats: { revenue: 0, orders: 0, profit: 0 },
            cart: [],
            isLoading: false,
            error: null,
            stockError: null,
        });
    });

    // ─── checkout() ──────────────────────────────────────────────

    describe('checkout()', () => {
        it('clears cart on successful checkout', async () => {
            mockSaleRepo.createFromCart.mockResolvedValueOnce(SALE);
            useSaleStore.setState({ cart: [CART_ITEM] });

            await act(async () => {
                await useSaleStore.getState().checkout({ method: 'cash' }, 1, 1);
            });

            expect(useSaleStore.getState().cart).toEqual([]);
        });

        it('returns the created sale', async () => {
            mockSaleRepo.createFromCart.mockResolvedValueOnce(SALE);
            useSaleStore.setState({ cart: [CART_ITEM] });

            let result: Sale | undefined;
            await act(async () => {
                result = await useSaleStore.getState().checkout({ method: 'cash' });
            });

            expect(result).toEqual(SALE);
        });

        it('sets isLoading during checkout', async () => {
            let loadingDuringCheckout = false;
            mockSaleRepo.createFromCart.mockImplementationOnce(() => {
                loadingDuringCheckout = useSaleStore.getState().isLoading;
                return Promise.resolve(SALE);
            });
            useSaleStore.setState({ cart: [CART_ITEM] });

            await act(async () => {
                await useSaleStore.getState().checkout({ method: 'cash' });
            });

            expect(loadingDuringCheckout).toBe(true);
            expect(useSaleStore.getState().isLoading).toBe(false);
        });

        it('sets error and re-throws on failure', async () => {
            mockSaleRepo.createFromCart.mockRejectedValueOnce(new Error('Checkout failed'));
            useSaleStore.setState({ cart: [CART_ITEM] });

            await expect(
                act(async () => {
                    await useSaleStore.getState().checkout({ method: 'cash' });
                }),
            ).rejects.toThrow('Checkout failed');

            expect(useSaleStore.getState().error).toBe('Checkout failed');
            expect(useSaleStore.getState().isLoading).toBe(false);
        });

        it('does NOT clear cart on failure', async () => {
            mockSaleRepo.createFromCart.mockRejectedValueOnce(new Error('DB error'));
            useSaleStore.setState({ cart: [CART_ITEM] });

            try {
                await act(async () => {
                    await useSaleStore.getState().checkout({ method: 'cash' });
                });
            } catch {
                // expected
            }

            expect(useSaleStore.getState().cart).toHaveLength(1);
        });

        it('throws when cart is empty', async () => {
            await expect(
                act(async () => {
                    await useSaleStore.getState().checkout({ method: 'cash' });
                }),
            ).rejects.toThrow('Cart is empty');
        });

        it('reloads sales, recent, and today stats after checkout', async () => {
            mockSaleRepo.createFromCart.mockResolvedValueOnce(SALE);
            useSaleStore.setState({ cart: [CART_ITEM] });

            await act(async () => {
                await useSaleStore.getState().checkout({ method: 'cash' });
            });

            expect(mockSaleRepo.getAll).toHaveBeenCalled();
            expect(mockSaleRepo.getRecentSales).toHaveBeenCalledWith(10);
            expect(mockSaleRepo.getTodayStats).toHaveBeenCalled();
        });
    });

    // ─── addToCart() ─────────────────────────────────────────────

    describe('addToCart()', () => {
        it('adds a new item to the cart', async () => {
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                await useSaleStore.getState().addToCart(CART_ITEM);
            });

            const { cart } = useSaleStore.getState();
            expect(cart).toHaveLength(1);
            expect(cart[0].product.id).toBe(1);
            expect(cart[0].quantity).toBe(2);
        });

        it('merges quantity for existing product', async () => {
            useSaleStore.setState({
                cart: [{ product: PRODUCT, quantity: 3, discount: 0 }],
            });
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                await useSaleStore.getState().addToCart({ product: PRODUCT, quantity: 2, discount: 0 });
            });

            const { cart } = useSaleStore.getState();
            expect(cart).toHaveLength(1);
            expect(cart[0].quantity).toBe(5); // 3 + 2
        });

        it('rejects when quantity exceeds fresh stock', async () => {
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 3 });

            await act(async () => {
                await useSaleStore.getState().addToCart({ product: PRODUCT, quantity: 5, discount: 0 });
            });

            expect(useSaleStore.getState().cart).toHaveLength(0);
            expect(useSaleStore.getState().stockError).toEqual({
                productName: 'Widget',
                available: 3,
            });
        });

        it('rejects when cumulative quantity exceeds stock', async () => {
            useSaleStore.setState({
                cart: [{ product: PRODUCT, quantity: 18, discount: 0 }],
            });
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                await useSaleStore.getState().addToCart({ product: PRODUCT, quantity: 5, discount: 0 });
            });

            // Cart should remain unchanged — 18, not 23
            expect(useSaleStore.getState().cart[0].quantity).toBe(18);
            expect(useSaleStore.getState().stockError).toBeDefined();
        });

        it('clamps discount to item total', async () => {
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                // discount 500 exceeds 2 * 100 = 200 → clamped to 200
                await useSaleStore.getState().addToCart({ product: PRODUCT, quantity: 2, discount: 500 });
            });

            const { cart } = useSaleStore.getState();
            expect(cart[0].discount).toBe(200);
        });
    });

    // ─── updateCartItem() ────────────────────────────────────────

    describe('updateCartItem()', () => {
        it('updates quantity for an existing item', async () => {
            useSaleStore.setState({ cart: [CART_ITEM] });
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                await useSaleStore.getState().updateCartItem(1, 5);
            });

            expect(useSaleStore.getState().cart[0].quantity).toBe(5);
        });

        it('removes item when quantity is 0', async () => {
            useSaleStore.setState({ cart: [CART_ITEM] });
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 20 });

            await act(async () => {
                await useSaleStore.getState().updateCartItem(1, 0);
            });

            expect(useSaleStore.getState().cart).toHaveLength(0);
        });

        it('rejects when new quantity exceeds stock', async () => {
            useSaleStore.setState({ cart: [CART_ITEM] });
            mockProductRepo.getById.mockResolvedValueOnce({ ...PRODUCT, stock_quantity: 3 });

            await act(async () => {
                await useSaleStore.getState().updateCartItem(1, 10);
            });

            // Unchanged
            expect(useSaleStore.getState().cart[0].quantity).toBe(2);
            expect(useSaleStore.getState().stockError).toEqual({
                productName: 'Widget',
                available: 3,
            });
        });

        it('no-ops for non-existent product in cart', async () => {
            useSaleStore.setState({ cart: [CART_ITEM] });

            await act(async () => {
                await useSaleStore.getState().updateCartItem(999, 5);
            });

            expect(useSaleStore.getState().cart).toHaveLength(1);
            expect(mockProductRepo.getById).not.toHaveBeenCalled();
        });
    });

    // ─── removeFromCart() / clearCart() ──────────────────────────

    describe('removeFromCart()', () => {
        it('removes the specified product from cart', () => {
            useSaleStore.setState({
                cart: [
                    { product: PRODUCT, quantity: 2, discount: 0 },
                    { product: PRODUCT_B, quantity: 1, discount: 0 },
                ],
            });

            act(() => {
                useSaleStore.getState().removeFromCart(1);
            });

            const { cart } = useSaleStore.getState();
            expect(cart).toHaveLength(1);
            expect(cart[0].product.id).toBe(2);
        });
    });

    describe('clearCart()', () => {
        it('empties the cart', () => {
            useSaleStore.setState({ cart: [CART_ITEM] });

            act(() => {
                useSaleStore.getState().clearCart();
            });

            expect(useSaleStore.getState().cart).toEqual([]);
        });
    });

    // ─── selectCartTotal ─────────────────────────────────────────

    describe('selectCartTotal', () => {
        it('computes total from price × quantity − discount', () => {
            const state = {
                ...useSaleStore.getState(),
                cart: [
                    { product: PRODUCT, quantity: 3, discount: 50 },   // 3×100 − 50 = 250
                    { product: PRODUCT_B, quantity: 1, discount: 0 },  // 1×200 − 0  = 200
                ],
            };

            expect(selectCartTotal(state as any)).toBe(450);
        });

        it('returns 0 for empty cart', () => {
            expect(selectCartTotal(useSaleStore.getState() as any)).toBe(0);
        });
    });

    // ─── clearError / clearStockError ────────────────────────────

    describe('error helpers', () => {
        it('clearError() resets error to null', () => {
            useSaleStore.setState({ error: 'something broke' });

            act(() => {
                useSaleStore.getState().clearError();
            });

            expect(useSaleStore.getState().error).toBeNull();
        });

        it('clearStockError() resets stockError to null', () => {
            useSaleStore.setState({ stockError: { productName: 'X', available: 0 } });

            act(() => {
                useSaleStore.getState().clearStockError();
            });

            expect(useSaleStore.getState().stockError).toBeNull();
        });
    });
});
