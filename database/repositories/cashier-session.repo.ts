import { query, execute, lastInsertId, getDatabase, saveDatabase } from '../db';
import type { CashierSession, CashierSessionInput, SessionCloseInput } from '../../src/lib/types';

export const CashierSessionRepo = {
    /**
     * Get all sessions (with optional filters)
     */
    getAll(filters?: { cashier_id?: number; status?: string; date_from?: string; date_to?: string }): CashierSession[] {
        let sql = `
            SELECT cs.*, u.full_name as cashier_name
            FROM cashier_sessions cs
            JOIN users u ON cs.cashier_id = u.id
            WHERE 1=1
        `;
        const params: unknown[] = [];

        if (filters?.cashier_id) {
            sql += ' AND cs.cashier_id = ?';
            params.push(filters.cashier_id);
        }
        if (filters?.status) {
            sql += ' AND cs.status = ?';
            params.push(filters.status);
        }
        if (filters?.date_from) {
            sql += ' AND date(cs.login_time) >= date(?)';
            params.push(filters.date_from);
        }
        if (filters?.date_to) {
            sql += ' AND date(cs.login_time) <= date(?)';
            params.push(filters.date_to);
        }

        sql += ' ORDER BY cs.login_time DESC';
        return query<CashierSession>(sql, params);
    },

    /**
     * Get session by ID
     */
    getById(id: number): CashierSession | undefined {
        try {
            const results = query<CashierSession>(`
                SELECT cs.*, u.full_name as cashier_name
                FROM cashier_sessions cs
                LEFT JOIN users u ON cs.cashier_id = u.id
                WHERE cs.id = ?
            `, [id]);
            return results[0];
        } catch (error) {
            console.error('Error getting session by ID:', error);
            return undefined;
        }
    },

    /**
     * Get active session for a cashier
     */
    getActiveSession(cashier_id: number): CashierSession | undefined {
        const results = query<CashierSession>(`
            SELECT cs.*, u.full_name as cashier_name
            FROM cashier_sessions cs
            JOIN users u ON cs.cashier_id = u.id
            WHERE cs.cashier_id = ? AND cs.status = 'active'
            ORDER BY cs.login_time DESC
            LIMIT 1
        `, [cashier_id]);
        return results[0];
    },

    /**
     * Start a new cashier session (shift)
     */
    startSession(input: CashierSessionInput): CashierSession | null {
        try {
            console.log('CashierSessionRepo: Starting session for cashier', input.cashier_id, 'with opening cash:', input.opening_cash);
            
            // First verify the table exists
            const tableCheck = query<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='cashier_sessions'");
            console.log('CashierSessionRepo: Table check:', tableCheck);
            
            if (tableCheck.length === 0) {
                console.error('CashierSessionRepo: cashier_sessions table does not exist!');
                return null;
            }
            
            // Close any existing active sessions for this cashier first
            try {
                execute(`
                    UPDATE cashier_sessions 
                    SET status = 'force_closed', logout_time = datetime('now'), notes = 'Auto-closed: new session started'
                    WHERE cashier_id = ? AND status = 'active'
                `, [input.cashier_id]);
                console.log('CashierSessionRepo: Closed existing sessions');
            } catch (e) {
                console.log('CashierSessionRepo: No existing sessions to close or error:', e);
            }

            console.log('CashierSessionRepo: About to insert new session...');
            
            // Get database directly to have more control
            const database = getDatabase();
            let newSessionId = 0;
            
            try {
                // Close existing sessions first (outside transaction)
                database.run(`
                    UPDATE cashier_sessions 
                    SET status = 'force_closed', logout_time = datetime('now'), notes = 'Auto-closed: new session started'
                    WHERE cashier_id = ? AND status = 'active'
                `, [input.cashier_id]);
                
                // Insert new session
                console.log('CashierSessionRepo: Executing INSERT...');
                database.run(
                    'INSERT INTO cashier_sessions (cashier_id, opening_cash, status) VALUES (?, ?, ?)',
                    [input.cashier_id, input.opening_cash, 'active']
                );
                
                // Get the ID immediately after insert
                console.log('CashierSessionRepo: Getting last insert ID...');
                const stmt = database.prepare('SELECT last_insert_rowid() as id');
                stmt.step();
                const result = stmt.getAsObject() as { id: number };
                stmt.free();
                
                newSessionId = result.id;
                console.log('CashierSessionRepo: Got ID:', newSessionId);
                
                // Save database
                saveDatabase();
                
            } catch (insertError) {
                console.error('CashierSessionRepo: Insert failed:', insertError);
                return null;
            }
            
            if (!newSessionId || newSessionId === 0) {
                console.error('CashierSessionRepo: Invalid session ID after insert:', newSessionId);
                return null;
            }
            
            // Get the session directly from the table
            console.log('CashierSessionRepo: Fetching session with ID:', newSessionId);
            const session = this.getById(newSessionId);
            console.log('CashierSessionRepo: Retrieved session:', session);
            
            if (!session || !session.id) {
                console.error('CashierSessionRepo: Failed to retrieve created session');
                // Try to query all recent sessions for debugging
                const recentSessions = query<CashierSession>('SELECT * FROM cashier_sessions ORDER BY id DESC LIMIT 5');
                console.log('CashierSessionRepo: Recent sessions in table:', recentSessions);
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('CashierSessionRepo: Error starting session:', error);
            return null;
        }
    },

    /**
     * Close a cashier session
     */
    closeSession(input: SessionCloseInput): CashierSession {
        const session = this.getById(input.session_id);
        if (!session) throw new Error('Session not found');

        // Calculate expected cash (opening + all cash sales in this session)
        const cashSales = query<{ total: number }>(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM sales
            WHERE session_id = ? AND payment_method = 'cash' AND status = 'completed'
        `, [input.session_id]);

        const expected_cash = session.opening_cash + (cashSales[0]?.total ?? 0);
        const cash_difference = input.closing_cash - expected_cash;

        execute(`
            UPDATE cashier_sessions 
            SET 
                logout_time = datetime('now'),
                closing_cash = ?,
                expected_cash = ?,
                cash_difference = ?,
                status = 'closed',
                notes = COALESCE(?, notes)
            WHERE id = ?
        `, [input.closing_cash, expected_cash, cash_difference, input.notes || '', input.session_id]);

        return this.getById(input.session_id)!;
    },

    /**
     * Get session statistics
     */
    getSessionStats(session_id: number): {
        total_sales: number;
        total_transactions: number;
        cash_sales: number;
        card_sales: number;
        mobile_sales: number;
        average_order: number;
    } {
        const result = query<{
            total_sales: number;
            total_transactions: number;
            cash_sales: number;
            card_sales: number;
            mobile_sales: number;
        }>(`
            SELECT 
                COALESCE(SUM(total), 0) as total_sales,
                COUNT(*) as total_transactions,
                COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card_sales,
                COALESCE(SUM(CASE WHEN payment_method = 'mobile' THEN total ELSE 0 END), 0) as mobile_sales
            FROM sales
            WHERE session_id = ? AND status = 'completed'
        `, [session_id]);

        const stats = result[0] || {
            total_sales: 0,
            total_transactions: 0,
            cash_sales: 0,
            card_sales: 0,
            mobile_sales: 0
        };

        return {
            ...stats,
            average_order: stats.total_transactions > 0 
                ? stats.total_sales / stats.total_transactions 
                : 0
        };
    },

    /**
     * Get cashier performance report
     */
    getCashierPerformance(cashier_id: number, date_from?: string, date_to?: string): {
        total_sessions: number;
        total_sales: number;
        total_transactions: number;
        average_sale: number;
        total_hours: number;
    } {
        let sql = `
            SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(s.total), 0) as total_sales,
                COUNT(s.id) as total_transactions
            FROM cashier_sessions cs
            LEFT JOIN sales s ON cs.id = s.session_id AND s.status = 'completed'
            WHERE cs.cashier_id = ? AND cs.status = 'closed'
        `;
        const params: unknown[] = [cashier_id];

        if (date_from) {
            sql += ' AND date(cs.login_time) >= date(?)';
            params.push(date_from);
        }
        if (date_to) {
            sql += ' AND date(cs.login_time) <= date(?)';
            params.push(date_to);
        }

        const result = query<{
            total_sessions: number;
            total_sales: number;
            total_transactions: number;
        }>(sql, params);

        const stats = result[0] || { total_sessions: 0, total_sales: 0, total_transactions: 0 };

        return {
            total_sessions: stats.total_sessions,
            total_sales: stats.total_sales,
            total_transactions: stats.total_transactions,
            average_sale: stats.total_transactions > 0 ? stats.total_sales / stats.total_transactions : 0,
            total_hours: 0 // Could calculate from session times if needed
        };
    }
};
