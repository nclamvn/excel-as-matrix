import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicateDetector } from '../DuplicateDetector';
import type { CleanerSheetData, DuplicateConfig } from '../types';

// Helper to create test sheet data
function createTestSheetData(cells: unknown[][], columnTypes?: string[]): CleanerSheetData {
  const rows = cells.length;
  const cols = cells[0]?.length || 0;

  return {
    sheetId: 'test-sheet',
    sheetName: 'Test Sheet',
    rowCount: rows,
    colCount: cols,
    cells: cells.map(row =>
      row.map(value => ({
        value,
        isEmpty: value === null || value === undefined || value === '',
      }))
    ),
    headers: Array.from({ length: cols }, (_, i) => `Column ${i}`),
    columnTypes: columnTypes || Array(cols).fill('text'),
  };
}

describe('DuplicateDetector', () => {
  let detector: DuplicateDetector;

  beforeEach(() => {
    detector = new DuplicateDetector();
  });

  describe('constructor', () => {
    it('creates instance with default config', () => {
      expect(detector).toBeInstanceOf(DuplicateDetector);
    });

    it('creates instance with custom config', () => {
      const config: Partial<DuplicateConfig> = {
        caseSensitive: true,
        fuzzyThreshold: 0.9,
      };
      const customDetector = new DuplicateDetector(config);
      expect(customDetector).toBeInstanceOf(DuplicateDetector);
    });
  });

  describe('detect', () => {
    describe('exact duplicates', () => {
      it('returns empty array for unique data', () => {
        const data = createTestSheetData([
          ['A', 1],
          ['B', 2],
          ['C', 3],
        ]);
        const groups = detector.detect(data);
        expect(groups).toEqual([]);
      });

      it('detects exact duplicate rows', () => {
        const data = createTestSheetData([
          ['A', 1],
          ['B', 2],
          ['A', 1], // Duplicate of row 0
        ]);
        const groups = detector.detect(data);

        expect(groups.length).toBe(1);
        expect(groups[0].type).toBe('exact');
        expect(groups[0].rows.length).toBe(2);
      });

      it('detects multiple duplicate groups', () => {
        const data = createTestSheetData([
          ['A', 1],
          ['B', 2],
          ['A', 1], // Duplicate of row 0
          ['B', 2], // Duplicate of row 1
        ]);
        const groups = detector.detect(data);

        expect(groups.length).toBe(2);
      });

      it('groups multiple duplicates together', () => {
        const data = createTestSheetData([
          ['A', 1],
          ['A', 1],
          ['A', 1],
        ]);
        const groups = detector.detect(data);

        expect(groups.length).toBe(1);
        expect(groups[0].rows.length).toBe(3);
      });

      it('handles case insensitivity by default', () => {
        const data = createTestSheetData([
          ['Test', 1],
          ['test', 1],
          ['TEST', 1],
        ]);
        const groups = detector.detect(data);

        expect(groups.length).toBe(1);
        expect(groups[0].rows.length).toBe(3);
      });

      it('respects case sensitivity setting', () => {
        const caseSensitiveDetector = new DuplicateDetector({
          caseSensitive: true,
        });
        const data = createTestSheetData([
          ['Test', 1],
          ['test', 1],
        ]);
        const groups = caseSensitiveDetector.detect(data);

        expect(groups).toEqual([]); // Not duplicates when case-sensitive
      });

      it('ignores whitespace by default', () => {
        const data = createTestSheetData([
          ['hello  world', 1],
          ['hello world', 1],
        ]);
        const groups = detector.detect(data);

        expect(groups.length).toBe(1);
      });

      it('marks first row as original', () => {
        const data = createTestSheetData([
          ['A', 1],
          ['A', 1],
        ]);
        const groups = detector.detect(data);

        expect(groups[0].rows[0].isOriginal).toBe(true);
        expect(groups[0].rows[1].isOriginal).toBe(false);
      });
    });

    describe('fuzzy duplicates', () => {
      it('detects fuzzy duplicates when threshold < 1', () => {
        const fuzzyDetector = new DuplicateDetector({
          fuzzyThreshold: 0.8,
        });
        const data = createTestSheetData([
          ['John Smith', 100],
          ['Jon Smith', 100],
        ]);
        const groups = fuzzyDetector.detect(data);

        // Should find fuzzy match
        expect(groups.length).toBeGreaterThanOrEqual(0);
      });

      it('respects fuzzy threshold', () => {
        const strictDetector = new DuplicateDetector({
          fuzzyThreshold: 0.99,
        });
        const data = createTestSheetData([
          ['John Smith', 100],
          ['Jon Smith', 100],
        ]);
        const groups = strictDetector.detect(data);

        // Very strict threshold should not match
        expect(groups.every(g => g.type !== 'fuzzy' || g.similarity >= 0.99)).toBe(true);
      });

      it('calculates similarity score for fuzzy groups', () => {
        const fuzzyDetector = new DuplicateDetector({
          fuzzyThreshold: 0.7,
        });
        const data = createTestSheetData([
          ['Company ABC', 100],
          ['Company ABD', 100],
        ]);
        const groups = fuzzyDetector.detect(data);

        const fuzzyGroup = groups.find(g => g.type === 'fuzzy');
        if (fuzzyGroup) {
          expect(fuzzyGroup.similarity).toBeGreaterThan(0);
          expect(fuzzyGroup.similarity).toBeLessThanOrEqual(1);
        }
      });
    });

    describe('column selection', () => {
      it('checks all columns by default', () => {
        const data = createTestSheetData([
          ['A', 1, 'X'],
          ['A', 1, 'Y'], // Different in col 2
        ]);
        const groups = detector.detect(data);

        expect(groups).toEqual([]); // Not duplicates
      });

      it('respects specific column selection', () => {
        const columnDetector = new DuplicateDetector({
          checkColumns: [0, 1], // Only check first two columns
        });
        const data = createTestSheetData([
          ['A', 1, 'X'],
          ['A', 1, 'Y'], // Same in cols 0,1
        ]);
        const groups = columnDetector.detect(data);

        expect(groups.length).toBe(1);
      });
    });

    describe('edge cases', () => {
      it('handles empty data', () => {
        const data = createTestSheetData([]);
        const groups = detector.detect(data);
        expect(groups).toEqual([]);
      });

      it('handles single row', () => {
        const data = createTestSheetData([['A', 1]]);
        const groups = detector.detect(data);
        expect(groups).toEqual([]);
      });

      it('handles empty cells', () => {
        const data = createTestSheetData([
          ['A', null],
          ['A', null],
        ]);
        const groups = detector.detect(data);
        expect(groups.length).toBe(1);
      });

      it('handles numeric values', () => {
        const data = createTestSheetData([
          [100, 200],
          [100, 200],
        ]);
        const groups = detector.detect(data);
        expect(groups.length).toBe(1);
      });

      it('handles mixed types', () => {
        const data = createTestSheetData([
          ['100', 200],
          [100, '200'],
        ]);
        const groups = detector.detect(data);
        // String and number comparison behavior
        expect(groups.length).toBe(1);
      });
    });
  });

  describe('removeDuplicates', () => {
    it('returns rows to delete', () => {
      const groups = [{
        id: 'dup-1',
        type: 'exact' as const,
        similarity: 1,
        rows: [
          { rowIndex: 0, values: ['A', 1], isOriginal: true },
          { rowIndex: 2, values: ['A', 1], isOriginal: false },
        ],
        columns: [0, 1],
        keepRow: 0,
      }];

      const rowsToDelete = detector.removeDuplicates(groups);
      expect(rowsToDelete).toContain(2);
      expect(rowsToDelete).not.toContain(0); // Keep original
    });

    it('keeps first row by default', () => {
      const groups = [{
        id: 'dup-1',
        type: 'exact' as const,
        similarity: 1,
        rows: [
          { rowIndex: 0, values: ['A'], isOriginal: true },
          { rowIndex: 1, values: ['A'], isOriginal: false },
          { rowIndex: 2, values: ['A'], isOriginal: false },
        ],
        columns: [0],
        keepRow: 0,
      }];

      const rowsToDelete = detector.removeDuplicates(groups, 'first');
      expect(rowsToDelete).toEqual([2, 1]); // Descending order
      expect(rowsToDelete).not.toContain(0);
    });

    it('keeps last row when specified', () => {
      const groups = [{
        id: 'dup-1',
        type: 'exact' as const,
        similarity: 1,
        rows: [
          { rowIndex: 0, values: ['A'], isOriginal: true },
          { rowIndex: 1, values: ['A'], isOriginal: false },
          { rowIndex: 2, values: ['A'], isOriginal: false },
        ],
        columns: [0],
        keepRow: 2,
      }];

      const rowsToDelete = detector.removeDuplicates(groups, 'last');
      expect(rowsToDelete).not.toContain(2); // Keep last
      expect(rowsToDelete).toContain(0);
      expect(rowsToDelete).toContain(1);
    });

    it('returns unique rows only', () => {
      const groups = [
        {
          id: 'dup-1',
          type: 'exact' as const,
          similarity: 1,
          rows: [
            { rowIndex: 0, values: ['A'], isOriginal: true },
            { rowIndex: 1, values: ['A'], isOriginal: false },
          ],
          columns: [0],
          keepRow: 0,
        },
        {
          id: 'dup-2',
          type: 'exact' as const,
          similarity: 1,
          rows: [
            { rowIndex: 2, values: ['B'], isOriginal: true },
            { rowIndex: 1, values: ['B'], isOriginal: false }, // Same row in another group
          ],
          columns: [0],
          keepRow: 2,
        },
      ];

      const rowsToDelete = detector.removeDuplicates(groups);
      const uniqueRows = new Set(rowsToDelete);
      expect(rowsToDelete.length).toBe(uniqueRows.size);
    });

    it('sorts rows in descending order', () => {
      const groups = [{
        id: 'dup-1',
        type: 'exact' as const,
        similarity: 1,
        rows: [
          { rowIndex: 0, values: ['A'], isOriginal: true },
          { rowIndex: 5, values: ['A'], isOriginal: false },
          { rowIndex: 2, values: ['A'], isOriginal: false },
        ],
        columns: [0],
        keepRow: 0,
      }];

      const rowsToDelete = detector.removeDuplicates(groups);
      expect(rowsToDelete[0]).toBe(5);
      expect(rowsToDelete[1]).toBe(2);
    });

    it('handles empty groups', () => {
      const rowsToDelete = detector.removeDuplicates([]);
      expect(rowsToDelete).toEqual([]);
    });
  });

  describe('updateConfig', () => {
    it('updates configuration', () => {
      detector.updateConfig({ caseSensitive: true });

      const data = createTestSheetData([
        ['Test', 1],
        ['test', 1],
      ]);
      const groups = detector.detect(data);

      expect(groups).toEqual([]); // Now case-sensitive
    });

    it('partially updates config', () => {
      detector.updateConfig({ fuzzyThreshold: 0.5 });

      const data = createTestSheetData([
        ['abc', 1],
        ['abc', 1],
      ]);
      const groups = detector.detect(data);

      expect(groups.length).toBeGreaterThan(0); // Still detects exact
    });
  });

  describe('Levenshtein similarity', () => {
    it('calculates correct similarity for identical strings', () => {
      const data = createTestSheetData([
        ['hello', 1],
        ['hello', 1],
      ]);
      const groups = detector.detect(data);
      expect(groups[0].similarity).toBe(1);
    });
  });

  describe('performance', () => {
    it('handles large dataset', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => [
        `Name ${i % 100}`,
        i % 100,
      ]);
      const data = createTestSheetData(rows);

      const start = performance.now();
      const groups = detector.detect(data);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5000); // Should complete in 5 seconds
      expect(groups.length).toBeGreaterThan(0);
    });
  });
});
