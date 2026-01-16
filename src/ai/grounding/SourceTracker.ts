// ═══════════════════════════════════════════════════════════════════════════
// SOURCE TRACKER — Track data sources for grounding
// ═══════════════════════════════════════════════════════════════════════════

import type { ClaimSource } from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, parseCellRef } from '../../types/cell';

/**
 * Track data sources for grounding
 */
export class SourceTracker {
  private sources: Map<string, ClaimSource> = new Map();
  private readHistory: {
    ref: string;
    value: unknown;
    timestamp: Date;
  }[] = [];

  /**
   * Track a cell read operation
   */
  trackCellRead(ref: string, sheetName?: string): ClaimSource {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const pos = parseCellRef(ref);
    let value: unknown = null;

    if (pos && sheet) {
      const key = getCellKey(pos.row, pos.col);
      const cell = sheet.cells[key];
      value = cell?.value ?? null;
    }

    const source: ClaimSource = {
      type: 'cell',
      ref,
      valueAtRead: value,
      readTimestamp: new Date(),
      sheetName: sheetName || sheet?.name,
    };

    const sourceKey = `${sheetName || sheet?.name || 'Sheet1'}!${ref}`;
    this.sources.set(sourceKey, source);

    // Add to history
    this.readHistory.push({
      ref,
      value,
      timestamp: source.readTimestamp,
    });

    return source;
  }

  /**
   * Track a range read operation
   */
  trackRangeRead(rangeRef: string, sheetName?: string): ClaimSource {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const values = this.getRangeValues(rangeRef);

    const source: ClaimSource = {
      type: 'range',
      ref: rangeRef,
      valueAtRead: values,
      readTimestamp: new Date(),
      sheetName: sheetName || sheet?.name,
    };

    const sourceKey = `${sheetName || sheet?.name || 'Sheet1'}!${rangeRef}`;
    this.sources.set(sourceKey, source);

    return source;
  }

  /**
   * Track a formula evaluation
   */
  trackFormulaEval(formula: string, result: unknown): ClaimSource {
    const source: ClaimSource = {
      type: 'formula_eval',
      ref: formula,
      valueAtRead: result,
      readTimestamp: new Date(),
    };

    this.sources.set(`formula:${formula}`, source);
    return source;
  }

  /**
   * Get source by key
   */
  getSource(key: string): ClaimSource | undefined {
    return this.sources.get(key);
  }

  /**
   * Get source by cell reference (searches all keys)
   */
  getSourceByRef(ref: string): ClaimSource | undefined {
    // Try to find by exact ref
    for (const [key, source] of this.sources) {
      if (key.endsWith(`!${ref}`) || source.ref === ref) {
        return source;
      }
    }
    return undefined;
  }

  /**
   * Get all sources
   */
  getAllSources(): ClaimSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get read history
   */
  getReadHistory(): typeof this.readHistory {
    return [...this.readHistory];
  }

  /**
   * Check if value has changed since read
   */
  hasValueChanged(ref: string): boolean {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const source = this.getSourceByRef(ref);

    if (!source || !sheet) return false;

    const pos = parseCellRef(ref);
    if (!pos) return false;

    const key = getCellKey(pos.row, pos.col);
    const currentValue = sheet.cells[key]?.value ?? null;

    return currentValue !== source.valueAtRead;
  }

  /**
   * Get all changed sources since last read
   */
  getChangedSources(): Array<{ ref: string; oldValue: unknown; newValue: unknown }> {
    const changes: Array<{ ref: string; oldValue: unknown; newValue: unknown }> = [];

    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    if (!sheet) return changes;

    for (const source of this.sources.values()) {
      if (source.type === 'cell') {
        const pos = parseCellRef(source.ref);
        if (!pos) continue;

        const key = getCellKey(pos.row, pos.col);
        const currentValue = sheet.cells[key]?.value ?? null;

        if (currentValue !== source.valueAtRead) {
          changes.push({
            ref: source.ref,
            oldValue: source.valueAtRead,
            newValue: currentValue,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Clear tracking data
   */
  clear(): void {
    this.sources.clear();
    this.readHistory = [];
  }

  /**
   * Get range values from spreadsheet
   */
  private getRangeValues(rangeRef: string): unknown[][] {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const [startRef, endRef] = rangeRef.split(':');
    const start = parseCellRef(startRef);
    const end = endRef ? parseCellRef(endRef) : start;

    if (!start || !end || !sheet) return [];

    const values: unknown[][] = [];

    for (let row = start.row; row <= end.row; row++) {
      const rowValues: unknown[] = [];
      for (let col = start.col; col <= end.col; col++) {
        const key = getCellKey(row, col);
        const cell = sheet.cells[key];
        rowValues.push(cell?.value ?? null);
      }
      values.push(rowValues);
    }

    return values;
  }

  /**
   * Get tracking statistics
   */
  getStats(): { totalSources: number; cellReads: number; rangeReads: number; formulaEvals: number } {
    let cellReads = 0;
    let rangeReads = 0;
    let formulaEvals = 0;

    for (const source of this.sources.values()) {
      switch (source.type) {
        case 'cell':
          cellReads++;
          break;
        case 'range':
          rangeReads++;
          break;
        case 'formula_eval':
          formulaEvals++;
          break;
      }
    }

    return {
      totalSources: this.sources.size,
      cellReads,
      rangeReads,
      formulaEvals,
    };
  }
}

// Export singleton
export const sourceTracker = new SourceTracker();
