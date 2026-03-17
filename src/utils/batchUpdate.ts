// ═══════════════════════════════════════════════════════════════════════════
// BATCH UPDATE UTILITIES — High-Performance Store Updates
// Batches rapid cell changes into single store updates to prevent
// React re-render storms on large datasets (100k+ rows)
// ═══════════════════════════════════════════════════════════════════════════

import type { CellData } from '../types/cell';

// ─────────────────────────────────────────────────────────────────────────────
// Micro-batch: Accumulate updates and flush periodically
// ─────────────────────────────────────────────────────────────────────────────

interface PendingUpdate {
  sheetId: string;
  key: string;
  data: Partial<CellData>;
}

type FlushCallback = (updates: Map<string, Map<string, Partial<CellData>>>) => void;

export class BatchUpdater {
  private pending: PendingUpdate[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushCallback: FlushCallback;
  private batchSize: number;
  private flushInterval: number;

  constructor(
    flushCallback: FlushCallback,
    options: { batchSize?: number; flushInterval?: number } = {}
  ) {
    this.flushCallback = flushCallback;
    this.batchSize = options.batchSize ?? 100;
    this.flushInterval = options.flushInterval ?? 16; // ~1 frame at 60fps
  }

  /** Queue a cell update */
  queue(sheetId: string, key: string, data: Partial<CellData>): void {
    this.pending.push({ sheetId, key, data });

    // Flush immediately if batch is full
    if (this.pending.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Schedule flush on next frame
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /** Flush all pending updates */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pending.length === 0) return;

    // Group by sheet
    const grouped = new Map<string, Map<string, Partial<CellData>>>();
    for (const { sheetId, key, data } of this.pending) {
      if (!grouped.has(sheetId)) grouped.set(sheetId, new Map());
      const existing = grouped.get(sheetId)!.get(key);
      grouped.get(sheetId)!.set(key, existing ? { ...existing, ...data } : data);
    }

    this.pending = [];
    this.flushCallback(grouped);
  }

  /** Get pending count */
  get pendingCount(): number {
    return this.pending.length;
  }

  /** Dispose */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pending = [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunked iteration: Process large cell maps without blocking UI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a large array in chunks, yielding to the event loop between chunks.
 * Prevents UI freezes when iterating 100k+ items.
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  options: { chunkSize?: number; onProgress?: (done: number, total: number) => void } = {}
): Promise<void> {
  const { chunkSize = 5000, onProgress } = options;

  return new Promise((resolve) => {
    let index = 0;
    const total = items.length;

    function processChunk() {
      const end = Math.min(index + chunkSize, total);
      for (; index < end; index++) {
        processor(items[index], index);
      }

      onProgress?.(index, total);

      if (index < total) {
        // Yield to event loop
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    processChunk();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy formula evaluation: Only evaluate visible cells
// ─────────────────────────────────────────────────────────────────────────────

export interface ViewportBounds {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

/**
 * Get cell keys within viewport bounds + buffer zone.
 * Buffer ensures smooth scrolling by pre-calculating nearby cells.
 */
export function getViewportCellKeys(
  cells: Record<string, unknown>,
  viewport: ViewportBounds,
  buffer: number = 20
): string[] {
  const minRow = Math.max(0, viewport.startRow - buffer);
  const maxRow = viewport.endRow + buffer;
  const minCol = Math.max(0, viewport.startCol - buffer);
  const maxCol = viewport.endCol + buffer;

  const keys: string[] = [];
  for (const key of Object.keys(cells)) {
    const [rowStr, colStr] = key.split(':');
    const row = parseInt(rowStr);
    const col = parseInt(colStr);
    if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Throttle function that ensures at most one call per animation frame
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: unknown[] | null = null;

  const throttled = (...args: unknown[]) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      });
    }
  };

  return throttled as T;
}

/**
 * Debounce with leading edge: fires immediately, then ignores for `delay` ms
 */
export function debounceLeading<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let canFire = true;

  const debounced = (...args: unknown[]) => {
    if (canFire) {
      fn(...args);
      canFire = false;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      canFire = true;
    }, delay);
  };

  return debounced as T;
}
