// =============================================================================
// INSIGHT DETECTOR — Detect trends, correlations, and anomalies
// =============================================================================

import type {
  SheetData,
  DataInsight,
  InsightMetric,
  TrendInfo,
  CorrelationInfo,
  ScanConfig,
} from './types';

/**
 * Detects insights from spreadsheet data
 */
export class InsightDetector {
  private config: ScanConfig;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * Detect all insights from sheet data
   */
  async detect(data: SheetData): Promise<DataInsight[]> {
    const insights: DataInsight[] = [];

    // Detect different insight types
    insights.push(...this.detectTrends(data));
    insights.push(...this.detectCorrelations(data));
    insights.push(...this.detectAnomalies(data));
    insights.push(...this.detectMilestones(data));
    insights.push(...this.detectDistributions(data));
    insights.push(...this.generateSummaries(data));

    return insights;
  }

  /**
   * Detect trends in numeric columns
   */
  private detectTrends(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];

    for (const header of data.headers) {
      if (header.type !== 'number') continue;

      const values: number[] = [];
      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'number' && typeof cell.value === 'number') {
          values.push(cell.value);
        }
      }

      if (values.length < 5) continue;

      const trend = this.analyzeTrend(values);
      if (trend.r2 < 0.5) continue; // Not a strong trend

      const changePercent = ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100;

      const isSignificant = Math.abs(changePercent) > 10 && trend.r2 > 0.7;
      if (!isSignificant) continue;

      const direction = trend.direction === 'increasing' ? 'up' : 'down';
      const trendWord = trend.direction === 'increasing' ? 'increasing' : 'decreasing';

      insights.push({
        id: `trend-${header.letter}`,
        type: 'insight',
        insightType: 'trend',
        priority: Math.abs(changePercent) > 50 ? 'high' : 'medium',
        status: 'pending',

        title: `${header.name} is ${trendWord}`,
        description: `${header.name} shows ${trend.direction === 'stable' ? 'stable' : `strong ${trend.direction}`} trend (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% over period)`,

        sheetId: data.sheetId,
        affectedCells: [],
        affectedRange: `${header.letter}2:${header.letter}${data.rowCount}`,

        confidence: trend.r2,
        impact: {
          cellCount: values.length,
          severity: Math.abs(changePercent) > 50 ? 'high' : 'medium',
          description: `Strong ${trendWord} pattern detected`,
        },

        actions: [
          {
            id: 'create-chart',
            label: 'Create chart',
            type: 'primary',
            action: 'create_chart',
            params: { type: 'line', column: header.letter },
          },
          {
            id: 'deep-analysis',
            label: 'Deep analysis',
            type: 'secondary',
            action: 'deep_analysis',
          },
        ],

        detectedAt: Date.now(),
        category: 'trends',
        tags: ['trend', direction, header.name.toLowerCase()],

        metric: {
          name: header.name,
          value: values[values.length - 1],
          change: values[values.length - 1] - values[0],
          changePercent,
          trend: trend.direction === 'stable' ? 'stable' : direction,
          period: `${values.length} data points`,
        },

        visualization: {
          chartType: 'line',
          dataRange: `${header.letter}1:${header.letter}${data.rowCount}`,
          title: `${header.name} Trend`,
        },
      });
    }

    return insights;
  }

  /**
   * Detect correlations between numeric columns
   */
  private detectCorrelations(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];
    const numericHeaders = data.headers.filter(h => h.type === 'number');

    for (let i = 0; i < numericHeaders.length; i++) {
      for (let j = i + 1; j < numericHeaders.length; j++) {
        const header1 = numericHeaders[i];
        const header2 = numericHeaders[j];

        const values1: number[] = [];
        const values2: number[] = [];

        for (let row = 1; row < data.rowCount; row++) {
          const cell1 = data.cells[row]?.[header1.index];
          const cell2 = data.cells[row]?.[header2.index];

          if (cell1?.type === 'number' && cell2?.type === 'number' &&
              typeof cell1.value === 'number' && typeof cell2.value === 'number') {
            values1.push(cell1.value);
            values2.push(cell2.value);
          }
        }

        if (values1.length < 10) continue;

        const correlation = this.calculateCorrelation(values1, values2);
        if (Math.abs(correlation.coefficient) < this.config.correlationThreshold) continue;

        const corrInfo: CorrelationInfo = {
          column1: header1.name,
          column2: header2.name,
          coefficient: correlation.coefficient,
          strength: Math.abs(correlation.coefficient) > 0.9 ? 'strong' :
                    Math.abs(correlation.coefficient) > 0.7 ? 'moderate' : 'weak',
          type: correlation.coefficient > 0 ? 'positive' : 'negative',
        };

        insights.push({
          id: `corr-${header1.letter}-${header2.letter}`,
          type: 'insight',
          insightType: 'correlation',
          priority: corrInfo.strength === 'strong' ? 'high' : 'medium',
          status: 'pending',

          title: `${header1.name} and ${header2.name} are ${corrInfo.type}ly correlated`,
          description: `${corrInfo.strength.charAt(0).toUpperCase() + corrInfo.strength.slice(1)} ${corrInfo.type} correlation (r=${corrInfo.coefficient.toFixed(2)})`,

          sheetId: data.sheetId,
          affectedCells: [],

          confidence: Math.abs(corrInfo.coefficient),
          impact: {
            cellCount: values1.length * 2,
            severity: corrInfo.strength === 'strong' ? 'high' : 'medium',
            description: 'Variables may be related',
          },

          actions: [
            {
              id: 'scatter-chart',
              label: 'Create scatter plot',
              type: 'primary',
              action: 'create_chart',
              params: { type: 'scatter', columns: [header1.letter, header2.letter] },
            },
            {
              id: 'analyze',
              label: 'Analyze relationship',
              type: 'secondary',
              action: 'deep_analysis',
            },
          ],

          detectedAt: Date.now(),
          category: 'correlations',
          tags: ['correlation', corrInfo.strength, corrInfo.type],

          visualization: {
            chartType: 'scatter',
            dataRange: `${header1.letter}:${header1.letter},${header2.letter}:${header2.letter}`,
            title: `${header1.name} vs ${header2.name}`,
          },
        });
      }
    }

    return insights;
  }

  /**
   * Detect anomalies in data
   */
  private detectAnomalies(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];

    for (const header of data.headers) {
      if (header.type !== 'number') continue;

      const values: { value: number; row: number }[] = [];
      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'number' && typeof cell.value === 'number') {
          values.push({ value: cell.value, row });
        }
      }

      if (values.length < 10) continue;

      // Check for sudden changes
      const changes: { row: number; change: number; percent: number }[] = [];
      for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1].value;
        const curr = values[i].value;
        if (prev !== 0) {
          const change = curr - prev;
          const percent = (change / Math.abs(prev)) * 100;
          if (Math.abs(percent) > 50) {
            changes.push({ row: values[i].row, change, percent });
          }
        }
      }

      if (changes.length > 0 && changes.length < values.length * 0.1) {
        const topChange = changes.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))[0];

        insights.push({
          id: `anomaly-${header.letter}-${topChange.row}`,
          type: 'insight',
          insightType: 'anomaly',
          priority: 'high',
          status: 'pending',

          title: `Unusual change in ${header.name}`,
          description: `${topChange.percent > 0 ? '+' : ''}${topChange.percent.toFixed(1)}% change at row ${topChange.row + 1}`,

          sheetId: data.sheetId,
          affectedCells: [`${header.letter}${topChange.row + 1}`],

          confidence: 0.8,
          impact: {
            cellCount: 1,
            severity: 'high',
            description: 'Sudden change may indicate an issue or event',
          },

          actions: [
            {
              id: 'investigate',
              label: 'Investigate',
              type: 'primary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'anomalies',
          tags: ['anomaly', 'sudden-change'],

          metric: {
            name: header.name,
            value: data.cells[topChange.row]?.[header.index]?.value as number,
            change: topChange.change,
            changePercent: topChange.percent,
          },
        });
      }
    }

    return insights;
  }

  /**
   * Detect milestones (e.g., new highs, lows, round numbers)
   */
  private detectMilestones(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];

    for (const header of data.headers) {
      if (header.type !== 'number') continue;

      const values: number[] = [];
      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'number' && typeof cell.value === 'number') {
          values.push(cell.value);
        }
      }

      if (values.length < 5) continue;

      const lastValue = values[values.length - 1];
      const max = Math.max(...values.slice(0, -1));
      const min = Math.min(...values.slice(0, -1));

      // Check for new high
      if (lastValue > max && values.length > 10) {
        insights.push({
          id: `milestone-high-${header.letter}`,
          type: 'insight',
          insightType: 'milestone',
          priority: 'medium',
          status: 'pending',

          title: `New high for ${header.name}`,
          description: `${header.name} reached ${lastValue.toLocaleString()}, exceeding previous high of ${max.toLocaleString()}`,

          sheetId: data.sheetId,
          affectedCells: [`${header.letter}${data.rowCount}`],

          confidence: 1.0,
          impact: {
            cellCount: 1,
            severity: 'medium',
            description: 'All-time high reached',
          },

          actions: [
            {
              id: 'chart',
              label: 'View chart',
              type: 'primary',
              action: 'create_chart',
              params: { type: 'line', column: header.letter },
            },
          ],

          detectedAt: Date.now(),
          category: 'milestones',
          tags: ['milestone', 'new-high'],

          metric: {
            name: header.name,
            value: lastValue,
            change: lastValue - max,
            changePercent: ((lastValue - max) / max) * 100,
            trend: 'up',
          },
        });
      }

      // Check for new low
      if (lastValue < min && values.length > 10 && min > 0) {
        insights.push({
          id: `milestone-low-${header.letter}`,
          type: 'insight',
          insightType: 'milestone',
          priority: 'high',
          status: 'pending',

          title: `New low for ${header.name}`,
          description: `${header.name} dropped to ${lastValue.toLocaleString()}, below previous low of ${min.toLocaleString()}`,

          sheetId: data.sheetId,
          affectedCells: [`${header.letter}${data.rowCount}`],

          confidence: 1.0,
          impact: {
            cellCount: 1,
            severity: 'high',
            description: 'All-time low reached',
          },

          actions: [
            {
              id: 'chart',
              label: 'View chart',
              type: 'primary',
              action: 'create_chart',
              params: { type: 'line', column: header.letter },
            },
          ],

          detectedAt: Date.now(),
          category: 'milestones',
          tags: ['milestone', 'new-low'],

          metric: {
            name: header.name,
            value: lastValue,
            change: lastValue - min,
            changePercent: ((lastValue - min) / min) * 100,
            trend: 'down',
          },
        });
      }
    }

    return insights;
  }

  /**
   * Detect interesting distributions
   */
  private detectDistributions(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];

    for (const header of data.headers) {
      if (header.type !== 'number') continue;

      const values: number[] = [];
      for (let row = 1; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[header.index];
        if (cell && cell.type === 'number' && typeof cell.value === 'number') {
          values.push(cell.value);
        }
      }

      if (values.length < 20) continue;

      const stats = this.calculateStats(values);

      // Check for highly skewed distribution
      if (Math.abs(stats.skewness) > 1) {
        const skewDir = stats.skewness > 0 ? 'right' : 'left';

        insights.push({
          id: `dist-skew-${header.letter}`,
          type: 'insight',
          insightType: 'distribution',
          priority: 'low',
          status: 'pending',

          title: `${header.name} is ${skewDir}-skewed`,
          description: `The distribution of ${header.name} is heavily ${skewDir}-skewed (skewness: ${stats.skewness.toFixed(2)})`,

          sheetId: data.sheetId,
          affectedCells: [],

          confidence: 0.8,
          impact: {
            cellCount: values.length,
            severity: 'low',
            description: 'May affect statistical calculations',
          },

          actions: [
            {
              id: 'histogram',
              label: 'View distribution',
              type: 'primary',
              action: 'create_chart',
              params: { type: 'bar', column: header.letter },
            },
          ],

          detectedAt: Date.now(),
          category: 'distributions',
          tags: ['distribution', 'skewed'],

          visualization: {
            chartType: 'bar',
            dataRange: `${header.letter}:${header.letter}`,
            title: `${header.name} Distribution`,
          },
        });
      }
    }

    return insights;
  }

  /**
   * Generate data summaries
   */
  private generateSummaries(data: SheetData): DataInsight[] {
    const insights: DataInsight[] = [];

    // Overall data summary
    const numericColumns = data.headers.filter(h => h.type === 'number');
    if (numericColumns.length > 0) {
      const summaryMetrics: InsightMetric[] = numericColumns.slice(0, 3).map(h => {
        const values: number[] = [];
        for (let row = 1; row < data.rowCount; row++) {
          const cell = data.cells[row]?.[h.index];
          if (cell?.type === 'number' && typeof cell.value === 'number') {
            values.push(cell.value);
          }
        }
        const sum = values.reduce((a, b) => a + b, 0);
        return {
          name: h.name,
          value: sum,
        };
      });

      insights.push({
        id: 'summary-totals',
        type: 'insight',
        insightType: 'summary',
        priority: 'low',
        status: 'pending',

        title: 'Data Summary',
        description: `${data.rowCount - 1} rows of data with ${numericColumns.length} numeric columns`,

        sheetId: data.sheetId,
        affectedCells: [],

        confidence: 1.0,
        impact: {
          cellCount: data.rowCount * data.colCount,
          severity: 'low',
          description: 'Overview of your data',
        },

        actions: [
          {
            id: 'detailed-summary',
            label: 'Detailed summary',
            type: 'primary',
            action: 'deep_analysis',
          },
        ],

        detectedAt: Date.now(),
        category: 'summary',
        tags: ['summary', 'overview'],

        metric: summaryMetrics[0],
      });
    }

    return insights;
  }

  // ==========================================================================
  // STATISTICAL HELPERS
  // ==========================================================================

  private analyzeTrend(values: number[]): TrendInfo {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const meanY = sumY / n;
    const ssTotal = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
    const ssRes = y.reduce((acc, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return acc + Math.pow(yi - predicted, 2);
    }, 0);
    const r2 = 1 - ssRes / ssTotal;

    // Determine direction
    let direction: TrendInfo['direction'];
    if (Math.abs(slope) < 0.01 * meanY) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Check for volatility
    const volatility = this.calculateVolatility(values);
    if (volatility > 0.3 && r2 < 0.5) {
      direction = 'volatile';
    }

    return {
      direction,
      slope,
      r2,
      prediction: slope * n + intercept,
    };
  }

  private calculateCorrelation(x: number[], y: number[]): { coefficient: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    const coefficient = denominator === 0 ? 0 : numerator / denominator;

    return { coefficient };
  }

  private calculateStats(values: number[]): { mean: number; stdDev: number; skewness: number } {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Skewness
    const skewness = stdDev === 0 ? 0 :
      values.reduce((acc, v) => acc + Math.pow((v - mean) / stdDev, 3), 0) / n;

    return { mean, stdDev, skewness };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / Math.abs(values[i - 1]));
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }
}
