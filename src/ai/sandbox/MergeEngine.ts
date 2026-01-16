// =============================================================================
// MERGE ENGINE — Apply sandbox changes to main spreadsheet (Blueprint §2.2.3)
// =============================================================================

import type {
  Sandbox,
  CellState,
  RollbackInfo,
  MergeSandboxResult,
  RollbackSandboxResult,
} from './types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, parseCellRef } from '../../types/cell';

// -----------------------------------------------------------------------------
// Merge Engine Class
// -----------------------------------------------------------------------------

export class MergeEngine {
  private rollbackStorage: Map<string, RollbackInfo> = new Map();

  /**
   * Merge sandbox changes into the main spreadsheet
   */
  merge(sandbox: Sandbox): MergeSandboxResult {
    const errors: string[] = [];
    let appliedChanges = 0;

    // Validate sandbox can be merged
    if (sandbox.status !== 'approved' && sandbox.status !== 'pending') {
      return {
        success: false,
        sandbox,
        appliedChanges: 0,
        errors: [`Cannot merge sandbox with status: ${sandbox.status}`],
      };
    }

    // Get current states for rollback
    const originalStates = this.captureOriginalStates(sandbox);

    // Apply each change
    try {
      for (const [key, proposedState] of sandbox.proposedChanges) {
        try {
          this.applyCellChange(key, proposedState);
          appliedChanges++;
        } catch (error) {
          errors.push(
            `Failed to apply change to ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Create rollback info
      const rollbackInfo = this.createRollbackInfo(
        sandbox.id,
        originalStates
      );
      this.rollbackStorage.set(sandbox.id, rollbackInfo);

      // Update sandbox status
      sandbox.status = 'merged';
      sandbox.mergedAt = new Date();
      sandbox.rollbackInfo = rollbackInfo;

      return {
        success: errors.length === 0,
        sandbox,
        appliedChanges,
        rollbackInfo,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        sandbox,
        appliedChanges,
        errors: [
          `Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ...errors,
        ],
      };
    }
  }

  /**
   * Rollback a merged sandbox
   */
  rollback(sandboxId: string): RollbackSandboxResult {
    const rollbackInfo = this.rollbackStorage.get(sandboxId);

    if (!rollbackInfo) {
      return {
        success: false,
        sandboxId,
        restoredCells: 0,
        errors: ['Rollback info not found for this sandbox'],
      };
    }

    if (!rollbackInfo.canRollback) {
      return {
        success: false,
        sandboxId,
        restoredCells: 0,
        errors: ['Rollback is no longer available for this sandbox'],
      };
    }

    if (new Date() > rollbackInfo.expiresAt) {
      rollbackInfo.canRollback = false;
      return {
        success: false,
        sandboxId,
        restoredCells: 0,
        errors: ['Rollback period has expired'],
      };
    }

    const errors: string[] = [];
    let restoredCells = 0;

    try {
      // Restore each original state
      for (const originalState of rollbackInfo.originalStates) {
        try {
          this.restoreCellState(originalState);
          restoredCells++;
        } catch (error) {
          errors.push(
            `Failed to restore ${originalState.ref}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Mark rollback as used
      rollbackInfo.canRollback = false;
      this.rollbackStorage.delete(sandboxId);

      return {
        success: errors.length === 0,
        sandboxId,
        restoredCells,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        sandboxId,
        restoredCells,
        errors: [
          `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ...errors,
        ],
      };
    }
  }

  /**
   * Apply a single cell change
   */
  private applyCellChange(key: string, state: CellState): void {
    const [sheetId, cellRef] = this.parseChangeKey(key);
    const store = useWorkbookStore.getState();
    const sheet = store.sheets[sheetId];

    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetId}`);
    }

    const pos = parseCellRef(cellRef);
    if (!pos) {
      throw new Error(`Invalid cell reference: ${cellRef}`);
    }

    // Apply the change
    if (state.formula) {
      // Set formula
      store.setCellValue(sheetId, pos.row, pos.col, state.formula);
    } else if (state.value !== null && state.value !== undefined) {
      // Set value
      store.setCellValue(sheetId, pos.row, pos.col, state.value as string | number | boolean);
    } else {
      // Clear cell (set to empty string)
      store.setCellValue(sheetId, pos.row, pos.col, '');
    }
  }

  /**
   * Restore a cell to its original state
   */
  private restoreCellState(state: CellState): void {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;

    if (!activeSheetId) {
      throw new Error('No active sheet');
    }

    const pos = parseCellRef(state.ref);
    if (!pos) {
      throw new Error(`Invalid cell reference: ${state.ref}`);
    }

    if (state.formula) {
      store.setCellValue(activeSheetId, pos.row, pos.col, state.formula);
    } else if (state.value !== null && state.value !== undefined) {
      store.setCellValue(activeSheetId, pos.row, pos.col, state.value as string | number | boolean);
    } else {
      // Clear cell (set to empty string)
      store.setCellValue(activeSheetId, pos.row, pos.col, '');
    }
  }

  /**
   * Capture original states for rollback
   */
  private captureOriginalStates(sandbox: Sandbox): CellState[] {
    const states: CellState[] = [];
    const store = useWorkbookStore.getState();

    for (const [key] of sandbox.proposedChanges) {
      const [sheetId, cellRef] = this.parseChangeKey(key);
      const sheet = store.sheets[sheetId];

      if (!sheet) continue;

      const pos = parseCellRef(cellRef);
      if (!pos) continue;

      const cellKey = getCellKey(pos.row, pos.col);
      const cell = sheet.cells[cellKey];

      states.push({
        ref: cellRef,
        value: cell?.value ?? null,
        formula: cell?.formula ?? null,
        format: cell?.format ? JSON.stringify(cell.format) : undefined,
      });
    }

    return states;
  }

  /**
   * Create rollback info
   */
  private createRollbackInfo(
    sandboxId: string,
    originalStates: CellState[]
  ): RollbackInfo {
    const mergedAt = new Date();
    const expiresAt = new Date(mergedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      sandboxId,
      originalStates,
      mergedAt,
      expiresAt,
      canRollback: true,
    };
  }

  /**
   * Parse a change key
   */
  private parseChangeKey(key: string): [string, string] {
    const colonIndex = key.indexOf(':');
    if (colonIndex === -1) {
      return ['', key];
    }
    return [key.substring(0, colonIndex), key.substring(colonIndex + 1)];
  }

  /**
   * Check if rollback is available for a sandbox
   */
  canRollback(sandboxId: string): boolean {
    const info = this.rollbackStorage.get(sandboxId);
    if (!info) return false;
    if (!info.canRollback) return false;
    if (new Date() > info.expiresAt) return false;
    return true;
  }

  /**
   * Get rollback info for a sandbox
   */
  getRollbackInfo(sandboxId: string): RollbackInfo | undefined {
    return this.rollbackStorage.get(sandboxId);
  }

  /**
   * Clean up expired rollback info
   */
  cleanupExpiredRollbacks(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, info] of this.rollbackStorage) {
      if (now > info.expiresAt) {
        this.rollbackStorage.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Preview merge without applying (dry run)
   */
  previewMerge(sandbox: Sandbox): {
    wouldApply: number;
    conflicts: string[];
  } {
    const conflicts: string[] = [];
    let wouldApply = 0;

    const store = useWorkbookStore.getState();

    for (const [key] of sandbox.proposedChanges) {
      const [sheetId, cellRef] = this.parseChangeKey(key);
      const sheet = store.sheets[sheetId];

      if (!sheet) {
        conflicts.push(`Sheet not found: ${sheetId}`);
        continue;
      }

      const pos = parseCellRef(cellRef);
      if (!pos) {
        conflicts.push(`Invalid cell reference: ${cellRef}`);
        continue;
      }

      wouldApply++;
    }

    return { wouldApply, conflicts };
  }
}

// Export singleton
export const mergeEngine = new MergeEngine();
