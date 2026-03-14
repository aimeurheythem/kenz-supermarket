/**
 * SyncEngine — orchestrates push (flush queue), pull (incremental),
 * and full sync operations between the local POS SQLite and the
 * Django backend via /sync/ endpoints.
 *
 * Pull interval: 30 seconds while online (FR-018).
 * Full sync on first login (FR-018).
 */

import apiClient from './apiClient';
import {
  getPendingOperations,
  markOperationsSynced,
  markOperationsFailed,
  cleanSyncedOperations,
  type QueuedOperation,
} from './offlineQueue';
import { execute, query } from '../../database/db';

// Entity name → SQLite table name mapping
const ENTITY_TABLE_MAP: Record<string, string> = {
  category: 'categories',
  product: 'products',
  product_batch: 'product_batches',
  supplier: 'suppliers',
  purchase_order: 'purchase_orders',
  purchase_order_item: 'purchase_order_items',
  customer: 'customers',
  customer_transaction: 'customer_transactions',
  sale: 'sales',
  sale_item: 'sale_items',
  payment_entry: 'payment_entries',
  stock_movement: 'stock_movements',
  cashier_session: 'cashier_sessions',
  pos_quick_access: 'pos_quick_access',
  expense: 'expenses',
  audit_log: 'audit_logs',
  promotion: 'promotions',
  promotion_product: 'promotion_products',
  app_setting: 'app_settings',
  ticket_counter: 'ticket_counter',
  user: 'users',
};

const PULL_INTERVAL_MS = 30_000; // 30 seconds

type SyncStatus = 'idle' | 'pushing' | 'pulling' | 'full-sync' | 'error';
type SyncListener = (status: SyncStatus, detail?: string) => void;

let pullTimer: ReturnType<typeof setInterval> | null = null;
let lastPullTimestamp: string | null = null;
let currentStatus: SyncStatus = 'idle';
const listeners = new Set<SyncListener>();

function setStatus(status: SyncStatus, detail?: string) {
  currentStatus = status;
  for (const fn of listeners) fn(status, detail);
}

/** Subscribe to sync status changes. Returns unsubscribe function. */
export function onSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Get current sync status. */
export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

// ============================================
// PUSH — flush offline queue to backend
// ============================================

interface PushResult {
  accepted: string[];
  conflicts: Array<{ operation_id: string; resolved: Record<string, unknown> }>;
  rejected: Array<{ operation_id: string; error: string }>;
}

export async function pushSync(): Promise<PushResult> {
  const pending = await getPendingOperations();
  if (!pending.length) return { accepted: [], conflicts: [], rejected: [] };

  setStatus('pushing');

  const operations = pending.map((op: QueuedOperation) => ({
    operation_id: op.operation_id,
    entity: op.entity,
    action: op.action,
    payload: JSON.parse(op.payload),
    local_timestamp: new Date(op.local_timestamp).toISOString(),
    sync_order: op.sync_order,
    client_id: op.client_id,
    field_hashes: JSON.parse(op.field_hashes),
  }));

  try {
    const { data } = await apiClient.post<PushResult>('/sync/push/', { operations });

    // Mark accepted operations as synced
    const acceptedIds = data.accepted || [];
    if (acceptedIds.length) {
      await markOperationsSynced(acceptedIds);
    }

    // Mark conflicts as synced too (server resolved them)
    const conflictIds = (data.conflicts || []).map((c) => c.operation_id);
    if (conflictIds.length) {
      await markOperationsSynced(conflictIds);
    }

    // Mark rejected as failed
    const rejectedIds = (data.rejected || []).map((r) => r.operation_id);
    if (rejectedIds.length) {
      await markOperationsFailed(rejectedIds);
    }

    await cleanSyncedOperations();
    setStatus('idle');
    return data;
  } catch (err) {
    setStatus('error', (err as Error).message);
    throw err;
  }
}

// ============================================
// PULL — incremental changes since last pull
// ============================================

interface PullEntity {
  entity: string;
  data: Record<string, unknown>[];
}

interface PullResponse {
  changes: PullEntity[];
  timestamp: string;
}

