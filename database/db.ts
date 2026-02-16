/**
 * Database Connection Manager
 * Uses sql.js for SQLite database
 * 
 * PERSISTENCE STRATEGY:
 *  - When running inside Electron: saves to the file system via IPC
 *    (unlimited size, stored in AppData/data/database.sqlite)
 *  - When running in a browser (Vite dev): falls back to localStorage
 *    (5MB limit, for development only)
 * 
 * On first Electron launch, if a localStorage database exists but no
 * file-system database does, we automatically migrate the data.
 */

import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import { SCHEMA_SQL } from './schema';


// ============================================
// STATE
// ============================================

let sqlJsDb: SqlJsDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let isElectron = false;

const DB_STORAGE_KEY = 'supermarket_pro_db'; // Legacy localStorage key

// Simple query cache
const queryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

// Debounced save
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 500; // Batch saves within 500ms

// ============================================
// HELPERS — DETECT ENVIRONMENT
// ============================================

function detectElectron(): boolean {
    return typeof window !== 'undefined' &&
        typeof window.electronAPI !== 'undefined' &&
        typeof window.electronAPI.loadDatabase === 'function';
}

// ============================================
// FILE SYSTEM PERSISTENCE (Electron)
// ============================================

async function loadFromFileSystem(): Promise<Uint8Array | null> {
    try {
        const buffer = await window.electronAPI!.loadDatabase();
        if (buffer && buffer.byteLength > 0) {
            return new Uint8Array(buffer);
        }
        return null;
    } catch (err) {
        console.error('[DB] Failed to load from file system:', err);
        return null;
    }
}

async function saveToFileSystem(data: Uint8Array): Promise<void> {
    try {
        const result = await window.electronAPI!.saveDatabase(data);
        if (!result.success) {
            console.error('[DB] File system save failed:', result.error);
        }
    } catch (err) {
        console.error('[DB] Failed to save to file system:', err);
    }
}

// ============================================
// LOCALSTORAGE PERSISTENCE (Browser fallback)
// ============================================

function loadFromLocalStorage(): Uint8Array | null {
    try {
        const savedData = localStorage.getItem(DB_STORAGE_KEY);
        if (savedData) {
            return Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
        }
        return null;
    } catch (e) {
        console.error('[DB] Failed to load from localStorage:', e);
        return null;
    }
}

function saveToLocalStorage(data: Uint8Array): void {
    try {
        const chunkSize = 65536;
        let base64 = '';
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            base64 += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        localStorage.setItem(DB_STORAGE_KEY, btoa(base64));
    } catch (e) {
        console.error('[DB] Failed to save to localStorage:', e);
    }
}

// ============================================
// UNIFIED SAVE / LOAD
// ============================================

async function loadDatabaseBinary(): Promise<Uint8Array | null> {
    if (isElectron) {
        // Try file system first
        const fsData = await loadFromFileSystem();
        if (fsData) return fsData;

        // No file on disk — check if there's legacy localStorage data to migrate
        const lsData = loadFromLocalStorage();
        if (lsData) {
            console.log('[DB] 🔄 Migrating database from localStorage to file system...');
            await saveToFileSystem(lsData);
            // Clear localStorage after successful migration
            try { localStorage.removeItem(DB_STORAGE_KEY); } catch (_) { /* ignore */ }
            console.log('[DB] ✅ Migration complete!');
            return lsData;
        }

        return null;
    }

    // Browser mode — use localStorage
    return loadFromLocalStorage();
}

function saveDatabaseBinary(): void {
    if (!sqlJsDb) return;

    const data = sqlJsDb.export();

    if (isElectron) {
        // Debounce file system writes
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveToFileSystem(data);
        }, SAVE_DEBOUNCE_MS);
    } else {
        saveToLocalStorage(data);
    }
}

/** Force an immediate save (bypass debounce). Used before app close. */
async function saveDatabaseImmediate(): Promise<void> {
    if (!sqlJsDb) return;
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    const data = sqlJsDb.export();
    if (isElectron) {
        await saveToFileSystem(data);
    } else {
        saveToLocalStorage(data);
    }
}

// ============================================
// DATABASE INITIALIZATION
// ============================================

async function initDatabaseInternal(): Promise<void> {
    if (sqlJsDb) return;

    isElectron = detectElectron();
    console.log(`[DB] Environment: ${isElectron ? 'Electron (file system)' : 'Browser (localStorage)'}`);

    let SQL;
    try {
        SQL = await initSqlJs({
            locateFile: (file: string) => `/${file}`,
        });
    } catch (error: any) {
        console.error('[DB] Failed to initialize sql.js:', error);
        throw new Error(`Failed to initialize database: ${error.message}`);
    }

    // Load existing database
    const existingData = await loadDatabaseBinary();
    if (existingData) {
        try {
            sqlJsDb = new SQL.Database(existingData);
            console.log(`[DB] ✅ Database loaded (${(existingData.length / 1024).toFixed(1)} KB)`);
        } catch (e) {
            console.error('[DB] Failed to load saved database, creating new one:', e);
            sqlJsDb = new SQL.Database();
        }
    } else {
        sqlJsDb = new SQL.Database();
        console.log('[DB] 🆕 Created new empty database');
    }

    // Apply schema (CREATE IF NOT EXISTS — safe to run every time)
    sqlJsDb.run(SCHEMA_SQL);

    // Enable foreign keys
    try {
        sqlJsDb.run('PRAGMA foreign_keys = ON;');
    } catch (_) {
        // non-critical
    }

    // Persist after schema init
    saveDatabaseBinary();
}

