/**
 * RealtimeProvider — wraps useRealtimeSync in a context.
 * Drop this at the top of your app to enable Supabase Realtime collaboration.
 * Falls back gracefully when Supabase is not configured.
 */
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { getSupabase } from '@/lib/supabase';
import { CellUpdatePayload } from '@/types/collab';
import { usePresenceStore } from '@/stores/presenceStore';

interface RealtimeContextType {
  isConnected: boolean;
  isEnabled: boolean;
  broadcastCellChange: (payload: CellUpdatePayload) => void;
  broadcastCursor: (row: number, col: number) => void;
  broadcastSelection: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  broadcastSheetChange: (newSheetId: string) => void;
  broadcastEditStart: (row: number, col: number) => void;
  broadcastEditEnd: (row: number, col: number) => void;
  clientId: string;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  workbookId: string;
  sheetId: string;
  userId?: string;
  userName?: string;
  onRemoteCellChange?: (payload: CellUpdatePayload) => void;
  children: React.ReactNode;
}

export function RealtimeProvider({
  workbookId,
  sheetId,
  userId,
  userName,
  onRemoteCellChange,
  children,
}: RealtimeProviderProps) {
  const supabaseAvailable = !!getSupabase();

  // Subscribe to mention notifications via Supabase Realtime
  useRealtimeNotifications(workbookId, userId || '');

  const handleCellUpdate = useCallback(
    (payload: CellUpdatePayload) => {
      onRemoteCellChange?.(payload);
    },
    [onRemoteCellChange]
  );

  const {
    isConnected,
    broadcastCellChange,
    broadcastCursor,
    broadcastSelection,
    broadcastSheetChange,
    broadcastEditStart,
    broadcastEditEnd,
    clientId,
  } = useRealtimeSync({
    workbookId,
    sheetId,
    userId,
    userName,
    onCellUpdate: handleCellUpdate,
    enabled: supabaseAvailable,
  });

  const value = useMemo<RealtimeContextType>(
    () => ({
      isConnected,
      isEnabled: supabaseAvailable,
      broadcastCellChange,
      broadcastCursor,
      broadcastSelection,
      broadcastSheetChange,
      broadcastEditStart,
      broadcastEditEnd,
      clientId,
    }),
    [
      isConnected,
      supabaseAvailable,
      broadcastCellChange,
      broadcastCursor,
      broadcastSelection,
      broadcastSheetChange,
      broadcastEditStart,
      broadcastEditEnd,
      clientId,
    ]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/**
 * Access the realtime context from any child component.
 * Returns null-safe defaults when used outside provider (offline mode).
 */
export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    // Return no-op defaults for offline/non-collaborative mode
    return {
      isConnected: false,
      isEnabled: false,
      broadcastCellChange: () => {},
      broadcastCursor: () => {},
      broadcastSelection: () => {},
      broadcastSheetChange: () => {},
      broadcastEditStart: () => {},
      broadcastEditEnd: () => {},
      clientId: 'offline',
    };
  }
  return context;
}

/**
 * Hook to get online users count from presence store.
 * Works with both WebSocket and Supabase Realtime backends.
 */
export function useOnlineUsers() {
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const localUser = usePresenceStore((s) => s.localUser);

  return {
    count: (localUser ? 1 : 0) + remoteUsers.size,
    users: Array.from(remoteUsers.values()),
    localUser,
  };
}
