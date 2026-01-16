import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';

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
