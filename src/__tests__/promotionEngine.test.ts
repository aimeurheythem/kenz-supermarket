/**
 * Unit Tests — promotionEngine
 *
 * Covers:
 *  - Price discount: percentage, fixed, max_discount cap, clamp to item total
 *  - Quantity discount: single cycle, multiple cycles, insufficient qty
 *  - Pack discount: single set, multiple sets, missing product
 *  - Most-beneficial selection when multiple promotions apply
 *  - Empty cart
 *  - No applicable promotions
 */

import { describe, it, expect } from 'vitest';
import type { CartItem, Product, Promotion } from '@/lib/types';
import { computeCartPromotions } from '../services/promotionEngine';

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 1,
        barcode: '000001',
        name: 'Widget',
        description: '',
        category_id: null,
        cost_price: 50,
        selling_price: 100,
        stock_quantity: 100,
        reorder_level: 5,
        unit: 'piece',
        image_url: '',
        is_active: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        ...overrides,
    };
}

function makeCartItem(productOverrides: Partial<Product> = {}, quantity = 1, discount = 0): CartItem {
    return {
        product: makeProduct(productOverrides),
        quantity,
        discount,
    };
}

const FUTURE = '2099-12-31';
const PAST = '2000-01-01';

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
    return {
        id: 1,
        name: 'Test Promo',
        type: 'price_discount',
        status: 'active',
        start_date: PAST,
        end_date: FUTURE,
        config: JSON.stringify({ discount_type: 'percentage', discount_value: 20, max_discount: null }),
        deleted_at: null as unknown as string,
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
        products: [{ id: 1, promotion_id: 1, product_id: 1, created_at: '2026-01-01' }],
        ...overrides,
    };
}

// ── Price Discount Tests ──────────────────────────────────────────────────

describe('computeCartPromotions — Price Discount', () => {
    it('applies percentage discount correctly', () => {
        const cart = [makeCartItem({ selling_price: 100 }, 2)];
        const promo = makePromotion({
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 20, max_discount: null }),
        });

        const result = computeCartPromotions(cart, [promo]);

        // 100 * 20% = 20/unit * 2 = 40
        expect(result.itemDiscounts).toHaveLength(1);
        expect(result.itemDiscounts[0].discountAmount).toBe(40);
        expect(result.totalSavings).toBe(40);
    });

    it('applies fixed discount correctly', () => {
        const cart = [makeCartItem({ selling_price: 100 }, 3)];
        const promo = makePromotion({
            config: JSON.stringify({ discount_type: 'fixed', discount_value: 15, max_discount: null }),
        });

        const result = computeCartPromotions(cart, [promo]);

        // 15 * 3 = 45
        expect(result.itemDiscounts[0].discountAmount).toBe(45);
    });

    it('clamps max_discount per unit on percentage discount', () => {
        const cart = [makeCartItem({ selling_price: 100 }, 2)];
        const promo = makePromotion({
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 50, max_discount: 20 }),
        });

        const result = computeCartPromotions(cart, [promo]);

        // 50% of 100 = 50, capped at 20 per unit → 20 * 2 = 40
        expect(result.itemDiscounts[0].discountAmount).toBe(40);
    });

    it('clamps discount to total item cost', () => {
        const cart = [makeCartItem({ selling_price: 10 }, 1)];
        const promo = makePromotion({
            config: JSON.stringify({ discount_type: 'fixed', discount_value: 50, max_discount: null }),
        });

        const result = computeCartPromotions(cart, [promo]);

        // Fixed 50 but item total is only 10 → clamp to 10
        expect(result.itemDiscounts[0].discountAmount).toBe(10);
    });

    it('returns no discount when promotion is inactive', () => {
        const cart = [makeCartItem()];
        const promo = makePromotion({ status: 'inactive' });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts).toHaveLength(0);
        expect(result.totalSavings).toBe(0);
    });

    it('returns no discount when promotion has expired', () => {
        const cart = [makeCartItem()];
        const promo = makePromotion({ end_date: '2000-01-01' });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts).toHaveLength(0);
    });

    it('returns no discount when promotion has not started', () => {
        const cart = [makeCartItem()];
        const promo = makePromotion({ start_date: '2099-01-01', end_date: '2099-12-31' });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts).toHaveLength(0);
    });
});

// ── Quantity Discount Tests ───────────────────────────────────────────────

