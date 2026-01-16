// =============================================================================
// PRESENCE MANAGER — User presence tracking (Blueprint §6.3)
// =============================================================================

import type { WebSocketClient } from './WebSocketClient';
import type {
  CollaborationUser,
  UserSession,
  CursorPosition,
  SelectionRange,
  RemoteCursor,
  RemoteSelection,
  PresenceHandler,
} from './types';
import { getColorForUser } from './types';

// -----------------------------------------------------------------------------
// Presence Manager Class
// -----------------------------------------------------------------------------

/**
 * Manage user presence in collaborative document
 * Shows who is online, where their cursor is, what they're editing
 */
export class PresenceManager {
  private wsClient: WebSocketClient;
  private currentUser: CollaborationUser;
  private sessions: Map<string, UserSession> = new Map();
  private handlers: Set<PresenceHandler> = new Set();
  private isTypingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(wsClient: WebSocketClient, user: CollaborationUser) {
    this.wsClient = wsClient;
    this.currentUser = user;

    this.setupPresenceHandlers();
  }

  /**
   * Setup presence message handlers
   */
  private setupPresenceHandlers(): void {
    this.wsClient.on('user_joined', (message) => {
      this.handleUserJoined(message.payload as { user: CollaborationUser; sessionId?: string });
    });

    this.wsClient.on('user_left', (message) => {
      this.handleUserLeft(message.payload as { userId: string });
    });

    this.wsClient.on('presence_update', (message) => {
      this.handlePresenceUpdate(message.payload as { userId: string; activeSheet?: string });
    });

    this.wsClient.on('cursor_move', (message) => {
      this.handleCursorMove(message.payload as { userId: string; position: CursorPosition });
    });

    this.wsClient.on('selection_change', (message) => {
      this.handleSelectionChange(message.payload as { userId: string; selection: SelectionRange | null });
    });
  }

  /**
   * Announce presence when joining
   */
  announcePresence(): void {
    this.wsClient.send('user_joined', {
      user: this.currentUser,
      timestamp: Date.now(),
    });
  }

  /**
   * Leave document
   */
  leave(): void {
    this.wsClient.send('user_left', {
      userId: this.currentUser.id,
    });
  }

  /**
   * Update cursor position
   */
  updateCursor(position: CursorPosition): void {
    this.wsClient.send('cursor_move', {
      userId: this.currentUser.id,
      position,
    });
  }

  /**
   * Update selection
   */
  updateSelection(selection: SelectionRange | null): void {
    this.wsClient.send('selection_change', {
      userId: this.currentUser.id,
      selection,
    });
  }

  /**
   * Update active sheet
   */
  updateActiveSheet(sheetId: string): void {
    this.wsClient.send('presence_update', {
      userId: this.currentUser.id,
      activeSheet: sheetId,
    });
  }

  /**
   * Signal that user is typing
   */
  setTyping(isTyping: boolean): void {
    this.wsClient.send('presence_update', {
      userId: this.currentUser.id,
      isTyping,
    });
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.sessions.size;
  }

  /**
   * Get remote cursors (excluding self)
   */
  getRemoteCursors(sheetId?: string): RemoteCursor[] {
    return Array.from(this.sessions.values())
      .filter((s) => {
        if (s.user.id === this.currentUser.id) return false;
        if (!s.cursor) return false;
        if (sheetId && s.cursor.sheetId !== sheetId) return false;
        return true;
      })
      .map((s) => ({
        user: s.user,
        position: s.cursor!,
        isTyping: this.isUserTyping(s.user.id),
      }));
  }

  /**
   * Get remote selections (excluding self)
   */
  getRemoteSelections(sheetId?: string): RemoteSelection[] {
    return Array.from(this.sessions.values())
      .filter((s) => {
        if (s.user.id === this.currentUser.id) return false;
        if (!s.selection) return false;
        if (sheetId && s.selection.sheetId !== sheetId) return false;
        return true;
      })
      .map((s) => ({
        user: s.user,
        range: s.selection!,
      }));
  }

  /**
   * Check if a user is typing
   */
  private isUserTyping(userId: string): boolean {
    return this.isTypingTimers.has(userId);
  }

  /**
   * Get current user
   */
  getCurrentUser(): CollaborationUser {
    return this.currentUser;
  }

  /**
   * Subscribe to presence changes
   */
  subscribe(handler: PresenceHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  private handleUserJoined(data: { user: CollaborationUser; sessionId?: string }): void {
    const session: UserSession = {
      user: {
        ...data.user,
        color: data.user.color || getColorForUser(data.user.id),
      },
      sessionId: data.sessionId || crypto.randomUUID(),
      documentId: this.wsClient.getDocumentId(),
      status: 'connected',
      connectedAt: new Date(),
      lastActiveAt: new Date(),
      activeSheet: 'sheet1',
      deviceType: 'desktop',
      clientVersion: '1.0',
    };

    this.sessions.set(session.user.id, session);
    this.notifyHandlers();
  }

  private handleUserLeft(data: { userId: string }): void {
    this.sessions.delete(data.userId);
    this.isTypingTimers.delete(data.userId);
    this.notifyHandlers();
  }

  private handlePresenceUpdate(data: { userId: string; activeSheet?: string; isTyping?: boolean }): void {
    const session = this.sessions.get(data.userId);
    if (session) {
      session.lastActiveAt = new Date();

      if (data.activeSheet) {
        session.activeSheet = data.activeSheet;
      }

      if (data.isTyping !== undefined) {
        // Clear existing timer
        const existingTimer = this.isTypingTimers.get(data.userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        if (data.isTyping) {
          // Set typing indicator (auto-clear after 3 seconds)
          const timer = setTimeout(() => {
            this.isTypingTimers.delete(data.userId);
            this.notifyHandlers();
          }, 3000);
          this.isTypingTimers.set(data.userId, timer);
        } else {
          this.isTypingTimers.delete(data.userId);
        }
      }

      this.notifyHandlers();
    }
  }

  private handleCursorMove(data: { userId: string; position: CursorPosition }): void {
    const session = this.sessions.get(data.userId);
    if (session) {
      session.cursor = data.position;
      session.lastActiveAt = new Date();
      this.notifyHandlers();
    }
  }

  private handleSelectionChange(data: { userId: string; selection: SelectionRange | null }): void {
    const session = this.sessions.get(data.userId);
    if (session) {
      session.selection = data.selection || undefined;
      session.lastActiveAt = new Date();
      this.notifyHandlers();
    }
  }

  private notifyHandlers(): void {
    const users = this.getOnlineUsers();
    this.handlers.forEach((h) => h(users));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.isTypingTimers.forEach((timer) => clearTimeout(timer));
    this.isTypingTimers.clear();
    this.sessions.clear();
    this.handlers.clear();
  }
}
