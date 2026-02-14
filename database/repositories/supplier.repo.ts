import { query, execute, lastInsertId } from '../db';
import type { Supplier, SupplierInput } from '../../src/lib/types';

export const SupplierRepo = {
    getAll(filters?: { search?: string; active_only?: boolean }): Supplier[] {
        let sql = 'SELECT * FROM suppliers WHERE 1=1';
        const params: unknown[] = [];

        if (filters?.active_only !== false) {
            sql += ' AND is_active = 1';
        }
        if (filters?.search) {
            sql += ' AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY name';
        return query<Supplier>(sql, params);
    },

    getById(id: number): Supplier | undefined {
        const results = query<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
        return results[0];
    },

    create(input: SupplierInput): Supplier {
        execute(
            'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
            [input.name, input.contact_person || '', input.phone || '', input.email || '', input.address || '']
        );
        const id = lastInsertId();
        return this.getById(id)!;
    },

    update(id: number, input: Partial<SupplierInput>): Supplier {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
        if (input.contact_person !== undefined) { fields.push('contact_person = ?'); values.push(input.contact_person); }
        if (input.phone !== undefined) { fields.push('phone = ?'); values.push(input.phone); }
        if (input.email !== undefined) { fields.push('email = ?'); values.push(input.email); }
        if (input.address !== undefined) { fields.push('address = ?'); values.push(input.address); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id)!;
    },

    updateBalance(id: number, amount: number): void {
        execute("UPDATE suppliers SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?", [amount, id]);
    },

    delete(id: number): void {
        execute('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
    },

    count(): number {
        const result = query<{ count: number }>('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');
        return result[0]?.count ?? 0;
    },
};