describe('computeCartPromotions — Quantity Discount', () => {
    it('applies Buy X Get Y Free for a single cycle', () => {
        // Buy 2 Get 1 Free → 3 items: 1 free
        const cart = [makeCartItem({ selling_price: 50 }, 3)];
        const promo = makePromotion({
            type: 'quantity_discount',
            config: JSON.stringify({ buy_quantity: 2, free_quantity: 1 }),
        });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts[0].discountAmount).toBe(50); // 1 free item worth 50
        expect(result.itemDiscounts[0].freeQuantity).toBe(1);
    });

    it('applies multiple cycles correctly', () => {
        // Buy 2 Get 1 Free → 6 items: 2 full cycles → 2 free items
        const cart = [makeCartItem({ selling_price: 50 }, 6)];
        const promo = makePromotion({
            type: 'quantity_discount',
            config: JSON.stringify({ buy_quantity: 2, free_quantity: 1 }),
        });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts[0].discountAmount).toBe(100); // 2 free items * 50
        expect(result.itemDiscounts[0].freeQuantity).toBe(2);
    });

    it('gives no discount when quantity is insufficient for a cycle', () => {
        // Buy 3 Get 1 Free → only 2 items in cart → no full cycle
        const cart = [makeCartItem({ selling_price: 50 }, 2)];
        const promo = makePromotion({
            type: 'quantity_discount',
            config: JSON.stringify({ buy_quantity: 3, free_quantity: 1 }),
        });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts).toHaveLength(0);
        expect(result.totalSavings).toBe(0);
    });

    it('handles Buy 1 Get 1 Free with odd quantity', () => {
        // Buy 1 Get 1 Free → 5 items → 2 full cycles → 2 free
        const cart = [makeCartItem({ selling_price: 30 }, 5)];
        const promo = makePromotion({
            type: 'quantity_discount',
            config: JSON.stringify({ buy_quantity: 1, free_quantity: 1 }),
        });

        const result = computeCartPromotions(cart, [promo]);

        // floor(5/2) = 2 cycles → 2 free → discount = 2 * 30 = 60
        expect(result.itemDiscounts[0].discountAmount).toBe(60);
        expect(result.itemDiscounts[0].freeQuantity).toBe(2);
    });
});

// ── Pack Discount Tests ───────────────────────────────────────────────────

describe('computeCartPromotions — Pack Discount', () => {
    it('applies bundle price savings for a single set', () => {
        const cart = [
            makeCartItem({ id: 1, selling_price: 50 }, 1),
            makeCartItem({ id: 2, selling_price: 80, name: 'Widget 2' }, 1),
        ];
        const promo = makePromotion({
            id: 10,
            type: 'pack_discount',
            config: JSON.stringify({ bundle_price: 100 }),
            products: [
                { id: 1, promotion_id: 10, product_id: 1, created_at: '2026-01-01' },
                { id: 2, promotion_id: 10, product_id: 2, created_at: '2026-01-01' },
            ],
        });

        const result = computeCartPromotions(cart, [promo]);

        // Original: 50 + 80 = 130; Bundle: 100; Savings = 30
        expect(result.bundleDiscounts).toHaveLength(1);
        expect(result.bundleDiscounts[0].savings).toBe(30);
        expect(result.totalSavings).toBe(30);
    });

    it('scales savings for multiple sets', () => {
        const cart = [
            makeCartItem({ id: 1, selling_price: 50 }, 3),
            makeCartItem({ id: 2, selling_price: 80, name: 'Widget 2' }, 3),
        ];
        const promo = makePromotion({
            id: 10,
            type: 'pack_discount',
            config: JSON.stringify({ bundle_price: 100 }),
            products: [
                { id: 1, promotion_id: 10, product_id: 1, created_at: '2026-01-01' },
                { id: 2, promotion_id: 10, product_id: 2, created_at: '2026-01-01' },
            ],
        });

        const result = computeCartPromotions(cart, [promo]);

        // 3 sets × 30 savings = 90
        expect(result.bundleDiscounts[0].savings).toBe(90);
    });

    it('scales to min quantity when products have different quantities', () => {
        const cart = [
            makeCartItem({ id: 1, selling_price: 50 }, 5),
            makeCartItem({ id: 2, selling_price: 80, name: 'Widget 2' }, 2),
        ];
        const promo = makePromotion({
            id: 10,
            type: 'pack_discount',
            config: JSON.stringify({ bundle_price: 100 }),
            products: [
                { id: 1, promotion_id: 10, product_id: 1, created_at: '2026-01-01' },
                { id: 2, promotion_id: 10, product_id: 2, created_at: '2026-01-01' },
            ],
        });

        const result = computeCartPromotions(cart, [promo]);

        // min(5, 2) = 2 sets × 30 savings = 60
        expect(result.bundleDiscounts[0].savings).toBe(60);
    });

    it('returns no bundle discount when a required product is missing', () => {
        const cart = [makeCartItem({ id: 1, selling_price: 50 }, 1)];
        // Bundle requires products 1 AND 2, but cart only has product 1
        const promo = makePromotion({
            id: 10,
            type: 'pack_discount',
            config: JSON.stringify({ bundle_price: 100 }),
            products: [
                { id: 1, promotion_id: 10, product_id: 1, created_at: '2026-01-01' },
                { id: 2, promotion_id: 10, product_id: 2, created_at: '2026-01-01' },
            ],
        });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.bundleDiscounts).toHaveLength(0);
        expect(result.totalSavings).toBe(0);
    });
});

