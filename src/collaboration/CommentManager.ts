// =============================================================================
// COMMENT MANAGER — Threaded comments (Blueprint §6.4)
// =============================================================================

import type { WebSocketClient } from './WebSocketClient';
import type { Comment, CommentThread, CollaborationUser } from './types';

// -----------------------------------------------------------------------------
// Comment Manager Class
// -----------------------------------------------------------------------------

type CommentHandler = () => void;

/**
 * Manage comments and threaded discussions on cells
 */
export class CommentManager {
  private wsClient: WebSocketClient;
  private currentUser: CollaborationUser;
  private threads: Map<string, CommentThread> = new Map();
  private handlers: Set<CommentHandler> = new Set();

  constructor(wsClient: WebSocketClient, user: CollaborationUser) {
    this.wsClient = wsClient;
    this.currentUser = user;

    this.setupHandlers();
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupHandlers(): void {
    this.wsClient.on('comment_add', (msg) =>
      this.handleCommentAdd(msg.payload as { comment: Comment })
    );
    this.wsClient.on('comment_update', (msg) =>
      this.handleCommentUpdate(msg.payload as { commentId: string; content: string; updatedAt: Date })
    );
    this.wsClient.on('comment_delete', (msg) =>
      this.handleCommentDelete(msg.payload as { commentId: string })
    );
    this.wsClient.on('comment_resolve', (msg) =>
      this.handleCommentResolve(msg.payload as { threadId: string; resolvedBy: CollaborationUser })
    );
  }

  /**
   * Add a new comment
   */
  addComment(sheetId: string, cellRef: string, content: string, parentId?: string): Comment {
    const threadId = parentId
      ? this.getCommentById(parentId)?.threadId || crypto.randomUUID()
      : crypto.randomUUID();

    const comment: Comment = {
      id: crypto.randomUUID(),
      threadId,
      sheetId,
      cellRef,
      content,
      author: this.currentUser,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId,
      replyCount: 0,
    };

    // Add to local state
    this.addToThread(comment);

    // Broadcast to other users
    this.wsClient.send('comment_add', { comment });

    return comment;
  }

  /**
   * Reply to a comment
   */
  reply(parentId: string, content: string): Comment | null {
    const parent = this.getCommentById(parentId);
    if (!parent) return null;

    return this.addComment(parent.sheetId, parent.cellRef, content, parentId);
  }

  /**
   * Update a comment
   */
  updateComment(commentId: string, content: string): boolean {
    const comment = this.getCommentById(commentId);
    if (!comment) return false;

    // Only author can edit
    if (comment.author.id !== this.currentUser.id) return false;

    comment.content = content;
    comment.updatedAt = new Date();

    this.wsClient.send('comment_update', {
      commentId,
      content,
      updatedAt: comment.updatedAt,
    });

    this.notifyHandlers();
    return true;
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): boolean {
    const comment = this.getCommentById(commentId);
    if (!comment) return false;

    // Only author can delete
    if (comment.author.id !== this.currentUser.id) return false;

    this.removeFromThread(commentId);

    this.wsClient.send('comment_delete', { commentId });

    this.notifyHandlers();
    return true;
  }

  /**
   * Resolve a thread
   */
  resolveThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.resolved = true;
    thread.updatedAt = new Date();

    thread.comments.forEach((c) => {
      c.resolved = true;
      c.resolvedBy = this.currentUser;
      c.resolvedAt = new Date();
    });

    this.wsClient.send('comment_resolve', {
      threadId,
      resolvedBy: this.currentUser,
    });

    this.notifyHandlers();
    return true;
  }

  /**
   * Reopen a resolved thread
   */
  reopenThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.resolved = false;
    thread.updatedAt = new Date();

    thread.comments.forEach((c) => {
      c.resolved = false;
      c.resolvedBy = undefined;
      c.resolvedAt = undefined;
    });

    this.notifyHandlers();
    return true;
  }

  /**
   * Get threads for a cell
   */
  getThreadsForCell(sheetId: string, cellRef: string): CommentThread[] {
    return Array.from(this.threads.values()).filter(
      (t) => t.sheetId === sheetId && t.cellRef === cellRef
    );
  }

  /**
   * Get all threads
   */
  getAllThreads(): CommentThread[] {
    return Array.from(this.threads.values());
  }

  /**
   * Get unresolved threads
   */
  getUnresolvedThreads(): CommentThread[] {
    return Array.from(this.threads.values()).filter((t) => !t.resolved);
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): CommentThread | undefined {
    return this.threads.get(threadId);
  }

  /**
   * Get comment by ID
   */
  getCommentById(id: string): Comment | undefined {
    for (const thread of this.threads.values()) {
      const comment = thread.comments.find((c) => c.id === id);
      if (comment) return comment;
    }
    return undefined;
  }

  /**
   * Check if cell has comments
   */
  cellHasComments(sheetId: string, cellRef: string): boolean {
    return this.getThreadsForCell(sheetId, cellRef).length > 0;
  }

  /**
   * Get comment count for cell
   */
  getCommentCount(sheetId: string, cellRef: string): number {
    return this.getThreadsForCell(sheetId, cellRef).reduce(
      (sum, t) => sum + t.comments.length,
      0
    );
  }

  /**
   * Subscribe to changes
   */
  subscribe(handler: CommentHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private addToThread(comment: Comment): void {
    let thread = this.threads.get(comment.threadId);

    if (!thread) {
      thread = {
        id: comment.threadId,
        sheetId: comment.sheetId,
        cellRef: comment.cellRef,
        comments: [],
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.threads.set(thread.id, thread);
    }

    thread.comments.push(comment);
    thread.updatedAt = new Date();

    // Update parent reply count
    if (comment.parentId) {
      const parent = this.getCommentById(comment.parentId);
      if (parent) parent.replyCount++;
    }

    this.notifyHandlers();
  }

  private removeFromThread(commentId: string): void {
    for (const thread of this.threads.values()) {
      const index = thread.comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        const comment = thread.comments[index];

        // Update parent reply count
        if (comment.parentId) {
          const parent = this.getCommentById(comment.parentId);
          if (parent && parent.replyCount > 0) {
            parent.replyCount--;
          }
        }

        thread.comments.splice(index, 1);

        // Remove empty thread
        if (thread.comments.length === 0) {
          this.threads.delete(thread.id);
        }
        break;
      }
    }
  }

  private handleCommentAdd(data: { comment: Comment }): void {
    const comment = data.comment;

    // Don't add our own comments twice
    if (comment.author.id === this.currentUser.id) return;

    this.addToThread(comment);
  }

  private handleCommentUpdate(data: { commentId: string; content: string; updatedAt: Date }): void {
    const comment = this.getCommentById(data.commentId);
    if (comment) {
      comment.content = data.content;
      comment.updatedAt = new Date(data.updatedAt);
      this.notifyHandlers();
    }
  }

  private handleCommentDelete(data: { commentId: string }): void {
    this.removeFromThread(data.commentId);
    this.notifyHandlers();
  }

  private handleCommentResolve(data: { threadId: string; resolvedBy: CollaborationUser }): void {
    const thread = this.threads.get(data.threadId);
    if (thread) {
      thread.resolved = true;
      thread.updatedAt = new Date();
      thread.comments.forEach((c) => {
        c.resolved = true;
        c.resolvedBy = data.resolvedBy;
        c.resolvedAt = new Date();
      });
      this.notifyHandlers();
    }
  }

  private notifyHandlers(): void {
    this.handlers.forEach((h) => h());
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.threads.clear();
    this.handlers.clear();
  }
}
