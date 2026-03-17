// Phase 10: Sync Manager
// Orchestrates synchronization between local IndexedDB and server
// Supports both REST API and Supabase direct sync

import { offlineDB, PendingChange, ConflictInfo, CellValue } from './OfflineDB';
import { supabaseStorage } from '../lib/supabaseStorage';
import { loggers } from '@/utils/logger';

// === Types ===

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: ConflictInfo[];
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  maxRetries?: number;
  batchSize?: number;
  timeout?: number;
}

export interface ServerCellData {
  sheetId: string;
  row: number;
  col: number;
  value: unknown;
  formula: string | null;
  version: number;
  updatedAt: number;
}

export type SyncEventType =
  | 'sync:start'
  | 'sync:progress'
  | 'sync:complete'
  | 'sync:error'
  | 'sync:conflict'
  | 'sync:offline';

export interface SyncEvent {
  type: SyncEventType;
  workbookId?: string;
  progress?: number;
  total?: number;
  result?: SyncResult;
  error?: string;
  conflict?: ConflictInfo;
}

type SyncEventListener = (event: SyncEvent) => void;

// === Sync Manager Class ===

class SyncManager {
  private syncing = new Map<string, boolean>();
  private listeners: Set<SyncEventListener> = new Set();
  private syncQueue: string[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor network status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // === Event Management ===

  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // === Network Status ===

  private handleOnline(): void {
    this.isOnline = true;
    // Process any queued sync requests
    this.processQueue();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emit({ type: 'sync:offline' });
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  // === Sync Operations ===

  async sync(workbookId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const { maxRetries = 3, batchSize = 50, timeout = 30000 } = options;

    // Check if already syncing
    if (this.syncing.get(workbookId)) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
        duration: 0,
      };
    }

    // Check network status
    if (!this.isOnline) {
      this.syncQueue.push(workbookId);
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        errors: ['Device is offline'],
        duration: 0,
      };
    }

    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    this.syncing.set(workbookId, true);
    this.emit({ type: 'sync:start', workbookId });

    try {
      // Get pending changes
      const pendingChanges = await offlineDB.getPendingChanges(workbookId);
      const total = pendingChanges.length;

      // Process in batches
      for (let i = 0; i < pendingChanges.length; i += batchSize) {
        const batch = pendingChanges.slice(i, i + batchSize);
        const batchResults = await this.processBatch(batch, maxRetries, timeout);

        result.synced += batchResults.synced;
        result.failed += batchResults.failed;
        result.conflicts.push(...batchResults.conflicts);
        result.errors.push(...batchResults.errors);

        this.emit({
          type: 'sync:progress',
          workbookId,
          progress: Math.min(i + batchSize, total),
          total,
        });
      }

      // Pull latest changes from server
      await this.pullChanges(workbookId);

      // Update sync state
      await offlineDB.updateSyncTime(workbookId);

      result.success = result.failed === 0 && result.conflicts.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.emit({ type: 'sync:error', workbookId, error: result.errors[0] });
    } finally {
      this.syncing.set(workbookId, false);
      result.duration = Date.now() - startTime;
      this.emit({ type: 'sync:complete', workbookId, result });
    }

