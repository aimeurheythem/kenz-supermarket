import { query, execute, lastInsertId, get, transactionOperations, executeNoSave, triggerSave } from '../db';
import type { Sale, SaleItem, CartItem } from '../../src/lib/types';
import { AuditLogRepo } from './audit-log.repo';

export const SaleRepo = {
    async getAll(filters?: { from?: string; to?: string; status?: string; limit?: number }): Promise<Sale[]> {
        let sql = `
      SELECT s.*, u.full_name as user_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
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

    async getById(id: number): Promise<Sale | undefined> {
        return get<Sale>(
            `SELECT s.*, u.full_name as user_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
            [id]
        );
    },

    async getItems(saleId: number): Promise<SaleItem[]> {
        return query<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);
    },

    /**
     * Create a new sale from cart items.
     * Automatically updates stock and creates stock movement records.
     */
    async createFromCart(
        cart: CartItem[],
        payment: { method: string; customer_name?: string; customer_id?: number | null; tax_rate?: number; discount?: number },
        userId?: number,
        sessionId?: number
    ): Promise<Sale> {
        const subtotal = cart.reduce((sum, item) => {
            return sum + item.product.selling_price * item.quantity - item.discount;
        }, 0);

        const taxAmount = subtotal * (payment.tax_rate || 0);
        const discountAmount = payment.discount || 0;
        const total = subtotal + taxAmount - discountAmount;

        try {
            // Start transaction
            await executeNoSave('BEGIN TRANSACTION;');

            // Create sale record
            await executeNoSave(
                `INSERT INTO sales (user_id, session_id, customer_id, subtotal, tax_amount, discount_amount, total, payment_method, customer_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId || null,
                    sessionId || null,
                    payment.customer_id || null, // Linked customer
                    subtotal,
                    taxAmount,
                    discountAmount,
                    total,
                    payment.method || 'cash',
                    payment.customer_name || 'Walk-in Customer',
                ]
            );

            const saleId = await lastInsertId();

            // Handle Credit Payment
            if (payment.method === 'credit') {
                if (!payment.customer_id) {
                    throw new Error('Credit sales require a linked customer.');
                }

                // Atomic debt increment — no read-compute-write gap
                await executeNoSave(
                    'UPDATE customers SET total_debt = total_debt + ?, updated_at = datetime("now") WHERE id = ?',
                    [total, payment.customer_id]
                );

                // Read updated balance for the transaction log
                const updatedCustomer = await get<{ total_debt: number }>(
                    'SELECT total_debt FROM customers WHERE id = ?',
                    [payment.customer_id]
                );

                // Add Transaction Record
                await executeNoSave(
                    `INSERT INTO customer_transactions (customer_id, type, amount, balance_after, reference_type, reference_id, description)
                     VALUES (?, 'debt', ?, ?, 'sale', ?, 'Credit Sale')`,
                    [payment.customer_id, total, updatedCustomer?.total_debt ?? total, saleId]
                );
            }

            // Create sale items and update stock for each item
            for (const item of cart) {
                const itemTotal = item.product.selling_price * item.quantity - item.discount;

                // Validate stock inside the transaction — reject if insufficient
                const product = await get<{ stock_quantity: number; name: string }>(
                    "SELECT stock_quantity, name FROM products WHERE id = ?",
                    [item.product.id]
                );
                const previousStock = product?.stock_quantity ?? 0;

                if (previousStock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for "${product?.name || item.product.name}": requested ${item.quantity}, available ${previousStock}`
                    );
                }

                await executeNoSave(
                    `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, discount, total)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [saleId, item.product.id, item.product.name, item.quantity, item.product.selling_price, item.discount, itemTotal]
                );

                // Atomic stock decrement — no gap between read and write
                await executeNoSave(
                    "UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?), updated_at = datetime('now') WHERE id = ?",
                    [item.quantity, item.product.id]
                );
                const newStock = Math.max(0, previousStock - item.quantity);

                // Create stock movement
                await executeNoSave(
                    `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type)
                     VALUES (?, 'out', ?, ?, ?, 'Sale', ?, 'sale')`,
                    [item.product.id, item.quantity, previousStock, newStock, saleId]
                );
            }

            // Commit transaction
            await executeNoSave('COMMIT;');

            // Save database state
            triggerSave();

            // Return the created sale
            const sale = await this.getById(saleId);
            if (!sale) throw new Error(`Failed to retrieve created sale with ID ${saleId}`);

            // Audit log (non-critical — outside transaction)
            AuditLogRepo.log(
                'CREATE', 'SALE', saleId,
                `Sale #${saleId} — ${cart.length} items, total ${total}, payment: ${payment.method}`,
                null,
                { total, items: cart.length, payment_method: payment.method, customer_id: payment.customer_id || null },
                userId || null
            );

            return sale;
        } catch (error) {
            // Rollback on error
            await executeNoSave('ROLLBACK;');
            console.error('Transaction failed:', error);
            throw error;
        }
    },

    async updateStatus(saleId: number, status: 'completed' | 'refunded' | 'voided'): Promise<void> {
        await execute('UPDATE sales SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, saleId]);
    },

    /**
     * Process a refund for a sale.
     * Restores stock and marks sale as refunded.
     */
    async refundSale(saleId: number, reason: string = 'Customer Return'): Promise<void> {
        return this._reverseSale(saleId, 'refunded', reason);
    },

    /**
     * Void a sale (e.g. accidental entry).
     * Restores stock and marks sale as voided.
     */
    async voidSale(saleId: number, reason: string = 'Transaction Voided'): Promise<void> {
        return this._reverseSale(saleId, 'voided', reason);
    },

    /**
     * Helper to reverse a sale (Refund or Void).
     * @private
     */
    async _reverseSale(saleId: number, newStatus: 'refunded' | 'voided', reason: string): Promise<void> {
        const sale = await this.getById(saleId);
        if (!sale) throw new Error(`Sale ${saleId} not found`);
        if (sale.status === 'refunded' || sale.status === 'voided') {
            throw new Error(`Sale is already ${sale.status}`);
        }

        const items = await this.getItems(saleId);

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            // 1. Update Sale Status
            await executeNoSave(
                'UPDATE sales SET status = ?, updated_at = datetime("now") WHERE id = ?',
                [newStatus, saleId]
            );

            // 2. Restore Stock
            for (const item of items) {
                // Read current stock for movement log
                const product = await get<{ stock_quantity: number }>(
                    'SELECT stock_quantity FROM products WHERE id = ?',
                    [item.product_id]
                );

                if (product) { // Only if product still exists
                    const previousStock = product.stock_quantity;

                    // Atomic stock increment
                    await executeNoSave(
                        "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?",
                        [item.quantity, item.product_id]
                    );

                    // 3. Log Movement
                    await executeNoSave(
                        `INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type)
                         VALUES (?, 'return', ?, ?, ?, ?, ?, 'sale')`,
                        [item.product_id, item.quantity, previousStock, previousStock + item.quantity, reason, saleId]
                    );
                }
            }

            await executeNoSave('COMMIT;');
            triggerSave();

            // Audit log (non-critical — outside transaction)
            AuditLogRepo.log(
                newStatus === 'refunded' ? 'REFUND' : 'VOID', 'SALE', saleId,
                `Sale #${saleId} ${newStatus} — ${reason}`,
                { status: sale.status, total: sale.total },
                { status: newStatus, total: sale.total, items_restored: items.length }
            );
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            console.error(`Failed to ${newStatus} sale ${saleId}:`, error);
            throw error;
        }
    },

    async getTodayStats(): Promise<{ revenue: number; orders: number; profit: number }> {
        const revenueResult = await get<{ revenue: number; orders: number }>(
            `SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders
       FROM sales
       WHERE date(sale_date) = date('now') AND status = 'completed'`
        );

        const cogsResult = await get<{ cogs: number }>(
            `SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as cogs
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE date(s.sale_date) = date('now') AND s.status = 'completed'`
        );

        const revenue = revenueResult?.revenue || 0;
        const cogs = cogsResult?.cogs || 0;

        return {
            revenue,
            orders: revenueResult?.orders || 0,
            profit: revenue - cogs
        };
    },

    async getRecentSales(limit: number = 5): Promise<Sale[]> {
        return this.getAll({ limit, status: 'completed' });
    },

    /**
     * Revenue grouped by hour for today.
     */
    async getHourlyRevenue(): Promise<{ time: string; revenue: number }[]> {
        const today = new Date().toISOString().split('T')[0];
        const rows = await query<{ hour: string; revenue: number }>(
            `SELECT 
                printf('%02d:00', CAST(strftime('%H', sale_date) AS INTEGER)) as hour,
                COALESCE(SUM(total), 0) as revenue
             FROM sales
             WHERE date(sale_date) = ? AND status = 'completed'
             GROUP BY strftime('%H', sale_date)
             ORDER BY hour`,
            [today]
        );

        // Fill in missing hours (08:00 to 22:00)
        const allHours: { time: string; revenue: number }[] = [];
        for (let h = 8; h <= 22; h++) {
            const hourStr = `${h.toString().padStart(2, '0')}:00`;
            const found = rows.find(r => r.hour === hourStr);
            allHours.push({ time: hourStr, revenue: found?.revenue ?? 0 });
        }
        return allHours;
    },

    /**
     * Revenue grouped by day for the last 7 days.
     */
    async getDailyRevenue(): Promise<{ day: string; revenue: number }[]> {
        const rows = await query<{ day_label: string; revenue: number }>(
            `SELECT 
                CASE CAST(strftime('%w', sale_date) AS INTEGER)
                    WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue'
                    WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri'
                    WHEN 6 THEN 'Sat'
                END as day_label,
                date(sale_date) as sale_day,
                COALESCE(SUM(total), 0) as revenue
             FROM sales
             WHERE date(sale_date) >= date('now', '-6 days') AND status = 'completed'
             GROUP BY date(sale_date)
             ORDER BY sale_day`,
            []
        );

        // Fill in missing days
        const result: { day: string; revenue: number }[] = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = dayNames[d.getDay()];
            const dateStr = d.toISOString().split('T')[0];
            const found = rows.find(r => (r as any).sale_day === dateStr);
            result.push({ day: dayName, revenue: found?.revenue ?? 0 });
        }
        return result;
    },

    /**
     * Revenue grouped by month for the last 6 months.
     */
    async getMonthlyRevenue(): Promise<{ month: string; revenue: number }[]> {
        const rows = await query<{ month_label: string; month_key: string; revenue: number }>(
            `SELECT 
                CASE CAST(strftime('%m', sale_date) AS INTEGER)
                    WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
                    WHEN 4 THEN 'Apr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
                    WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug' WHEN 9 THEN 'Sep'
                    WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
                END as month_label,
                strftime('%Y-%m', sale_date) as month_key,
                COALESCE(SUM(total), 0) as revenue
             FROM sales
             WHERE date(sale_date) >= date('now', '-5 months', 'start of month') AND status = 'completed'
             GROUP BY strftime('%Y-%m', sale_date)
             ORDER BY month_key`,
            []
        );

        // Fill in missing months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const result: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = monthNames[d.getMonth()];
            const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const found = rows.find(r => r.month_key === monthKey);
            result.push({ month: monthName, revenue: found?.revenue ?? 0 });
        }
        return result;
    },

    /**
     * Peak hours: number of sales per 2-hour block today.
     */
    async getPeakHours(): Promise<{ hour: string; density: number }[]> {
        const today = new Date().toISOString().split('T')[0];
        const rows = await query<{ hour_block: number; sale_count: number }>(
            `SELECT 
                (CAST(strftime('%H', sale_date) AS INTEGER) / 2) * 2 as hour_block,
                COUNT(*) as sale_count
             FROM sales
             WHERE date(sale_date) = ? AND status = 'completed'
             GROUP BY hour_block
             ORDER BY hour_block`,
            [today]
        );

        // Fill all 2-hour blocks from 8 to 22
        const result: { hour: string; density: number }[] = [];
        for (let h = 8; h <= 20; h += 2) {
            const hourStr = `${h.toString().padStart(2, '0')}:00`;
            const found = rows.find(r => r.hour_block === h);
            result.push({ hour: hourStr, density: found?.sale_count ?? 0 });
        }
        return result;
    },

    /**
     * Top N products by total profit margin this month.
     */
    async getTopProductsByProfit(limit: number = 5): Promise<{ name: string; profit: number; total_sold: number }[]> {
        return query<{ name: string; profit: number; total_sold: number }>(
            `SELECT 
                p.name,
                SUM(si.quantity * (si.unit_price - p.cost_price)) as profit,
                SUM(si.quantity) as total_sold
             FROM sale_items si
             JOIN products p ON si.product_id = p.id
             JOIN sales s ON si.sale_id = s.id
             WHERE s.status = 'completed'
               AND date(s.sale_date) >= date('now', 'start of month')
             GROUP BY si.product_id
             ORDER BY profit DESC
             LIMIT ?`,
            [limit]
        );
    },
};
