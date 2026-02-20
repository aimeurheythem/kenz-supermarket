/**
 * Integration Tests — Critical Flows
 *
 * These tests exercise **real repo logic** (SaleRepo, PurchaseRepo,
 * CustomerRepo) against a **mocked DB layer** (../db).  The mocked DB
 * keeps a simple in-memory product/customer/sale "database" so we can
 * verify that multi-step flows produce correct cumulative state changes
 * (e.g. stock before sale → stock after sale → stock after refund).
 *
 * Flows tested:
 *  1. Full POS: add to cart → checkout → sale created + stock decremented
 *  2. Credit sale: checkout on credit → customer debt updated
 *  3. Purchase receive: create PO → receive → stock increased
 *  4. Refund: complete sale → refund → stock restored + status updated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Product, Sale, SaleItem, Customer, PurchaseOrder, PurchaseOrderItem } from '../../src/lib/types';

// ─── In-memory "database" ────────────────────────────────────────────

/** Minimal in-memory store that the mock DB functions reference. */
let products: Record<number, { stock_quantity: number; name: string; cost_price: number }>;
let customers: Record<number, { total_debt: number; full_name: string }>;
let sales: Record<number, Sale>;
let saleItems: Record<number, SaleItem[]>;
let purchaseOrders: Record<number, PurchaseOrder>;
let purchaseOrderItems: Record<number, PurchaseOrderItem[]>;
let nextId: number;

function resetDB() {
    products = {
        1: { stock_quantity: 50, name: 'Widget A', cost_price: 40 },
        2: { stock_quantity: 30, name: 'Widget B', cost_price: 60 },
    };
    customers = {
        10: { total_debt: 200, full_name: 'John Doe' },
    };
    sales = {};
    saleItems = {};
    purchaseOrders = {};
    purchaseOrderItems = {};
    nextId = 1;
}

// ─── Mock ../db ──────────────────────────────────────────────────────

vi.mock('../db', () => ({
    query: vi.fn(),
    execute: vi.fn(),
    executeNoSave: vi.fn(),
    get: vi.fn(),
    lastInsertId: vi.fn(),
    triggerSave: vi.fn(),
}));

vi.mock('../repositories/audit-log.repo', () => ({
    AuditLogRepo: { log: vi.fn() },
}));

import { query, execute, executeNoSave, get, lastInsertId, triggerSave } from '../db';
import { SaleRepo } from '../repositories/sale.repo';
import { PurchaseRepo } from '../repositories/purchase.repo';
import { CustomerRepo } from '../repositories/customer.repo';

const mockQuery = vi.mocked(query);
const mockExecute = vi.mocked(execute);
const mockExecuteNoSave = vi.mocked(executeNoSave);
const mockGet = vi.mocked(get);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockTriggerSave = vi.mocked(triggerSave);

// ─── Helpers ─────────────────────────────────────────────────────────

