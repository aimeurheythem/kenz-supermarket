/**
 * POS WebSocket client — connects to ws/store/updates/ on the
 * Django backend, receives entity_change messages, and updates
 * local SQLite + Zustand stores in real-time (FR-012).
 *
 * Uses JWT auth via query parameter.  Reconnects with exponential
 * backoff on disconnect.
 */

import { getAccessToken } from './apiClient';
import { pullSync } from './syncEngine';

type MessageHandler = (data: Record<string, unknown>) => void;

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

class POSWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30_000;
  private shouldReconnect = false;

  constructor() {
    this.url = `${WS_BASE}/ws/store/updates/`;
  }

  /** Open WebSocket connection with JWT auth. */
  connect(): void {
    const token = getAccessToken();
    if (!token) return;

    this.shouldReconnect = true;
    this.ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as Record<string, unknown>;
        const type = msg.type as string;
        if (!type) return;

        const typeHandlers = this.handlers.get(type);
        typeHandlers?.forEach((handler) => handler(msg));

        // On any entity_change, trigger an incremental pull to update local SQLite
        if (type === 'entity_change') {
          pullSync().catch(() => {/* errors surfaced via status listener */});
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  /** Cleanly close the connection and stop reconnection attempts. */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  /** Subscribe to a message type. Returns an unsubscribe function. */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /** Send a message to the server (for future use). */
  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }
}

export const wsClient = new POSWebSocketClient();
export default wsClient;
