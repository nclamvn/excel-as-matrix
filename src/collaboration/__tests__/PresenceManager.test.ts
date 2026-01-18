import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PresenceManager } from '../PresenceManager';
import type { CollaborationUser, SyncMessage, SyncMessageType, MessageHandler } from '../types';

// Mock WebSocketClient
class MockWebSocketClient {
  private handlers: Map<SyncMessageType, Set<MessageHandler>> = new Map();
  public sentMessages: Array<{ type: SyncMessageType; payload: unknown }> = [];

  getDocumentId() {
    return 'doc-123';
  }

  getUserId() {
    return 'user-1';
  }

  on(type: SyncMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  send(type: SyncMessageType, payload: unknown): void {
    this.sentMessages.push({ type, payload });
  }

  // Test helper to simulate received messages
  simulateMessage(type: SyncMessageType, payload: unknown): void {
    const message: SyncMessage = {
      id: crypto.randomUUID(),
      type,
      documentId: 'doc-123',
      userId: 'other-user',
      timestamp: Date.now(),
      payload,
      vectorClock: {},
      sequence: 1,
    };

    this.handlers.get(type)?.forEach((h) => h(message));
  }
}

describe('PresenceManager', () => {
  let mockWsClient: MockWebSocketClient;
  let presenceManager: PresenceManager;
  let currentUser: CollaborationUser;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWsClient = new MockWebSocketClient();
    currentUser = {
      id: 'user-1',
      email: 'user1@test.com',
      name: 'Test User',
      avatarUrl: '',
    };
    presenceManager = new PresenceManager(mockWsClient as any, currentUser);
  });

