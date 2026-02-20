/**
 * Unit Tests — PurchaseRepo
 *
 * Covers:
 *  - create() — header + items insertion, total calculation, rollback on error
 *  - receive() — stock increment, received_quantity update, status flip
 *  - receive() — no-op for already received PO
 *  - receive() — rolls back on DB error
 *
 * Note: PurchaseRepo.getById() calls query() (NOT get()!) and returns pos[0].
 *       PurchaseRepo.getItems() also calls query().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PurchaseOrder, PurchaseOrderItem } from '../../src/lib/types';

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

import { query, execute, executeNoSave, lastInsertId, triggerSave } from '../db';
import { PurchaseRepo } from '../repositories/purchase.repo';
import { AuditLogRepo } from '../repositories/audit-log.repo';

const mockQuery = vi.mocked(query);
const mockExecute = vi.mocked(execute);
const mockExecuteNoSave = vi.mocked(executeNoSave);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockTriggerSave = vi.mocked(triggerSave);

// ── Fixtures ─────────────────────────────────────────────────────────

const PO: PurchaseOrder = {
    id: 5,
    supplier_id: 10,
    supplier_name: 'Acme Supplies',
    order_date: '2026-01-15',
    status: 'pending',
    total_amount: 1500,
    paid_amount: 0,
    notes: '',
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    expected_date: null
};

const PO_ITEMS: PurchaseOrderItem[] = [
    {
        id: 1,
        purchase_order_id: 5,
        product_id: 101,
        product_name: 'Widget A',
        quantity: 10,
        unit_cost: 50,
        total_cost: 500,
        received_quantity: 0,
    },
    {
        id: 2,
        purchase_order_id: 5,
        product_id: 102,
        product_name: 'Widget B',
        quantity: 20,
        unit_cost: 50,
        total_cost: 1000,
        received_quantity: 0,
    },
];

const ORDER_INPUT = {
    supplier_id: 10,
    status: 'pending',
    notes: 'Test order',
    items: [
        { product_id: 101, quantity: 10, unit_cost: 50 },
        { product_id: 102, quantity: 20, unit_cost: 50 },
    ],
};

// ── Tests ────────────────────────────────────────────────────────────

describe('PurchaseRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── create() ────────────────────────────────────────────────

    describe('create()', () => {
        it('inserts PO header and returns new ID', async () => {
            mockLastInsertId.mockResolvedValueOnce(5);

            const id = await PurchaseRepo.create(ORDER_INPUT);

            expect(id).toBe(5);
            // First executeNoSave = BEGIN, second = INSERT PO
            const insertCall = mockExecuteNoSave.mock.calls[1];
            expect(insertCall[0]).toContain('INSERT INTO purchase_orders');
            expect(insertCall[1]).toEqual([10, 'pending', 'Test order']);
        });

        it('inserts each item with correct line total', async () => {
            mockLastInsertId.mockResolvedValueOnce(5);

            await PurchaseRepo.create(ORDER_INPUT);

            // calls[0] = BEGIN, calls[1] = INSERT PO, calls[2] = item 1, calls[3] = item 2
            const item1Call = mockExecuteNoSave.mock.calls[2];
            expect(item1Call[0]).toContain('INSERT INTO purchase_order_items');
            // received_quantity = 0 is a literal in SQL, NOT a param
            expect(item1Call[1]).toEqual([5, 101, 10, 50, 500]);

            const item2Call = mockExecuteNoSave.mock.calls[3];
            expect(item2Call[1]).toEqual([5, 102, 20, 50, 1000]);
        });

        it('updates PO total_amount as sum of line totals', async () => {
            mockLastInsertId.mockResolvedValueOnce(5);

            await PurchaseRepo.create(ORDER_INPUT);

            // calls[4] = UPDATE total, calls[5] = COMMIT
            const updateCall = mockExecuteNoSave.mock.calls[4];
            expect(updateCall[0]).toContain('UPDATE purchase_orders SET total_amount');
            expect(updateCall[1]).toEqual([1500, 5]);
        });

        it('wraps in BEGIN/COMMIT and triggers save', async () => {
            mockLastInsertId.mockResolvedValueOnce(5);

            await PurchaseRepo.create(ORDER_INPUT);

            const sqls = mockExecuteNoSave.mock.calls.map((c) => c[0]);
            expect(sqls[0]).toBe('BEGIN TRANSACTION;');
            expect(sqls[sqls.length - 1]).toBe('COMMIT;');
            expect(mockTriggerSave).toHaveBeenCalledOnce();
        });

        it('logs audit entry', async () => {
            mockLastInsertId.mockResolvedValueOnce(5);

            await PurchaseRepo.create(ORDER_INPUT);

            expect(AuditLogRepo.log).toHaveBeenCalledWith(
                'CREATE',
                'PURCHASE_ORDER',
                5,
                expect.stringContaining('PO #5'),
                null,
                expect.objectContaining({ total_amount: 1500 }),
            );
        });

        it('rolls back on error', async () => {
            mockLastInsertId.mockRejectedValueOnce(new Error('ID fetch failed'));

            await expect(PurchaseRepo.create(ORDER_INPUT)).rejects.toThrow('ID fetch failed');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
            expect(mockTriggerSave).not.toHaveBeenCalled();
        });
    });

    // ─── receive() ───────────────────────────────────────────────

    describe('receive()', () => {
        it('increments stock for each item', async () => {
            // getById → query() returns array; receive uses this.getById
            mockQuery
                .mockResolvedValueOnce([PO] as never) // getById
                .mockResolvedValueOnce(PO_ITEMS as never); // getItems

            await PurchaseRepo.receive(5);

            const stockUpdates = mockExecuteNoSave.mock.calls.filter(
                (c) => typeof c[0] === 'string' && c[0].includes('UPDATE products'),
            );
            expect(stockUpdates).toHaveLength(2);
            expect(stockUpdates[0][1]).toEqual([10, 50, 101]);
            expect(stockUpdates[1][1]).toEqual([20, 50, 102]);
        });

        it('marks each item received_quantity = quantity', async () => {
            mockQuery
                .mockResolvedValueOnce([PO] as never)
                .mockResolvedValueOnce(PO_ITEMS as never);

            await PurchaseRepo.receive(5);

            const recvUpdates = mockExecuteNoSave.mock.calls.filter(
                (c) => typeof c[0] === 'string' && c[0].includes('UPDATE purchase_order_items'),
            );
            expect(recvUpdates).toHaveLength(2);
            expect(recvUpdates[0][1]).toEqual([1]);
            expect(recvUpdates[1][1]).toEqual([2]);
        });

        it('sets PO status to received', async () => {
            mockQuery
                .mockResolvedValueOnce([PO] as never)
                .mockResolvedValueOnce(PO_ITEMS as never);

            await PurchaseRepo.receive(5);

            const statusUpdate = mockExecuteNoSave.mock.calls.find(
                (c) => typeof c[0] === 'string' && c[0].includes("status = 'received'"),
            );
            expect(statusUpdate).toBeDefined();
            expect(statusUpdate![1]).toEqual([5]);
        });

        it('wraps in transaction and triggers save', async () => {
            mockQuery
                .mockResolvedValueOnce([PO] as never)
                .mockResolvedValueOnce(PO_ITEMS as never);

            await PurchaseRepo.receive(5);

            const sqls = mockExecuteNoSave.mock.calls.map((c) => c[0]);
            expect(sqls[0]).toBe('BEGIN TRANSACTION;');
            expect(sqls[sqls.length - 1]).toBe('COMMIT;');
            expect(mockTriggerSave).toHaveBeenCalledOnce();
        });

        it('logs audit entry with before/after', async () => {
            mockQuery
                .mockResolvedValueOnce([PO] as never)
                .mockResolvedValueOnce(PO_ITEMS as never);

            await PurchaseRepo.receive(5);

            expect(AuditLogRepo.log).toHaveBeenCalledWith(
                'RECEIVE',
                'PURCHASE_ORDER',
                5,
                expect.stringContaining('PO #5 received'),
                { status: 'pending' },
                { status: 'received', items_received: 2 },
            );
        });

        it('no-ops if PO not found', async () => {
            mockQuery.mockResolvedValueOnce([] as never); // empty → getById returns null

            await PurchaseRepo.receive(999);

            expect(mockExecuteNoSave).not.toHaveBeenCalled();
        });

        it('no-ops if PO already received', async () => {
            mockQuery.mockResolvedValueOnce([{ ...PO, status: 'received' }] as never);

            await PurchaseRepo.receive(5);

            expect(mockExecuteNoSave).not.toHaveBeenCalled();
        });

        it('rolls back on error during stock update', async () => {
            mockQuery
                .mockResolvedValueOnce([PO] as never)
                .mockResolvedValueOnce(PO_ITEMS as never);
            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockRejectedValueOnce(new Error('Stock update failed')); // UPDATE products fails

            await expect(PurchaseRepo.receive(5)).rejects.toThrow('Stock update failed');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
            expect(mockTriggerSave).not.toHaveBeenCalled();
        });
    });

    // ─── updateStatus() ─────────────────────────────────────────

    describe('updateStatus()', () => {
        it('calls execute with correct SQL and params', async () => {
            await PurchaseRepo.updateStatus(5, 'cancelled');

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE purchase_orders SET status'),
                ['cancelled', 5],
            );
        });
    });
});
