// Mock IndexedDB for testing
import { vi } from 'vitest';

interface MockObjectStore {
  name: string;
  data: Map<string, unknown>;
  keyPath: string | null;
  autoIncrement: boolean;
  indexNames: DOMStringList;
}

interface MockTransaction {
  objectStoreNames: DOMStringList;
  mode: IDBTransactionMode;
  db: MockIDBDatabase;
  error: DOMException | null;
  oncomplete: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onabort: ((event: Event) => void) | null;

  objectStore(name: string): MockIDBObjectStore;
  abort(): void;
  commit(): void;
}

interface MockIDBObjectStore {
  name: string;
  keyPath: string | string[] | null;
  indexNames: DOMStringList;
  transaction: MockTransaction;
  autoIncrement: boolean;

  add(value: unknown, key?: IDBValidKey): MockIDBRequest;
  put(value: unknown, key?: IDBValidKey): MockIDBRequest;
  delete(key: IDBValidKey | IDBKeyRange): MockIDBRequest;
  clear(): MockIDBRequest;
  get(key: IDBValidKey | IDBKeyRange): MockIDBRequest;
  getAll(query?: IDBValidKey | IDBKeyRange | null, count?: number): MockIDBRequest;
  count(query?: IDBValidKey | IDBKeyRange): MockIDBRequest;
  openCursor(
    query?: IDBValidKey | IDBKeyRange | null,
    direction?: IDBCursorDirection
  ): MockIDBRequest;
  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex;
  index(name: string): IDBIndex;
  deleteIndex(name: string): void;
}

interface MockIDBRequest {
  result: unknown;
  error: DOMException | null;
  source: MockIDBObjectStore | IDBIndex | IDBCursor | null;
  transaction: MockTransaction | null;
  readyState: 'pending' | 'done';
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
}

interface MockIDBDatabase {
  name: string;
  version: number;
  objectStoreNames: DOMStringList;

  createObjectStore(
    name: string,
    options?: IDBObjectStoreParameters
  ): MockIDBObjectStore;
  deleteObjectStore(name: string): void;
  transaction(
    storeNames: string | string[],
    mode?: IDBTransactionMode
  ): MockTransaction;
  close(): void;
}

// Storage for mock databases
const databases = new Map<string, Map<string, MockObjectStore>>();

// Create a mock DOMStringList
function createMockDOMStringList(items: string[]): DOMStringList {
  const list = items as unknown as DOMStringList;
  (list as unknown as { contains: (name: string) => boolean }).contains = (name: string) =>
    items.includes(name);
  (list as unknown as { item: (index: number) => string | null }).item = (index: number) =>
    items[index] || null;
  return list;
}

// Create mock IDB request
function createMockRequest(
  source: MockIDBObjectStore | null = null,
  transaction: MockTransaction | null = null
): MockIDBRequest {
  const request: MockIDBRequest = {
    result: undefined,
    error: null,
    source,
    transaction,
    readyState: 'pending',
    onsuccess: null,
    onerror: null,
  };

  return request;
}

// Resolve a mock request asynchronously
function resolveRequest(request: MockIDBRequest, result: unknown): void {
  setTimeout(() => {
    request.result = result;
    request.readyState = 'done';
    if (request.onsuccess) {
      request.onsuccess(new Event('success'));
    }
  }, 0);
}

// Reject a mock request
function rejectRequest(request: MockIDBRequest, error: string): void {
  setTimeout(() => {
    request.error = new DOMException(error);
    request.readyState = 'done';
    if (request.onerror) {
      request.onerror(new Event('error'));
    }
  }, 0);
}

// Create mock object store
function createMockObjectStore(
  name: string,
  keyPath: string | null = null,
  autoIncrement: boolean = false,
  transaction: MockTransaction
): MockIDBObjectStore {
  const data = databases.get(transaction.db.name)?.get(name)?.data || new Map();

  const store: MockIDBObjectStore = {
    name,
    keyPath,
    autoIncrement,
    indexNames: createMockDOMStringList([]),
    transaction,

    add(value: unknown, key?: IDBValidKey) {
      const request = createMockRequest(this, transaction);
      const actualKey = key || (keyPath ? (value as Record<string, unknown>)[keyPath as string] : undefined);

      if (data.has(String(actualKey))) {
        rejectRequest(request, 'Key already exists');
      } else {
        data.set(String(actualKey), value);
        resolveRequest(request, actualKey);
      }
      return request;
    },

    put(value: unknown, key?: IDBValidKey) {
      const request = createMockRequest(this, transaction);
      const actualKey = key || (keyPath ? (value as Record<string, unknown>)[keyPath as string] : undefined);
      data.set(String(actualKey), value);
      resolveRequest(request, actualKey);
      return request;
    },

    delete(key: IDBValidKey) {
      const request = createMockRequest(this, transaction);
      data.delete(String(key));
      resolveRequest(request, undefined);
      return request;
    },

    clear() {
      const request = createMockRequest(this, transaction);
      data.clear();
      resolveRequest(request, undefined);
      return request;
    },

    get(key: IDBValidKey) {
      const request = createMockRequest(this, transaction);
      resolveRequest(request, data.get(String(key)));
      return request;
    },

    getAll(_query?: IDBValidKey | IDBKeyRange | null, count?: number) {
      const request = createMockRequest(this, transaction);
      let results = Array.from(data.values());
      if (count !== undefined) {
        results = results.slice(0, count);
      }
      resolveRequest(request, results);
      return request;
    },

    count() {
      const request = createMockRequest(this, transaction);
      resolveRequest(request, data.size);
      return request;
    },

    openCursor() {
      const request = createMockRequest(this, transaction);
      // Simplified cursor implementation
      resolveRequest(request, null);
      return request;
    },

    createIndex(indexName: string) {
      return {} as IDBIndex;
    },

    index(_name: string) {
      return {} as IDBIndex;
    },

    deleteIndex(_name: string) {
      // No-op
    },
  };

  return store;
}

