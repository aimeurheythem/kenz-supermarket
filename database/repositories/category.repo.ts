import { query, execute, lastInsertId, transaction } from '../db';
import type { Category, CategoryInput } from '../../src/lib/types';

export const CategoryRepo = {
    getAll(): Category[] {
        return query<Category>('SELECT * FROM categories ORDER BY name');
    },

    getById(id: number): Category | undefined {
        const results = query<Category>('SELECT * FROM categories WHERE id = ?', [id]);
        return results[0];
    },

    create(input: CategoryInput): Category {
        execute(
            'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
            [input.name, input.description || '', input.color || '#6366f1']
        );
        const id = lastInsertId();
        return this.getById(id)!;
    },

    update(id: number, input: Partial<CategoryInput>): Category {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
        if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
        if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id)!;
    },

    delete(id: number): void {
        execute('DELETE FROM categories WHERE id = ?', [id]);
    },

    count(): number {
        const result = query<{ count: number }>('SELECT COUNT(*) as count FROM categories');
        return result[0]?.count ?? 0;
    },
};
