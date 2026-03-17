import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ConnectionStatus } from '../../types/collab';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  url: string;
  sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Use queueMicrotask for faster async completion while still being async
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.sentMessages.push(data);
    }
  }

  close(code = 1000, _reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code });
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError(error: unknown) {
    this.onerror?.(error);
  }
}

// Use vi.hoisted to define mock functions BEFORE vi.mock hoisting
const {
  mockSetConnectionStatus,
  mockSetReconnectAttempts,
  mockAddRemoteUser,
  mockUpdateRemoteUser,
  mockRemoveRemoteUser,
  mockClearRemoteUsers,
  mockSetError,
  mockInitLocalUser,
  mockUpdateSheet,
  mockConnectionStatusRef,
  mockReconnectAttemptsRef,
} = vi.hoisted(() => ({
  mockSetConnectionStatus: vi.fn(),
  mockSetReconnectAttempts: vi.fn(),
  mockAddRemoteUser: vi.fn(),
  mockUpdateRemoteUser: vi.fn(),
  mockRemoveRemoteUser: vi.fn(),
  mockClearRemoteUsers: vi.fn(),
  mockSetError: vi.fn(),
  mockInitLocalUser: vi.fn(),
  mockUpdateSheet: vi.fn(),
  mockConnectionStatusRef: { current: 'disconnected' as ConnectionStatus },
  mockReconnectAttemptsRef: { current: 0 },
}));

vi.mock('../../stores/presenceStore', () => ({
  usePresenceStore: () => ({
    localUser: { sessionId: 'test-session' },
    connectionStatus: mockConnectionStatusRef.current,
    reconnectAttempts: mockReconnectAttemptsRef.current,
    setConnectionStatus: mockSetConnectionStatus,
    setReconnectAttempts: mockSetReconnectAttempts,
    addRemoteUser: mockAddRemoteUser,
    updateRemoteUser: mockUpdateRemoteUser,
    removeRemoteUser: mockRemoveRemoteUser,
    clearRemoteUsers: mockClearRemoteUsers,
    setError: mockSetError,
    initLocalUser: mockInitLocalUser,
    updateSheet: mockUpdateSheet,
  }),
}));

// Auth store mock state - using hoisted values for consistency
const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    current: {
      user: { id: 'user-1', displayName: 'Test User', avatarUrl: null },
      tokens: { token: 'test-token' },
    }
  }
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthState.current,
}));

// Import hook at top level after mocks
import { useWebSocket } from '../useWebSocket';

// Store original WebSocket
const OriginalWebSocket = global.WebSocket;

