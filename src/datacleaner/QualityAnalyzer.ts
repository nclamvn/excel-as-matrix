// =============================================================================
// QUALITY ANALYZER — Analyze data quality and generate scores
// =============================================================================

import type {
  CleanerSheetData,
  QualityScore,
  QualityGrade,
  QualityCategories,
  CategoryScore,
  QualityIssue,
  IssueExample,
} from './types';

/**
 * Analyzes data quality and generates quality scores
 */
export class QualityAnalyzer {
  /**
   * Analyze sheet data and generate quality score
   */
  analyze(data: CleanerSheetData): QualityScore {
    const issues: QualityIssue[] = [];

    // Analyze each category
    const duplicates = this.analyzeDuplicates(data, issues);
    const completeness = this.analyzeCompleteness(data, issues);
    const validity = this.analyzeValidity(data, issues);
    const consistency = this.analyzeConsistency(data, issues);
    const accuracy = this.analyzeAccuracy(data, issues);

    const categories: QualityCategories = {
      duplicates,
      completeness,
      validity,
      consistency,
      accuracy,
    };

    // Calculate overall score (weighted average)
    const weights = {
      duplicates: 0.2,
      completeness: 0.25,
      validity: 0.2,
      consistency: 0.2,
      accuracy: 0.15,
    };

    const overall = Math.round(
      duplicates.score * weights.duplicates +
      completeness.score * weights.completeness +
      validity.score * weights.validity +
      consistency.score * weights.consistency +
      accuracy.score * weights.accuracy
    );

    const autoFixable = issues.filter(i => i.autoFixable).length;

    return {
      overall,
      grade: this.getGrade(overall),
      categories,
      issues,
      summary: {
        totalRows: data.rowCount,
        totalCells: data.rowCount * data.colCount,
        totalIssues: issues.length,
        autoFixable,
        manualReview: issues.length - autoFixable,
      },
    };
  }

  /**
   * Analyze duplicates
   */
  private analyzeDuplicates(
    data: CleanerSheetData,
    issues: QualityIssue[]
  ): CategoryScore {
    const rowHashes = new Map<string, number[]>();

    // Hash each row
    for (let row = 0; row < data.rowCount; row++) {
      const rowData = data.cells[row];
      if (!rowData) continue;

      const hash = rowData.map(c => String(c.value).toLowerCase().trim()).join('|');
      const existing = rowHashes.get(hash) || [];
      existing.push(row);
      rowHashes.set(hash, existing);
    }

    // Find duplicates
    let duplicateRows = 0;
    const duplicateGroups: Array<{ rows: number[]; values: unknown[] }> = [];

    for (const [_hash, rows] of rowHashes) {
      if (rows.length > 1) {
        duplicateRows += rows.length - 1; // Don't count the original
        duplicateGroups.push({
          rows,
          values: data.cells[rows[0]]?.map(c => c.value) || [],
        });
      }
    }

    // Add issue if duplicates found
    if (duplicateGroups.length > 0) {
      const examples: IssueExample[] = duplicateGroups.slice(0, 3).map(g => ({
        cell: `Row ${g.rows[0] + 1}`,
        currentValue: g.values.slice(0, 3).join(', '),
        reason: `Duplicated in rows: ${g.rows.map(r => r + 1).join(', ')}`,
      }));

      issues.push({
        id: `dup-${Date.now()}`,
        type: 'duplicate',
        severity: duplicateRows > 10 ? 'critical' : 'warning',
        category: 'duplicates',
        title: `${duplicateGroups.length} duplicate groups found`,
        description: `Found ${duplicateRows} duplicate rows in ${duplicateGroups.length} groups`,
        affectedCells: [],
        affectedRows: duplicateGroups.flatMap(g => g.rows.slice(1)),
        count: duplicateRows,
        autoFixable: true,
        suggestedFix: {
          type: 'remove_duplicates',
          description: `Remove ${duplicateRows} duplicate rows, keeping first occurrence`,
        },
        examples,
      });
    }

    // Calculate score: 100% if no duplicates, decreases with more duplicates
    const duplicatePercent = (duplicateRows / data.rowCount) * 100;
    const score = Math.max(0, Math.round(100 - duplicatePercent * 2));

    return {
      score,
      grade: this.getGrade(score),
      issueCount: duplicateGroups.length,
      description: duplicateRows === 0
        ? 'No duplicate rows found'
        : `${duplicateRows} duplicate rows (${duplicatePercent.toFixed(1)}%)`,
    };
  }