/** Wire up mock DB functions so they interact with the in-memory store. */
function wireDB() {
    // executeNoSave: intercept UPDATEs to products / customers + pass-through for DDL
    mockExecuteNoSave.mockImplementation(async (sql: string, params?: unknown[]) => {
        const s = sql.trim();

        // Product stock decrement (sale)
        if (s.includes('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?)')) {
            const qty = params![0] as number;
            const id = params![1] as number;
            products[id].stock_quantity = Math.max(0, products[id].stock_quantity - qty);
            return;
        }

        // Product stock increment (purchase receive / refund)
        if (
            s.includes('UPDATE products') &&
            s.includes('stock_quantity = stock_quantity + ?') &&
            !s.includes('cost_price')
        ) {
            const qty = params![0] as number;
            const id = params![1] as number;
            products[id].stock_quantity += qty;
            return;
        }

        // Purchase receive — stock + cost update
        if (s.includes('UPDATE products') && s.includes('stock_quantity = stock_quantity + ?') && s.includes('cost_price')) {
            const qty = params![0] as number;
            const costPrice = params![1] as number;
            const id = params![2] as number;
            products[id].stock_quantity += qty;
            products[id].cost_price = costPrice;
            return;
        }

        // Product stock set exact (adjust)
        if (s.includes('UPDATE products SET stock_quantity = ?')) {
            const qty = params![0] as number;
            const id = params![1] as number;
            products[id].stock_quantity = qty;
            return;
        }

        // Customer debt atomic increment
        if (s.includes('UPDATE customers SET total_debt = total_debt + ?')) {
            const delta = params![0] as number;
            const id = params![1] as number;
            customers[id].total_debt += delta;
            return;
        }

        // Sale status update
        if (s.includes('UPDATE sales SET status')) {
            const status = params![0] as string;
            const saleId = params![1] as number;
            if (sales[saleId]) sales[saleId].status = status as Sale['status'];
            return;
        }

        // PO status update to received
        if (s.includes("UPDATE purchase_orders SET status = 'received'")) {
            const poId = params![0] as number;
            if (purchaseOrders[poId]) purchaseOrders[poId].status = 'received';
            return;
        }

        // Everything else (BEGIN, COMMIT, INSERT, etc.) — just passthrough
        return;
    });

    // get: return product or customer row on demand
    mockGet.mockImplementation(async (sql: string, params?: unknown[]) => {
        const s = sql.trim();

        if (s.includes('FROM products') && params?.length) {
            const id = params[0] as number;
            const p = products[id];
            if (!p) return undefined as any;
            return { stock_quantity: p.stock_quantity, name: p.name } as any;
        }

        if (s.includes('FROM customers') && params?.length) {
            const id = params[0] as number;
            const c = customers[id];
            if (!c) return undefined as any;
            return { total_debt: c.total_debt, full_name: c.full_name, id } as any;
        }

        // SaleRepo.getById → via get()
        if (s.includes('FROM sales') && s.includes('WHERE s.id = ?')) {
            const id = params![0] as number;
            return sales[id] as any;
        }

        return undefined as any;
    });

    // query: used by PurchaseRepo.getById, getItems, SaleRepo.getItems
    mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
        const s = sql.trim();

        if (s.includes('FROM purchase_orders') && s.includes('WHERE po.id = ?')) {
            const id = params![0] as number;
            const po = purchaseOrders[id];
            return po ? [po] : ([] as any);
        }

        if (s.includes('FROM purchase_order_items') && s.includes('WHERE poi.purchase_order_id = ?')) {
            const poId = params![0] as number;
            return (purchaseOrderItems[poId] || []) as any;
        }

        if (s.includes('FROM sale_items') && s.includes('WHERE sale_id = ?')) {
            const saleId = params![0] as number;
            return (saleItems[saleId] || []) as any;
        }

        return [] as any;
    });

    // execute: passthrough
    mockExecute.mockResolvedValue(undefined as any);

    // lastInsertId: auto-increment
    mockLastInsertId.mockImplementation(async () => nextId++);

    // triggerSave: no-op
    mockTriggerSave.mockImplementation(() => {});
}

// ─── Test product fixture ────────────────────────────────────────────

