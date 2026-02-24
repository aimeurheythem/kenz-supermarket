/**
 * Unit Tests — PromotionRepo
 *
 * Covers:
 *  - getAll() — returns all non-deleted promotions, applies filters
 *  - getById() — returns promotion with products, undefined when not found
 *  - create() — inserts promotion + products, returns created promotion
 *  - update() — updates fields, re-links products
 *  - delete() — soft delete (sets deleted_at), excluded from getAll()
 *  - getActiveForCheckout() — date range + status filtering
 *  - effective_status — computed (active/inactive/expired/scheduled)
 *  - count() — returns count with filters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Promotion, PromotionInput } from '../../src/lib/types';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../db', () => ({
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    lastInsertId: vi.fn().mockResolvedValue(1),
}));

vi.mock('../repositories/audit-log.repo', () => ({
    AuditLogRepo: { log: vi.fn() },
}));

import { query, execute, get, lastInsertId } from '../db';
import { PromotionRepo } from '../repositories/promotion.repo';
import { AuditLogRepo } from '../repositories/audit-log.repo';

const mockQuery = vi.mocked(query);
const mockExecute = vi.mocked(execute);
const mockGet = vi.mocked(get);
const mockLastInsertId = vi.mocked(lastInsertId);
const mockAuditLog = vi.mocked(AuditLogRepo.log);

// ── Fixtures ──────────────────────────────────────────────────────────────

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
    return {
        id: 1,
        name: 'Summer Sale',
        type: 'price_discount',
        status: 'active',
        start_date: '2026-01-01',
        end_date: '2099-12-31',
        config: JSON.stringify({ discount_type: 'percentage', discount_value: 20, max_discount: null }),
        deleted_at: null as unknown as string,
        created_at: '2026-01-01T00:00:00',
        updated_at: '2026-01-01T00:00:00',
        products: [],
        ...overrides,
    };
}

function makePromotionInput(overrides: Partial<PromotionInput> = {}): PromotionInput {
    return {
        name: 'Summer Sale',
        type: 'price_discount',
        status: 'active',
        start_date: '2026-01-01',
        end_date: '2099-12-31',
        config: { discount_type: 'percentage', discount_value: 20, max_discount: null },
        product_ids: [1, 2],
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('PromotionRepo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── getAll ─────────────────────────────────────────────────────────

    describe('getAll()', () => {
        it('returns all non-deleted promotions', async () => {
            const promo = makePromotion();
            mockQuery.mockResolvedValueOnce([promo]);
            mockQuery.mockResolvedValueOnce([]); // _getProducts

            const result = await PromotionRepo.getAll();

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE p.deleted_at IS NULL'),
                expect.any(Array)
            );
            expect(result).toHaveLength(1);
        });

        it('applies type filter', async () => {
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.getAll({ type: 'quantity_discount' });

            const [sql, params] = mockQuery.mock.calls[0];
            expect(sql).toContain('p.type = ?');
            expect(params).toContain('quantity_discount');
        });

        it('applies status filter for active', async () => {
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.getAll({ status: 'active' });

            const [sql, params] = mockQuery.mock.calls[0];
            expect(sql).toContain("p.status = 'active'");
        });

        it('applies search filter', async () => {
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.getAll({ search: 'Summer' });

            const [sql, params] = mockQuery.mock.calls[0];
            expect(sql).toContain('p.name LIKE ?');
            expect(params).toContain('%Summer%');
        });

        it('returns promotions with products attached', async () => {
            const promo = makePromotion({ id: 5 });
            const product = { id: 1, promotion_id: 5, product_id: 10, created_at: '2026-01-01', product_name: 'Widget', selling_price: 50 };
            mockQuery.mockResolvedValueOnce([promo]);
            mockQuery.mockResolvedValueOnce([product]);

            const result = await PromotionRepo.getAll();

            expect(result[0].products).toHaveLength(1);
            expect(result[0].products![0].product_id).toBe(10);
        });
    });

    // ── getById ────────────────────────────────────────────────────────

    describe('getById()', () => {
        it('returns promotion with products when found', async () => {
            const promo = makePromotion({ id: 3 });
            mockGet.mockResolvedValueOnce(promo);
            mockQuery.mockResolvedValueOnce([]);

            const result = await PromotionRepo.getById(3);

            expect(result).toBeDefined();
            expect(result!.id).toBe(3);
        });

        it('returns undefined when promotion not found', async () => {
            mockGet.mockResolvedValueOnce(undefined);

            const result = await PromotionRepo.getById(999);

            expect(result).toBeUndefined();
        });
    });

    // ── create ─────────────────────────────────────────────────────────

    describe('create()', () => {
        it('inserts promotion and returns it', async () => {
            const input = makePromotionInput();
            const created = makePromotion({ id: 7 });
            mockLastInsertId.mockResolvedValueOnce(7);
            mockGet.mockResolvedValueOnce(created);
            mockQuery.mockResolvedValueOnce([]); // _getProducts

            const result = await PromotionRepo.create(input);

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO promotions'),
                expect.any(Array)
            );
            expect(result.id).toBe(7);
        });

        it('inserts promotion_products for each product_id', async () => {
            const input = makePromotionInput({ product_ids: [1, 2, 3] });
            mockLastInsertId.mockResolvedValueOnce(5);
            const created = makePromotion({ id: 5 });
            mockGet.mockResolvedValueOnce(created);
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.create(input);

            // Should have 3 product inserts
            const productInserts = mockExecute.mock.calls.filter(([sql]) =>
                String(sql).includes('promotion_products') && String(sql).includes('INSERT')
            );
            expect(productInserts).toHaveLength(3);
        });

        it('calls AuditLogRepo.log() after creation', async () => {
            const input = makePromotionInput();
            mockLastInsertId.mockResolvedValueOnce(1);
            const created = makePromotion({ id: 1 });
            mockGet.mockResolvedValueOnce(created);
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.create(input);

            expect(mockAuditLog).toHaveBeenCalledWith(
                'CREATE', 'PROMOTION', expect.any(Number), expect.any(String), null, expect.anything()
            );
        });
    });

    // ── update ─────────────────────────────────────────────────────────

    describe('update()', () => {
        it('updates promotion fields and returns updated promotion', async () => {
            const updated = makePromotion({ name: 'Winter Sale' });
            // getById is called twice in update(): once for oldPromotion, once as return value
            mockGet.mockResolvedValueOnce(updated);
            mockQuery.mockResolvedValueOnce([]); // _getProducts for first getById
            mockGet.mockResolvedValueOnce(updated);
            mockQuery.mockResolvedValueOnce([]); // _getProducts for return getById

            const result = await PromotionRepo.update(1, { name: 'Winter Sale' });

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE promotions SET'),
                expect.any(Array)
            );
            expect(result.name).toBe('Winter Sale');
        });

        it('re-links products when product_ids provided', async () => {
            const updated = makePromotion({ id: 1 });
            mockGet.mockResolvedValueOnce(updated);
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.update(1, { product_ids: [10, 20] });

            const deleteCall = mockExecute.mock.calls.find(([sql]) =>
                String(sql).includes('DELETE FROM promotion_products')
            );
            expect(deleteCall).toBeDefined();
        });

        it('calls AuditLogRepo.log() after update', async () => {
            const updated = makePromotion({ id: 1 });
            mockGet.mockResolvedValueOnce(updated);
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.update(1, { name: 'Updated' });

            expect(mockAuditLog).toHaveBeenCalledWith(
                'UPDATE', 'PROMOTION', expect.any(Number), expect.any(String), expect.anything(), expect.anything()
            );
        });
    });

    // ── delete (soft) ──────────────────────────────────────────────────

    describe('delete()', () => {
        it('soft deletes — sets deleted_at', async () => {
            await PromotionRepo.delete(1);

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining("SET deleted_at = datetime('now')"),
                expect.arrayContaining([1])
            );
        });

        it('calls AuditLogRepo.log() after delete', async () => {
            await PromotionRepo.delete(1);

            expect(mockAuditLog).toHaveBeenCalledWith(
                'DELETE', 'PROMOTION', expect.any(Number), expect.any(String), undefined, null
            );
        });
    });

    // ── getActiveForCheckout ────────────────────────────────────────────

    describe('getActiveForCheckout()', () => {
        it('filters by status=active and current date range', async () => {
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.getActiveForCheckout();

            const [sql] = mockQuery.mock.calls[0];
            expect(sql).toContain("p.status = 'active'");
            expect(sql).toContain('p.start_date <=');
            expect(sql).toContain('p.end_date >=');
        });

        it('excludes deleted promotions', async () => {
            mockQuery.mockResolvedValueOnce([]);

            await PromotionRepo.getActiveForCheckout();

            const [sql] = mockQuery.mock.calls[0];
            expect(sql).toContain('p.deleted_at IS NULL');
        });
    });

    // ── count ──────────────────────────────────────────────────────────

    describe('count()', () => {
        it('returns total count without filters', async () => {
            mockGet.mockResolvedValueOnce({ count: 42 });

            const result = await PromotionRepo.count();

            expect(result).toBe(42);
        });

        it('returns 0 when no promotions exist', async () => {
            mockGet.mockResolvedValueOnce(undefined);

            const result = await PromotionRepo.count();

            expect(result).toBe(0);
        });

        it('applies type filter to count', async () => {
            mockGet.mockResolvedValueOnce({ count: 5 });

            await PromotionRepo.count({ type: 'pack_discount' });

            const [sql, params] = mockGet.mock.calls[0];
            expect(sql).toContain('p.type = ?');
            expect(params).toContain('pack_discount');
        });
    });
});