  /**
   * Analyze completeness (missing values)
   */
  private analyzeCompleteness(
    data: CleanerSheetData,
    issues: QualityIssue[]
  ): CategoryScore {
    let totalEmpty = 0;
    const emptyByColumn = new Map<number, number[]>();

    for (let row = 0; row < data.rowCount; row++) {
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) {
          totalEmpty++;
          const existing = emptyByColumn.get(col) || [];
          existing.push(row);
          emptyByColumn.set(col, existing);
        }
      }
    }

    // Add issues for columns with many missing values
    for (const [col, rows] of emptyByColumn) {
      const missingPercent = (rows.length / data.rowCount) * 100;
      if (missingPercent > 5) { // Only flag if > 5% missing
        const examples: IssueExample[] = rows.slice(0, 3).map(r => ({
          cell: `${this.colToLetter(col)}${r + 1}`,
          currentValue: '(empty)',
          reason: 'Missing value',
        }));

        issues.push({
          id: `missing-${col}-${Date.now()}`,
          type: 'missing',
          severity: missingPercent > 20 ? 'critical' : 'warning',
          category: 'completeness',
          title: `Missing values in column ${data.headers[col] || this.colToLetter(col)}`,
          description: `${rows.length} missing values (${missingPercent.toFixed(1)}%)`,
          affectedCells: rows.map(r => ({
            row: r,
            col,
            ref: `${this.colToLetter(col)}${r + 1}`,
            value: null,
          })),
          affectedRows: rows,
          count: rows.length,
          autoFixable: true,
          suggestedFix: {
            type: 'fill_missing',
            description: 'Fill with mean/median or forward fill',
          },
          examples,
        });
      }
    }

    const totalCells = data.rowCount * data.colCount;
    const emptyPercent = (totalEmpty / totalCells) * 100;
    const score = Math.max(0, Math.round(100 - emptyPercent * 1.5));

    return {
      score,
      grade: this.getGrade(score),
      issueCount: emptyByColumn.size,
      description: totalEmpty === 0
        ? 'All cells have values'
        : `${totalEmpty} empty cells (${emptyPercent.toFixed(1)}%)`,
    };
  }

  /**
   * Analyze validity (format issues, invalid values)
   */
  private analyzeValidity(
    data: CleanerSheetData,
    issues: QualityIssue[]
  ): CategoryScore {
    let invalidCount = 0;
    const formatIssues: Array<{ col: number; rows: number[]; type: string }> = [];

    // Check each column for format consistency
    for (let col = 0; col < data.colCount; col++) {
      const columnType = data.columnTypes[col];
      const invalidRows: number[] = [];

      for (let row = 0; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) continue;

        const isValid = this.validateCellType(cell.value, columnType);
        if (!isValid) {
          invalidCount++;
          invalidRows.push(row);
        }
      }

      if (invalidRows.length > 0) {
        formatIssues.push({ col, rows: invalidRows, type: columnType });
      }
    }

    // Add issues
    for (const { col, rows, type } of formatIssues) {
      if (rows.length > 0) {
        const examples: IssueExample[] = rows.slice(0, 3).map(r => ({
          cell: `${this.colToLetter(col)}${r + 1}`,
          currentValue: data.cells[r]?.[col]?.value,
          reason: `Expected ${type} format`,
        }));

        issues.push({
          id: `validity-${col}-${Date.now()}`,
          type: 'invalid_format',
          severity: rows.length > 10 ? 'warning' : 'info',
          category: 'validity',
          title: `Invalid format in ${data.headers[col] || this.colToLetter(col)}`,
          description: `${rows.length} cells don't match expected ${type} format`,
          affectedCells: rows.map(r => ({
            row: r,
            col,
            ref: `${this.colToLetter(col)}${r + 1}`,
            value: data.cells[r]?.[col]?.value,
          })),
          affectedRows: rows,
          count: rows.length,
          autoFixable: true,
          suggestedFix: {
            type: 'standardize_format',
            description: `Standardize to ${type} format`,
          },
          examples,
        });
      }
    }

    const totalCells = data.rowCount * data.colCount;
    const invalidPercent = (invalidCount / totalCells) * 100;
    const score = Math.max(0, Math.round(100 - invalidPercent * 2));

    return {
      score,
      grade: this.getGrade(score),
      issueCount: formatIssues.length,
      description: invalidCount === 0
        ? 'All values are valid'
        : `${invalidCount} invalid values (${invalidPercent.toFixed(1)}%)`,
    };
  }

  /**
   * Analyze consistency (similar values that should be the same)
   */
  private analyzeConsistency(
    data: CleanerSheetData,
    issues: QualityIssue[]
  ): CategoryScore {
    let inconsistentCount = 0;
    const inconsistencies: Array<{ col: number; groups: Map<string, string[]> }> = [];

    // Check text columns for inconsistent values
    for (let col = 0; col < data.colCount; col++) {
      if (data.columnTypes[col] !== 'text') continue;

      const valueMap = new Map<string, string[]>();

      for (let row = 0; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) continue;

        const value = String(cell.value);
        const normalized = value.toLowerCase().trim();

        const existing = valueMap.get(normalized) || [];
        if (!existing.includes(value)) {
          existing.push(value);
        }
        valueMap.set(normalized, existing);
      }

      // Find groups with multiple variants
      const groups = new Map<string, string[]>();
      for (const [key, variants] of valueMap) {
        if (variants.length > 1) {
          groups.set(key, variants);
          inconsistentCount += variants.length - 1;
        }
      }

      if (groups.size > 0) {
        inconsistencies.push({ col, groups });
      }
    }

    // Add issues
    for (const { col, groups } of inconsistencies) {
      const examples: IssueExample[] = Array.from(groups.entries())
        .slice(0, 3)
        .map(([_canonical, variants]) => ({
          cell: data.headers[col] || this.colToLetter(col),
          currentValue: variants.join(', '),
          suggestedValue: variants[0],
          reason: `Multiple variants: ${variants.join(' vs ')}`,
        }));

      issues.push({
        id: `consistency-${col}-${Date.now()}`,
        type: 'inconsistent',
        severity: groups.size > 5 ? 'warning' : 'info',
        category: 'consistency',
        title: `Inconsistent values in ${data.headers[col] || this.colToLetter(col)}`,
        description: `Found ${groups.size} groups with inconsistent naming`,
        affectedCells: [],
        affectedRows: [],
        count: groups.size,
        autoFixable: true,
        suggestedFix: {
          type: 'fix_inconsistency',
          description: 'Standardize to most common variant',
        },
        examples,
      });
    }

    const score = Math.max(0, Math.round(100 - inconsistencies.length * 5));

    return {
      score,
      grade: this.getGrade(score),
      issueCount: inconsistencies.length,
      description: inconsistentCount === 0
        ? 'All values are consistent'
        : `${inconsistencies.length} columns with inconsistent values`,
    };
  }

  /**
   * Analyze accuracy (outliers, suspicious values)
   */
  private analyzeAccuracy(
    data: CleanerSheetData,
    issues: QualityIssue[]
  ): CategoryScore {
    let outlierCount = 0;
    const outlierColumns: Array<{ col: number; outliers: number[] }> = [];

    // Check numeric columns for outliers
    for (let col = 0; col < data.colCount; col++) {
      if (data.columnTypes[col] !== 'number' && data.columnTypes[col] !== 'currency') {
        continue;
      }

      const values: number[] = [];
      const rowMap: number[] = [];

      for (let row = 0; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) continue;

        const num = parseFloat(String(cell.value));
        if (!isNaN(num)) {
          values.push(num);
          rowMap.push(row);
        }
      }

      if (values.length < 10) continue; // Need enough data for outlier detection

      // Calculate statistics
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );

      // Find outliers (z-score > 3)
      const outliers: number[] = [];
      for (let i = 0; i < values.length; i++) {
        const zScore = Math.abs((values[i] - mean) / stdDev);
        if (zScore > 3) {
          outliers.push(rowMap[i]);
          outlierCount++;
        }
      }

      if (outliers.length > 0) {
        outlierColumns.push({ col, outliers });
      }
    }

    // Add issues
    for (const { col, outliers } of outlierColumns) {
      const examples: IssueExample[] = outliers.slice(0, 3).map(r => ({
        cell: `${this.colToLetter(col)}${r + 1}`,
        currentValue: data.cells[r]?.[col]?.value,
        reason: 'Statistical outlier (z-score > 3)',
      }));

      issues.push({
        id: `outlier-${col}-${Date.now()}`,
        type: 'outlier',
        severity: 'info',
        category: 'accuracy',
        title: `Outliers in ${data.headers[col] || this.colToLetter(col)}`,
        description: `Found ${outliers.length} statistical outliers`,
        affectedCells: outliers.map(r => ({
          row: r,
          col,
          ref: `${this.colToLetter(col)}${r + 1}`,
          value: data.cells[r]?.[col]?.value,
        })),
        affectedRows: outliers,
        count: outliers.length,
        autoFixable: false,
        examples,
      });
    }

    const score = Math.max(0, Math.round(100 - outlierCount * 2));

    return {
      score,
      grade: this.getGrade(score),
      issueCount: outlierColumns.length,
      description: outlierCount === 0
        ? 'No outliers detected'
        : `${outlierCount} potential outliers in ${outlierColumns.length} columns`,
    };
  }

  /**
   * Get grade from score
   */
  private getGrade(score: number): QualityGrade {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Validate cell value against expected type
   */
  private validateCellType(value: unknown, type: string): boolean {
    if (value === null || value === undefined || value === '') return true;

    const str = String(value);

    switch (type) {
      case 'number':
      case 'currency':
        return !isNaN(parseFloat(str.replace(/[$,]/g, '')));
      case 'date':
        return !isNaN(Date.parse(str)) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(str);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
      case 'phone':
        return /^[\d\s\-\(\)\+]+$/.test(str) && str.replace(/\D/g, '').length >= 10;
      default:
        return true;
    }
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
