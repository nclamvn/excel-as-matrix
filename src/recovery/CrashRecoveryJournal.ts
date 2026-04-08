// ═══════════════════════════════════════════════════════════════════════════
// CRASH RECOVERY JOURNAL — Write-Ahead Log for data safety
// Writes cell changes to IndexedDB before applying to store.
// On reload, detects incomplete journals and offers recovery.
// ═══════════════════════════════════════════════════════════════════════════

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: number;
  sessionId: string;
  timestamp: number;
  sheetId: string;
  row: number;
  col: number;
  oldValue: unknown;
  oldFormula: string | null;
  newValue: unknown;
  newFormula: string | null;
  committed: boolean; // true once store has applied the change
}

export interface JournalCheckpoint {
  sessionId: string;
  createdAt: number;
  entryCount: number;
  lastCommittedId: number | null;
  closed: boolean; // true when session ends cleanly
}

export interface RecoveryData {
  uncommittedEntries: JournalEntry[];
  checkpoint: JournalCheckpoint;
  sessionAge: number; // ms since checkpoint was created
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB Schema
// ─────────────────────────────────────────────────────────────────────────────

interface JournalDB extends DBSchema {
  journalEntries: {
    key: number;
    value: JournalEntry;
    indexes: {
      'by-session': string;
      'by-committed': number; // 0 = uncommitted, 1 = committed
    };
  };
  checkpoints: {
    key: string; // sessionId
    value: JournalCheckpoint;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CrashRecoveryJournal
// ─────────────────────────────────────────────────────────────────────────────

class CrashRecoveryJournal {
  private db: IDBPDatabase<JournalDB> | null = null;
  private initPromise: Promise<void> | null = null;
  private sessionId: string;
  private entryBuffer: Omit<JournalEntry, 'id'>[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly FLUSH_INTERVAL = 500; // ms — flush every 500ms
  private readonly FLUSH_SIZE = 50; // entries
  private readonly MAX_JOURNAL_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initDB();
    return this.initPromise;
  }

  private async initDB(): Promise<void> {
    this.db = await openDB<JournalDB>('excel-recovery-v1', 1, {
      upgrade(db) {
        const entryStore = db.createObjectStore('journalEntries', {
          keyPath: 'id',
          autoIncrement: true,
        });
        entryStore.createIndex('by-session', 'sessionId');
        entryStore.createIndex('by-committed', 'committed');

        db.createObjectStore('checkpoints', { keyPath: 'sessionId' });
      },
    });

    // Create checkpoint for this session
    await this.db.put('checkpoints', {
      sessionId: this.sessionId,
      createdAt: Date.now(),
      entryCount: 0,
      lastCommittedId: null,
      closed: false,
    });
  }

  private ensureDB(): IDBPDatabase<JournalDB> {
    if (!this.db) {
      throw new Error('CrashRecoveryJournal not initialized. Call init() first.');
    }
    return this.db;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Write-Ahead Log — call BEFORE applying change to store
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a cell change in the journal before applying to store.
   * Buffered for performance — flushes every 500ms or 50 entries.
   */
  async writeAhead(
    sheetId: string,
    row: number,
    col: number,
    oldValue: unknown,
    oldFormula: string | null,
    newValue: unknown,
    newFormula: string | null
  ): Promise<void> {
    await this.init();

    this.entryBuffer.push({
      sessionId: this.sessionId,
      timestamp: Date.now(),
      sheetId,
      row,
      col,
      oldValue,
      oldFormula,
      newValue,
      newFormula,
      committed: false,
    });

    if (this.entryBuffer.length >= this.FLUSH_SIZE) {
      await this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * Mark entries as committed after store has successfully applied the change.
   */
  async markCommitted(entryIds: number[]): Promise<void> {
    if (entryIds.length === 0) return;
    const db = this.ensureDB();

    const tx = db.transaction(['journalEntries', 'checkpoints'], 'readwrite');

    for (const id of entryIds) {
      const entry = await tx.objectStore('journalEntries').get(id);
      if (entry) {
        entry.committed = true;
        await tx.objectStore('journalEntries').put(entry);
      }
    }

    // Update checkpoint
    const checkpoint = await tx.objectStore('checkpoints').get(this.sessionId);
    if (checkpoint) {
      checkpoint.lastCommittedId = entryIds[entryIds.length - 1];
      await tx.objectStore('checkpoints').put(checkpoint);
    }

    await tx.done;
  }

  /**
   * Flush buffered entries to IndexedDB
   */
  async flush(): Promise<number[]> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.entryBuffer.length === 0) return [];

    const db = this.ensureDB();
    const entries = [...this.entryBuffer];
    this.entryBuffer = [];

    const tx = db.transaction(['journalEntries', 'checkpoints'], 'readwrite');
    const ids: number[] = [];

    for (const entry of entries) {
      const id = await tx.objectStore('journalEntries').add(entry as JournalEntry);
      ids.push(id as number);
    }

    // Update checkpoint entry count
    const checkpoint = await tx.objectStore('checkpoints').get(this.sessionId);
    if (checkpoint) {
      checkpoint.entryCount += entries.length;
      await tx.objectStore('checkpoints').put(checkpoint);
    }

    await tx.done;
    return ids;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Recovery — check for data from crashed sessions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if there are unclosed sessions with uncommitted entries.
   * Call this on app startup before loading the workbook.
   */
  async checkForRecovery(): Promise<RecoveryData | null> {
    await this.init();
    const db = this.ensureDB();

    const checkpoints = await db.getAll('checkpoints');
    const now = Date.now();

    for (const cp of checkpoints) {
      // Skip current session and cleanly closed sessions
      if (cp.sessionId === this.sessionId || cp.closed) continue;

      // Skip too-old sessions
      if (now - cp.createdAt > this.MAX_JOURNAL_AGE) continue;

      // Find uncommitted entries for this session
      const allEntries = await db.getAllFromIndex('journalEntries', 'by-session', cp.sessionId);
      const uncommitted = allEntries.filter((e) => !e.committed);

      if (uncommitted.length > 0) {
        loggers.store.warn(
          `Recovery: found ${uncommitted.length} uncommitted entries from session ${cp.sessionId}`
        );

        return {
          uncommittedEntries: uncommitted,
          checkpoint: cp,
          sessionAge: now - cp.createdAt,
        };
      }
    }

    return null;
  }

  /**
   * Apply recovered entries to the workbook store.
   * Returns the entries that were applied.
   */
  async applyRecovery(
    recoveryData: RecoveryData,
    applier: (entry: JournalEntry) => void
  ): Promise<number> {
    const { uncommittedEntries, checkpoint } = recoveryData;
    let applied = 0;

    // Sort by timestamp to replay in order
    const sorted = [...uncommittedEntries].sort((a, b) => a.timestamp - b.timestamp);

    for (const entry of sorted) {
      try {
        applier(entry);
        applied++;
      } catch (error) {
        loggers.store.error(`Recovery: failed to apply entry ${entry.id}:`, error);
      }
    }

    // Mark the recovered session as closed
    const db = this.ensureDB();
    checkpoint.closed = true;
    await db.put('checkpoints', checkpoint);

    // Mark entries as committed
    const ids = sorted.map((e) => e.id).filter((id): id is number => id !== undefined);
    await this.markCommitted(ids);

    loggers.store.info(`Recovery: applied ${applied}/${uncommittedEntries.length} entries`);
    return applied;
  }

  /**
   * Dismiss recovery data without applying (user chose to discard).
   */
  async dismissRecovery(recoveryData: RecoveryData): Promise<void> {
    const db = this.ensureDB();

    // Mark checkpoint as closed
    recoveryData.checkpoint.closed = true;
    await db.put('checkpoints', recoveryData.checkpoint);

    loggers.store.info(`Recovery: dismissed ${recoveryData.uncommittedEntries.length} entries`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Session lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Close the current session cleanly (call on beforeunload or app teardown).
   */
  async closeSession(): Promise<void> {
    await this.flush();

    try {
      const db = this.ensureDB();
      const checkpoint = await db.get('checkpoints', this.sessionId);
      if (checkpoint) {
        checkpoint.closed = true;
        await db.put('checkpoints', checkpoint);
      }
    } catch {
      // Best effort — page might be unloading
    }
  }

  /**
   * Clean up old sessions and committed entries to save storage.
   */
  async cleanup(): Promise<number> {
    await this.init();
    const db = this.ensureDB();

    const cutoff = Date.now() - this.MAX_JOURNAL_AGE;
    const checkpoints = await db.getAll('checkpoints');
    let cleaned = 0;

    for (const cp of checkpoints) {
      if (cp.sessionId === this.sessionId) continue;
      if (cp.createdAt >= cutoff && !cp.closed) continue;

      // Delete all entries for this old/closed session
      const entries = await db.getAllFromIndex('journalEntries', 'by-session', cp.sessionId);
      const tx = db.transaction(['journalEntries', 'checkpoints'], 'readwrite');

      for (const entry of entries) {
        await tx.objectStore('journalEntries').delete(entry.id);
        cleaned++;
      }

      await tx.objectStore('checkpoints').delete(cp.sessionId);
      await tx.done;
    }

    if (cleaned > 0) {
      loggers.store.debug(`Recovery: cleaned up ${cleaned} old journal entries`);
    }

    return cleaned;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get journal stats for diagnostics
   */
  async getStats(): Promise<{
    sessionId: string;
    pendingFlush: number;
    totalEntries: number;
    uncommittedEntries: number;
  }> {
    await this.init();
    const db = this.ensureDB();

    const all = await db.getAll('journalEntries');
    const uncommitted = all.filter((e) => e.sessionId === this.sessionId && !e.committed);

    return {
      sessionId: this.sessionId,
      pendingFlush: this.entryBuffer.length,
      totalEntries: all.length,
      uncommittedEntries: uncommitted.length,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const crashRecovery = new CrashRecoveryJournal();
