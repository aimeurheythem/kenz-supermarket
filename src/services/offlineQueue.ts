/**
 * Offline Queue — stores pending sync operations in local SQLite.
 *
 * Operations are stored with a UUID v4 operation_id, entity, action,
 * payload, local_timestamp, sync_order counter, and field_hashes.
 * Per research.md decision #3.
 */

import { execute, query } from '../../database/db';

let syncOrderCounter = 0;

export interface QueuedOperation {
  id: string;
  operation_id: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  payload: string; // JSON string
  local_timestamp: number;
  sync_order: number;
  client_id: string;
  field_hashes: string; // JSON string
  status: 'pending' | 'synced' | 'failed';
}

/**
 * Initialize the sync_queue table in local SQLite.
 */
export async function initOfflineQueueTable(): Promise<void> {
  await execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      operation_id TEXT UNIQUE NOT NULL,
      entity TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      local_timestamp INTEGER NOT NULL,
      sync_order INTEGER NOT NULL,
      client_id TEXT NOT NULL,
      field_hashes TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    )
  `);

  // Load current max sync_order
  const rows = await query<{ max_order: number | null }>(
    `SELECT MAX(sync_order) as max_order FROM sync_queue`,
  );
  if (rows.length && rows[0].max_order != null) {
    syncOrderCounter = rows[0].max_order;
  }
}

/**
 * Enqueue a new operation in the offline queue.
 */
export async function enqueueOperation(
  entity: string,
  action: 'create' | 'update' | 'delete',
  payload: Record<string, unknown>,
  clientId: string,
  fieldHashes: Record<string, string> = {},
): Promise<string> {
  const operationId = crypto.randomUUID();
  const id = crypto.randomUUID();
  syncOrderCounter++;

  await execute(
    `INSERT INTO sync_queue (id, operation_id, entity, action, payload, local_timestamp, sync_order, client_id, field_hashes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      id,
      operationId,
      entity,
      action,
      JSON.stringify(payload),
      Date.now(),
      syncOrderCounter,
      clientId,
      JSON.stringify(fieldHashes),
      Date.now(),
    ],
  );

  return operationId;
}

/**
 * Get all pending operations ordered by sync_order.
 */
export async function getPendingOperations(): Promise<QueuedOperation[]> {
  return query<QueuedOperation>(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY sync_order ASC`,
  );
}

/**
 * Mark operations as synced by their operation_ids.
 */
export async function markOperationsSynced(operationIds: string[]): Promise<void> {
  if (!operationIds.length) return;
  const placeholders = operationIds.map(() => '?').join(',');
  await execute(
    `UPDATE sync_queue SET status = 'synced' WHERE operation_id IN (${placeholders})`,
    operationIds,
  );
}

/**
 * Mark operations as failed by their operation_ids.
 */
export async function markOperationsFailed(operationIds: string[]): Promise<void> {
  if (!operationIds.length) return;
  const placeholders = operationIds.map(() => '?').join(',');
  await execute(
    `UPDATE sync_queue SET status = 'failed' WHERE operation_id IN (${placeholders})`,
    operationIds,
  );
}

/**
 * Get pending operation count.
 */
export async function getPendingCount(): Promise<number> {
  const rows = await query<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM sync_queue WHERE status = 'pending'`);
  return rows.length ? rows[0].cnt : 0;
}

/**
 * Clean up synced operations (keep last 1000 for debugging).
 */
export async function cleanSyncedOperations(): Promise<void> {
  await execute(
    `DELETE FROM sync_queue WHERE status = 'synced' AND id NOT IN (
      SELECT id FROM sync_queue WHERE status = 'synced' ORDER BY created_at DESC LIMIT 1000
    )`,
  );
}
