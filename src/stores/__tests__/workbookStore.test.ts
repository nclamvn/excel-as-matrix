import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkbookStore } from '../workbookStore';

describe('workbookStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useWorkbookStore.setState({
      workbookId: null,
      workbookName: 'Untitled Workbook',
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

  describe('setWorkbook', () => {
    it('should set workbook id and name', () => {
      const store = useWorkbookStore.getState();
      store.setWorkbook('wb-123', 'My Workbook');

      const state = useWorkbookStore.getState();
      expect(state.workbookId).toBe('wb-123');
      expect(state.workbookName).toBe('My Workbook');
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
  });

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
});
