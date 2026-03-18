// Phase 4: Presence Hook - Cursor & Selection Tracking
import { useEffect, useCallback, useMemo } from 'react';
import { usePresenceStore, startIdleDetection } from '../stores/presenceStore';
import { UserPresence, SelectionRange } from '../types/collab';

interface UsePresenceOptions {
  sheetId: string;
  enabled?: boolean;
}

interface UsePresenceReturn {
  localUser: UserPresence | null;
  remoteUsers: UserPresence[];
  activeUserCount: number;
  isConnected: boolean;
  updateCursor: (row: number, col: number) => void;
  updateSelection: (selection: SelectionRange | null) => void;
  getUsersAtCell: (row: number, col: number) => UserPresence[];
  getUserColor: (userId: string) => string;
}

export const usePresence = (options: UsePresenceOptions): UsePresenceReturn => {
  const { sheetId, enabled = true } = options;

  const {
    localUser,
    connectionStatus,
    updateCursor: storeUpdateCursor,
    updateSelection: storeUpdateSelection,
    getRemoteUsersOnSheet,
    getUsersAtCell: storeGetUsersAtCell,
    getActiveUserCount,
  } = usePresenceStore();

  // Start idle detection
  useEffect(() => {
    if (enabled) {
      const cleanup = startIdleDetection();
      return cleanup;
    }
  }, [enabled]);

  const remoteUsers = useMemo(() => {
    if (!enabled) return [];
    return getRemoteUsersOnSheet(sheetId);
  }, [enabled, sheetId, getRemoteUsersOnSheet]);

  const activeUserCount = useMemo(() => {
    if (!enabled) return 0;
    return getActiveUserCount();
  }, [enabled, getActiveUserCount]);

  const updateCursor = useCallback((row: number, col: number) => {
    if (!enabled) return;
    storeUpdateCursor({ row, col, sheetId });
  }, [enabled, sheetId, storeUpdateCursor]);

  const updateSelection = useCallback((selection: SelectionRange | null) => {
    if (!enabled) return;
    storeUpdateSelection(selection);
  }, [enabled, storeUpdateSelection]);

  const getUsersAtCell = useCallback((row: number, col: number) => {
    if (!enabled) return [];
    return storeGetUsersAtCell(sheetId, row, col);
  }, [enabled, sheetId, storeGetUsersAtCell]);

  const getUserColor = useCallback((userId: string) => {
    // Find user in remote users
    const user = remoteUsers.find((u) => u.userId === userId);
    return user?.color || '#999999';
  }, [remoteUsers]);

  return {
    localUser,
    remoteUsers,
    activeUserCount,
    isConnected: connectionStatus === 'connected',
    updateCursor,
    updateSelection,
    getUsersAtCell,
    getUserColor,
  };
};

// Hook for tracking cell-level presence indicators
interface UseCellPresenceOptions {
  sheetId: string;
  row: number;
  col: number;
}

interface UseCellPresenceReturn {
  usersHere: UserPresence[];
  hasOtherUsers: boolean;
  primaryUserColor: string | null;
}

export const useCellPresence = (options: UseCellPresenceOptions): UseCellPresenceReturn => {
  const { sheetId, row, col } = options;
  const { getUsersAtCell } = usePresenceStore();

  const usersHere = useMemo(() => {
    return getUsersAtCell(sheetId, row, col);
  }, [sheetId, row, col, getUsersAtCell]);

  const hasOtherUsers = usersHere.length > 0;
  const primaryUserColor = hasOtherUsers ? usersHere[0].color : null;

  return {
    usersHere,
    hasOtherUsers,
    primaryUserColor,
  };
};

// Hook for tracking selection overlays from other users
interface UseSelectionOverlaysOptions {
  sheetId: string;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
}

interface SelectionOverlay {
  userId: string;
  displayName: string;
  color: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export const useSelectionOverlays = (options: UseSelectionOverlaysOptions): SelectionOverlay[] => {
  const { sheetId, visibleRows, visibleCols } = options;
  const { remoteUsers } = usePresenceStore();

  return useMemo(() => {
    const overlays: SelectionOverlay[] = [];

    for (const user of Array.from(remoteUsers.values())) {
      if (user.sheetId !== sheetId) continue;
      if (!user.selection) continue;

      const sel = user.selection;

      // Check if selection is visible
      const isVisible =
        sel.endRow >= visibleRows.start &&
        sel.startRow <= visibleRows.end &&
        sel.endCol >= visibleCols.start &&
        sel.startCol <= visibleCols.end;

      if (isVisible) {
        overlays.push({
          userId: user.userId,
          displayName: user.displayName,
          color: user.color,
          startRow: Math.max(sel.startRow, visibleRows.start),
          startCol: Math.max(sel.startCol, visibleCols.start),
          endRow: Math.min(sel.endRow, visibleRows.end),
          endCol: Math.min(sel.endCol, visibleCols.end),
        });
      }
    }

    return overlays;
  }, [sheetId, remoteUsers, visibleRows, visibleCols]);
};

// Hook for remote cursors
interface UseRemoteCursorsOptions {
  sheetId: string;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
}

interface RemoteCursor {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  row: number;
  col: number;
}

export const useRemoteCursors = (options: UseRemoteCursorsOptions): RemoteCursor[] => {
  const { sheetId, visibleRows, visibleCols } = options;
  const { remoteUsers } = usePresenceStore();

  return useMemo(() => {
    const cursors: RemoteCursor[] = [];

    for (const user of Array.from(remoteUsers.values())) {
      if (user.sheetId !== sheetId) continue;
      if (!user.cursorPosition) continue;

      const pos = user.cursorPosition;

      // Check if cursor is visible
      const isVisible =
        pos.row >= visibleRows.start &&
        pos.row <= visibleRows.end &&
        pos.col >= visibleCols.start &&
        pos.col <= visibleCols.end;

      if (isVisible) {
        cursors.push({
          userId: user.userId,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          color: user.color,
          row: pos.row,
          col: pos.col,
        });
      }
    }

    return cursors;
  }, [sheetId, remoteUsers, visibleRows, visibleCols]);
};
