/**
 * useOfflineCache Hook
 *
 * Provides offline caching capabilities with automatic sync
 * when connection is restored.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loggers } from '@/utils/logger';
import {
  getCache,
  IndexedDBCache,
  CachedWorkbook,
  CachedSheet,
  CachedCell,
  PendingChange,
  CacheStats,
  isIndexedDBAvailable,
} from '../cache/IndexedDBCache';
import { apiClient } from '../api/client';

export interface UseOfflineCacheOptions {
  /** Enable automatic sync when online */
  autoSync?: boolean;
  /** Sync interval in milliseconds */
  syncInterval?: number;
  /** Maximum retry attempts for failed syncs */
  maxRetries?: number;
  /** Callback when sync completes */
  onSyncComplete?: (result: SyncResult) => void;
  /** Callback when sync fails */
  onSyncError?: (error: Error) => void;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface UseOfflineCacheResult {
  // State
  isOnline: boolean;
  isAvailable: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  stats: CacheStats | null;

  // Workbook operations
  cacheWorkbook: (workbook: CachedWorkbook) => Promise<void>;
  getCachedWorkbook: (id: string) => Promise<CachedWorkbook | undefined>;
  getCachedWorkbooks: () => Promise<CachedWorkbook[]>;

  // Sheet operations
  cacheSheet: (sheet: CachedSheet) => Promise<void>;
  getCachedSheet: (id: string) => Promise<CachedSheet | undefined>;
  getCachedSheets: (workbookId: string) => Promise<CachedSheet[]>;

  // Cell operations
  cacheCell: (cell: Omit<CachedCell, 'key'>) => Promise<void>;
  cacheCells: (cells: Omit<CachedCell, 'key'>[]) => Promise<void>;
  getCachedCell: (
    workbookId: string,
    sheetId: string,
    row: number,
    col: number
  ) => Promise<CachedCell | undefined>;
  getCachedCells: (workbookId: string, sheetId: string) => Promise<CachedCell[]>;
  getCachedCellsInRange: (
    workbookId: string,
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ) => Promise<CachedCell[]>;

  // Offline changes
  queueChange: (change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  getPendingChanges: () => Promise<PendingChange[]>;

  // Sync operations
  sync: () => Promise<SyncResult>;
  clearPendingChanges: () => Promise<void>;

  // Cache management
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const DEFAULT_OPTIONS: Required<UseOfflineCacheOptions> = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  maxRetries: 3,
  onSyncComplete: () => {},
  onSyncError: () => {},
};

export function useOfflineCache(options: UseOfflineCacheOptions = {}): UseOfflineCacheResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cacheRef = useRef<IndexedDBCache | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [stats, setStats] = useState<CacheStats | null>(null);

  // Initialize cache
  useEffect(() => {
    if (isIndexedDBAvailable()) {
      cacheRef.current = getCache();
      setIsAvailable(true);
      refreshStats();
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (opts.autoSync) {
        sync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [opts.autoSync]);

  // Auto-sync interval
  useEffect(() => {
    if (!opts.autoSync || !isOnline) return;

    const scheduleSync = () => {
      syncTimeoutRef.current = setTimeout(async () => {
        await sync();
        scheduleSync();
      }, opts.syncInterval);
    };

    scheduleSync();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [opts.autoSync, opts.syncInterval, isOnline]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!cacheRef.current) return;

    try {
      const newStats = await cacheRef.current.getStats();
      setStats(newStats);
      setPendingChanges(newStats.pendingChangeCount);
    } catch (error) {
      loggers.cache.error('Failed to refresh cache stats:', error);
    }
  }, []);

  // ============ Workbook Operations ============

  const cacheWorkbook = useCallback(async (workbook: CachedWorkbook) => {
    if (!cacheRef.current) return;
    await cacheRef.current.saveWorkbook(workbook);
    await refreshStats();
  }, [refreshStats]);

  const getCachedWorkbook = useCallback(async (id: string) => {
    if (!cacheRef.current) return undefined;
    return cacheRef.current.getWorkbook(id);
  }, []);

  const getCachedWorkbooks = useCallback(async () => {
    if (!cacheRef.current) return [];
    return cacheRef.current.getAllWorkbooks();
  }, []);

  // ============ Sheet Operations ============

  const cacheSheet = useCallback(async (sheet: CachedSheet) => {
    if (!cacheRef.current) return;
    await cacheRef.current.saveSheet(sheet);
    await refreshStats();
  }, [refreshStats]);

  const getCachedSheet = useCallback(async (id: string) => {
    if (!cacheRef.current) return undefined;
    return cacheRef.current.getSheet(id);
  }, []);

  const getCachedSheets = useCallback(async (workbookId: string) => {
    if (!cacheRef.current) return [];
    return cacheRef.current.getSheetsByWorkbook(workbookId);
  }, []);

  // ============ Cell Operations ============

  const cacheCell = useCallback(async (cell: Omit<CachedCell, 'key'>) => {
    if (!cacheRef.current) return;
    await cacheRef.current.saveCell(cell);
  }, []);

  const cacheCells = useCallback(async (cells: Omit<CachedCell, 'key'>[]) => {
    if (!cacheRef.current) return;
    await cacheRef.current.saveCells(cells);
    await refreshStats();
  }, [refreshStats]);

  const getCachedCell = useCallback(
    async (workbookId: string, sheetId: string, row: number, col: number) => {
      if (!cacheRef.current) return undefined;
      return cacheRef.current.getCell(workbookId, sheetId, row, col);
    },
    []
  );

  const getCachedCells = useCallback(async (workbookId: string, sheetId: string) => {
    if (!cacheRef.current) return [];
    return cacheRef.current.getCellsBySheet(workbookId, sheetId);
  }, []);

  const getCachedCellsInRange = useCallback(
    async (
      workbookId: string,
      sheetId: string,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number
    ) => {
      if (!cacheRef.current) return [];
      return cacheRef.current.getCellsInRange(
        workbookId,
        sheetId,
        startRow,
        startCol,
        endRow,
        endCol
      );
    },
    []
  );

  // ============ Offline Changes ============

  const queueChange = useCallback(
    async (change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
      if (!cacheRef.current) return;
      await cacheRef.current.addPendingChange(change);
      await refreshStats();
    },
    [refreshStats]
  );

  const getPendingChanges = useCallback(async () => {
    if (!cacheRef.current) return [];
    return cacheRef.current.getPendingChanges();
  }, []);

  // ============ Sync Operations ============

  const sync = useCallback(async (): Promise<SyncResult> => {
    if (!cacheRef.current || !isOnline || isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync not available'] };
    }

    setIsSyncing(true);
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const changes = await cacheRef.current.getPendingChanges();

      for (const change of changes) {
        if (change.retryCount >= opts.maxRetries) {
          result.failed++;
          result.errors.push(`Max retries exceeded for change ${change.id}`);
          continue;
        }

        try {
          await syncChange(change);
          await cacheRef.current.removePendingChange(change.id);
          result.synced++;
        } catch (error) {
          await cacheRef.current.updatePendingChangeRetry(change.id);
          result.failed++;
          result.errors.push(
            `Failed to sync ${change.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      result.success = result.failed === 0;
      opts.onSyncComplete(result);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
      opts.onSyncError(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
      await refreshStats();
    }

    return result;
  }, [isOnline, isSyncing, opts, refreshStats]);

  // Sync a single change to the server
  const syncChange = async (change: PendingChange): Promise<void> => {
    const { type, workbookId, sheetId, data } = change;

    switch (type) {
      case 'SET_VALUE': {
        const { row, col, value } = data as { row: number; col: number; value: string };
        await apiClient.setCellValue(workbookId, sheetId, row, col, value);
        break;
      }
      case 'SET_FORMULA': {
        const { row, col, formula } = data as { row: number; col: number; formula: string };
        await apiClient.setCellFormula(workbookId, sheetId, row, col, formula);
        break;
      }
      case 'DELETE_CELL': {
        const { row, col } = data as { row: number; col: number };
        await apiClient.setCellValue(workbookId, sheetId, row, col, '');
        break;
      }
      case 'BULK_UPDATE': {
        const cells = data as Array<{ row: number; col: number; value?: string; formula?: string }>;
        for (const cell of cells) {
          if (cell.formula) {
            await apiClient.setCellFormula(workbookId, sheetId, cell.row, cell.col, cell.formula);
          } else if (cell.value !== undefined) {
            await apiClient.setCellValue(workbookId, sheetId, cell.row, cell.col, cell.value);
          }
        }
        break;
      }
      default:
        throw new Error(`Unknown change type: ${type}`);
    }
  };

  const clearPendingChanges = useCallback(async () => {
    if (!cacheRef.current) return;
    await cacheRef.current.clearPendingChanges();
    await refreshStats();
  }, [refreshStats]);

  // ============ Cache Management ============

  const clearCache = useCallback(async () => {
    if (!cacheRef.current) return;
    await cacheRef.current.clearCache();
    await refreshStats();
  }, [refreshStats]);

  return {
    // State
    isOnline,
    isAvailable,
    isSyncing,
    pendingChanges,
    stats,

    // Workbook operations
    cacheWorkbook,
    getCachedWorkbook,
    getCachedWorkbooks,

    // Sheet operations
    cacheSheet,
    getCachedSheet,
    getCachedSheets,

    // Cell operations
    cacheCell,
    cacheCells,
    getCachedCell,
    getCachedCells,
    getCachedCellsInRange,

    // Offline changes
    queueChange,
    getPendingChanges,

    // Sync operations
    sync,
    clearPendingChanges,

    // Cache management
    clearCache,
    refreshStats,
  };
}

// Hook for offline-first data fetching
export function useOfflineFirstFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheKey?: string;
    maxAge?: number;
    onError?: (error: Error) => void;
  } = {}
) {
  const { maxAge = 5 * 60 * 1000 } = options; // 5 minutes default
  const cache = useRef<IndexedDBCache | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (isIndexedDBAvailable()) {
      cache.current = getCache();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      // Try to get from cache first
      if (cache.current && options.cacheKey) {
        try {
          const cached = await cache.current.getMetadata<{ data: T; timestamp: number }>(
            options.cacheKey
          );
          if (cached) {
            if (isMounted) {
              setData(cached.data);
              setIsStale(Date.now() - cached.timestamp > maxAge);
            }
          }
        } catch (e) {
          loggers.cache.warn('Failed to read from cache:', e);
        }
      }

      // Fetch from network
      if (navigator.onLine) {
        try {
          const result = await fetcher();
          if (isMounted) {
            setData(result);
            setIsStale(false);
          }

          // Update cache
          if (cache.current && options.cacheKey) {
            await cache.current.setMetadata(options.cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }
        } catch (e) {
          const err = e instanceof Error ? e : new Error('Fetch failed');
          if (isMounted) {
            setError(err);
            options.onError?.(err);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [key, fetcher, options.cacheKey, maxAge, options.onError]);

  return { data, isLoading, error, isStale };
}

// Export types
export type { CachedWorkbook, CachedSheet, CachedCell, PendingChange, CacheStats };
