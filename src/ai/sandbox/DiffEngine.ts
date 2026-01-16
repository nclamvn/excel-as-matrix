// =============================================================================
// DIFF ENGINE — Calculate differences between states (Blueprint §2.2.3)
// =============================================================================

import type {
  CellState,
  CellChange,
  SandboxDiff,
  DiffSummary,
  ChangeType,
} from './types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, colToLetter, parseCellRef } from '../../types/cell';

// -----------------------------------------------------------------------------
// Diff Engine Class
// -----------------------------------------------------------------------------

export class DiffEngine {
  /**
   * Calculate diff between current state and proposed changes
   */
  calculateDiff(
    sandboxId: string,
    proposedChanges: Map<string, CellState>
  ): SandboxDiff {
    const changes: CellChange[] = [];
    const sheetsAffected = new Set<string>();
    let formulaChanges = 0;

    const store = useWorkbookStore.getState();

    // Process each proposed change
    for (const [key, proposedState] of proposedChanges) {
      const [sheetId, cellRef] = this.parseChangeKey(key);
      const sheet = store.sheets[sheetId];

      if (!sheet) continue;

      sheetsAffected.add(sheet.name);

      // Get current cell state
      const currentState = this.getCellState(sheetId, cellRef);

      // Determine change type
      const changeType = this.determineChangeType(currentState, proposedState);

      // Track formula changes
      if (this.hasFormulaChange(currentState, proposedState)) {
        formulaChanges++;
      }

      changes.push({
        ref: cellRef,
        sheetId,
        sheetName: sheet.name,
        changeType,
        before: currentState,
        after: proposedState,
      });
    }

    // Calculate summary
    const summary = this.calculateSummary(changes, sheetsAffected, formulaChanges);

    return {
      id: crypto.randomUUID(),
      sandboxId,
      changes,
      summary,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate diff for a range write operation
   */
  calculateRangeDiff(
    sandboxId: string,
    sheetId: string,
    startRef: string,
    values: unknown[][]
  ): SandboxDiff {
    const proposedChanges = new Map<string, CellState>();

    const startPos = parseCellRef(startRef);
    if (!startPos) {
      return this.emptyDiff(sandboxId);
    }

    // Build proposed changes from values array
    for (let rowOffset = 0; rowOffset < values.length; rowOffset++) {
      const row = values[rowOffset];
      for (let colOffset = 0; colOffset < row.length; colOffset++) {
        const cellRow = startPos.row + rowOffset;
        const cellCol = startPos.col + colOffset;
        const cellRef = `${colToLetter(cellCol)}${cellRow + 1}`;
        const value = row[colOffset];

        // Determine if it's a formula
        const isFormula = typeof value === 'string' && value.startsWith('=');

        const cellState: CellState = {
          ref: cellRef,
          value: isFormula ? null : value,
          formula: isFormula ? value : null,
        };

        proposedChanges.set(`${sheetId}:${cellRef}`, cellState);
      }
    }

    return this.calculateDiff(sandboxId, proposedChanges);
  }

  /**
   * Get current state of a cell
   */
  private getCellState(sheetId: string, cellRef: string): CellState | null {
    const store = useWorkbookStore.getState();
    const sheet = store.sheets[sheetId];

    if (!sheet) return null;

    const pos = parseCellRef(cellRef);
    if (!pos) return null;

    const key = getCellKey(pos.row, pos.col);
    const cell = sheet.cells[key];

    if (!cell || (cell.value === null && !cell.formula)) {
      return null; // Empty cell
    }

    return {
      ref: cellRef,
      value: cell.value,
      formula: cell.formula || null,
      format: cell.format ? JSON.stringify(cell.format) : undefined,
    };
  }

  /**
   * Determine the type of change
   */
  private determineChangeType(
    before: CellState | null,
    after: CellState | null
  ): ChangeType {
    const beforeEmpty = !before || (before.value === null && !before.formula);
    const afterEmpty = !after || (after.value === null && !after.formula);

    if (beforeEmpty && !afterEmpty) {
      return 'added';
    }
    if (!beforeEmpty && afterEmpty) {
      return 'deleted';
    }
    return 'modified';
  }

  /**
   * Check if there's a formula change
   */
  private hasFormulaChange(
    before: CellState | null,
    after: CellState | null
  ): boolean {
    const beforeFormula = before?.formula || null;
    const afterFormula = after?.formula || null;

    return beforeFormula !== afterFormula;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    changes: CellChange[],
    sheetsAffected: Set<string>,
    formulaChanges: number
  ): DiffSummary {
    let added = 0;
    let modified = 0;
    let deleted = 0;

    for (const change of changes) {
      switch (change.changeType) {
        case 'added':
          added++;
          break;
        case 'modified':
          modified++;
          break;
        case 'deleted':
          deleted++;
          break;
      }
    }

    return {
      totalChanges: changes.length,
      added,
      modified,
      deleted,
      formulaChanges,
      sheetsAffected: Array.from(sheetsAffected),
    };
  }

  /**
   * Parse a change key into sheetId and cellRef
   */
  private parseChangeKey(key: string): [string, string] {
    const colonIndex = key.indexOf(':');
    if (colonIndex === -1) {
      return ['', key];
    }
    return [key.substring(0, colonIndex), key.substring(colonIndex + 1)];
  }

  /**
   * Create an empty diff
   */
  private emptyDiff(sandboxId: string): SandboxDiff {
    return {
      id: crypto.randomUUID(),
      sandboxId,
      changes: [],
      summary: {
        totalChanges: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        formulaChanges: 0,
        sheetsAffected: [],
      },
      createdAt: new Date(),
    };
  }

  /**
   * Format a diff as a human-readable table
   */
  formatDiffAsTable(diff: SandboxDiff): string {
    if (diff.changes.length === 0) {
      return 'No changes detected.';
    }

    const lines: string[] = [];
    lines.push('| Cell | Before | After | Type |');
    lines.push('|------|--------|-------|------|');

    for (const change of diff.changes.slice(0, 50)) { // Limit to 50 rows
      const before = this.formatCellValue(change.before);
      const after = this.formatCellValue(change.after);
      const typeIcon = this.getChangeTypeIcon(change.changeType);

      lines.push(`| ${change.ref} | ${before} | ${after} | ${typeIcon} |`);
    }

    if (diff.changes.length > 50) {
      lines.push(`| ... | ... | ... | +${diff.changes.length - 50} more |`);
    }

    return lines.join('\n');
  }

  /**
   * Format cell value for display
   */
  private formatCellValue(state: CellState | null): string {
    if (!state) return '(empty)';

    if (state.formula) {
      return state.formula.length > 20
        ? state.formula.substring(0, 17) + '...'
        : state.formula;
    }

    if (state.value === null || state.value === undefined) {
      return '(empty)';
    }

    const str = String(state.value);
    return str.length > 20 ? str.substring(0, 17) + '...' : str;
  }

  /**
   * Get icon for change type
   */
  private getChangeTypeIcon(type: ChangeType): string {
    switch (type) {
      case 'added':
        return '+ added';
      case 'modified':
        return '~ modified';
      case 'deleted':
        return '- deleted';
    }
  }
}

// Export singleton
export const diffEngine = new DiffEngine();
