// Phase 10: Sync Store
// Zustand store for sync state management

import { create } from 'zustand';
import { ConflictInfo } from '../offline/ConflictResolver';

// === Types ===

export interface SyncState {
  // Network status
  isOnline: boolean;
  backendAvailable: boolean;

  // Sync status per workbook
  syncStatus: Map<string, WorkbookSyncStatus>;

  // Global state
  globalPendingCount: number;
  lastGlobalSync: number | null;

  // Conflicts
  activeConflicts: ConflictInfo[];
  conflictDialogOpen: boolean;

  // UI State
  showOfflineBanner: boolean;
  showSyncProgress: boolean;
}

export interface WorkbookSyncStatus {
  workbookId: string;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncedAt: number | null;
  lastError: string | null;
  progress: number;
  total: number;
}

export interface SyncActions {
  // Network
  setOnline: (online: boolean) => void;

  // Workbook sync status
  startSync: (workbookId: string, total: number) => void;
  updateSyncProgress: (workbookId: string, progress: number) => void;
  completeSync: (workbookId: string) => void;
  failSync: (workbookId: string, error: string) => void;
  setPendingCount: (workbookId: string, count: number) => void;

  // Backend availability
  setBackendAvailable: (available: boolean) => void;

  // Global
  updateGlobalPendingCount: () => void;

  // Conflicts
  addConflict: (conflict: ConflictInfo) => void;
  removeConflict: (cellId: string) => void;
  clearConflicts: () => void;
  openConflictDialog: () => void;
  closeConflictDialog: () => void;

  // UI
  setShowOfflineBanner: (show: boolean) => void;
  setShowSyncProgress: (show: boolean) => void;

  // Utility
  getSyncStatus: (workbookId: string) => WorkbookSyncStatus | undefined;
}

// === Store ===

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  backendAvailable: false,
  syncStatus: new Map(),
  globalPendingCount: 0,
  lastGlobalSync: null,
  activeConflicts: [],
  conflictDialogOpen: false,
  showOfflineBanner: false,
  showSyncProgress: false,

  // Network
  setOnline: (online) => {
    set({ isOnline: online, showOfflineBanner: !online });
  },
  setBackendAvailable: (available: boolean) => {
    set({ backendAvailable: available });
  },

  // Workbook sync status
  startSync: (workbookId, total) => {
    const { syncStatus } = get();
    const newStatus = new Map(syncStatus);
    newStatus.set(workbookId, {
      workbookId,
      isSyncing: true,
      pendingChanges: total,
      lastSyncedAt: newStatus.get(workbookId)?.lastSyncedAt || null,
      lastError: null,
      progress: 0,
      total,
    });
    set({ syncStatus: newStatus, showSyncProgress: true });
  },

  updateSyncProgress: (workbookId, progress) => {
    const { syncStatus } = get();
    const status = syncStatus.get(workbookId);
    if (status) {
      const newStatus = new Map(syncStatus);
      newStatus.set(workbookId, { ...status, progress });
      set({ syncStatus: newStatus });
    }
  },

  completeSync: (workbookId) => {
    const { syncStatus } = get();
    const status = syncStatus.get(workbookId);
    if (status) {
      const newStatus = new Map(syncStatus);
      newStatus.set(workbookId, {
        ...status,
        isSyncing: false,
        pendingChanges: 0,
        lastSyncedAt: Date.now(),
        lastError: null,
        progress: status.total,
      });
      set({ syncStatus: newStatus, lastGlobalSync: Date.now(), showSyncProgress: false });
    }
  },

  failSync: (workbookId, error) => {
    const { syncStatus } = get();
    const status = syncStatus.get(workbookId);
    if (status) {
      const newStatus = new Map(syncStatus);
      newStatus.set(workbookId, {
        ...status,
        isSyncing: false,
        lastError: error,
      });
      set({ syncStatus: newStatus, showSyncProgress: false });
    }
  },

  setPendingCount: (workbookId, count) => {
    const { syncStatus } = get();
    const status = syncStatus.get(workbookId);
    const newStatus = new Map(syncStatus);

    if (status) {
      newStatus.set(workbookId, { ...status, pendingChanges: count });
    } else {
      newStatus.set(workbookId, {
        workbookId,
        isSyncing: false,
        pendingChanges: count,
        lastSyncedAt: null,
        lastError: null,
        progress: 0,
        total: 0,
      });
    }

    set({ syncStatus: newStatus });
    get().updateGlobalPendingCount();
  },

  // Global
  updateGlobalPendingCount: () => {
    const { syncStatus } = get();
    let total = 0;
    syncStatus.forEach((status) => {
      total += status.pendingChanges;
    });
    set({ globalPendingCount: total });
  },

  // Conflicts
  addConflict: (conflict) => {
    set((state) => ({
      activeConflicts: [...state.activeConflicts, conflict],
      conflictDialogOpen: true,
    }));
  },

  removeConflict: (cellId) => {
    set((state) => ({
      activeConflicts: state.activeConflicts.filter((c) => c.cellId !== cellId),
      conflictDialogOpen: state.activeConflicts.length > 1,
    }));
  },

  clearConflicts: () => {
    set({ activeConflicts: [], conflictDialogOpen: false });
  },

  openConflictDialog: () => {
    set({ conflictDialogOpen: true });
  },

  closeConflictDialog: () => {
    set({ conflictDialogOpen: false });
  },

  // UI
  setShowOfflineBanner: (show) => {
    set({ showOfflineBanner: show });
  },

  setShowSyncProgress: (show) => {
    set({ showSyncProgress: show });
  },

  // Utility
  getSyncStatus: (workbookId) => {
    return get().syncStatus.get(workbookId);
  },
}));

// === Selectors ===

export const selectIsOnline = (state: SyncState) => state.isOnline;
export const selectBackendAvailable = (state: SyncState) => state.backendAvailable;
export const selectGlobalPendingCount = (state: SyncState) => state.globalPendingCount;
export const selectActiveConflicts = (state: SyncState) => state.activeConflicts;
export const selectHasConflicts = (state: SyncState) => state.activeConflicts.length > 0;
export const selectIsSyncing = (state: SyncState) =>
  Array.from(state.syncStatus.values()).some((s) => s.isSyncing);
