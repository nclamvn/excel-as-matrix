// =============================================================================
// COLLABORATION TYPES — Real-time multi-user collaboration (Blueprint §6)
// =============================================================================

// -----------------------------------------------------------------------------
// User & Session
// -----------------------------------------------------------------------------

export interface CollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string; // Unique color for cursor/selection
}

export interface UserSession {
  user: CollaborationUser;
  sessionId: string;
  documentId: string;

  // Connection
  status: ConnectionStatus;
  connectedAt: Date;
  lastActiveAt: Date;

  // Position
  cursor?: CursorPosition;
  selection?: SelectionRange;
  activeSheet: string;

  // Device info
  deviceType: 'desktop' | 'mobile' | 'tablet';
  clientVersion: string;
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

// -----------------------------------------------------------------------------
// Cursor & Selection
// -----------------------------------------------------------------------------

export interface CursorPosition {
  sheetId: string;
  row: number;
  col: number;
  timestamp: number;
}

export interface SelectionRange {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  timestamp: number;
}

export interface RemoteCursor {
  user: CollaborationUser;
  position: CursorPosition;
  isTyping: boolean;
}

export interface RemoteSelection {
  user: CollaborationUser;
  range: SelectionRange;
}

// -----------------------------------------------------------------------------
// Sync Messages
// -----------------------------------------------------------------------------

export type SyncMessageType =
  // Connection
  | 'connect'
  | 'disconnect'
  | 'heartbeat'
  // Presence
  | 'user_joined'
  | 'user_left'
  | 'presence_update'
  // Cursor/Selection
  | 'cursor_move'
  | 'selection_change'
  // Data operations (match server protocol)
  | 'cell_update'
  | 'format_change'
  | 'sheet_change'
  // Legacy data sync
  | 'event_broadcast'
  | 'event_ack'
  | 'sync_request'
  | 'sync_response'
  // Comments
  | 'comment_add'
  | 'comment_update'
  | 'comment_delete'
  | 'comment_resolve';

export interface SyncMessage {
  id: string;
  type: SyncMessageType;
  documentId: string;
  userId: string;
  timestamp: number;
  payload: unknown;

  // For ordering
  vectorClock: VectorClock;
  sequence: number;
}

export interface VectorClock {
  [userId: string]: number;
}

// -----------------------------------------------------------------------------
// Comments
// -----------------------------------------------------------------------------

export interface Comment {
  id: string;
  threadId: string;

  // Location
  sheetId: string;
  cellRef: string;
  range?: SelectionRange;

  // Content
  content: string;
  author: CollaborationUser;

  // Status
  resolved: boolean;
  resolvedBy?: CollaborationUser;
  resolvedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Replies
  parentId?: string;
  replyCount: number;
}

export interface CommentThread {
  id: string;
  sheetId: string;
  cellRef: string;

  comments: Comment[];
  resolved: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Attribution
// -----------------------------------------------------------------------------

export interface CellAttribution {
  cellRef: string;
  sheetId: string;

  // Who last edited
  lastEditedBy: CollaborationUser;
  lastEditedAt: Date;

  // History
  editHistory: EditRecord[];
}

export interface EditRecord {
  user: CollaborationUser;
  timestamp: Date;
  eventId: string;
  changeType: 'value' | 'formula' | 'format' | 'clear';
}

// -----------------------------------------------------------------------------
// CRDT Types
// -----------------------------------------------------------------------------

export interface CRDTOperation {
  id: string;
  type: 'insert' | 'delete' | 'update';
  path: string[]; // Path to value
  value?: unknown;
  timestamp: number;
  userId: string;
  vectorClock: VectorClock;
}

export interface CRDTState {
  version: number;
  vectorClock: VectorClock;
  operations: CRDTOperation[];
  lastSyncedAt: Date;
}

// -----------------------------------------------------------------------------
// Document Access
// -----------------------------------------------------------------------------

export type AccessLevel = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface DocumentShare {
  documentId: string;
  recipientEmail: string;
  accessLevel: AccessLevel;
  sharedBy: string;
  sharedAt: Date;
  expiresAt?: Date;
}

export interface ShareLink {
  id: string;
  documentId: string;
  accessLevel: AccessLevel;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  useCount: number;
}

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------

export type MessageHandler = (message: SyncMessage) => void;
export type StatusHandler = (status: ConnectionStatus) => void;
export type PresenceHandler = (users: UserSession[]) => void;

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const USER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
];

export function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
