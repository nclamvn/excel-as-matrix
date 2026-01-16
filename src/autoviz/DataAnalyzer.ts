// =============================================================================
// DATA ANALYZER — Analyze data characteristics for chart recommendations
// =============================================================================

import type {
  DataRange,
  DataCharacteristics,
  ColumnAnalysis,
  ColumnRole,
  DataPattern,
} from './types';

/**
 * Analyzes data to determine its characteristics for visualization
 */
export class DataAnalyzer {
  /**
   * Analyze data range and return characteristics
   */
  analyze(data: DataRange): DataCharacteristics {
    const columns = this.analyzeColumns(data);
    const patterns = this.detectPatterns(data, columns);

    return {
      rowCount: data.rowCount,
      columnCount: data.colCount,
      columns,
      hasTimeColumn: columns.some((c) => c.dataType === 'date'),
      hasCategoryColumn: columns.some((c) => c.suggestedRole === 'category'),
      hasMultipleSeries: this.detectMultipleSeries(columns),
      patterns,
    };
  }

  /**
   * Analyze individual columns
   */
  private analyzeColumns(data: DataRange): ColumnAnalysis[] {
    const columns: ColumnAnalysis[] = [];

    for (let col = 0; col < data.colCount; col++) {
      const header = data.headers[col] || `Column ${col + 1}`;
      const values = this.getColumnValues(data, col);
      const dataType = this.detectDataType(values);
      const stats = this.calculateStats(values, dataType);

      columns.push({
        index: col,
        name: header,
        dataType,
        ...stats,
        suggestedRole: this.suggestRole(header, dataType, col, data.colCount),
      });
    }

    return columns;
  }

  /**
   * Get all values from a column
   */
  private getColumnValues(data: DataRange, col: number): unknown[] {
    const values: unknown[] = [];
    for (let row = 0; row < data.rowCount; row++) {
      const value = data.data[row]?.[col];
      if (value !== null && value !== undefined && value !== '') {
        values.push(value);
      }
    }
    return values;
  }

  /**
   * Detect data type of a column
   */
  private detectDataType(
    values: unknown[]
  ): 'number' | 'text' | 'date' | 'boolean' | 'mixed' {
    if (values.length === 0) return 'text';

    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let textCount = 0;

    for (const value of values) {
      if (typeof value === 'boolean') {
        booleanCount++;
      } else if (typeof value === 'number' && !isNaN(value)) {
        numberCount++;
      } else if (this.isDateLike(value)) {
        dateCount++;
      } else if (this.isNumericString(String(value))) {
        numberCount++;
      } else {
        textCount++;
      }
    }

    const total = values.length;
    const threshold = 0.8;

    if (numberCount / total >= threshold) return 'number';
    if (dateCount / total >= threshold) return 'date';
    if (booleanCount / total >= threshold) return 'boolean';
    if (textCount / total >= threshold) return 'text';

    return 'mixed';
  }

  /**
   * Check if value looks like a date
   */
  private isDateLike(value: unknown): boolean {
    if (value instanceof Date) return true;

    const str = String(value);

    // Check common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{2,4}$/, // D-M-YY
      /^\d{1,2}\.\d{1,2}\.\d{2,4}$/, // D.M.YYYY
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // Month names
    ];

