import { query, execute, lastInsertId } from '../db';
import type { QuickAccessItem, QuickAccessItemInput } from '../../src/lib/types';

export const QuickAccessRepo = {
    getAll(): QuickAccessItem[] {
        const sql = `
            SELECT qa.*, COALESCE(p.name, 'Unknown Product') as product_name
            FROM pos_quick_access qa
            LEFT JOIN products p ON qa.product_id = p.id
            ORDER BY qa.created_at DESC
        `;
        const results = query<any>(sql);
        return results.map(row => ({
            ...row,
            options: JSON.parse(row.options || '[]')
        }));
    },

    getById(id: number): QuickAccessItem | undefined {
        const sql = `
            SELECT qa.*, COALESCE(p.name, 'Unknown Product') as product_name
            FROM pos_quick_access qa
            LEFT JOIN products p ON qa.product_id = p.id
            WHERE qa.id = ?
        `;
        const results = query<any>(sql, [id]);
        if (results.length === 0) return undefined;

        return {
            ...results[0],
            options: JSON.parse(results[0].options || '[]')
        };
    },

    create(input: QuickAccessItemInput): QuickAccessItem {
        execute(
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
        const id = lastInsertId();
        return this.getById(id)!;
    },

    update(id: number, input: Partial<QuickAccessItemInput>): QuickAccessItem {
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

        execute(`UPDATE pos_quick_access SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id)!;
    },

    delete(id: number): void {
        execute('DELETE FROM pos_quick_access WHERE id = ?', [id]);
    }
};
