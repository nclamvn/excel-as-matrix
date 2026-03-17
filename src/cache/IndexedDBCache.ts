/**
 * IndexedDB Cache for Offline Support
 *
 * Provides persistent caching of spreadsheet data using IndexedDB,
 * enabling offline access and faster load times.
 */

import { loggers } from '@/utils/logger';

const DB_NAME = 'excel-claude-code';
const DB_VERSION = 1;

// Store names
const STORES = {
  WORKBOOKS: 'workbooks',
  SHEETS: 'sheets',
  CELLS: 'cells',
  FORMULAS: 'formulas',
  FORMATS: 'formats',
  METADATA: 'metadata',
  PENDING_CHANGES: 'pending_changes',
} as const;

// Types
export interface CachedWorkbook {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sheetIds: string[];
}

export interface CachedSheet {
  id: string;
  workbookId: string;
  name: string;
  index: number;
  rowCount: number;
  colCount: number;
}

export interface CachedCell {
  key: string; // workbookId:sheetId:row:col
  workbookId: string;
  sheetId: string;
  row: number;
  col: number;
  value: unknown;
  displayValue: string;
  formula?: string;
  updatedAt: number;
}

export interface CachedFormat {
  key: string;
  workbookId: string;
  sheetId: string;
  row: number;
  col: number;
  format: CellFormat;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  numberFormat?: string;
}