    return datePatterns.some((pattern) => pattern.test(str));
  }

  /**
   * Check if string is numeric
   */
  private isNumericString(value: string): boolean {
    // Remove currency symbols, commas, percent signs
    const cleaned = value.replace(/[$€¥£,\s%]/g, '');
    return !isNaN(parseFloat(cleaned)) && isFinite(Number(cleaned));
  }

  /**
   * Calculate statistics for a column
   */
  private calculateStats(
    values: unknown[],
    dataType: string
  ): Partial<ColumnAnalysis> {
    const stats: Partial<ColumnAnalysis> = {
      uniqueValues: new Set(values.map(String)).size,
      nullCount: 0,
    };

    if (dataType === 'number') {
      const numbers = values
        .map((v) => {
          if (typeof v === 'number') return v;
          const cleaned = String(v).replace(/[$€¥£,\s%]/g, '');
          return parseFloat(cleaned);
        })
        .filter((n) => !isNaN(n));

      if (numbers.length > 0) {
        stats.min = Math.min(...numbers);
        stats.max = Math.max(...numbers);
        stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;

        const squaredDiffs = numbers.map((n) =>
          Math.pow(n - stats.mean!, 2)
        );
        stats.stdDev = Math.sqrt(
          squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
        );
      }
    }

    return stats;
  }

  /**
   * Suggest a role for the column in visualization
   */
  private suggestRole(
    header: string,
    dataType: string,
    colIndex: number,
    totalCols: number
  ): ColumnRole {
    const headerLower = header.toLowerCase();

    // Check for time-related headers
    const timeKeywords = [
      'date',
      'time',
      'year',
      'month',
      'day',
      'week',
      'quarter',
      'period',
      'ngày',
      'tháng',
      'năm',
    ];
    if (timeKeywords.some((k) => headerLower.includes(k)) || dataType === 'date') {
      return 'time';
    }

    // Check for category headers
    const categoryKeywords = [
      'category',
      'type',
      'name',
      'group',
      'region',
      'country',
      'city',
      'product',
      'loại',
      'tên',
      'nhóm',
      'vùng',
    ];
    if (
      categoryKeywords.some((k) => headerLower.includes(k)) ||
      (dataType === 'text' && colIndex === 0)
    ) {
      return 'category';
    }

    // Check for size/bubble size columns
    const sizeKeywords = ['size', 'count', 'quantity', 'amount', 'số lượng'];
    if (sizeKeywords.some((k) => headerLower.includes(k))) {
      return 'size';
    }

    // Check for label columns
    const labelKeywords = ['label', 'description', 'note', 'comment', 'ghi chú'];
    if (labelKeywords.some((k) => headerLower.includes(k))) {
      return 'label';
    }

    // First column with text is usually category, rest are values
    if (colIndex === 0 && dataType === 'text') {
      return 'category';
    }

    // Numeric columns are usually values
    if (dataType === 'number') {
      return 'value';
    }

    // Default based on position
    return colIndex < totalCols / 2 ? 'category' : 'value';
  }

  /**
   * Detect if data has multiple series
   */
  private detectMultipleSeries(columns: ColumnAnalysis[]): boolean {
    const valueColumns = columns.filter((c) => c.suggestedRole === 'value');
    return valueColumns.length > 1;
  }

  /**
   * Detect patterns in data
   */
  private detectPatterns(
    data: DataRange,
    columns: ColumnAnalysis[]
  ): DataPattern[] {
    const patterns: DataPattern[] = [];

    // Detect trend in numeric columns
    for (const col of columns) {
      if (col.dataType === 'number') {
        const values = this.getNumericValues(data, col.index);
        const trend = this.detectTrend(values);

        if (trend) {
          patterns.push({
            type: 'trend',
            description: trend.direction === 'up' ? 'Upward trend' : 'Downward trend',
            confidence: trend.confidence,
            columns: [col.index],
          });
        }

        // Detect outliers
        if (col.stdDev && col.mean) {
          const outliers = this.detectOutliers(values, col.mean, col.stdDev);
          if (outliers.length > 0) {
            patterns.push({
              type: 'outlier',
              description: `${outliers.length} outlier(s) detected`,
              confidence: 0.9,
              columns: [col.index],
            });
          }
        }
      }
    }

    // Detect correlation between numeric columns
    const numericCols = columns.filter((c) => c.dataType === 'number');
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const correlation = this.calculateCorrelation(
          data,
          numericCols[i].index,
          numericCols[j].index
        );

        if (Math.abs(correlation) > 0.7) {
          patterns.push({
            type: 'correlation',
            description:
              correlation > 0
                ? `Strong positive correlation between ${numericCols[i].name} and ${numericCols[j].name}`
                : `Strong negative correlation between ${numericCols[i].name} and ${numericCols[j].name}`,
            confidence: Math.abs(correlation),
            columns: [numericCols[i].index, numericCols[j].index],
          });
        }
      }
    }

    // Detect distribution type
    for (const col of numericCols) {
      const values = this.getNumericValues(data, col.index);
      const distribution = this.analyzeDistribution(values);

      if (distribution) {
        patterns.push({
          type: 'distribution',
          description: distribution,
          confidence: 0.7,
          columns: [col.index],
        });
      }
    }

    return patterns;
  }

  /**
   * Get numeric values from column
   */
  private getNumericValues(data: DataRange, col: number): number[] {
    const values: number[] = [];
    for (let row = 0; row < data.rowCount; row++) {
      const value = data.data[row]?.[col];
      if (typeof value === 'number') {
        values.push(value);
      } else if (value !== null && value !== undefined) {
        const num = parseFloat(String(value).replace(/[$€¥£,\s%]/g, ''));
        if (!isNaN(num)) {
          values.push(num);
        }
      }
    }
    return values;
  }

  /**
   * Detect trend in values
   */
  private detectTrend(
    values: number[]
  ): { direction: 'up' | 'down'; confidence: number } | null {
    if (values.length < 3) return null;

    // Simple linear regression
    const n = values.length;
    const xSum = (n * (n - 1)) / 2;
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, i) => sum + i * y, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);

    // Calculate R-squared
    const yMean = ySum / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = yMean + slope * (i - (n - 1) / 2);
      return sum + Math.pow(y - predicted, 2);
    }, 0);

    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    if (rSquared < 0.3) return null;

    return {
      direction: slope > 0 ? 'up' : 'down',
      confidence: rSquared,
    };
  }

  /**
   * Detect outliers using IQR method
   */
  private detectOutliers(
    values: number[],
    mean: number,
    stdDev: number
  ): number[] {
    const threshold = 2.5; // 2.5 standard deviations
    return values.filter((v) => Math.abs(v - mean) > threshold * stdDev);
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(
    data: DataRange,
    col1: number,
    col2: number
  ): number {
    const pairs: { x: number; y: number }[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      const v1 = data.data[row]?.[col1];
      const v2 = data.data[row]?.[col2];

      if (v1 !== null && v2 !== null) {
        const n1 =
          typeof v1 === 'number'
            ? v1
            : parseFloat(String(v1).replace(/[$€¥£,\s%]/g, ''));
        const n2 =
          typeof v2 === 'number'
            ? v2
            : parseFloat(String(v2).replace(/[$€¥£,\s%]/g, ''));

        if (!isNaN(n1) && !isNaN(n2)) {
          pairs.push({ x: n1, y: n2 });
        }
      }
    }

    if (pairs.length < 3) return 0;

    const n = pairs.length;
    const sumX = pairs.reduce((s, p) => s + p.x, 0);
    const sumY = pairs.reduce((s, p) => s + p.y, 0);
    const sumXY = pairs.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = pairs.reduce((s, p) => s + p.x * p.x, 0);
    const sumY2 = pairs.reduce((s, p) => s + p.y * p.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Analyze distribution type
   */
  private analyzeDistribution(values: number[]): string | null {
    if (values.length < 10) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    // Median calculated for potential future use
    void sorted[Math.floor(n / 2)];

    // Calculate skewness
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const skewness =
      values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) / n;

    if (Math.abs(skewness) < 0.5) {
      return 'Normal distribution (symmetric)';
    } else if (skewness > 0.5) {
      return 'Right-skewed distribution (positive skew)';
    } else {
      return 'Left-skewed distribution (negative skew)';
    }
  }

  /**
   * Get summary statistics for display
   */
  getSummary(characteristics: DataCharacteristics): string {
    const parts: string[] = [];

    parts.push(`${characteristics.rowCount} rows × ${characteristics.columnCount} columns`);

    if (characteristics.hasTimeColumn) {
      parts.push('time series data');
    }

    if (characteristics.hasMultipleSeries) {
      parts.push('multiple metrics');
    }

    if (characteristics.hasCategoryColumn) {
      parts.push('categorical data');
    }

    const trendPatterns = characteristics.patterns.filter((p) => p.type === 'trend');
    if (trendPatterns.length > 0) {
      parts.push(`${trendPatterns.length} trend(s) detected`);
    }

    return parts.join(', ');
  }
}
