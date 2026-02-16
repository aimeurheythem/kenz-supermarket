import { query, execute, lastInsertId, get } from '../db';
import type { Product, ProductInput } from '../../src/lib/types';

import { AuditLogRepo } from './audit-log.repo';

export const ProductRepo = {
    async getAll(filters?: { category_id?: number; search?: string; low_stock?: boolean; active_only?: boolean }): Promise<Product[]> {
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

    async getById(id: number): Promise<Product | undefined> {
        return get<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
            [id]
        );
    },

    async getByBarcode(barcode: string): Promise<Product | undefined> {
        return get<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ?`,
            [barcode]
        );
    },

    async create(input: ProductInput): Promise<Product> {
        await execute(
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
        const id = await lastInsertId();
        const product = await this.getById(id) as Product;

        // Audit Log
        await AuditLogRepo.log('CREATE', 'PRODUCT', id, `Created product: ${product.name}`, null, product);

        return product;
    },

    async update(id: number, input: Partial<ProductInput>): Promise<Product> {
        const oldProduct = await this.getById(id);

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
        values.push(id); // For WHERE clause

        await execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        const newProduct = await this.getById(id) as Product;

        // Audit Log
        await AuditLogRepo.log('UPDATE', 'PRODUCT', id, `Updated product: ${newProduct.name}`, oldProduct, newProduct);

        return newProduct;
    },

    async updateStock(id: number, newQuantity: number): Promise<void> {
        const product = await this.getById(id);
        const oldQty = product?.stock_quantity;

        await execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [newQuantity, id]);

        await AuditLogRepo.log('UPDATE_STOCK', 'PRODUCT', id, `Updated stock for ${product?.name}`, { stock_quantity: oldQty }, { stock_quantity: newQuantity });
    },

    async delete(id: number): Promise<void> {
        const product = await this.getById(id);
        await execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);

        await AuditLogRepo.log('DELETE', 'PRODUCT', id, `Deleted (soft) product: ${product?.name}`, product, null);
    },

    async count(): Promise<number> {
        const result = await get<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
        return result?.count ?? 0;
    },

    async getLowStock(): Promise<Product[]> {
        return query<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= p.reorder_level AND p.is_active = 1
       ORDER BY (CAST(p.stock_quantity AS REAL) / p.reorder_level) ASC`
        );
    },
};
