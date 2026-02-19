import { query, execute, lastInsertId, get } from '../db';
import type { Supplier, SupplierInput } from '../../src/lib/types';
import { AuditLogRepo } from './audit-log.repo';

export const SupplierRepo = {
    async getAll(filters?: { search?: string; active_only?: boolean }): Promise<Supplier[]> {
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

    async getById(id: number): Promise<Supplier | undefined> {
        return get<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
    },

    async create(input: SupplierInput): Promise<Supplier> {
        await execute('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)', [
            input.name,
            input.contact_person || '',
            input.phone || '',
            input.email || '',
            input.address || '',
        ]);
        const id = await lastInsertId();

        AuditLogRepo.log('CREATE', 'SUPPLIER', id, `Created supplier: ${input.name}`, null, {
            name: input.name,
            phone: input.phone,
            email: input.email,
        });

        return this.getById(id) as Promise<Supplier>;
    },

    async update(id: number, input: Partial<SupplierInput>): Promise<Supplier> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.name !== undefined) {
            fields.push('name = ?');
            values.push(input.name);
        }
        if (input.contact_person !== undefined) {
            fields.push('contact_person = ?');
            values.push(input.contact_person);
        }
        if (input.phone !== undefined) {
            fields.push('phone = ?');
            values.push(input.phone);
        }
        if (input.email !== undefined) {
            fields.push('email = ?');
            values.push(input.email);
        }
        if (input.address !== undefined) {
            fields.push('address = ?');
            values.push(input.address);
        }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        const oldSupplier = await this.getById(id);
        await execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);

        AuditLogRepo.log('UPDATE', 'SUPPLIER', id, `Updated supplier #${id}`, oldSupplier, input);

        return this.getById(id) as Promise<Supplier>;
    },

    async updateBalance(id: number, amount: number): Promise<void> {
        await execute("UPDATE suppliers SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?", [
            amount,
            id,
        ]);
    },

    async delete(id: number): Promise<void> {
        const supplier = await this.getById(id);
        await execute('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);

        AuditLogRepo.log(
            'DELETE',
            'SUPPLIER',
            id,
            `Deactivated supplier: ${supplier?.name || id}`,
            { is_active: 1 },
            { is_active: 0 },
        );
    },

    async count(): Promise<number> {
        const result = await get<{ count: number }>('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');
        return result?.count ?? 0;
    },
};
