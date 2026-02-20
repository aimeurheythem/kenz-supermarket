/**
 * Unit Tests — StockRepo
 *
 * Covers:
 *  - addStock()    — atomic increment, movement record, audit log
 *  - removeStock() — atomic decrement, insufficient stock rejection
 *  - adjustStock() — sets exact quantity, records movement
 *  - All methods   — transaction rollback on error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
    AuditLogRepo: {
        log: vi.fn(),
    },
}));

import { executeNoSave, get, triggerSave } from '../db';
import { StockRepo } from '../repositories/stock.repo';
import { AuditLogRepo } from '../repositories/audit-log.repo';

const mockExecuteNoSave = vi.mocked(executeNoSave);
const mockGet = vi.mocked(get);
const mockTriggerSave = vi.mocked(triggerSave);
const mockAuditLog = vi.mocked(AuditLogRepo.log);

// ── Tests ────────────────────────────────────────────────────────────

describe('StockRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── addStock() ──────────────────────────────────────────────

    describe('addStock()', () => {
        it('atomically increments stock quantity', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.addStock(1, 5, 'Purchase received', 100, 'purchase');

            const stockUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE products SET stock_quantity = stock_quantity + ?'),
            );
            expect(stockUpdate).toBeDefined();
            expect(stockUpdate![1]).toEqual([5, 1]); // quantity, productId
        });

        it('creates a stock movement record with correct values', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.addStock(1, 5, 'Restock');

            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            expect(movementInsert).toBeDefined();
            // [productId, quantity, previousStock, newStock, reason, referenceId, referenceType]
            expect(movementInsert![1]).toEqual([1, 5, 10, 15, 'Restock', null, null]);
        });

        it('wraps operations in a transaction', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.addStock(1, 5, 'Test');

            const calls = mockExecuteNoSave.mock.calls.map((c) => c[0]);
            expect(calls[0]).toBe('BEGIN TRANSACTION;');
            expect(calls[calls.length - 1]).toBe('COMMIT;');
        });

        it('calls triggerSave after commit', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 0 } as never);

            await StockRepo.addStock(1, 10, 'Test');

            expect(mockTriggerSave).toHaveBeenCalledOnce();
        });

        it('logs audit entry', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 5 } as never);

            await StockRepo.addStock(1, 3, 'Manual add');

            expect(mockAuditLog).toHaveBeenCalledWith(
                'STOCK_IN',
                'PRODUCT',
                1,
                expect.stringContaining('Added 3 units'),
                { stock_quantity: 5 },
                { stock_quantity: 8 },
            );
        });

        it('throws and rolls back if product not found', async () => {
            mockGet.mockResolvedValueOnce(undefined);

            await expect(StockRepo.addStock(999, 5, 'Test')).rejects.toThrow('Product 999 not found');

            // Should not start a transaction
            expect(mockExecuteNoSave).not.toHaveBeenCalledWith('BEGIN TRANSACTION;');
        });

        it('rolls back on DB error during transaction', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);
            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockRejectedValueOnce(new Error('Disk full')); // UPDATE fails

            await expect(StockRepo.addStock(1, 5, 'Test')).rejects.toThrow('Disk full');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
            expect(mockTriggerSave).not.toHaveBeenCalled();
        });
    });

    // ─── removeStock() ───────────────────────────────────────────

    describe('removeStock()', () => {
        it('atomically decrements stock quantity', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 20 } as never);

            await StockRepo.removeStock(1, 5, 'Damaged goods');

            const stockUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?)'),
            );
            expect(stockUpdate).toBeDefined();
            expect(stockUpdate![1]).toEqual([5, 1]);
        });

        it('creates stock movement with type "out"', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 20 } as never);

            await StockRepo.removeStock(1, 5, 'Expired');

            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            expect(movementInsert).toBeDefined();
            // [productId, quantity, previousStock, newStock, reason]
            expect(movementInsert![1]).toEqual([1, 5, 20, 15, 'Expired']);
        });

        it('throws when trying to remove more than available', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 3 } as never);

            await expect(StockRepo.removeStock(1, 10, 'Oops')).rejects.toThrow(
                /Insufficient stock: have 3, trying to remove 10/,
            );

            // Should not start transaction
            expect(mockExecuteNoSave).not.toHaveBeenCalledWith('BEGIN TRANSACTION;');
        });

        it('throws when product not found', async () => {
            mockGet.mockResolvedValueOnce(undefined);

            await expect(StockRepo.removeStock(999, 1, 'Test')).rejects.toThrow('Product 999 not found');
        });

        it('logs audit entry on success', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.removeStock(1, 4, 'Damaged');

            expect(mockAuditLog).toHaveBeenCalledWith(
                'STOCK_OUT',
                'PRODUCT',
                1,
                expect.stringContaining('Removed 4 units'),
                { stock_quantity: 10 },
                { stock_quantity: 6 },
            );
        });

        it('rolls back transaction on error', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 20 } as never);
            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockResolvedValueOnce(undefined) // UPDATE products
                .mockRejectedValueOnce(new Error('Insert failed')); // INSERT stock_movements

            await expect(StockRepo.removeStock(1, 5, 'Test')).rejects.toThrow('Insert failed');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
        });
    });

    // ─── adjustStock() ───────────────────────────────────────────

    describe('adjustStock()', () => {
        it('sets stock to exact quantity', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.adjustStock(1, 25, 'Inventory count');

            const stockUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE products SET stock_quantity = ?'),
            );
            expect(stockUpdate).toBeDefined();
            expect(stockUpdate![1]).toEqual([25, 1]);
        });

        it('creates movement with type "adjustment"', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.adjustStock(1, 25, 'Recount');

            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            expect(movementInsert).toBeDefined();
            // quantity = |25 - 10| = 15
            expect(movementInsert![1]).toEqual([1, 15, 10, 25, 'Recount']);
        });

        it('handles downward adjustment', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 30 } as never);

            await StockRepo.adjustStock(1, 10, 'Shrinkage');

            const movementInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO stock_movements'),
            );
            // quantity = |10 - 30| = 20
            expect(movementInsert![1]).toEqual([1, 20, 30, 10, 'Shrinkage']);
        });

        it('logs audit entry', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);

            await StockRepo.adjustStock(1, 5, 'Correction');

            expect(mockAuditLog).toHaveBeenCalledWith(
                'STOCK_ADJUST',
                'PRODUCT',
                1,
                expect.stringContaining('Adjusted stock to 5'),
                { stock_quantity: 10 },
                { stock_quantity: 5 },
            );
        });

        it('throws when product not found', async () => {
            mockGet.mockResolvedValueOnce(undefined);

            await expect(StockRepo.adjustStock(999, 10, 'Test')).rejects.toThrow('Product 999 not found');
        });

        it('rolls back on error', async () => {
            mockGet.mockResolvedValueOnce({ stock_quantity: 10 } as never);
            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockRejectedValueOnce(new Error('Write failed')); // UPDATE

            await expect(StockRepo.adjustStock(1, 25, 'Test')).rejects.toThrow('Write failed');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
        });
    });
});
