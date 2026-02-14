import { query, execute, lastInsertId, transaction } from '../db';
import type { Sale, SaleItem, CartItem, StockMovement } from '../../src/lib/types';

export const SaleRepo = {
    getAll(filters?: { from?: string; to?: string; status?: string; limit?: number }): Sale[] {
        let sql = `
      SELECT s.*, u.full_name as user_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (filters?.from) {
            sql += ' AND s.sale_date >= ?';
            params.push(filters.from);
        }
        if (filters?.to) {
            sql += ' AND s.sale_date <= ?';
            params.push(filters.to);
        }
        if (filters?.status) {
            sql += ' AND s.status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY s.sale_date DESC';

        if (filters?.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        return query<Sale>(sql, params);
    },

    getById(id: number): Sale | undefined {
        const results = query<Sale>(
            `SELECT s.*, u.full_name as user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
            [id]
        );
        return results[0];
    },

    getItems(saleId: number): SaleItem[] {
        return query<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
    },

    /**
     * Create a new sale from cart items.
     * Automatically updates stock and creates stock movement records.
     */
    createFromCart(
        cart: CartItem[],
        payment: { method: string; customer_name?: string; tax_rate?: number; discount?: number },
        userId?: number,
        sessionId?: number
    ): Sale {
        let saleId = 0;

        transaction(() => {
            const subtotal = cart.reduce((sum, item) => {
                return sum + item.product.selling_price * item.quantity - item.discount;
            }, 0);

            const taxAmount = subtotal * (payment.tax_rate || 0);
            const discountAmount = payment.discount || 0;
            const total = subtotal + taxAmount - discountAmount;

            // Create sale record with session_id if provided
            execute(
                `INSERT INTO sales (user_id, session_id, subtotal, tax_amount, discount_amount, total, payment_method, customer_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId || null,
                    sessionId || null,
                    subtotal,
                    taxAmount,
                    discountAmount,
                    total,
                    payment.method || 'cash',
                    payment.customer_name || 'Walk-in Customer',
                ]
            );
            saleId = lastInsertId();

            // Create sale items and update stock
            for (const item of cart) {
                const itemTotal = item.product.selling_price * item.quantity - item.discount;

                execute(
                    `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, discount, total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [saleId, item.product.id, item.product.name, item.quantity, item.product.selling_price, item.discount, itemTotal]
                );

                // Update stock
                const previousStock = item.product.stock_quantity;
                const newStock = previousStock - item.quantity;

                execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [
                    newStock,
                    item.product.id,
                ]);

                // Create stock movement
                execute(
                    `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type)
           VALUES (?, 'out', ?, ?, ?, 'Sale', ?, 'sale')`,
                    [item.product.id, item.quantity, previousStock, newStock, saleId]
                );
            }
        });

        return this.getById(saleId)!;
    },

    getTodayStats(): { revenue: number; orders: number } {
        const result = query<{ revenue: number; orders: number }>(
            `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
       FROM sales
       WHERE date(sale_date) = date('now') AND status = 'completed'`
        );
        return result[0] || { revenue: 0, orders: 0 };
    },

    getRecentSales(limit: number = 5): Sale[] {
        return this.getAll({ limit, status: 'completed' });
    },
};
