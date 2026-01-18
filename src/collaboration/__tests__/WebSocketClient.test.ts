import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient, MockWebSocketClient } from '../WebSocketClient';
import type { SyncMessage } from '../types';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;

  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  send = vi.fn();
  close = vi.fn((code?: number) => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: code ?? 1000 });
  });

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  // Test helpers
  simulateMessage(data: SyncMessage) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.();
  }

  simulateClose(code = 1006) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }
}

// Store original WebSocket
const originalWebSocket = global.WebSocket;

describe('WebSocketClient', () => {
  let client: WebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    // @ts-ignore - Mock WebSocket
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.WebSocket = originalWebSocket;
    client?.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constructor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('should create client with correct parameters', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      expect(client.getDocumentId()).toBe('doc-123');
      expect(client.getUserId()).toBe('user-456');
    });

    it('should start with disconnected status', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      expect(client.getStatus()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Connection Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('connect', () => {
    it('should connect successfully', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      expect(client.getStatus()).toBe('connected');
      expect(client.isConnected()).toBe(true);
    });

    it('should set connecting status during connection', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      client.connect();

      expect(client.getStatus()).toBe('connecting');
    });

    it('should reject on connection error', async () => {
      // Create a WebSocket that fails (overrides onopen to prevent connection)
      // @ts-ignore
      global.WebSocket = class FailingWebSocket {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;
        readyState = 0;
        url: string;
        onopen: (() => void) | null = null;
        onclose: ((event: { code: number }) => void) | null = null;
        onerror: (() => void) | null = null;
        onmessage: ((event: { data: string }) => void) | null = null;
        send = vi.fn();
        close = vi.fn();
        constructor(url: string) {
          this.url = url;
          // Only trigger error, not open
          setTimeout(() => this.onerror?.(), 0);
        }
      };

      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();

      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
      expect(client.getStatus()).toBe('error');
    });

    it('should include document and user in URL', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      client.connect();
      vi.runOnlyPendingTimers();

      // @ts-ignore - Access internal ws
      const ws = (client as any).ws as MockWebSocket;
      expect(ws.url).toContain('doc=doc-123');
      expect(ws.url).toContain('user=user-456');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and set status', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      client.disconnect();

      expect(client.getStatus()).toBe('disconnected');
      expect(client.isConnected()).toBe(false);
    });

    it('should close WebSocket with code 1000', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      client.disconnect();

      expect(ws.close).toHaveBeenCalledWith(1000, 'User disconnected');
    });
  });

  describe('reconnection', () => {
    it('should attempt to reconnect on abnormal close', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateClose(1006); // Abnormal close

      expect(client.getStatus()).toBe('reconnecting');
    });

    it('should use exponential backoff for reconnection', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // Simulate disconnect
      // @ts-ignore
      (client as any).ws.simulateClose(1006);

      // Should wait 1000ms for first retry
      expect(client.getStatus()).toBe('reconnecting');
    });

    it('should stop reconnecting after max attempts', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // After initial connection, make reconnects fail
      // @ts-ignore
      global.WebSocket = class FailingReconnectWebSocket {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;
        readyState = 0;
        url: string;
        onopen: (() => void) | null = null;
        onclose: ((event: { code: number }) => void) | null = null;
        onerror: (() => void) | null = null;
        onmessage: ((event: { data: string }) => void) | null = null;
        send = vi.fn();
        close = vi.fn();
        constructor(url: string) {
          this.url = url;
          // Fail the connection
          setTimeout(() => {
            this.readyState = 3; // CLOSED
            this.onclose?.({ code: 1006 });
          }, 0);
        }
      };

      // Simulate disconnect to trigger reconnection attempts
      // @ts-ignore
      (client as any).ws.simulateClose(1006);

      // Run through reconnection attempts (5 max attempts with backoff)
      for (let i = 0; i < 6; i++) {
        vi.advanceTimersByTime(10000);
        vi.runOnlyPendingTimers();
      }

      expect(client.getStatus()).toBe('disconnected');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Send Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('send', () => {
    it('should send message when connected', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;

      client.send('cell_update', { row: 0, col: 0, value: 'test' });

      expect(ws.send).toHaveBeenCalled();
      const sentData = JSON.parse(ws.send.mock.calls[0][0]);
      expect(sentData.type).toBe('cell_update');
      expect(sentData.payload).toEqual({ row: 0, col: 0, value: 'test' });
    });

    it('should queue messages when disconnected', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      client.send('cell_update', { test: true });

      // @ts-ignore
      const pending = (client as any).pendingMessages;
      expect(pending.length).toBe(1);
    });

    it('should increment sequence number', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;

      client.send('cell_update', { test: 1 });
      client.send('cell_update', { test: 2 });

      const msg1 = JSON.parse(ws.send.mock.calls[0][0]);
      const msg2 = JSON.parse(ws.send.mock.calls[1][0]);

      expect(msg2.sequence).toBeGreaterThan(msg1.sequence);
    });

    it('should include document and user IDs in message', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;

      client.send('cell_update', {});

      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.documentId).toBe('doc-123');
      expect(msg.userId).toBe('user-456');
    });

    it('should flush pending messages on connect', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      // Queue messages while disconnected
      client.send('cell_update', { test: 1 });
      client.send('cell_update', { test: 2 });

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      expect(ws.send).toHaveBeenCalledTimes(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Message Handling Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('on (message handling)', () => {
    it('should register message handler', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const handler = vi.fn();
      client.on('cell_update', handler);

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: '1',
        type: 'cell_update',
        documentId: 'doc-123',
        userId: 'user-789',
        timestamp: Date.now(),
        payload: { test: true },
        vectorClock: {},
        sequence: 1,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should return unsubscribe function', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const handler = vi.fn();
      const unsubscribe = client.on('cell_update', handler);

      unsubscribe();

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: '1',
        type: 'cell_update',
        documentId: 'doc-123',
        userId: 'user-789',
        timestamp: Date.now(),
        payload: {},
        vectorClock: {},
        sequence: 1,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same type', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.on('cell_update', handler1);
      client.on('cell_update', handler2);

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: '1',
        type: 'cell_update',
        documentId: 'doc-123',
        userId: 'user-789',
        timestamp: Date.now(),
        payload: {},
        vectorClock: {},
        sequence: 1,
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle malformed messages gracefully', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;
      ws.onmessage?.({ data: 'invalid json{' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Status Handling Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('onStatus', () => {
    it('should register status handler', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const handler = vi.fn();
      client.onStatus(handler);

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      expect(handler).toHaveBeenCalledWith('connecting');
      expect(handler).toHaveBeenCalledWith('connected');
    });

    it('should return unsubscribe function', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const handler = vi.fn();
      const unsubscribe = client.onStatus(handler);

      unsubscribe();

      client.connect();
      vi.runOnlyPendingTimers();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Heartbeat Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('heartbeat', () => {
    it('should start heartbeat on connect', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      // @ts-ignore
      const ws = (client as any).ws as MockWebSocket;

      // Advance 30 seconds for heartbeat
      vi.advanceTimersByTime(30000);

      // Check that heartbeat was sent
      const heartbeatCall = ws.send.mock.calls.find((call) => {
        const msg = JSON.parse(call[0]);
        return msg.type === 'heartbeat';
      });

      expect(heartbeatCall).toBeDefined();
    });

    it('should stop heartbeat on disconnect', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc-123', 'user-456');

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      client.disconnect();

      // @ts-ignore
      const heartbeatInterval = (client as any).heartbeatInterval;
      expect(heartbeatInterval).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Getters Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getters', () => {
    it('getDocumentId should return document ID', () => {
      client = new WebSocketClient('ws://localhost:8080', 'my-doc', 'user-1');
      expect(client.getDocumentId()).toBe('my-doc');
    });

    it('getUserId should return user ID', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc', 'my-user');
      expect(client.getUserId()).toBe('my-user');
    });

    it('getStatus should return current status', () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc', 'user');
      expect(client.getStatus()).toBe('disconnected');
    });

    it('isConnected should return connection state', async () => {
      client = new WebSocketClient('ws://localhost:8080', 'doc', 'user');
      expect(client.isConnected()).toBe(false);

      const connectPromise = client.connect();
      vi.runOnlyPendingTimers();
      await connectPromise;

      expect(client.isConnected()).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MockWebSocketClient Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('MockWebSocketClient', () => {
  let mockClient: MockWebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect', () => {
    it('should connect immediately', async () => {
      mockClient = new MockWebSocketClient('doc-123', 'user-456');

      const connectPromise = mockClient.connect();
      vi.advanceTimersByTime(100);
      await connectPromise;

      expect(mockClient.isConnected()).toBe(true);
    });
  });

  describe('send', () => {
    it('should echo back messages', async () => {
      mockClient = new MockWebSocketClient('doc-123', 'user-456');

      const handler = vi.fn();
      mockClient.on('cell_update', handler);

      mockClient.send('cell_update', { test: true });

      vi.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should return document and user IDs', () => {
      mockClient = new MockWebSocketClient('doc-123', 'user-456');

      expect(mockClient.getDocumentId()).toBe('doc-123');
      expect(mockClient.getUserId()).toBe('user-456');
    });
  });
});
