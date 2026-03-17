// =============================================================================
// WEBSOCKET CLIENT — Real-time connection (Blueprint §6.1)
// =============================================================================

import { loggers } from '@/utils/logger';
import type {
  SyncMessage,
  SyncMessageType,
  ConnectionStatus,
  MessageHandler,
  StatusHandler,
} from './types';

// -----------------------------------------------------------------------------
// WebSocket Client Class
// -----------------------------------------------------------------------------

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private documentId: string;
  private userId: string;
  private status: ConnectionStatus = 'disconnected';

  private messageHandlers: Map<SyncMessageType, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pendingMessages: SyncMessage[] = [];
  private sequence = 0;

  constructor(url: string, documentId: string, userId: string) {
    this.url = url;
    this.documentId = documentId;
    this.userId = userId;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setStatus('connecting');

      try {
        const wsUrl = `${this.url}?doc=${this.documentId}&user=${this.userId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushPendingMessages();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();

          if (event.code !== 1000) {
            // Abnormal close - try to reconnect
            this.handleDisconnect();
          } else {
            this.setStatus('disconnected');
          }
        };

        this.ws.onerror = () => {
          this.setStatus('error');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as SyncMessage;
            this.handleMessage(message);
          } catch (e) {
            loggers.websocket.error('Failed to parse message:', e);
          }
        };
      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Send a message
   */
  send(type: SyncMessageType, payload: unknown): void {
    this.sequence++;

    const message: SyncMessage = {
      id: crypto.randomUUID(),
      type,
      documentId: this.documentId,
      userId: this.userId,
      timestamp: Date.now(),
      payload,
      vectorClock: {},
      sequence: this.sequence,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue for later
      this.pendingMessages.push(message);
    }
  }

  /**
   * Subscribe to message type
   */
  on(type: SyncMessageType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  /**
   * Get current status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.status === 'connected' &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN
    );
  }

  /**
   * Get document ID
   */
  getDocumentId(): string {
    return this.documentId;
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.userId;
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private handleMessage(message: SyncMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (e) {
          loggers.websocket.error('Handler error:', e);
        }
      });
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.setStatus('reconnecting');
      this.reconnectAttempts++;

      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        this.connect().catch(() => {});
      }, delay);
    } else {
      this.setStatus('disconnected');
      loggers.websocket.error('Max reconnect attempts reached');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('heartbeat', { timestamp: Date.now() });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift()!;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Mock WebSocket Client (for local development)
// -----------------------------------------------------------------------------

export class MockWebSocketClient extends WebSocketClient {
  private mockHandlers: Map<SyncMessageType, Set<MessageHandler>> = new Map();

  constructor(documentId: string, userId: string) {
    super('ws://localhost:8080', documentId, userId);
  }

  connect(): Promise<void> {
    // Simulate connection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }

  disconnect(): void {
    // No-op for mock
  }

  send(type: SyncMessageType, payload: unknown): void {
    // Echo back for testing
    const message: SyncMessage = {
      id: crypto.randomUUID(),
      type,
      documentId: this.getDocumentId(),
      userId: this.getUserId(),
      timestamp: Date.now(),
      payload,
      vectorClock: {},
      sequence: 0,
    };

    // Simulate network delay
    setTimeout(() => {
      const handlers = this.mockHandlers.get(type);
      handlers?.forEach((h) => h(message));
    }, 50);
  }

  on(type: SyncMessageType, handler: MessageHandler): () => void {
    if (!this.mockHandlers.has(type)) {
      this.mockHandlers.set(type, new Set());
    }
    this.mockHandlers.get(type)!.add(handler);

    return () => {
      this.mockHandlers.get(type)?.delete(handler);
    };
  }

  isConnected(): boolean {
    return true;
  }
}
