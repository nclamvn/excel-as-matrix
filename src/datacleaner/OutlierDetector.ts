// =============================================================================
// OUTLIER DETECTOR — Detect statistical outliers
// =============================================================================

import type {
  CleanerSheetData,
  OutlierInfo,
  OutlierCell,
  ColumnStats,
  OutlierConfig,
} from './types';
import { DEFAULT_OUTLIER_CONFIG } from './types';

/**
 * Detects statistical outliers in numeric data
 */
export class OutlierDetector {
  private config: OutlierConfig;

  constructor(config: Partial<OutlierConfig> = {}) {
    this.config = { ...DEFAULT_OUTLIER_CONFIG, ...config };
  }

  /**
   * Detect outliers in data
   */
  detect(data: CleanerSheetData): OutlierInfo[] {
    const results: OutlierInfo[] = [];
    const columnsToCheck = this.getColumnsToCheck(data);

    for (const col of columnsToCheck) {
      const values = this.extractNumericValues(data, col);

      if (values.length < 10) continue; // Need enough data

      const stats = this.calculateStats(values.map(v => v.value));
      const outliers = this.findOutliers(values, stats);

      if (outliers.length > 0) {
        results.push({
          column: col,
          columnName: data.headers[col] || this.colToLetter(col),
          outliers,
          stats,
          method: this.config.method,
        });
      }
    }

    return results;
  }

  /**
   * Extract numeric values from a column
   */
  private extractNumericValues(
    data: CleanerSheetData,
    col: number
  ): Array<{ row: number; value: number }> {
    const values: Array<{ row: number; value: number }> = [];

    for (let row = 0; row < data.rowCount; row++) {
      const cell = data.cells[row]?.[col];
      if (!cell || cell.isEmpty) continue;

      const num = parseFloat(String(cell.value).replace(/[$,]/g, ''));
      if (!isNaN(num)) {
        values.push({ row, value: num });
      }
    }

    return values;
  }

  /**
   * Calculate statistics for a set of values
   */
  private calculateStats(values: number[]): ColumnStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / n;

    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      q3,
      iqr,
    };
  }

  /**
   * Find outliers using configured method
   */
  private findOutliers(
    values: Array<{ row: number; value: number }>,
    stats: ColumnStats
  ): OutlierCell[] {
    switch (this.config.method) {
      case 'zscore':
        return this.findOutliersZScore(values, stats);
      case 'iqr':
        return this.findOutliersIQR(values, stats);
      case 'mad':
        return this.findOutliersMAD(values, stats);
      default:
        return this.findOutliersZScore(values, stats);
    }
  }

  /**
   * Find outliers using Z-score method
   */
  private findOutliersZScore(
    values: Array<{ row: number; value: number }>,
    stats: ColumnStats
  ): OutlierCell[] {
    const outliers: OutlierCell[] = [];

    if (stats.stdDev === 0) return outliers;

    for (const { row, value } of values) {
      const zScore = (value - stats.mean) / stats.stdDev;

      if (Math.abs(zScore) > this.config.zScoreThreshold) {
        outliers.push({
          row,
          col: 0, // Will be set by caller
          ref: '',
          value,
          score: zScore,
          direction: zScore > 0 ? 'high' : 'low',
        });
      }
    }

    return outliers;
  }

  /**
   * Find outliers using IQR method
   */
  private findOutliersIQR(
    values: Array<{ row: number; value: number }>,
    stats: ColumnStats
  ): OutlierCell[] {
    const outliers: OutlierCell[] = [];

    const lowerBound = stats.q1 - this.config.iqrMultiplier * stats.iqr;
    const upperBound = stats.q3 + this.config.iqrMultiplier * stats.iqr;

    for (const { row, value } of values) {
      if (value < lowerBound || value > upperBound) {
        const score = value < lowerBound
          ? (lowerBound - value) / stats.iqr
          : (value - upperBound) / stats.iqr;

        outliers.push({
          row,
          col: 0,
          ref: '',
          value,
          score,
          direction: value < lowerBound ? 'low' : 'high',
        });
      }
    }

    return outliers;
  }

  /**
   * Find outliers using MAD (Median Absolute Deviation) method
   */
  private findOutliersMAD(
    values: Array<{ row: number; value: number }>,
    stats: ColumnStats
  ): OutlierCell[] {
    const outliers: OutlierCell[] = [];

    // Calculate MAD
    const deviations = values.map(v => Math.abs(v.value - stats.median));
    const sortedDeviations = [...deviations].sort((a, b) => a - b);
    const mid = Math.floor(sortedDeviations.length / 2);
    const mad = sortedDeviations.length % 2 === 0
      ? (sortedDeviations[mid - 1] + sortedDeviations[mid]) / 2
      : sortedDeviations[mid];

    if (mad === 0) return outliers;

    // Modified Z-score using MAD
    const k = 1.4826; // Consistency constant for normal distribution

    for (let i = 0; i < values.length; i++) {
      const { row, value } = values[i];
      const modifiedZScore = (0.6745 * (value - stats.median)) / (k * mad);

      if (Math.abs(modifiedZScore) > this.config.zScoreThreshold) {
        outliers.push({
          row,
          col: 0,
          ref: '',
          value,
          score: modifiedZScore,
          direction: modifiedZScore > 0 ? 'high' : 'low',
        });
      }
    }

    return outliers;
  }

  /**
   * Get columns to check for outliers
   */
  private getColumnsToCheck(data: CleanerSheetData): number[] {
    if (this.config.columnsToCheck === 'numeric') {
      const numericColumns: number[] = [];

      for (let col = 0; col < data.colCount; col++) {
        if (data.columnTypes[col] === 'number' || data.columnTypes[col] === 'currency') {
          numericColumns.push(col);
        }
      }

      return numericColumns;
    }

    return this.config.columnsToCheck;
  }

  /**
   * Get bounds for a column (for visualization)
   */
  getBounds(stats: ColumnStats): { lower: number; upper: number } {
    switch (this.config.method) {
      case 'zscore':
        return {
          lower: stats.mean - this.config.zScoreThreshold * stats.stdDev,
          upper: stats.mean + this.config.zScoreThreshold * stats.stdDev,
        };
      case 'iqr':
        return {
          lower: stats.q1 - this.config.iqrMultiplier * stats.iqr,
          upper: stats.q3 + this.config.iqrMultiplier * stats.iqr,
        };
      default:
        return {
          lower: stats.mean - 3 * stats.stdDev,
          upper: stats.mean + 3 * stats.stdDev,
        };
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

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OutlierConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