// ============================================
// PUBLIC API
// ============================================

export async function initDatabase(): Promise<void> {
    if (isInitialized) return;

    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await initDatabaseInternal();
            isInitialized = true;
        } catch (error) {
            console.error('[DB] Database initialization failed:', error);
            throw error;
        }
    })();

    return initPromise;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!isInitialized) {
        await initDatabase();
    }

    if (!sqlJsDb) throw new Error('Database not initialized');

    // Check cache for read queries
    const cacheKey = sql + JSON.stringify(params);
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T[];
    }

    const stmt = sqlJsDb.prepare(sql);
    stmt.bind(params as any);

    const results: T[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }
    stmt.free();

    // Cache the results
    queryCache.set(cacheKey, { data: results, timestamp: Date.now() });

    return results;
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
    if (!isInitialized) {
        await initDatabase();
    }

    if (!sqlJsDb) throw new Error('Database not initialized');
    sqlJsDb.run(sql, params as any);
    queryCache.clear(); // Invalidate cache on writes
    saveDatabaseBinary();
}

/**
 * Execute SQL without saving — use for batch operations.
 * Call `triggerSave()` once after all batch operations complete.
 */
export async function executeNoSave(sql: string, params: unknown[] = []): Promise<void> {
    if (!isInitialized) {
        await initDatabase();
    }

    if (!sqlJsDb) throw new Error('Database not initialized');
    sqlJsDb.run(sql, params as any);
    queryCache.clear();
}

export async function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const results = await query<T>(sql, params);
    return results[0];
}

export async function lastInsertId(): Promise<number> {
    const result = await query<{ id: number }>('SELECT last_insert_rowid() as id');
    return result[0]?.id ?? 0;
}

export async function transactionOperations(operations: { sql: string; params?: unknown[] }[]): Promise<{ lastInsertRowid: number; changes: number }[]> {
    if (!isInitialized) {
        await initDatabase();
    }

    if (!sqlJsDb) throw new Error('Database not initialized');

    const results: { lastInsertRowid: number; changes: number }[] = [];

    try {
        sqlJsDb.run('BEGIN TRANSACTION;');

        for (const op of operations) {
            sqlJsDb.run(op.sql, (op.params || []) as any);
            const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id');
            results.push({
                lastInsertRowid: idResult[0]?.id ?? 0,
                changes: 1
            });
        }

        sqlJsDb.run('COMMIT;');
        queryCache.clear();
        saveDatabaseBinary();

        return results;
    } catch (error) {
        sqlJsDb.run('ROLLBACK;');
        throw error;
    }
}

// ============================================
// BACKUP & RESTORE
// ============================================

export async function backupDatabase(): Promise<string> {
    const data = sqlJsDb?.export();
    if (!data) throw new Error('No database to backup');

    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supermarket_backup_${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
    return a.download;
}

export async function restoreDatabase(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.db,.sqlite';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                resolve(false);
                return;
            }

            try {
                const buffer = await file.arrayBuffer();
                const uint8 = new Uint8Array(buffer);

                const SQL = await initSqlJs({
                    locateFile: (file: string) => `/${file}`,
                });

                // Validate that the file is a valid SQLite database
                sqlJsDb = new SQL.Database(uint8);

                // Persist the restored database
                await saveDatabaseImmediate();

                // Reload the page to use the restored database
                window.location.reload();
                resolve(true);
            } catch (error) {
                reject(error);
            }
        };

        input.click();
    });
}

// ============================================
// UTILITIES
// ============================================

export function getDatabase(): SqlJsDatabase {
    if (!sqlJsDb) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return sqlJsDb;
}

export function triggerSave(): void {
    saveDatabaseBinary();
}

export function resetDatabase(): void {
    if (isElectron) {
        // In Electron, we don't remove the file — just reset in-memory
        sqlJsDb = null;
        isInitialized = false;
        queryCache.clear();
    } else {
        localStorage.removeItem(DB_STORAGE_KEY);
        sqlJsDb = null;
        isInitialized = false;
        queryCache.clear();
    }
}

/**
 * Get the file path where the database is stored (Electron only).
 * Returns null if running in browser mode.
 */
export async function getDatabaseFilePath(): Promise<string | null> {
    if (isElectron) {
        return window.electronAPI!.getDatabasePath();
    }
    return null;
}
