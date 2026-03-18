// =============================================================================
// USE COLLABORATION — Wire CRDT + WebSocket into workbook state
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CollaborationManager,
  initCollaboration,
  CollaborationConfig,
} from '../collaboration/CollaborationManager';
import { WebSocketClient } from '../collaboration/WebSocketClient';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';
import type { CellValue } from '../types/cell';
import type { ConnectionStatus, SyncMessage } from '../collaboration/types';

interface UseCollaborationOptions {
  enabled: boolean;
  config?: CollaborationConfig;
}

interface UseCollaborationResult {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  userCount: number;
  manager: CollaborationManager | null;
}

// Access the internal wsClient from CollaborationManager
// The manager creates the WS client internally; we access it via the hook
function getWsClient(manager: CollaborationManager): WebSocketClient | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (manager as any).wsClient || null;
}

/**
 * Orchestration hook for collaboration.
 * - Initializes CollaborationManager on mount (if enabled)
 * - Subscribes to inbound cell_update WS messages → applies to workbook
 * - Broadcasts local cell edits outbound via WS
 * - Syncs cursor/selection presence
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationResult {
  const { enabled, config } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [userCount, setUserCount] = useState(0);
  const managerRef = useRef<CollaborationManager | null>(null);
  const isRemoteUpdateRef = useRef(false);

  // Selection state for cursor broadcasting
  const selectedCell = useSelectionStore((s) => s.selectedCell);

  // Apply a remote cell update to the local workbook (guarded by flag)
  const applyRemoteUpdate = useCallback(
    (sheetId: string, row: number, col: number, data: { value?: CellValue; formula?: string | null; displayValue?: string }) => {
      isRemoteUpdateRef.current = true;
      try {
        useWorkbookStore.getState().updateCell(sheetId, row, col, data);
      } finally {
        isRemoteUpdateRef.current = false;
      }
    },
    []
  );

  // Initialize collaboration
  useEffect(() => {
    if (!enabled || !config) {
      managerRef.current = null;
      return;
    }

    const manager = initCollaboration(config);
    managerRef.current = manager;

    // Connect
    manager.connect().then(() => {
      setConnectionStatus(manager.getConnectionStatus());

      // Subscribe to inbound cell_update messages from WS
      const wsClient = getWsClient(manager);
      if (wsClient) {
        wsClient.on('cell_update', (message: SyncMessage) => {
          const payload = message.payload as {
            sheetId: string;
            cellKey: string;
            value?: unknown;
            formula?: string | null;
            displayValue?: string;
          };
          if (!payload?.sheetId || !payload?.cellKey) return;
          // Skip updates from ourselves
          if (message.userId === config.userId) return;

          const [rowStr, colStr] = payload.cellKey.split(':');
          const row = parseInt(rowStr);
          const col = parseInt(colStr);
          if (isNaN(row) || isNaN(col)) return;

          applyRemoteUpdate(payload.sheetId, row, col, {
            value: payload.value as string | number | boolean | null,
            formula: payload.formula ?? null,
            displayValue: payload.displayValue,
          });
        });
      }
    }).catch(() => {
      setConnectionStatus('error');
    });

    // Subscribe to connection status changes
    const unsubConnection = manager.onConnectionChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to presence changes
    const unsubPresence = manager.onPresenceChange((users) => {
      setUserCount(users.length);
    });

    return () => {
      unsubConnection();
      unsubPresence();
      manager.destroy();
      managerRef.current = null;
      setConnectionStatus('disconnected');
      setUserCount(0);
    };
  }, [enabled, config?.wsUrl, config?.documentId, config?.userId, applyRemoteUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast cursor position on selection change
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !enabled || !selectedCell) return;

    const activeSheetId = useWorkbookStore.getState().activeSheetId;
    if (activeSheetId) {
      manager.updateCursor(activeSheetId, selectedCell.row, selectedCell.col);
    }
  }, [selectedCell, enabled]);

  // Subscribe to workbook cell updates → broadcast outbound via WS
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = useWorkbookStore.subscribe(
      (state, prevState) => {
        // Skip if this was a remote update (prevents echo loops)
        if (isRemoteUpdateRef.current) return;

        const manager = managerRef.current;
        if (!manager || !manager.isConnected()) return;

        const wsClient = getWsClient(manager);
        if (!wsClient) return;

        const activeSheet = state.activeSheetId;
        if (!activeSheet) return;

        const currentCells = state.sheets[activeSheet]?.cells;
        const prevCells = prevState.sheets[activeSheet]?.cells;
        if (currentCells === prevCells) return;

        // Find changed cells and broadcast each
        if (currentCells && prevCells) {
          for (const key of Object.keys(currentCells)) {
            if (currentCells[key] !== prevCells[key]) {
              const cell = currentCells[key];
              // Send cell_update through WS
              wsClient.send('cell_update', {
                sheetId: activeSheet,
                cellKey: key,
                value: cell.value,
                formula: cell.formula,
                displayValue: cell.displayValue,
              });
              // Record attribution
              manager.recordEdit(activeSheet, key, crypto.randomUUID(), 'value');
            }
          }
        }
      }
    );

    return unsubscribe;
  }, [enabled]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    userCount,
    manager: managerRef.current,
  };
}

export default useCollaboration;
