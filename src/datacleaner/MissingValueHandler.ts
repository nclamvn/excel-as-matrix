// =============================================================================
// MISSING VALUE HANDLER — Handle missing values
// =============================================================================

import type {
  CleanerSheetData,
  MissingValueInfo,
  MissingValueConfig,
  FillStrategy,
  CellChange,
} from './types';
import { DEFAULT_MISSING_CONFIG } from './types';

/**
 * Handles missing values in spreadsheet data
 */
export class MissingValueHandler {
  private config: MissingValueConfig;

  constructor(config: Partial<MissingValueConfig> = {}) {
    this.config = { ...DEFAULT_MISSING_CONFIG, ...config };
  }

  /**
   * Analyze missing values in data
   */
  analyze(data: CleanerSheetData): MissingValueInfo[] {
    const info: MissingValueInfo[] = [];

    for (let col = 0; col < data.colCount; col++) {
      const missingRows: number[] = [];

      for (let row = 0; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) {
          missingRows.push(row);
        }
      }

      if (missingRows.length > 0) {
        const columnType = data.columnTypes[col];
        const suggestedStrategy = this.suggestStrategy(data, col, columnType);
        const suggestedValue = this.calculateSuggestedValue(data, col, suggestedStrategy);

        info.push({
          column: col,
          columnName: data.headers[col] || this.colToLetter(col),
          missingCount: missingRows.length,
          missingPercent: (missingRows.length / data.rowCount) * 100,
          rows: missingRows,
          suggestedStrategy,
          suggestedValue,
        });
      }
    }

