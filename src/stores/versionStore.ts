/**
 * Version Store — manages workbook snapshots for version history.
 * Persists to IndexedDB via idb (same library as CrashRecoveryJournal).
 * Snapshots are keyed by workbookId, capped at MAX_SNAPSHOTS per workbook.
 */
import { create } from 'zustand';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { WorkbookSnapshot, SnapshotData } from '@/types/version';
import { loggers } from '@/utils/logger';

const DB_NAME = 'excelai-versions';
const DB_VERSION = 1;
const MAX_SNAPSHOTS = 100;

// IndexedDB schema
interface VersionDB extends DBSchema {
  snapshots: {
    key: string; // snapshot id
    value: WorkbookSnapshot;
    indexes: {
      'by-workbook': string;
      'by-timestamp': number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VersionDB>> | null = null;

function getDB(): Promise<IDBPDatabase<VersionDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VersionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('snapshots', { keyPath: 'id' });
        store.createIndex('by-workbook', 'workbookId');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store interface ─────────────────────────────────────────────────────────

interface VersionState {
  /** In-memory cache of snapshots for the active workbook */
  snapshots: WorkbookSnapshot[];
  activeWorkbookId: string | null;
  isLoading: boolean;
  lastAutoSave: number;
}

interface VersionActions {
  /** Load snapshots for a workbook from IndexedDB */
  loadSnapshots: (workbookId: string) => Promise<void>;

  /** Create a new snapshot and persist it */
  createSnapshot: (
    workbookId: string,
    data: SnapshotData,
    userId: string,
    userName: string,
    description: string
  ) => Promise<string>;

  /** Get a specific snapshot by id */
  getSnapshot: (snapshotId: string) => Promise<WorkbookSnapshot | undefined>;

  /** Delete a snapshot */
  deleteSnapshot: (snapshotId: string) => Promise<void>;

  /** Clean old snapshots beyond MAX_SNAPSHOTS */
  cleanOldSnapshots: (workbookId: string) => Promise<void>;

  /** Check if enough time has passed since last auto-save */
  shouldAutoSave: (intervalMs: number) => boolean;

  /** Mark current time as last auto-save */
  markAutoSaved: () => void;
}

export const useVersionStore = create<VersionState & VersionActions>()((set, get) => ({
  snapshots: [],
  activeWorkbookId: null,
  isLoading: false,
  lastAutoSave: 0,

  loadSnapshots: async (workbookId: string) => {
    set({ isLoading: true, activeWorkbookId: workbookId });
    try {
      const db = await getDB();
      const all = await db.getAllFromIndex('snapshots', 'by-workbook', workbookId);
      // Sort newest first
      all.sort((a, b) => b.timestamp - a.timestamp);
      set({ snapshots: all, isLoading: false });
    } catch (e) {
      loggers.store.error('Failed to load snapshots:', e);
      set({ snapshots: [], isLoading: false });
    }
  },

  createSnapshot: async (workbookId, data, userId, userName, description) => {
    const id = generateId();
    const existing = get().snapshots;
    const version = existing.length + 1;

    const snapshot: WorkbookSnapshot = {
      id,
      workbookId,
      version,
      timestamp: Date.now(),
      createdBy: userId,
      createdByName: userName,
      description,
      data,
      sizeBytes: JSON.stringify(data).length,
    };

    try {
      const db = await getDB();
      await db.put('snapshots', snapshot);

      // Update in-memory cache
      set((state) => ({
        snapshots: [snapshot, ...state.snapshots],
      }));

      loggers.store.info(`Snapshot v${version} created: ${description}`);
    } catch (e) {
      loggers.store.error('Failed to save snapshot:', e);
    }

    return id;
  },

  getSnapshot: async (snapshotId: string) => {
    try {
      const db = await getDB();
      return await db.get('snapshots', snapshotId);
    } catch (e) {
      loggers.store.error('Failed to get snapshot:', e);
      return undefined;
    }
  },

  deleteSnapshot: async (snapshotId: string) => {
    try {
      const db = await getDB();
      await db.delete('snapshots', snapshotId);
      set((state) => ({
        snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
      }));
    } catch (e) {
      loggers.store.error('Failed to delete snapshot:', e);
    }
  },

  cleanOldSnapshots: async (workbookId: string) => {
    try {
      const db = await getDB();
      const all = await db.getAllFromIndex('snapshots', 'by-workbook', workbookId);
      all.sort((a, b) => a.timestamp - b.timestamp); // oldest first

      if (all.length > MAX_SNAPSHOTS) {
        const toDelete = all.slice(0, all.length - MAX_SNAPSHOTS);
        const tx = db.transaction('snapshots', 'readwrite');
        for (const snap of toDelete) {
          tx.store.delete(snap.id);
        }
        await tx.done;

        // Refresh in-memory
        set((state) => ({
          snapshots: state.snapshots.filter((s) => !toDelete.some((d) => d.id === s.id)),
        }));
      }
    } catch (e) {
      loggers.store.error('Failed to clean snapshots:', e);
    }
  },

  shouldAutoSave: (intervalMs: number) => {
    return Date.now() - get().lastAutoSave > intervalMs;
  },

  markAutoSaved: () => {
    set({ lastAutoSave: Date.now() });
  },
}));
