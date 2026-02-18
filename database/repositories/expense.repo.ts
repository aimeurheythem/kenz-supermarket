import { execute, get, query, lastInsertId } from '../db';
import type { Expense, ExpenseInput } from '@/lib/types';
import { AuditLogRepo } from './audit-log.repo';

export class ExpenseRepo {
    static async create(expense: ExpenseInput): Promise<number> {
        await execute(
            `INSERT INTO expenses (description, amount, category, date, payment_method, user_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                expense.description,
                expense.amount,
                expense.category,
                expense.date || new Date().toISOString(),
                expense.payment_method || 'cash',
                expense.user_id || null
            ]
        );
        const id = await lastInsertId();

        AuditLogRepo.log('CREATE', 'EXPENSE', id,
            `Expense: ${expense.description} — ${expense.amount}`,
            null,
            { description: expense.description, amount: expense.amount, category: expense.category },
            expense.user_id || null
        );

        return id;
    }

    static async getAll(filters?: { startDate?: string; endDate?: string; category?: string }): Promise<Expense[]> {
        let sql = 'SELECT * FROM expenses WHERE 1=1';
        const params: any[] = [];

        if (filters?.startDate) {
            sql += ' AND date >= ?';
            params.push(filters.startDate);
        }

        if (filters?.endDate) {
            sql += ' AND date <= ?';
            params.push(filters.endDate);
        }

        if (filters?.category) {
            sql += ' AND category = ?';
            params.push(filters.category);
        }

        sql += ' ORDER BY date DESC';

        return await query<Expense>(sql, params);
    }

    static async delete(id: number): Promise<void> {
        const expense = await get<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
        await execute('DELETE FROM expenses WHERE id = ?', [id]);

        AuditLogRepo.log('DELETE', 'EXPENSE', id,
            `Deleted expense: ${expense?.description || id}`,
            expense ? { description: expense.description, amount: expense.amount, category: expense.category } : null,
            null
        );
    }

    static async getStats(startDate?: string, endDate?: string): Promise<{ total: number; byCategory: { category: string; total: number }[] }> {
        let dateFilter = '';
        const params: any[] = [];

        if (startDate) {
            dateFilter += ' AND date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            dateFilter += ' AND date <= ?';
            params.push(endDate);
        }

        const totalResult = await get<{ total: number }>(`SELECT SUM(amount) as total FROM expenses WHERE 1=1 ${dateFilter}`, params);

        const byCategory = await query<{ category: string; total: number }>(
            `SELECT category, SUM(amount) as total FROM expenses WHERE 1=1 ${dateFilter} GROUP BY category`,
            params
        );

        return {
            total: totalResult?.total || 0,
            byCategory: byCategory || []
        };
    }
}
