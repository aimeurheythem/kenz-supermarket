import { query, execute, lastInsertId } from '../db';
import type { User, UserInput } from '../../src/lib/types';

// Simple hash function for demo purposes.
// In production, use bcryptjs in Electron main process.
function simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'sh_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function verifyHash(password: string, hash: string): boolean {
    return simpleHash(password) === hash;
}

export const UserRepo = {
    getAll(): User[] {
        return query<User>('SELECT * FROM users ORDER BY full_name');
    },

    getById(id: number): User | undefined {
        const results = query<User>('SELECT * FROM users WHERE id = ?', [id]);
        return results[0];
    },

    getByUsername(username: string): User | undefined {
        const results = query<User>('SELECT * FROM users WHERE username = ?', [username]);
        return results[0];
    },

    create(input: UserInput): User {
        const passwordHash = simpleHash(input.password);
        const pinCode = input.pin_code || null;
        execute(
            'INSERT INTO users (username, password_hash, pin_code, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [input.username, passwordHash, pinCode, input.full_name, input.role]
        );
        const id = lastInsertId();
        return this.getById(id)!;
    },

    authenticate(username: string, password: string): User | null {
        const user = this.getByUsername(username);
        if (!user || !user.is_active) return null;
        if (!verifyHash(password, user.password_hash)) return null;

        // Update last login
        execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return user;
    },

    /**
     * Authenticate cashier using PIN code (quick login for POS)
     */
    authenticateWithPin(cashier_id: number, pin_code: string): User | null {
        const user = this.getById(cashier_id);
        if (!user || !user.is_active) return null;
        if (!user.pin_code || user.pin_code !== pin_code) return null;

        // Update last login
        execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return user;
    },

    /**
     * Get all active cashiers (for dropdown selection)
     */
    getActiveCashiers(): User[] {
        return query<User>(`
            SELECT * FROM users 
            WHERE role = 'cashier' AND is_active = 1 
            ORDER BY full_name
        `);
    },

    update(id: number, input: Partial<UserInput & { is_active?: number }>): User {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username); }
        if (input.full_name !== undefined) { fields.push('full_name = ?'); values.push(input.full_name); }
        if (input.role !== undefined) { fields.push('role = ?'); values.push(input.role); }
        if (input.password !== undefined) { fields.push('password_hash = ?'); values.push(simpleHash(input.password)); }
        if (input.pin_code !== undefined) { fields.push('pin_code = ?'); values.push(input.pin_code); }
        if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id)!;
    },

    delete(id: number): void {
        execute('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
    },

    /**
     * Seed default admin user if no users exist.
     */
    seedDefault(): void {
        const admin = this.getByUsername('admin');
        if (!admin) {
            this.create({
                username: 'admin',
                password: 'admin123',
                full_name: 'System Administrator',
                role: 'admin',
            });
        }
    },
};
