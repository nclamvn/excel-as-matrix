// Phase 10: Offline Data Hook
// Provides offline data access and sync functionality

import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineWorkbook, OfflineCell, ConflictInfo } from '../offline/OfflineDB';
import { syncManager, SyncResult, SyncEvent } from '../offline/SyncManager';
import { conflictResolver } from '../offline/ConflictResolver';
import { useNetworkStatus } from './useNetworkStatus';

export interface OfflineState {
  isInitialized: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncedAt: number | null;
  conflicts: ConflictInfo[];
  error: string | null;
}

export interface OfflineActions {
  sync: () => Promise<SyncResult | null>;
  saveCell: (
    sheetId: string,
    row: number,
    col: number,
    value: string | number | boolean | null,
    formula?: string | null
  ) => Promise<void>;
  getCell: (sheetId: string, row: number, col: number) => Promise<OfflineCell | undefined>;
  getCells: (sheetId: string) => Promise<OfflineCell[]>;
  resolveConflict: (cellId: string, choice: 'local' | 'server') => Promise<void>;
  resolveAllConflicts: (choice: 'local' | 'server') => Promise<void>;
}

export function useOffline(workbookId: string): OfflineState & OfflineActions {
  const { isOnline } = useNetworkStatus();

  const [state, setState] = useState<OfflineState>({
    isInitialized: false,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncedAt: null,
    conflicts: [],
    error: null,
  });

  // Initialize offline DB
  useEffect(() => {
    const init = async () => {
      try {
        await offlineDB.init();
        const pendingCount = await offlineDB.getPendingChangeCount(workbookId);
        const syncState = await offlineDB.getSyncState(workbookId);

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          pendingChanges: pendingCount,
          lastSyncedAt: syncState?.lastSyncedAt || null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize offline storage',
        }));
      }
    };

    init();
  }, [workbookId]);

  // Subscribe to sync events
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event: SyncEvent) => {
      if (event.workbookId !== workbookId) return;

      switch (event.type) {
        case 'sync:start':
          setState((prev) => ({ ...prev, isSyncing: true, error: null }));
          break;
        case 'sync:complete':
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            pendingChanges: 0,
            lastSyncedAt: Date.now(),
            conflicts: event.result?.conflicts || [],
          }));
          break;
        case 'sync:error':
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            error: event.error || 'Sync failed',
          }));
          break;
        case 'sync:conflict':
          if (event.conflict) {
            conflictResolver.addConflict(event.conflict);
            setState((prev) => ({
              ...prev,
              conflicts: [...prev.conflicts, event.conflict!],
            }));
          }
          break;
      }
    });

    return unsubscribe;
  }, [workbookId]);

  // Update pending count when changes are made
  const updatePendingCount = useCallback(async () => {
    const count = await offlineDB.getPendingChangeCount(workbookId);
    setState((prev) => ({ ...prev, pendingChanges: count }));
  }, [workbookId]);

  // Sync action
  const sync = useCallback(async (): Promise<SyncResult | null> => {
    if (!isOnline) {
      setState((prev) => ({ ...prev, error: 'Cannot sync while offline' }));
      return null;
    }

    return syncManager.sync(workbookId);
  }, [workbookId, isOnline]);

  // Save cell locally
  const saveCell = useCallback(
    async (
      sheetId: string,
      row: number,
      col: number,
      value: string | number | boolean | null,
      formula?: string | null
    ) => {
      await syncManager.saveLocally(workbookId, sheetId, row, col, value, formula || null);
      await updatePendingCount();
    },
    [workbookId, updatePendingCount]
  );

  // Get single cell
  const getCell = useCallback(
    async (sheetId: string, row: number, col: number): Promise<OfflineCell | undefined> => {
      return offlineDB.getCellByPosition(sheetId, row, col);
    },
    []
  );

  // Get all cells in sheet
  const getCells = useCallback(async (sheetId: string): Promise<OfflineCell[]> => {
    return offlineDB.getCellsBySheet(sheetId);
  }, []);

  // Resolve single conflict
  const resolveConflict = useCallback(
    async (cellId: string, choice: 'local' | 'server') => {
      if (choice === 'local') {
        await conflictResolver.resolveWithLocal(cellId);
      } else {
        await conflictResolver.resolveWithServer(cellId);
      }

      setState((prev) => ({
        ...prev,
        conflicts: prev.conflicts.filter((c) => c.cellId !== cellId),
      }));

      await updatePendingCount();
    },
    [updatePendingCount]
  );

  // Resolve all conflicts
  const resolveAllConflicts = useCallback(
    async (choice: 'local' | 'server') => {
      if (choice === 'local') {
        await conflictResolver.resolveAllWithLocal();
      } else {
        await conflictResolver.resolveAllWithServer();
      }

      setState((prev) => ({ ...prev, conflicts: [] }));
      await updatePendingCount();
    },
    [updatePendingCount]
  );

  return {
    ...state,
    sync,
    saveCell,
    getCell,
    getCells,
    resolveConflict,
    resolveAllConflicts,
  };
}

// === Utility Hooks ===

export function useOfflineWorkbooks(): {
  workbooks: OfflineWorkbook[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [workbooks, setWorkbooks] = useState<OfflineWorkbook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await offlineDB.init();
      const all = await offlineDB.getAllWorkbooks();
      setWorkbooks(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workbooks, loading, refresh };
}

export function useStorageQuota(): {
  usage: number;
  quota: number;
  usagePercent: number;
  loading: boolean;
} {
  const [storage, setStorage] = useState({
    usage: 0,
    quota: 0,
    usagePercent: 0,
    loading: true,
  });

  useEffect(() => {
    const checkStorage = async () => {
      await offlineDB.init();
      const estimate = await offlineDB.getStorageEstimate();
      setStorage({ ...estimate, loading: false });
    };

    checkStorage();
  }, []);

  return storage;
}