  afterEach(() => {
    vi.useRealTimers();
    presenceManager.destroy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constructor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('should create manager with current user', () => {
      expect(presenceManager.getCurrentUser()).toEqual(currentUser);
    });

    it('should start with no online users', () => {
      expect(presenceManager.getOnlineUsers()).toEqual([]);
      expect(presenceManager.getUserCount()).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Announce Presence Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('announcePresence', () => {
    it('should send user_joined message', () => {
      presenceManager.announcePresence();

      expect(mockWsClient.sentMessages.length).toBe(1);
      expect(mockWsClient.sentMessages[0].type).toBe('user_joined');
    });

    it('should include user data in message', () => {
      presenceManager.announcePresence();

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.user).toEqual(currentUser);
    });

    it('should include timestamp', () => {
      presenceManager.announcePresence();

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.timestamp).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Leave Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('leave', () => {
    it('should send user_left message', () => {
      presenceManager.leave();

      expect(mockWsClient.sentMessages.length).toBe(1);
      expect(mockWsClient.sentMessages[0].type).toBe('user_left');
    });

    it('should include user ID', () => {
      presenceManager.leave();

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.userId).toBe('user-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cursor Update Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('updateCursor', () => {
    it('should send cursor_move message', () => {
      presenceManager.updateCursor({ sheetId: 'sheet1', row: 5, col: 3 });

      expect(mockWsClient.sentMessages[0].type).toBe('cursor_move');
    });

    it('should include position', () => {
      presenceManager.updateCursor({ sheetId: 'sheet1', row: 5, col: 3 });

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.position).toEqual({ sheetId: 'sheet1', row: 5, col: 3 });
    });

    it('should include user ID', () => {
      presenceManager.updateCursor({ sheetId: 'sheet1', row: 5, col: 3 });

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.userId).toBe('user-1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection Update Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('updateSelection', () => {
    it('should send selection_change message', () => {
      presenceManager.updateSelection({
        sheetId: 'sheet1',
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 5,
      });

      expect(mockWsClient.sentMessages[0].type).toBe('selection_change');
    });

    it('should include selection range', () => {
      const selection = {
        sheetId: 'sheet1',
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 5,
      };
      presenceManager.updateSelection(selection);

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.selection).toEqual(selection);
    });

    it('should handle null selection', () => {
      presenceManager.updateSelection(null);

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.selection).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Active Sheet Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('updateActiveSheet', () => {
    it('should send presence_update message', () => {
      presenceManager.updateActiveSheet('sheet2');

      expect(mockWsClient.sentMessages[0].type).toBe('presence_update');
    });

    it('should include active sheet ID', () => {
      presenceManager.updateActiveSheet('sheet2');

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.activeSheet).toBe('sheet2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Typing Indicator Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('setTyping', () => {
    it('should send presence_update with typing true', () => {
      presenceManager.setTyping(true);

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.isTyping).toBe(true);
    });

    it('should send presence_update with typing false', () => {
      presenceManager.setTyping(false);

      const payload = mockWsClient.sentMessages[0].payload as any;
      expect(payload.isTyping).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // User Joined Handler Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleUserJoined', () => {
    it('should add user to sessions', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });

      expect(presenceManager.getUserCount()).toBe(1);
    });

    it('should assign color to user', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].user.color).toBeDefined();
    });

    it('should preserve existing color', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com', color: '#ff0000' },
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].user.color).toBe('#ff0000');
    });

    it('should notify subscribers', () => {
      const handler = vi.fn();
      presenceManager.subscribe(handler);

      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // User Left Handler Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleUserLeft', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });
    });

    it('should remove user from sessions', () => {
      mockWsClient.simulateMessage('user_left', { userId: 'user-2' });

      expect(presenceManager.getUserCount()).toBe(0);
    });

    it('should notify subscribers', () => {
      const handler = vi.fn();
      presenceManager.subscribe(handler);
      handler.mockClear();

      mockWsClient.simulateMessage('user_left', { userId: 'user-2' });

      expect(handler).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cursor Move Handler Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleCursorMove', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });
    });

    it('should update user cursor position', () => {
      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-2',
        position: { sheetId: 'sheet1', row: 10, col: 5 },
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].cursor).toEqual({ sheetId: 'sheet1', row: 10, col: 5 });
    });

    it('should update lastActiveAt', () => {
      const before = new Date();
      vi.advanceTimersByTime(1000);

      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-2',
        position: { sheetId: 'sheet1', row: 10, col: 5 },
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].lastActiveAt.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Selection Change Handler Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handleSelectionChange', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });
    });

    it('should update user selection', () => {
      const selection = {
        sheetId: 'sheet1',
        startRow: 0,
        startCol: 0,
        endRow: 5,
        endCol: 5,
      };

      mockWsClient.simulateMessage('selection_change', {
        userId: 'user-2',
        selection,
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].selection).toEqual(selection);
    });

    it('should handle null selection', () => {
      mockWsClient.simulateMessage('selection_change', {
        userId: 'user-2',
        selection: null,
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].selection).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Presence Update Handler Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('handlePresenceUpdate', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other User', email: 'other@test.com' },
      });
    });

    it('should update active sheet', () => {
      mockWsClient.simulateMessage('presence_update', {
        userId: 'user-2',
        activeSheet: 'sheet3',
      });

      const users = presenceManager.getOnlineUsers();
      expect(users[0].activeSheet).toBe('sheet3');
    });

    it('should handle typing indicator', () => {
      mockWsClient.simulateMessage('presence_update', {
        userId: 'user-2',
        isTyping: true,
      });

      // Typing indicator should be set
      const cursors = presenceManager.getRemoteCursors();
      // Note: Need cursor to be visible
    });

    it('should auto-clear typing after timeout', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'Other', email: 'other@test.com' },
      });

      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-2',
        position: { sheetId: 'sheet1', row: 0, col: 0 },
      });

      mockWsClient.simulateMessage('presence_update', {
        userId: 'user-2',
        isTyping: true,
      });

      const handler = vi.fn();
      presenceManager.subscribe(handler);
      handler.mockClear();

      // Advance past timeout
      vi.advanceTimersByTime(3500);

      expect(handler).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Remote Cursors Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getRemoteCursors', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });
      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-2',
        position: { sheetId: 'sheet1', row: 5, col: 3 },
      });
    });

    it('should return remote cursors', () => {
      const cursors = presenceManager.getRemoteCursors();

      expect(cursors.length).toBe(1);
      expect(cursors[0].position).toEqual({ sheetId: 'sheet1', row: 5, col: 3 });
    });

    it('should exclude current user', () => {
      // Add cursor for current user (shouldn't be included)
      mockWsClient.simulateMessage('user_joined', {
        user: currentUser,
      });
      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-1',
        position: { sheetId: 'sheet1', row: 0, col: 0 },
      });

      const cursors = presenceManager.getRemoteCursors();
      expect(cursors.every((c) => c.user.id !== 'user-1')).toBe(true);
    });

    it('should filter by sheet ID', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-3', name: 'User 3', email: 'user3@test.com' },
      });
      mockWsClient.simulateMessage('cursor_move', {
        userId: 'user-3',
        position: { sheetId: 'sheet2', row: 0, col: 0 },
      });

      const cursors = presenceManager.getRemoteCursors('sheet1');
      expect(cursors.length).toBe(1);
      expect(cursors[0].user.id).toBe('user-2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Remote Selections Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getRemoteSelections', () => {
    beforeEach(() => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });
      mockWsClient.simulateMessage('selection_change', {
        userId: 'user-2',
        selection: { sheetId: 'sheet1', startRow: 0, startCol: 0, endRow: 5, endCol: 5 },
      });
    });

    it('should return remote selections', () => {
      const selections = presenceManager.getRemoteSelections();

      expect(selections.length).toBe(1);
    });

    it('should exclude current user', () => {
      const selections = presenceManager.getRemoteSelections();
      expect(selections.every((s) => s.user.id !== 'user-1')).toBe(true);
    });

    it('should filter by sheet ID', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-3', name: 'User 3', email: 'user3@test.com' },
      });
      mockWsClient.simulateMessage('selection_change', {
        userId: 'user-3',
        selection: { sheetId: 'sheet2', startRow: 0, startCol: 0, endRow: 2, endCol: 2 },
      });

      const selections = presenceManager.getRemoteSelections('sheet1');
      expect(selections.length).toBe(1);
      expect(selections[0].user.id).toBe('user-2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Subscription Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('subscribe', () => {
    it('should call handler on presence changes', () => {
      const handler = vi.fn();
      presenceManager.subscribe(handler);

      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });

      expect(handler).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = presenceManager.subscribe(handler);

      unsubscribe();
      handler.mockClear();

      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Destroy Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('destroy', () => {
    it('should clear all sessions', () => {
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });

      presenceManager.destroy();

      expect(presenceManager.getUserCount()).toBe(0);
    });

    it('should clear all handlers', () => {
      const handler = vi.fn();
      presenceManager.subscribe(handler);

      presenceManager.destroy();
      handler.mockClear();

      // This shouldn't call the handler
      mockWsClient.simulateMessage('user_joined', {
        user: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
