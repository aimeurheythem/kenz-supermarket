import { query, execute, lastInsertId } from '../db';
import type { StockMovement } from '../../src/lib/types';

export const StockRepo = {
    getMovements(filters?: { product_id?: number; type?: string; limit?: number }): StockMovement[] {
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
    addStock(productId: number, quantity: number, reason: string, referenceId?: number, referenceType?: string): void {
        const product = query<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
        if (!product[0]) throw new Error(`Product ${productId} not found`);

        const previousStock = product[0].stock_quantity;
        const newStock = previousStock + quantity;

        execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [newStock, productId]);

        execute(
            `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type)
       VALUES (?, 'in', ?, ?, ?, ?, ?, ?)`,
            [productId, quantity, previousStock, newStock, reason, referenceId || null, referenceType || null]
        );
    },

    /**
     * Remove stock manually (e.g., damaged goods, expired)
     */
    removeStock(productId: number, quantity: number, reason: string): void {
        const product = query<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
        if (!product[0]) throw new Error(`Product ${productId} not found`);

        const previousStock = product[0].stock_quantity;
        const newStock = Math.max(0, previousStock - quantity);

        execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [newStock, productId]);

        execute(
            `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason)
       VALUES (?, 'out', ?, ?, ?, ?)`,
            [productId, quantity, previousStock, newStock, reason]
        );
    },

    /**
     * Adjust stock to exact quantity
     */
    adjustStock(productId: number, newQuantity: number, reason: string): void {
        const product = query<{ stock_quantity: number }>('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
        if (!product[0]) throw new Error(`Product ${productId} not found`);

        const previousStock = product[0].stock_quantity;

        execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [newQuantity, productId]);

        execute(
            `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason)
       VALUES (?, 'adjustment', ?, ?, ?, ?)`,
            [productId, Math.abs(newQuantity - previousStock), previousStock, newQuantity, reason]
        );
    },
};
