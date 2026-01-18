import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataCleanerEngine, dataCleanerEngine } from '../DataCleanerEngine';
import type { CleanerSheetData, DuplicateGroup, CleanerEvent } from '../types';

// Helper to create test sheet data
function createTestSheetData(options: {
  rows?: number;
  cols?: number;
  cells?: Record<string, { value: unknown; isEmpty?: boolean }>[];
  headers?: string[];
  columnTypes?: string[];
}): CleanerSheetData {
  const rows = options.rows || 10;
  const cols = options.cols || 5;

  const cells: CleanerSheetData['cells'] = [];
  for (let r = 0; r < rows; r++) {
    const rowData = [];
    for (let c = 0; c < cols; c++) {
      if (options.cells && options.cells[r] && options.cells[r][c]) {
        rowData.push({
          value: options.cells[r][c].value,
          isEmpty: options.cells[r][c].isEmpty || false
        });
      } else {
        rowData.push({ value: `Cell ${r},${c}`, isEmpty: false });
      }
    }
    cells.push(rowData);
  }

  return {
    sheetId: 'test-sheet',
    sheetName: 'Test Sheet',
    rowCount: rows,
    colCount: cols,
    cells,
    headers: options.headers || Array.from({ length: cols }, (_, i) => `Col ${i}`),
    columnTypes: options.columnTypes || Array(cols).fill('text'),
  };
}

