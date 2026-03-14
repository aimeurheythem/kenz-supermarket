/**
 * Mobile WebSocket client — connects to ws/store/updates/ with JWT auth,
 * auto-reconnects with exponential backoff.
 */

import * as SecureStore from 'expo-secure-store';

type MessageHandler = (data: Record<string, unknown>) => void;

const WS_BASE = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000';

class MobileWSClient {
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

  async connect(): Promise<void> {
    const token = await SecureStore.getItemAsync('access_token');
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
      } catch {
        // ignore
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

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

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

export const wsClient = new MobileWSClient();
export default wsClient;
