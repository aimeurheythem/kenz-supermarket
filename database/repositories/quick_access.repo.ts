import { query, execute, lastInsertId, get } from '../db';
import type { QuickAccessItem, QuickAccessItemInput } from '../../src/lib/types';

export const QuickAccessRepo = {
    async getAll(): Promise<QuickAccessItem[]> {
        const sql = `
            SELECT qa.*, COALESCE(p.name, 'Unknown Product') as product_name
            FROM pos_quick_access qa
            LEFT JOIN products p ON qa.product_id = p.id
            ORDER BY qa.created_at DESC
        `;
        const results = await query<any>(sql);
        return results.map(row => ({
            ...row,
            options: JSON.parse(row.options || '[]')
        }));
    },

    async getById(id: number): Promise<QuickAccessItem | undefined> {
        const sql = `
            SELECT qa.*, COALESCE(p.name, 'Unknown Product') as product_name
            FROM pos_quick_access qa
            LEFT JOIN products p ON qa.product_id = p.id
            WHERE qa.id = ?
        `;
        const result = await get<any>(sql, [id]);
        if (!result) return undefined;

        return {
            ...result,
            options: JSON.parse(result.options || '[]')
        };
    },

    async create(input: QuickAccessItemInput): Promise<QuickAccessItem> {
        await execute(
            `INSERT INTO pos_quick_access (product_id, display_name, icon, color, bg_color, options)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                input.product_id,
                input.display_name,
                input.icon || 'ShoppingBag',
                input.color || 'text-zinc-500',
                input.bg_color || 'bg-zinc-50',
                JSON.stringify(input.options || [])
            ]
        );
        const id = await lastInsertId();
        return this.getById(id) as Promise<QuickAccessItem>;
    },

    async update(id: number, input: Partial<QuickAccessItemInput>): Promise<QuickAccessItem> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.product_id !== undefined) { fields.push('product_id = ?'); values.push(input.product_id); }
        if (input.display_name !== undefined) { fields.push('display_name = ?'); values.push(input.display_name); }
        if (input.icon !== undefined) { fields.push('icon = ?'); values.push(input.icon); }
        if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }
        if (input.bg_color !== undefined) { fields.push('bg_color = ?'); values.push(input.bg_color); }
        if (input.options !== undefined) { fields.push('options = ?'); values.push(JSON.stringify(input.options)); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        await execute(`UPDATE pos_quick_access SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id) as Promise<QuickAccessItem>;
    },

    async delete(id: number): Promise<void> {
        await execute('DELETE FROM pos_quick_access WHERE id = ?', [id]);
    }
};