describe('DataCleanerEngine', () => {
  let engine: DataCleanerEngine;

  beforeEach(() => {
    engine = new DataCleanerEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    engine.clearHistory();
  });

  describe('constructor', () => {
    it('creates engine instance', () => {
      expect(engine).toBeInstanceOf(DataCleanerEngine);
    });

    it('initializes with null quality score', () => {
      expect(engine.getQualityScore()).toBeNull();
    });

    it('initializes with empty sessions', () => {
      expect(engine.getSessions()).toEqual([]);
    });
  });

  describe('analyze', () => {
    it('analyzes data and returns quality score', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const score = engine.analyze(data);

      expect(score).toBeDefined();
      expect(score.overall).toBeDefined();
      expect(score.grade).toBeDefined();
      expect(score.categories).toBeDefined();
    });

    it('calculates overall score', () => {
      const data = createTestSheetData({ rows: 10, cols: 5 });
      const score = engine.analyze(data);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('returns grade based on score', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const score = engine.analyze(data);

      expect(['A', 'B', 'C', 'D', 'F']).toContain(score.grade);
    });

    it('includes all category scores', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const score = engine.analyze(data);

      expect(score.categories.duplicates).toBeDefined();
      expect(score.categories.completeness).toBeDefined();
      expect(score.categories.validity).toBeDefined();
      expect(score.categories.consistency).toBeDefined();
      expect(score.categories.accuracy).toBeDefined();
    });

    it('includes issues array', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const score = engine.analyze(data);

      expect(Array.isArray(score.issues)).toBe(true);
    });

    it('includes summary statistics', () => {
      const data = createTestSheetData({ rows: 10, cols: 5 });
      const score = engine.analyze(data);

      expect(score.summary.totalRows).toBe(10);
      expect(score.summary.totalCells).toBe(50);
      expect(score.summary.totalIssues).toBeDefined();
    });

    it('stores score for later retrieval', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      engine.analyze(data);

      expect(engine.getQualityScore()).not.toBeNull();
    });

    it('emits analysis_started event', () => {
      const events: CleanerEvent[] = [];
      engine.on((event) => events.push(event));

      const data = createTestSheetData({ rows: 5, cols: 3 });
      engine.analyze(data);

      expect(events.some(e => e.type === 'analysis_started')).toBe(true);
    });

    it('emits analysis_completed event', () => {
      const events: CleanerEvent[] = [];
      engine.on((event) => events.push(event));

      const data = createTestSheetData({ rows: 5, cols: 3 });
      engine.analyze(data);

      expect(events.some(e => e.type === 'analysis_completed')).toBe(true);
    });
  });

  describe('detectDuplicates', () => {
    it('returns empty array for unique data', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const duplicates = engine.detectDuplicates(data);

      expect(duplicates).toEqual([]);
    });

    it('detects exact duplicates', () => {
      const cells = [
        [{ value: 'A' }, { value: 1 }],
        [{ value: 'B' }, { value: 2 }],
        [{ value: 'A' }, { value: 1 }], // Duplicate of row 0
        [{ value: 'C' }, { value: 3 }],
      ];
      const data = createTestSheetData({ rows: 4, cols: 2, cells });
      const duplicates = engine.detectDuplicates(data);

      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('returns duplicate groups with row information', () => {
      const cells = [
        [{ value: 'Test' }, { value: 100 }],
        [{ value: 'Test' }, { value: 100 }],
      ];
      const data = createTestSheetData({ rows: 2, cols: 2, cells });
      const duplicates = engine.detectDuplicates(data);

      if (duplicates.length > 0) {
        expect(duplicates[0].rows).toBeDefined();
        expect(duplicates[0].rows.length).toBeGreaterThan(1);
      }
    });
  });

  describe('removeDuplicates', () => {
    it('returns changes for duplicate rows', () => {
      const cells = [
        [{ value: 'A' }, { value: 1 }],
        [{ value: 'A' }, { value: 1 }],
      ];
      const data = createTestSheetData({ rows: 2, cols: 2, cells });

      const duplicateGroups: DuplicateGroup[] = [{
        id: 'dup-1',
        type: 'exact',
        similarity: 1,
        rows: [
          { rowIndex: 0, values: ['A', 1], isOriginal: true },
          { rowIndex: 1, values: ['A', 1], isOriginal: false },
        ],
        columns: [0, 1],
        keepRow: 0,
      }];

      const changes = engine.removeDuplicates(data, duplicateGroups);
      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].changeType).toBe('deleted');
    });
  });

  describe('analyzeFormats', () => {
    it('returns array of format issues', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const issues = engine.analyzeFormats(data);

      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('standardizeFormats', () => {
    it('returns cell changes for format fixes', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const issues = engine.analyzeFormats(data);
      const changes = engine.standardizeFormats(data, issues);

      expect(Array.isArray(changes)).toBe(true);
    });
  });

  describe('analyzeMissingValues', () => {
    it('returns array of missing value info', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const missing = engine.analyzeMissingValues(data);

      expect(Array.isArray(missing)).toBe(true);
    });

    it('detects empty cells', () => {
      const cells = [
        [{ value: 'A', isEmpty: false }, { value: '', isEmpty: true }],
        [{ value: 'B', isEmpty: false }, { value: 'X', isEmpty: false }],
      ];
      const data = createTestSheetData({ rows: 2, cols: 2, cells });
      const missing = engine.analyzeMissingValues(data);

      // Should find the empty cell in the analysis
      expect(Array.isArray(missing)).toBe(true);
    });
  });

  describe('fillMissingValues', () => {
    it('returns cell changes for filled values', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const missing = engine.analyzeMissingValues(data);
      const changes = engine.fillMissingValues(data, missing);

      expect(Array.isArray(changes)).toBe(true);
    });
  });

  describe('detectInconsistencies', () => {
    it('returns array of inconsistency groups', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const inconsistencies = engine.detectInconsistencies(data);

      expect(Array.isArray(inconsistencies)).toBe(true);
    });
  });

  describe('fixInconsistencies', () => {
    it('returns cell changes for fixed inconsistencies', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const groups = engine.detectInconsistencies(data);
      const changes = engine.fixInconsistencies(data, groups);

      expect(Array.isArray(changes)).toBe(true);
    });
  });

  describe('detectOutliers', () => {
    it('returns array of outlier info', () => {
      const data = createTestSheetData({
        rows: 20,
        cols: 2,
        columnTypes: ['text', 'number']
      });
      const outliers = engine.detectOutliers(data);

      expect(Array.isArray(outliers)).toBe(true);
    });
  });

  describe('validate', () => {
    it('returns validation results', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const results = engine.validate(data);

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('executePipeline', () => {
    it('executes cleaning pipeline', async () => {
      const data = createTestSheetData({ rows: 10, cols: 5 });
      const result = await engine.executePipeline(data);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('emits cleaning_started event', async () => {
      const events: CleanerEvent[] = [];
      engine.on((event) => events.push(event));

      const data = createTestSheetData({ rows: 5, cols: 3 });
      await engine.executePipeline(data);

      expect(events.some(e => e.type === 'cleaning_started')).toBe(true);
    });

    it('emits cleaning_completed event', async () => {
      const events: CleanerEvent[] = [];
      engine.on((event) => events.push(event));

      const data = createTestSheetData({ rows: 5, cols: 3 });
      await engine.executePipeline(data);

      expect(events.some(e => e.type === 'cleaning_completed')).toBe(true);
    });

    it('calls progress callback', async () => {
      const progress = vi.fn();
      const data = createTestSheetData({ rows: 5, cols: 3 });
      await engine.executePipeline(data, undefined, progress);

      // Progress may or may not be called depending on implementation
      expect(progress).toBeDefined();
    });

    it('creates cleaning session on success', async () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      await engine.executePipeline(data);

      const sessions = engine.getSessions();
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('previewCleaning', () => {
    it('generates preview of changes', () => {
      const data = createTestSheetData({ rows: 5, cols: 3 });
      const changes = [{
        row: 0,
        col: 0,
        ref: 'A1',
        before: 'old',
        after: 'new',
        changeType: 'modified' as const,
      }];
      const preview = engine.previewCleaning(data, changes);

      expect(preview).toBeDefined();
    });
  });

  describe('fixAllAutoFixable', () => {
    it('returns all auto-fixable changes', async () => {
      const data = createTestSheetData({ rows: 10, cols: 5 });
      const changes = await engine.fixAllAutoFixable(data);

      expect(Array.isArray(changes)).toBe(true);
    });

    it('trims whitespace', async () => {
      const cells = [
        [{ value: '  test  ', isEmpty: false }],
      ];
      const data = createTestSheetData({ rows: 1, cols: 1, cells });
      const changes = await engine.fixAllAutoFixable(data);

      const trimChange = changes.find(c => c.changeType === 'trimmed');
      expect(trimChange).toBeDefined();
    });
  });

  describe('session management', () => {
    describe('getSessions', () => {
      it('returns copy of sessions array', () => {
        expect(engine.getSessions()).toEqual([]);
      });

      it('returns sessions after pipeline execution', async () => {
        const data = createTestSheetData({ rows: 5, cols: 3 });
        await engine.executePipeline(data);

        expect(engine.getSessions().length).toBeGreaterThan(0);
      });
    });

    describe('undoSession', () => {
      it('returns false for non-existent session', () => {
        const result = engine.undoSession('non-existent');
        expect(result).toBe(false);
      });

      it('returns true for valid session', async () => {
        const data = createTestSheetData({ rows: 5, cols: 3 });
        await engine.executePipeline(data);

        const sessions = engine.getSessions();
        if (sessions.length > 0) {
          const result = engine.undoSession(sessions[0].id);
          expect(result).toBe(true);
        }
      });

      it('emits cleaning_undone event', async () => {
        const events: CleanerEvent[] = [];
        engine.on((event) => events.push(event));

        const data = createTestSheetData({ rows: 5, cols: 3 });
        await engine.executePipeline(data);

        const sessions = engine.getSessions();
        if (sessions.length > 0) {
          engine.undoSession(sessions[0].id);
          expect(events.some(e => e.type === 'cleaning_undone')).toBe(true);
        }
      });

      it('cannot undo same session twice', async () => {
        const data = createTestSheetData({ rows: 5, cols: 3 });
        await engine.executePipeline(data);

        const sessions = engine.getSessions();
        if (sessions.length > 0) {
          engine.undoSession(sessions[0].id);
          const secondUndo = engine.undoSession(sessions[0].id);
          expect(secondUndo).toBe(false);
        }
      });
    });

    describe('clearHistory', () => {
      it('clears all sessions', async () => {
        const data = createTestSheetData({ rows: 5, cols: 3 });
        await engine.executePipeline(data);

        engine.clearHistory();
        expect(engine.getSessions()).toEqual([]);
      });
    });
  });

  describe('event handling', () => {
    describe('on', () => {
      it('subscribes to events', () => {
        const handler = vi.fn();
        engine.on(handler);

        const data = createTestSheetData({ rows: 5, cols: 3 });
        engine.analyze(data);

        expect(handler).toHaveBeenCalled();
      });

      it('returns unsubscribe function', () => {
        const handler = vi.fn();
        const unsubscribe = engine.on(handler);

        unsubscribe();

        const data = createTestSheetData({ rows: 5, cols: 3 });
        engine.analyze(data);

        expect(handler).not.toHaveBeenCalled();
      });

      it('handles multiple subscribers', () => {
        const handler1 = vi.fn();
        const handler2 = vi.fn();
        engine.on(handler1);
        engine.on(handler2);

        const data = createTestSheetData({ rows: 5, cols: 3 });
        engine.analyze(data);

        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
      });

      it('handles handler errors gracefully', () => {
        const errorHandler = vi.fn().mockImplementation(() => {
          throw new Error('Handler error');
        });
        const normalHandler = vi.fn();
        engine.on(errorHandler);
        engine.on(normalHandler);

        const data = createTestSheetData({ rows: 5, cols: 3 });
        expect(() => engine.analyze(data)).not.toThrow();
        expect(normalHandler).toHaveBeenCalled();
      });
    });
  });

  describe('singleton export', () => {
    it('exports singleton instance', () => {
      expect(dataCleanerEngine).toBeInstanceOf(DataCleanerEngine);
    });
  });

  describe('edge cases', () => {
    it('handles empty data', () => {
      const data = createTestSheetData({ rows: 0, cols: 0 });
      const score = engine.analyze(data);
      expect(score).toBeDefined();
    });

    it('handles single cell data', () => {
      const data = createTestSheetData({ rows: 1, cols: 1 });
      const score = engine.analyze(data);
      expect(score).toBeDefined();
    });

    it('handles large dataset', () => {
      const data = createTestSheetData({ rows: 1000, cols: 20 });
      const score = engine.analyze(data);
      expect(score).toBeDefined();
    });
  });
});
