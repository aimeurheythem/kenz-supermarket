import { query, execute, lastInsertId, get } from '../db';
import type { User, UserInput } from '../../src/lib/types';
import bcrypt from 'bcryptjs';

// ============================================
// PASSWORD & PIN HASHING (bcrypt)
// ============================================

const BCRYPT_ROUNDS = 12;
const LEGACY_HASH_PREFIX = 'sh_';

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    // Handle legacy simpleHash passwords (sh_xxx_n format)
    if (hash.startsWith(LEGACY_HASH_PREFIX)) {
        return legacyVerify(password, hash);
    }
    return bcrypt.compare(password, hash);
}

async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
    // Handle legacy plaintext PINs (not a bcrypt hash)
    if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
        return pin === hash;
    }
    return bcrypt.compare(pin, hash);
}

// Legacy simpleHash verification — for migration only
function legacySimpleHash(password: string): string {
    let h = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        h = (h << 5) - h + char;
        h |= 0;
    }
    return 'sh_' + Math.abs(h).toString(36) + '_' + password.length;
}

function legacyVerify(password: string, hash: string): boolean {
    return legacySimpleHash(password) === hash;
}

// Safe column list — never expose password_hash or pin_code to frontend
const USER_SAFE_COLUMNS =
    "id, username, full_name, role, is_active, (CASE WHEN pin_code IS NOT NULL AND pin_code != '' THEN 1 ELSE 0 END) as has_pin, pin_length, last_login, created_at, updated_at";

// Internal column list — includes secrets for auth verification only
const USER_ALL_COLUMNS =
    'id, username, password_hash, pin_code, full_name, role, is_active, last_login, created_at, updated_at';

function stripSensitiveFields(user: User): User {
    const {
        password_hash: _password_hash,
        pin_code: _pin_code,
        ...safe
    } = user as User & { password_hash?: string; pin_code?: string };
    return safe as User;
}

export const UserRepo = {
    async hasAnyUsers(): Promise<boolean> {
        const result = await get<{ count: number }>('SELECT COUNT(*) as count FROM users');
        return (result?.count ?? 0) > 0;
    },

    async getAll(): Promise<User[]> {
        return query<User>(`SELECT ${USER_SAFE_COLUMNS} FROM users ORDER BY full_name`);
    },

    async getById(id: number): Promise<User | undefined> {
        return get<User>(`SELECT ${USER_SAFE_COLUMNS} FROM users WHERE id = ?`, [id]);
    },

    /** Internal only — includes password_hash & pin_code for auth verification */
    async _getByIdFull(id: number): Promise<(User & { password_hash: string; pin_code: string | null }) | undefined> {
        return get<User & { password_hash: string; pin_code: string | null }>(
            `SELECT ${USER_ALL_COLUMNS} FROM users WHERE id = ?`,
            [id],
        );
    },

    async getByUsername(username: string): Promise<User | undefined> {
        return get<User>(`SELECT ${USER_SAFE_COLUMNS} FROM users WHERE username = ?`, [username]);
    },

    /** Internal only — includes password_hash for auth verification */
    async _getByUsernameFull(username: string): Promise<(User & { password_hash: string }) | undefined> {
        return get<User & { password_hash: string }>(`SELECT ${USER_ALL_COLUMNS} FROM users WHERE username = ?`, [
            username,
        ]);
    },

    async create(input: UserInput): Promise<User> {
        const passwordHash = await hashPassword(input.password);
        const pinCode = input.pin_code ? await hashPin(input.pin_code) : null;
        const pinLength = input.pin_code ? input.pin_code.length : 4;
        await execute(
            'INSERT INTO users (username, password_hash, pin_code, pin_length, full_name, role) VALUES (?, ?, ?, ?, ?, ?)',
            [input.username, passwordHash, pinCode, pinLength, input.full_name, input.role],
        );
        const id = await lastInsertId();
        return this.getById(id) as Promise<User>;
    },

    async authenticate(username: string, password: string): Promise<User | null> {
        const user = await this._getByUsernameFull(username);
        if (!user || !user.is_active) return null;
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) return null;

        // Auto-migrate legacy hash to bcrypt on successful login
        if (user.password_hash.startsWith(LEGACY_HASH_PREFIX)) {
            const newHash = await hashPassword(password);
            await execute("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [
                newHash,
                user.id,
            ]);
        }

        // Update last login
        await execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return stripSensitiveFields(user);
    },

    /**
     * Authenticate cashier using PIN code (quick login for POS)
     */
    async authenticateWithPin(cashier_id: number, pin_code: string): Promise<User | null> {
        const user = await this._getByIdFull(cashier_id);
        if (!user || !user.is_active) return null;
        if (!user.pin_code) return null;

        const isValid = await verifyPin(pin_code, user.pin_code);
        if (!isValid) return null;

        // Auto-migrate legacy plaintext PIN to bcrypt on successful login
        if (!user.pin_code.startsWith('$2a$') && !user.pin_code.startsWith('$2b$')) {
            const newPinHash = await hashPin(pin_code);
            await execute("UPDATE users SET pin_code = ?, updated_at = datetime('now') WHERE id = ?", [
                newPinHash,
                user.id,
            ]);
        }

        // Update last login
        await execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        return stripSensitiveFields(user);
    },

    /**
     * Get all active cashiers (for dropdown selection)
     */
    async getActiveCashiers(): Promise<User[]> {
        return query<User>(`
            SELECT ${USER_SAFE_COLUMNS} FROM users 
            WHERE role = 'cashier' AND is_active = 1 
            ORDER BY full_name
        `);
    },

    async update(id: number, input: Partial<UserInput & { is_active?: number }>): Promise<User> {
        const fields: string[] = [];
        const values: unknown[] = [];

        if (input.username !== undefined) {
            fields.push('username = ?');
            values.push(input.username);
        }
        if (input.full_name !== undefined) {
            fields.push('full_name = ?');
            values.push(input.full_name);
        }
        if (input.role !== undefined) {
            fields.push('role = ?');
            values.push(input.role);
        }
        if (input.password !== undefined) {
            const hashedPassword = await hashPassword(input.password);
            fields.push('password_hash = ?');
            values.push(hashedPassword);
        }
        if (input.pin_code !== undefined) {
            const hashedPin = input.pin_code ? await hashPin(input.pin_code) : null;
            fields.push('pin_code = ?');
            values.push(hashedPin);
            fields.push('pin_length = ?');
            values.push(input.pin_code ? input.pin_code.length : 4);
        }
        if (input.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(input.is_active);
        }

        fields.push("updated_at = datetime('now')");
        values.push(id);

        await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id) as Promise<User>;
    },

    async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
        const user = await this._getByIdFull(id);
        if (!user) return false;

        const isValid = await verifyPassword(currentPassword, user.password_hash);
        if (!isValid) return false;

        const newHash = await hashPassword(newPassword);
        await execute("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [newHash, id]);
        return true;
    },

    async delete(id: number): Promise<void> {
        await execute('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
    },
};
