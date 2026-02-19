import { query, executeNoSave, triggerSave, get } from '../db';
import type { StockMovement } from '../../src/lib/types';
import { AuditLogRepo } from './audit-log.repo';

export const StockRepo = {
    async getMovements(filters?: { product_id?: number; type?: string; limit?: number }): Promise<StockMovement[]> {
        let sql = `
      SELECT sm.*, p.name as product_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (filters?.product_id) {
            sql += ' AND sm.product_id = ?';
            params.push(filters.product_id);
        }
        if (filters?.type) {
            sql += ' AND sm.type = ?';
            params.push(filters.type);
        }

        sql += ' ORDER BY sm.created_at DESC';

        if (filters?.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        return query<StockMovement>(sql, params);
    },

    /**
     * Add stock (e.g., from a purchase or manual adjustment)
     */
    async addStock(
        productId: number,
        quantity: number,
        reason: string,
        referenceId?: number,
        referenceType?: string,
    ): Promise<void> {
        const product = await get<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [
            productId,
        ]);
        if (!product) throw new Error(`Product ${productId} not found`);
        const previousStock = product.stock_quantity;

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            await executeNoSave(
                "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?",
                [quantity, productId],
            );

            await executeNoSave(
                `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type)
           VALUES (?, 'in', ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    quantity,
                    previousStock,
                    previousStock + quantity,
                    reason,
                    referenceId || null,
                    referenceType || null,
                ],
            );

            await executeNoSave('COMMIT;');
            triggerSave();

            AuditLogRepo.log(
                'STOCK_IN',
                'PRODUCT',
                productId,
                `Added ${quantity} units — ${reason}`,
                { stock_quantity: previousStock },
                { stock_quantity: previousStock + quantity },
            );
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },

    /**
     * Remove stock manually (e.g., damaged goods, expired)
     */
    async removeStock(productId: number, quantity: number, reason: string): Promise<void> {
        const product = await get<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [
            productId,
        ]);
        if (!product) throw new Error(`Product ${productId} not found`);
        const previousStock = product.stock_quantity;

        if (previousStock < quantity) {
            throw new Error(`Insufficient stock: have ${previousStock}, trying to remove ${quantity}`);
        }

        const newStock = Math.max(0, previousStock - quantity);

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            await executeNoSave(
                "UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?), updated_at = datetime('now') WHERE id = ?",
                [quantity, productId],
            );

            await executeNoSave(
                `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason)
           VALUES (?, 'out', ?, ?, ?, ?)`,
                [productId, quantity, previousStock, newStock, reason],
            );

            await executeNoSave('COMMIT;');
            triggerSave();

            AuditLogRepo.log(
                'STOCK_OUT',
                'PRODUCT',
                productId,
                `Removed ${quantity} units — ${reason}`,
                { stock_quantity: previousStock },
                { stock_quantity: newStock },
            );
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },

    /**
     * Adjust stock to exact quantity
     */
    async adjustStock(productId: number, newQuantity: number, reason: string): Promise<void> {
        const product = await get<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [
            productId,
        ]);
        if (!product) throw new Error(`Product ${productId} not found`);
        const previousStock = product.stock_quantity;

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            await executeNoSave("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [
                newQuantity,
                productId,
            ]);

            await executeNoSave(
                `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason)
           VALUES (?, 'adjustment', ?, ?, ?, ?)`,
                [productId, Math.abs(newQuantity - previousStock), previousStock, newQuantity, reason],
            );

            await executeNoSave('COMMIT;');
            triggerSave();

            AuditLogRepo.log(
                'STOCK_ADJUST',
                'PRODUCT',
                productId,
                `Adjusted stock to ${newQuantity} — ${reason}`,
                { stock_quantity: previousStock },
                { stock_quantity: newQuantity },
            );
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },
};
