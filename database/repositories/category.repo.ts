import { query, execute, lastInsertId, get } from '../db';
import type { Category, CategoryInput } from '../../src/lib/types';

export const CategoryRepo = {
    async getAll(): Promise<Category[]> {
        return query<Category>('SELECT * FROM categories ORDER BY name');
    },

    async getById(id: number): Promise<Category | undefined> {
        return get<Category>('SELECT * FROM categories WHERE id = ?', [id]);
    },

    async create(input: CategoryInput): Promise<Category> {
        await execute(
            'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
            [input.name, input.description || '', input.color || '#6366f1']
        );
        const id = await lastInsertId();
        return this.getById(id) as Promise<Category>;
    },

    async update(id: number, input: Partial<CategoryInput>): Promise<Category> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
        if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
        if (input.color !== undefined) { fields.push('color = ?'); values.push(input.color); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        await execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id) as Promise<Category>;
    },

    async delete(id: number): Promise<void> {
        await execute('DELETE FROM categories WHERE id = ?', [id]);
    },

    async count(): Promise<number> {
        const result = await get<{ count: number }>('SELECT COUNT(*) as count FROM categories');
        return result?.count ?? 0;
    },
};