    return info;
  }

  /**
   * Suggest fill strategy based on column type and data
   */
  private suggestStrategy(
    _data: CleanerSheetData,
    col: number,
    columnType: string
  ): FillStrategy {
    // Check if column has a custom strategy
    if (this.config.strategies[col]) {
      return this.config.strategies[col];
    }

    // Suggest based on column type
    switch (columnType) {
      case 'number':
      case 'currency':
        return 'mean';
      case 'date':
        return 'forward_fill';
      case 'text':
      case 'name':
        return 'mode';
      default:
        return this.config.defaultStrategy;
    }
  }

  /**
   * Calculate suggested value for filling
   */
  private calculateSuggestedValue(
    data: CleanerSheetData,
    col: number,
    strategy: FillStrategy
  ): unknown {
    const values: unknown[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      const cell = data.cells[row]?.[col];
      if (cell && !cell.isEmpty) {
        values.push(cell.value);
      }
    }

    if (values.length === 0) return null;

    switch (strategy) {
      case 'mean':
        return this.calculateMean(values);
      case 'median':
        return this.calculateMedian(values);
      case 'mode':
        return this.calculateMode(values);
      case 'constant':
        return this.config.constantValues[col];
      default:
        return null;
    }
  }

  /**
   * Calculate mean of numeric values
   */
  private calculateMean(values: unknown[]): number | null {
    const numbers = values
      .map(v => parseFloat(String(v)))
      .filter(n => !isNaN(n));

    if (numbers.length === 0) return null;

    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round((sum / numbers.length) * 100) / 100;
  }

  /**
   * Calculate median of numeric values
   */
  private calculateMedian(values: unknown[]): number | null {
    const numbers = values
      .map(v => parseFloat(String(v)))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (numbers.length === 0) return null;

    const mid = Math.floor(numbers.length / 2);

    if (numbers.length % 2 === 0) {
      return (numbers[mid - 1] + numbers[mid]) / 2;
    }

    return numbers[mid];
  }

  /**
   * Calculate mode (most common value)
   */
  private calculateMode(values: unknown[]): unknown {
    const counts = new Map<string, { value: unknown; count: number }>();

    for (const value of values) {
      const key = String(value);
      const existing = counts.get(key);

      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { value, count: 1 });
      }
    }

    let maxCount = 0;
    let mode: unknown = null;

    for (const { value, count } of counts.values()) {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    }

    return mode;
  }

  /**
   * Fill missing values in data
   */
  fill(data: CleanerSheetData, info: MissingValueInfo[]): CellChange[] {
    const changes: CellChange[] = [];

    for (const colInfo of info) {
      const strategy = this.config.strategies[colInfo.column] || colInfo.suggestedStrategy;
      const fillValues = this.calculateFillValues(data, colInfo.column, colInfo.rows, strategy);

      for (let i = 0; i < colInfo.rows.length; i++) {
        const row = colInfo.rows[i];
        const value = fillValues[i];

        if (value !== null && value !== undefined) {
          changes.push({
            row,
            col: colInfo.column,
            ref: `${this.colToLetter(colInfo.column)}${row + 1}`,
            before: null,
            after: value,
            changeType: 'filled',
          });
        }
      }
    }

    return changes;
  }

  /**
   * Calculate fill values for missing cells
   */
  private calculateFillValues(
    data: CleanerSheetData,
    col: number,
    missingRows: number[],
    strategy: FillStrategy
  ): unknown[] {
    switch (strategy) {
      case 'mean':
      case 'median':
      case 'mode': {
        const value = this.calculateSuggestedValue(data, col, strategy);
        return missingRows.map(() => value);
      }

      case 'forward_fill':
        return this.forwardFill(data, col, missingRows);

      case 'backward_fill':
        return this.backwardFill(data, col, missingRows);

      case 'interpolate':
        return this.interpolate(data, col, missingRows);

      case 'constant': {
        const value = this.config.constantValues[col];
        return missingRows.map(() => value);
      }

      default:
        return missingRows.map(() => null);
    }
  }

  /**
   * Forward fill: use previous non-empty value
   */
  private forwardFill(
    data: CleanerSheetData,
    col: number,
    missingRows: number[]
  ): unknown[] {
    const values: unknown[] = [];
    let lastValue: unknown = null;

    for (const row of missingRows) {
      // Find last non-empty value before this row
      for (let r = row - 1; r >= 0; r--) {
        const cell = data.cells[r]?.[col];
        if (cell && !cell.isEmpty) {
          lastValue = cell.value;
          break;
        }
      }
      values.push(lastValue);
    }

    return values;
  }

  /**
   * Backward fill: use next non-empty value
   */
  private backwardFill(
    data: CleanerSheetData,
    col: number,
    missingRows: number[]
  ): unknown[] {
    const values: unknown[] = [];

    for (const row of missingRows) {
      let nextValue: unknown = null;

      // Find next non-empty value after this row
      for (let r = row + 1; r < data.rowCount; r++) {
        const cell = data.cells[r]?.[col];
        if (cell && !cell.isEmpty) {
          nextValue = cell.value;
          break;
        }
      }
      values.push(nextValue);
    }

    return values;
  }

  /**
   * Linear interpolation for numeric values
   */
  private interpolate(
    data: CleanerSheetData,
    col: number,
    missingRows: number[]
  ): unknown[] {
    const values: unknown[] = [];

    for (const row of missingRows) {
      let prevRow = -1;
      let nextRow = -1;
      let prevValue = NaN;
      let nextValue = NaN;

      // Find previous non-empty numeric value
      for (let r = row - 1; r >= 0; r--) {
        const cell = data.cells[r]?.[col];
        if (cell && !cell.isEmpty) {
          const num = parseFloat(String(cell.value));
          if (!isNaN(num)) {
            prevRow = r;
            prevValue = num;
            break;
          }
        }
      }

      // Find next non-empty numeric value
      for (let r = row + 1; r < data.rowCount; r++) {
        const cell = data.cells[r]?.[col];
        if (cell && !cell.isEmpty) {
          const num = parseFloat(String(cell.value));
          if (!isNaN(num)) {
            nextRow = r;
            nextValue = num;
            break;
          }
        }
      }

      // Interpolate
      if (!isNaN(prevValue) && !isNaN(nextValue) && prevRow >= 0 && nextRow >= 0) {
        const ratio = (row - prevRow) / (nextRow - prevRow);
        const interpolated = prevValue + ratio * (nextValue - prevValue);
        values.push(Math.round(interpolated * 100) / 100);
      } else if (!isNaN(prevValue)) {
        values.push(prevValue);
      } else if (!isNaN(nextValue)) {
        values.push(nextValue);
      } else {
        values.push(null);
      }
    }

    return values;
  }

  /**
   * Get rows that should be deleted (too many missing values)
   */
  getRowsToDelete(data: CleanerSheetData): number[] {
    const rowsToDelete: number[] = [];
    const threshold = this.config.deleteThreshold;

    for (let row = 0; row < data.rowCount; row++) {
      let missingCount = 0;

      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) {
          missingCount++;
        }
      }

      const missingPercent = missingCount / data.colCount;
      if (missingPercent > threshold) {
        rowsToDelete.push(row);
      }
    }

    return rowsToDelete;
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
  updateConfig(config: Partial<MissingValueConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
