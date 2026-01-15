// Phase 10: IndexedDB Wrapper for Offline Storage
// Provides persistent storage for workbooks, cells, and pending changes

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// === Database Schema ===

interface ExcelOfflineDB extends DBSchema {
  workbooks: {
    key: string;
    value: OfflineWorkbook;
    indexes: { 'by-updated': number };
  };
  sheets: {
    key: string;
    value: OfflineSheet;
    indexes: { 'by-workbook': string };
  };
  cells: {
    key: string;
    value: OfflineCell;
    indexes: { 'by-sheet': string; 'by-dirty': number };
  };
  pendingChanges: {
    key: number;
    value: PendingChange;
    indexes: { 'by-workbook': string; 'by-timestamp': number };
  };
  syncState: {
    key: string;
    value: SyncState;
  };
}

// === Types ===

export interface OfflineWorkbook {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
  version: number;
  dirty: boolean;
}

export interface OfflineSheet {
  id: string;
  workbookId: string;
  name: string;
  index: number;
  updatedAt: number;
  dirty: boolean;
}

export interface OfflineCell {
  id: string; // Format: {sheetId}:{row}:{col}
  sheetId: string;
  workbookId: string;
  row: number;
  col: number;
  value: CellValue;
  formula: string | null;
  displayValue: string;
  updatedAt: number;
  dirty: boolean;
  version: number;
}

export type CellValue = string | number | boolean | null;

export interface PendingChange {
  id?: number;
  workbookId: string;
  sheetId?: string;
  cellId?: string;
  type: 'workbook' | 'sheet' | 'cell';
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface SyncState {
  workbookId: string;
  lastSyncedAt: number | null;
  lastSyncError: string | null;
  syncInProgress: boolean;
  serverVersion: number;
}

export interface ConflictInfo {
  cellId: string;
  localValue: CellValue;
  serverValue: CellValue;
  localTimestamp: number;
  serverTimestamp: number;
}

// === Database Class ===

class OfflineDB {
  private db: IDBPDatabase<ExcelOfflineDB> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initDB();
    return this.initPromise;
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<ExcelOfflineDB>('excel-offline-v1', 1, {
      upgrade(db) {
        // Workbooks store
        const workbooksStore = db.createObjectStore('workbooks', { keyPath: 'id' });
        workbooksStore.createIndex('by-updated', 'updatedAt');

        // Sheets store
        const sheetsStore = db.createObjectStore('sheets', { keyPath: 'id' });
        sheetsStore.createIndex('by-workbook', 'workbookId');

        // Cells store
        const cellsStore = db.createObjectStore('cells', { keyPath: 'id' });
        cellsStore.createIndex('by-sheet', 'sheetId');
        cellsStore.createIndex('by-dirty', 'dirty');

        // Pending changes store
        const pendingStore = db.createObjectStore('pendingChanges', {
          keyPath: 'id',
          autoIncrement: true,
        });
        pendingStore.createIndex('by-workbook', 'workbookId');
        pendingStore.createIndex('by-timestamp', 'timestamp');

        // Sync state store
        db.createObjectStore('syncState', { keyPath: 'workbookId' });
      },
    });
  }

  private ensureDB(): IDBPDatabase<ExcelOfflineDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // === Workbook Operations ===

  async saveWorkbook(workbook: OfflineWorkbook): Promise<void> {
    const db = this.ensureDB();
    await db.put('workbooks', workbook);
  }

  async getWorkbook(id: string): Promise<OfflineWorkbook | undefined> {
    const db = this.ensureDB();
    return db.get('workbooks', id);
  }

  async getAllWorkbooks(): Promise<OfflineWorkbook[]> {
    const db = this.ensureDB();
    return db.getAllFromIndex('workbooks', 'by-updated');
  }

  async deleteWorkbook(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['workbooks', 'sheets', 'cells', 'pendingChanges'], 'readwrite');

    // Delete all related data
    const sheets = await tx.objectStore('sheets').index('by-workbook').getAllKeys(id);
    for (const sheetId of sheets) {
      const cells = await tx.objectStore('cells').index('by-sheet').getAllKeys(sheetId);
      for (const cellId of cells) {
        await tx.objectStore('cells').delete(cellId);
      }
      await tx.objectStore('sheets').delete(sheetId);
    }

    // Delete pending changes for this workbook
    const pending = await tx.objectStore('pendingChanges').index('by-workbook').getAllKeys(id);
    for (const key of pending) {
      await tx.objectStore('pendingChanges').delete(key);
    }

