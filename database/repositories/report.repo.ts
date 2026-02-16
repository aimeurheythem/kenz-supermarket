import { query } from '../db';

export interface SalesChartData {
    date: string;
    revenue: number;
    orders: number;
}

export interface TopProductData {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
}

export interface CashierPerformanceData {
    cashier_id: number;
    cashier_name: string;
    total_sales: number;
    total_transactions: number;
    average_order: number;
    total_sessions: number;
}

export interface CashierDailyPerformance {
    date: string;
    cashier_id: number;
    cashier_name: string;
    revenue: number;
    orders: number;
}

export interface SessionReport {
    session_id: number;
    cashier_name: string;
    login_time: string;
    logout_time: string;
    opening_cash: number;
    closing_cash: number;
    expected_cash: number;
    cash_difference: number;
    total_sales: number;
    total_transactions: number;
    status: string;
}

export const ReportRepo = {
    getSalesParams(period: 'today' | '7days' | '30days' | 'year'): { start: string, end: string } {
        const now = new Date();
        const end = now.toISOString();
        let start = new Date();

        if (period === 'today') start.setHours(0, 0, 0, 0);
        else if (period === '7days') start.setDate(now.getDate() - 7);
        else if (period === '30days') start.setDate(now.getDate() - 30);
        else if (period === 'year') start.setFullYear(now.getFullYear() - 1);

        return { start: start.toISOString(), end };
    },

    async getSalesChart(period: 'today' | '7days' | '30days' | 'year'): Promise<SalesChartData[]> {
        const { start, end } = this.getSalesParams(period);
        // SQLite doesn't natively support easy date generation for filling gaps, 
        // so we'll just query existing data and let frontend fill gaps or just show available points.
        // For 'year' we might group by month.

        const groupBy = period === 'year' ? '%Y-%m' : '%Y-%m-%d';

        return query<SalesChartData>(`
            SELECT 
                strftime('${groupBy}', sale_date) as date, 
                SUM(total) as revenue, 
                COUNT(id) as orders
            FROM sales 
            WHERE sale_date BETWEEN ? AND ? AND status = 'completed'
            GROUP BY date
            ORDER BY date ASC
        `, [start, end]);
    },

    async getTopProducts(limit: number = 5): Promise<TopProductData[]> {
        return query<TopProductData>(`
            SELECT 
                p.id,
                p.name, 
                SUM(si.quantity) as quantity_sold, 
                SUM(si.total) as revenue 
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            WHERE s.status = 'completed'
            GROUP BY p.id 
            ORDER BY revenue DESC 
            LIMIT ?
        `, [limit]);
    },

    async getCategoryPerformance(): Promise<{ name: string; value: number }[]> {
        return query<{ name: string; value: number }>(`
            SELECT 
                c.name, 
                COUNT(s.id) as value 
            FROM sales s
            JOIN sale_items si ON s.id = si.sale_id
            JOIN products p ON si.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE s.status = 'completed'
            GROUP BY c.id
        `);
    },

    // =============================================
    // CASHIER REPORTS
    // =============================================

    async getCashierPerformance(period: 'today' | '7days' | '30days' | 'year', cashierId?: number): Promise<CashierPerformanceData[]> {
        const { start, end } = this.getSalesParams(period);

        let sql = `
            SELECT 
                u.id as cashier_id,
                u.full_name as cashier_name,
                COALESCE(SUM(s.total), 0) as total_sales,
                COUNT(s.id) as total_transactions,
                COALESCE(AVG(s.total), 0) as average_order,
                COUNT(DISTINCT cs.id) as total_sessions
            FROM users u
            LEFT JOIN cashier_sessions cs ON u.id = cs.cashier_id 
                AND cs.login_time BETWEEN ? AND ?
            LEFT JOIN sales s ON cs.id = s.session_id AND s.status = 'completed'
            WHERE u.role = 'cashier' AND u.is_active = 1
        `;

        const params: unknown[] = [start, end];

        if (cashierId) {
            sql += ' AND u.id = ?';
            params.push(cashierId);
        }

        sql += `
            GROUP BY u.id
            ORDER BY total_sales DESC
        `;

        return query<CashierPerformanceData>(sql, params);
    },

    async getCashierDailyPerformance(period: 'today' | '7days' | '30days' | 'year', cashierId?: number): Promise<CashierDailyPerformance[]> {
        const { start, end } = this.getSalesParams(period);

        let sql = `
            SELECT 
                strftime('%Y-%m-%d', s.sale_date) as date,
                u.id as cashier_id,
                u.full_name as cashier_name,
                COALESCE(SUM(s.total), 0) as revenue,
                COUNT(s.id) as orders
            FROM users u
            LEFT JOIN cashier_sessions cs ON u.id = cs.cashier_id
            LEFT JOIN sales s ON cs.id = s.session_id AND s.status = 'completed'
            WHERE u.role = 'cashier' AND u.is_active = 1
                AND (s.sale_date BETWEEN ? AND ? OR s.sale_date IS NULL)
        `;

        const params: unknown[] = [start, end];

        if (cashierId) {
            sql += ' AND u.id = ?';
            params.push(cashierId);
        }

        sql += `
            GROUP BY date, u.id
            ORDER BY date DESC, revenue DESC
        `;

        return query<CashierDailyPerformance>(sql, params);
    },

    async getSessionReports(period: 'today' | '7days' | '30days' | 'year', cashierId?: number): Promise<SessionReport[]> {
        const { start, end } = this.getSalesParams(period);

        let sql = `
            SELECT 
                cs.id as session_id,
                u.full_name as cashier_name,
                cs.login_time,
                cs.logout_time,
                cs.opening_cash,
                cs.closing_cash,
                cs.expected_cash,
                cs.cash_difference,
                COALESCE(SUM(s.total), 0) as total_sales,
                COUNT(s.id) as total_transactions,
                cs.status
            FROM cashier_sessions cs
            JOIN users u ON cs.cashier_id = u.id
            LEFT JOIN sales s ON cs.id = s.session_id AND s.status = 'completed'
            WHERE cs.login_time BETWEEN ? AND ?
        `;

        const params: unknown[] = [start, end];

        if (cashierId) {
            sql += ' AND cs.cashier_id = ?';
            params.push(cashierId);
        }

        sql += `
            GROUP BY cs.id
            ORDER BY cs.login_time DESC
        `;

        return query<SessionReport>(sql, params);
    }
};
