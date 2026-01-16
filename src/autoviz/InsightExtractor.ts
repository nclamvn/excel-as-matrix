// =============================================================================
// INSIGHT EXTRACTOR — Extract insights from data for annotations
// =============================================================================

import type {
  DataRange,
  DataCharacteristics,
  ChartInsight,
  InsightType,
  Annotation,
} from './types';

/**
 * Extracts meaningful insights from data for chart annotations
 */
export class InsightExtractor {
  /**
   * Extract all insights from data
   */
  extract(
    data: DataRange,
    characteristics: DataCharacteristics
  ): ChartInsight[] {
    const insights: ChartInsight[] = [];

    // Extract insights for each numeric column
    for (const column of characteristics.columns) {
      if (column.dataType !== 'number') continue;

      const values = this.getNumericColumnValues(data, column.index);
      if (values.length < 2) continue;

      // Peak detection
      const peak = this.findPeak(values, column.name, data);
      if (peak) insights.push(peak);

      // Valley detection
      const valley = this.findValley(values, column.name, data);
      if (valley) insights.push(valley);

      // Trend detection
      const trend = this.detectTrend(values, column.name);
      if (trend) insights.push(trend);

      // Anomaly detection
      const anomalies = this.detectAnomalies(values, column.name, data);
      insights.push(...anomalies);
    }

    // Milestone detection (if time column exists)
    if (characteristics.hasTimeColumn) {
      const milestones = this.detectMilestones(data, characteristics);
      insights.push(...milestones);
    }

    // Correlation insights
    const correlations = this.extractCorrelationInsights(characteristics);
    insights.push(...correlations);

    // Seasonality detection
    const seasonality = this.detectSeasonality(data, characteristics);
    if (seasonality) insights.push(seasonality);

    // Sort by importance
    insights.sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });

    return insights;
  }

  /**
   * Get numeric values from a column
   */
  private getNumericColumnValues(
    data: DataRange,
    colIndex: number
  ): { value: number; rowIndex: number; label: string }[] {
    const values: { value: number; rowIndex: number; label: string }[] = [];

    for (let row = 0; row < data.rowCount; row++) {
      const rawValue = data.data[row]?.[colIndex];
      const value =
        typeof rawValue === 'number'
          ? rawValue
          : parseFloat(String(rawValue).replace(/[$€¥£,\s%]/g, ''));

      if (!isNaN(value)) {
        const label = String(data.data[row]?.[0] || row + 1);
        values.push({ value, rowIndex: row, label });
      }
    }

    return values;
  }

  /**
   * Find peak (maximum value)
   */
  private findPeak(
    values: { value: number; rowIndex: number; label: string }[],
    columnName: string,
    _data: DataRange
  ): ChartInsight | null {
    if (values.length === 0) return null;

    const max = values.reduce((prev, curr) =>
      curr.value > prev.value ? curr : prev
    );

    const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;
    const percentAboveMean = ((max.value - mean) / mean) * 100;

    // Only report if significantly above mean
    if (percentAboveMean < 20) return null;

    return {
      id: `peak-${columnName}-${max.rowIndex}`,
      type: 'peak',
      title: `Peak ${columnName}`,
      titleVi: `Đỉnh ${columnName}`,
      description: `Maximum value of ${max.value.toLocaleString()} at ${max.label} (${percentAboveMean.toFixed(1)}% above average)`,
      descriptionVi: `Giá trị cao nhất ${max.value.toLocaleString()} tại ${max.label} (cao hơn trung bình ${percentAboveMean.toFixed(1)}%)`,
      value: max.value,
      changePercent: percentAboveMean,
      dataPoint: { x: max.label, y: max.value },
      importance: percentAboveMean > 50 ? 'high' : 'medium',
      suggestedAnnotation: {
        id: `annotation-peak-${max.rowIndex}`,
        type: 'point',
        x: max.label,
        y: max.value,
        label: `Peak: ${max.value.toLocaleString()}`,
        color: '#22c55e',
      },
    };
  }

  /**
   * Find valley (minimum value)
   */
  private findValley(
    values: { value: number; rowIndex: number; label: string }[],
    columnName: string,
    _data: DataRange
  ): ChartInsight | null {
    if (values.length === 0) return null;

    const min = values.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;
    const percentBelowMean = ((mean - min.value) / mean) * 100;

    // Only report if significantly below mean
    if (percentBelowMean < 20) return null;

    return {
      id: `valley-${columnName}-${min.rowIndex}`,
      type: 'valley',
      title: `Valley ${columnName}`,
      titleVi: `Đáy ${columnName}`,
      description: `Minimum value of ${min.value.toLocaleString()} at ${min.label} (${percentBelowMean.toFixed(1)}% below average)`,
      descriptionVi: `Giá trị thấp nhất ${min.value.toLocaleString()} tại ${min.label} (thấp hơn trung bình ${percentBelowMean.toFixed(1)}%)`,
      value: min.value,
      changePercent: -percentBelowMean,
      dataPoint: { x: min.label, y: min.value },
      importance: percentBelowMean > 50 ? 'high' : 'medium',
      suggestedAnnotation: {
        id: `annotation-valley-${min.rowIndex}`,
        type: 'point',
        x: min.label,
        y: min.value,
        label: `Valley: ${min.value.toLocaleString()}`,
        color: '#ef4444',
      },
    };
  }

  /**
   * Detect trend in values
   */
  private detectTrend(
    values: { value: number; rowIndex: number; label: string }[],
    columnName: string
  ): ChartInsight | null {
    if (values.length < 4) return null;

    // Calculate linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i].value - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    const slope = numerator / denominator;
    const percentChange = ((slope * (n - 1)) / yMean) * 100;

    // Only report significant trends
    if (Math.abs(percentChange) < 10) return null;

    const direction = slope > 0 ? 'up' : 'down';
    const type: InsightType = direction === 'up' ? 'trend_up' : 'trend_down';

    return {
      id: `trend-${columnName}`,
      type,
      title: `${direction === 'up' ? 'Upward' : 'Downward'} Trend`,
      titleVi: `Xu hướng ${direction === 'up' ? 'tăng' : 'giảm'}`,
      description: `${columnName} shows ${Math.abs(percentChange).toFixed(1)}% ${direction === 'up' ? 'increase' : 'decrease'} over the period`,
      descriptionVi: `${columnName} ${direction === 'up' ? 'tăng' : 'giảm'} ${Math.abs(percentChange).toFixed(1)}% trong kỳ`,
      changePercent: percentChange,
      importance: Math.abs(percentChange) > 30 ? 'high' : 'medium',
      suggestedAnnotation: {
        id: `annotation-trend-${columnName}`,
        type: 'trend',
        x: values[0].label,
        y: values[0].value,
        x2: values[n - 1].label,
        y2: values[n - 1].value,
        label: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
        color: direction === 'up' ? '#22c55e' : '#ef4444',
      },
    };
  }

  /**
   * Detect anomalies using IQR method
   */
  private detectAnomalies(
    values: { value: number; rowIndex: number; label: string }[],
    columnName: string,
    _data: DataRange
  ): ChartInsight[] {
    if (values.length < 5) return [];

    const sorted = [...values].sort((a, b) => a.value - b.value);
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = sorted[q1Index].value;
    const q3 = sorted[q3Index].value;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies: ChartInsight[] = [];

    for (const item of values) {
      if (item.value < lowerBound || item.value > upperBound) {
        const mean = values.reduce((sum, v) => sum + v.value, 0) / values.length;
        const percentDiff = ((item.value - mean) / mean) * 100;

        anomalies.push({
          id: `anomaly-${columnName}-${item.rowIndex}`,
          type: 'anomaly',
          title: `Anomaly Detected`,
          titleVi: `Phát hiện bất thường`,
          description: `Unusual value ${item.value.toLocaleString()} at ${item.label} (${Math.abs(percentDiff).toFixed(1)}% ${percentDiff > 0 ? 'above' : 'below'} average)`,
          descriptionVi: `Giá trị bất thường ${item.value.toLocaleString()} tại ${item.label} (${percentDiff > 0 ? 'cao hơn' : 'thấp hơn'} trung bình ${Math.abs(percentDiff).toFixed(1)}%)`,
          value: item.value,
          changePercent: percentDiff,
          dataPoint: { x: item.label, y: item.value },
          importance: Math.abs(percentDiff) > 100 ? 'high' : 'medium',
          suggestedAnnotation: {
            id: `annotation-anomaly-${item.rowIndex}`,
            type: 'point',
            x: item.label,
            y: item.value,
            label: 'Anomaly',
            color: '#f59e0b',
            backgroundColor: '#fef3c7',
          },
        });
      }
    }

    return anomalies.slice(0, 3); // Limit to top 3 anomalies
  }

  /**
   * Detect milestones (significant thresholds crossed)
   */
  private detectMilestones(
    data: DataRange,
    characteristics: DataCharacteristics
  ): ChartInsight[] {
    const milestones: ChartInsight[] = [];
    const thresholds = [100, 500, 1000, 5000, 10000, 50000, 100000, 1000000];

    for (const column of characteristics.columns) {
      if (column.dataType !== 'number') continue;

      const values = this.getNumericColumnValues(data, column.index);
      if (values.length < 2) continue;

      // Check if any threshold was crossed
      for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1].value;
        const curr = values[i].value;

        for (const threshold of thresholds) {
          if (prev < threshold && curr >= threshold) {
            milestones.push({
              id: `milestone-${column.name}-${threshold}`,
              type: 'milestone',
              title: `Milestone Reached`,
              titleVi: `Đạt mốc quan trọng`,
              description: `${column.name} crossed ${threshold.toLocaleString()} at ${values[i].label}`,
              descriptionVi: `${column.name} vượt mốc ${threshold.toLocaleString()} tại ${values[i].label}`,
              value: threshold,
              dataPoint: { x: values[i].label, y: curr },
              importance: threshold >= 10000 ? 'high' : 'medium',
              suggestedAnnotation: {
                id: `annotation-milestone-${threshold}`,
                type: 'line',
                y: threshold,
                label: threshold.toLocaleString(),
                color: '#8b5cf6',
              },
            });
            break; // Only one milestone per threshold
          }
        }
      }
    }

    return milestones.slice(0, 2); // Limit milestones
  }

  /**
   * Extract correlation insights
   */
  private extractCorrelationInsights(
    characteristics: DataCharacteristics
  ): ChartInsight[] {
    const insights: ChartInsight[] = [];

    const correlationPatterns = characteristics.patterns.filter(
      (p) => p.type === 'correlation' && p.confidence > 0.7
    );

    for (const pattern of correlationPatterns) {
      const isPositive = pattern.description.includes('positive');

      insights.push({
        id: `correlation-${pattern.columns.join('-')}`,
        type: 'correlation',
        title: `${isPositive ? 'Positive' : 'Negative'} Correlation`,
        titleVi: `Tương quan ${isPositive ? 'thuận' : 'nghịch'}`,
        description: pattern.description,
        descriptionVi: isPositive
          ? 'Hai biến tăng/giảm cùng nhau'
          : 'Khi một biến tăng, biến kia giảm',
        importance: pattern.confidence > 0.85 ? 'high' : 'medium',
      });
    }

    return insights;
  }

  /**
   * Detect seasonality patterns
   */
  private detectSeasonality(
    data: DataRange,
    characteristics: DataCharacteristics
  ): ChartInsight | null {
    if (!characteristics.hasTimeColumn || data.rowCount < 12) return null;

    // Simple seasonality detection: check if values repeat patterns
    const numericCol = characteristics.columns.find(
      (c) => c.dataType === 'number'
    );
    if (!numericCol) return null;

    const values = this.getNumericColumnValues(data, numericCol.index);
    if (values.length < 12) return null;

    // Check for monthly/quarterly patterns (simplified)
    const periodicPatterns = [4, 7, 12]; // Quarterly, weekly, monthly
    for (const period of periodicPatterns) {
      if (values.length >= period * 2) {
        const correlation = this.calculatePeriodicCorrelation(values, period);
        if (correlation > 0.6) {
          const periodName =
            period === 4
              ? 'quarterly'
              : period === 7
                ? 'weekly'
                : period === 12
                  ? 'monthly'
                  : `${period}-period`;

          return {
            id: `seasonality-${period}`,
            type: 'seasonality',
            title: `${periodName.charAt(0).toUpperCase() + periodName.slice(1)} Pattern`,
            titleVi: `Mẫu ${period === 4 ? 'theo quý' : period === 7 ? 'theo tuần' : period === 12 ? 'theo tháng' : `${period} kỳ`}`,
            description: `Data shows ${periodName} seasonal patterns with ${(correlation * 100).toFixed(0)}% correlation`,
            descriptionVi: `Dữ liệu cho thấy mẫu theo mùa ${period === 4 ? 'quý' : period === 7 ? 'tuần' : period === 12 ? 'tháng' : `${period} kỳ`} với độ tương quan ${(correlation * 100).toFixed(0)}%`,
            importance: correlation > 0.8 ? 'high' : 'medium',
          };
        }
      }
    }

    return null;
  }

  /**
   * Calculate correlation between values and their lagged counterparts
   */
  private calculatePeriodicCorrelation(
    values: { value: number }[],
    period: number
  ): number {
    if (values.length < period * 2) return 0;

    const pairs: { x: number; y: number }[] = [];
    for (let i = period; i < values.length; i++) {
      pairs.push({
        x: values[i - period].value,
        y: values[i].value,
      });
    }

    if (pairs.length < 3) return 0;

    // Pearson correlation
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
   * Get top insights for display
   */
  getTopInsights(insights: ChartInsight[], limit: number = 3): ChartInsight[] {
    return insights.slice(0, limit);
  }

  /**
   * Get annotations from insights
   */
  getAnnotations(insights: ChartInsight[]): Annotation[] {
    return insights
      .filter((i) => i.suggestedAnnotation)
      .map((i) => i.suggestedAnnotation!);
  }

  /**
   * Generate summary text from insights
   */
  generateSummary(insights: ChartInsight[], language: 'en' | 'vi' = 'en'): string {
    if (insights.length === 0) {
      return language === 'en'
        ? 'No significant insights detected.'
        : 'Không phát hiện thông tin đáng chú ý.';
    }

    const highPriority = insights.filter((i) => i.importance === 'high');

    if (language === 'vi') {
      if (highPriority.length > 0) {
        return `Phát hiện ${highPriority.length} điểm quan trọng: ${highPriority.map((i) => i.titleVi).join(', ')}.`;
      }
      return `Phát hiện ${insights.length} thông tin từ dữ liệu.`;
    }

    if (highPriority.length > 0) {
      return `Found ${highPriority.length} important insights: ${highPriority.map((i) => i.title).join(', ')}.`;
    }
    return `Extracted ${insights.length} insights from your data.`;
  }
}
