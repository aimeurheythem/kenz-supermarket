import { query, execute, lastInsertId, get, transactionOperations } from '../db';
import type { PurchaseOrder, PurchaseOrderItem } from '../../src/lib/types';

export const PurchaseRepo = {
    async getAll(): Promise<PurchaseOrder[]> {
        return query<PurchaseOrder>(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            ORDER BY po.created_at DESC
        `);
    },

    async getById(id: number): Promise<PurchaseOrder | null> {
        const pos = await query<PurchaseOrder>(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `, [id]);
        return pos.length > 0 ? pos[0] : null;
    },

    async getItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
        return query<PurchaseOrderItem>(`
            SELECT poi.*, p.name as product_name
            FROM purchase_order_items poi
            LEFT JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
        `, [purchaseOrderId]);
    },

    async create(order: { supplier_id: number; status: string; notes?: string; items: { product_id: number; quantity: number; unit_cost: number }[] }): Promise<number> {
        // Create PO
        await execute(`
            INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount, paid_amount, notes)
            VALUES (?, datetime('now'), ?, 0, 0, ?)
        `, [order.supplier_id, order.status, order.notes || '']);

        const poId = await lastInsertId();
        let totalAmount = 0;

        // Create Items
        for (const item of order.items) {
            const lineTotal = item.quantity * item.unit_cost;
            await execute(`
                INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost, received_quantity)
                VALUES (?, ?, ?, ?, ?, 0)
            `, [poId, item.product_id, item.quantity, item.unit_cost, lineTotal]);
            totalAmount += lineTotal;
        }

        // Update PO Total
        await execute(`UPDATE purchase_orders SET total_amount = ? WHERE id = ?`, [totalAmount, poId]);

        return poId;
    },

    async updateStatus(id: number, status: string): Promise<void> {
        await execute(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, id]);
    },

    // Receive items and update stock
    async receive(id: number): Promise<void> {
        const po = await this.getById(id);
        if (!po || po.status === 'received') return;

        const items = await this.getItems(id);
        for (const item of items) {
            // Update product stock
            await execute(`
                UPDATE products 
                SET stock_quantity = stock_quantity + ?, 
                    cost_price = ?  -- Optionally update cost price to latest
                WHERE id = ?
            `, [item.quantity, item.unit_cost, item.product_id]);

            // Update received quantity
            await execute(`
                UPDATE purchase_order_items 
                SET received_quantity = quantity 
                WHERE id = ?
            `, [item.id]);
        }

        // Mark as received
        await execute(`UPDATE purchase_orders SET status = 'received' WHERE id = ?`, [id]);
    },
};