// ── Most-Beneficial Selection ─────────────────────────────────────────────

describe('computeCartPromotions — most-beneficial selection', () => {
    it('selects the promotion with the higher discount', () => {
        const cart = [makeCartItem({ selling_price: 100 }, 1)];
        const promo10 = makePromotion({
            id: 1,
            name: 'Promo 10%',
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 10, max_discount: null }),
        });
        const promo30 = makePromotion({
            id: 2,
            name: 'Promo 30%',
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 30, max_discount: null }),
        });

        const result = computeCartPromotions(cart, [promo10, promo30]);

        expect(result.itemDiscounts).toHaveLength(1);
        expect(result.itemDiscounts[0].promotionId).toBe(2);
        expect(result.itemDiscounts[0].discountAmount).toBe(30);
    });

    it('prefers fixed discount over percentage when fixed is higher', () => {
        const cart = [makeCartItem({ selling_price: 100 }, 1)];
        const promo20pct = makePromotion({
            id: 1,
            name: '20% off',
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 20, max_discount: null }),
        });
        const promo25fixed = makePromotion({
            id: 2,
            name: '$25 off',
            config: JSON.stringify({ discount_type: 'fixed', discount_value: 25, max_discount: null }),
        });

        const result = computeCartPromotions(cart, [promo20pct, promo25fixed]);

        expect(result.itemDiscounts[0].discountAmount).toBe(25);
        expect(result.itemDiscounts[0].promotionId).toBe(2);
    });
});

// ── Edge Cases ────────────────────────────────────────────────────────────

describe('computeCartPromotions — edge cases', () => {
    it('returns empty result for empty cart', () => {
        const result = computeCartPromotions([], [makePromotion()]);

        expect(result.itemDiscounts).toHaveLength(0);
        expect(result.bundleDiscounts).toHaveLength(0);
        expect(result.totalSavings).toBe(0);
    });

    it('returns empty result with no promotions', () => {
        const cart = [makeCartItem()];

        const result = computeCartPromotions(cart, []);

        expect(result.itemDiscounts).toHaveLength(0);
        expect(result.totalSavings).toBe(0);
    });

    it('does not apply promotion to a non-matching product', () => {
        const cart = [makeCartItem({ id: 99 })]; // product id 99
        const promo = makePromotion({
            products: [{ id: 1, promotion_id: 1, product_id: 1, created_at: '2026-01-01' }], // only for product 1
        });

        const result = computeCartPromotions(cart, [promo]);

        expect(result.itemDiscounts).toHaveLength(0);
    });

    it('totalSavings equals sum of item + bundle discounts', () => {
        const cart = [
            makeCartItem({ id: 1, selling_price: 100 }, 1),
            makeCartItem({ id: 2, selling_price: 80, name: 'Product 2' }, 1),
        ];
        const pricePromo = makePromotion({
            id: 1,
            type: 'price_discount',
            config: JSON.stringify({ discount_type: 'percentage', discount_value: 10, max_discount: null }),
            products: [{ id: 1, promotion_id: 1, product_id: 1, created_at: '2026-01-01' }],
        });

        const result = computeCartPromotions(cart, [pricePromo]);

        const manualTotal = result.itemDiscounts.reduce((s, d) => s + d.discountAmount, 0)
            + result.bundleDiscounts.reduce((s, b) => s + b.savings, 0);
        expect(result.totalSavings).toBe(manualTotal);
    });
});
