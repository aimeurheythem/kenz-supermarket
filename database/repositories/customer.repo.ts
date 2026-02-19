import { query, execute, executeNoSave, triggerSave, get, lastInsertId } from '../db';
import type { Customer, CustomerInput } from '../../src/lib/types';

export const CustomerRepo = {
    async getAll(): Promise<Customer[]> {
        return query<Customer>('SELECT * FROM customers ORDER BY updated_at DESC');
    },

    async getById(id: number): Promise<Customer | undefined> {
        return get<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
    },

    async search(searchTerm: string): Promise<Customer[]> {
        const term = `%${searchTerm}%`;
        return query<Customer>(
            `SELECT * FROM customers 
             WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?
             ORDER BY full_name ASC LIMIT 20`,
            [term, term, term],
        );
    },

    async create(customer: CustomerInput): Promise<number> {
        await execute(
            `INSERT INTO customers (full_name, phone, email, address, notes, loyalty_points)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                customer.full_name,
                customer.phone || null,
                customer.email || null,
                customer.address || null,
                customer.notes || null,
                customer.loyalty_points || 0,
            ],
        );
        return lastInsertId();
    },

    async update(id: number, customer: Partial<Customer>): Promise<void> {
        // Build dynamic update query
        const fields: string[] = [];
        const values: any[] = [];

        if (customer.full_name !== undefined) {
            fields.push('full_name = ?');
            values.push(customer.full_name);
        }
        if (customer.phone !== undefined) {
            fields.push('phone = ?');
            values.push(customer.phone);
        }
        if (customer.email !== undefined) {
            fields.push('email = ?');
            values.push(customer.email);
        }
        if (customer.address !== undefined) {
            fields.push('address = ?');
            values.push(customer.address);
        }
        if (customer.notes !== undefined) {
            fields.push('notes = ?');
            values.push(customer.notes);
        }
        if (customer.loyalty_points !== undefined) {
            fields.push('loyalty_points = ?');
            values.push(customer.loyalty_points);
        }

        if (fields.length === 0) return;

        fields.push("updated_at = datetime('now')");
        values.push(id);

        await execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    async delete(id: number): Promise<void> {
        // Check if customer has sales
        const salesCount = await get<{ count: number }>('SELECT COUNT(*) as count FROM sales WHERE customer_id = ?', [
            id,
        ]);

        if (salesCount && salesCount.count > 0) {
            throw new Error('Cannot delete customer with existing sales history.');
        }

        await execute('DELETE FROM customers WHERE id = ?', [id]);
    },

    async addTransaction(
        customerId: number,
        type: 'debt' | 'payment',
        amount: number,
        referenceType?: 'sale' | 'payment',
        referenceId?: number,
        description?: string,
    ): Promise<void> {
        // Verify customer exists and read current debt for the transaction log
        const customer = await this.getById(customerId);
        if (!customer) throw new Error('Customer not found');

        const balanceChange = type === 'debt' ? amount : -amount;
        const newBalance = (customer.total_debt || 0) + balanceChange;

        try {
            await executeNoSave('BEGIN TRANSACTION;');

            await executeNoSave(
                `INSERT INTO customer_transactions (customer_id, type, amount, balance_after, reference_type, reference_id, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [customerId, type, amount, newBalance, referenceType || null, referenceId || null, description || null],
            );

            // Atomic debt update
            await executeNoSave(
                'UPDATE customers SET total_debt = total_debt + ?, updated_at = datetime("now") WHERE id = ?',
                [balanceChange, customerId],
            );

            await executeNoSave('COMMIT;');
            triggerSave();
        } catch (error) {
            await executeNoSave('ROLLBACK;');
            throw error;
        }
    },

    async getTransactions(customerId: number): Promise<any[]> {
        return query('SELECT * FROM customer_transactions WHERE customer_id = ? ORDER BY created_at DESC', [
            customerId,
        ]);
    },

    async getDebtors(): Promise<Customer[]> {
        return query<Customer>('SELECT * FROM customers WHERE total_debt > 0 ORDER BY total_debt DESC');
    },
};
