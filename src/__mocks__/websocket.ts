// Mock WebSocket for testing
import { vi } from 'vitest';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface MockSyncMessage {
  id: string;
  type: string;
  documentId: string;
  userId: string;
  timestamp: number;
  payload: unknown;
  vectorClock: Record<string, number>;
  sequence: number;
}

type MessageHandler = (message: MockSyncMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

// Mock WebSocket class
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url: string;

  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send = vi.fn();
  close = vi.fn().mockImplementation((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
      this.onclose(event);
    }
  });

  constructor(url: string) {
    this.url = url;
    // Auto-connect after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  // Test helpers
  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  simulateDisconnect(code: number = 1006, reason: string = 'Connection lost'): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const event = new CloseEvent('close', { code, reason });
      this.onclose(event);
    }
  }

  simulateError(): void {
    if (this.onerror) {
      const event = new Event('error');
      this.onerror(event);
    }
  }

  simulateReconnect(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen();
    }
  }
}

// Mock WebSocketClient class
export class MockWebSocketClient {
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private pendingMessages: MockSyncMessage[] = [];
  private sequence = 0;

  url: string;
  documentId: string;
  userId: string;

  // Spy functions for testing
  connect = vi.fn();
  disconnect = vi.fn();
  send = vi.fn();

  constructor(url: string, documentId: string, userId: string) {
    this.url = url;
    this.documentId = documentId;
    this.userId = userId;
  }

  async connectAsync(): Promise<void> {
    this.connect();
    this.setStatus('connecting');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.setStatus('connected');
        this.flushPendingMessages();
        resolve();
      }, 10);
    });
  }

  disconnectAsync(): void {
    this.disconnect();
    this.setStatus('disconnected');
  }

  sendMessage(type: string, payload: unknown): void {
    this.sequence++;
    const message: MockSyncMessage = {
      id: `msg-${this.sequence}`,
      type,
      documentId: this.documentId,
      userId: this.userId,
      timestamp: Date.now(),
      payload,
      vectorClock: {},
      sequence: this.sequence,
    };

    this.send(message);

    if (this.status === 'connected') {
      // Broadcast to handlers
      const handlers = this.messageHandlers.get(type);
      handlers?.forEach((handler) => handler(message));
    } else {
      this.pendingMessages.push(message);
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getDocumentId(): string {
    return this.documentId;
  }

  getUserId(): string {
    return this.userId;
  }

  // Test helpers
  setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  simulateIncomingMessage(message: Partial<MockSyncMessage>): void {
    const fullMessage: MockSyncMessage = {
      id: message.id || `incoming-${Date.now()}`,
      type: message.type || 'unknown',
      documentId: message.documentId || this.documentId,
      userId: message.userId || 'remote-user',
      timestamp: message.timestamp || Date.now(),
      payload: message.payload || {},
      vectorClock: message.vectorClock || {},
      sequence: message.sequence || 0,
    };

    const handlers = this.messageHandlers.get(fullMessage.type);
    handlers?.forEach((handler) => handler(fullMessage));
  }

  simulateDisconnect(): void {
    this.setStatus('reconnecting');
    setTimeout(() => {
      this.setStatus('disconnected');
    }, 50);
  }

  simulateReconnect(): void {
    this.setStatus('connecting');
    setTimeout(() => {
      this.setStatus('connected');
      this.flushPendingMessages();
    }, 50);
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift()!;
      const handlers = this.messageHandlers.get(message.type);
      handlers?.forEach((handler) => handler(message));
    }
  }

  reset(): void {
    this.status = 'disconnected';
    this.messageHandlers.clear();
    this.statusHandlers.clear();
    this.pendingMessages = [];
    this.sequence = 0;
    this.connect.mockClear();
    this.disconnect.mockClear();
    this.send.mockClear();
  }
}

// Factory function to create mock WebSocket clients
export function createMockWebSocketClient(
  documentId: string = 'test-doc',
  userId: string = 'test-user'
): MockWebSocketClient {
  return new MockWebSocketClient('ws://localhost:8080', documentId, userId);
}

// Global mock for WebSocket
export function installWebSocketMock(): void {
  (global as Record<string, unknown>).WebSocket = MockWebSocket;
}

export function uninstallWebSocketMock(): void {
  delete (global as Record<string, unknown>).WebSocket;
}

export default MockWebSocketClient;
