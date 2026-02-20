/**
 * Unit Tests — SaleRepo
 *
 * Covers:
 *  - createFromCart() — stock is decremented, sale items created, totals correct
 *  - createFromCart() — transaction rolls back on error
 *  - createFromCart() — credit sale updates customer debt
 *  - createFromCart() — rejects insufficient stock
 *  - refundSale() / voidSale() — stock restored, status updated
 *
 * Note: SaleRepo.getById() calls get(), getItems() calls query().
 * createFromCart() uses get() for stock checks AND for the final getById().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem, Product, Sale, SaleItem } from '../../src/lib/types';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('../db', () => ({
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    executeNoSave: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    lastInsertId: vi.fn().mockResolvedValue(1),
    triggerSave: vi.fn(),
}));

vi.mock('../repositories/audit-log.repo', () => ({
    AuditLogRepo: { log: vi.fn() },
}));

import { query, executeNoSave, get, lastInsertId, triggerSave } from '../db';
import { SaleRepo } from '../repositories/sale.repo';

const mockQuery = vi.mocked(query);
const mockExecuteNoSave = vi.mocked(executeNoSave);
const mockGet = vi.mocked(get);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockTriggerSave = vi.mocked(triggerSave);

// ── Fixtures ─────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 1,
        barcode: '123456',
        name: 'Test Product',
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
        ...overrides,
    };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
    return {
        product: makeProduct(),
        quantity: 2,
        discount: 0,
        ...overrides,
    };
}

const CREATED_SALE: Sale = {
    id: 1,
    user_id: 1,
    session_id: 1,
    customer_id: null,
    sale_date: '2026-01-15 10:00:00',
    subtotal: 200,
    tax_amount: 0,
    discount_amount: 0,
    total: 200,
    payment_method: 'cash',
    customer_name: 'Walk-in Customer',
    status: 'completed',
    created_at: '2026-01-15 10:00:00',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('SaleRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── createFromCart() ────────────────────────────────────────

    describe('createFromCart()', () => {
        it('creates a sale with correct totals', async () => {
            const cart = [
                makeCartItem({ product: makeProduct({ id: 1, selling_price: 100 }), quantity: 2, discount: 10 }),
                makeCartItem({ product: makeProduct({ id: 2, selling_price: 50 }), quantity: 3, discount: 0 }),
            ];

            mockLastInsertId.mockResolvedValueOnce(42);
            // get() calls: stock check product 1, stock check product 2, getById(42)
            mockGet
                .mockResolvedValueOnce({ stock_quantity: 20, name: 'Product 1' } as never)
                .mockResolvedValueOnce({ stock_quantity: 30, name: 'Product 2' } as never)
                .mockResolvedValueOnce({ ...CREATED_SALE, id: 42 } as never); // getById

            const result = await SaleRepo.createFromCart(cart, { method: 'cash' }, 1, 1);

            expect(mockExecuteNoSave).toHaveBeenCalledWith('BEGIN TRANSACTION;');

            // subtotal = (100*2 - 10) + (50*3 - 0) = 190 + 150 = 340
            expect(mockExecuteNoSave).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sales'),
                expect.arrayContaining([340]),
            );

            expect(mockExecuteNoSave).toHaveBeenCalledWith('COMMIT;');
            expect(mockTriggerSave).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.id).toBe(42);
        });

        it('decrements stock for each cart item', async () => {
            const cart = [makeCartItem({ product: makeProduct({ id: 5 }), quantity: 3 })];

            mockLastInsertId.mockResolvedValueOnce(1);
            mockGet
                .mockResolvedValueOnce({ stock_quantity: 10, name: 'Product' } as never) // stock check
                .mockResolvedValueOnce(CREATED_SALE as never); // getById

            await SaleRepo.createFromCart(cart, { method: 'cash' }, 1);

            const stockUpdateCall = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?)'),
            );
            expect(stockUpdateCall).toBeDefined();
            expect(stockUpdateCall![1]).toEqual(expect.arrayContaining([3, 5]));
        });

        it('creates sale items for each cart item', async () => {
            const cart = [
                makeCartItem({ product: makeProduct({ id: 1, selling_price: 100, name: 'Test Product' }), quantity: 2, discount: 5 }),
            ];

            mockLastInsertId.mockResolvedValueOnce(10);
            mockGet
                .mockResolvedValueOnce({ stock_quantity: 20, name: 'Test Product' } as never)
                .mockResolvedValueOnce(CREATED_SALE as never);

            await SaleRepo.createFromCart(cart, { method: 'cash' }, 1);

            const saleItemInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO sale_items'),
            );
            expect(saleItemInsert).toBeDefined();
            // itemTotal = 100 * 2 - 5 = 195
            expect(saleItemInsert![1]).toEqual(expect.arrayContaining([10, 1, 'Test Product', 2, 100, 5, 195]));
        });

        it('creates stock movement records', async () => {
            const cart = [makeCartItem({ product: makeProduct({ id: 3 }), quantity: 2 })];

            mockLastInsertId.mockResolvedValueOnce(7);
            mockGet
                .mockResolvedValueOnce({ stock_quantity: 15, name: 'Product' } as never)
                .mockResolvedValueOnce(CREATED_SALE as never);

            await SaleRepo.createFromCart(cart, { method: 'cash' });

            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            expect(movementInsert).toBeDefined();
            expect(movementInsert![1]).toEqual(expect.arrayContaining([3, 2, 15, 13]));
        });

        it('rolls back transaction on error', async () => {
            const cart = [makeCartItem()];

            mockLastInsertId.mockResolvedValueOnce(1);
            // Stock check throws
            mockGet.mockRejectedValueOnce(new Error('DB error'));

            await expect(SaleRepo.createFromCart(cart, { method: 'cash' })).rejects.toThrow('DB error');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
            expect(mockTriggerSave).not.toHaveBeenCalled();
        });

        it('rejects when stock is insufficient', async () => {
            const cart = [makeCartItem({ product: makeProduct({ id: 1, name: 'Widget' }), quantity: 10 })];

            mockLastInsertId.mockResolvedValueOnce(1);
            mockGet.mockResolvedValueOnce({ stock_quantity: 3, name: 'Widget' } as never);

            await expect(SaleRepo.createFromCart(cart, { method: 'cash' })).rejects.toThrow(
                /Insufficient stock for "Widget"/,
            );

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
        });

        it('updates customer debt for credit sales', async () => {
            const cart = [makeCartItem({ product: makeProduct({ selling_price: 100 }), quantity: 1, discount: 0 })];

            mockLastInsertId.mockResolvedValueOnce(5);
            // get() calls: 1) customer balance after atomic update, 2) stock check, 3) getById
            mockGet
                .mockResolvedValueOnce({ total_debt: 200 } as never) // customer balance query
                .mockResolvedValueOnce({ stock_quantity: 50, name: 'Product' } as never) // stock check
                .mockResolvedValueOnce(CREATED_SALE as never); // getById

            await SaleRepo.createFromCart(
                cart,
                { method: 'credit', customer_id: 10, customer_name: 'John Doe' },
                1,
            );

            const debtUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' && call[0].includes('UPDATE customers SET total_debt = total_debt + ?'),
            );
            expect(debtUpdate).toBeDefined();
            expect(debtUpdate![1]).toEqual(expect.arrayContaining([100, 10]));

            const txInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO customer_transactions'),
            );
            expect(txInsert).toBeDefined();
        });

        it('throws when credit sale has no customer_id', async () => {
            const cart = [makeCartItem()];
            mockLastInsertId.mockResolvedValueOnce(1);

            await expect(
                SaleRepo.createFromCart(cart, { method: 'credit' }),
            ).rejects.toThrow('Credit sales require a linked customer');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
        });

        it('applies tax and discount correctly', async () => {
            const cart = [
                makeCartItem({ product: makeProduct({ selling_price: 200 }), quantity: 1, discount: 0 }),
            ];

            mockLastInsertId.mockResolvedValueOnce(1);
            mockGet
                .mockResolvedValueOnce({ stock_quantity: 10, name: 'Product' } as never) // stock check
                .mockResolvedValueOnce(CREATED_SALE as never); // getById

            await SaleRepo.createFromCart(
                cart,
                { method: 'cash', tax_rate: 0.1, discount: 20 },
                1,
            );

            const saleInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO sales'),
            );
            expect(saleInsert).toBeDefined();
            const params = saleInsert![1] as unknown[];
            // params: [userId, sessionId, customerId, subtotal, taxAmount, discountAmount, total, ...]
            expect(params[3]).toBe(200); // subtotal
            expect(params[4]).toBe(20);  // taxAmount = 200 * 0.1
            expect(params[5]).toBe(20);  // discountAmount
            expect(params[6]).toBe(200); // total = 200 + 20 - 20
        });
    });

    // ─── refundSale() ────────────────────────────────────────────

    describe('refundSale()', () => {
        it('restores stock and marks sale as refunded', async () => {
            // getById → get()
            mockGet.mockResolvedValueOnce({ ...CREATED_SALE, id: 5, status: 'completed' } as never);
            // getItems → query()
            mockQuery.mockResolvedValueOnce([
                { id: 1, sale_id: 5, product_id: 10, quantity: 3, unit_price: 100, discount: 0, total: 300 },
            ] as SaleItem[]);
            // Stock query for product → get()
            mockGet.mockResolvedValueOnce({ stock_quantity: 7 } as never);

            await SaleRepo.refundSale(5, 'Customer Return');

            // Verify status update to 'refunded'
            const statusUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE sales SET status') &&
                    (call[1] as unknown[])?.includes('refunded'),
            );
            expect(statusUpdate).toBeDefined();

            // Verify atomic stock restoration
            const stockRestore = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('stock_quantity = stock_quantity + ?'),
            );
            expect(stockRestore).toBeDefined();
            expect(stockRestore![1]).toEqual(expect.arrayContaining([3, 10]));

            // Verify stock movement
            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            expect(movementInsert).toBeDefined();

            expect(mockExecuteNoSave).toHaveBeenCalledWith('COMMIT;');
            expect(mockTriggerSave).toHaveBeenCalled();
        });

        it('throws when sale is already refunded', async () => {
            mockGet.mockResolvedValueOnce({ ...CREATED_SALE, status: 'refunded' } as never);

            await expect(SaleRepo.refundSale(1)).rejects.toThrow('already refunded');
        });

        it('throws when sale not found', async () => {
            // get() returns undefined by default
            await expect(SaleRepo.refundSale(999)).rejects.toThrow('not found');
        });
    });

    // ─── voidSale() ──────────────────────────────────────────────

    describe('voidSale()', () => {
        it('marks sale as voided and restores stock', async () => {
            mockGet.mockResolvedValueOnce({ ...CREATED_SALE, id: 3 } as never);
            mockQuery.mockResolvedValueOnce([
                { id: 1, sale_id: 3, product_id: 7, quantity: 1, unit_price: 50, discount: 0, total: 50 },
            ]);
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await SaleRepo.voidSale(3, 'Accidental entry');

            const statusUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE sales SET status') &&
                    (call[1] as unknown[])?.includes('voided'),
            );
            expect(statusUpdate).toBeDefined();
        });

        it('rolls back on error during void', async () => {
            mockGet.mockResolvedValueOnce({ ...CREATED_SALE, id: 3 } as never);
            mockQuery.mockResolvedValueOnce([
                { id: 1, sale_id: 3, product_id: 7, quantity: 1 },
            ]);
            mockGet.mockResolvedValueOnce({ stock_quantity: 5 } as never);

            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockResolvedValueOnce(undefined) // UPDATE sales SET status
                .mockRejectedValueOnce(new Error('Stock update failed')); // UPDATE products

            await expect(SaleRepo.voidSale(3)).rejects.toThrow('Stock update failed');
            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
        });
    });
});
