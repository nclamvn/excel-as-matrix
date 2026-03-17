// Phase 4: Collaboration & Real-time Types

export interface UserPresence {
  sessionId: string;
  userId: string;
  workbookId: string;
  sheetId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  cursorPosition?: CursorPosition;
  selection?: SelectionRange;
  lastActivity: string;
  status: PresenceStatus;
}

export type PresenceStatus = 'active' | 'idle' | 'away';

export interface CursorPosition {
  row: number;
  col: number;
  sheetId: string;
}

export interface SelectionRange {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// WebSocket message types — snake_case to match server protocol
export type WsMessageType =
  | 'join'
  | 'leave'
  | 'cell_update'
  | 'cursor_move'
  | 'selection_change'
  | 'presence_update'
  | 'sheet_change'
  | 'conflict'
  | 'sync'
  | 'ping'
  | 'pong'
  | 'error';

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
  timestamp: string;
  senderId?: string;
}

export interface JoinPayload {
  workbookId: string;
  sheetId: string;
  userId: string;
  displayName: string;
}

export interface CellUpdatePayload {
  sheetId: string;
  row: number;
  col: number;
  value?: string;
  formula?: string;
  version: number;
}

export interface CursorMovePayload {
  sheetId: string;
  row: number;
  col: number;
}

export interface SelectionChangePayload {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface ConflictPayload {
  cellKey: string;
  localVersion: number;
  serverVersion: number;
  localValue: string;
  serverValue: string;
  strategy: ConflictStrategy;
}

export type ConflictStrategy = 'LastWriteWins' | 'FirstWriteWins' | 'Merge' | 'Manual';

export interface ConflictResolution {
  cellKey: string;
  resolvedValue: string;
  strategy: ConflictStrategy;
}

// Connection state
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnected?: string;
  reconnectAttempts: number;
  error?: string;
}

// User colors for presence
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

export const getColorForUser = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};
