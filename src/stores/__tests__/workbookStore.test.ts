import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkbookStore } from '../workbookStore';

describe('workbookStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useWorkbookStore.getState().reset();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initial State Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('should have null workbookId', () => {
      expect(useWorkbookStore.getState().workbookId).toBeNull();
    });

    it('should have empty sheets', () => {
      expect(useWorkbookStore.getState().sheets).toEqual({});
    });

    it('should have null activeSheetId', () => {
      expect(useWorkbookStore.getState().activeSheetId).toBeNull();
    });

    it('should have empty sheetOrder', () => {
      expect(useWorkbookStore.getState().sheetOrder).toEqual([]);
    });

    it('should have zoom at 100', () => {
      expect(useWorkbookStore.getState().zoom).toBe(100);
    });

    it('should show gridlines by default', () => {
      expect(useWorkbookStore.getState().showGridlines).toBe(true);
    });

    it('should show headings by default', () => {
      expect(useWorkbookStore.getState().showHeadings).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Core Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('setWorkbook', () => {
    it('should set workbook id and name', () => {
      const store = useWorkbookStore.getState();
      store.setWorkbook('wb-123', 'My Workbook');

      const state = useWorkbookStore.getState();
      expect(state.workbookId).toBe('wb-123');
      expect(state.workbookName).toBe('My Workbook');
    });

    it('should reset sheets when setting new workbook', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setWorkbook('wb-new', 'New Workbook');

      expect(useWorkbookStore.getState().sheets).toEqual({});
      expect(useWorkbookStore.getState().sheetOrder).toEqual([]);
    });

    it('should reset history when setting new workbook', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();
      store.setWorkbook('wb-new', 'New Workbook');

      expect(useWorkbookStore.getState().history).toEqual([]);
      expect(useWorkbookStore.getState().historyIndex).toBe(-1);
    });
  });

  describe('addSheet', () => {
    it('should add a new sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({
        id: 'sheet-1',
        name: 'Sheet1',
        index: 0,
        cells: {},
      });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1']).toBeDefined();
      expect(state.sheets['sheet-1'].name).toBe('Sheet1');
      expect(state.activeSheetId).toBe('sheet-1');
    });

    it('should set first sheet as active', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });

      const state = useWorkbookStore.getState();
      expect(state.activeSheetId).toBe('sheet-1');
    });

    it('should update sheetOrder', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-1', 'sheet-2']);
    });

    it('should not duplicate in sheetOrder if already exists', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-1', name: 'Sheet1 Updated', index: 0, cells: {} });

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-1']);
    });
  });

  describe('setActiveSheet', () => {
    it('should set active sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.setActiveSheet('sheet-2');

      expect(useWorkbookStore.getState().activeSheetId).toBe('sheet-2');
    });

    it('should not change if sheet does not exist', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setActiveSheet('non-existent');

      expect(useWorkbookStore.getState().activeSheetId).toBe('sheet-1');
    });
  });

  describe('updateCell', () => {
    it('should update cell value', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Hello', displayValue: 'Hello' });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0'].value).toBe('Hello');
    });

    it('should update cell formula', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { formula: '=SUM(A1:A10)', displayValue: '100' });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0'].formula).toBe('=SUM(A1:A10)');
    });

    it('should not fail for non-existent sheet', () => {
      const store = useWorkbookStore.getState();
      expect(() => {
        store.updateCell('non-existent', 0, 0, { value: 'test' });
      }).not.toThrow();
    });

    it('should preserve existing cell data', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Hello', displayValue: 'Hello' });
      store.updateCell('sheet-1', 0, 0, { format: { bold: true } });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0'].value).toBe('Hello');
      expect(state.sheets['sheet-1'].cells['0:0'].format?.bold).toBe(true);
    });
  });

  describe('batchUpdateCells', () => {
    it('should update multiple cells efficiently', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const updates = [
        { row: 0, col: 0, data: { value: 'A1', displayValue: 'A1' } },
        { row: 0, col: 1, data: { value: 'B1', displayValue: 'B1' } },
        { row: 1, col: 0, data: { value: 'A2', displayValue: 'A2' } },
      ];

      store.batchUpdateCells('sheet-1', updates);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0'].value).toBe('A1');
      expect(state.sheets['sheet-1'].cells['0:1'].value).toBe('B1');
      expect(state.sheets['sheet-1'].cells['1:0'].value).toBe('A2');
    });

    it('should handle empty updates', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      expect(() => {
        store.batchUpdateCells('sheet-1', []);
      }).not.toThrow();
    });

    it('should handle large batch updates', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const updates = [];
      for (let i = 0; i < 1000; i++) {
        updates.push({ row: i, col: 0, data: { value: i, displayValue: String(i) } });
      }

      store.batchUpdateCells('sheet-1', updates);

      const state = useWorkbookStore.getState();
      expect(Object.keys(state.sheets['sheet-1'].cells).length).toBe(1000);
    });
  });

  describe('clearCell', () => {
    it('should remove cell data', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Hello', displayValue: 'Hello' });
      store.clearCell('sheet-1', 0, 0);

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['0:0']).toBeUndefined();
    });

    it('should not fail for already empty cell', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      expect(() => {
        store.clearCell('sheet-1', 0, 0);
      }).not.toThrow();
    });
  });

  describe('selection', () => {
    it('should set selected cell', () => {
      const store = useWorkbookStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });

      const state = useWorkbookStore.getState();
      expect(state.selectedCell).toEqual({ row: 5, col: 3 });
      expect(state.selectionRange).toEqual({ start: { row: 5, col: 3 }, end: { row: 5, col: 3 } });
    });

    it('should clear selection when null', () => {
      const store = useWorkbookStore.getState();
      store.setSelectedCell({ row: 5, col: 3 });
      store.setSelectedCell(null);

      expect(useWorkbookStore.getState().selectedCell).toBeNull();
      expect(useWorkbookStore.getState().selectionRange).toBeNull();
    });

    it('should set selection range', () => {
      const store = useWorkbookStore.getState();
      store.setSelectionRange({
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
      });

      const state = useWorkbookStore.getState();
      expect(state.selectionRange).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 5, col: 5 },
      });
      expect(state.selectedCell).toEqual({ row: 0, col: 0 });
    });
  });

  describe('loading and error', () => {
    it('should set loading state', () => {
      const store = useWorkbookStore.getState();
      store.setLoading(true);
      expect(useWorkbookStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useWorkbookStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const store = useWorkbookStore.getState();
      store.setError('Something went wrong');
      expect(useWorkbookStore.getState().error).toBe('Something went wrong');

      store.setError(null);
      expect(useWorkbookStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useWorkbookStore.getState();
      store.setWorkbook('wb-123', 'Test');
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setSelectedCell({ row: 0, col: 0 });
      store.setZoom(150);

      store.reset();

      const state = useWorkbookStore.getState();
      expect(state.workbookId).toBeNull();
      expect(state.sheets).toEqual({});
      expect(state.selectedCell).toBeNull();
      expect(state.zoom).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Sheet Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('deleteSheet', () => {
    it('should delete a sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.deleteSheet('sheet-1');

      expect(useWorkbookStore.getState().sheets['sheet-1']).toBeUndefined();
      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-2']);
    });

    it('should not delete last sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.deleteSheet('sheet-1');

      expect(useWorkbookStore.getState().sheets['sheet-1']).toBeDefined();
    });

    it('should switch active sheet if deleting active', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.setActiveSheet('sheet-2');
      store.deleteSheet('sheet-2');

      expect(useWorkbookStore.getState().activeSheetId).toBe('sheet-1');
    });
  });

  describe('renameSheet', () => {
    it('should rename a sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.renameSheet('sheet-1', 'Renamed Sheet');

      expect(useWorkbookStore.getState().sheets['sheet-1'].name).toBe('Renamed Sheet');
    });

    it('should not fail for non-existent sheet', () => {
      const store = useWorkbookStore.getState();
      expect(() => {
        store.renameSheet('non-existent', 'New Name');
      }).not.toThrow();
    });
  });

  describe('duplicateSheet', () => {
    it('should duplicate a sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: { '0:0': { value: 'test', displayValue: 'test' } } });
      store.duplicateSheet('sheet-1');

      const state = useWorkbookStore.getState();
      expect(state.sheetOrder.length).toBe(2);
      const newSheetId = state.sheetOrder[1];
      expect(state.sheets[newSheetId].name).toBe('Sheet1 (Copy)');
      expect(state.sheets[newSheetId].cells['0:0']?.value).toBe('test');
    });

    it('should set duplicated sheet as active', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.duplicateSheet('sheet-1');

      const state = useWorkbookStore.getState();
      expect(state.activeSheetId).not.toBe('sheet-1');
    });
  });

  describe('moveSheet', () => {
    it('should move sheet left', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.addSheet({ id: 'sheet-3', name: 'Sheet3', index: 2, cells: {} });
      store.moveSheet('sheet-2', 'left');

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-2', 'sheet-1', 'sheet-3']);
    });

    it('should move sheet right', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.addSheet({ id: 'sheet-3', name: 'Sheet3', index: 2, cells: {} });
      store.moveSheet('sheet-2', 'right');

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-1', 'sheet-3', 'sheet-2']);
    });

    it('should not move first sheet left', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.moveSheet('sheet-1', 'left');

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-1', 'sheet-2']);
    });

    it('should not move last sheet right', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.moveSheet('sheet-2', 'right');

      expect(useWorkbookStore.getState().sheetOrder).toEqual(['sheet-1', 'sheet-2']);
    });
  });

  describe('setTabColor', () => {
    it('should set tab color', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setTabColor('sheet-1', '#ff0000');

      expect(useWorkbookStore.getState().sheets['sheet-1'].tabColor).toBe('#ff0000');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Row/Column Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('insertRow', () => {
    it('should insert a row and shift cells down', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Row 0', displayValue: 'Row 0' });
      store.updateCell('sheet-1', 1, 0, { value: 'Row 1', displayValue: 'Row 1' });
      store.insertRow(0);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe('Row 0');
      expect(state.sheets['sheet-1'].cells['2:0']?.value).toBe('Row 1');
    });

    it('should use selected cell row if no index provided', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 5, 0, { value: 'Row 5', displayValue: 'Row 5' });
      store.setSelectedCell({ row: 3, col: 0 });
      store.insertRow();

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['6:0']?.value).toBe('Row 5');
    });
  });

  describe('deleteRow', () => {
    it('should delete a row and shift cells up', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Row 0', displayValue: 'Row 0' });
      store.updateCell('sheet-1', 1, 0, { value: 'Row 1', displayValue: 'Row 1' });
      store.updateCell('sheet-1', 2, 0, { value: 'Row 2', displayValue: 'Row 2' });
      store.deleteRow(1);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.value).toBe('Row 0');
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe('Row 2');
    });
  });

  describe('insertColumn', () => {
    it('should insert a column and shift cells right', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Col A', displayValue: 'Col A' });
      store.updateCell('sheet-1', 0, 1, { value: 'Col B', displayValue: 'Col B' });
      store.insertColumn(0);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:1']?.value).toBe('Col A');
      expect(state.sheets['sheet-1'].cells['0:2']?.value).toBe('Col B');
    });
  });

  describe('deleteColumn', () => {
    it('should delete a column and shift cells left', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'Col A', displayValue: 'Col A' });
      store.updateCell('sheet-1', 0, 1, { value: 'Col B', displayValue: 'Col B' });
      store.updateCell('sheet-1', 0, 2, { value: 'Col C', displayValue: 'Col C' });
      store.deleteColumn(1);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.value).toBe('Col A');
      expect(state.sheets['sheet-1'].cells['0:1']?.value).toBe('Col C');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Clipboard Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('copy', () => {
    it('should copy selected cells to clipboard', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'A1', displayValue: 'A1' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.copy();

      const state = useWorkbookStore.getState();
      expect(state.clipboard).not.toBeNull();
      expect(state.clipboard?.mode).toBe('copy');
      expect(state.clipboard?.cells['0:0']?.value).toBe('A1');
    });
  });

  describe('cut', () => {
    it('should set clipboard mode to cut', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'A1', displayValue: 'A1' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.cut();

      expect(useWorkbookStore.getState().clipboard?.mode).toBe('cut');
    });
  });

  describe('paste', () => {
    it('should paste clipboard contents', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'A1', displayValue: 'A1' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.copy();
      store.setSelectedCell({ row: 2, col: 2 });
      store.paste();

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['2:2']?.value).toBe('A1');
    });

    it('should paste values only', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 100, formula: '=1+99', displayValue: '100' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.copy();
      store.setSelectedCell({ row: 1, col: 0 });
      store.paste('values');

      const cell = useWorkbookStore.getState().sheets['sheet-1'].cells['1:0'];
      expect(cell?.value).toBe(100);
      expect(cell?.formula).toBeNull();
    });

    it('should clear source cells on cut paste', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'A1', displayValue: 'A1' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.cut();
      store.setSelectedCell({ row: 1, col: 0 });
      store.paste();

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']).toBeUndefined();
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe('A1');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // History Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('history', () => {
    it('should push to history', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();

      expect(useWorkbookStore.getState().history.length).toBe(1);
      expect(useWorkbookStore.getState().historyIndex).toBe(0);
    });

    it('should undo changes', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();
      store.updateCell('sheet-1', 0, 0, { value: 'test', displayValue: 'test' });
      store.pushHistory();
      store.undo();

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['0:0']).toBeUndefined();
    });

    it('should redo changes', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();
      store.updateCell('sheet-1', 0, 0, { value: 'test', displayValue: 'test' });
      store.pushHistory();
      store.undo();
      store.redo();

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['0:0']?.value).toBe('test');
    });

    it('canUndo should return correct value', () => {
      const store = useWorkbookStore.getState();
      expect(store.canUndo()).toBe(false);

      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();
      store.pushHistory();

      expect(useWorkbookStore.getState().canUndo()).toBe(true);
    });

    it('canRedo should return correct value', () => {
      const store = useWorkbookStore.getState();
      expect(store.canRedo()).toBe(false);

      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.pushHistory();
      store.pushHistory();
      store.undo();

      expect(useWorkbookStore.getState().canRedo()).toBe(true);
    });

    it('should limit history size', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      for (let i = 0; i < 60; i++) {
        store.pushHistory();
      }

      expect(useWorkbookStore.getState().history.length).toBeLessThanOrEqual(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // View Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('zoom', () => {
    it('should set zoom level', () => {
      const store = useWorkbookStore.getState();
      store.setZoom(150);

      const state = useWorkbookStore.getState();
      expect(state.zoom).toBe(150);
    });

    it('should clamp zoom to min/max', () => {
      const store = useWorkbookStore.getState();

      store.setZoom(10);
      expect(useWorkbookStore.getState().zoom).toBe(25);

      store.setZoom(500);
      expect(useWorkbookStore.getState().zoom).toBe(400);
    });
  });

  describe('view toggles', () => {
    it('should toggle gridlines', () => {
      const store = useWorkbookStore.getState();
      store.setShowGridlines(false);
      expect(useWorkbookStore.getState().showGridlines).toBe(false);
    });

    it('should toggle headings', () => {
      const store = useWorkbookStore.getState();
      store.setShowHeadings(false);
      expect(useWorkbookStore.getState().showHeadings).toBe(false);
    });

    it('should toggle formula bar', () => {
      const store = useWorkbookStore.getState();
      store.setShowFormulaBar(false);
      expect(useWorkbookStore.getState().showFormulaBar).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Format Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('applyFormat', () => {
    it('should apply format to selection', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'test', displayValue: 'test' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.applyFormat({ bold: true });

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['0:0']?.format?.bold).toBe(true);
    });

    it('should apply format to range', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } });
      store.applyFormat({ italic: true });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.format?.italic).toBe(true);
      expect(state.sheets['sheet-1'].cells['0:1']?.format?.italic).toBe(true);
      expect(state.sheets['sheet-1'].cells['1:0']?.format?.italic).toBe(true);
      expect(state.sheets['sheet-1'].cells['1:1']?.format?.italic).toBe(true);
    });
  });

  describe('clearFormat', () => {
    it('should clear formatting', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'test', displayValue: 'test', format: { bold: true } });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
      store.clearFormat();

      expect(useWorkbookStore.getState().sheets['sheet-1'].cells['0:0']?.format).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Find & Replace Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('should find all matching cells', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'hello', displayValue: 'hello' });
      store.updateCell('sheet-1', 1, 0, { value: 'Hello World', displayValue: 'Hello World' });
      store.updateCell('sheet-1', 2, 0, { value: 'world', displayValue: 'world' });

      const results = store.findAll('hello');
      expect(results.length).toBe(2);
    });

    it('should support case sensitive search', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'hello', displayValue: 'hello' });
      store.updateCell('sheet-1', 1, 0, { value: 'Hello', displayValue: 'Hello' });

      const results = store.findAll('Hello', { matchCase: true });
      expect(results.length).toBe(1);
    });

    it('should support whole cell matching', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'test', displayValue: 'test' });
      store.updateCell('sheet-1', 1, 0, { value: 'testing', displayValue: 'testing' });

      const results = store.findAll('test', { wholeCell: true });
      expect(results.length).toBe(1);
    });
  });

  describe('replaceAll', () => {
    it('should replace all occurrences', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'hello', displayValue: 'hello' });
      store.updateCell('sheet-1', 1, 0, { value: 'hello world', displayValue: 'hello world' });

      const count = store.replaceAll('hello', 'hi');
      expect(count).toBe(2);

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.value).toBe('hi');
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe('hi world');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Fill Actions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('fillDown', () => {
    it('should fill down from first row', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 100, displayValue: '100' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 2, col: 0 } });
      store.fillDown();

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe(100);
      expect(state.sheets['sheet-1'].cells['2:0']?.value).toBe(100);
    });
  });

  describe('fillRight', () => {
    it('should fill right from first column', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 100, displayValue: '100' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } });
      store.fillRight();

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:1']?.value).toBe(100);
      expect(state.sheets['sheet-1'].cells['0:2']?.value).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Hide/Unhide Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('hideRow', () => {
    it('should hide a row', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.hideRow(5);

      expect(useWorkbookStore.getState().sheets['sheet-1'].hiddenRows?.has(5)).toBe(true);
    });
  });

  describe('unhideRow', () => {
    it('should unhide a row', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.hideRow(5);
      store.unhideRow(5);

      expect(useWorkbookStore.getState().sheets['sheet-1'].hiddenRows?.has(5)).toBe(false);
    });
  });

  describe('hideColumn', () => {
    it('should hide a column', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.hideColumn(3);

      expect(useWorkbookStore.getState().sheets['sheet-1'].hiddenColumns?.has(3)).toBe(true);
    });
  });

  describe('hideSheet', () => {
    it('should hide a sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addSheet({ id: 'sheet-2', name: 'Sheet2', index: 1, cells: {} });
      store.hideSheet('sheet-1');

      expect(useWorkbookStore.getState().sheets['sheet-1'].hidden).toBe(true);
    });

    it('should not hide last visible sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.hideSheet('sheet-1');

      expect(useWorkbookStore.getState().sheets['sheet-1'].hidden).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Freeze Panes Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('setFreezePane', () => {
    it('should set freeze pane', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setFreezePane(2, 3);

      expect(useWorkbookStore.getState().sheets['sheet-1'].freezePane).toEqual({ row: 2, col: 3 });
    });
  });

  describe('clearFreezePane', () => {
    it('should clear freeze pane', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setFreezePane(2, 3);
      store.clearFreezePane();

      expect(useWorkbookStore.getState().sheets['sheet-1'].freezePane).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Comments Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('addComment', () => {
    it('should add a comment to a cell', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addComment(0, 0, 'This is a comment');

      const comment = store.getComment(0, 0);
      expect(comment?.text).toBe('This is a comment');
      expect(comment?.author).toBe('User');
    });
  });

  describe('editComment', () => {
    it('should edit an existing comment', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addComment(0, 0, 'Original');
      store.editComment(0, 0, 'Updated');

      expect(store.getComment(0, 0)?.text).toBe('Updated');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.addComment(0, 0, 'Comment');
      store.deleteComment(0, 0);

      expect(store.getComment(0, 0)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Row/Column Sizing Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('setRowHeight', () => {
    it('should set row height', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setRowHeight(5, 50);

      expect(useWorkbookStore.getState().sheets['sheet-1'].rowHeights?.[5]).toBe(50);
    });

    it('should clamp row height', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setRowHeight(5, 1);

      expect(useWorkbookStore.getState().sheets['sheet-1'].rowHeights?.[5]).toBe(12);
    });
  });

  describe('setColumnWidth', () => {
    it('should set column width', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setColumnWidth(3, 200);

      expect(useWorkbookStore.getState().sheets['sheet-1'].columnWidths?.[3]).toBe(200);
    });

    it('should clamp column width', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.setColumnWidth(3, 5);

      expect(useWorkbookStore.getState().sheets['sheet-1'].columnWidths?.[3]).toBe(20);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Getters Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getCellValue', () => {
    it('should return cell value', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 100, displayValue: '100' });

      expect(store.getCellValue('sheet-1', 0, 0)).toBe(100);
    });

    it('should return null for empty cell', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      expect(store.getCellValue('sheet-1', 0, 0)).toBeNull();
    });
  });

  describe('getCellFormula', () => {
    it('should return cell formula', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { formula: '=SUM(A1:A10)', displayValue: '55' });

      expect(store.getCellFormula('sheet-1', 0, 0)).toBe('=SUM(A1:A10)');
    });
  });

  describe('getCellDisplayValue', () => {
    it('should return cell display value', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 100, displayValue: '$100.00' });

      const displayValue = store.getCellDisplayValue('sheet-1', 0, 0);
      expect(displayValue).toBe('$100.00');
    });

    it('should return empty string for non-existent cell', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const displayValue = store.getCellDisplayValue('sheet-1', 99, 99);
      expect(displayValue).toBe('');
    });
  });

  describe('getCellFormat', () => {
    it('should return cell format', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 'test', format: { bold: true, fontSize: 14 } });

      const format = store.getCellFormat('sheet-1', 0, 0);
      expect(format?.bold).toBe(true);
      expect(format?.fontSize).toBe(14);
    });
  });

  describe('getActiveSheet', () => {
    it('should return active sheet', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });

      const activeSheet = store.getActiveSheet();
      expect(activeSheet?.id).toBe('sheet-1');
      expect(activeSheet?.name).toBe('Sheet1');
    });

    it('should return null when no active sheet', () => {
      const store = useWorkbookStore.getState();
      expect(store.getActiveSheet()).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Sort Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('sort', () => {
    it('should sort ascending', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 30, displayValue: '30' });
      store.updateCell('sheet-1', 1, 0, { value: 10, displayValue: '10' });
      store.updateCell('sheet-1', 2, 0, { value: 20, displayValue: '20' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 2, col: 0 } });
      store.sort({ column: 0, direction: 'asc' });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.value).toBe(10);
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe(20);
      expect(state.sheets['sheet-1'].cells['2:0']?.value).toBe(30);
    });

    it('should sort descending', () => {
      const store = useWorkbookStore.getState();
      store.addSheet({ id: 'sheet-1', name: 'Sheet1', index: 0, cells: {} });
      store.updateCell('sheet-1', 0, 0, { value: 10, displayValue: '10' });
      store.updateCell('sheet-1', 1, 0, { value: 30, displayValue: '30' });
      store.updateCell('sheet-1', 2, 0, { value: 20, displayValue: '20' });
      store.setSelectionRange({ start: { row: 0, col: 0 }, end: { row: 2, col: 0 } });
      store.sort({ column: 0, direction: 'desc' });

      const state = useWorkbookStore.getState();
      expect(state.sheets['sheet-1'].cells['0:0']?.value).toBe(30);
      expect(state.sheets['sheet-1'].cells['1:0']?.value).toBe(20);
      expect(state.sheets['sheet-1'].cells['2:0']?.value).toBe(10);
    });
  });

  describe('toggleFilter', () => {
    it('should toggle filter enabled', () => {
      const store = useWorkbookStore.getState();
      expect(useWorkbookStore.getState().filterEnabled).toBe(false);

      store.toggleFilter();
      expect(useWorkbookStore.getState().filterEnabled).toBe(true);

      store.toggleFilter();
      expect(useWorkbookStore.getState().filterEnabled).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Subscription Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('subscriptions', () => {
    it('should notify subscribers on state change', () => {
      const listener = vi.fn();
      const unsubscribe = useWorkbookStore.subscribe(listener);

      useWorkbookStore.getState().setZoom(150);

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it('should support selector subscriptions', () => {
      const listener = vi.fn();
      const unsubscribe = useWorkbookStore.subscribe(
        (state) => state.zoom,
        listener
      );

      useWorkbookStore.getState().setZoom(150);
      expect(listener).toHaveBeenCalledWith(150, 100);

      unsubscribe();
    });
  });
});
