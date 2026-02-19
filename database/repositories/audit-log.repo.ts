import { execute, query } from '../db';

export interface AuditLog {
    id: number;
    user_id: number | null;
    user_name: string | null;
    action: string;
    entity: string;
    entity_id: string | null;
    details: string | null;
    old_value: any | null;
    new_value: any | null;
    ip_address: string | null;
    created_at: string;
}

export interface AuditLogFilters {
    userId?: number;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

export const AuditLogRepo = {
    log: async (
        action: string,
        entity: string,
        entityId: string | number | null,
        details: string | null,
        oldValue: any | null = null,
        newValue: any | null = null,
        userId: number | null = null,
    ) => {
        try {
            // Get user info if not provided but available in session (this would need access to store/context, usually passed in)
            // For now we rely on the caller passing userId, or we fetch it if we had a global context.
            // Since this runs in backend/repo layer, we might need to pass userId explicitly.

            let userName = null;
            if (userId) {
                const user = await query<{ full_name: string }>(`SELECT full_name FROM users WHERE id = ?`, [userId]);
                if (user && user[0]) userName = user[0].full_name;
            }

            await execute(
                `INSERT INTO audit_logs (
                    user_id, user_name, action, entity, entity_id, details, old_value, new_value
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    userName,
                    action,
                    entity,
                    entityId?.toString() || null,
                    details,
                    oldValue ? JSON.stringify(oldValue) : null,
                    newValue ? JSON.stringify(newValue) : null,
                ],
            );
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw, we don't want to block main actions if logging fails
        }
    },

    getLogs: async (filters: AuditLogFilters = {}) => {
        let sql = `SELECT * FROM audit_logs WHERE 1=1`;
        const params: any[] = [];

        if (filters.userId) {
            sql += ` AND user_id = ?`;
            params.push(filters.userId);
        }

        if (filters.entity) {
            sql += ` AND entity = ?`;
            params.push(filters.entity);
        }

        if (filters.action) {
            sql += ` AND action = ?`;
            params.push(filters.action);
        }

        if (filters.startDate) {
            sql += ` AND created_at >= ?`;
            params.push(filters.startDate.toISOString());
        }

        if (filters.endDate) {
            sql += ` AND created_at <= ?`;
            params.push(filters.endDate.toISOString());
        }

        // Count total
        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await query<{ total: number }>(countSql, params);
        const total = countResult[0]?.total || 0;

        // Pagination
        sql += ` ORDER BY created_at DESC`;

        if (filters.page && filters.limit) {
            const offset = (filters.page - 1) * filters.limit;
            sql += ` LIMIT ? OFFSET ?`;
            params.push(filters.limit, offset);
        } else {
            sql += ` LIMIT 50`; // Default limit
        }

        const logs = await query<AuditLog>(sql, params);

        // Parse JSON fields defensively
        return {
            logs: logs.map((log) => {
                let old_value = log.old_value;
                let new_value = log.new_value;
                try {
                    old_value = old_value ? JSON.parse(old_value) : null;
                } catch {
                    /* keep raw string */
                }
                try {
                    new_value = new_value ? JSON.parse(new_value) : null;
                } catch {
                    /* keep raw string */
                }
                return { ...log, old_value, new_value };
            }),
            total,
        };
    },
};