describe('useWebSocket', () => {
  let mockWs: MockWebSocket | null = null;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConnectionStatusRef.current = 'disconnected';
    mockReconnectAttemptsRef.current = 0;

    // Mock WebSocket constructor - must use function (not arrow) to be a constructor
    class WebSocketMock extends MockWebSocket {
      static override CONNECTING = 0;
      static override OPEN = 1;
      static override CLOSING = 2;
      static override CLOSED = 3;

      constructor(url: string) {
        super(url);
        mockWs = this;
      }
    }
    global.WebSocket = WebSocketMock as unknown as typeof WebSocket;
  });

  afterEach(() => {
    global.WebSocket = OriginalWebSocket;
    mockWs = null;
    vi.clearAllTimers();
  });

  describe('connection', () => {
    it('connects automatically when autoConnect is true', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });
    });

    it('does not connect when autoConnect is false', () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: false,
        })
      );

      expect(mockWs).toBeNull();
    });

    it('uses path-based roomId and query params for userId/userName', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-123',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
        // URL format: /ws/:roomId?userId=...&userName=...
        expect(mockWs?.url).toContain('/ws/wb-123');
        expect(mockWs?.url).toContain('userId=user-1');
        expect(mockWs?.url).toContain('userName=Test%20User');
      });
    });

    it('sets connection status to connecting', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      expect(mockSetConnectionStatus).toHaveBeenCalledWith('connecting');
    });

    it('sets connection status to connected on open', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockSetConnectionStatus).toHaveBeenCalledWith('connected');
      });
    });

    it('sends join message on connection', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs?.sentMessages.length).toBeGreaterThan(0);
        const joinMessage = mockWs?.sentMessages.find(m =>
          JSON.parse(m).type === 'join'
        );
        expect(joinMessage).toBeDefined();
      });
    });

    it('clears remote users on connection', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockClearRemoteUsers).toHaveBeenCalled();
      });
    });
  });

  describe('disconnect', () => {
    it('closes WebSocket connection', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockWs?.readyState).toBe(MockWebSocket.CLOSED);
    });

    it('sets connection status to disconnected', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockSetConnectionStatus).toHaveBeenCalledWith('disconnected');
    });

    it('clears remote users on disconnect', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockClearRemoteUsers).toHaveBeenCalled();
    });
  });

  describe('message sending', () => {
    it('sends cell update messages', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs?.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        result.current.sendCellUpdate({
          sheetId: 'sheet-1',
          row: 0,
          col: 0,
          value: 'test',
          version: 1,
        });
      });

      const cellUpdateMessage = mockWs?.sentMessages.find(m =>
        JSON.parse(m).type === 'cell_update'
      );
      expect(cellUpdateMessage).toBeDefined();
    });

    it('sends cursor move messages', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs?.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        result.current.sendCursorMove(5, 10);
      });

      const cursorMessage = mockWs?.sentMessages.find(m =>
        JSON.parse(m).type === 'cursor_move'
      );
      expect(cursorMessage).toBeDefined();
      const parsed = JSON.parse(cursorMessage!);
      expect(parsed.payload.row).toBe(5);
      expect(parsed.payload.col).toBe(10);
    });

    it('sends selection change messages', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs?.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        result.current.sendSelectionChange(0, 0, 5, 5);
      });

      const selectionMessage = mockWs?.sentMessages.find(m =>
        JSON.parse(m).type === 'selection_change'
      );
      expect(selectionMessage).toBeDefined();
    });

    it('sends sheet change messages', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs?.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        result.current.sendSheetChange('sheet-2');
      });

      const sheetMessage = mockWs?.sentMessages.find(m =>
        JSON.parse(m).type === 'sheet_change'
      );
      expect(sheetMessage).toBeDefined();
    });
  });

  describe('message handling', () => {
    it('handles presence_update join action', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'presence_update',
          payload: { action: 'join', userId: 'user-2', userName: 'Other User' },
        });
      });

      expect(mockAddRemoteUser).toHaveBeenCalled();
    });

    it('handles presence_update init action', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'presence_update',
          payload: {
            action: 'init',
            members: [{ userId: 'user-2', userName: 'Other User' }],
          },
        });
      });

      expect(mockAddRemoteUser).toHaveBeenCalled();
    });

    it('handles presence_update leave action', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'presence_update',
          payload: { action: 'leave', userId: 'user-2' },
        });
      });

      expect(mockRemoveRemoteUser).toHaveBeenCalledWith('user-2');
    });

    it('handles cursor move messages', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'cursor_move',
          payload: { row: 5, col: 10, sheetId: 'sheet-1' },
          userId: 'other-session',
          senderId: 'other-session',
        });
      });

      expect(mockUpdateRemoteUser).toHaveBeenCalled();
    });

    it('handles cell update messages', async () => {
      const onCellUpdate = vi.fn();

      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
          onCellUpdate,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'cell_update',
          payload: { sheetId: 'sheet-1', row: 0, col: 0, value: 'test' },
        });
      });

      expect(onCellUpdate).toHaveBeenCalled();
    });

    it('handles error messages', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateMessage({
          type: 'error',
          payload: { message: 'Test error' },
        });
      });

      expect(mockSetError).toHaveBeenCalledWith('Test error');
    });

    it('ignores own presence messages', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      mockAddRemoteUser.mockClear();

      act(() => {
        mockWs?.simulateMessage({
          type: 'presence_update',
          payload: { action: 'join', userId: 'test-session' }, // Same as local
        });
      });

      expect(mockAddRemoteUser).not.toHaveBeenCalled();
    });
  });

  describe('return values', () => {
    it('returns isConnected state based on connection status', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: false,
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.status).toBe('disconnected');
    });

    it('returns status', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: false,
        })
      );

      expect(result.current.status).toBe('disconnected');
    });

    it('returns connect function', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: false,
        })
      );

      expect(typeof result.current.connect).toBe('function');
    });

    it('returns disconnect function', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: false,
        })
      );

      expect(typeof result.current.disconnect).toBe('function');
    });
  });

  describe('error handling', () => {
    it('sets error on WebSocket error', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      act(() => {
        mockWs?.simulateError(new Error('Connection failed'));
      });

      expect(mockSetConnectionStatus).toHaveBeenCalledWith('error');
    });

    it('handles malformed messages gracefully', async () => {
      renderHook(() =>
        useWebSocket({
          workbookId: 'wb-1',
          sheetId: 'sheet-1',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockWs).not.toBeNull();
      });

      // Should not throw
      expect(() => {
        mockWs?.onmessage?.({ data: 'not valid json' });
      }).not.toThrow();
    });
  });
});
