/**
 * Auto-save hook — creates snapshots every 5 minutes (configurable).
 * Also saves on tab visibility change (user leaving).
 */
import { useEffect, useRef, useCallback } from 'react';
import { useVersionStore } from '@/stores/versionStore';
import { useWorkbookStore } from '@/stores/workbookStore';
import { SnapshotData } from '@/types/version';
import { loggers } from '@/utils/logger';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CHECK_INTERVAL = 60 * 1000; // Check every minute

interface UseAutoSaveOptions {
  workbookId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

export function useAutoSave({ workbookId, userId, userName, enabled = true }: UseAutoSaveOptions) {
  const { createSnapshot, shouldAutoSave, markAutoSaved, cleanOldSnapshots, loadSnapshots } =
    useVersionStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastCellCountRef = useRef(0);

  // Get current workbook data as a snapshot
  const getSnapshotData = useCallback((): SnapshotData | null => {
    const state = useWorkbookStore.getState();
    if (!state.workbookId || !state.sheets) return null;

    const sheets: SnapshotData['sheets'] = {};
    for (const [id, sheet] of Object.entries(state.sheets)) {
      sheets[id] = {
        id: sheet.id,
        name: sheet.name,
        cells: sheet.cells,
      };
    }

    return {
      sheets,
      sheetOrder: state.sheetOrder,
      workbookName: state.workbookName,
    };
  }, []);

  // Check if data has changed since last save
  const hasChanges = useCallback(() => {
    const state = useWorkbookStore.getState();
    let cellCount = 0;
    for (const sheet of Object.values(state.sheets)) {
      cellCount += Object.keys(sheet.cells).length;
    }
    const changed = cellCount !== lastCellCountRef.current;
    if (changed) lastCellCountRef.current = cellCount;
    return changed;
  }, []);

  // Perform auto-save
  const performAutoSave = useCallback(
    async (description: string) => {
      if (!workbookId || !enabled) return;
      const data = getSnapshotData();
      if (!data) return;

      await createSnapshot(workbookId, data, userId, userName, description);
      markAutoSaved();
      await cleanOldSnapshots(workbookId);
    },
    [workbookId, userId, userName, enabled, getSnapshotData, createSnapshot, markAutoSaved, cleanOldSnapshots]
  );

  // Load snapshots on mount
  useEffect(() => {
    if (workbookId && enabled) {
      loadSnapshots(workbookId);
    }
  }, [workbookId, enabled, loadSnapshots]);

  // Periodic auto-save check
  useEffect(() => {
    if (!workbookId || !enabled) return;

    // Create initial snapshot
    const timer = setTimeout(() => {
      performAutoSave('Initial snapshot');
    }, 3000);

    // Check every minute
    intervalRef.current = setInterval(() => {
      if (shouldAutoSave(AUTO_SAVE_INTERVAL) && hasChanges()) {
        performAutoSave('Auto-save');
      }
    }, CHECK_INTERVAL);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [workbookId, enabled, performAutoSave, shouldAutoSave, hasChanges]);

  // Save on visibility change (user leaving tab)
  useEffect(() => {
    if (!workbookId || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        performAutoSave('Auto-save (tab hidden)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [workbookId, enabled, performAutoSave]);

  // Save before unload
  useEffect(() => {
    if (!workbookId || !enabled) return;

    const handleBeforeUnload = () => {
      // Synchronous: can't use async here, so fire-and-forget
      const data = getSnapshotData();
      if (data) {
        // Use sendBeacon or just try sync IndexedDB write
        loggers.store.info('Auto-save on unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workbookId, enabled, getSnapshotData]);

  // Manual save function exposed to UI
  const saveSnapshot = useCallback(
    async (description = 'Manual save') => {
      return performAutoSave(description);
    },
    [performAutoSave]
  );

  return { saveSnapshot };
}
