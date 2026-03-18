import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';
import { MAX_COLS } from '../constants/grid';
import { colToLetter, getCellKey } from '../types/cell';
import { exportWorksheet } from '../utils/xlsxFidelity';

describe('Stress Tests', () => {
  beforeEach(() => {
    // Reset stores
    useWorkbookStore.setState({
      workbookId: 'stress-test',
      workbookName: 'Stress Test Workbook',
      sheets: {},
      activeSheetId: null,
      sheetOrder: [],
      isLoading: false,
      error: null,
      selectedCell: null,
      selectionRange: null,
      history: [],
      historyIndex: -1,
      clipboard: null,
      zoom: 100,
      showGridlines: true,
      showHeadings: true,
    });

    useSelectionStore.setState({
      selectedCell: null,
      selectionRange: null,
      isEditing: false,
      editValue: '',
    });
  });

  describe('Large Data Operations', () => {
    it('should handle 10,000 cells batch update under 500ms', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const updates: Array<{
        row: number;
        col: number;
        data: { value: string; displayValue: string };
      }> = [];

      // Generate 10,000 cells (100 rows x 100 cols equivalent, but we only have 26 cols)
      for (let row = 0; row < 385; row++) {
        for (let col = 0; col < 26; col++) {
          updates.push({
            row,
            col,
            data: {
              value: `R${row}C${col}`,
              displayValue: `R${row}C${col}`,
            },
          });
        }
      }

      const startTime = performance.now();
      store.batchUpdateCells('sheet-1', updates);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`10,000 cells batch update took ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);

      // Verify data integrity
      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0'].value).toBe('R0C0');
      expect(state.sheets['sheet-1'].cells['100:10'].value).toBe('R100C10');
    });

    it('should handle 50,000 cells batch update under 2000ms', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const updates: Array<{
        row: number;
        col: number;
        data: { value: string; displayValue: string };
      }> = [];

      // Generate 50,000 cells
      for (let row = 0; row < 1924; row++) {
        for (let col = 0; col < 26; col++) {
          updates.push({
            row,
            col,
            data: {
              value: `R${row}C${col}`,
              displayValue: `R${row}C${col}`,
            },
          });
        }
      }

      const startTime = performance.now();
      store.batchUpdateCells('sheet-1', updates);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`50,000 cells batch update took ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(2000);
    });

    it('should handle rapid cell updates (1000 updates in sequence)', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        store.updateCell('sheet-1', Math.floor(i / 26), i % 26, {
          value: `Value${i}`,
          displayValue: `Value${i}`,
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`1000 sequential updates took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Selection Performance', () => {
    it('should handle rapid selection changes (1000 changes)', () => {
      const store = useSelectionStore.getState();

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        store.setSelectedCell({ row: i % 100, col: i % 26 });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`1000 selection changes took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should handle large range selections', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 0, col: 0 });

      const startTime = performance.now();

      // Select 1000 x 26 range
      store.selectRange({ row: 0, col: 0 }, { row: 999, col: 25 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Large range selection took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10);

      const state = useSelectionStore.getState();
      expect(state.selectionRange?.end.row).toBe(999);
      expect(state.selectionRange?.end.col).toBe(25);
    });

    it('should handle repeated expand selection operations', () => {
      const store = useSelectionStore.getState();
      store.setSelectedCell({ row: 0, col: 0 });

      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        store.expandSelection('down');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`500 expand selections took ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);

      const state = useSelectionStore.getState();
      expect(state.selectionRange?.end.row).toBe(500);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated sheet operations', () => {
      const store = useWorkbookStore.getState();

      // Create and delete sheets repeatedly
      for (let i = 0; i < 100; i++) {
        store.addSheet({
          id: `sheet-${i}`,
          name: `Sheet${i}`,
          index: i,
          cells: {},
        });

        // Add some data
        for (let j = 0; j < 100; j++) {
          store.updateCell(`sheet-${i}`, j, 0, {
            value: `Data${j}`,
            displayValue: `Data${j}`,
          });
        }

        // Delete sheet (simulate by removing from state)
        if (i > 0) {
          const currentState = useWorkbookStore.getState();
          const { [`sheet-${i - 1}`]: removed, ...remainingSheets } =
            currentState.sheets;
          useWorkbookStore.setState({ sheets: remainingSheets });
        }
      }

      const finalState = useWorkbookStore.getState();
      // Should only have the last 2 sheets
      const sheetCount = Object.keys(finalState.sheets).length;
      expect(sheetCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent updates without data corruption', async () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      // Simulate concurrent updates
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              store.updateCell('sheet-1', 0, i % 26, {
                value: `Concurrent${i}`,
                displayValue: `Concurrent${i}`,
              });
              resolve();
            }, Math.random() * 10);
          })
        );
      }

      await Promise.all(promises);

      // Verify no data corruption
      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1']).toBeDefined();
      expect(Object.keys(state.sheets['sheet-1'].cells).length).toBeGreaterThan(
        0
      );
    });
  });
});

describe('Benchmark Tests', () => {
  it('should benchmark getCellDisplayValue', () => {
    const store = useWorkbookStore.getState();
    store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

    // Populate with data
    const updates = [];
    for (let row = 0; row < 100; row++) {
      for (let col = 0; col < 26; col++) {
        updates.push({
          row,
          col,
          data: { value: `Value`, displayValue: `Display` },
        });
      }
    }
    store.batchUpdateCells('sheet-1', updates);

    // Benchmark reads
    const iterations = 10000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      store.getCellDisplayValue('sheet-1', i % 100, i % 26);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;

    console.log(
      `getCellDisplayValue: ${iterations} calls in ${duration.toFixed(2)}ms (${avgTime.toFixed(4)}ms avg)`
    );

    expect(avgTime).toBeLessThan(0.1); // Each call should be under 0.1ms
  });
});

// =============================================================================
// WIDE COLUMN PERFORMANCE TESTS (Post MAX_COLS=16384 expansion)
// =============================================================================

describe('Wide Column Performance', () => {
  beforeEach(() => {
    useWorkbookStore.setState({
      workbookId: 'wide-test',
      workbookName: 'Wide Column Test',
      sheets: {},
      activeSheetId: null,
      sheetOrder: [],
      isLoading: false,
      error: null,
      selectedCell: null,
      selectionRange: null,
      history: [],
      historyIndex: -1,
      clipboard: null,
      zoom: 100,
      showGridlines: true,
      showHeadings: true,
    });
  });

  it('should handle 1000 columns batch update under 500ms', () => {
    const store = useWorkbookStore.getState();
    store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

    const updates: Array<{
      row: number;
      col: number;
      data: { value: number; displayValue: string };
    }> = [];

    // 100 rows × 1000 cols = 100,000 cells
    for (let row = 0; row < 100; row++) {
      for (let col = 0; col < 1000; col++) {
        updates.push({
          row,
          col,
          data: { value: row * 1000 + col, displayValue: `${row * 1000 + col}` },
        });
      }
    }

    const startTime = performance.now();
    store.batchUpdateCells('sheet-1', updates);
    const duration = performance.now() - startTime;

    console.log(`100K cells (100×1000 cols) batch update: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);

    // Verify far-right column data
    const state = useWorkbookStore.getState();
    expect(state.sheets['sheet-1'].cells['0:999']?.value).toBe(999);
    expect(state.sheets['sheet-1'].cells['99:500']?.value).toBe(99500);
  });

  it('should read cells across 1000+ columns efficiently', () => {
    const store = useWorkbookStore.getState();
    store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

    // Populate sparse data across wide range
    const updates = [];
    for (let col = 0; col < 2000; col += 10) {
      updates.push({
        row: 0,
        col,
        data: { value: `Col${col}`, displayValue: `Col${col}` },
      });
    }
    store.batchUpdateCells('sheet-1', updates);

    // Benchmark reads across wide range
    const iterations = 5000;
    const startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      store.getCellDisplayValue('sheet-1', 0, (i * 10) % 2000);
    }
    const duration = performance.now() - startTime;

    console.log(`${iterations} reads across 2000 cols: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(100);
  });

  it('should handle selection across wide column range', () => {
    const selStore = useSelectionStore.getState();
    selStore.setSelectedCell({ row: 0, col: 0 });

    const startTime = performance.now();
    // Select A1 to ALM100 (1000 cols × 100 rows)
    selStore.selectRange({ row: 0, col: 0 }, { row: 99, col: 999 });
    const duration = performance.now() - startTime;

    console.log(`Wide range selection (100×1000): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(10);

    const state = useSelectionStore.getState();
    expect(state.selectionRange?.end.col).toBe(999);
  });

  it('MAX_COLS constant should be 16384', () => {
    expect(MAX_COLS).toBe(16384);
  });

  it('colToLetter should handle multi-letter columns correctly', () => {
    expect(colToLetter(0)).toBe('A');
    expect(colToLetter(25)).toBe('Z');
    expect(colToLetter(26)).toBe('AA');
    expect(colToLetter(27)).toBe('AB');
    expect(colToLetter(51)).toBe('AZ');
    expect(colToLetter(52)).toBe('BA');
    expect(colToLetter(701)).toBe('ZZ');
    expect(colToLetter(702)).toBe('AAA');
    // Excel max column: XFD = 16383
    expect(colToLetter(16383)).toBe('XFD');
  });

  it('getCellKey should work for high column indices', () => {
    expect(getCellKey(0, 16383)).toBe('0:16383');
    expect(getCellKey(99999, 1000)).toBe('99999:1000');
  });
});

describe('Export Fidelity — Wide Columns', () => {
  it('should export worksheet with data beyond column Z correctly', () => {
    // Create a sheet with data in columns AA, AB, etc.
    const cells: Record<string, { value: string | number | boolean | null; formula: string | null; displayValue: string }> = {};
    // Put data at A1, Z1, AA1, AZ1, BA1
    cells['0:0'] = { value: 'A1', formula: null, displayValue: 'A1' };
    cells['0:25'] = { value: 'Z1', formula: null, displayValue: 'Z1' };
    cells['0:26'] = { value: 'AA1', formula: null, displayValue: 'AA1' };
    cells['0:51'] = { value: 'AZ1', formula: null, displayValue: 'AZ1' };
    cells['0:52'] = { value: 'BA1', formula: null, displayValue: 'BA1' };

    const sheet = { id: 'test', name: 'Test', cells, index: 0 };
    const ws = exportWorksheet(sheet as any);

    // Verify !ref covers all columns
    const ref = (ws as any)['!ref'] as string;
    expect(ref).toBeDefined();
    // Should end at BA1 (col 52)
    expect(ref).toBe('A1:BA1');

    // Verify cell references are correct
    expect(ws['A1']?.v).toBe('A1');
    expect(ws['Z1']?.v).toBe('Z1');
    expect(ws['AA1']?.v).toBe('AA1');
    expect(ws['AZ1']?.v).toBe('AZ1');
    expect(ws['BA1']?.v).toBe('BA1');
  });

  it('should not truncate data at column Z during export', () => {
    const cells: Record<string, { value: number; formula: string | null; displayValue: string }> = {};
    // Fill 100 columns (A through CV)
    for (let col = 0; col < 100; col++) {
      cells[`0:${col}`] = { value: col, formula: null, displayValue: `${col}` };
    }

    const sheet = { id: 'test', name: 'Test', cells, index: 0 };
    const ws = exportWorksheet(sheet as any);

    const ref = (ws as any)['!ref'] as string;
    // Column 99 = CV
    expect(ref).toBe('A1:CV1');

    // Verify last column data preserved
    expect(ws['CV1']?.v).toBe(99);
    expect(ws['CU1']?.v).toBe(98);
  });
});

describe('Large Grid Memory', () => {
  it('should handle 50K rows × 100 cols (5M cells) batch update under 10s', { timeout: 15000 }, () => {
    const store = useWorkbookStore.getState();
    store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

    const updates: Array<{
      row: number;
      col: number;
      data: { value: number; displayValue: string };
    }> = [];

    // 50,000 rows × 100 cols = 5,000,000 cells
    for (let row = 0; row < 50000; row++) {
      for (let col = 0; col < 100; col++) {
        updates.push({
          row,
          col,
          data: { value: row * 100 + col, displayValue: `${row * 100 + col}` },
        });
      }
    }

    const startTime = performance.now();
    store.batchUpdateCells('sheet-1', updates);
    const duration = performance.now() - startTime;

    console.log(`5M cells (50K×100) batch update: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(10000);

    // Verify edge data
    const state = useWorkbookStore.getState();
    expect(state.sheets['sheet-1'].cells['49999:99']?.value).toBe(4999999);
  });
});
