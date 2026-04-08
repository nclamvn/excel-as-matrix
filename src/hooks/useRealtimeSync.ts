/**
 * Supabase Realtime sync hook — alternative to useWebSocket for cloud deployments.
 * Uses Supabase Realtime Broadcast + Presence instead of raw WebSocket.
 * Integrates with existing presenceStore and collab types.
 */
import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase, getClientId } from '@/lib/supabase';
import { usePresenceStore } from '@/stores/presenceStore';
import { CellUpdatePayload, getColorForUser } from '@/types/collab';
import { loggers } from '@/utils/logger';

interface UseRealtimeSyncOptions {
  workbookId: string;
  sheetId: string;
  userId?: string;
  userName?: string;
  onCellUpdate?: (payload: CellUpdatePayload) => void;
  enabled?: boolean;
}

interface UseRealtimeSyncReturn {
  isConnected: boolean;
  broadcastCellChange: (payload: CellUpdatePayload) => void;
  broadcastCursor: (row: number, col: number) => void;
  broadcastSelection: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  broadcastSheetChange: (newSheetId: string) => void;
  broadcastEditStart: (row: number, col: number) => void;
  broadcastEditEnd: (row: number, col: number) => void;
  clientId: string;
}

export function useRealtimeSync({
  workbookId,
  sheetId,
  userId,
  userName = 'Anonymous',
  onCellUpdate,
  enabled = true,
}: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientId = getClientId();
  const userColor = useRef(getColorForUser(userId || clientId)).current;

  const {
    initLocalUser,
    addRemoteUser,
    updateRemoteUser,
    removeRemoteUser,
    clearRemoteUsers,
    setConnectionStatus,
    localUser,
    updateSheet,
    setLockedCell,
    removeLockedCell,
  } = usePresenceStore();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !workbookId || !enabled) return;

    const channelName = `workbook:${workbookId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: clientId },
        broadcast: { self: false },
      },
    });

    // --- Cell changes from other users ---
    channel.on('broadcast', { event: 'cell_update' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      onCellUpdate?.(payload as CellUpdatePayload);
    });

    // --- Cursor movements ---
    channel.on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      updateRemoteUser(payload.senderId, {
        cursorPosition: {
          row: payload.row,
          col: payload.col,
          sheetId: payload.sheetId,
        },
      });
    });

    // --- Selection changes ---
    channel.on('broadcast', { event: 'selection_change' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      updateRemoteUser(payload.senderId, {
        selection: {
          sheetId: payload.sheetId,
          startRow: payload.startRow,
          startCol: payload.startCol,
          endRow: payload.endRow,
          endCol: payload.endCol,
        },
      });
    });

    // --- Sheet changes ---
    channel.on('broadcast', { event: 'sheet_change' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      updateRemoteUser(payload.senderId, {
        sheetId: payload.sheetId,
        cursorPosition: undefined,
        selection: undefined,
      });
    });

    // --- Cell edit locking ---
    channel.on('broadcast', { event: 'edit_start' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      setLockedCell({
        sheetId: payload.sheetId,
        row: payload.row,
        col: payload.col,
        userId: payload.senderId,
        userName: payload.userName,
        lockedAt: Date.now(),
      });
    });

    channel.on('broadcast', { event: 'edit_end' }, ({ payload }) => {
      if (payload.senderId === clientId) return;
      removeLockedCell(payload.sheetId, payload.row, payload.col);
    });

    // --- Presence sync (who's online) ---
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      clearRemoteUsers();

      Object.values(state).forEach((presences: unknown[]) => {
        (presences as Array<Record<string, string>>).forEach((p) => {
          if (p.clientId !== clientId) {
            addRemoteUser({
              sessionId: p.clientId,
              userId: p.userId || p.clientId,
              workbookId,
              sheetId: p.sheetId || sheetId,
              displayName: p.userName || 'Anonymous',
              color: p.color || getColorForUser(p.clientId),
              lastActivity: new Date().toISOString(),
              status: 'active',
            });
          }
        });
      });
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      removeRemoteUser(key);
    });

    // --- Subscribe ---
    setConnectionStatus('connecting');

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');

        // Initialize local presence
        if (!localUser) {
          initLocalUser(userId || clientId, userName, workbookId, sheetId);
        }

        // Track presence
        await channel.track({
          clientId,
          userId: userId || clientId,
          userName,
          color: userColor,
          sheetId,
          joinedAt: new Date().toISOString(),
        });

        loggers.websocket.info(`Realtime connected to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        setConnectionStatus('error');
        loggers.websocket.error(`Realtime error on ${channelName}`);
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected');
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setConnectionStatus('disconnected');
      clearRemoteUsers();
    };
  }, [workbookId, enabled]);

  // Update sheet tracking when sheetId changes
  useEffect(() => {
    if (channelRef.current && localUser) {
      updateSheet(sheetId);
      channelRef.current.track({
        clientId,
        userId: userId || clientId,
        userName,
        color: userColor,
        sheetId,
        joinedAt: new Date().toISOString(),
      });
    }
  }, [sheetId]);

  // --- Broadcast functions ---

  const broadcastCellChange = useCallback(
    (payload: CellUpdatePayload) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cell_update',
        payload: { ...payload, senderId: clientId },
      });
    },
    [clientId]
  );

  const broadcastCursor = useCallback(
    (row: number, col: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: { sheetId, row, col, senderId: clientId, userName, color: userColor },
      });
    },
    [clientId, sheetId, userName, userColor]
  );

  const broadcastSelection = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'selection_change',
        payload: { sheetId, startRow, startCol, endRow, endCol, senderId: clientId },
      });
    },
    [clientId, sheetId]
  );

  const broadcastSheetChange = useCallback(
    (newSheetId: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'sheet_change',
        payload: { sheetId: newSheetId, senderId: clientId },
      });
    },
    [clientId]
  );

  const broadcastEditStart = useCallback(
    (row: number, col: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'edit_start',
        payload: { sheetId, row, col, senderId: clientId, userName },
      });
    },
    [clientId, sheetId, userName]
  );

  const broadcastEditEnd = useCallback(
    (row: number, col: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'edit_end',
        payload: { sheetId, row, col, senderId: clientId },
      });
    },
    [clientId, sheetId]
  );

  return {
    isConnected: !!channelRef.current,
    broadcastCellChange,
    broadcastCursor,
    broadcastSelection,
    broadcastSheetChange,
    broadcastEditStart,
    broadcastEditEnd,
    clientId,
  };
}
