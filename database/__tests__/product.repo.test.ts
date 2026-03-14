import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../../src/lib/types';

vi.mock('../db', () => ({
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../repositories/audit-log.repo', () => ({
    AuditLogRepo: {
        log: vi.fn().mockResolvedValue(undefined),
    },
}));

import { execute, get } from '../db';
import { ProductRepo } from '../repositories/product.repo';

const mockExecute = vi.mocked(execute);
const mockGet = vi.mocked(get);

const PRODUCT_FIXTURE: Product = {
    buying_price: null,
    id: 1,
    barcode: '123456',
    name: 'Test Product',
    description: '',
    category_id: null,
    cost_price: 100,
    selling_price: 150,
    stock_quantity: 10,
    reorder_level: 5,
    unit: 'piece',
    image_url: '',
    is_active: 1,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
};

describe('ProductRepo image persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('stores image_url on create after trimming whitespace', async () => {
        mockGet.mockResolvedValueOnce({ ...PRODUCT_FIXTURE, image_url: 'data:image/png;base64,abc' } as never);

        await ProductRepo.create({
            name: 'Test Product',
            cost_price: 100,
            selling_price: 150,
            image_url: '  data:image/png;base64,abc  ',
        });

        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO products'),
            expect.arrayContaining(['data:image/png;base64,abc']),
        );
    });

    it('stores empty string when image_url is null-like in update', async () => {
        mockGet.mockResolvedValueOnce(PRODUCT_FIXTURE as never);
        mockGet.mockResolvedValueOnce({ ...PRODUCT_FIXTURE, image_url: '' } as never);

        await ProductRepo.update(1, { image_url: undefined });

        // undefined should skip image_url update field entirely
        const sql = mockExecute.mock.calls[0][0] as string;
        expect(sql.includes('image_url = ?')).toBe(false);
    });

    it('updates image_url with normalized value when provided', async () => {
        mockGet.mockResolvedValueOnce(PRODUCT_FIXTURE as never);
        mockGet.mockResolvedValueOnce({ ...PRODUCT_FIXTURE, image_url: 'https://img.test/a.png' } as never);

        await ProductRepo.update(1, { image_url: '   https://img.test/a.png   ' });

        const params = mockExecute.mock.calls[0][1] as unknown[];
        expect(params).toContain('https://img.test/a.png');
    });
});
