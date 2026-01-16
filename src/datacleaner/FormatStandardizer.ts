// =============================================================================
// FORMAT STANDARDIZER — Standardize data formats
// =============================================================================

import type {
  CleanerSheetData,
  FormatType,
  FormatIssue,
  FormatCell,
  FormatConfig,
  CellChange,
} from './types';
import { DEFAULT_FORMAT_CONFIG } from './types';

/**
 * Standardizes data formats across columns
 */
export class FormatStandardizer {
  private config: FormatConfig;

  constructor(config: Partial<FormatConfig> = {}) {
    this.config = { ...DEFAULT_FORMAT_CONFIG, ...config };
  }

  /**
   * Analyze format issues in data
   */
  analyze(data: CleanerSheetData): FormatIssue[] {
    const issues: FormatIssue[] = [];

    for (let col = 0; col < data.colCount; col++) {
      const columnType = data.columnTypes[col];
      const inconsistentCells = this.findInconsistentCells(data, col, columnType);

      if (inconsistentCells.length > 0) {
        issues.push({
          column: col,
          columnName: data.headers[col] || this.colToLetter(col),
          detectedType: columnType,
          inconsistentCells,
          suggestedFormat: this.getSuggestedFormat(columnType),
        });
      }
    }

    return issues;
  }

  /**
   * Find cells with inconsistent format in a column
   */
  private findInconsistentCells(
    data: CleanerSheetData,
    col: number,
    columnType: FormatType
  ): FormatCell[] {
    const cells: FormatCell[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      const cell = data.cells[row]?.[col];
      if (!cell || cell.isEmpty) continue;

      const value = String(cell.value);
      const standardized = this.standardizeValue(value, columnType);

      if (standardized !== value) {
        cells.push({
          row,
          col,
          ref: `${this.colToLetter(col)}${row + 1}`,
          currentValue: value,
          standardizedValue: standardized,
          formatPattern: this.getFormatPattern(value, columnType),
        });
      }
    }

    return cells;
  }

  /**
   * Standardize a single value
   */
  standardizeValue(value: string, type: FormatType): string {
    switch (type) {
      case 'date':
        return this.standardizeDate(value);
      case 'phone':
        return this.standardizePhone(value);
      case 'email':
        return this.standardizeEmail(value);
      case 'name':
        return this.standardizeName(value);
      case 'currency':
        return this.standardizeCurrency(value);
      case 'number':
        return this.standardizeNumber(value);
      default:
        return this.standardizeText(value);
    }
  }

  /**
   * Standardize date format
   */
  private standardizeDate(value: string): string {
    // Try to parse the date
    const date = this.parseDate(value);
    if (!date) return value;

    // Format according to config
    const format = this.config.dateFormat;
    return this.formatDate(date, format);
  }

  /**
   * Parse date from various formats
   */
  private parseDate(value: string): Date | null {
    // Try standard date parsing
    let date = new Date(value);
    if (!isNaN(date.getTime())) return date;

    // Try common formats
    const patterns = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/, // DD.MM.YYYY
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) {
        // Try MM/DD/YYYY
        date = new Date(`${match[1]}/${match[2]}/${match[3]}`);
        if (!isNaN(date.getTime())) return date;

        // Try DD/MM/YYYY
        date = new Date(`${match[2]}/${match[1]}/${match[3]}`);
        if (!isNaN(date.getTime())) return date;
      }
    }

    return null;
  }

  /**
   * Format date according to pattern
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('YY', String(year).slice(-2))
      .replace('MM', month)
      .replace('M', String(date.getMonth() + 1))
      .replace('DD', day)
      .replace('D', String(date.getDate()));
  }

  /**
   * Standardize phone number
   */
  private standardizePhone(value: string): string {
    // Extract digits
    const digits = value.replace(/\D/g, '');

    if (digits.length < 10) return value;

    // Apply format
    const format = this.config.phoneFormat;
    let result = format;
    let digitIndex = 0;

    // Handle country code
    if (digits.length > 10 && format.includes('+')) {
      const countryCode = digits.slice(0, digits.length - 10);
      result = result.replace('+1', `+${countryCode}`);
      digitIndex = digits.length - 10;
    }

    // Replace X placeholders with digits
    for (let i = 0; i < result.length && digitIndex < digits.length; i++) {
      if (result[i] === 'X') {
        result = result.slice(0, i) + digits[digitIndex] + result.slice(i + 1);
        digitIndex++;
      }
    }

    return result;
  }

  /**
   * Standardize email
   */
  private standardizeEmail(value: string): string {
    return value.toLowerCase().trim();
  }

  /**
   * Standardize name
   */
  private standardizeName(value: string): string {
    const trimmed = value.trim().replace(/\s+/g, ' ');

    switch (this.config.nameFormat) {
      case 'title':
        return trimmed.replace(/\w\S*/g, txt =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      case 'upper':
        return trimmed.toUpperCase();
      case 'lower':
        return trimmed.toLowerCase();
      case 'sentence':
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      default:
        return trimmed;
    }
  }

  /**
   * Standardize currency
   */
  private standardizeCurrency(value: string): string {
    // Extract number
    const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    if (isNaN(num)) return value;

    // Format with currency symbol
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  }

  /**
   * Standardize number
   */
  private standardizeNumber(value: string): string {
    const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    if (isNaN(num)) return value;

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }

  /**
   * Standardize text (trim whitespace)
   */
  private standardizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Get suggested format string for type
   */
  private getSuggestedFormat(type: FormatType): string {
    switch (type) {
      case 'date':
        return this.config.dateFormat;
      case 'phone':
        return this.config.phoneFormat;
      case 'currency':
        return this.config.currencyFormat;
      case 'number':
        return this.config.numberFormat;
      case 'name':
        return this.config.nameFormat;
      default:
        return 'trimmed text';
    }
  }

  /**
   * Get format pattern for a value
   */
  private getFormatPattern(value: string, type: FormatType): string {
    switch (type) {
      case 'date':
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'YYYY-MM-DD';
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return 'M/D/YYYY';
        if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(value)) return 'M/D/YY';
        return 'unknown';
      case 'phone':
        if (/^\(\d{3}\) \d{3}-\d{4}$/.test(value)) return '(XXX) XXX-XXXX';
        if (/^\d{3}-\d{3}-\d{4}$/.test(value)) return 'XXX-XXX-XXXX';
        if (/^\d{10}$/.test(value)) return 'XXXXXXXXXX';
        return 'unknown';
      default:
        return 'various';
    }
  }

  /**
   * Apply standardization to data
   */
  standardize(_data: CleanerSheetData, issues: FormatIssue[]): CellChange[] {
    const changes: CellChange[] = [];

    for (const issue of issues) {
      for (const cell of issue.inconsistentCells) {
        changes.push({
          row: cell.row,
          col: cell.col,
          ref: cell.ref,
          before: cell.currentValue,
          after: cell.standardizedValue,
          changeType: 'standardized',
        });
      }
    }

    return changes;
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
  updateConfig(config: Partial<FormatConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
