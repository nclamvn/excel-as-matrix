// ═══════════════════════════════════════════════════════════════════════════
// FORMULA WORKER BRIDGE
// Main thread ↔ Worker communication for formula calculation
// Sends cell data to worker, receives computed results
// ═══════════════════════════════════════════════════════════════════════════

import type { CellData } from '../types/cell';
import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkerRequest {
  id: string;
  type: 'CALCULATE' | 'BULK_CALCULATE' | 'INVALIDATE' | 'CLEAR_CACHE';
  payload: unknown;
}

export interface CalculatePayload {
  formula: string;
  sheetId: string;
  row: number;
  col: number;
  cells: SerializedCellMap;
}

export interface BulkCalculatePayload {
  formulas: Array<{ formula: string; sheetId: string; row: number; col: number }>;
  cells: SerializedCellMap;
}

export interface WorkerResponse {
  id: string;
  type: 'RESULT' | 'BULK_RESULT' | 'ERROR' | 'PROGRESS';
  payload: unknown;
}

export interface CalculateResult {
  value: string | number | boolean | null;
  displayValue: string;
  error?: string;
  dependencies: Array<{ sheetId: string; row: number; col: number }>;
}

// Serializable cell map for worker transfer
export type SerializedCellMap = Record<string, {
  value: string | number | boolean | null;
  formula: string | null;
}>;

// ─────────────────────────────────────────────────────────────────────────────
// Bridge Class
// ─────────────────────────────────────────────────────────────────────────────

class FormulaWorkerBridge {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }>();
  private requestId = 0;

  // Initialize worker
  init(): void {
    if (this.worker) return;

    try {
      this.worker = new Worker(
        new URL('./calc.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, payload } = event.data;
        const pending = this.pendingRequests.get(id);
        if (!pending) return;

        this.pendingRequests.delete(id);

        if (type === 'ERROR') {
          pending.reject(payload);
        } else {
          pending.resolve(payload);
        }
      };

      this.worker.onerror = (error) => {
        loggers.worker.error('Worker error:', error);
        // Reject all pending requests
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error('Worker error'));
          this.pendingRequests.delete(id);
        }
      };
    } catch {
      // Workers not supported — calculations will run on main thread
      loggers.worker.warn('Web Workers not available, falling back to main thread');
    }
  }

  // Send a request to the worker
  private send<T>(type: WorkerRequest['type'], payload: unknown): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = String(++this.requestId);

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.worker!.postMessage({ id, type, payload });
    });
  }

  // Calculate a single formula
  async calculate(
    formula: string,
    sheetId: string,
    row: number,
    col: number,
    cells: SerializedCellMap
  ): Promise<CalculateResult> {
    return this.send<CalculateResult>('CALCULATE', {
      formula,
      sheetId,
      row,
      col,
      cells,
    });
  }

  // Bulk calculate multiple formulas
  async bulkCalculate(
    formulas: Array<{ formula: string; sheetId: string; row: number; col: number }>,
    cells: SerializedCellMap
  ): Promise<CalculateResult[]> {
    return this.send<CalculateResult[]>('BULK_CALCULATE', {
      formulas,
      cells,
    });
  }

  // Serialize cell data for transfer to worker
  static serializeCells(
    sheetId: string,
    cells: Record<string, CellData>
  ): SerializedCellMap {
    const result: SerializedCellMap = {};
    for (const [key, cell] of Object.entries(cells)) {
      result[`${sheetId}:${key}`] = {
        value: cell.value as string | number | boolean | null,
        formula: cell.formula,
      };
    }
    return result;
  }

  // Cleanup
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }

  get isAvailable(): boolean {
    return this.worker !== null;
  }
}

// Export singleton
export const formulaWorkerBridge = new FormulaWorkerBridge();