    return result;
  }

  private async processBatch(
    changes: PendingChange[],
    maxRetries: number,
    timeout: number
  ): Promise<{
    synced: number;
    failed: number;
    conflicts: ConflictInfo[];
    errors: string[];
  }> {
    const result = {
      synced: 0,
      failed: 0,
      conflicts: [] as ConflictInfo[],
      errors: [] as string[],
    };

    for (const change of changes) {
      try {
        const response = await this.pushChange(change, timeout);

        if (response.conflict) {
          result.conflicts.push(response.conflict);
          this.emit({ type: 'sync:conflict', conflict: response.conflict });
        } else if (response.success) {
          await offlineDB.removePendingChange(change.id!);
          result.synced++;
        } else {
          // Retry logic
          if (change.retryCount < maxRetries) {
            await offlineDB.incrementRetryCount(change.id!);
          } else {
            await offlineDB.removePendingChange(change.id!);
            result.failed++;
            result.errors.push(`Change ${change.id} failed after ${maxRetries} retries`);
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    return result;
  }

  private async pushChange(
    change: PendingChange,
    timeout: number
  ): Promise<{ success: boolean; conflict?: ConflictInfo }> {
    // Use Supabase direct sync when available
    if (supabaseStorage.isAvailable && change.type === 'cell' && change.data && change.sheetId) {
      try {
        await supabaseStorage.upsertCell({
          sheetId: change.sheetId,
          row: change.data.row as number,
          col: change.data.col as number,
          value: change.data.value as unknown,
          formula: (change.data.formula as string) || null,
          displayValue: String(change.data.value ?? ''),
        });
        return { success: true };
      } catch (error) {
        // Fall through to REST API on Supabase error
        loggers.sync.warn('Supabase push failed, falling back to REST:', error);
      }
    }

    // Fallback: REST API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict detected
          const conflictData = await response.json();
          return {
            success: false,
            conflict: {
              cellId: change.cellId || '',
              localValue: change.data.value as CellValue,
              serverValue: conflictData.serverValue as CellValue,
              localTimestamp: change.timestamp,
              serverTimestamp: conflictData.serverTimestamp,
            },
          };
        }
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async pullChanges(workbookId: string): Promise<void> {
    const syncState = await offlineDB.getSyncState(workbookId);
    const since = syncState?.lastSyncedAt || 0;

    // Try Supabase first
    if (supabaseStorage.isAvailable) {
      try {
        // Get all sheets for this workbook to pull cells from each
        const sheets = await supabaseStorage.getSheets(workbookId);
        const sinceISO = new Date(since).toISOString();

        for (const sheet of sheets) {
          const serverCells = await supabaseStorage.getCellsSince(sheet.id, sinceISO);

          for (const sc of serverCells) {
            const cellId = offlineDB.generateCellId(sheet.id, sc.row_index, sc.col_index);
            const localCell = await offlineDB.getCell(cellId);
            const serverTimestamp = new Date(sc.updated_at).getTime();

            if (!localCell || !localCell.dirty || serverTimestamp > localCell.updatedAt) {
              await offlineDB.saveCell({
                id: cellId,
                sheetId: sheet.id,
                workbookId,
                row: sc.row_index,
                col: sc.col_index,
                value: sc.value as string | number | boolean | null,
                formula: sc.formula,
                displayValue: sc.display_value,
                updatedAt: serverTimestamp,
                dirty: false,
                version: sc.version,
              });
            }
          }
        }
        return;
      } catch (error) {
        loggers.sync.warn('Supabase pull failed, falling back to REST:', error);
      }
    }

    // Fallback: REST API
    try {
      const response = await fetch(`/api/sync/pull?workbookId=${workbookId}&since=${since}`);
      if (!response.ok) return;

      const data = await response.json();
      const serverCells: ServerCellData[] = data.cells || [];

      for (const serverCell of serverCells) {
        const cellId = offlineDB.generateCellId(serverCell.sheetId, serverCell.row, serverCell.col);
        const localCell = await offlineDB.getCell(cellId);

        if (!localCell || !localCell.dirty || serverCell.updatedAt > localCell.updatedAt) {
          await offlineDB.saveCell({
            id: cellId,
            sheetId: serverCell.sheetId,
            workbookId,
            row: serverCell.row,
            col: serverCell.col,
            value: serverCell.value as string | number | boolean | null,
            formula: serverCell.formula,
            displayValue: String(serverCell.value ?? ''),
            updatedAt: serverCell.updatedAt,
            dirty: false,
            version: serverCell.version,
          });
        }
      }
    } catch (error) {
      loggers.sync.error('Failed to pull changes:', error);
    }
  }

  private async processQueue(): Promise<void> {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const workbookId = this.syncQueue.shift();
      if (workbookId) {
        await this.sync(workbookId);
      }
    }
  }

  // === Status Methods ===

  isSyncing(workbookId: string): boolean {
    return this.syncing.get(workbookId) || false;
  }

  async getPendingCount(workbookId?: string): Promise<number> {
    return offlineDB.getPendingChangeCount(workbookId);
  }

  async getLastSyncTime(workbookId: string): Promise<number | null> {
    const state = await offlineDB.getSyncState(workbookId);
    return state?.lastSyncedAt || null;
  }

  // === Quick Save (for immediate local persistence) ===

  async saveLocally(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number,
    value: string | number | boolean | null,
    formula: string | null
  ): Promise<void> {
    const cellId = offlineDB.generateCellId(sheetId, row, col);
    const now = Date.now();

    // Save cell
    await offlineDB.saveCell({
      id: cellId,
      sheetId,
      workbookId,
      row,
      col,
      value,
      formula,
      displayValue: String(value ?? ''),
      updatedAt: now,
      dirty: true,
      version: 0,
    });

    // Add pending change
    await offlineDB.addPendingChange({
      workbookId,
      sheetId,
      cellId,
      type: 'cell',
      operation: 'update',
      data: { row, col, value, formula },
      timestamp: now,
      retryCount: 0,
    });

    // If online, trigger immediate sync
    if (this.isOnline && !this.syncing.get(workbookId)) {
      // Debounce sync to batch rapid changes
      this.debouncedSync(workbookId);
    }
  }

  private syncTimeouts = new Map<string, NodeJS.Timeout>();

  private debouncedSync(workbookId: string): void {
    const existing = this.syncTimeouts.get(workbookId);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(() => {
      this.syncTimeouts.delete(workbookId);
      this.sync(workbookId);
    }, 2000); // Wait 2 seconds of inactivity before syncing

    this.syncTimeouts.set(workbookId, timeout);
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
