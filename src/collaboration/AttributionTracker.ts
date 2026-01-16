// =============================================================================
// ATTRIBUTION TRACKER — Track who changed what (Blueprint §6.5)
// =============================================================================

import type { CellAttribution, EditRecord, CollaborationUser } from './types';

// -----------------------------------------------------------------------------
// Attribution Tracker Class
// -----------------------------------------------------------------------------

type AttributionHandler = (cellRef: string, attribution: CellAttribution) => void;

/**
 * Track who made each change for accountability
 */
export class AttributionTracker {
  private attributions: Map<string, CellAttribution> = new Map();
  private handlers: Set<AttributionHandler> = new Set();
  private maxHistorySize = 50;

  /**
   * Record a cell edit
   */
  recordEdit(
    sheetId: string,
    cellRef: string,
    user: CollaborationUser,
    eventId: string,
    changeType: EditRecord['changeType']
  ): void {
    const key = `${sheetId}:${cellRef}`;
    const now = new Date();

    let attribution = this.attributions.get(key);

    if (!attribution) {
      attribution = {
        cellRef,
        sheetId,
        lastEditedBy: user,
        lastEditedAt: now,
        editHistory: [],
      };
      this.attributions.set(key, attribution);
    }

    // Update last edited
    attribution.lastEditedBy = user;
    attribution.lastEditedAt = now;

    // Add to history
    attribution.editHistory.push({
      user,
      timestamp: now,
      eventId,
      changeType,
    });

    // Limit history size
    if (attribution.editHistory.length > this.maxHistorySize) {
      attribution.editHistory = attribution.editHistory.slice(-this.maxHistorySize);
    }

    // Notify handlers
    this.handlers.forEach((h) => h(cellRef, attribution!));
  }

  /**
   * Record multiple cell edits (for range operations)
   */
  recordRangeEdit(
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    user: CollaborationUser,
    eventId: string,
    changeType: EditRecord['changeType']
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellRef = this.getCellRef(row, col);
        this.recordEdit(sheetId, cellRef, user, eventId, changeType);
      }
    }
  }

  /**
   * Get attribution for a cell
   */
  getAttribution(sheetId: string, cellRef: string): CellAttribution | null {
    return this.attributions.get(`${sheetId}:${cellRef}`) || null;
  }

  /**
   * Get last editor for a cell
   */
  getLastEditor(sheetId: string, cellRef: string): CollaborationUser | null {
    const attr = this.getAttribution(sheetId, cellRef);
    return attr?.lastEditedBy || null;
  }

  /**
   * Get edit history for a cell
   */
  getEditHistory(sheetId: string, cellRef: string): EditRecord[] {
    const attr = this.getAttribution(sheetId, cellRef);
    return attr?.editHistory || [];
  }

  /**
   * Get last edit time for a cell
   */
  getLastEditTime(sheetId: string, cellRef: string): Date | null {
    const attr = this.getAttribution(sheetId, cellRef);
    return attr?.lastEditedAt || null;
  }

  /**
   * Get all cells edited by a user
   */
  getCellsEditedBy(userId: string): CellAttribution[] {
    return Array.from(this.attributions.values()).filter(
      (a) => a.lastEditedBy.id === userId
    );
  }

  /**
   * Get cells edited in a time range
   */
  getCellsEditedSince(since: Date): CellAttribution[] {
    return Array.from(this.attributions.values()).filter(
      (a) => a.lastEditedAt >= since
    );
  }

  /**
   * Get unique editors for a sheet
   */
  getEditors(sheetId: string): CollaborationUser[] {
    const editorsMap = new Map<string, CollaborationUser>();

    for (const [key, attr] of this.attributions) {
      if (key.startsWith(`${sheetId}:`)) {
        editorsMap.set(attr.lastEditedBy.id, attr.lastEditedBy);
      }
    }

    return Array.from(editorsMap.values());
  }

  /**
   * Get edit statistics
   */
  getStatistics(sheetId?: string): {
    totalCells: number;
    uniqueEditors: number;
    editsByUser: Record<string, number>;
    recentEdits: EditRecord[];
  } {
    const attributions = sheetId
      ? Array.from(this.attributions.entries())
          .filter(([key]) => key.startsWith(`${sheetId}:`))
          .map(([, v]) => v)
      : Array.from(this.attributions.values());

    const editsByUser: Record<string, number> = {};
    const editors = new Set<string>();
    const allEdits: EditRecord[] = [];

    for (const attr of attributions) {
      editors.add(attr.lastEditedBy.id);
      editsByUser[attr.lastEditedBy.id] =
        (editsByUser[attr.lastEditedBy.id] || 0) + 1;
      allEdits.push(...attr.editHistory);
    }

    // Sort edits by time and get recent ones
    allEdits.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentEdits = allEdits.slice(0, 20);

    return {
      totalCells: attributions.length,
      uniqueEditors: editors.size,
      editsByUser,
      recentEdits,
    };
  }

  /**
   * Subscribe to attribution changes
   */
  subscribe(handler: AttributionHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Clear all attributions
   */
  clear(): void {
    this.attributions.clear();
  }

  /**
   * Clear attributions for a sheet
   */
  clearSheet(sheetId: string): void {
    for (const key of this.attributions.keys()) {
      if (key.startsWith(`${sheetId}:`)) {
        this.attributions.delete(key);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getCellRef(row: number, col: number): string {
    const letter = this.colToLetter(col);
    return `${letter}${row + 1}`;
  }

  private colToLetter(col: number): string {
    let result = '';
    col++;
    while (col > 0) {
      col--;
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26);
    }
    return result;
  }
}

// Export singleton
export const attributionTracker = new AttributionTracker();

// Factory function
export function createAttributionTracker(): AttributionTracker {
  return new AttributionTracker();
}
