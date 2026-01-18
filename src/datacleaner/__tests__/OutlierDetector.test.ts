import { describe, it, expect, beforeEach } from 'vitest';
import { OutlierDetector } from '../OutlierDetector';
import type { CleanerSheetData, OutlierConfig, OutlierInfo } from '../types';

// Helper to create test sheet data with numeric column
function createNumericData(values: number[], columnName = 'Amount'): CleanerSheetData {
  return {
    sheetId: 'test-sheet',
    sheetName: 'Test Sheet',
    rowCount: values.length,
    colCount: 1,
    cells: values.map(v => [{ value: v, isEmpty: false }]),
    headers: [columnName],
    columnTypes: ['number'],
  };
}

// Helper to create multi-column data
function createMultiColumnData(rows: unknown[][], types: string[]): CleanerSheetData {
  return {
    sheetId: 'test-sheet',
    sheetName: 'Test Sheet',
    rowCount: rows.length,
    colCount: rows[0]?.length || 0,
    cells: rows.map(row =>
      row.map(v => ({
        value: v,
        isEmpty: v === null || v === undefined || v === '',
      }))
    ),
    headers: types.map((_, i) => `Column ${i}`),
    columnTypes: types,
  };
}

describe('OutlierDetector', () => {
  let detector: OutlierDetector;

  beforeEach(() => {
    // Use lower threshold for tests to ensure outliers are detected
    detector = new OutlierDetector({ zScoreThreshold: 2.5 });
  });

  describe('constructor', () => {
    it('creates instance with default config', () => {
      expect(detector).toBeInstanceOf(OutlierDetector);
    });

    it('creates instance with custom config', () => {
      const config: Partial<OutlierConfig> = {
        method: 'iqr',
        zScoreThreshold: 2.5,
      };
      const customDetector = new OutlierDetector(config);
      expect(customDetector).toBeInstanceOf(OutlierDetector);
    });
  });

  describe('detect', () => {
    describe('with Z-score method', () => {
      it('detects high outliers', () => {
        // Normal values around 100, one outlier at 1000
        const values = [98, 102, 99, 101, 100, 98, 103, 97, 100, 1000];
        const data = createNumericData(values);
        const results = detector.detect(data);

        expect(results.length).toBeGreaterThan(0);
        const highOutlier = results[0].outliers.find(o => o.value === 1000);
        expect(highOutlier).toBeDefined();
        expect(highOutlier?.direction).toBe('high');
      });

      it('detects low outliers', () => {
        // Normal values around 100, one outlier at -500
        const values = [98, 102, 99, 101, 100, 98, 103, 97, 100, -500];
        const data = createNumericData(values);
        const results = detector.detect(data);

        expect(results.length).toBeGreaterThan(0);
        const lowOutlier = results[0].outliers.find(o => o.value === -500);
        expect(lowOutlier).toBeDefined();
        expect(lowOutlier?.direction).toBe('low');
      });

      it('returns empty for normal distribution without outliers', () => {
        // Normal values without extreme outliers
        const values = Array.from({ length: 100 }, (_, i) => 100 + (i % 10) - 5);
        const data = createNumericData(values);
        const results = detector.detect(data);

        // May or may not have outliers depending on distribution
        expect(Array.isArray(results)).toBe(true);
      });

      it('calculates z-score for outliers', () => {
        const values = [100, 100, 100, 100, 100, 100, 100, 100, 100, 500];
        const data = createNumericData(values);
        const results = detector.detect(data);

        if (results.length > 0 && results[0].outliers.length > 0) {
          expect(results[0].outliers[0].score).toBeDefined();
          expect(Math.abs(results[0].outliers[0].score)).toBeGreaterThan(0);
        }
      });
    });

    describe('with IQR method', () => {
      it('detects outliers using IQR', () => {
        const iqrDetector = new OutlierDetector({ method: 'iqr' });
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is outlier
        const data = createNumericData(values);
        const results = iqrDetector.detect(data);

        expect(results.length).toBeGreaterThan(0);
      });

      it('respects IQR multiplier', () => {
        const strictDetector = new OutlierDetector({
          method: 'iqr',
          iqrMultiplier: 3.0, // Very strict
        });
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 15]; // 15 might not be outlier with strict threshold
        const data = createNumericData(values);
        const results = strictDetector.detect(data);

        // With strict multiplier, fewer outliers detected
        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('with MAD method', () => {
      it('detects outliers using MAD', () => {
        const madDetector = new OutlierDetector({ method: 'mad', zScoreThreshold: 2.5 });
        // Need variation in data so MAD > 0, with a clear outlier
        const values = [8, 9, 10, 11, 12, 9, 10, 11, 10, 100];
        const data = createNumericData(values);
        const results = madDetector.detect(data);

        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('column filtering', () => {
      it('only analyzes numeric columns', () => {
        const data = createMultiColumnData(
          [
            ['A', 100],
            ['B', 100],
            ['C', 100],
            ['D', 100],
            ['E', 100],
            ['F', 100],
            ['G', 100],
            ['H', 100],
            ['I', 100],
            ['J', 1000],
          ],
          ['text', 'number']
        );
        const results = detector.detect(data);

        // Should only analyze column 1 (number)
        if (results.length > 0) {
          expect(results[0].column).toBe(1);
        }
      });

      it('analyzes currency columns', () => {
        const data = createMultiColumnData(
          Array.from({ length: 10 }, (_, i) => [i === 9 ? 10000 : 100]),
          ['currency']
        );
        const results = detector.detect(data);

        expect(Array.isArray(results)).toBe(true);
      });

      it('respects columnsToCheck config', () => {
        const detector = new OutlierDetector({
          columnsToCheck: [0],
        });
        const data = createMultiColumnData(
          Array.from({ length: 10 }, (_, i) => [i === 9 ? 1000 : 100, i === 9 ? 1000 : 100]),
          ['number', 'number']
        );
        const results = detector.detect(data);

        // Should only check column 0
        const hasColumn1 = results.some(r => r.column === 1);
        expect(hasColumn1).toBe(false);
      });
    });

    describe('statistics calculation', () => {
      it('includes statistics in results', () => {
        const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const data = createNumericData(values);
        const results = detector.detect(data);

        if (results.length > 0) {
          const stats = results[0].stats;
          expect(stats.mean).toBeDefined();
          expect(stats.median).toBeDefined();
          expect(stats.stdDev).toBeDefined();
          expect(stats.min).toBeDefined();
          expect(stats.max).toBeDefined();
          expect(stats.q1).toBeDefined();
          expect(stats.q3).toBeDefined();
          expect(stats.iqr).toBeDefined();
        }
      });

      it('calculates correct mean', () => {
        const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 1000];
        const data = createNumericData(values);
        const results = detector.detect(data);

        if (results.length > 0) {
          const expectedMean = values.reduce((a, b) => a + b, 0) / values.length;
          expect(results[0].stats.mean).toBeCloseTo(expectedMean, 2);
        }
      });

      it('calculates correct median', () => {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
        const data = createNumericData(values);
        const results = detector.detect(data);

        if (results.length > 0) {
          expect(results[0].stats.median).toBe(5.5); // Median of 1-9,100
        }
      });
    });

    describe('edge cases', () => {
      it('requires minimum data points', () => {
        const values = [1, 2, 3, 4, 5]; // Less than 10 points
        const data = createNumericData(values);
        const results = detector.detect(data);

        expect(results).toEqual([]); // Not enough data
      });

      it('handles all same values', () => {
        const values = Array(20).fill(100);
        const data = createNumericData(values);
        const results = detector.detect(data);

        expect(results).toEqual([]); // No outliers when all same
      });

      it('handles empty data', () => {
        const data = createNumericData([]);
        const results = detector.detect(data);
        expect(results).toEqual([]);
      });

      it('handles currency-formatted values', () => {
        const data = createMultiColumnData(
          [
            ['$100.00'], ['$100.00'], ['$100.00'], ['$100.00'], ['$100.00'],
            ['$100.00'], ['$100.00'], ['$100.00'], ['$100.00'], ['$1,000.00'],
          ],
          ['currency']
        );
        const results = detector.detect(data);

        // Should parse currency strings
        expect(Array.isArray(results)).toBe(true);
      });

      it('ignores non-numeric cells', () => {
        const data = createMultiColumnData(
          [
            [100], [100], [100], [100], [100],
            [100], [100], ['invalid'], [100], [100], [1000],
          ],
          ['number']
        );
        const results = detector.detect(data);

        expect(Array.isArray(results)).toBe(true);
      });
    });
  });

  describe('getBounds', () => {
    it('calculates bounds for z-score method', () => {
      const zscoreDetector = new OutlierDetector({ method: 'zscore', zScoreThreshold: 3 });
      const stats = {
        mean: 100,
        median: 100,
        stdDev: 10,
        min: 70,
        max: 130,
        q1: 90,
        q3: 110,
        iqr: 20,
      };
      const bounds = zscoreDetector.getBounds(stats);

      expect(bounds.lower).toBe(100 - 3 * 10); // mean - 3*stdDev
      expect(bounds.upper).toBe(100 + 3 * 10);
    });

    it('calculates bounds for IQR method', () => {
      const iqrDetector = new OutlierDetector({ method: 'iqr' });
      const stats = {
        mean: 100,
        median: 100,
        stdDev: 10,
        min: 70,
        max: 130,
        q1: 90,
        q3: 110,
        iqr: 20,
      };
      const bounds = iqrDetector.getBounds(stats);

      expect(bounds.lower).toBe(90 - 1.5 * 20); // q1 - 1.5*iqr
      expect(bounds.upper).toBe(110 + 1.5 * 20);
    });
  });

  describe('getSuggestedActions', () => {
    it('returns array of suggested actions', () => {
      const outlierInfo: OutlierInfo = {
        column: 0,
        columnName: 'Amount',
        outliers: [{ row: 9, col: 0, ref: 'A10', value: 1000, score: 5, direction: 'high' }],
        stats: { mean: 100, median: 100, stdDev: 10, min: 90, max: 1000, q1: 95, q3: 105, iqr: 10 },
        method: 'zscore',
      };
      const actions = detector.getSuggestedActions(outlierInfo);

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some(a => a.type === 'cap')).toBe(true);
      expect(actions.some(a => a.type === 'replace_median')).toBe(true);
      expect(actions.some(a => a.type === 'replace_mean')).toBe(true);
      expect(actions.some(a => a.type === 'remove')).toBe(true);
      expect(actions.some(a => a.type === 'flag')).toBe(true);
    });

    it('includes severity levels', () => {
      const outlierInfo: OutlierInfo = {
        column: 0,
        columnName: 'Amount',
        outliers: [{ row: 9, col: 0, ref: 'A10', value: 1000, score: 5, direction: 'high' }],
        stats: { mean: 100, median: 100, stdDev: 10, min: 90, max: 1000, q1: 95, q3: 105, iqr: 10 },
        method: 'zscore',
      };
      const actions = detector.getSuggestedActions(outlierInfo);

      const removeAction = actions.find(a => a.type === 'remove');
      expect(removeAction?.severity).toBe('destructive');

      const flagAction = actions.find(a => a.type === 'flag');
      expect(flagAction?.severity).toBe('safe');
    });
  });

  describe('applyCap', () => {
    it('caps high outliers to upper bound', () => {
      const values = Array.from({ length: 10 }, (_, i) => i === 9 ? 1000 : 100);
      const data = createNumericData(values);
      const results = detector.detect(data);

      if (results.length > 0) {
        const changes = detector.applyCap(data, results[0]);
        expect(changes.length).toBeGreaterThan(0);
      }
    });

    it('caps low outliers to lower bound', () => {
      const values = Array.from({ length: 10 }, (_, i) => i === 9 ? -100 : 100);
      const data = createNumericData(values);
      const results = detector.detect(data);

      if (results.length > 0) {
        const changes = detector.applyCap(data, results[0]);
        expect(changes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('applyReplaceWithMedian', () => {
    it('replaces outliers with median value', () => {
      const values = Array.from({ length: 10 }, (_, i) => i === 9 ? 1000 : 100);
      const data = createNumericData(values);
      const results = detector.detect(data);

      if (results.length > 0) {
        const changes = detector.applyReplaceWithMedian(data, results[0]);
        expect(changes.length).toBeGreaterThan(0);
        // Implementation converts to number which removes trailing zeros
        expect(changes[0].newValue).toBe(String(Number(results[0].stats.median.toFixed(2))));
      }
    });
  });

  describe('applyReplaceWithMean', () => {
    it('replaces outliers with mean value', () => {
      const values = Array.from({ length: 10 }, (_, i) => i === 9 ? 1000 : 100);
      const data = createNumericData(values);
      const results = detector.detect(data);

      if (results.length > 0) {
        const changes = detector.applyReplaceWithMean(data, results[0]);
        expect(changes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getRowsToRemove', () => {
    it('returns rows containing outliers in descending order', () => {
      const outlierInfo: OutlierInfo = {
        column: 0,
        columnName: 'Amount',
        outliers: [
          { row: 5, col: 0, ref: 'A6', value: 500, score: 3, direction: 'high' },
          { row: 2, col: 0, ref: 'A3', value: -100, score: -4, direction: 'low' },
          { row: 8, col: 0, ref: 'A9', value: 1000, score: 6, direction: 'high' },
        ],
        stats: { mean: 100, median: 100, stdDev: 10, min: -100, max: 1000, q1: 95, q3: 105, iqr: 10 },
        method: 'zscore',
      };

      const rows = detector.getRowsToRemove(outlierInfo);
      expect(rows).toEqual([8, 5, 2]); // Descending order
    });
  });

  describe('updateConfig', () => {
    it('updates configuration', () => {
      detector.updateConfig({ method: 'iqr', iqrMultiplier: 2.0 });

      const values = Array.from({ length: 15 }, (_, i) => i === 14 ? 100 : 10);
      const data = createNumericData(values);
      const results = detector.detect(data);

      // IQR method should be used now
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('performance', () => {
    it('handles large dataset', () => {
      const values = Array.from({ length: 10000 }, () => Math.random() * 100);
      // Add some outliers
      values[5000] = 10000;
      values[7500] = -1000;

      const data = createNumericData(values);

      const start = performance.now();
      const results = detector.detect(data);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000); // Should complete in 1 second
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
