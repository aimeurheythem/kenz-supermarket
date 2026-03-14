/**
 * Connectivity Monitor — detect online/offline state, trigger sync on
 * reconnect, and expose connection status for POS UI display.
 */

import { pushSync, pullSync, startPeriodicSync, stopPeriodicSync } from './syncEngine';

type ConnectivityStatus = 'online' | 'offline' | 'checking';
type ConnectivityListener = (status: ConnectivityStatus) => void;

let currentStatus: ConnectivityStatus = navigator.onLine ? 'online' : 'offline';
const listeners = new Set<ConnectivityListener>();
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

const HEALTH_CHECK_INTERVAL_MS = 60_000; // 1 minute
const HEALTH_CHECK_TIMEOUT_MS = 5_000;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function notifyListeners() {
  for (const fn of listeners) fn(currentStatus);
}

function setOnline() {
  if (currentStatus === 'online') return;
  const wasOffline = currentStatus === 'offline';
  currentStatus = 'online';
  notifyListeners();

  if (wasOffline) {
    onReconnect();
  }
}

function setOffline() {
  if (currentStatus === 'offline') return;
  currentStatus = 'offline';
  notifyListeners();
  stopPeriodicSync();
}

/**
 * Called when connectivity is restored after being offline.
 * Pushes any queued operations, pulls latest changes, then starts periodic sync.
 */
async function onReconnect(): Promise<void> {
  try {
    await pushSync();
    await pullSync();
    startPeriodicSync();
  } catch {
    // Errors handled by sync engine status listeners
  }
}

/**
 * Light health check against the API to verify true connectivity
 * (browser online event can be unreliable on some networks).
 */
async function healthCheck(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    const resp = await fetch(`${API_BASE}/health/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

/** Subscribe to connectivity changes. Returns unsubscribe function. */
export function onConnectivityChange(listener: ConnectivityListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Get current connectivity status. */
export function getConnectivityStatus(): ConnectivityStatus {
  return currentStatus;
}

/** Returns true if currently online. */
export function isOnline(): boolean {
  return currentStatus === 'online';
}

/** Initialize the connectivity monitor. Call once at app startup. */
export function initConnectivityMonitor(): void {
  // Browser events
  window.addEventListener('online', () => {
    currentStatus = 'checking';
    notifyListeners();
    healthCheck().then((ok) => {
      if (ok) setOnline();
      else setOffline();
    });
  });

  window.addEventListener('offline', () => {
    setOffline();
  });

  // Periodic health check
  healthCheckTimer = setInterval(async () => {
    const ok = await healthCheck();
    if (ok) setOnline();
    else setOffline();
  }, HEALTH_CHECK_INTERVAL_MS);

  // Initial check
  if (navigator.onLine) {
    healthCheck().then((ok) => {
      if (ok) setOnline();
      else setOffline();
    });
  }
}

/** Tear down the connectivity monitor. */
export function destroyConnectivityMonitor(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  listeners.clear();
}
