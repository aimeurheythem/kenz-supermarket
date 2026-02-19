import { query, execute, executeNoSave, triggerSave, lastInsertId } from '../db';
import type { PurchaseOrder, PurchaseOrderItem } from '../../src/lib/types';
import { AuditLogRepo } from './audit-log.repo';

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
        const pos = await query<PurchaseOrder>(
            `
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.id = ?
        `,
            [id],
        );
        return pos.length > 0 ? pos[0] : null;
    },

    async getItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
        return query<PurchaseOrderItem>(
            `
            SELECT poi.*, p.name as product_name
            FROM purchase_order_items poi
            LEFT JOIN products p ON poi.product_id = p.id
            WHERE poi.purchase_order_id = ?
        `,
            [purchaseOrderId],
        );
    },

    async create(order: {
        supplier_id: number;
        status: string;
        notes?: string;
        items: { product_id: number; quantity: number; unit_cost: number }[];
    }): Promise<number> {
        try {
            await executeNoSave('BEGIN TRANSACTION;');

            // Create PO
            await executeNoSave(
                `
                INSERT INTO purchase_orders (supplier_id, order_date, status, total_amount, paid_amount, notes)
                VALUES (?, datetime('now'), ?, 0, 0, ?)
            `,
                [order.supplier_id, order.status, order.notes || ''],
            );

            const poId = await lastInsertId();
            let totalAmount = 0;

            // Create Items
            for (const item of order.items) {
                const lineTotal = item.quantity * item.unit_cost;
                await executeNoSave(
                    `
                    INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost, received_quantity)
                    VALUES (?, ?, ?, ?, ?, 0)
                `,
                    [poId, item.product_id, item.quantity, item.unit_cost, lineTotal],
                );
                totalAmount += lineTotal;
            }

            // Update PO Total
            await executeNoSave(`UPDATE purchase_orders SET total_amount = ? WHERE id = ?`, [totalAmount, poId]);

            await executeNoSave('COMMIT;');
            triggerSave();

            AuditLogRepo.log(
                'CREATE',
                'PURCHASE_ORDER',
                poId,
                `PO #${poId} — ${order.items.length} items, total ${totalAmount}`,
                null,
                {
                    supplier_id: order.supplier_id,
                    status: order.status,
                    total_amount: totalAmount,
                    item_count: order.items.length,
                },
            );

            return poId;
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },

    async updateStatus(id: number, status: string): Promise<void> {
        await execute(`UPDATE purchase_orders SET status = ? WHERE id = ?`, [status, id]);
    },

    // Receive items and update stock
    async receive(id: number): Promise<void> {
        const po = await this.getById(id);
        if (!po || po.status === 'received') return;

        const items = await this.getItems(id);

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            for (const item of items) {
                // Update product stock atomically
                await executeNoSave(
                    `
                    UPDATE products 
                    SET stock_quantity = stock_quantity + ?, 
                        cost_price = ?,
                        updated_at = datetime('now')
                    WHERE id = ?
                `,
                    [item.quantity, item.unit_cost, item.product_id],
                );

                // Update received quantity
                await executeNoSave(
                    `
                    UPDATE purchase_order_items 
                    SET received_quantity = quantity 
                    WHERE id = ?
                `,
                    [item.id],
                );
            }

            // Mark as received
            await executeNoSave(`UPDATE purchase_orders SET status = 'received' WHERE id = ?`, [id]);

            await executeNoSave('COMMIT;');
            triggerSave();

            AuditLogRepo.log(
                'RECEIVE',
                'PURCHASE_ORDER',
                id,
                `PO #${id} received — ${items.length} items`,
                { status: po.status },
                { status: 'received', items_received: items.length },
            );
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },
};