// Create mock transaction
function createMockTransaction(
  db: MockIDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode = 'readonly'
): MockTransaction {
  const transaction: MockTransaction = {
    objectStoreNames: createMockDOMStringList(storeNames),
    mode,
    db,
    error: null,
    oncomplete: null,
    onerror: null,
    onabort: null,

    objectStore(name: string) {
      if (!storeNames.includes(name)) {
        throw new DOMException(`Object store "${name}" not in transaction scope`);
      }
      return createMockObjectStore(
        name,
        databases.get(db.name)?.get(name)?.keyPath || null,
        databases.get(db.name)?.get(name)?.autoIncrement || false,
        this
      );
    },

    abort() {
      if (this.onabort) {
        this.onabort(new Event('abort'));
      }
    },

    commit() {
      if (this.oncomplete) {
        setTimeout(() => {
          this.oncomplete!(new Event('complete'));
        }, 0);
      }
    },
  };

  // Auto-complete transaction
  setTimeout(() => {
    if (transaction.oncomplete) {
      transaction.oncomplete(new Event('complete'));
    }
  }, 10);

  return transaction;
}

// Create mock database
function createMockDatabase(name: string, version: number): MockIDBDatabase {
  if (!databases.has(name)) {
    databases.set(name, new Map());
  }

  const storeMap = databases.get(name)!;

  const db: MockIDBDatabase = {
    name,
    version,
    objectStoreNames: createMockDOMStringList(Array.from(storeMap.keys())),

    createObjectStore(storeName: string, options?: IDBObjectStoreParameters) {
      const store: MockObjectStore = {
        name: storeName,
        data: new Map(),
        keyPath: (options?.keyPath as string) || null,
        autoIncrement: options?.autoIncrement || false,
        indexNames: createMockDOMStringList([]),
      };
      storeMap.set(storeName, store);
      (this.objectStoreNames as unknown as string[]).push(storeName);
      return createMockObjectStore(
        storeName,
        store.keyPath,
        store.autoIncrement,
        createMockTransaction(this, [storeName], 'readwrite')
      );
    },

    deleteObjectStore(storeName: string) {
      storeMap.delete(storeName);
      const names = Array.from(storeMap.keys());
      this.objectStoreNames = createMockDOMStringList(names);
    },

    transaction(storeNames: string | string[], mode?: IDBTransactionMode) {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      return createMockTransaction(this, names, mode);
    },

    close() {
      // No-op for mock
    },
  };

  return db;
}

// Mock indexedDB global
export const mockIndexedDB = {
  open: vi.fn().mockImplementation((name: string, version?: number) => {
    const request = {
      result: null as MockIDBDatabase | null,
      error: null as DOMException | null,
      readyState: 'pending' as 'pending' | 'done',
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
      onblocked: null as ((event: Event) => void) | null,
    };

    setTimeout(() => {
      const db = createMockDatabase(name, version || 1);
      request.result = db;
      request.readyState = 'done';

      // Trigger upgrade if new version
      if (request.onupgradeneeded) {
        const event = {
          target: { result: db },
          oldVersion: 0,
          newVersion: version || 1,
        } as unknown as IDBVersionChangeEvent;
        request.onupgradeneeded(event);
      }

      if (request.onsuccess) {
        const event = { target: { result: db } } as unknown as Event;
        request.onsuccess(event);
      }
    }, 0);

    return request;
  }),

  deleteDatabase: vi.fn().mockImplementation((name: string) => {
    const request = createMockRequest();
    databases.delete(name);
    resolveRequest(request, undefined);
    return request;
  }),

  cmp: vi.fn().mockImplementation((a: unknown, b: unknown) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }),

  databases: vi.fn().mockImplementation(async () => {
    return Array.from(databases.keys()).map((name) => ({
      name,
      version: 1,
    }));
  }),
};

// Install/uninstall functions
export function installIndexedDBMock(): void {
  (global as Record<string, unknown>).indexedDB = mockIndexedDB;
}

export function uninstallIndexedDBMock(): void {
  delete (global as Record<string, unknown>).indexedDB;
}

// Reset mock state
export function resetIndexedDBMock(): void {
  databases.clear();
  mockIndexedDB.open.mockClear();
  mockIndexedDB.deleteDatabase.mockClear();
}

// Test helpers
export function getMockDatabaseData(dbName: string): Map<string, MockObjectStore> | undefined {
  return databases.get(dbName);
}

export function setMockDatabaseData(
  dbName: string,
  storeName: string,
  data: Record<string, unknown>
): void {
  if (!databases.has(dbName)) {
    databases.set(dbName, new Map());
  }
  const store: MockObjectStore = {
    name: storeName,
    data: new Map(Object.entries(data)),
    keyPath: 'id',
    autoIncrement: false,
    indexNames: createMockDOMStringList([]),
  };
  databases.get(dbName)!.set(storeName, store);
}

export default mockIndexedDB;
