import { query, execute, lastInsertId, transaction } from '../db';
import type { Product, ProductInput } from '../../src/lib/types';

export const ProductRepo = {
    getAll(filters?: { category_id?: number; search?: string; low_stock?: boolean; active_only?: boolean }): Product[] {
        let sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
        const params: unknown[] = [];

        if (filters?.active_only !== false) {
            sql += ' AND p.is_active = 1';
        }
        if (filters?.category_id) {
            sql += ' AND p.category_id = ?';
            params.push(filters.category_id);
        }
        if (filters?.search) {
            sql += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters?.low_stock) {
            sql += ' AND p.stock_quantity <= p.reorder_level';
        }

        sql += ' ORDER BY p.name';
        return query<Product>(sql, params);
    },

    getById(id: number): Product | undefined {
        const results = query<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
            [id]
        );
        return results[0];
    },

    getByBarcode(barcode: string): Product | undefined {
        const results = query<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ?`,
            [barcode]
        );
        return results[0];
    },

    create(input: ProductInput): Product {
        execute(
            `INSERT INTO products (barcode, name, description, category_id, cost_price, selling_price, stock_quantity, reorder_level, unit, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.barcode || null,
                input.name,
                input.description || '',
                input.category_id || null,
                input.cost_price,
                input.selling_price,
                input.stock_quantity || 0,
                input.reorder_level || 10,
                input.unit || 'piece',
                input.image_url || '',
            ]
        );
        const id = lastInsertId();
        return this.getById(id)!;
    },

    update(id: number, input: Partial<ProductInput>): Product {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.barcode !== undefined) { fields.push('barcode = ?'); values.push(input.barcode); }
        if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
        if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
        if (input.category_id !== undefined) { fields.push('category_id = ?'); values.push(input.category_id); }
        if (input.cost_price !== undefined) { fields.push('cost_price = ?'); values.push(input.cost_price); }
        if (input.selling_price !== undefined) { fields.push('selling_price = ?'); values.push(input.selling_price); }
        if (input.stock_quantity !== undefined) { fields.push('stock_quantity = ?'); values.push(input.stock_quantity); }
        if (input.reorder_level !== undefined) { fields.push('reorder_level = ?'); values.push(input.reorder_level); }
        if (input.unit !== undefined) { fields.push('unit = ?'); values.push(input.unit); }
        if (input.image_url !== undefined) { fields.push('image_url = ?'); values.push(input.image_url); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id)!;
    },

    updateStock(id: number, newQuantity: number): void {
        execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [newQuantity, id]);
    },

    delete(id: number): void {
        execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    },

    count(): number {
        const result = query<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
        return result[0]?.count ?? 0;
    },

    getLowStock(): Product[] {
        return query<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= p.reorder_level AND p.is_active = 1
       ORDER BY (CAST(p.stock_quantity AS REAL) / p.reorder_level) ASC`
        );
    },
};