export async function pullSync(): Promise<void> {
  if (!lastPullTimestamp) {
    // Load from local storage
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = '_last_pull_timestamp'`,
    );
    lastPullTimestamp = rows.length ? rows[0].value : null;
  }

  setStatus('pulling');

  try {
    const params = lastPullTimestamp ? `?since=${encodeURIComponent(lastPullTimestamp)}` : '';
    const { data } = await apiClient.get<PullResponse>(`/sync/pull/${params}`);

    for (const change of data.changes || []) {
      await applyEntityChanges(change.entity, change.data);
    }

    // Save the new timestamp
    if (data.timestamp) {
      lastPullTimestamp = data.timestamp;
      await execute(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('_last_pull_timestamp', ?, datetime('now'))`,
        [data.timestamp],
      );
    }

    setStatus('idle');
  } catch (err) {
    setStatus('error', (err as Error).message);
    throw err;
  }
}

// ============================================
// FULL SYNC — download entire store dataset
// ============================================

interface FullSyncResponse {
  entities: PullEntity[];
  timestamp: string;
}

export async function fullSync(): Promise<void> {
  setStatus('full-sync');

  try {
    const { data } = await apiClient.get<FullSyncResponse>('/sync/full/');

    for (const entityGroup of data.entities || []) {
      const table = ENTITY_TABLE_MAP[entityGroup.entity];
      if (!table) continue;

      // Clear existing data for this entity
      await execute(`DELETE FROM ${table}`);

      // Insert all records
      for (const record of entityGroup.data) {
        await upsertRecord(table, record);
      }
    }

    // Save the pull timestamp
    if (data.timestamp) {
      lastPullTimestamp = data.timestamp;
      await execute(
        `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('_last_pull_timestamp', ?, datetime('now'))`,
        [data.timestamp],
      );
    }

    setStatus('idle');
  } catch (err) {
    setStatus('error', (err as Error).message);
    throw err;
  }
}

// ============================================
// PERIODIC SYNC TIMER (FR-018: every 30s)
// ============================================

export function startPeriodicSync(): void {
  stopPeriodicSync();
  pullTimer = setInterval(async () => {
    try {
      await pushSync();
      await pullSync();
    } catch {
      // Errors are reported via status listener
    }
  }, PULL_INTERVAL_MS);
}

export function stopPeriodicSync(): void {
  if (pullTimer) {
    clearInterval(pullTimer);
    pullTimer = null;
  }
}

// ============================================
// INITIAL FULL SYNC ON FIRST LOGIN (FR-018)
// ============================================

export async function initialSyncIfNeeded(): Promise<void> {
  const rows = await query<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = '_last_pull_timestamp'`,
  );

  if (!rows.length || !rows[0].value) {
    // No previous sync — do a full sync
    await fullSync();
  } else {
    // Already synced before — do incremental
    lastPullTimestamp = rows[0].value;
    await pushSync();
    await pullSync();
  }
}

// ============================================
// HELPERS — apply remote changes to local DB
// ============================================

async function applyEntityChanges(
  entityName: string,
  records: Record<string, unknown>[],
): Promise<void> {
  const table = ENTITY_TABLE_MAP[entityName];
  if (!table) return;

  for (const record of records) {
    // Handle soft deletes
    if (record._deleted) {
      const pk = record.id ?? record.key ?? record.date;
      if (pk != null) {
        await execute(`DELETE FROM ${table} WHERE id = ?`, [pk]);
      }
      continue;
    }

    await upsertRecord(table, record);
  }
}

async function upsertRecord(
  table: string,
  record: Record<string, unknown>,
): Promise<void> {
  // Filter out fields that don't belong in the local schema
  const filtered = filterLocalFields(record);
  const keys = Object.keys(filtered);
  if (!keys.length) return;

  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => {
    const v = filtered[k];
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  });

  // Use INSERT OR REPLACE for upsert
  const columns = keys.join(', ');
  await execute(
    `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`,
    values,
  );
}

function filterLocalFields(record: Record<string, unknown>): Record<string, unknown> {
  // Remove backend-only fields
  const exclude = new Set(['store', 'store_id', '_deleted', 'synced_at']);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!exclude.has(k)) {
      result[k] = v;
    }
  }
  return result;
}
