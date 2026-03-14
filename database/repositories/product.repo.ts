import { query, execute, get } from '../db';
import type { Product, ProductInput } from '../../src/lib/types';

import { AuditLogRepo } from './audit-log.repo';

function normalizeImageUrl(image: unknown): string {
    if (typeof image !== 'string') return '';
    return image.trim();
}

function normalizeCategoryId(categoryId: unknown): string | number | null {
    if (categoryId == null || categoryId === '') return null;
    return categoryId as string | number;
}

export const ProductRepo = {
    async getAll(filters?: {
        category_id?: number;
        search?: string;
        low_stock?: boolean;
        active_only?: boolean;
    }): Promise<Product[]> {
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

        sql += ' ORDER BY p.id DESC';
        return query<Product>(sql, params);
    },

    async getById(id: number | string): Promise<Product | undefined> {
        return get<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
            [id],
        );
    },

    async getByBarcode(barcode: string): Promise<Product | undefined> {
        return get<Product>(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = ?`,
            [barcode],
        );
    },

    async create(input: ProductInput): Promise<Product> {
        const columns = await query<{ name: string; type: string; pk: number }>('PRAGMA table_info(products)');
        const idColumn = columns.find((column) => column.name === 'id');
        const usesIntegerPk = !!idColumn && /INT/i.test(idColumn.type || '');
        const categoryId = normalizeCategoryId(input.category_id);
        const imageUrl = normalizeImageUrl(input.image_url);

        try {
            if (usesIntegerPk) {
                await execute(
                    `INSERT INTO products (barcode, name, description, category_id, cost_price, selling_price, stock_quantity, reorder_level, unit, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        input.barcode || null,
                        input.name,
                        input.description || '',
                        categoryId,
                        input.cost_price,
                        input.selling_price,
                        input.stock_quantity || 0,
                        input.reorder_level || 10,
                        input.unit || 'piece',
                        imageUrl,
                    ],
                );

                // For INTEGER mode, query by name to get the product we just inserted
                let product = await get<Product>(
                    `SELECT p.*, c.name as category_name
                     FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE p.name = ?
                     ORDER BY p.id DESC
                     LIMIT 1`,
                    [input.name],
                );

                if (!product) {
                    // Retry with small delay
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    product = await get<Product>(
                        `SELECT p.*, c.name as category_name
                         FROM products p
                         LEFT JOIN categories c ON p.category_id = c.id
                         WHERE p.name = ?
                         ORDER BY p.id DESC
                         LIMIT 1`,
                        [input.name],
                    );
                }

                if (!product) {
                    throw new Error(`Failed to create product: "${input.name}"`);
                }

                // Audit Log
                await AuditLogRepo.log('CREATE', 'PRODUCT', product.id, `Created product: ${product.name}`, null, product);
                return product;
            } else {
                // UUID mode
                const id = crypto.randomUUID();
                await execute(
                    `INSERT INTO products (id, barcode, name, description, category_id, cost_price, selling_price, stock_quantity, reorder_level, unit, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        input.barcode || null,
                        input.name,
                        input.description || '',
                        categoryId,
                        input.cost_price,
                        input.selling_price,
                        input.stock_quantity || 0,
                        input.reorder_level || 10,
                        input.unit || 'piece',
                        imageUrl,
                    ],
                );

                let product = await this.getById(id);
                if (!product) {
                    // Retry with small delay
                    await new Promise((resolve) => setTimeout(resolve, 50));
                    product = await this.getById(id);
                }

                if (!product) {
                    throw new Error(`Failed to create product with ID ${id}`);
                }

                // Audit Log
                await AuditLogRepo.log('CREATE', 'PRODUCT', id, `Created product: ${product.name}`, null, product);
                return product;
            }
        } catch (error: unknown) {
            // Check if product with same barcode already exists (unique constraint recovery)
            if (input.barcode) {
                const existingByBarcode = await this.getByBarcode(input.barcode);
                if (existingByBarcode) {
                    console.warn(`[ProductRepo] Product with barcode "${input.barcode}" already exists, returning existing product`);
                    return existingByBarcode;
                }
            }
            // If not a barcode duplicate, throw the original error
            const err = error instanceof Error ? error : new Error(String(error));
            console.error('[ProductRepo.create] Failed:', err.message);
            throw err;
        }
    },

    async update(id: number | string, input: Partial<ProductInput>): Promise<Product> {
        const oldProduct = await this.getById(id);

        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.barcode !== undefined) {
            fields.push('barcode = ?');
            values.push(input.barcode);
        }
        if (input.name !== undefined) {
            fields.push('name = ?');
            values.push(input.name);
        }
        if (input.description !== undefined) {
            fields.push('description = ?');
            values.push(input.description);
        }
        if (input.category_id !== undefined) {
            fields.push('category_id = ?');
            values.push(normalizeCategoryId(input.category_id));
        }
        if (input.cost_price !== undefined) {
            fields.push('cost_price = ?');
            values.push(input.cost_price);
        }
        if (input.selling_price !== undefined) {
            fields.push('selling_price = ?');
            values.push(input.selling_price);
        }
        if (input.stock_quantity !== undefined) {
            fields.push('stock_quantity = ?');
            values.push(input.stock_quantity);
        }
        if (input.reorder_level !== undefined) {
            fields.push('reorder_level = ?');
            values.push(input.reorder_level);
        }
        if (input.unit !== undefined) {
            fields.push('unit = ?');
            values.push(input.unit);
        }
        if (input.image_url !== undefined) {
            fields.push('image_url = ?');
            values.push(normalizeImageUrl(input.image_url));
        }

        fields.push("updated_at = datetime('now')");
        values.push(id); // For WHERE clause

        await execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        const newProduct = (await this.getById(id)) as Product;

        // Audit Log
        await AuditLogRepo.log('UPDATE', 'PRODUCT', id, `Updated product: ${newProduct.name}`, oldProduct, newProduct);

        return newProduct;
    },

    async updateStock(id: number | string, newQuantity: number): Promise<void> {
        const product = await this.getById(id);
        const oldQty = product?.stock_quantity;

        await execute("UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?", [
            newQuantity,
            id,
        ]);

        await AuditLogRepo.log(
            'UPDATE_STOCK',
            'PRODUCT',
            id,
            `Updated stock for ${product?.name}`,
            { stock_quantity: oldQty },
            { stock_quantity: newQuantity },
        );
    },

    async delete(id: number | string): Promise<void> {
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
       ORDER BY (CAST(p.stock_quantity AS REAL) / p.reorder_level) ASC`,
        );
    },
};
