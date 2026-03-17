// =============================================================================
// CALIBRATION TRACKER — Track AI prediction accuracy over time (Blueprint §5.5)
// =============================================================================

import { loggers } from '@/utils/logger';
import type {
  CalibrationRecord,
  CalibrationBucket,
  CalibrationMetrics,
  PredictionOutcome,
  TrustConfig,
} from './types';
import { DEFAULT_TRUST_CONFIG } from './types';

// -----------------------------------------------------------------------------
// Calibration Tracker Class
// -----------------------------------------------------------------------------

export class CalibrationTracker {
  private records: CalibrationRecord[] = [];
  private config: TrustConfig;
  private readonly BUCKET_RANGES: [number, number][] = [
    [0.0, 0.2],
    [0.2, 0.4],
    [0.4, 0.6],
    [0.6, 0.8],
    [0.8, 1.0],
  ];

  constructor(config: Partial<TrustConfig> = {}) {
    this.config = { ...DEFAULT_TRUST_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Record Management
  // ---------------------------------------------------------------------------

  /**
   * Record a prediction outcome
   */
  recordOutcome(
    taskType: string,
    predictedConfidence: number,
    outcome: PredictionOutcome,
    metadata?: Record<string, unknown>
  ): CalibrationRecord {
    const record: CalibrationRecord = {
      id: crypto.randomUUID(),
      taskType,
      predictedConfidence: Math.max(0, Math.min(1, predictedConfidence)),
      actualOutcome: outcome,
      outcomeScore: this.outcomeToScore(outcome),
      timestamp: new Date(),
      metadata,
    };

    this.records.push(record);

    // Trim to window size
    if (this.records.length > this.config.calibrationWindowSize) {
      this.records = this.records.slice(-this.config.calibrationWindowSize);
    }

    return record;
  }

  /**
   * Convert outcome to numeric score
   */
  private outcomeToScore(outcome: PredictionOutcome): number {
    switch (outcome) {
      case 'correct':
        return 1.0;
      case 'partial':
        return 0.5;
      case 'incorrect':
        return 0.0;
      case 'unknown':
        return 0.5; // Assume neutral
    }
  }

  // ---------------------------------------------------------------------------
  // Metrics Calculation
  // ---------------------------------------------------------------------------

  /**
   * Get calibration metrics
   */
  getMetrics(): CalibrationMetrics {
    const buckets = this.calculateBuckets();
    const brier = this.calculateBrierScore();
    const overallCalibration = this.calculateOverallCalibration(buckets);
    const recentAccuracy = this.calculateRecentAccuracy(20);
    const trend = this.calculateTrend();

    return {
      overallCalibration,
      brier,
      buckets,
      totalPredictions: this.records.length,
      recentAccuracy,
      trend,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate calibration buckets
   */
  private calculateBuckets(): CalibrationBucket[] {
    return this.BUCKET_RANGES.map(([min, max]) => {
      const bucketRecords = this.records.filter(
        (r) => r.predictedConfidence >= min && r.predictedConfidence < max
      );

      if (bucketRecords.length === 0) {
        return {
          range: [min, max],
          predictedAccuracy: (min + max) / 2,
          actualAccuracy: 0,
          sampleCount: 0,
          isCalibrated: true, // No data, assume calibrated
        };
      }

      const predictedAccuracy =
        bucketRecords.reduce((sum, r) => sum + r.predictedConfidence, 0) /
        bucketRecords.length;

      const actualAccuracy =
        bucketRecords.reduce((sum, r) => sum + r.outcomeScore, 0) /
        bucketRecords.length;

      // Consider calibrated if within 0.15 of predicted
      const isCalibrated = Math.abs(predictedAccuracy - actualAccuracy) < 0.15;

      return {
        range: [min, max],
        predictedAccuracy,
        actualAccuracy,
        sampleCount: bucketRecords.length,
        isCalibrated,
      };
    });
  }

  /**
   * Calculate Brier score (lower = better calibration)
   */
  private calculateBrierScore(): number {
    if (this.records.length === 0) return 0;

    const sumSquaredError = this.records.reduce((sum, r) => {
      const error = r.predictedConfidence - r.outcomeScore;
      return sum + error * error;
    }, 0);

    return sumSquaredError / this.records.length;
  }

  /**
   * Calculate overall calibration score (0-1, higher = better)
   */
  private calculateOverallCalibration(buckets: CalibrationBucket[]): number {
    const bucketsWithData = buckets.filter((b) => b.sampleCount > 0);
    if (bucketsWithData.length === 0) return 1;

    // Average absolute calibration error
    const avgError =
      bucketsWithData.reduce(
        (sum, b) => sum + Math.abs(b.predictedAccuracy - b.actualAccuracy),
        0
      ) / bucketsWithData.length;

    // Convert to 0-1 score (1 = perfect calibration)
    return Math.max(0, 1 - avgError);
  }

  /**
   * Calculate recent accuracy
   */
  private calculateRecentAccuracy(n: number): number {
    const recent = this.records.slice(-n);
    if (recent.length === 0) return 0.7; // Default

    return (
      recent.reduce((sum, r) => sum + r.outcomeScore, 0) / recent.length
    );
  }

  /**
   * Calculate trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.records.length < 20) return 'stable';

    const midpoint = Math.floor(this.records.length / 2);
    const firstHalf = this.records.slice(0, midpoint);
    const secondHalf = this.records.slice(midpoint);

    const firstAccuracy =
      firstHalf.reduce((sum, r) => sum + r.outcomeScore, 0) / firstHalf.length;
    const secondAccuracy =
      secondHalf.reduce((sum, r) => sum + r.outcomeScore, 0) / secondHalf.length;

    const diff = secondAccuracy - firstAccuracy;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------

  /**
   * Get accuracy by task type
   */
  getAccuracyByTaskType(): Map<string, number> {
    const byType = new Map<string, CalibrationRecord[]>();

    for (const record of this.records) {
      const existing = byType.get(record.taskType) || [];
      existing.push(record);
      byType.set(record.taskType, existing);
    }

    const accuracies = new Map<string, number>();

    for (const [type, records] of byType) {
      const accuracy =
        records.reduce((sum, r) => sum + r.outcomeScore, 0) / records.length;
      accuracies.set(type, accuracy);
    }

    return accuracies;
  }

  /**
   * Get under/over-confident ranges
   */
  getCalibrationIssues(): {
    overconfident: [number, number][];
    underconfident: [number, number][];
  } {
    const buckets = this.calculateBuckets();
    const overconfident: [number, number][] = [];
    const underconfident: [number, number][] = [];

    for (const bucket of buckets) {
      if (bucket.sampleCount < 3) continue; // Need enough data

      const diff = bucket.predictedAccuracy - bucket.actualAccuracy;

      if (diff > 0.1) {
        overconfident.push(bucket.range);
      } else if (diff < -0.1) {
        underconfident.push(bucket.range);
      }
    }

    return { overconfident, underconfident };
  }

  /**
   * Get recommended confidence adjustment
   */
  getConfidenceAdjustment(): number {
    const metrics = this.getMetrics();

    if (metrics.totalPredictions < 10) {
      return 0; // Not enough data
    }

    // Calculate average overconfidence/underconfidence
    const bucketsWithData = metrics.buckets.filter((b) => b.sampleCount > 0);
    if (bucketsWithData.length === 0) return 0;

    const avgBias =
      bucketsWithData.reduce(
        (sum, b) =>
          sum +
          (b.predictedAccuracy - b.actualAccuracy) *
            (b.sampleCount / metrics.totalPredictions),
        0
      );

    // Recommend adjustment opposite to bias
    return -avgBias;
  }

  // ---------------------------------------------------------------------------
  // History Access
  // ---------------------------------------------------------------------------

  /**
   * Get recent records
   */
  getRecentRecords(n: number = 10): CalibrationRecord[] {
    return this.records.slice(-n);
  }

  /**
   * Get all records
   */
  getAllRecords(): CalibrationRecord[] {
    return [...this.records];
  }

  /**
   * Get records by task type
   */
  getRecordsByTaskType(taskType: string): CalibrationRecord[] {
    return this.records.filter((r) => r.taskType === taskType);
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  /**
   * Format metrics for display
   */
  formatMetrics(metrics: CalibrationMetrics): string {
    const lines: string[] = [];

    const icon = this.getCalibrationIcon(metrics.overallCalibration);
    lines.push(
      `${icon} Calibration: ${Math.round(metrics.overallCalibration * 100)}%`
    );
    lines.push(`Recent Accuracy: ${Math.round(metrics.recentAccuracy * 100)}%`);
    lines.push(`Trend: ${this.formatTrend(metrics.trend)}`);
    lines.push(`Total Predictions: ${metrics.totalPredictions}`);

    return lines.join('\n');
  }

  /**
   * Get icon for calibration level
   */
  getCalibrationIcon(calibration: number): string {
    if (calibration >= 0.9) return '🎯';
    if (calibration >= 0.75) return '🟢';
    if (calibration >= 0.5) return '🟡';
    return '🟠';
  }

  /**
   * Format trend
   */
  formatTrend(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving':
        return '📈 Improving';
      case 'stable':
        return '➡️ Stable';
      case 'declining':
        return '📉 Declining';
    }
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  /**
   * Export records for persistence
   */
  exportRecords(): string {
    return JSON.stringify(this.records);
  }

  /**
   * Import records from persistence
   */
  importRecords(json: string): void {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        this.records = data.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
    } catch {
      loggers.ai.error('Failed to import calibration records');
    }
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records = [];
  }
}

// Export singleton
export const calibrationTracker = new CalibrationTracker();
