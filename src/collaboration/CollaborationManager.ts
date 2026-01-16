// =============================================================================
// COLLABORATION MANAGER — Main orchestrator (Blueprint §6)
// =============================================================================

import { WebSocketClient, MockWebSocketClient } from './WebSocketClient';
import { CRDTEngine } from './CRDTEngine';
import { PresenceManager } from './PresenceManager';
import { CommentManager } from './CommentManager';
import { AttributionTracker } from './AttributionTracker';
import type {
  CollaborationUser,
  UserSession,
  CursorPosition,
  SelectionRange,
  RemoteCursor,
  RemoteSelection,
  ConnectionStatus,
  Comment,
  CommentThread,
  CellAttribution,
  VectorClock,
} from './types';
import { getColorForUser } from './types';

// -----------------------------------------------------------------------------
// Collaboration Manager Config
// -----------------------------------------------------------------------------

export interface CollaborationConfig {
  wsUrl: string;
  documentId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  useMock?: boolean;
}

// -----------------------------------------------------------------------------
// Collaboration Manager Class
// -----------------------------------------------------------------------------

/**
 * Main orchestrator for all collaboration features
 */
export class CollaborationManager {
  private wsClient: WebSocketClient;
  private crdtEngine: CRDTEngine;
  private presenceManager: PresenceManager;
  private commentManager: CommentManager;
  private attributionTracker: AttributionTracker;
  private currentUser: CollaborationUser;
  private isInitialized = false;

  constructor(config: CollaborationConfig) {
    // Create current user
    this.currentUser = {
      id: config.userId,
      name: config.userName,
      email: config.userEmail,
      avatar: config.userAvatar,
      color: getColorForUser(config.userId),
    };

    // Create WebSocket client
    this.wsClient = config.useMock
      ? new MockWebSocketClient(config.documentId, config.userId)
      : new WebSocketClient(config.wsUrl, config.documentId, config.userId);

    // Create managers
    this.crdtEngine = new CRDTEngine(config.userId);
    this.presenceManager = new PresenceManager(this.wsClient, this.currentUser);
    this.commentManager = new CommentManager(this.wsClient, this.currentUser);
    this.attributionTracker = new AttributionTracker();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Connect to collaboration server
   */
  async connect(): Promise<void> {
    if (this.isInitialized) return;

    await this.wsClient.connect();
    this.presenceManager.announcePresence();
    this.isInitialized = true;
  }

  /**
   * Disconnect from collaboration server
   */
  disconnect(): void {
    if (!this.isInitialized) return;

    this.presenceManager.leave();
    this.wsClient.disconnect();
    this.isInitialized = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.wsClient.getStatus();
  }

  // ---------------------------------------------------------------------------
  // Presence
  // ---------------------------------------------------------------------------

  /**
   * Get current user
   */
  getCurrentUser(): CollaborationUser {
    return this.currentUser;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): UserSession[] {
    return this.presenceManager.getOnlineUsers();
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.presenceManager.getUserCount();
  }

  /**
   * Update cursor position
   */
  updateCursor(sheetId: string, row: number, col: number): void {
    const position: CursorPosition = {
      sheetId,
      row,
      col,
      timestamp: Date.now(),
    };
    this.presenceManager.updateCursor(position);
  }

  /**
   * Update selection
   */
  updateSelection(
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): void {
    const selection: SelectionRange = {
      sheetId,
      startRow,
      startCol,
      endRow,
      endCol,
      timestamp: Date.now(),
    };
    this.presenceManager.updateSelection(selection);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.presenceManager.updateSelection(null);
  }

  /**
   * Get remote cursors for a sheet
   */
  getRemoteCursors(sheetId?: string): RemoteCursor[] {
    return this.presenceManager.getRemoteCursors(sheetId);
  }

  /**
   * Get remote selections for a sheet
   */
  getRemoteSelections(sheetId?: string): RemoteSelection[] {
    return this.presenceManager.getRemoteSelections(sheetId);
  }

  /**
   * Subscribe to presence changes
   */
  onPresenceChange(handler: (users: UserSession[]) => void): () => void {
    return this.presenceManager.subscribe(handler);
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  /**
   * Add a comment to a cell
   */
  addComment(sheetId: string, cellRef: string, content: string): Comment {
    return this.commentManager.addComment(sheetId, cellRef, content);
  }

  /**
   * Reply to a comment
   */
  replyToComment(parentId: string, content: string): Comment | null {
    return this.commentManager.reply(parentId, content);
  }

  /**
   * Update a comment
   */
  updateComment(commentId: string, content: string): boolean {
    return this.commentManager.updateComment(commentId, content);
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): boolean {
    return this.commentManager.deleteComment(commentId);
  }

  /**
   * Resolve a comment thread
   */
  resolveThread(threadId: string): boolean {
    return this.commentManager.resolveThread(threadId);
  }

  /**
   * Get comments for a cell
   */
  getCommentsForCell(sheetId: string, cellRef: string): CommentThread[] {
    return this.commentManager.getThreadsForCell(sheetId, cellRef);
  }

  /**
   * Get all comment threads
   */
  getAllComments(): CommentThread[] {
    return this.commentManager.getAllThreads();
  }

  /**
   * Check if cell has comments
   */
  cellHasComments(sheetId: string, cellRef: string): boolean {
    return this.commentManager.cellHasComments(sheetId, cellRef);
  }

  /**
   * Subscribe to comment changes
   */
  onCommentChange(handler: () => void): () => void {
    return this.commentManager.subscribe(handler);
  }

  // ---------------------------------------------------------------------------
  // Attribution
  // ---------------------------------------------------------------------------

  /**
   * Record a cell edit
   */
  recordEdit(
    sheetId: string,
    cellRef: string,
    eventId: string,
    changeType: 'value' | 'formula' | 'format' | 'clear'
  ): void {
    this.attributionTracker.recordEdit(
      sheetId,
      cellRef,
      this.currentUser,
      eventId,
      changeType
    );
  }

  /**
   * Get attribution for a cell
   */
  getAttribution(sheetId: string, cellRef: string): CellAttribution | null {
    return this.attributionTracker.getAttribution(sheetId, cellRef);
  }

  /**
   * Get last editor for a cell
   */
  getLastEditor(sheetId: string, cellRef: string): CollaborationUser | null {
    return this.attributionTracker.getLastEditor(sheetId, cellRef);
  }

  /**
   * Subscribe to attribution changes
   */
  onAttributionChange(
    handler: (cellRef: string, attribution: CellAttribution) => void
  ): () => void {
    return this.attributionTracker.subscribe(handler);
  }

  // ---------------------------------------------------------------------------
  // CRDT
  // ---------------------------------------------------------------------------

  /**
   * Get current vector clock
   */
  getVectorClock(): VectorClock {
    return this.crdtEngine.getVectorClock();
  }

  // ---------------------------------------------------------------------------
  // Connection Status
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(handler: (status: ConnectionStatus) => void): () => void {
    return this.wsClient.onStatus(handler);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.disconnect();
    this.presenceManager.destroy();
    this.commentManager.destroy();
    this.attributionTracker.clear();
  }
}

// -----------------------------------------------------------------------------
// Factory & Singleton
// -----------------------------------------------------------------------------

let instance: CollaborationManager | null = null;

export function createCollaborationManager(
  config: CollaborationConfig
): CollaborationManager {
  return new CollaborationManager(config);
}

export function initCollaboration(config: CollaborationConfig): CollaborationManager {
  if (instance) {
    instance.destroy();
  }
  instance = new CollaborationManager(config);
  return instance;
}

export function getCollaborationManager(): CollaborationManager | null {
  return instance;
}
