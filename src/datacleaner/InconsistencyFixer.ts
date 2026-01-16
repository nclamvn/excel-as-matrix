// =============================================================================
// INCONSISTENCY FIXER — Fix inconsistent values
// =============================================================================

import type {
  CleanerSheetData,
  InconsistencyGroup,
  InconsistentValue,
  InconsistencyConfig,
  CellChange,
} from './types';
import { DEFAULT_INCONSISTENCY_CONFIG } from './types';

/**
 * Detects and fixes inconsistent values (e.g., "USA" vs "U.S.A.")
 */
export class InconsistencyFixer {
  private config: InconsistencyConfig;

  constructor(config: Partial<InconsistencyConfig> = {}) {
    this.config = { ...DEFAULT_INCONSISTENCY_CONFIG, ...config };
  }

  /**
   * Detect inconsistencies in data
   */
  detect(data: CleanerSheetData): InconsistencyGroup[] {
    const groups: InconsistencyGroup[] = [];

    // Only check text columns
    for (let col = 0; col < data.colCount; col++) {
      if (data.columnTypes[col] !== 'text' && data.columnTypes[col] !== 'name') {
        continue;
      }

      const columnGroups = this.detectColumnInconsistencies(data, col);
      groups.push(...columnGroups);
    }

    return groups;
  }

  /**
   * Detect inconsistencies in a single column
   */
  private detectColumnInconsistencies(
    data: CleanerSheetData,
    col: number
  ): InconsistencyGroup[] {
    const groups: InconsistencyGroup[] = [];
    const valueInfo = new Map<string, { original: string; rows: number[] }>();

    // Collect all values and their rows
    for (let row = 0; row < data.rowCount; row++) {
      const cell = data.cells[row]?.[col];
      if (!cell || cell.isEmpty) continue;

      const value = String(cell.value);
      const normalized = this.normalize(value);

      const existing = valueInfo.get(normalized);
      if (existing) {
        if (!existing.rows.includes(row)) {
          existing.rows.push(row);
        }
      } else {
        valueInfo.set(normalized, { original: value, rows: [row] });
      }
    }

    // Find similar values that should be grouped
    const processed = new Set<string>();
    const entries = Array.from(valueInfo.entries());

    for (let i = 0; i < entries.length; i++) {
      const [norm1, info1] = entries[i];
      if (processed.has(norm1)) continue;

      const variants: InconsistentValue[] = [];
      const allRows: number[] = [...info1.rows];

      // Find actual variants (different original values, same normalized)
      const originalVariants = new Map<string, number[]>();
      for (const row of info1.rows) {
        const value = String(data.cells[row]?.[col]?.value);
        const existing = originalVariants.get(value) || [];
        existing.push(row);
        originalVariants.set(value, existing);
      }

      // If there are multiple original values for same normalized value
      if (originalVariants.size > 1) {
        for (const [value, rows] of originalVariants) {
          variants.push({
            value,
            count: rows.length,
            rows,
            similarity: 1,
          });
        }
      }

      // Find fuzzy matches
      for (let j = i + 1; j < entries.length; j++) {
        const [norm2, info2] = entries[j];
        if (processed.has(norm2)) continue;

        const similarity = this.calculateSimilarity(norm1, norm2);

        if (similarity >= this.config.similarityThreshold) {
          // Check custom mappings
          const mapped1 = this.config.customMappings[info1.original];
          const mapped2 = this.config.customMappings[info2.original];

          if (mapped1 === info2.original || mapped2 === info1.original || similarity >= this.config.similarityThreshold) {
            variants.push({
              value: info2.original,
              count: info2.rows.length,
              rows: info2.rows,
              similarity,
            });
            allRows.push(...info2.rows);
            processed.add(norm2);
          }
        }
      }

      // Add first value as variant if there are other variants
      if (variants.length > 0) {
        const firstVariants = Array.from(originalVariants.entries());
        if (firstVariants.length === 1) {
          variants.unshift({
            value: info1.original,
            count: info1.rows.length,
            rows: info1.rows,
            similarity: 1,
          });
        }
      }

      if (variants.length > 1) {
        // Determine canonical value (most common)
        const canonical = this.determineCanonical(variants);

        groups.push({
          id: `inconsistency-${col}-${i}`,
          column: col,
          columnName: data.headers[col] || this.colToLetter(col),
          canonicalValue: canonical,
          variants,
          totalCount: allRows.length,
        });
      }

      processed.add(norm1);
    }

    return groups;
  }

  /**
   * Normalize value for comparison
   */
  private normalize(value: string): string {
    let normalized = value;

    if (!this.config.caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    if (this.config.ignoreWhitespace) {
      normalized = normalized.trim().replace(/\s+/g, ' ');
    }

    // Remove common variations
    normalized = normalized
      .replace(/[.,\-_]/g, '')
      .replace(/\s+/g, '');

    return normalized;
  }

  /**
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
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
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Determine canonical value (most common or mapped)
   */
  private determineCanonical(variants: InconsistentValue[]): string {
    // Check custom mappings first
    for (const variant of variants) {
      if (this.config.customMappings[variant.value]) {
        return this.config.customMappings[variant.value];
      }
    }

    // Return most common value
    let maxCount = 0;
    let canonical = variants[0].value;

    for (const variant of variants) {
      if (variant.count > maxCount) {
        maxCount = variant.count;
        canonical = variant.value;
      }
    }

    return canonical;
  }

  /**
   * Fix inconsistencies in data
   */
  fix(_data: CleanerSheetData, groups: InconsistencyGroup[]): CellChange[] {
    const changes: CellChange[] = [];

    for (const group of groups) {
      for (const variant of group.variants) {
        // Skip if already canonical
        if (variant.value === group.canonicalValue) continue;

        for (const row of variant.rows) {
          changes.push({
            row,
            col: group.column,
            ref: `${this.colToLetter(group.column)}${row + 1}`,
            before: variant.value,
            after: group.canonicalValue,
            changeType: 'standardized',
          });
        }
      }
    }

    return changes;
  }

  /**
   * Add custom mapping
   */
  addMapping(from: string, to: string): void {
    this.config.customMappings[from] = to;
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

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InconsistencyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
