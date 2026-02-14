/**
 * Database Connection Manager
 * Uses sql.js (pure JS SQLite) — works in both Electron main + renderer
 * Persists database to the filesystem via Electron IPC (or localStorage fallback)
 */

import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import { SCHEMA_SQL } from './schema';

let db: SqlJsDatabase | null = null;
let isInitialized = false;

const DB_STORAGE_KEY = 'supermarket_pro_db';
const DB_VERSION_KEY = 'supermarket_pro_db_version';
const CURRENT_DB_VERSION = 4; // Add pos_quick_access table

/**
 * Helper to query table info (used during migrations)
 */
function queryTables<T = Record<string, unknown>>(database: SqlJsDatabase, sql: string): T[] {
    const stmt = database.prepare(sql);
    const results: T[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
}

/**
 * Run migrations to update existing database schema
 */
function runMigrations(database: SqlJsDatabase): void {
    try {
        const savedVersion = parseInt(localStorage.getItem(DB_VERSION_KEY) || '0');

        if (savedVersion >= CURRENT_DB_VERSION) return;

        console.log(`🔄 Running database migrations from version ${savedVersion} to ${CURRENT_DB_VERSION}...`);

        // Migration to version 2 and 3 (create cashier_sessions table and add columns)
        if (savedVersion < 3) {
            // Check if cashier_sessions table exists
            const tables = queryTables<{ name: string }>(database, "SELECT name FROM sqlite_master WHERE type='table' AND name='cashier_sessions'");
            if (tables.length === 0) {
                console.log('  → Creating cashier_sessions table...');
                try {
                    database.run(`
                        CREATE TABLE IF NOT EXISTS cashier_sessions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            cashier_id INTEGER NOT NULL,
                            login_time TEXT DEFAULT (datetime('now')),
                            logout_time TEXT,
                            opening_cash REAL DEFAULT 0,
                            closing_cash REAL,
                            expected_cash REAL,
                            cash_difference REAL,
                            status TEXT DEFAULT 'active',
                            notes TEXT DEFAULT '',
                            created_at TEXT DEFAULT (datetime('now'))
                        )
                    `);
                    database.run('CREATE INDEX IF NOT EXISTS idx_cashier_sessions_cashier ON cashier_sessions(cashier_id)');
                    database.run('CREATE INDEX IF NOT EXISTS idx_cashier_sessions_status ON cashier_sessions(status)');
                    database.run('CREATE INDEX IF NOT EXISTS idx_cashier_sessions_login ON cashier_sessions(login_time)');
                    console.log('  ✓ cashier_sessions table created successfully');
                } catch (err) {
                    console.error('  ✗ Error creating cashier_sessions table:', err);
                }
            }

            // Check if column exists in sales
            const columns = queryTables<{ name: string }>(database, "PRAGMA table_info(sales)");
            const hasSessionId = columns.some(col => col.name === 'session_id');

            if (!hasSessionId) {
                console.log('  → Adding session_id column to sales table...');
                try {
                    database.run('ALTER TABLE sales ADD COLUMN session_id INTEGER');
                    console.log('  ✓ session_id column added successfully');
                } catch (err) {
                    console.error('  ✗ Error adding session_id column:', err);
                }
            }

            // Check if pin_code column exists in users
            const userColumns = queryTables<{ name: string }>(database, "PRAGMA table_info(users)");
            const hasPinCode = userColumns.some(col => col.name === 'pin_code');

            if (!hasPinCode) {
                console.log('  → Adding pin_code column to users table...');
                try {
                    database.run('ALTER TABLE users ADD COLUMN pin_code TEXT');
                    console.log('  ✓ pin_code column added successfully');
                } catch (err) {
                    console.error('  ✗ Error adding pin_code column:', err);
                }
            }

            console.log('  ✓ Migrations for v3 completed');
        }

        // Migration to version 4 (pos_quick_access table)
        if (savedVersion < 4) {
            console.log('  → Creating pos_quick_access table...');
            try {
                database.run(`
                    CREATE TABLE IF NOT EXISTS pos_quick_access (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                        display_name TEXT NOT NULL,
                        icon TEXT DEFAULT 'ShoppingBag',
                        color TEXT DEFAULT 'text-zinc-500',
                        bg_color TEXT DEFAULT 'bg-zinc-50',
                        options TEXT DEFAULT '[]', -- JSON array of { label, qty, price }
                        created_at TEXT DEFAULT (datetime('now')),
                        updated_at TEXT DEFAULT (datetime('now'))
                    )
                `);
                database.run('CREATE INDEX IF NOT EXISTS idx_quick_access_product ON pos_quick_access(product_id)');
                console.log('  ✓ pos_quick_access table created successfully');
            } catch (err) {
                console.error('  ✗ Error creating pos_quick_access table:', err);
            }
        }

        // Update version
        localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
    } catch (e) {
        console.error('Migration error:', e);
    }
}

/**
 * Reset the database (clear all data) - use this if migrations fail
 */
export function resetDatabase(): void {
    localStorage.removeItem(DB_STORAGE_KEY);
    localStorage.removeItem(DB_VERSION_KEY);
    console.log('🗑️ Database reset. Reload the app to create a fresh database.');
}

/**
 * Initialize the database. Must be called once on app startup.
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
    if (db && isInitialized) return db;

    const SQL = await initSqlJs({
        locateFile: (file: string) => `/${file}`,
    });

    // Try to load persisted database
    const savedData = localStorage.getItem(DB_STORAGE_KEY);
    if (savedData) {
        try {
            const binaryArray = Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
            db = new SQL.Database(binaryArray);
        } catch (e) {
            console.error('Failed to load saved database, creating new one:', e);
            db = new SQL.Database();
        }
    } else {
        db = new SQL.Database();
    }

    // Apply schema (CREATE IF NOT EXISTS — safe to run multiple times)
    db.run(SCHEMA_SQL);

    // Run migrations for existing databases
    runMigrations(db);

    // Enable WAL mode and foreign keys
    try {
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA foreign_keys = ON;');
    } catch (e) {
        console.warn('PRAGMA settings failed (non-critical):', e);
    }

    isInitialized = true;

    // Persist after schema init
    saveDatabase();

    return db;
}

/**
 * Get the current database instance.
 * Throws if not initialized.
 */
export function getDatabase(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Save the database to localStorage (persists across sessions).
 * In a production Electron app, this would save to a file via IPC.
 */
export function saveDatabase(): void {
    if (!db) return;
    try {
        const data = db.export();
        // Convert Uint8Array to base64 in chunks to avoid stack overflow
        const chunkSize = 65536; // Process 64KB at a time
        let base64 = '';
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            base64 += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        localStorage.setItem(DB_STORAGE_KEY, btoa(base64));
    } catch (e) {
        console.error('Failed to save database:', e);
    }
}

/**
 * Execute a query and return results as typed objects.
 */
export function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
}

/**
 * Execute a write statement (INSERT, UPDATE, DELETE) and auto-save.
 */
let inTransaction = false;

/**
 * Execute a write statement (INSERT, UPDATE, DELETE) and auto-save.
 */
export function execute(sql: string, params: unknown[] = []): void {
    const database = getDatabase();
    database.run(sql, params);
    if (!inTransaction) {
        saveDatabase();
    }
}

/**
 * Run multiple statements in a transaction.
 */
export function transaction<T>(fn: () => T): T {
    const database = getDatabase();

    // Simple support for nested transactions logic (flattened) or blocking
    if (inTransaction) {
        // Already in a transaction, just run the function
        // Note: This relies on the outer transaction to commit/rollback
        return fn();
    }

    inTransaction = true;
    database.run('BEGIN TRANSACTION;');
    try {
        const result = fn();
        database.run('COMMIT;');
        inTransaction = false;
        saveDatabase();
        return result;
    } catch (err) {
        try {
            database.run('ROLLBACK;');
        } catch (rollbackErr) {
            console.error('Rollback failed (likely no active transaction):', rollbackErr);
        }
        inTransaction = false;
        throw err;
    }
}

/**
 * Get the ID of the last inserted row.
 */
export function lastInsertId(): number {
    const result = query<{ id: number }>('SELECT last_insert_rowid() as id');
    return result[0]?.id ?? 0;
}
