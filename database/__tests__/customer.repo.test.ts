/**
 * Unit Tests — CustomerRepo
 *
 * Covers:
 *  - addTransaction() — debt balance is updated atomically
 *  - addTransaction() — payment reduces debt
 *  - addTransaction() — rolls back on error
 *  - addTransaction() — throws for non-existent customer
 *  - create() / delete() — basic CRUD
 *
 * Note: CustomerRepo.getById() calls get(), so use mockGet.
 *       delete() also calls get() for the sales count check.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Customer } from '../../src/lib/types';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('../db', () => ({
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    executeNoSave: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    lastInsertId: vi.fn().mockResolvedValue(1),
    triggerSave: vi.fn(),
}));

import { query, execute, executeNoSave, get, lastInsertId, triggerSave } from '../db';
import { CustomerRepo } from '../repositories/customer.repo';

const mockQuery = vi.mocked(query);
const mockExecute = vi.mocked(execute);
const mockExecuteNoSave = vi.mocked(executeNoSave);
const mockGet = vi.mocked(get);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockTriggerSave = vi.mocked(triggerSave);

// ── Fixtures ─────────────────────────────────────────────────────────

const CUSTOMER: Customer = {
    id: 1,
    full_name: 'John Doe',
    phone: '555-1234',
    email: 'john@example.com',
    address: '123 Main St',
    loyalty_points: 0,
    total_debt: 500,
    notes: '',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
};

// ── Tests ────────────────────────────────────────────────────────────

describe('CustomerRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── addTransaction() — debt ─────────────────────────────────

    describe('addTransaction() — debt', () => {
        it('increments debt atomically', async () => {
            // getById → get()
            mockGet.mockResolvedValueOnce(CUSTOMER as never);

            await CustomerRepo.addTransaction(1, 'debt', 200, 'sale', 10, 'Credit Sale');

            const debtUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE customers SET total_debt = total_debt + ?'),
            );
            expect(debtUpdate).toBeDefined();
            // debt type → balanceChange = +200
            expect(debtUpdate![1]).toEqual([200, 1]);
        });

        it('inserts transaction record with correct balance_after', async () => {
            mockGet.mockResolvedValueOnce(CUSTOMER as never); // total_debt = 500

            await CustomerRepo.addTransaction(1, 'debt', 200, 'sale', 10, 'Credit Sale');

            const txInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO customer_transactions'),
            );
            expect(txInsert).toBeDefined();
            // [customerId, type, amount, balance_after, referenceType, referenceId, description]
            expect(txInsert![1]).toEqual([1, 'debt', 200, 700, 'sale', 10, 'Credit Sale']);
        });

        it('wraps in transaction and triggers save', async () => {
            mockGet.mockResolvedValueOnce(CUSTOMER as never);

            await CustomerRepo.addTransaction(1, 'debt', 100);

            const calls = mockExecuteNoSave.mock.calls.map((c) => c[0]);
            expect(calls[0]).toBe('BEGIN TRANSACTION;');
            expect(calls[calls.length - 1]).toBe('COMMIT;');
            expect(mockTriggerSave).toHaveBeenCalledOnce();
        });
    });

    // ─── addTransaction() — payment ──────────────────────────────

    describe('addTransaction() — payment', () => {
        it('decrements debt atomically for payments', async () => {
            mockGet.mockResolvedValueOnce(CUSTOMER as never); // total_debt = 500

            await CustomerRepo.addTransaction(1, 'payment', 150, 'payment', undefined, 'Cash payment');

            const debtUpdate = mockExecuteNoSave.mock.calls.find(
                (call) =>
                    typeof call[0] === 'string' &&
                    call[0].includes('UPDATE customers SET total_debt = total_debt + ?'),
            );
            expect(debtUpdate).toBeDefined();
            // payment type → balanceChange = -150
            expect(debtUpdate![1]).toEqual([-150, 1]);
        });

        it('calculates correct balance_after for payment', async () => {
            mockGet.mockResolvedValueOnce({ ...CUSTOMER, total_debt: 300 } as never);

            await CustomerRepo.addTransaction(1, 'payment', 100);

            const txInsert = mockExecuteNoSave.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO customer_transactions'),
            );
            // balance_after = 300 + (-100) = 200
            expect(txInsert![1]).toEqual(expect.arrayContaining([200]));
        });
    });

    // ─── addTransaction() — error paths ──────────────────────────

    describe('addTransaction() — errors', () => {
        it('throws when customer not found', async () => {
            // get() returns undefined by default → no customer
            await expect(
                CustomerRepo.addTransaction(999, 'debt', 100),
            ).rejects.toThrow('Customer not found');

            expect(mockExecuteNoSave).not.toHaveBeenCalledWith('BEGIN TRANSACTION;');
        });

        it('rolls back on DB error', async () => {
            mockGet.mockResolvedValueOnce(CUSTOMER as never);
            mockExecuteNoSave
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockRejectedValueOnce(new Error('Insert failed')); // INSERT fails

            await expect(
                CustomerRepo.addTransaction(1, 'debt', 100),
            ).rejects.toThrow('Insert failed');

            expect(mockExecuteNoSave).toHaveBeenCalledWith('ROLLBACK;');
            expect(mockTriggerSave).not.toHaveBeenCalled();
        });
    });

    // ─── create() ────────────────────────────────────────────────

    describe('create()', () => {
        it('inserts customer and returns new ID', async () => {
            mockLastInsertId.mockResolvedValueOnce(42);

            const id = await CustomerRepo.create({
                full_name: 'Jane Smith',
                phone: '555-5678',
                email: 'jane@example.com',
            });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO customers'),
                expect.arrayContaining(['Jane Smith', '555-5678', 'jane@example.com']),
            );
            expect(id).toBe(42);
        });

        it('defaults optional fields to null/0', async () => {
            mockLastInsertId.mockResolvedValueOnce(1);

            await CustomerRepo.create({ full_name: 'Minimal Customer' });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO customers'),
                ['Minimal Customer', null, null, null, null, 0],
            );
        });
    });

    // ─── delete() ────────────────────────────────────────────────

    describe('delete()', () => {
        it('deletes customer with no sales', async () => {
            // delete() calls get<{count}>() for sales count check
            mockGet.mockResolvedValueOnce({ count: 0 } as never);

            await CustomerRepo.delete(1);

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM customers WHERE id = ?'),
                [1],
            );
        });

        it('throws when customer has existing sales', async () => {
            mockGet.mockResolvedValueOnce({ count: 5 } as never);

            await expect(CustomerRepo.delete(1)).rejects.toThrow(
                'Cannot delete customer with existing sales history',
            );
        });
    });

    // ─── getDebtors() ────────────────────────────────────────────

    describe('getDebtors()', () => {
        it('queries customers with debt > 0', async () => {
            mockQuery.mockResolvedValueOnce([CUSTOMER]);

            const result = await CustomerRepo.getDebtors();

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE total_debt > 0'),
            );
            expect(result).toHaveLength(1);
        });
    });

    // ─── getCollectionStats() ────────────────────────────────────

    describe('getCollectionStats()', () => {
        it('returns totals for debt and payment types', async () => {
            mockQuery.mockResolvedValueOnce([
                { type: 'debt', total: 5000 },
                { type: 'payment', total: 3000 },
            ]);

            const stats = await CustomerRepo.getCollectionStats();

            expect(stats.totalDebted).toBe(5000);
            expect(stats.totalCollected).toBe(3000);
        });

        it('returns zeros when no transactions exist', async () => {
            mockQuery.mockResolvedValueOnce([]);

            const stats = await CustomerRepo.getCollectionStats();

            expect(stats.totalDebted).toBe(0);
            expect(stats.totalCollected).toBe(0);
        });
    });
});
