// =============================================================================
// CLEANING PREVIEW — Preview changes before applying
// =============================================================================

import type {
  CleanerSheetData,
  CellChange,
  ChangeType,
} from './types';

/**
 * Generates previews for cleaning changes
 */
export class CleaningPreview {
  /**
   * Generate preview data for changes
   */
  generatePreview(
    data: CleanerSheetData,
    changes: CellChange[]
  ): PreviewData {
    const beforeData: PreviewRow[] = [];
    const afterData: PreviewRow[] = [];

    // Get affected rows
    const affectedRows = new Set(changes.map(c => c.row));
    const deletedRows = new Set(
      changes.filter(c => c.changeType === 'deleted').map(c => c.row)
    );

    // Group changes by row
    const changesByRow = new Map<number, CellChange[]>();
    for (const change of changes) {
      const existing = changesByRow.get(change.row) || [];
      existing.push(change);
      changesByRow.set(change.row, existing);
    }

    // Generate preview rows
    const sortedRows = Array.from(affectedRows).sort((a, b) => a - b);

    for (const row of sortedRows) {
      const rowChanges = changesByRow.get(row) || [];
      const isDeleted = deletedRows.has(row);

      // Before row
      const beforeCells: PreviewCell[] = [];
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        const change = rowChanges.find(c => c.col === col);

        beforeCells.push({
          col,
          ref: `${this.colToLetter(col)}${row + 1}`,
          value: cell?.value ?? null,
          displayValue: cell?.displayValue ?? '',
          isChanged: !!change,
          changeType: change?.changeType,
        });
      }

      beforeData.push({
        row,
        cells: beforeCells,
        isDeleted,
      });

      // After row (if not deleted)
      if (!isDeleted) {
        const afterCells: PreviewCell[] = [];
        for (let col = 0; col < data.colCount; col++) {
          const cell = data.cells[row]?.[col];
          const change = rowChanges.find(c => c.col === col);

          afterCells.push({
            col,
            ref: `${this.colToLetter(col)}${row + 1}`,
            value: change ? change.after : cell?.value ?? null,
            displayValue: change ? String(change.after) : cell?.displayValue ?? '',
            isChanged: !!change,
            changeType: change?.changeType,
          });
        }

        afterData.push({
          row,
          cells: afterCells,
          isDeleted: false,
        });
      }
    }

    return {
      before: beforeData,
      after: afterData,
      summary: this.generateSummary(changes),
      headers: data.headers,
    };
  }

  /**
   * Generate diff view for a single cell
   */
  generateCellDiff(change: CellChange): CellDiff {
    return {
      ref: change.ref,
      before: this.formatValue(change.before),
      after: this.formatValue(change.after),
      changeType: change.changeType,
      diffParts: this.calculateDiffParts(change.before, change.after),
    };
  }

  /**
   * Calculate diff parts for highlighting
   */
  private calculateDiffParts(before: unknown, after: unknown): DiffPart[] {
    const beforeStr = this.formatValue(before);
    const afterStr = this.formatValue(after);

    if (beforeStr === afterStr) {
      return [{ text: afterStr, type: 'unchanged' }];
    }

    // Simple diff - highlight entire change
    // For more complex diffs, implement character-level diffing
    return [
      { text: beforeStr, type: 'removed' },
      { text: afterStr, type: 'added' },
    ];
  }

  /**
   * Generate summary of changes
   */
  private generateSummary(changes: CellChange[]): PreviewSummary {
    const byType: Record<ChangeType, number> = {
      modified: 0,
      deleted: 0,
      filled: 0,
      trimmed: 0,
      standardized: 0,
    };

    const affectedRows = new Set<number>();
    const affectedColumns = new Set<number>();

    for (const change of changes) {
      byType[change.changeType]++;
      affectedRows.add(change.row);
      affectedColumns.add(change.col);
    }

    return {
      totalChanges: changes.length,
      byType,
      affectedRows: affectedRows.size,
      affectedColumns: affectedColumns.size,
      deletedRows: byType.deleted,
    };
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '(empty)';
    if (value === '') return '(empty)';
    return String(value);
  }

  /**
   * Get change description
   */
  getChangeDescription(change: CellChange): string {
    switch (change.changeType) {
      case 'deleted':
        return 'Row will be deleted';
      case 'filled':
        return `Fill empty cell with "${change.after}"`;
      case 'trimmed':
        return `Trim whitespace: "${change.before}" → "${change.after}"`;
      case 'standardized':
        return `Standardize: "${change.before}" → "${change.after}"`;
      case 'modified':
        return `Change: "${change.before}" → "${change.after}"`;
      default:
        return `Change value`;
    }
  }

  /**
   * Group changes by type for display
   */
  groupChangesByType(changes: CellChange[]): Record<ChangeType, CellChange[]> {
    const groups: Record<ChangeType, CellChange[]> = {
      modified: [],
      deleted: [],
      filled: [],
      trimmed: [],
      standardized: [],
    };

    for (const change of changes) {
      groups[change.changeType].push(change);
    }

    return groups;
  }

  /**
   * Group changes by column
   */
  groupChangesByColumn(changes: CellChange[]): Map<number, CellChange[]> {
    const groups = new Map<number, CellChange[]>();

    for (const change of changes) {
      const existing = groups.get(change.col) || [];
      existing.push(change);
      groups.set(change.col, existing);
    }

    return groups;
  }

  /**
   * Filter changes by type
   */
  filterChanges(
    changes: CellChange[],
    types: ChangeType[]
  ): CellChange[] {
    return changes.filter(c => types.includes(c.changeType));
  }

  /**
   * Convert column index to letter
   */
  private colToLetter(col: number): string {
    let letter = '';
    let temp = col;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}

// =============================================================================
// Types
// =============================================================================

export interface PreviewData {
  before: PreviewRow[];
  after: PreviewRow[];
  summary: PreviewSummary;
  headers: string[];
}

export interface PreviewRow {
  row: number;
  cells: PreviewCell[];
  isDeleted: boolean;
}

export interface PreviewCell {
  col: number;
  ref: string;
  value: unknown;
  displayValue: string;
  isChanged: boolean;
  changeType?: ChangeType;
}

export interface PreviewSummary {
  totalChanges: number;
  byType: Record<ChangeType, number>;
  affectedRows: number;
  affectedColumns: number;
  deletedRows: number;
}

export interface CellDiff {
  ref: string;
  before: string;
  after: string;
  changeType: ChangeType;
  diffParts: DiffPart[];
}

export interface DiffPart {
  text: string;
  type: 'unchanged' | 'added' | 'removed';
}
