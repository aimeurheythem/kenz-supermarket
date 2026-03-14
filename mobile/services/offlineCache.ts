import * as SQLite from 'expo-sqlite';
import apiClient from './apiClient';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('supermarket_cache');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT,
        selling_price REAL DEFAULT 0,
        cost_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        category_id TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_edits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        method TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  return db;
}

export async function cacheProducts(): Promise<void> {
  const database = await getDb();
  try {
    const { data } = await apiClient.get('/products/', { params: { limit: 5000 } });
    const products = data.results || data || [];

    await database.runAsync('DELETE FROM products');
    for (const p of products) {
      await database.runAsync(
        'INSERT OR REPLACE INTO products (id, name, barcode, selling_price, cost_price, stock_quantity, category_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.barcode || null, p.selling_price || 0, p.cost_price || 0, p.stock_quantity || 0, p.category_id || null, JSON.stringify(p)],
      );
    }
  } catch {
    // Network error — keep existing cache
  }
}

export async function cacheCategories(): Promise<void> {
  const database = await getDb();
  try {
    const { data } = await apiClient.get('/categories/', { params: { limit: 1000 } });
    const categories = data.results || data || [];

    await database.runAsync('DELETE FROM categories');
    for (const c of categories) {
      await database.runAsync(
        'INSERT OR REPLACE INTO categories (id, name, data) VALUES (?, ?, ?)',
        [c.id, c.name, JSON.stringify(c)],
      );
    }
  } catch {
    // Network error — keep existing cache
  }
}

export async function getCachedProducts(search?: string): Promise<any[]> {
  const database = await getDb();
  if (search) {
    const rows = await database.getAllAsync(
      'SELECT data FROM products WHERE name LIKE ? OR barcode LIKE ? LIMIT 100',
      [`%${search}%`, `%${search}%`],
    );
    return rows.map((r: any) => JSON.parse(r.data));
  }
  const rows = await database.getAllAsync('SELECT data FROM products LIMIT 200');
  return rows.map((r: any) => JSON.parse(r.data));
}

export async function getCachedCategories(): Promise<any[]> {
  const database = await getDb();
  const rows = await database.getAllAsync('SELECT data FROM categories');
  return rows.map((r: any) => JSON.parse(r.data));
}

export async function queueEdit(entity: string, entityId: string, method: string, payload: object): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO pending_edits (entity, entity_id, method, payload) VALUES (?, ?, ?, ?)',
    [entity, entityId, method, JSON.stringify(payload)],
  );
}

export async function flushPendingEdits(): Promise<void> {
  const database = await getDb();
  const edits = await database.getAllAsync('SELECT * FROM pending_edits ORDER BY id ASC');

  for (const edit of edits as any[]) {
    try {
      const payload = JSON.parse(edit.payload);
      if (edit.method === 'POST') {
        await apiClient.post(`/${edit.entity}/`, payload);
      } else if (edit.method === 'PATCH') {
        await apiClient.patch(`/${edit.entity}/${edit.entity_id}/`, payload);
      } else if (edit.method === 'DELETE') {
        await apiClient.delete(`/${edit.entity}/${edit.entity_id}/`);
      }
      await database.runAsync('DELETE FROM pending_edits WHERE id = ?', [edit.id]);
    } catch {
      // Stop flushing on first failure — retry later
      break;
    }
  }
}

export async function syncCache(): Promise<void> {
  await flushPendingEdits();
  await Promise.all([cacheProducts(), cacheCategories()]);
}