export interface PendingChange {
  id: string;
  type: 'SET_VALUE' | 'SET_FORMULA' | 'DELETE_CELL' | 'BULK_UPDATE';
  workbookId: string;
  sheetId: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export interface CacheMetadata {
  key: string;
  value: unknown;
  updatedAt: number;
}

// IndexedDB Cache class
export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize the database
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        loggers.cache.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.dbPromise;
  }

  /**
   * Create object stores
   */
  private createStores(db: IDBDatabase): void {
    // Workbooks store
    if (!db.objectStoreNames.contains(STORES.WORKBOOKS)) {
      db.createObjectStore(STORES.WORKBOOKS, { keyPath: 'id' });
    }

    // Sheets store
    if (!db.objectStoreNames.contains(STORES.SHEETS)) {
      const sheetsStore = db.createObjectStore(STORES.SHEETS, { keyPath: 'id' });
      sheetsStore.createIndex('workbookId', 'workbookId', { unique: false });
    }

    // Cells store
    if (!db.objectStoreNames.contains(STORES.CELLS)) {
      const cellsStore = db.createObjectStore(STORES.CELLS, { keyPath: 'key' });
      cellsStore.createIndex('workbookId', 'workbookId', { unique: false });
      cellsStore.createIndex('sheetId', 'sheetId', { unique: false });
      cellsStore.createIndex('workbook_sheet', ['workbookId', 'sheetId'], { unique: false });
    }

    // Formulas store (for quick formula lookup)
    if (!db.objectStoreNames.contains(STORES.FORMULAS)) {
      const formulasStore = db.createObjectStore(STORES.FORMULAS, { keyPath: 'key' });
      formulasStore.createIndex('sheetId', 'sheetId', { unique: false });
    }

    // Formats store
    if (!db.objectStoreNames.contains(STORES.FORMATS)) {
      const formatsStore = db.createObjectStore(STORES.FORMATS, { keyPath: 'key' });
      formatsStore.createIndex('sheetId', 'sheetId', { unique: false });
    }

    // Metadata store
    if (!db.objectStoreNames.contains(STORES.METADATA)) {
      db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
    }

    // Pending changes store (for offline sync)
    if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
      const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, { keyPath: 'id' });
      pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Get database instance
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.initDB();
  }

  /**
   * Generic get operation
   */
  private async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic put operation
   */
  private async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic delete operation
   */
  private async delete(storeName: string, key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from a store
   */
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get items by index
   */
  private async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ Workbook Operations ============

  async saveWorkbook(workbook: CachedWorkbook): Promise<void> {
    await this.put(STORES.WORKBOOKS, workbook);
  }

  async getWorkbook(id: string): Promise<CachedWorkbook | undefined> {
    return this.get<CachedWorkbook>(STORES.WORKBOOKS, id);
  }

  async getAllWorkbooks(): Promise<CachedWorkbook[]> {
    return this.getAll<CachedWorkbook>(STORES.WORKBOOKS);
  }

  async deleteWorkbook(id: string): Promise<void> {
    await this.delete(STORES.WORKBOOKS, id);
    // Also delete associated sheets and cells
    const sheets = await this.getSheetsByWorkbook(id);
    for (const sheet of sheets) {
      await this.deleteSheet(sheet.id);
    }
  }

  // ============ Sheet Operations ============

  async saveSheet(sheet: CachedSheet): Promise<void> {
    await this.put(STORES.SHEETS, sheet);
  }

  async getSheet(id: string): Promise<CachedSheet | undefined> {
    return this.get<CachedSheet>(STORES.SHEETS, id);
  }

  async getSheetsByWorkbook(workbookId: string): Promise<CachedSheet[]> {
    return this.getByIndex<CachedSheet>(STORES.SHEETS, 'workbookId', workbookId);
  }

  async deleteSheet(id: string): Promise<void> {
    const sheet = await this.getSheet(id);
    if (sheet) {
      // Delete all cells in the sheet
      await this.deleteCellsBySheet(sheet.workbookId, id);
    }
    await this.delete(STORES.SHEETS, id);
  }

  // ============ Cell Operations ============

  private getCellKey(workbookId: string, sheetId: string, row: number, col: number): string {
    return `${workbookId}:${sheetId}:${row}:${col}`;
  }

  async saveCell(cell: Omit<CachedCell, 'key'>): Promise<void> {
    const key = this.getCellKey(cell.workbookId, cell.sheetId, cell.row, cell.col);
    await this.put(STORES.CELLS, { ...cell, key, updatedAt: Date.now() });
  }

  async saveCells(cells: Omit<CachedCell, 'key'>[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CELLS, 'readwrite');
      const store = transaction.objectStore(STORES.CELLS);

      for (const cell of cells) {
        const key = this.getCellKey(cell.workbookId, cell.sheetId, cell.row, cell.col);
        store.put({ ...cell, key, updatedAt: Date.now() });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCell(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number
  ): Promise<CachedCell | undefined> {
    const key = this.getCellKey(workbookId, sheetId, row, col);
    return this.get<CachedCell>(STORES.CELLS, key);
  }

  async getCellsBySheet(workbookId: string, sheetId: string): Promise<CachedCell[]> {
    return this.getByIndex<CachedCell>(STORES.CELLS, 'workbook_sheet', [workbookId, sheetId]);
  }

  async getCellsInRange(
    workbookId: string,
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): Promise<CachedCell[]> {
    const allCells = await this.getCellsBySheet(workbookId, sheetId);
    return allCells.filter(
      (cell) =>
        cell.row >= startRow &&
        cell.row <= endRow &&
        cell.col >= startCol &&
        cell.col <= endCol
    );
  }

  async deleteCell(workbookId: string, sheetId: string, row: number, col: number): Promise<void> {
    const key = this.getCellKey(workbookId, sheetId, row, col);
    await this.delete(STORES.CELLS, key);
  }

  async deleteCellsBySheet(workbookId: string, sheetId: string): Promise<void> {
    const cells = await this.getCellsBySheet(workbookId, sheetId);
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.CELLS, 'readwrite');
      const store = transaction.objectStore(STORES.CELLS);

      for (const cell of cells) {
        store.delete(cell.key);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ============ Pending Changes (Offline Sync) ============

  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const pendingChange: PendingChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await this.put(STORES.PENDING_CHANGES, pendingChange);
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    const changes = await this.getAll<PendingChange>(STORES.PENDING_CHANGES);
    return changes.sort((a, b) => a.timestamp - b.timestamp);
  }

  async removePendingChange(id: string): Promise<void> {
    await this.delete(STORES.PENDING_CHANGES, id);
  }

  async updatePendingChangeRetry(id: string): Promise<void> {
    const change = await this.get<PendingChange>(STORES.PENDING_CHANGES, id);
    if (change) {
      change.retryCount++;
      await this.put(STORES.PENDING_CHANGES, change);
    }
  }

  async clearPendingChanges(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PENDING_CHANGES, 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_CHANGES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ Metadata ============

  async setMetadata(key: string, value: unknown): Promise<void> {
    await this.put(STORES.METADATA, { key, value, updatedAt: Date.now() });
  }

  async getMetadata<T>(key: string): Promise<T | undefined> {
    const data = await this.get<CacheMetadata>(STORES.METADATA, key);
    return data?.value as T | undefined;
  }

  // ============ Cache Management ============

  async getCacheSize(): Promise<number> {
    if (!navigator.storage?.estimate) {
      return 0;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }

  async clearCache(): Promise<void> {
    const db = await this.getDB();
    const storeNames = Array.from(db.objectStoreNames);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite');

      for (const storeName of storeNames) {
        transaction.objectStore(storeName).clear();
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ Cache Statistics ============

  async getStats(): Promise<CacheStats> {
    const [workbooks, sheets, cells, pendingChanges] = await Promise.all([
      this.getAll<CachedWorkbook>(STORES.WORKBOOKS),
      this.getAll<CachedSheet>(STORES.SHEETS),
      this.getAll<CachedCell>(STORES.CELLS),
      this.getPendingChanges(),
    ]);

    const size = await this.getCacheSize();

    return {
      workbookCount: workbooks.length,
      sheetCount: sheets.length,
      cellCount: cells.length,
      pendingChangeCount: pendingChanges.length,
      sizeBytes: size,
      lastUpdated: Math.max(...cells.map((c) => c.updatedAt), 0),
    };
  }
}

export interface CacheStats {
  workbookCount: number;
  sheetCount: number;
  cellCount: number;
  pendingChangeCount: number;
  sizeBytes: number;
  lastUpdated: number;
}

// Singleton instance
let cacheInstance: IndexedDBCache | null = null;

export function getCache(): IndexedDBCache {
  if (!cacheInstance) {
    cacheInstance = new IndexedDBCache();
  }
  return cacheInstance;
}

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}
