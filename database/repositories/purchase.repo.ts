import { query, execute, lastInsertId, transaction } from '../db';
import type { PurchaseOrder, PurchaseOrderItem } from '../../src/lib/types';

export const PurchaseRepo = {
    getAll(): PurchaseOrder[] {
        return query<PurchaseOrder>(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.created_at DESC
        `);
    },

    getById(id: number): PurchaseOrder | null {
        const pos = query<PurchaseOrder>(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `, [id]);
        return pos.length > 0 ? pos[0] : null;
    },

    getItems(purchaseOrderId: number): PurchaseOrderItem[] {
        return query<PurchaseOrderItem>(`
            SELECT poi.*, p.name as product_name
            FROM purchase_order_items poi
            LEFT JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
        `, [purchaseOrderId]);
    },

    create(order: { supplier_id: number; status: string; notes?: string; items: { product_id: number; quantity: number; unit_cost: number }[] }): number {
        return transaction(() => {
            // 1. Create PO
            execute(`
                INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount, paid_amount, notes)
                VALUES (?, datetime('now'), ?, 0, 0, ?)
            `, [order.supplier_id, order.status, order.notes || '']);

            const poId = lastInsertId();
            let totalAmount = 0;

            // 2. Create Items
            for (const item of order.items) {
                const lineTotal = item.quantity * item.unit_cost;
                execute(`
                    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost, received_quantity)
                    VALUES (?, ?, ?, ?, ?, 0)
                `, [poId, item.product_id, item.quantity, item.unit_cost, lineTotal]);
                totalAmount += lineTotal;
            }

            // 3. Update PO Total
            execute(`UPDATE purchase_orders SET total_amount = ? WHERE id = ?`, [totalAmount, poId]);

            return poId;
        });
    },

    updateStatus(id: number, status: string): void {
        execute(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, id]);
    },

    // Receive items and update stock
    receive(id: number): void {
        transaction(() => {
            const po = this.getById(id);
            if (!po || po.status === 'received') return;

            const items = this.getItems(id);
            for (const item of items) {
                // Update product stock
                execute(`
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ?, 
                        cost_price = ?  -- Optionally update cost price to latest
                    WHERE id = ?
                `, [item.quantity, item.unit_cost, item.product_id]);

                // Log movement
                execute(`
                    INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id, reference_type, created_at)
                    SELECT id, 'in', ?, stock_quantity - ?, stock_quantity, 'Purchase Order Received', ?, 'purchase_order', datetime('now')
                    FROM products WHERE id = ?
                `, [item.quantity, item.quantity, id, item.product_id]);

                // Update received qty
                execute(`
                    UPDATE purchase_order_items SET received_quantity = quantity WHERE id = ?
                `, [item.id]);
            }

            // Mark PO as received
            execute(`UPDATE purchase_orders SET status = 'received' WHERE id = ?`, [id]);

            // Update supplier balance (assuming credit purchase -> we owe them)
            execute(`UPDATE suppliers SET balance = balance - ? WHERE id = ?`, [po.total_amount, po.supplier_id]);
        });
    }
};
