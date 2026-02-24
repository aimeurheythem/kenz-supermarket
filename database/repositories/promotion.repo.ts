import { query, execute, lastInsertId, get } from '../db';
import type { Promotion, PromotionInput, PromotionProduct } from '../../src/lib/types';
import { AuditLogRepo } from './audit-log.repo';

interface PromotionFilters {
    type?: string;
    status?: string;
    search?: string;
}

export const PromotionRepo = {
    async getAll(filters?: PromotionFilters): Promise<Promotion[]> {
        let sql = `
      SELECT p.*,
        CASE
          WHEN p.deleted_at IS NOT NULL THEN 'archived'
          WHEN p.end_date < datetime('now') THEN 'expired'
          WHEN p.start_date > datetime('now') AND p.status = 'active' THEN 'scheduled'
          ELSE p.status
        END AS effective_status
      FROM promotions p
      WHERE p.deleted_at IS NULL
    `;
        const params: unknown[] = [];

        if (filters?.type) {
            sql += ' AND p.type = ?';
            params.push(filters.type);
        }
        if (filters?.status) {
            if (filters.status === 'expired') {
                sql += " AND p.end_date < datetime('now') AND p.deleted_at IS NULL";
            } else if (filters.status === 'scheduled') {
                sql += " AND p.start_date > datetime('now') AND p.status = 'active'";
            } else {
                sql += ' AND p.status = ?';
                params.push(filters.status);
            }
        }
        if (filters?.search) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${filters.search}%`);
        }

        sql += ' ORDER BY p.created_at DESC';

        const promotions = await query<Promotion>(sql, params);

        // Fetch linked products for each promotion
        for (const promo of promotions) {
            promo.products = await this._getProducts(promo.id);
        }

        return promotions;
    },

    async getById(id: number): Promise<Promotion | undefined> {
        const promo = await get<Promotion>(
            `SELECT p.*,
        CASE
          WHEN p.deleted_at IS NOT NULL THEN 'archived'
          WHEN p.end_date < datetime('now') THEN 'expired'
          WHEN p.start_date > datetime('now') AND p.status = 'active' THEN 'scheduled'
          ELSE p.status
        END AS effective_status
      FROM promotions p
      WHERE p.id = ? AND p.deleted_at IS NULL`,
            [id],
        );
        if (!promo) return undefined;
        promo.products = await this._getProducts(id);
        return promo;
    },

    async create(input: PromotionInput): Promise<Promotion> {
        await execute(
            `INSERT INTO promotions (name, type, status, start_date, end_date, config)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                input.name,
                input.type,
                input.status || 'active',
                input.start_date,
                input.end_date,
                JSON.stringify(input.config),
            ],
        );
        const id = await lastInsertId();

        // Insert product associations
        for (const productId of input.product_ids) {
            await execute(
                'INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)',
                [id, productId],
            );
        }

        await AuditLogRepo.log('CREATE', 'PROMOTION', id, `Created promotion: ${input.name}`, null, input);

        return (await this.getById(id)) as Promotion;
    },

    async update(id: number, input: Partial<PromotionInput>): Promise<Promotion> {
        const oldPromotion = await this.getById(id);

        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.name !== undefined) {
            fields.push('name = ?');
            values.push(input.name);
        }
        if (input.type !== undefined) {
            fields.push('type = ?');
            values.push(input.type);
        }
        if (input.status !== undefined) {
            fields.push('status = ?');
            values.push(input.status);
        }
        if (input.start_date !== undefined) {
            fields.push('start_date = ?');
            values.push(input.start_date);
        }
        if (input.end_date !== undefined) {
            fields.push('end_date = ?');
            values.push(input.end_date);
        }
        if (input.config !== undefined) {
            fields.push('config = ?');
            values.push(JSON.stringify(input.config));
        }

        if (fields.length > 0) {
            fields.push("updated_at = datetime('now')");
            values.push(id);
            await execute(`UPDATE promotions SET ${fields.join(', ')} WHERE id = ?`, values);
        }

        // Update product associations if provided
        if (input.product_ids !== undefined) {
            await execute('DELETE FROM promotion_products WHERE promotion_id = ?', [id]);
            for (const productId of input.product_ids) {
                await execute(
                    'INSERT OR IGNORE INTO promotion_products (promotion_id, product_id) VALUES (?, ?)',
                    [id, productId],
                );
            }
        }

        await AuditLogRepo.log('UPDATE', 'PROMOTION', id, `Updated promotion: ${input.name || oldPromotion?.name}`, oldPromotion, input);

        return (await this.getById(id)) as Promotion;
    },

    async delete(id: number): Promise<void> {
        const promo = await this.getById(id);
        await execute("UPDATE promotions SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [id]);
        await AuditLogRepo.log('DELETE', 'PROMOTION', id, `Soft-deleted promotion: ${promo?.name}`, promo, null);
    },

    async getActiveForCheckout(): Promise<Promotion[]> {
        const promotions = await query<Promotion>(
            `SELECT p.*,
        CASE
          WHEN p.end_date < datetime('now') THEN 'expired'
          WHEN p.start_date > datetime('now') THEN 'scheduled'
          ELSE p.status
        END AS effective_status
      FROM promotions p
      WHERE p.deleted_at IS NULL
        AND p.status = 'active'
        AND p.start_date <= datetime('now')
        AND p.end_date >= datetime('now')
      ORDER BY p.created_at DESC`,
            [],
        );

        for (const promo of promotions) {
            promo.products = await this._getProducts(promo.id);
        }

        return promotions;
    },

    async count(filters?: PromotionFilters): Promise<number> {
        let sql = "SELECT COUNT(*) as count FROM promotions p WHERE p.deleted_at IS NULL";
        const params: unknown[] = [];

        if (filters?.type) {
            sql += ' AND p.type = ?';
            params.push(filters.type);
        }
        if (filters?.status) {
            sql += ' AND p.status = ?';
            params.push(filters.status);
        }
        if (filters?.search) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${filters.search}%`);
        }

        const result = await get<{ count: number }>(sql, params);
        return result?.count ?? 0;
    },

    async _getProducts(promotionId: number): Promise<PromotionProduct[]> {
        return query<PromotionProduct>(
            `SELECT pp.*, p.name as product_name, p.selling_price
       FROM promotion_products pp
       JOIN products p ON pp.product_id = p.id
       WHERE pp.promotion_id = ?`,
            [promotionId],
        );
    },
};
