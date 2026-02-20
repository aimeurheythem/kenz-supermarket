/**
 * Unit Tests — useProductStore
 *
 * Covers:
 *  - loadProducts() — sets products, handles error, toggles isLoading
 *  - loadLowStock() — sets lowStockProducts
 *  - addProduct() / updateProduct() / deleteProduct() — CRUD + reload
 *  - setFilters() — merges filters and reloads
 *  - getByBarcode()
 *  - error handling across all actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import type { Product, ProductInput } from '@/lib/types';

// ── Mock Repo (vi.hoisted so it's available in vi.mock factory) ──────

const { mockProductRepo } = vi.hoisted(() => ({
    mockProductRepo: {
        getAll: vi.fn().mockResolvedValue([]),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getByBarcode: vi.fn(),
    },
}));

vi.mock('../../database/repositories/product.repo', () => ({
    ProductRepo: mockProductRepo,
}));

import { useProductStore } from '../stores/useProductStore';

// ── Fixtures ─────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
    {
        id: 1,
        barcode: '111',
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
    },
    {
        id: 2,
        barcode: '222',
        name: 'Gadget',
        description: '',
        category_id: 2,
        cost_price: 80,
        selling_price: 150,
        stock_quantity: 3,
        reorder_level: 10,
        unit: 'piece',
        image_url: '',
        is_active: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    },
];

const NEW_PRODUCT_INPUT: ProductInput = {
    name: 'New Item',
    cost_price: 30,
    selling_price: 60,
    barcode: '333',
    stock_quantity: 50,
};

// ── Tests ────────────────────────────────────────────────────────────

describe('useProductStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useProductStore.setState({
            products: [],
            lowStockProducts: [],
            isLoading: false,
            error: null,
            filters: {},
        });
    });

    // ─── loadProducts() ──────────────────────────────────────────

    describe('loadProducts()', () => {
        it('sets products on success', async () => {
            mockProductRepo.getAll.mockResolvedValueOnce(PRODUCTS);

            await act(async () => {
                await useProductStore.getState().loadProducts();
            });

            expect(useProductStore.getState().products).toEqual(PRODUCTS);
        });

        it('sets isLoading true during load', async () => {
            let loadingDuring = false;
            mockProductRepo.getAll.mockImplementationOnce(() => {
                loadingDuring = useProductStore.getState().isLoading;
                return Promise.resolve(PRODUCTS);
            });

            await act(async () => {
                await useProductStore.getState().loadProducts();
            });

            expect(loadingDuring).toBe(true);
            expect(useProductStore.getState().isLoading).toBe(false);
        });

        it('resets isLoading on failure', async () => {
            mockProductRepo.getAll.mockRejectedValueOnce(new Error('DB error'));

            try {
                await act(async () => {
                    await useProductStore.getState().loadProducts();
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().isLoading).toBe(false);
        });

        it('sets error on failure', async () => {
            mockProductRepo.getAll.mockRejectedValueOnce(new Error('Connection lost'));

            try {
                await act(async () => {
                    await useProductStore.getState().loadProducts();
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().error).toBe('Connection lost');
        });

        it('re-throws on failure', async () => {
            mockProductRepo.getAll.mockRejectedValueOnce(new Error('Re-thrown'));

            await expect(
                act(async () => {
                    await useProductStore.getState().loadProducts();
                }),
            ).rejects.toThrow('Re-thrown');
        });

        it('passes current filters to repo', async () => {
            useProductStore.setState({ filters: { search: 'widget', category_id: 1 } });
            mockProductRepo.getAll.mockResolvedValueOnce([]);

            await act(async () => {
                await useProductStore.getState().loadProducts();
            });

            expect(mockProductRepo.getAll).toHaveBeenCalledWith({ search: 'widget', category_id: 1 });
        });
    });

    // ─── loadLowStock() ──────────────────────────────────────────

    describe('loadLowStock()', () => {
        it('sets lowStockProducts', async () => {
            mockProductRepo.getAll.mockResolvedValueOnce([PRODUCTS[1]]);

            await act(async () => {
                await useProductStore.getState().loadLowStock();
            });

            expect(useProductStore.getState().lowStockProducts).toEqual([PRODUCTS[1]]);
            expect(mockProductRepo.getAll).toHaveBeenCalledWith({ low_stock: true });
        });

        it('sets error on failure', async () => {
            mockProductRepo.getAll.mockRejectedValueOnce(new Error('Low stock error'));

            try {
                await act(async () => {
                    await useProductStore.getState().loadLowStock();
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().error).toBe('Low stock error');
        });
    });

    // ─── setFilters() ────────────────────────────────────────────

    describe('setFilters()', () => {
        it('merges filters and reloads products', async () => {
            mockProductRepo.getAll.mockResolvedValueOnce([PRODUCTS[0]]);

            await act(async () => {
                await useProductStore.getState().setFilters({ search: 'widget' });
            });

            expect(useProductStore.getState().filters).toEqual(
                expect.objectContaining({ search: 'widget' }),
            );
            expect(mockProductRepo.getAll).toHaveBeenCalled();
        });

        it('preserves existing filters when adding new ones', async () => {
            useProductStore.setState({ filters: { category_id: 5 } });
            mockProductRepo.getAll.mockResolvedValueOnce([]);

            await act(async () => {
                await useProductStore.getState().setFilters({ search: 'test' });
            });

            expect(useProductStore.getState().filters).toEqual({ category_id: 5, search: 'test' });
        });
    });

    // ─── addProduct() ────────────────────────────────────────────

    describe('addProduct()', () => {
        it('calls create and reloads products', async () => {
            const created = { ...PRODUCTS[0], id: 10, name: 'New Item' };
            mockProductRepo.create.mockResolvedValueOnce(created);
            mockProductRepo.getAll.mockResolvedValueOnce([...PRODUCTS, created]);

            let result: Product | undefined;
            await act(async () => {
                result = await useProductStore.getState().addProduct(NEW_PRODUCT_INPUT);
            });

            expect(result).toEqual(created);
            expect(mockProductRepo.create).toHaveBeenCalledWith(NEW_PRODUCT_INPUT);
            expect(mockProductRepo.getAll).toHaveBeenCalled();
        });

        it('sets error on failure', async () => {
            mockProductRepo.create.mockRejectedValueOnce(new Error('Duplicate barcode'));

            try {
                await act(async () => {
                    await useProductStore.getState().addProduct(NEW_PRODUCT_INPUT);
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().error).toBe('Duplicate barcode');
        });
    });

    // ─── updateProduct() ─────────────────────────────────────────

    describe('updateProduct()', () => {
        it('calls update and reloads products', async () => {
            const updated = { ...PRODUCTS[0], name: 'Updated Widget' };
            mockProductRepo.update.mockResolvedValueOnce(updated);
            mockProductRepo.getAll.mockResolvedValueOnce([updated, PRODUCTS[1]]);

            let result: Product | undefined;
            await act(async () => {
                result = await useProductStore.getState().updateProduct(1, { name: 'Updated Widget' });
            });

            expect(result).toEqual(updated);
            expect(mockProductRepo.update).toHaveBeenCalledWith(1, { name: 'Updated Widget' });
        });

        it('sets error on failure', async () => {
            mockProductRepo.update.mockRejectedValueOnce(new Error('Not found'));

            try {
                await act(async () => {
                    await useProductStore.getState().updateProduct(999, { name: 'X' });
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().error).toBe('Not found');
        });
    });

    // ─── deleteProduct() ─────────────────────────────────────────

    describe('deleteProduct()', () => {
        it('calls delete and reloads products', async () => {
            mockProductRepo.delete.mockResolvedValueOnce(undefined);
            mockProductRepo.getAll.mockResolvedValueOnce([PRODUCTS[1]]);

            await act(async () => {
                await useProductStore.getState().deleteProduct(1);
            });

            expect(mockProductRepo.delete).toHaveBeenCalledWith(1);
            expect(mockProductRepo.getAll).toHaveBeenCalled();
        });

        it('sets error on failure', async () => {
            mockProductRepo.delete.mockRejectedValueOnce(new Error('Has sales'));

            try {
                await act(async () => {
                    await useProductStore.getState().deleteProduct(1);
                });
            } catch {
                // expected
            }

            expect(useProductStore.getState().error).toBe('Has sales');
        });
    });

    // ─── getByBarcode() ──────────────────────────────────────────

    describe('getByBarcode()', () => {
        it('returns product from repo', async () => {
            mockProductRepo.getByBarcode.mockResolvedValueOnce(PRODUCTS[0]);

            let result: Product | undefined;
            await act(async () => {
                result = await useProductStore.getState().getByBarcode('111');
            });

            expect(result).toEqual(PRODUCTS[0]);
            expect(mockProductRepo.getByBarcode).toHaveBeenCalledWith('111');
        });

        it('returns undefined when not found', async () => {
            mockProductRepo.getByBarcode.mockResolvedValueOnce(undefined);

            let result: Product | undefined;
            await act(async () => {
                result = await useProductStore.getState().getByBarcode('999');
            });

            expect(result).toBeUndefined();
        });
    });

    // ─── clearError() ────────────────────────────────────────────

    describe('clearError()', () => {
        it('resets error to null', () => {
            useProductStore.setState({ error: 'some error' });

            act(() => {
                useProductStore.getState().clearError();
            });

            expect(useProductStore.getState().error).toBeNull();
        });
    });
});
