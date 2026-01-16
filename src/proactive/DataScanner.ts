// =============================================================================
// DATA SCANNER — Scan for data quality issues
// =============================================================================

import type {
  SheetData,
  DataIssue,
  IssueExample,
  OutlierInfo,
  ScanConfig,
} from './types';

/**
 * Scans spreadsheet data for quality issues
 */
export class DataScanner {
  private config: ScanConfig;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * Scan sheet for all data issues
   */
  async scan(data: SheetData): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];

    // Scan for different issue types
    issues.push(...this.findDuplicates(data));
    issues.push(...this.findMissingValues(data));
    issues.push(...this.findInvalidFormats(data));
    issues.push(...this.findOutliers(data));
    issues.push(...this.findInconsistentData(data));
    issues.push(...this.findTrailingSpaces(data));
    issues.push(...this.findMixedTypes(data));
    issues.push(...this.findEmptyRows(data));

    return issues;
  }

  /**
   * Find duplicate rows
   */
  private findDuplicates(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];
    const rowHashes = new Map<string, number[]>();

    // Hash each row
    for (let row = 0; row < data.rowCount; row++) {
      const rowData = data.cells[row];
      if (!rowData || rowData.every(c => c.type === 'empty')) continue;

      const hash = rowData.map(c => String(c.value)).join('|');
      const existing = rowHashes.get(hash) || [];
      existing.push(row);
      rowHashes.set(hash, existing);
    }

    // Find duplicates
    for (const [_hash, rows] of rowHashes) {
      if (rows.length >= this.config.duplicateThreshold) {
        const affectedCells = rows.map(r => `${r + 1}`);

        issues.push({
          id: `dup-${rows.join('-')}`,
          type: 'issue',
          issueType: 'duplicates',
          priority: rows.length > 5 ? 'high' : 'medium',
          status: 'pending',

          title: `${rows.length} duplicate rows found`,
          description: `Rows ${affectedCells.slice(0, 3).join(', ')}${rows.length > 3 ? '...' : ''} contain identical data`,
          details: `First occurrence at row ${rows[0] + 1}`,

          sheetId: data.sheetId,
          affectedCells: affectedCells,
          affectedRange: `${rows[0] + 1}:${rows[rows.length - 1] + 1}`,

          confidence: 1.0,
          impact: {
            cellCount: rows.length * data.colCount,
            severity: rows.length > 10 ? 'high' : 'medium',
            description: `${rows.length} duplicate rows affecting data integrity`,
          },

          actions: [
            {
              id: 'remove-dups',
              label: 'Remove duplicates',
              type: 'primary',
              action: 'remove_duplicates',
              params: { rows: rows.slice(1), keep: 'first' },
            },
            {
              id: 'show-all',
              label: 'Show all',
              type: 'secondary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'data_quality',
          tags: ['duplicates', 'cleanup'],

          examples: rows.slice(0, 3).map(r => ({
            cellRef: `Row ${r + 1}`,
            value: data.cells[r]?.map(c => c.value).join(', '),
            reason: r === rows[0] ? 'First occurrence' : 'Duplicate',
          })),
          autoFixAvailable: true,
        });
      }
    }

    return issues;
  }

  /**
   * Find missing values in columns
   */
  private findMissingValues(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const header of data.headers) {
      if (header.emptyCount > 0 && header.emptyCount < data.rowCount * 0.5) {
        const emptyCells: string[] = [];
        const examples: IssueExample[] = [];

        for (let row = 1; row < data.rowCount; row++) {
          const cell = data.cells[row]?.[header.index];
          if (cell?.type === 'empty') {
            emptyCells.push(cell.ref);
            if (examples.length < 3) {
              examples.push({
                cellRef: cell.ref,
                value: '',
                reason: 'Empty cell in non-empty column',
              });
            }
          }
        }

        if (emptyCells.length > 0) {
          issues.push({
            id: `missing-${header.letter}`,
            type: 'issue',
            issueType: 'missing_values',
            priority: emptyCells.length > 10 ? 'high' : 'medium',
            status: 'pending',

            title: `${emptyCells.length} missing values in "${header.name}"`,
            description: `Column ${header.letter} has ${emptyCells.length} empty cells that may need data`,

            sheetId: data.sheetId,
            affectedCells: emptyCells,

            confidence: 0.85,
            impact: {
              cellCount: emptyCells.length,
              severity: emptyCells.length > 20 ? 'high' : 'medium',
              description: 'Missing data may affect calculations',
            },

            actions: [
              {
                id: 'fill-missing',
                label: 'Fill with default',
                type: 'primary',
                action: 'fill_missing',
                params: { cells: emptyCells, value: 0 },
              },
              {
                id: 'highlight',
                label: 'Highlight cells',
                type: 'secondary',
                action: 'learn_more',
              },
            ],

            detectedAt: Date.now(),
            category: 'data_quality',
            tags: ['missing', 'incomplete'],

            examples,
            autoFixAvailable: true,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Find invalid formats (e.g., dates as text)
   */
  private findInvalidFormats(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const header of data.headers) {
      const invalidCells: string[] = [];
      const examples: IssueExample[] = [];

      // Check for dates stored as text
      if (header.type === 'text') {
        for (let row = 1; row < data.rowCount; row++) {
          const cell = data.cells[row]?.[header.index];
          if (cell && cell.type === 'text' && this.looksLikeDate(String(cell.value))) {
            invalidCells.push(cell.ref);
            if (examples.length < 3) {
              examples.push({
                cellRef: cell.ref,
                value: cell.value,
                expected: 'Date format',
                reason: 'Date stored as text',
              });
            }
          }
        }
      }

      // Check for numbers stored as text
      if (header.type === 'text') {
        for (let row = 1; row < data.rowCount; row++) {
          const cell = data.cells[row]?.[header.index];
          if (cell && cell.type === 'text' && this.looksLikeNumber(String(cell.value))) {
            if (!invalidCells.includes(cell.ref)) {
              invalidCells.push(cell.ref);
              if (examples.length < 3) {
                examples.push({
                  cellRef: cell.ref,
                  value: cell.value,
                  expected: 'Number format',
                  reason: 'Number stored as text',
                });
              }
            }
          }
        }
      }

      if (invalidCells.length > 0) {
        issues.push({
          id: `format-${header.letter}`,
          type: 'issue',
          issueType: 'invalid_format',
          priority: 'medium',
          status: 'pending',

          title: `${invalidCells.length} format issues in "${header.name}"`,
          description: `Values may need format correction for proper calculations`,

          sheetId: data.sheetId,
          affectedCells: invalidCells,

          confidence: 0.8,
          impact: {
            cellCount: invalidCells.length,
            severity: 'medium',
            description: 'Incorrect formats may cause calculation errors',
          },

          actions: [
            {
              id: 'fix-format',
              label: 'Fix formats',
              type: 'primary',
              action: 'fix_format',
              params: { cells: invalidCells },
            },
          ],

          detectedAt: Date.now(),
          category: 'data_quality',
          tags: ['format', 'conversion'],

          examples,
          autoFixAvailable: true,
        });
      }
    }

    return issues;
  }

  /**
   * Find statistical outliers
   */
  private findOutliers(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const header of data.headers) {
      if (header.type !== 'number') continue;

      const values: number[] = [];
      const cellRefs: string[] = [];

      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'number' && typeof cell.value === 'number') {
          values.push(cell.value);
          cellRefs.push(cell.ref);
        }
      }

      if (values.length < 10) continue;

      // Calculate mean and standard deviation
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) continue;

      const outliers: OutlierInfo[] = [];
      const outlierCells: string[] = [];
      const examples: IssueExample[] = [];

      for (let i = 0; i < values.length; i++) {
        const zScore = Math.abs((values[i] - mean) / stdDev);
        if (zScore > this.config.outlierZScore) {
          outliers.push({
            cellRef: cellRefs[i],
            value: values[i],
            mean,
            stdDev,
            zScore,
          });
          outlierCells.push(cellRefs[i]);

          if (examples.length < 3) {
            examples.push({
              cellRef: cellRefs[i],
              value: values[i],
              expected: `~${mean.toFixed(2)} (mean)`,
              reason: `${zScore.toFixed(1)} standard deviations from mean`,
            });
          }
        }
      }

      if (outliers.length > 0) {
        issues.push({
          id: `outlier-${header.letter}`,
          type: 'issue',
          issueType: 'outliers',
          priority: outliers.length > 5 ? 'high' : 'medium',
          status: 'pending',

          title: `${outliers.length} outliers in "${header.name}"`,
          description: `Values significantly different from the average (mean: ${mean.toFixed(2)})`,

          sheetId: data.sheetId,
          affectedCells: outlierCells,

          confidence: 0.75,
          impact: {
            cellCount: outliers.length,
            severity: 'medium',
            description: 'Outliers may indicate data entry errors',
          },

          actions: [
            {
              id: 'review-outliers',
              label: 'Review values',
              type: 'primary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'data_quality',
          tags: ['outliers', 'statistics'],

          examples,
          autoFixAvailable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Find inconsistent data (e.g., "Yes"/"yes"/"Y")
   */
  private findInconsistentData(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const header of data.headers) {
      if (header.type !== 'text' || header.uniqueValues > 20) continue;

      const valueGroups = new Map<string, { original: string; cells: string[] }>();

      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'text' && cell.value) {
          const normalized = String(cell.value).toLowerCase().trim();
          const existing = valueGroups.get(normalized);
          if (existing) {
            existing.cells.push(cell.ref);
          } else {
            valueGroups.set(normalized, {
              original: String(cell.value),
              cells: [cell.ref],
            });
          }
        }
      }

      // Find similar values with different cases/formats
      const inconsistent: { normalized: string; variants: string[] }[] = [];
      const processedKeys = new Set<string>();

      for (const [key, group] of valueGroups) {
        if (processedKeys.has(key)) continue;

        const similar: string[] = [group.original];
        const affectedCells: string[] = [...group.cells];

        for (const [otherKey, otherGroup] of valueGroups) {
          if (key !== otherKey && this.areSimilar(key, otherKey)) {
            if (group.original !== otherGroup.original) {
              similar.push(otherGroup.original);
              affectedCells.push(...otherGroup.cells);
              processedKeys.add(otherKey);
            }
          }
        }

        if (similar.length > 1) {
          inconsistent.push({ normalized: key, variants: similar });
        }
      }

      if (inconsistent.length > 0) {
        const examples: IssueExample[] = inconsistent.slice(0, 3).map(i => ({
          cellRef: header.letter,
          value: i.variants.join(', '),
          expected: i.variants[0],
          reason: 'Inconsistent formatting',
        }));

        issues.push({
          id: `inconsistent-${header.letter}`,
          type: 'issue',
          issueType: 'inconsistent_data',
          priority: 'low',
          status: 'pending',

          title: `Inconsistent values in "${header.name}"`,
          description: `Found ${inconsistent.length} groups of similar but differently formatted values`,

          sheetId: data.sheetId,
          affectedCells: [],

          confidence: 0.7,
          impact: {
            cellCount: inconsistent.reduce((sum, i) => sum + i.variants.length, 0),
            severity: 'low',
            description: 'May affect filtering and grouping',
          },

          actions: [
            {
              id: 'standardize',
              label: 'Standardize values',
              type: 'primary',
              action: 'apply_fix',
            },
          ],

          detectedAt: Date.now(),
          category: 'data_quality',
          tags: ['consistency', 'formatting'],

          examples,
          autoFixAvailable: true,
        });
      }
    }

    return issues;
  }

  /**
   * Find cells with trailing/leading spaces
   */
  private findTrailingSpaces(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];
    const spaceCells: string[] = [];
    const examples: IssueExample[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (cell && cell.type === 'text' && typeof cell.value === 'string') {
          if (cell.value !== cell.value.trim()) {
            spaceCells.push(cell.ref);
            if (examples.length < 3) {
              examples.push({
                cellRef: cell.ref,
                value: `"${cell.value}"`,
                expected: `"${cell.value.trim()}"`,
                reason: 'Extra whitespace',
              });
            }
          }
        }
      }
    }

    if (spaceCells.length > 0) {
      issues.push({
        id: 'trailing-spaces',
        type: 'issue',
        issueType: 'trailing_spaces',
        priority: 'low',
        status: 'pending',

        title: `${spaceCells.length} cells with extra spaces`,
        description: 'Cells contain leading or trailing whitespace',

        sheetId: data.sheetId,
        affectedCells: spaceCells,

        confidence: 1.0,
        impact: {
          cellCount: spaceCells.length,
          severity: 'low',
          description: 'May cause lookup and matching issues',
        },

        actions: [
          {
            id: 'trim-spaces',
            label: 'Trim all spaces',
            type: 'primary',
            action: 'apply_fix',
            params: { cells: spaceCells },
          },
        ],

        detectedAt: Date.now(),
        category: 'data_quality',
        tags: ['whitespace', 'cleanup'],

        examples,
        autoFixAvailable: true,
      });
    }

    return issues;
  }

  /**
   * Find columns with mixed data types
   */
  private findMixedTypes(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const header of data.headers) {
      const typeCounts: Record<string, number> = {};
      const typeExamples: Record<string, string[]> = {};

      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type !== 'empty') {
          typeCounts[cell.type] = (typeCounts[cell.type] || 0) + 1;
          if (!typeExamples[cell.type]) {
            typeExamples[cell.type] = [];
          }
          if (typeExamples[cell.type].length < 2) {
            typeExamples[cell.type].push(cell.ref);
          }
        }
      }

      const types = Object.keys(typeCounts);
      if (types.length > 1 && !types.every(t => t === 'empty')) {
        const examples: IssueExample[] = types.slice(0, 3).map(t => ({
          cellRef: typeExamples[t]?.[0] || header.letter,
          value: t,
          reason: `${typeCounts[t]} cells of this type`,
        }));

        issues.push({
          id: `mixed-${header.letter}`,
          type: 'issue',
          issueType: 'mixed_types',
          priority: 'medium',
          status: 'pending',

          title: `Mixed data types in "${header.name}"`,
          description: `Column contains ${types.join(', ')} values`,

          sheetId: data.sheetId,
          affectedCells: [],

          confidence: 0.9,
          impact: {
            cellCount: Object.values(typeCounts).reduce((a, b) => a + b, 0),
            severity: 'medium',
            description: 'Mixed types may cause formula errors',
          },

          actions: [
            {
              id: 'review-types',
              label: 'Review column',
              type: 'primary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'data_quality',
          tags: ['types', 'consistency'],

          examples,
          autoFixAvailable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Find empty rows in data
   */
  private findEmptyRows(data: SheetData): DataIssue[] {
    const issues: DataIssue[] = [];
    const emptyRows: number[] = [];

    for (let row = 1; row < data.rowCount - 1; row++) {
      const rowData = data.cells[row];
      if (rowData && rowData.every(c => c.type === 'empty')) {
        // Check if there's data after this row
        let hasDataAfter = false;
        for (let r = row + 1; r < data.rowCount; r++) {
          if (data.cells[r]?.some(c => c.type !== 'empty')) {
            hasDataAfter = true;
            break;
          }
        }
        if (hasDataAfter) {
          emptyRows.push(row);
        }
      }
    }

    if (emptyRows.length > 0) {
      issues.push({
        id: 'empty-rows',
        type: 'issue',
        issueType: 'empty_rows',
        priority: 'low',
        status: 'pending',

        title: `${emptyRows.length} empty rows in data`,
        description: `Rows ${emptyRows.slice(0, 3).map(r => r + 1).join(', ')}${emptyRows.length > 3 ? '...' : ''} are empty`,

        sheetId: data.sheetId,
        affectedCells: emptyRows.map(r => `${r + 1}`),

        confidence: 1.0,
        impact: {
          cellCount: emptyRows.length * data.colCount,
          severity: 'low',
          description: 'Empty rows may affect data ranges',
        },

        actions: [
          {
            id: 'delete-empty',
            label: 'Delete empty rows',
            type: 'primary',
            action: 'apply_fix',
            params: { rows: emptyRows },
          },
        ],

        detectedAt: Date.now(),
        category: 'data_quality',
        tags: ['empty', 'cleanup'],

        examples: emptyRows.slice(0, 3).map(r => ({
          cellRef: `Row ${r + 1}`,
          value: '(empty)',
          reason: 'Empty row in middle of data',
        })),
        autoFixAvailable: true,
      });
    }

    return issues;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private looksLikeDate(value: string): boolean {
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{1,2}-\d{1,2}-\d{2,4}$/,
      /^\w{3}\s+\d{1,2},?\s+\d{4}$/,
    ];
    return datePatterns.some(p => p.test(value.trim()));
  }

  private looksLikeNumber(value: string): boolean {
    const trimmed = value.trim().replace(/[$,]/g, '');
    return !isNaN(Number(trimmed)) && trimmed.length > 0;
  }

  private areSimilar(a: string, b: string): boolean {
    if (a === b) return true;

    // Check if one is abbreviation of other
    if (a.startsWith(b) || b.startsWith(a)) return true;

    // Check edit distance for short strings
    if (a.length < 5 && b.length < 5) {
      return this.editDistance(a, b) <= 1;
    }

    return false;
  }

  private editDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }
}
