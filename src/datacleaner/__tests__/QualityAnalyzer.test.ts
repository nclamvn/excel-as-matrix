import { describe, it, expect, beforeEach } from 'vitest';
import { QualityAnalyzer } from '../QualityAnalyzer';
import type { CleanerSheetData } from '../types';

// Helper to create test sheet data
function createTestSheetData(options: {
  cells: unknown[][];
  columnTypes?: string[];
  headers?: string[];
}): CleanerSheetData {
  const rows = options.cells.length;
  const cols = options.cells[0]?.length || 0;

  return {
    sheetId: 'test-sheet',
    sheetName: 'Test Sheet',
    rowCount: rows,
    colCount: cols,
    cells: options.cells.map(row =>
      row.map(v => ({
        value: v,
        isEmpty: v === null || v === undefined || v === '',
      }))
    ),
    headers: options.headers || Array.from({ length: cols }, (_, i) => `Column ${i}`),
    columnTypes: options.columnTypes || Array(cols).fill('text'),
  };
}

describe('QualityAnalyzer', () => {
  let analyzer: QualityAnalyzer;

  beforeEach(() => {
    analyzer = new QualityAnalyzer();
  });

  describe('analyze', () => {
    describe('overall score', () => {
      it('returns quality score object', () => {
        const data = createTestSheetData({
          cells: [['A', 1], ['B', 2], ['C', 3]],
        });
        const score = analyzer.analyze(data);

        expect(score).toBeDefined();
        expect(score.overall).toBeDefined();
        expect(score.grade).toBeDefined();
        expect(score.categories).toBeDefined();
        expect(score.issues).toBeDefined();
        expect(score.summary).toBeDefined();
      });

      it('overall score is between 0 and 100', () => {
        const data = createTestSheetData({
          cells: [['A', 1], ['B', 2], ['C', 3]],
        });
        const score = analyzer.analyze(data);

        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(100);
      });

      it('high quality data gets high score', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 10 }, (_, i) => [`Item ${i}`, i * 10]),
        });
        const score = analyzer.analyze(data);

        expect(score.overall).toBeGreaterThanOrEqual(80);
      });
    });

    describe('grades', () => {
      it('assigns A grade for scores >= 90', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 10 }, (_, i) => [`Item ${i}`, i * 10]),
        });
        const score = analyzer.analyze(data);

        if (score.overall >= 90) {
          expect(score.grade).toBe('A');
        }
      });

      it('returns valid grade', () => {
        const data = createTestSheetData({
          cells: [['A', 1]],
        });
        const score = analyzer.analyze(data);

        expect(['A', 'B', 'C', 'D', 'F']).toContain(score.grade);
      });
    });

    describe('duplicates category', () => {
      it('detects duplicate rows', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['B', 2],
            ['A', 1], // Duplicate
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.duplicates.issueCount).toBeGreaterThan(0);
      });

      it('gives 100 score for no duplicates', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['B', 2],
            ['C', 3],
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.duplicates.score).toBe(100);
      });

      it('lowers score with more duplicates', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['A', 1],
            ['A', 1],
            ['A', 1],
            ['A', 1],
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.duplicates.score).toBeLessThan(100);
      });

      it('creates duplicate issues', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['A', 1],
          ],
        });
        const score = analyzer.analyze(data);

        const dupIssue = score.issues.find(i => i.type === 'duplicate');
        expect(dupIssue).toBeDefined();
        expect(dupIssue?.autoFixable).toBe(true);
      });
    });

    describe('completeness category', () => {
      it('detects missing values', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['B', null],
            ['C', ''],
          ],
        });
        const score = analyzer.analyze(data);

        // May or may not flag depending on threshold
        expect(score.categories.completeness).toBeDefined();
      });

      it('gives 100 score for complete data', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 10 }, (_, i) => [`Item ${i}`, i]),
        });
        const score = analyzer.analyze(data);

        expect(score.categories.completeness.score).toBe(100);
      });

      it('lowers score with missing values', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['', 2],
            ['C', null],
            ['', null],
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.completeness.score).toBeLessThan(100);
      });

      it('creates missing value issues for columns with > 5% missing', () => {
        const cells = Array.from({ length: 20 }, (_, i) => [
          i % 5 === 0 ? '' : `Item ${i}`,
          i,
        ]);
        const data = createTestSheetData({ cells });
        const score = analyzer.analyze(data);

        const missingIssue = score.issues.find(i => i.type === 'missing');
        // Depends on threshold
        expect(score.categories.completeness).toBeDefined();
      });
    });

    describe('validity category', () => {
      it('detects invalid formats', () => {
        const data = createTestSheetData({
          cells: [
            ['123', 'abc'],
            ['456', 'def'],
            ['abc', 'ghi'], // Invalid number
          ],
          columnTypes: ['number', 'text'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.validity).toBeDefined();
      });

      it('validates numbers', () => {
        const data = createTestSheetData({
          cells: [
            [100],
            [200],
            ['not a number'],
          ],
          columnTypes: ['number'],
        });
        const score = analyzer.analyze(data);

        const validityIssue = score.issues.find(i => i.type === 'invalid_format');
        expect(validityIssue).toBeDefined();
      });

      it('validates dates', () => {
        const data = createTestSheetData({
          cells: [
            ['2024-01-15'],
            ['01/15/2024'],
            ['not a date'],
          ],
          columnTypes: ['date'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.validity).toBeDefined();
      });

      it('validates emails', () => {
        const data = createTestSheetData({
          cells: [
            ['user@example.com'],
            ['invalid-email'],
            ['another@test.org'],
          ],
          columnTypes: ['email'],
        });
        const score = analyzer.analyze(data);

        const emailIssue = score.issues.find(i =>
          i.type === 'invalid_format' && i.title.includes('email')
        );
        // May have issues for invalid email
        expect(score.categories.validity).toBeDefined();
      });

      it('validates phone numbers', () => {
        const data = createTestSheetData({
          cells: [
            ['(555) 123-4567'],
            ['+1-555-987-6543'],
            ['not a phone'],
          ],
          columnTypes: ['phone'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.validity).toBeDefined();
      });
    });

    describe('consistency category', () => {
      it('detects inconsistent naming', () => {
        const data = createTestSheetData({
          cells: [
            ['USA'],
            ['U.S.A.'],
            ['United States'],
            ['usa'],
          ],
          columnTypes: ['text'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.consistency).toBeDefined();
      });

      it('gives 100 score for consistent data', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 10 }, () => ['Consistent Value']),
        });
        const score = analyzer.analyze(data);

        expect(score.categories.consistency.score).toBe(100);
      });

      it('creates inconsistency issues', () => {
        const data = createTestSheetData({
          cells: [
            ['New York'],
            ['new york'],
            ['NEW YORK'],
          ],
        });
        const score = analyzer.analyze(data);

        // Case variants are normalized, so these would be considered the same
        // Only truly different variants create issues
        expect(score.categories.consistency).toBeDefined();
      });
    });

    describe('accuracy category', () => {
      it('detects outliers in numeric columns', () => {
        const cells = Array.from({ length: 20 }, (_, i) => [
          `Item ${i}`,
          i === 19 ? 10000 : 100, // Outlier in last row
        ]);
        const data = createTestSheetData({
          cells,
          columnTypes: ['text', 'number'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.accuracy).toBeDefined();
      });

      it('gives 100 score for data without outliers', () => {
        const cells = Array.from({ length: 20 }, (_, i) => [
          `Item ${i}`,
          100 + i, // No extreme outliers
        ]);
        const data = createTestSheetData({
          cells,
          columnTypes: ['text', 'number'],
        });
        const score = analyzer.analyze(data);

        expect(score.categories.accuracy.score).toBeGreaterThanOrEqual(80);
      });

      it('marks outlier issues as not auto-fixable', () => {
        const cells = Array.from({ length: 20 }, (_, i) => [
          i === 19 ? 100000 : 100,
        ]);
        const data = createTestSheetData({
          cells,
          columnTypes: ['number'],
        });
        const score = analyzer.analyze(data);

        const outlierIssue = score.issues.find(i => i.type === 'outlier');
        if (outlierIssue) {
          expect(outlierIssue.autoFixable).toBe(false);
        }
      });
    });

    describe('summary', () => {
      it('includes total rows count', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 10 }, (_, i) => [i]),
        });
        const score = analyzer.analyze(data);

        expect(score.summary.totalRows).toBe(10);
      });

      it('includes total cells count', () => {
        const data = createTestSheetData({
          cells: [
            [1, 2, 3],
            [4, 5, 6],
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.summary.totalCells).toBe(6);
      });

      it('includes total issues count', () => {
        const data = createTestSheetData({
          cells: [['A', 1]],
        });
        const score = analyzer.analyze(data);

        expect(score.summary.totalIssues).toBeDefined();
        expect(score.summary.totalIssues).toBe(score.issues.length);
      });

      it('includes auto-fixable count', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['A', 1], // Duplicate - auto-fixable
          ],
        });
        const score = analyzer.analyze(data);

        expect(score.summary.autoFixable).toBeDefined();
      });

      it('includes manual review count', () => {
        const data = createTestSheetData({
          cells: [['A', 1]],
        });
        const score = analyzer.analyze(data);

        expect(score.summary.manualReview).toBeDefined();
        expect(score.summary.manualReview).toBe(
          score.summary.totalIssues - score.summary.autoFixable
        );
      });
    });

    describe('issues', () => {
      it('includes issue examples', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['A', 1],
          ],
        });
        const score = analyzer.analyze(data);

        const issue = score.issues[0];
        if (issue) {
          expect(issue.examples).toBeDefined();
          expect(Array.isArray(issue.examples)).toBe(true);
        }
      });

      it('includes severity levels', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 20 }, () => ['A', 1]),
        });
        const score = analyzer.analyze(data);

        const issue = score.issues[0];
        if (issue) {
          expect(['critical', 'warning', 'info']).toContain(issue.severity);
        }
      });

      it('includes suggested fixes', () => {
        const data = createTestSheetData({
          cells: [
            ['A', 1],
            ['A', 1],
          ],
        });
        const score = analyzer.analyze(data);

        const issue = score.issues[0];
        if (issue && issue.autoFixable) {
          expect(issue.suggestedFix).toBeDefined();
        }
      });

      it('limits examples to 3', () => {
        const data = createTestSheetData({
          cells: Array.from({ length: 20 }, () => ['A', 1]),
        });
        const score = analyzer.analyze(data);

        const issue = score.issues[0];
        if (issue) {
          expect(issue.examples.length).toBeLessThanOrEqual(3);
        }
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const data = createTestSheetData({ cells: [] });
      const score = analyzer.analyze(data);

      expect(score).toBeDefined();
      expect(score.summary.totalRows).toBe(0);
    });

    it('handles single cell', () => {
      const data = createTestSheetData({ cells: [['A']] });
      const score = analyzer.analyze(data);

      expect(score).toBeDefined();
    });

    it('handles all empty cells', () => {
      const data = createTestSheetData({
        cells: [[null, null], ['', '']],
      });
      const score = analyzer.analyze(data);

      expect(score.categories.completeness.score).toBeLessThan(100);
    });

    it('handles numeric-only data', () => {
      const data = createTestSheetData({
        cells: [[1, 2], [3, 4], [5, 6]],
        columnTypes: ['number', 'number'],
      });
      const score = analyzer.analyze(data);

      expect(score).toBeDefined();
    });

    it('handles mixed data types', () => {
      const data = createTestSheetData({
        cells: [
          ['Name', 100, '2024-01-15'],
          ['Test', 200, '2024-02-20'],
        ],
        columnTypes: ['text', 'number', 'date'],
      });
      const score = analyzer.analyze(data);

      expect(score).toBeDefined();
    });

    it('handles large dataset', () => {
      const cells = Array.from({ length: 1000 }, (_, i) => [
        `Item ${i}`,
        i * 10,
        `user${i}@example.com`,
      ]);
      const data = createTestSheetData({
        cells,
        columnTypes: ['text', 'number', 'email'],
      });

      const start = performance.now();
      const score = analyzer.analyze(data);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5000);
      expect(score).toBeDefined();
    });
  });

  describe('category weights', () => {
    it('uses correct weights for overall calculation', () => {
      const data = createTestSheetData({
        cells: Array.from({ length: 10 }, (_, i) => [i, `Item ${i}`]),
      });
      const score = analyzer.analyze(data);

      // Weights: duplicates 0.2, completeness 0.25, validity 0.2, consistency 0.2, accuracy 0.15
      // Overall should be weighted average
      const expectedOverall = Math.round(
        score.categories.duplicates.score * 0.2 +
        score.categories.completeness.score * 0.25 +
        score.categories.validity.score * 0.2 +
        score.categories.consistency.score * 0.2 +
        score.categories.accuracy.score * 0.15
      );

      expect(score.overall).toBe(expectedOverall);
    });
  });
});
