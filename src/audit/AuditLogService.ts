// ═══════════════════════════════════════════════════════════════════════════
// IMMUTABLE AUDIT LOG SERVICE — Append-only audit trail
// Provides tamper-resistant logging for compliance (SOC2, GDPR)
// ═══════════════════════════════════════════════════════════════════════════

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuditCategory =
  | 'auth'
  | 'data'
  | 'ai'
  | 'sharing'
  | 'admin'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO 8601
  category: AuditCategory;
  action: string;
  severity: AuditSeverity;
  userId: string | null;
  sessionId: string | null;
  workbookId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  // Integrity
  checksum: string;
  previousChecksum: string | null; // Chain hash for tamper detection
}

export interface AuditQuery {
  category?: AuditCategory;
  action?: string;
  severity?: AuditSeverity;
  userId?: string;
  workbookId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditExport {
  exportedAt: string;
  version: string;
  entryCount: number;
  entries: AuditEntry[];
  integrityValid: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB Schema
// ─────────────────────────────────────────────────────────────────────────────

interface AuditDB extends DBSchema {
  auditEntries: {
    key: string;
    value: AuditEntry;
    indexes: {
      'by-timestamp': string;
      'by-category': string;
      'by-userId': string;
      'by-workbookId': string;
      'by-severity': string;
      'by-action': string;
    };
  };
  auditMeta: {
    key: string;
    value: { key: string; value: string };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Checksum utility
// ─────────────────────────────────────────────────────────────────────────────

async function computeChecksum(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash for environments without SubtleCrypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// AuditLogService Class
// ─────────────────────────────────────────────────────────────────────────────

class AuditLogService {
  private db: IDBPDatabase<AuditDB> | null = null;
  private initPromise: Promise<void> | null = null;
  private lastChecksum: string | null = null;
  private buffer: Array<Omit<AuditEntry, 'id' | 'checksum' | 'previousChecksum'>> = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly FLUSH_INTERVAL = 1000; // ms
  private readonly FLUSH_SIZE = 20; // entries

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initDB();
    return this.initPromise;
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<AuditDB>('excel-audit-v1', 1, {
      upgrade(db) {
        const store = db.createObjectStore('auditEntries', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-category', 'category');
        store.createIndex('by-userId', 'userId');
        store.createIndex('by-workbookId', 'workbookId');
        store.createIndex('by-severity', 'severity');
        store.createIndex('by-action', 'action');

        db.createObjectStore('auditMeta', { keyPath: 'key' });
      },
    });

    // Restore last checksum for chain integrity
    const meta = await this.db.get('auditMeta', 'lastChecksum');
    this.lastChecksum = meta?.value || null;
  }

  private ensureDB(): IDBPDatabase<AuditDB> {
    if (!this.db) {
      throw new Error('AuditLogService not initialized. Call init() first.');
    }
    return this.db;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Append-only write (IMMUTABLE — no update or delete methods exposed)
  // ─────────────────────────────────────────────────────────────────────────

  async log(
    category: AuditCategory,
    action: string,
    description: string,
    options: {
      severity?: AuditSeverity;
      userId?: string | null;
      sessionId?: string | null;
      workbookId?: string | null;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<string> {
    await this.init();

    const entry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      description,
      severity: options.severity || 'info',
      userId: options.userId ?? null,
      sessionId: options.sessionId ?? null,
      workbookId: options.workbookId ?? null,
      metadata: options.metadata || {},
    };

    // Buffer for batch writes
    this.buffer.push(entry);

    if (this.buffer.length >= this.FLUSH_SIZE) {
      return this.flush();
    }

    // Schedule flush
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }

    return ''; // ID assigned on flush
  }

  /**
   * Flush buffered entries to IndexedDB
   */
  async flush(): Promise<string> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) return '';

    const db = this.ensureDB();
    const entries = [...this.buffer];
    this.buffer = [];

    const tx = db.transaction(['auditEntries', 'auditMeta'], 'readwrite');
    let lastId = '';

    for (const entry of entries) {
      const id = crypto.randomUUID();
      const checksumData = JSON.stringify({
        id,
        ...entry,
        previousChecksum: this.lastChecksum,
      });
      const checksum = await computeChecksum(checksumData);

      const fullEntry: AuditEntry = {
        id,
        ...entry,
        checksum,
        previousChecksum: this.lastChecksum,
      };

      await tx.objectStore('auditEntries').add(fullEntry);
      this.lastChecksum = checksum;
      lastId = id;
    }

    // Persist last checksum
    await tx.objectStore('auditMeta').put({
      key: 'lastChecksum',
      value: this.lastChecksum!,
    });

    await tx.done;

    loggers.admin.debug(`Audit: flushed ${entries.length} entries`);
    return lastId;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience logging methods
  // ─────────────────────────────────────────────────────────────────────────

  async logAuth(action: string, description: string, userId?: string, metadata?: Record<string, unknown>) {
    return this.log('auth', action, description, { userId, metadata });
  }

  async logData(action: string, description: string, options?: { userId?: string; workbookId?: string; metadata?: Record<string, unknown> }) {
    return this.log('data', action, description, options);
  }

  async logAI(action: string, description: string, options?: { userId?: string; workbookId?: string; severity?: AuditSeverity; metadata?: Record<string, unknown> }) {
    return this.log('ai', action, description, options);
  }

  async logSharing(action: string, description: string, options?: { userId?: string; workbookId?: string; metadata?: Record<string, unknown> }) {
    return this.log('sharing', action, description, options);
  }

  async logAdmin(action: string, description: string, options?: { userId?: string; severity?: AuditSeverity; metadata?: Record<string, unknown> }) {
    return this.log('admin', action, description, options);
  }

  async logSystem(action: string, description: string, options?: { severity?: AuditSeverity; metadata?: Record<string, unknown> }) {
    return this.log('system', action, description, options);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Query (read-only)
  // ─────────────────────────────────────────────────────────────────────────

  async query(query: AuditQuery = {}): Promise<{ entries: AuditEntry[]; total: number }> {
    await this.init();
    await this.flush(); // Ensure all buffered entries are persisted

    const db = this.ensureDB();
    let entries: AuditEntry[];

    // Use index for single-field queries
    if (query.category && !query.userId && !query.workbookId) {
      entries = await db.getAllFromIndex('auditEntries', 'by-category', query.category);
    } else if (query.userId && !query.category && !query.workbookId) {
      entries = await db.getAllFromIndex('auditEntries', 'by-userId', query.userId);
    } else if (query.workbookId && !query.category && !query.userId) {
      entries = await db.getAllFromIndex('auditEntries', 'by-workbookId', query.workbookId);
    } else {
      entries = await db.getAll('auditEntries');
    }

    // Apply filters
    let filtered = entries;

    if (query.category && filtered[0]?.category !== undefined) {
      filtered = filtered.filter((e) => e.category === query.category);
    }
    if (query.action) {
      filtered = filtered.filter((e) => e.action === query.action);
    }
    if (query.severity) {
      filtered = filtered.filter((e) => e.severity === query.severity);
    }
    if (query.userId) {
      filtered = filtered.filter((e) => e.userId === query.userId);
    }
    if (query.workbookId) {
      filtered = filtered.filter((e) => e.workbookId === query.workbookId);
    }
    if (query.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const total = filtered.length;

    // Pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    filtered = filtered.slice(offset, offset + limit);

    return { entries: filtered, total };
  }

  /**
   * Get entry count by category
   */
  async getCounts(): Promise<Record<AuditCategory, number>> {
    await this.init();
    await this.flush();

    const db = this.ensureDB();
    const all = await db.getAll('auditEntries');

    const counts: Record<AuditCategory, number> = {
      auth: 0,
      data: 0,
      ai: 0,
      sharing: 0,
      admin: 0,
      system: 0,
    };

    for (const entry of all) {
      counts[entry.category]++;
    }

    return counts;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Integrity Verification
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify the integrity of the audit chain
   * Detects any tampered or missing entries
   */
  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    errors: string[];
  }> {
    await this.init();
    await this.flush();

    const db = this.ensureDB();
    const entries = await db.getAllFromIndex('auditEntries', 'by-timestamp');
    const errors: string[] = [];

    let previousChecksum: string | null = null;

    for (const entry of entries) {
      // Verify chain link
      if (entry.previousChecksum !== previousChecksum) {
        errors.push(
          `Chain break at entry ${entry.id}: expected previous=${previousChecksum}, got=${entry.previousChecksum}`
        );
      }

      // Verify checksum
      const checksumData = JSON.stringify({
        id: entry.id,
        timestamp: entry.timestamp,
        category: entry.category,
        action: entry.action,
        description: entry.description,
        severity: entry.severity,
        userId: entry.userId,
        sessionId: entry.sessionId,
        workbookId: entry.workbookId,
        metadata: entry.metadata,
        previousChecksum: entry.previousChecksum,
      });

      const expectedChecksum = await computeChecksum(checksumData);
      if (entry.checksum !== expectedChecksum) {
        errors.push(
          `Tampered entry ${entry.id}: checksum mismatch`
        );
      }

      previousChecksum = entry.checksum;
    }

    return {
      valid: errors.length === 0,
      totalEntries: entries.length,
      errors,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Export (for compliance)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Export audit log entries as JSON for compliance review
   */
  async export(query: AuditQuery = {}): Promise<AuditExport> {
    const { entries } = await this.query({ ...query, limit: 100000 }); // No limit for export
    const integrity = await this.verifyIntegrity();

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      entryCount: entries.length,
      entries,
      integrityValid: integrity.valid,
    };
  }

  /**
   * Export as downloadable JSON file
   */
  async exportToFile(): Promise<Blob> {
    const data = await this.export();
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Retention management (only allows purging old entries, not arbitrary delete)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Purge entries older than retention period
   * This is the ONLY delete operation allowed — for storage management
   */
  async purgeOlderThan(days: number): Promise<number> {
    await this.init();

    const db = this.ensureDB();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString();

    const all = await db.getAllFromIndex('auditEntries', 'by-timestamp');
    const toDelete = all.filter((e) => e.timestamp < cutoffISO);

    if (toDelete.length === 0) return 0;

    // Log the purge action before deleting
    await this.log('system', 'audit.purge', `Purging ${toDelete.length} entries older than ${days} days`, {
      severity: 'warning',
      metadata: { purgedCount: toDelete.length, retentionDays: days },
    });

    const tx = db.transaction('auditEntries', 'readwrite');
    for (const entry of toDelete) {
      await tx.store.delete(entry.id);
    }
    await tx.done;

    loggers.admin.info(`Audit: purged ${toDelete.length} entries older than ${days} days`);
    return toDelete.length;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const auditLog = new AuditLogService();