function makeProduct(id: number): Product {
    const p = products[id];
    return {
        id,
        barcode: `BAR${id}`,
        name: p.name,
        description: '',
        category_id: 1,
        cost_price: p.cost_price,
        selling_price: p.cost_price + 60,
        stock_quantity: p.stock_quantity,
        reorder_level: 5,
        unit: 'piece',
        image_url: '',
        is_active: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('Integration — Critical Flows', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetDB();
        wireDB();
    });

    // ─── 1. Full POS Flow ────────────────────────────────────────

    describe('Full POS Flow', () => {
        it('checkout creates sale, decrements stock for each item', async () => {
            const cart = [
                { product: makeProduct(1), quantity: 3, discount: 0 },
                { product: makeProduct(2), quantity: 5, discount: 10 },
            ];

            const saleId = nextId; // the sale will get this ID

            // Store sale so getById returns it after COMMIT
            mockLastInsertId.mockImplementationOnce(async () => {
                const id = saleId;
                nextId++;
                // Simulate the sale record existing for getById
                sales[id] = {
                    id,
                    user_id: 1,
                    session_id: 1,
                    customer_id: null,
                    sale_date: '2026-02-20',
                    subtotal: 3 * 100 + 5 * 120 - 10,
                    tax_amount: 0,
                    discount_amount: 0,
                    total: 3 * 100 + 5 * 120 - 10,
                    payment_method: 'cash',
                    customer_name: 'Walk-in Customer',
                    status: 'completed',
                    created_at: '2026-02-20',
                } as Sale;
                return id;
            });

            const sale = await SaleRepo.createFromCart(cart, { method: 'cash' }, 1, 1);

            // Verify sale returned
            expect(sale).toBeDefined();
            expect(sale.id).toBe(saleId);
            expect(sale.status).toBe('completed');

            // Verify stock decremented
            expect(products[1].stock_quantity).toBe(50 - 3); // 47
            expect(products[2].stock_quantity).toBe(30 - 5); // 25
        });

        it('rejects checkout when stock is insufficient', async () => {
            const cart = [{ product: makeProduct(1), quantity: 999, discount: 0 }];

            // lastInsertId for the sale record
            mockLastInsertId.mockResolvedValueOnce(nextId++);

            await expect(SaleRepo.createFromCart(cart, { method: 'cash' })).rejects.toThrow('Insufficient stock');

            // Stock should NOT have changed (ROLLBACK)
            expect(products[1].stock_quantity).toBe(50);
        });
    });

    // ─── 2. Credit Sale Flow ─────────────────────────────────────

    describe('Credit Sale Flow', () => {
        it('checkout on credit updates customer debt', async () => {
            const cart = [{ product: makeProduct(1), quantity: 2, discount: 0 }];

            // selling_price = cost_price + 60 = 100 → total = 2 × 100 = 200
            const expectedTotal = 2 * (products[1].cost_price + 60);
            const saleId = nextId;

            mockLastInsertId.mockImplementationOnce(async () => {
                const id = saleId;
                nextId++;
                sales[id] = {
                    id,
                    user_id: 1,
                    session_id: null,
                    customer_id: 10,
                    sale_date: '2026-02-20',
                    subtotal: expectedTotal,
                    tax_amount: 0,
                    discount_amount: 0,
                    total: expectedTotal,
                    payment_method: 'credit',
                    customer_name: 'John Doe',
                    status: 'completed',
                    created_at: '2026-02-20',
                } as Sale;
                return id;
            });

            const initialDebt = customers[10].total_debt; // 200

            const sale = await SaleRepo.createFromCart(
                cart,
                { method: 'credit', customer_id: 10, customer_name: 'John Doe' },
                1,
            );

            // Verify sale is credit
            expect(sale.payment_method).toBe('credit');

            // Verify customer debt increased by sale total
            expect(customers[10].total_debt).toBe(initialDebt + expectedTotal); // 200 + 200 = 400

            // Verify stock still decremented
            expect(products[1].stock_quantity).toBe(50 - 2); // 48
        });

        it('rejects credit sale without customer_id', async () => {
            const cart = [{ product: makeProduct(1), quantity: 1, discount: 0 }];
            mockLastInsertId.mockResolvedValueOnce(nextId++);

            await expect(
                SaleRepo.createFromCart(cart, { method: 'credit' }),
            ).rejects.toThrow('Credit sales require a linked customer');

            // Debt unchanged
            expect(customers[10].total_debt).toBe(200);
        });
    });

    // ─── 3. Purchase Receive Flow ────────────────────────────────

    describe('Purchase Receive Flow', () => {
        it('create PO → receive → stock increased + PO marked received', async () => {
            const initialStock1 = products[1].stock_quantity; // 50
            const initialStock2 = products[2].stock_quantity; // 30

            // Step 1: Create PO
            const poId = nextId;
            mockLastInsertId.mockImplementationOnce(async () => {
                const id = poId;
                nextId++;
                return id;
            });

            const createdPoId = await PurchaseRepo.create({
                supplier_id: 1,
                status: 'pending',
                notes: 'Restock order',
                items: [
                    { product_id: 1, quantity: 20, unit_cost: 40 },
                    { product_id: 2, quantity: 10, unit_cost: 55 },
                ],
            });

            expect(createdPoId).toBe(poId);

            // Manually add into in-memory DB so receive() can read it
            purchaseOrders[poId] = {
                id: poId,
                supplier_id: 1,
                order_date: '2026-02-20',
                status: 'pending',
                total_amount: 20 * 40 + 10 * 55,
                paid_amount: 0,
                notes: 'Restock order',
                created_at: '2026-02-20',
                updated_at: '2026-02-20',
            } as PurchaseOrder;

            purchaseOrderItems[poId] = [
                {
                    id: 100,
                    purchase_order_id: poId,
                    product_id: 1,
                    quantity: 20,
                    unit_cost: 40,
                    total_cost: 800,
                    received_quantity: 0,
                },
                {
                    id: 101,
                    purchase_order_id: poId,
                    product_id: 2,
                    quantity: 10,
                    unit_cost: 55,
                    total_cost: 550,
                    received_quantity: 0,
                },
            ];

            // Step 2: Receive PO
            await PurchaseRepo.receive(poId);

            // Verify stock increased
            expect(products[1].stock_quantity).toBe(initialStock1 + 20); // 70
            expect(products[2].stock_quantity).toBe(initialStock2 + 10); // 40

            // Verify PO marked received
            expect(purchaseOrders[poId].status).toBe('received');
        });

        it('receive no-ops for already-received PO', async () => {
            const poId = 50;
            purchaseOrders[poId] = {
                id: poId,
                supplier_id: 1,
                order_date: '2026-02-20',
                status: 'received',
                total_amount: 800,
                paid_amount: 0,
                notes: '',
                created_at: '2026-02-20',
                updated_at: '2026-02-20',
            } as PurchaseOrder;

            const stockBefore = products[1].stock_quantity;
            await PurchaseRepo.receive(poId);

            // No stock change
            expect(products[1].stock_quantity).toBe(stockBefore);
        });
    });

    // ─── 4. Refund Flow ──────────────────────────────────────────

    describe('Refund Flow', () => {
        it('complete sale → refund → stock restored + status updated', async () => {
            // Step 1: Create a sale (checking out 5 of product 1, 3 of product 2)
            const cart = [
                { product: makeProduct(1), quantity: 5, discount: 0 },
                { product: makeProduct(2), quantity: 3, discount: 0 },
            ];

            const saleId = nextId;
            mockLastInsertId.mockImplementationOnce(async () => {
                const id = saleId;
                nextId++;
                sales[id] = {
                    id,
                    user_id: 1,
                    session_id: 1,
                    customer_id: null,
                    sale_date: '2026-02-20',
                    subtotal: 5 * 100 + 3 * 120,
                    tax_amount: 0,
                    discount_amount: 0,
                    total: 5 * 100 + 3 * 120,
                    payment_method: 'cash',
                    customer_name: 'Walk-in Customer',
                    status: 'completed',
                    created_at: '2026-02-20',
                } as Sale;
                // Also store sale items so refundSale's getItems can find them
                saleItems[id] = [
                    { id: 200, sale_id: id, product_id: 1, product_name: 'Widget A', quantity: 5, unit_price: 100, discount: 0, total: 500 },
                    { id: 201, sale_id: id, product_id: 2, product_name: 'Widget B', quantity: 3, unit_price: 120, discount: 0, total: 360 },
                ];
                return id;
            });

            await SaleRepo.createFromCart(cart, { method: 'cash' }, 1, 1);

            // After sale: stock should be decremented
            expect(products[1].stock_quantity).toBe(50 - 5); // 45
            expect(products[2].stock_quantity).toBe(30 - 3); // 27

            const stockAfterSale1 = products[1].stock_quantity;
            const stockAfterSale2 = products[2].stock_quantity;

            // Step 2: Refund the sale
            await SaleRepo.refundSale(saleId, 'Customer return');

            // Verify stock restored
            expect(products[1].stock_quantity).toBe(stockAfterSale1 + 5); // 50 (back to original)
            expect(products[2].stock_quantity).toBe(stockAfterSale2 + 3); // 30 (back to original)

            // Verify sale status changed to refunded
            expect(sales[saleId].status).toBe('refunded');
        });

        it('void sale → stock restored + status voided', async () => {
            // Setup: a pre-existing completed sale
            const saleId = 99;
            sales[saleId] = {
                id: saleId,
                user_id: 1,
                session_id: 1,
                customer_id: null,
                sale_date: '2026-02-20',
                subtotal: 200,
                tax_amount: 0,
                discount_amount: 0,
                total: 200,
                payment_method: 'cash',
                customer_name: 'Walk-in',
                status: 'completed',
                created_at: '2026-02-20',
            } as Sale;

            saleItems[saleId] = [
                { id: 300, sale_id: saleId, product_id: 1, product_name: 'Widget A', quantity: 4, unit_price: 100, discount: 0, total: 400 },
            ];

            const stockBefore = products[1].stock_quantity; // 50

            await SaleRepo.voidSale(saleId, 'Accidental entry');

            // Stock restored
            expect(products[1].stock_quantity).toBe(stockBefore + 4); // 54

            // Status voided
            expect(sales[saleId].status).toBe('voided');
        });

        it('cannot refund an already-refunded sale', async () => {
            const saleId = 88;
            sales[saleId] = {
                id: saleId,
                user_id: 1,
                session_id: 1,
                customer_id: null,
                sale_date: '2026-02-20',
                subtotal: 100,
                tax_amount: 0,
                discount_amount: 0,
                total: 100,
                payment_method: 'cash',
                customer_name: 'Walk-in',
                status: 'refunded',
                created_at: '2026-02-20',
            } as Sale;

            await expect(SaleRepo.refundSale(saleId)).rejects.toThrow('Sale is already refunded');
        });
    });
});