    await tx.objectStore('workbooks').delete(id);
    await tx.done;
  }

  // === Sheet Operations ===

  async saveSheet(sheet: OfflineSheet): Promise<void> {
    const db = this.ensureDB();
    await db.put('sheets', sheet);
  }

  async getSheet(id: string): Promise<OfflineSheet | undefined> {
    const db = this.ensureDB();
    return db.get('sheets', id);
  }

  async getSheetsByWorkbook(workbookId: string): Promise<OfflineSheet[]> {
    const db = this.ensureDB();
    return db.getAllFromIndex('sheets', 'by-workbook', workbookId);
  }

  async deleteSheet(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['sheets', 'cells'], 'readwrite');

    // Delete all cells in this sheet
    const cells = await tx.objectStore('cells').index('by-sheet').getAllKeys(id);
    for (const cellId of cells) {
      await tx.objectStore('cells').delete(cellId);
    }

    await tx.objectStore('sheets').delete(id);
    await tx.done;
  }

  // === Cell Operations ===

  async saveCell(cell: OfflineCell): Promise<void> {
    const db = this.ensureDB();
    await db.put('cells', cell);
  }

  async saveCells(cells: OfflineCell[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('cells', 'readwrite');
    await Promise.all(cells.map((cell) => tx.store.put(cell)));
    await tx.done;
  }

  async getCell(id: string): Promise<OfflineCell | undefined> {
    const db = this.ensureDB();
    return db.get('cells', id);
  }

  async getCellByPosition(
    sheetId: string,
    row: number,
    col: number
  ): Promise<OfflineCell | undefined> {
    const id = `${sheetId}:${row}:${col}`;
    return this.getCell(id);
  }

  async getCellsBySheet(sheetId: string): Promise<OfflineCell[]> {
    const db = this.ensureDB();
    return db.getAllFromIndex('cells', 'by-sheet', sheetId);
  }

  async getDirtyCells(): Promise<OfflineCell[]> {
    const db = this.ensureDB();
    // Get all cells where dirty === true (stored as 1 in index)
    const allCells = await db.getAll('cells');
    return allCells.filter((cell) => cell.dirty);
  }

  async markCellsClean(cellIds: string[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('cells', 'readwrite');
    for (const id of cellIds) {
      const cell = await tx.store.get(id);
      if (cell) {
        cell.dirty = false;
        await tx.store.put(cell);
      }
    }
    await tx.done;
  }

  async deleteCell(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('cells', id);
  }

  // === Pending Changes Operations ===

  async addPendingChange(change: Omit<PendingChange, 'id'>): Promise<number> {
    const db = this.ensureDB();
    return db.add('pendingChanges', change as PendingChange);
  }

  async getPendingChanges(workbookId?: string): Promise<PendingChange[]> {
    const db = this.ensureDB();
    if (workbookId) {
      return db.getAllFromIndex('pendingChanges', 'by-workbook', workbookId);
    }
    return db.getAllFromIndex('pendingChanges', 'by-timestamp');
  }

  async getPendingChangeCount(workbookId?: string): Promise<number> {
    const db = this.ensureDB();
    if (workbookId) {
      return db.countFromIndex('pendingChanges', 'by-workbook', workbookId);
    }
    return db.count('pendingChanges');
  }

  async removePendingChange(id: number): Promise<void> {
    const db = this.ensureDB();
    await db.delete('pendingChanges', id);
  }

  async clearPendingChanges(workbookId?: string): Promise<void> {
    const db = this.ensureDB();
    if (workbookId) {
      const tx = db.transaction('pendingChanges', 'readwrite');
      const keys = await tx.store.index('by-workbook').getAllKeys(workbookId);
      for (const key of keys) {
        await tx.store.delete(key);
      }
      await tx.done;
    } else {
      await db.clear('pendingChanges');
    }
  }

  async incrementRetryCount(id: number): Promise<void> {
    const db = this.ensureDB();
    const change = await db.get('pendingChanges', id);
    if (change) {
      change.retryCount++;
      await db.put('pendingChanges', change);
    }
  }

  // === Sync State Operations ===

  async getSyncState(workbookId: string): Promise<SyncState | undefined> {
    const db = this.ensureDB();
    return db.get('syncState', workbookId);
  }

  async saveSyncState(state: SyncState): Promise<void> {
    const db = this.ensureDB();
    await db.put('syncState', state);
  }

  async updateSyncTime(workbookId: string): Promise<void> {
    const db = this.ensureDB();
    const state = (await db.get('syncState', workbookId)) || {
      workbookId,
      lastSyncedAt: null,
      lastSyncError: null,
      syncInProgress: false,
      serverVersion: 0,
    };
    state.lastSyncedAt = Date.now();
    state.lastSyncError = null;
    await db.put('syncState', state);
  }

  // === Storage Management ===

  async getStorageEstimate(): Promise<{ usage: number; quota: number; usagePercent: number }> {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
      return { usage, quota, usagePercent };
    }
    return { usage: 0, quota: 0, usagePercent: 0 };
  }

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    await Promise.all([
      db.clear('workbooks'),
      db.clear('sheets'),
      db.clear('cells'),
      db.clear('pendingChanges'),
      db.clear('syncState'),
    ]);
  }

  // === Utility Methods ===

  generateCellId(sheetId: string, row: number, col: number): string {
    return `${sheetId}:${row}:${col}`;
  }

  parseCellId(id: string): { sheetId: string; row: number; col: number } | null {
    const parts = id.split(':');
    if (parts.length !== 3) return null;
    return {
      sheetId: parts[0],
      row: parseInt(parts[1], 10),
      col: parseInt(parts[2], 10),
    };
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
