import { query, execute, lastInsertId, get } from '../db';
import type { User, UserInput } from '../../src/lib/types';

// Simple hash for password (no external dependencies)
function simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'sh_' + Math.abs(hash).toString(36) + '_' + password.length;
}

function verifySimpleHash(password: string, hash: string): boolean {
    return simpleHash(password) === hash;
}

async function hashPassword(password: string): Promise<string> {
    return simpleHash(password);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return verifySimpleHash(password, hash);
}

export const UserRepo = {
    async getAll(): Promise<User[]> {
        return query<User>('SELECT * FROM users ORDER BY full_name');
    },

    async getById(id: number): Promise<User | undefined> {
        return get<User>('SELECT * FROM users WHERE id = ?', [id]);
    },

    async getByUsername(username: string): Promise<User | undefined> {
        return get<User>('SELECT * FROM users WHERE username = ?', [username]);
    },

    async create(input: UserInput): Promise<User> {
        const passwordHash = await hashPassword(input.password);
        const pinCode = input.pin_code || null;
        await execute(
            'INSERT INTO users (username, password_hash, pin_code, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [input.username, passwordHash, pinCode, input.full_name, input.role]
        );
        const id = await lastInsertId();
        return this.getById(id) as Promise<User>;
    },

    async authenticate(username: string, password: string): Promise<User | null> {
        const user = await this.getByUsername(username);
        if (!user || !user.is_active) return null;
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) return null;

        // Update last login
        await execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return user;
    },

    /**
     * Authenticate cashier using PIN code (quick login for POS)
     */
    async authenticateWithPin(cashier_id: number, pin_code: string): Promise<User | null> {
        const user = await this.getById(cashier_id);
        if (!user || !user.is_active) return null;
        if (!user.pin_code || user.pin_code !== pin_code) return null;

        // Update last login
        await execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return user;
    },

    /**
     * Get all active cashiers (for dropdown selection)
     */
    async getActiveCashiers(): Promise<User[]> {
        return query<User>(`
            SELECT * FROM users 
            WHERE role = 'cashier' AND is_active = 1 
            ORDER BY full_name
        `);
    },

    async update(id: number, input: Partial<UserInput & { is_active?: number }>): Promise<User> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.username !== undefined) { fields.push('username = ?'); values.push(input.username); }
        if (input.full_name !== undefined) { fields.push('full_name = ?'); values.push(input.full_name); }
        if (input.role !== undefined) { fields.push('role = ?'); values.push(input.role); }
        if (input.password !== undefined) { 
            const hashedPassword = await hashPassword(input.password);
            fields.push('password_hash = ?'); 
            values.push(hashedPassword); 
        }
        if (input.pin_code !== undefined) { fields.push('pin_code = ?'); values.push(input.pin_code); }
        if (input.is_active !== undefined) { fields.push('is_active = ?'); values.push(input.is_active); }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id) as Promise<User>;
    },

    async delete(id: number): Promise<void> {
        await execute('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
    },

    /**
     * Seed default admin user if no users exist.
     */
    async seedDefault(): Promise<void> {
        const admin = await this.getByUsername('admin');
        if (!admin) {
            await this.create({
                username: 'admin',
                password: 'admin123',
                full_name: 'System Administrator',
                role: 'admin',
            });
        }
    },
};
