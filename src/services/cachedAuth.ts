/**
 * Cached credential manager for offline POS login.
 *
 * Stores hashed credentials in local SQLite for offline PIN-based authentication.
 * Enforces 7-day expiry on cached refresh tokens (FR-019).
 */

import { getDatabase } from '../../database/db';

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedCredential {
  user_id: string;
  store_id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  pin_hash: string | null;
  pin_length: number;
  refresh_token: string;
  cached_at: number; // Unix timestamp ms
}

/**
 * Initialize the cached credentials table in local SQLite.
 */
export function initCachedCredentialsTable(): void {
  const db = getDatabase();
  db.run(`
    CREATE TABLE IF NOT EXISTS cached_credentials (
      user_id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      email TEXT NOT NULL,
      username TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      pin_hash TEXT,
      pin_length INTEGER DEFAULT 4,
      refresh_token TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    )
  `);
}

/**
 * Cache a user's credentials after successful online login.
 */
export function cacheCredentials(
  user: {
    id: string;
    store_id: string;
    email: string;
    username: string;
    full_name: string;
    role: string;
  },
  refreshToken: string,
  pinHash?: string | null,
  pinLength?: number,
): void {
  const db = getDatabase();
  db.run(
    `INSERT OR REPLACE INTO cached_credentials
     (user_id, store_id, email, username, full_name, role, pin_hash, pin_length, refresh_token, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.store_id,
      user.email,
      user.username,
      user.full_name,
      user.role,
      pinHash ?? null,
      pinLength ?? 4,
      refreshToken,
      Date.now(),
    ],
  );
}

/**
 * Get cached credentials for a user by username or email.
 * Returns null if no cached credential found or if expired.
 */
export function getCachedCredentials(identifier: string): CachedCredential | null {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM cached_credentials WHERE (email = ? OR username = ?) LIMIT 1`,
    [identifier, identifier],
  );
  if (!result.length || !result[0].values.length) return null;

  const cols = result[0].columns;
  const row = result[0].values[0];
  const data: Record<string, any> = {};
  cols.forEach((col: string, i: number) => {
    data[col] = row[i];
  });

  const credential = data as CachedCredential;

  // Check expiry
  if (Date.now() - credential.cached_at > CACHE_EXPIRY_MS) {
    // Expired — remove and return null
    clearCachedCredentials(credential.user_id);
    return null;
  }

  return credential;
}

/**
 * Get all cached users for this store (for offline cashier selection).
 */
export function getAllCachedUsers(storeId: string): CachedCredential[] {
  const db = getDatabase();
  const result = db.exec(
    `SELECT * FROM cached_credentials WHERE store_id = ? AND cached_at > ?`,
    [storeId, Date.now() - CACHE_EXPIRY_MS],
  );
  if (!result.length) return [];

  const cols = result[0].columns;
  return result[0].values.map((row: unknown[]) => {
    const data: Record<string, any> = {};
    cols.forEach((col: string, i: number) => {
      data[col] = row[i];
    });
    return data as CachedCredential;
  });
}

/**
 * Validate a PIN code offline using cached hash.
 * Uses time-constant comparison via subtle crypto.
 */
export async function validatePinOffline(userId: string, pin: string): Promise<boolean> {
  const db = getDatabase();
  const result = db.exec(
    `SELECT pin_hash, cached_at FROM cached_credentials WHERE user_id = ?`,
    [userId],
  );
  if (!result.length || !result[0].values.length) return false;

  const [pinHash, cachedAt] = result[0].values[0] as [string | null, number];

  // Check expiry
  if (Date.now() - (cachedAt as number) > CACHE_EXPIRY_MS) return false;

  if (!pinHash) return false;

  // Simple bcrypt comparison would happen here. Since we're in client-side JS
  // without bcrypt, we use a hashed comparison approach:
  // The pin_hash stored is the bcrypt hash from the server.
  // For offline validation, we re-hash and compare.
  // In the electron environment, bcryptjs is available:
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compareSync(pin, pinHash);
  } catch {
    // Fallback: simple hash comparison (less secure but functional)
    return false;
  }
}

/**
 * Get the cached refresh token for a user.
 */
export function getCachedRefreshToken(userId: string): string | null {
  const db = getDatabase();
  const result = db.exec(
    `SELECT refresh_token, cached_at FROM cached_credentials WHERE user_id = ?`,
    [userId],
  );
  if (!result.length || !result[0].values.length) return null;

  const [token, cachedAt] = result[0].values[0] as [string, number];

  // Check expiry
  if (Date.now() - cachedAt > CACHE_EXPIRY_MS) {
    clearCachedCredentials(userId);
    return null;
  }

  return token;
}

/**
 * Update the cached refresh token after a token refresh.
 */
export function updateCachedRefreshToken(userId: string, newToken: string): void {
  const db = getDatabase();
  db.run(
    `UPDATE cached_credentials SET refresh_token = ?, cached_at = ? WHERE user_id = ?`,
    [newToken, Date.now(), userId],
  );
}

/**
 * Remove cached credentials for a specific user.
 */
export function clearCachedCredentials(userId: string): void {
  const db = getDatabase();
  db.run(`DELETE FROM cached_credentials WHERE user_id = ?`, [userId]);
}

/**
 * Remove all expired cached credentials.
 */
export function cleanExpiredCredentials(): void {
  const db = getDatabase();
  db.run(`DELETE FROM cached_credentials WHERE cached_at < ?`, [Date.now() - CACHE_EXPIRY_MS]);
}
