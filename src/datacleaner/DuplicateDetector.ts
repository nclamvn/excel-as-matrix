// =============================================================================
// DUPLICATE DETECTOR — Detect exact and fuzzy duplicates
// =============================================================================

import type {
  CleanerSheetData,
  DuplicateGroup,
  DuplicateRow,
  DuplicateConfig,
} from './types';
import { DEFAULT_DUPLICATE_CONFIG } from './types';

/**
 * Detects duplicate rows in spreadsheet data
 */
export class DuplicateDetector {
  private config: DuplicateConfig;

  constructor(config: Partial<DuplicateConfig> = {}) {
    this.config = { ...DEFAULT_DUPLICATE_CONFIG, ...config };
  }

  /**
   * Detect all duplicates in data
   */
  detect(data: CleanerSheetData): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];

    // Detect exact duplicates
    const exactGroups = this.detectExact(data);
    groups.push(...exactGroups);

    // Detect fuzzy duplicates (if threshold < 1)
    if (this.config.fuzzyThreshold < 1) {
      const fuzzyGroups = this.detectFuzzy(data, exactGroups);
      groups.push(...fuzzyGroups);
    }

    return groups;
  }

  /**
   * Detect exact duplicates
   */
  private detectExact(data: CleanerSheetData): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const rowHashes = new Map<string, number[]>();
    const columns = this.getColumnsToCheck(data);

    // Hash each row
    for (let row = 0; row < data.rowCount; row++) {
      const hash = this.hashRow(data, row, columns);
      const existing = rowHashes.get(hash) || [];
      existing.push(row);
      rowHashes.set(hash, existing);
    }

    // Create groups for duplicates
    for (const [_hash, rows] of rowHashes) {
      if (rows.length > 1) {
        const duplicateRows: DuplicateRow[] = rows.map((rowIndex, i) => ({
          rowIndex,
          values: columns.map(col => data.cells[rowIndex]?.[col]?.value),
          isOriginal: i === 0,
        }));

        groups.push({
          id: `exact-${rows[0]}-${Date.now()}`,
          type: 'exact',
          similarity: 1,
          rows: duplicateRows,
          columns,
          keepRow: rows[0],
        });
      }
    }

    return groups;
  }

  /**
   * Detect fuzzy duplicates
   */
  private detectFuzzy(
    data: CleanerSheetData,
    exactGroups: DuplicateGroup[]
  ): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const columns = this.getColumnsToCheck(data);

    // Get rows not already in exact duplicate groups
    const exactRows = new Set(exactGroups.flatMap(g => g.rows.map(r => r.rowIndex)));
    const candidateRows: number[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      if (!exactRows.has(row)) {
        candidateRows.push(row);
      }
    }

    // Compare each pair of candidate rows
    const processed = new Set<string>();

    for (let i = 0; i < candidateRows.length; i++) {
      const row1 = candidateRows[i];
      const similarRows: number[] = [row1];

      for (let j = i + 1; j < candidateRows.length; j++) {
        const row2 = candidateRows[j];
        const pairKey = `${row1}-${row2}`;

        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const similarity = this.calculateSimilarity(data, row1, row2, columns);

        if (similarity >= this.config.fuzzyThreshold) {
          similarRows.push(row2);
        }
      }

      if (similarRows.length > 1) {
        // Check if any row in this group is already in another fuzzy group
        const alreadyGrouped = similarRows.some(r =>
          groups.some(g => g.rows.some(dr => dr.rowIndex === r))
        );

        if (!alreadyGrouped) {
          const avgSimilarity = this.calculateGroupSimilarity(data, similarRows, columns);

          const duplicateRows: DuplicateRow[] = similarRows.map((rowIndex, idx) => ({
            rowIndex,
            values: columns.map(col => data.cells[rowIndex]?.[col]?.value),
            isOriginal: idx === 0,
          }));

          groups.push({
            id: `fuzzy-${row1}-${Date.now()}`,
            type: 'fuzzy',
            similarity: avgSimilarity,
            rows: duplicateRows,
            columns,
            keepRow: similarRows[0],
          });
        }
      }
    }

    return groups;
  }

  /**
   * Hash a row for exact comparison
   */
  private hashRow(data: CleanerSheetData, row: number, columns: number[]): string {
    const values = columns.map(col => {
      const cell = data.cells[row]?.[col];
      if (!cell || cell.isEmpty) return '';

      let value = String(cell.value);

      if (!this.config.caseSensitive) {
        value = value.toLowerCase();
      }

      if (this.config.ignoreWhitespace) {
        value = value.trim().replace(/\s+/g, ' ');
      }

      return value;
    });

    return values.join('|||');
  }

  /**
   * Calculate similarity between two rows
   */
  private calculateSimilarity(
    data: CleanerSheetData,
    row1: number,
    row2: number,
    columns: number[]
  ): number {
    let totalSimilarity = 0;
    let count = 0;

    for (const col of columns) {
      const cell1 = data.cells[row1]?.[col];
      const cell2 = data.cells[row2]?.[col];

      const val1 = this.normalizeValue(cell1?.value);
      const val2 = this.normalizeValue(cell2?.value);

      // Empty cells are considered similar to each other
      if (val1 === '' && val2 === '') {
        totalSimilarity += 1;
      } else if (val1 === '' || val2 === '') {
        totalSimilarity += 0;
      } else {
        totalSimilarity += this.levenshteinSimilarity(val1, val2);
      }

      count++;
    }

    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Calculate average similarity within a group
   */
  private calculateGroupSimilarity(
    data: CleanerSheetData,
    rows: number[],
    columns: number[]
  ): number {
    if (rows.length < 2) return 1;

    let totalSimilarity = 0;
    let count = 0;

    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        totalSimilarity += this.calculateSimilarity(data, rows[i], rows[j], columns);
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Normalize value for comparison
   */
  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined) return '';

    let str = String(value);

    if (!this.config.caseSensitive) {
      str = str.toLowerCase();
    }

    if (this.config.ignoreWhitespace) {
      str = str.trim().replace(/\s+/g, ' ');
    }

    return str;
  }

  /**
   * Calculate Levenshtein similarity (0-1)
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 1;
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Get columns to check for duplicates
   */
  private getColumnsToCheck(data: CleanerSheetData): number[] {
    if (this.config.checkColumns === 'all') {
      return Array.from({ length: data.colCount }, (_, i) => i);
    }
    return this.config.checkColumns;
  }

  /**
   * Remove duplicates from data (returns rows to delete)
   */
  removeDuplicates(
    groups: DuplicateGroup[],
    keepStrategy: 'first' | 'last' = 'first'
  ): number[] {
    const rowsToDelete: number[] = [];

    for (const group of groups) {
      const rows = group.rows.map(r => r.rowIndex);
      const keepIndex = keepStrategy === 'first' ? 0 : rows.length - 1;

      for (let i = 0; i < rows.length; i++) {
        if (i !== keepIndex) {
          rowsToDelete.push(rows[i]);
        }
      }
    }

    return [...new Set(rowsToDelete)].sort((a, b) => b - a); // Sort descending for deletion
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DuplicateConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
