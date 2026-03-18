// =============================================================================
// CONTEXT ANALYZER — Understand spreadsheet context
// =============================================================================

import type { CellContext, ColumnHeader, DataRange } from './types';

/**
 * Analyze spreadsheet context for better formula interpretation
 */
export class ContextAnalyzer {
  /**
   * Analyze and enrich cell context
   */
  async analyze(context: CellContext): Promise<CellContext> {
    return {
      ...context,
      headers: this.enrichHeaders(context.headers),
      dataRange: this.analyzeDataRange(context.dataRange, context.headers),
    };
  }

  /**
   * Enrich headers with additional metadata
   */
  private enrichHeaders(headers: ColumnHeader[]): ColumnHeader[] {
    if (!headers || !Array.isArray(headers)) return [];
    return headers.map((header) => ({
      ...header,
      dataType: header.dataType || this.inferDataType(header.sampleValues),
    }));
  }

  /**
   * Infer data type from sample values
   */
  private inferDataType(
    samples: unknown[]
  ): 'number' | 'text' | 'date' | 'currency' | 'mixed' {
    if (!samples || !Array.isArray(samples) || samples.length === 0) return 'text';

    const types = samples.map((v) => this.detectValueType(v));
    const uniqueTypes = [...new Set(types)];

    if (uniqueTypes.length > 1) return 'mixed';
    return uniqueTypes[0] || 'text';
  }

  /**
   * Detect single value type
   */
  private detectValueType(
    value: unknown
  ): 'number' | 'text' | 'date' | 'currency' {
    if (value === null || value === undefined) return 'text';

    if (typeof value === 'number') {
      return 'number';
    }

    if (value instanceof Date) {
      return 'date';
    }

    if (typeof value === 'string') {
      // Check for currency
      if (/^\$[\d,]+\.?\d*$/.test(value) || /^[\d,]+\.?\d*\s*(?:đ|VND|USD)$/i.test(value)) {
        return 'currency';
      }

      // Check for number
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return 'number';
      }

      // Check for date
      if (!isNaN(Date.parse(value))) {
        return 'date';
      }
    }

    return 'text';
  }

  /**
   * Analyze data range
   */
  private analyzeDataRange(
    range: DataRange,
    headers: ColumnHeader[]
  ): DataRange {
    const defaultRange: DataRange = {
      startRow: 0,
      endRow: 100,
      startCol: 0,
      endCol: 256,
      hasHeaders: true,
      rowCount: 100,
      colCount: 256,
    };

    if (!range) return defaultRange;

    const headersLength = headers && Array.isArray(headers) ? headers.length : 0;
    return {
      ...range,
      hasHeaders: headersLength > 0 && range.startRow === 0,
    };
  }

  /**
   * Find column by name or letter
   */
  findColumn(
    identifier: string,
    headers: ColumnHeader[]
  ): ColumnHeader | undefined {
    if (!headers || !Array.isArray(headers) || !identifier) return undefined;

    // Check by letter
    const byLetter = headers.find(
      (h) => h.colLetter?.toUpperCase() === identifier.toUpperCase()
    );
    if (byLetter) return byLetter;

    // Check by name (case-insensitive)
    const byName = headers.find(
      (h) => h.name?.toLowerCase() === identifier.toLowerCase()
    );
    if (byName) return byName;

    // Check by partial name match
    const byPartial = headers.find((h) =>
      h.name?.toLowerCase().includes(identifier.toLowerCase())
    );
    return byPartial;
  }

  /**
   * Suggest columns based on input
   */
  suggestColumns(input: string, headers: ColumnHeader[]): ColumnHeader[] {
    if (!headers || !Array.isArray(headers) || !input) return [];

    const lower = input.toLowerCase();

    return headers
      .filter(
        (h) =>
          h.name?.toLowerCase().includes(lower) ||
          h.colLetter?.toLowerCase().includes(lower)
      )
      .sort((a, b) => {
        // Exact match first
        if (a.name?.toLowerCase() === lower) return -1;
        if (b.name?.toLowerCase() === lower) return 1;
        // Then by position
        return (a.col || 0) - (b.col || 0);
      });
  }

  /**
   * Get numeric columns
   */
  getNumericColumns(headers: ColumnHeader[]): ColumnHeader[] {
    if (!headers || !Array.isArray(headers)) return [];
    return headers.filter(
      (h) => h.dataType === 'number' || h.dataType === 'currency'
    );
  }

  /**
   * Get text columns
   */
  getTextColumns(headers: ColumnHeader[]): ColumnHeader[] {
    if (!headers || !Array.isArray(headers)) return [];
    return headers.filter((h) => h.dataType === 'text');
  }

  /**
   * Get date columns
   */
  getDateColumns(headers: ColumnHeader[]): ColumnHeader[] {
    if (!headers || !Array.isArray(headers)) return [];
    return headers.filter((h) => h.dataType === 'date');
  }

  /**
   * Convert column number to letter
   */
  colToLetter(col: number): string {
    let result = '';
    let c = col + 1;
    while (c > 0) {
      c--;
      result = String.fromCharCode(65 + (c % 26)) + result;
      c = Math.floor(c / 26);
    }
    return result;
  }

  /**
   * Convert column letter to number
   */
  letterToCol(letter: string): number {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col - 1;
  }
}
