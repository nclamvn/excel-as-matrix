import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CellData, Sheet, getCellKey, CellValue, CellFormat, CellRange } from '../types/cell';
import { formulaEngine, FormulaValue, CellDataProvider } from '../engine';
import { FillSeriesConfig, applyFillSeries } from '../utils/fillSeriesUtils';
import { useProtectionStore } from './protectionStore';
import { syncManager } from '../offline/SyncManager';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CellUpdate {
  row: number;
  col: number;
  data: Partial<CellData>;
}

interface ClipboardData {
  cells: Record<string, CellData>;
  range: CellRange;
  mode: 'copy' | 'cut';
  sourceSheetId: string;
}

interface HistorySnapshot {
  sheets: Record<string, Sheet>;
  timestamp: number;
}

interface SortConfig {
  column: number;
  direction: 'asc' | 'desc';
}

interface WorkbookState {
  // Core state
  workbookId: string | null;
  workbookName: string;
  sheets: Record<string, Sheet>;
  activeSheetId: string | null;
  sheetOrder: string[];
  isLoading: boolean;
  error: string | null;

  // Selection
  selectedCell: { row: number; col: number } | null;
  selectionRange: CellRange | null;

  // History
  history: HistorySnapshot[];
  historyIndex: number;

  // View
  zoom: number;
  showGridlines: boolean;
  showHeadings: boolean;
  showFormulaBar: boolean;

  // Clipboard
  clipboard: ClipboardData | null;

  // Sort & Filter
  sortConfig: SortConfig | null;
  filterEnabled: boolean;

  // === CORE ACTIONS ===
  setWorkbook: (workbookId: string, name: string) => void;
  addSheet: (sheet: Sheet) => void;
  setActiveSheet: (sheetId: string) => void;
  updateCell: (sheetId: string, row: number, col: number, data: Partial<CellData>) => void;
  batchUpdateCells: (sheetId: string, updates: CellUpdate[]) => void;
  clearCell: (sheetId: string, row: number, col: number) => void;
  setCellValue: (sheetId: string, row: number, col: number, value: CellValue) => void;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  setSelectionRange: (range: CellRange | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // === FORMATTING ACTIONS ===
  applyFormat: (format: Partial<CellFormat>) => void;
  applyFormatToRange: (range: CellRange, format: Partial<CellFormat>) => void;
  clearFormat: () => void;

  // === SHEET ACTIONS ===
  deleteSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  duplicateSheet: (sheetId: string) => void;
  moveSheet: (sheetId: string, direction: 'left' | 'right') => void;
  setTabColor: (sheetId: string, color: string) => void;

  // === ROW/COLUMN ACTIONS ===
  insertRow: (index?: number, count?: number) => void;
  deleteRow: (index?: number, count?: number) => void;
  insertColumn: (index?: number, count?: number) => void;
  deleteColumn: (index?: number, count?: number) => void;

  // === CLIPBOARD ACTIONS ===
  copy: () => void;
  cut: () => void;
  paste: (mode?: 'all' | 'values' | 'formulas' | 'formatting') => void;
  pasteSpecial: (options: {
    mode: 'all' | 'values' | 'formulas' | 'formatting';
    operation?: 'none' | 'add' | 'subtract' | 'multiply' | 'divide';
    skipBlanks?: boolean;
    transpose?: boolean;
  }) => void;

  // === HISTORY ACTIONS ===
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // === VIEW ACTIONS ===
  setZoom: (zoom: number) => void;
  setShowGridlines: (show: boolean) => void;
  setShowHeadings: (show: boolean) => void;
  setShowFormulaBar: (show: boolean) => void;

  // === SORT & FILTER ACTIONS ===
  sort: (config: SortConfig) => void;
  toggleFilter: () => void;

  // === FIND & REPLACE ===
  findAll: (query: string, options?: { matchCase?: boolean; wholeCell?: boolean }) => { row: number; col: number }[];
  replaceAll: (query: string, replacement: string, options?: { matchCase?: boolean; wholeCell?: boolean }) => number;

  // === FILL ACTIONS ===
  fillDown: () => void;
  fillRight: () => void;
  fillUp: () => void;
  fillLeft: () => void;
  fillSeries: (config: FillSeriesConfig) => void;

  // === HIDE/UNHIDE ACTIONS ===
  hideRow: (index?: number) => void;
  unhideRow: (index?: number) => void;
  hideColumn: (index?: number) => void;
  unhideColumn: (index?: number) => void;
  hideSheet: (sheetId: string) => void;
  unhideSheet: (sheetId: string) => void;

  // === AUTOFIT ACTIONS ===
  autoFitColumn: (index?: number) => void;
  autoFitRow: (index?: number) => void;
  setRowHeight: (index: number, height: number) => void;
  setColumnWidth: (index: number, width: number) => void;

  // === FREEZE PANES ===
  setFreezePane: (row: number, col: number) => void;
  clearFreezePane: () => void;

  // === COMMENTS ===
  addComment: (row: number, col: number, text: string) => void;
  editComment: (row: number, col: number, text: string) => void;
  deleteComment: (row: number, col: number) => void;
  getComment: (row: number, col: number) => { text: string; author: string; createdAt: string } | null;

  // === GETTERS ===
  getCellValue: (sheetId: string, row: number, col: number) => CellValue;
  getCellFormula: (sheetId: string, row: number, col: number) => string | null;
  getCellDisplayValue: (sheetId: string, row: number, col: number) => string;
  getCellFormat: (sheetId: string, row: number, col: number) => CellFormat | undefined;
  getActiveSheet: () => Sheet | null;

  // === FORMULA ENGINE ===
  recalculateCells: (cells: Array<{ sheetId: string; row: number; col: number }>) => void;
  evaluateFormula: (formula: string, sheetId: string, row: number, col: number) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialState = {
  workbookId: null as string | null,
  workbookName: '',
  sheets: {} as Record<string, Sheet>,
  activeSheetId: null as string | null,
  sheetOrder: [] as string[],
  isLoading: false,
  error: null as string | null,
  selectedCell: null as { row: number; col: number } | null,
  selectionRange: null as CellRange | null,
  history: [] as HistorySnapshot[],
  historyIndex: -1,
  zoom: 100,
  showGridlines: true,
  showHeadings: true,
  showFormulaBar: true,
  clipboard: null as ClipboardData | null,
  sortConfig: null as SortConfig | null,
  filterEnabled: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// FORMULA ADJUSTMENT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Adjust row references in formula (for Fill Down)
function adjustFormulaRow(formula: string, rowOffset: number): string {
  // Match cell references like A1, $A1 (but not $A$1)
  return formula.replace(/(\$?[A-Z]+)(\d+)/g, (match, col, row) => {
    // If both absolute ($A$1), don't adjust
    if (match.includes('$') && !col.includes('$')) {
      // Row is absolute, don't adjust
      return match;
    }
    const newRow = parseInt(row) + rowOffset;
    return `${col}${newRow}`;
  });
}

// Adjust column references in formula (for Fill Right)
function adjustFormulaCol(formula: string, colOffset: number): string {
  // Match cell references like A1, A$1 (but not $A$1)
  return formula.replace(/(\$?)([A-Z]+)(\$?\d+)/g, (match, prefix, col, row) => {
    // If column is absolute ($A), don't adjust
    if (prefix === '$') {
      return match;
    }
    // Convert column letters to number, add offset, convert back
    let colNum = 0;
    for (let i = 0; i < col.length; i++) {
      colNum = colNum * 26 + (col.charCodeAt(i) - 64);
    }
    colNum += colOffset;

    // Convert back to letters
    let newCol = '';
    while (colNum > 0) {
      const remainder = (colNum - 1) % 26;
      newCol = String.fromCharCode(65 + remainder) + newCol;
      colNum = Math.floor((colNum - 1) / 26);
    }

    return `${prefix}${newCol}${row}`;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useWorkbookStore = create<WorkbookState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ═══════════════════════════════════════════════════════════════════════
    // CORE ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    setWorkbook: (workbookId, name) => {
      set({
        workbookId,
        workbookName: name,
        sheets: {},
        sheetOrder: [],
        activeSheetId: null,
        history: [],
        historyIndex: -1,
      });
    },

    addSheet: (sheet) => {
      set((state) => {
        const newSheets = {
          ...state.sheets,
          [sheet.id]: { ...sheet, cells: sheet.cells || {} },
        };
        const newSheetOrder = state.sheetOrder.includes(sheet.id)
          ? state.sheetOrder
          : [...state.sheetOrder, sheet.id];
        const newActiveSheetId = state.activeSheetId || sheet.id;

        return {
          sheets: newSheets,
          sheetOrder: newSheetOrder,
          activeSheetId: newActiveSheetId,
        };
      });
    },

    setActiveSheet: (sheetId) => {
      set((state) => {
        if (state.sheets[sheetId]) {
          return { activeSheetId: sheetId };
        }
        return {};
      });
    },

    updateCell: (sheetId, row, col, data) => {
      const state = get();
      const sheet = state.sheets[sheetId];
      if (!sheet) return;

      const key = getCellKey(row, col);
      const existing = sheet.cells[key] || { value: null, formula: null, displayValue: '' };
      let newCell = { ...existing, ...data };

      // Check if we need to evaluate a formula
      const formula = data.formula ?? existing.formula;
      if (formula && formula.startsWith('=')) {
        // Create data provider for formula engine
        const dataProvider: CellDataProvider = {
          getCellValue: (sid: string, r: number, c: number): FormulaValue => {
            const s = state.sheets[sid];
            if (!s) return null;
            const cell = s.cells[getCellKey(r, c)];
            if (!cell) return null;
            // Return the raw value (number, string, etc.)
            return cell.value as FormulaValue;
          },
          getCellFormula: (sid: string, r: number, c: number): string | undefined => {
            const s = state.sheets[sid];
            if (!s) return undefined;
            const cell = s.cells[getCellKey(r, c)];
            return cell?.formula ?? undefined;
          },
        };

        // Calculate formula
        const result = formulaEngine.calculate(formula, sheetId, row, col, dataProvider);

        // Handle array results (spill behavior)
        const resultValue = result.value;
        if (Array.isArray(resultValue) && Array.isArray(resultValue[0])) {
          // Dynamic array — spill into adjacent cells
          const spillCells: Record<string, CellData> = {};
          const originKey = getCellKey(row, col);
          const arrayData = resultValue as unknown[][];

          // First, clear old spill cells from this origin
          for (const [ck, cd] of Object.entries(sheet.cells)) {
            if (cd.spillOrigin === originKey) {
              spillCells[ck] = { value: null, formula: null, displayValue: '', spillOrigin: undefined };
            }
          }

          // Spill new values
          for (let r = 0; r < arrayData.length; r++) {
            for (let c = 0; c < arrayData[r].length; c++) {
              const spillKey = getCellKey(row + r, col + c);
              if (r === 0 && c === 0) continue; // origin cell handled separately
              const sv = arrayData[r][c];
              spillCells[spillKey] = {
                value: sv as CellValue,
                formula: null,
                displayValue: String(sv ?? ''),
                spillOrigin: originKey,
              };
            }
          }

          // Origin cell gets first value
          const firstVal = arrayData[0]?.[0];
          newCell = {
            ...newCell,
            formula,
            value: firstVal as CellValue,
            displayValue: String(firstVal ?? ''),
          };

          // Apply spill cells to sheet
          const currentSheet = state.sheets[sheetId];
          if (currentSheet) {
            set({
              sheets: {
                ...state.sheets,
                [sheetId]: {
                  ...currentSheet,
                  cells: { ...currentSheet.cells, ...spillCells, [key]: newCell },
                },
              },
            });
          }
        } else {
          newCell = {
            ...newCell,
            formula,
            value: result.error ? result.displayValue : resultValue as CellValue,
            displayValue: result.displayValue,
          };
        }

        // Now recalculate dependent cells
        const dependentKeys = formulaEngine.getDependentCells(sheetId, row, col);
        if (dependentKeys.length > 0) {
          // Schedule recalculation after this update
          setTimeout(() => {
            get().recalculateCells(dependentKeys.map((k) => formulaEngine.parseCellKey(k)));
          }, 0);
        }
      } else {
        // Not a formula, just set display value
        newCell.displayValue = data.displayValue ?? String(data.value ?? existing.value ?? '');

        // Invalidate formula cache and recalculate dependents
        const dependentKeys = formulaEngine.invalidateCell(sheetId, row, col);
        if (dependentKeys.length > 0) {
          setTimeout(() => {
            get().recalculateCells(dependentKeys.map((k) => formulaEngine.parseCellKey(k)));
          }, 0);
        }
      }

      set({
        sheets: {
          ...state.sheets,
          [sheetId]: { ...sheet, cells: { ...sheet.cells, [key]: newCell } },
        },
      });
    },

    batchUpdateCells: (sheetId, updates) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};

        const newCells = { ...sheet.cells };
        for (const update of updates) {
          const key = getCellKey(update.row, update.col);
          const existing = newCells[key] || { value: null, formula: null, displayValue: '' };
          newCells[key] = { ...existing, ...update.data, displayValue: update.data.displayValue ?? existing.displayValue };
        }

        return {
          sheets: { ...state.sheets, [sheetId]: { ...sheet, cells: newCells } },
        };
      });
    },

    clearCell: (sheetId, row, col) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};

        const key = getCellKey(row, col);
        const { [key]: _, ...remainingCells } = sheet.cells;
        return {
          sheets: { ...state.sheets, [sheetId]: { ...sheet, cells: remainingCells } },
        };
      });
    },

    setCellValue: (sheetId, row, col, value) => {
      const state = get();
      const sheet = state.sheets[sheetId];
      if (!sheet) return;

      state.pushHistory();

      const key = getCellKey(row, col);
      const existing = sheet.cells[key] || { value: null, formula: null, displayValue: '' };
      const isFormula = typeof value === 'string' && value.startsWith('=');
      const newCell = { ...existing, value, displayValue: String(value ?? '') };
      if (isFormula) {
        newCell.formula = value as string;
      }

      set({
        sheets: {
          ...state.sheets,
          [sheetId]: { ...sheet, cells: { ...sheet.cells, [key]: newCell } },
        },
      });

      // Auto-save: persist locally + trigger sync
      const workbookId = state.workbookId;
      if (workbookId) {
        syncManager.saveLocally(
          workbookId,
          sheetId,
          row,
          col,
          value as string | number | boolean | null,
          isFormula ? (value as string) : null
        ).catch(() => { /* swallow — offline queue handles retries */ });
      }
    },

    setSelectedCell: (cell) => {
      set({
        selectedCell: cell,
        selectionRange: cell ? { start: cell, end: cell } : null,
      });
    },

    setSelectionRange: (range) => {
      set({
        selectionRange: range,
        selectedCell: range ? range.start : null,
      });
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),

    // ═══════════════════════════════════════════════════════════════════════
    // FORMATTING ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    applyFormat: (format) => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      // Protection guard
      if (!useProtectionStore.getState().canPerformAction(activeSheetId, 'formatCells')) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const { start, end } = selectionRange;
      const newCells = { ...sheet.cells };

      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const key = getCellKey(row, col);
          const existing = newCells[key] || { value: null, formula: null, displayValue: '' };
          newCells[key] = {
            ...existing,
            format: { ...existing.format, ...format },
          };
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    applyFormatToRange: (range, format) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const { start, end } = range;
      const newCells = { ...sheet.cells };

      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const key = getCellKey(row, col);
          const existing = newCells[key] || { value: null, formula: null, displayValue: '' };
          newCells[key] = {
            ...existing,
            format: { ...existing.format, ...format },
          };
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    clearFormat: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const { start, end } = selectionRange;
      const newCells = { ...sheet.cells };

      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const key = getCellKey(row, col);
          const existing = newCells[key];
          if (existing) {
            newCells[key] = { ...existing, format: undefined };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SHEET ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    deleteSheet: (sheetId) => {
      // Workbook structure protection
      const wbProtection = useProtectionStore.getState().workbookProtection;
      if (wbProtection.enabled && wbProtection.protectStructure) return;

      set((state) => {
        if (state.sheetOrder.length <= 1) return {}; // Keep at least one sheet

        const newSheetOrder = state.sheetOrder.filter(id => id !== sheetId);
        const { [sheetId]: _, ...newSheets } = state.sheets;

        let newActiveSheetId = state.activeSheetId;
        if (state.activeSheetId === sheetId) {
          const index = state.sheetOrder.indexOf(sheetId);
          newActiveSheetId = newSheetOrder[Math.max(0, index - 1)] || newSheetOrder[0];
        }

        return {
          sheets: newSheets,
          sheetOrder: newSheetOrder,
          activeSheetId: newActiveSheetId,
        };
      });
    },

    renameSheet: (sheetId, name) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};
        return {
          sheets: { ...state.sheets, [sheetId]: { ...sheet, name } },
        };
      });
    },

    duplicateSheet: (sheetId) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};

        const newId = `sheet-${Date.now()}`;
        const newSheet: Sheet = {
          ...sheet,
          id: newId,
          name: `${sheet.name} (Copy)`,
          cells: { ...sheet.cells },
          index: state.sheetOrder.length,
        };

        const index = state.sheetOrder.indexOf(sheetId);
        const newSheetOrder = [...state.sheetOrder];
        newSheetOrder.splice(index + 1, 0, newId);

        return {
          sheets: { ...state.sheets, [newId]: newSheet },
          sheetOrder: newSheetOrder,
          activeSheetId: newId,
        };
      });
    },

    moveSheet: (sheetId, direction) => {
      set((state) => {
        const index = state.sheetOrder.indexOf(sheetId);
        if (index === -1) return {};

        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= state.sheetOrder.length) return {};

        const newSheetOrder = [...state.sheetOrder];
        [newSheetOrder[index], newSheetOrder[newIndex]] = [newSheetOrder[newIndex], newSheetOrder[index]];

        return { sheetOrder: newSheetOrder };
      });
    },

    setTabColor: (sheetId, color) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};
        return {
          sheets: { ...state.sheets, [sheetId]: { ...sheet, tabColor: color } },
        };
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ROW/COLUMN ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    insertRow: (index, count = 1) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      // Protection guard
      if (!useProtectionStore.getState().canPerformAction(activeSheetId, 'insertRows')) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const insertAt = index ?? (selectedCell?.row ?? 0);
      const newCells: Record<string, CellData> = {};

      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [rowStr, colStr] = key.split(':');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);

        if (row >= insertAt) {
          newCells[getCellKey(row + count, col)] = cell;
        } else {
          newCells[key] = cell;
        }
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    deleteRow: (index, count = 1) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      // Protection guard
      if (!useProtectionStore.getState().canPerformAction(activeSheetId, 'deleteRows')) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const deleteAt = index ?? (selectedCell?.row ?? 0);
      const newCells: Record<string, CellData> = {};

      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [rowStr, colStr] = key.split(':');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);

        if (row < deleteAt) {
          newCells[key] = cell;
        } else if (row >= deleteAt + count) {
          newCells[getCellKey(row - count, col)] = cell;
        }
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    insertColumn: (index, count = 1) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      // Protection guard
      if (!useProtectionStore.getState().canPerformAction(activeSheetId, 'insertColumns')) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const insertAt = index ?? (selectedCell?.col ?? 0);
      const newCells: Record<string, CellData> = {};

      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [rowStr, colStr] = key.split(':');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);

        if (col >= insertAt) {
          newCells[getCellKey(row, col + count)] = cell;
        } else {
          newCells[key] = cell;
        }
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    deleteColumn: (index, count = 1) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      // Protection guard
      if (!useProtectionStore.getState().canPerformAction(activeSheetId, 'deleteColumns')) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const deleteAt = index ?? (selectedCell?.col ?? 0);
      const newCells: Record<string, CellData> = {};

      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [rowStr, colStr] = key.split(':');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);

        if (col < deleteAt) {
          newCells[key] = cell;
        } else if (col >= deleteAt + count) {
          newCells[getCellKey(row, col - count)] = cell;
        }
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CLIPBOARD ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    copy: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const cells: Record<string, CellData> = {};
      const { start, end } = selectionRange;

      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const key = getCellKey(row - start.row, col - start.col);
          const sourceKey = getCellKey(row, col);
          const cell = sheet.cells[sourceKey];
          if (cell) {
            cells[key] = { ...cell };
          }
        }
      }

      set({
        clipboard: {
          cells,
          range: selectionRange,
          mode: 'copy',
          sourceSheetId: activeSheetId,
        },
      });
    },

    cut: () => {
      get().copy();
      set((state) => ({
        clipboard: state.clipboard ? { ...state.clipboard, mode: 'cut' } : null,
      }));
    },

    paste: (mode = 'all') => {
      const state = get();
      const { clipboard, selectedCell, activeSheetId, sheets } = state;
      if (!clipboard || !selectedCell || !activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const newCells = { ...sheet.cells };
      const { row: startRow, col: startCol } = selectedCell;

      Object.entries(clipboard.cells).forEach(([key, cell]) => {
        const [relRow, relCol] = key.split(':').map(Number);
        const targetKey = getCellKey(startRow + relRow, startCol + relCol);
        const existing = newCells[targetKey] || { value: null, formula: null, displayValue: '' };

        let newCell: CellData;
        switch (mode) {
          case 'values':
            newCell = { ...existing, value: cell.value, formula: null, displayValue: String(cell.value ?? '') };
            break;
          case 'formulas':
            newCell = { ...existing, formula: cell.formula };
            break;
          case 'formatting':
            newCell = { ...existing, format: cell.format };
            break;
          default:
            newCell = { ...cell };
        }

        newCells[targetKey] = newCell;
      });

      // Clear source cells if cut
      if (clipboard.mode === 'cut') {
        const { start, end } = clipboard.range;
        const sourceSheet = sheets[clipboard.sourceSheetId];
        if (sourceSheet) {
          // If same sheet, delete source cells from newCells directly
          if (clipboard.sourceSheetId === activeSheetId) {
            for (let row = start.row; row <= end.row; row++) {
              for (let col = start.col; col <= end.col; col++) {
                delete newCells[getCellKey(row, col)];
              }
            }
            set({
              sheets: {
                ...sheets,
                [activeSheetId]: { ...sheet, cells: newCells },
              },
              clipboard: null,
            });
          } else {
            // Different sheets - delete from source, update target
            const sourceCells = { ...sourceSheet.cells };
            for (let row = start.row; row <= end.row; row++) {
              for (let col = start.col; col <= end.col; col++) {
                delete sourceCells[getCellKey(row, col)];
              }
            }
            set({
              sheets: {
                ...sheets,
                [clipboard.sourceSheetId]: { ...sourceSheet, cells: sourceCells },
                [activeSheetId]: { ...sheet, cells: newCells },
              },
              clipboard: null,
            });
          }
          return;
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    pasteSpecial: (options) => {
      const state = get();
      const { clipboard, selectedCell, activeSheetId, sheets } = state;
      if (!clipboard || !selectedCell || !activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const newCells = { ...sheet.cells };
      const { row: startRow, col: startCol } = selectedCell;
      const { mode, operation = 'none', skipBlanks = false, transpose = false } = options;

      // Get clipboard dimensions
      const clipboardEntries = Object.entries(clipboard.cells);
      if (clipboardEntries.length === 0) return;

      // Calculate clipboard bounds
      let maxRelRow = 0;
      let maxRelCol = 0;
      clipboardEntries.forEach(([key]) => {
        const [relRow, relCol] = key.split(':').map(Number);
        maxRelRow = Math.max(maxRelRow, relRow);
        maxRelCol = Math.max(maxRelCol, relCol);
      });

      clipboardEntries.forEach(([key, cell]) => {
        const [relRow, relCol] = key.split(':').map(Number);

        // Apply transpose if needed
        const targetRelRow = transpose ? relCol : relRow;
        const targetRelCol = transpose ? relRow : relCol;

        const targetRow = startRow + targetRelRow;
        const targetCol = startCol + targetRelCol;
        const targetKey = getCellKey(targetRow, targetCol);
        const existing = newCells[targetKey] || { value: null, formula: null, displayValue: '' };

        // Skip blanks if option is set
        if (skipBlanks && (cell.value === null || cell.value === '' || cell.value === undefined)) {
          return;
        }

        let newCell: CellData;
        switch (mode) {
          case 'values':
            let newValue = cell.value;

            // Apply operation if target has a numeric value
            if (operation !== 'none' && typeof existing.value === 'number' && typeof cell.value === 'number') {
              switch (operation) {
                case 'add':
                  newValue = existing.value + cell.value;
                  break;
                case 'subtract':
                  newValue = existing.value - cell.value;
                  break;
                case 'multiply':
                  newValue = existing.value * cell.value;
                  break;
                case 'divide':
                  newValue = cell.value !== 0 ? existing.value / cell.value : '#DIV/0!';
                  break;
              }
            }

            newCell = { ...existing, value: newValue, formula: null, displayValue: String(newValue ?? '') };
            break;

          case 'formulas':
            newCell = { ...existing, formula: cell.formula, value: cell.value, displayValue: cell.displayValue || String(cell.value ?? '') };
            break;

          case 'formatting':
            newCell = { ...existing, format: cell.format };
            break;

          default: // 'all'
            newCell = { ...cell };
        }

        newCells[targetKey] = newCell;
      });

      // Clear source cells if cut
      if (clipboard.mode === 'cut') {
        const { start, end } = clipboard.range;
        const sourceSheet = sheets[clipboard.sourceSheetId];
        if (sourceSheet) {
          // If same sheet, delete source cells from newCells directly
          if (clipboard.sourceSheetId === activeSheetId) {
            for (let row = start.row; row <= end.row; row++) {
              for (let col = start.col; col <= end.col; col++) {
                delete newCells[getCellKey(row, col)];
              }
            }
            set({
              sheets: {
                ...sheets,
                [activeSheetId]: { ...sheet, cells: newCells },
              },
              clipboard: null,
            });
          } else {
            // Different sheets - delete from source, update target
            const sourceCells = { ...sourceSheet.cells };
            for (let row = start.row; row <= end.row; row++) {
              for (let col = start.col; col <= end.col; col++) {
                delete sourceCells[getCellKey(row, col)];
              }
            }
            set({
              sheets: {
                ...sheets,
                [clipboard.sourceSheetId]: { ...sourceSheet, cells: sourceCells },
                [activeSheetId]: { ...sheet, cells: newCells },
              },
              clipboard: null,
            });
          }
          return;
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HISTORY ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    pushHistory: () => {
      set((state) => {
        const snapshot: HistorySnapshot = {
          sheets: JSON.parse(JSON.stringify(state.sheets)),
          timestamp: Date.now(),
        };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);

        // Limit history size
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    undo: () => {
      set((state) => {
        if (state.historyIndex <= 0) return {};

        const newIndex = state.historyIndex - 1;
        const snapshot = state.history[newIndex];

        return {
          sheets: JSON.parse(JSON.stringify(snapshot.sheets)),
          historyIndex: newIndex,
        };
      });
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return {};

        const newIndex = state.historyIndex + 1;
        const snapshot = state.history[newIndex];

        return {
          sheets: JSON.parse(JSON.stringify(snapshot.sheets)),
          historyIndex: newIndex,
        };
      });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    setZoom: (zoom) => set({ zoom: Math.min(400, Math.max(25, zoom)) }),
    setShowGridlines: (show) => set({ showGridlines: show }),
    setShowHeadings: (show) => set({ showHeadings: show }),
    setShowFormulaBar: (show) => set({ showFormulaBar: show }),

    // ═══════════════════════════════════════════════════════════════════════
    // SORT & FILTER
    // ═══════════════════════════════════════════════════════════════════════

    sort: (config) => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      state.pushHistory();

      const { start, end } = selectionRange;
      const rows: { key: number; data: Record<number, CellData> }[] = [];

      // Collect rows
      for (let row = start.row; row <= end.row; row++) {
        const rowData: Record<number, CellData> = {};
        for (let col = start.col; col <= end.col; col++) {
          const key = getCellKey(row, col);
          const cell = sheet.cells[key];
          if (cell) rowData[col] = cell;
        }
        rows.push({ key: row, data: rowData });
      }

      // Sort
      rows.sort((a, b) => {
        const cellA = a.data[config.column];
        const cellB = b.data[config.column];
        const valA = cellA?.value ?? '';
        const valB = cellB?.value ?? '';

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        return config.direction === 'asc' ? comparison : -comparison;
      });

      // Rewrite cells
      const newCells = { ...sheet.cells };
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          delete newCells[getCellKey(row, col)];
        }
      }

      rows.forEach((rowData, index) => {
        const targetRow = start.row + index;
        Object.entries(rowData.data).forEach(([col, cell]) => {
          newCells[getCellKey(targetRow, parseInt(col))] = cell;
        });
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
        sortConfig: config,
      });
    },

    toggleFilter: () => set((state) => ({ filterEnabled: !state.filterEnabled })),

    // ═══════════════════════════════════════════════════════════════════════
    // FILL ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    fillDown: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { start, end } = selectionRange;
      if (start.row === end.row) return; // Need at least 2 rows

      state.pushHistory();

      const newCells = { ...sheet.cells };

      // Copy first row's values to all other rows in selection
      for (let col = start.col; col <= end.col; col++) {
        const sourceKey = getCellKey(start.row, col);
        const sourceCell = sheet.cells[sourceKey];

        if (sourceCell) {
          for (let row = start.row + 1; row <= end.row; row++) {
            const targetKey = getCellKey(row, col);
            newCells[targetKey] = {
              ...sourceCell,
              // Adjust formula references if it's a formula
              formula: sourceCell.formula ? adjustFormulaRow(sourceCell.formula, row - start.row) : null,
            };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    fillRight: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { start, end } = selectionRange;
      if (start.col === end.col) return; // Need at least 2 columns

      state.pushHistory();

      const newCells = { ...sheet.cells };

      // Copy first column's values to all other columns in selection
      for (let row = start.row; row <= end.row; row++) {
        const sourceKey = getCellKey(row, start.col);
        const sourceCell = sheet.cells[sourceKey];

        if (sourceCell) {
          for (let col = start.col + 1; col <= end.col; col++) {
            const targetKey = getCellKey(row, col);
            newCells[targetKey] = {
              ...sourceCell,
              // Adjust formula references if it's a formula
              formula: sourceCell.formula ? adjustFormulaCol(sourceCell.formula, col - start.col) : null,
            };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    fillUp: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { start, end } = selectionRange;
      if (start.row === end.row) return; // Need at least 2 rows

      state.pushHistory();

      const newCells = { ...sheet.cells };

      // Copy last row's values to all other rows in selection (from bottom to top)
      for (let col = start.col; col <= end.col; col++) {
        const sourceKey = getCellKey(end.row, col);
        const sourceCell = sheet.cells[sourceKey];

        if (sourceCell) {
          for (let row = end.row - 1; row >= start.row; row--) {
            const targetKey = getCellKey(row, col);
            newCells[targetKey] = {
              ...sourceCell,
              // Adjust formula references if it's a formula
              formula: sourceCell.formula ? adjustFormulaRow(sourceCell.formula, row - end.row) : null,
            };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    fillLeft: () => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { start, end } = selectionRange;
      if (start.col === end.col) return; // Need at least 2 columns

      state.pushHistory();

      const newCells = { ...sheet.cells };

      // Copy last column's values to all other columns in selection (from right to left)
      for (let row = start.row; row <= end.row; row++) {
        const sourceKey = getCellKey(row, end.col);
        const sourceCell = sheet.cells[sourceKey];

        if (sourceCell) {
          for (let col = end.col - 1; col >= start.col; col--) {
            const targetKey = getCellKey(row, col);
            newCells[targetKey] = {
              ...sourceCell,
              // Adjust formula references if it's a formula
              formula: sourceCell.formula ? adjustFormulaCol(sourceCell.formula, col - end.col) : null,
            };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    fillSeries: (config: FillSeriesConfig) => {
      const state = get();
      const { activeSheetId, selectionRange, sheets } = state;
      if (!activeSheetId || !selectionRange) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { start, end } = selectionRange;

      state.pushHistory();

      const newCells = { ...sheet.cells };

      if (config.direction === 'columns') {
        // Fill down columns
        for (let col = start.col; col <= end.col; col++) {
          // Get source values from the first cell(s)
          const sourceValues: CellValue[] = [];
          const sourceCell = sheet.cells[getCellKey(start.row, col)];
          if (sourceCell) {
            sourceValues.push(sourceCell.value);
          }

          if (sourceValues.length === 0) continue;

          // Calculate how many cells to fill
          const count = end.row - start.row;
          if (count <= 0) continue;

          // Generate fill values
          const fillValues = applyFillSeries(sourceValues, count, config);

          // Apply fill values
          for (let i = 0; i < count; i++) {
            const targetKey = getCellKey(start.row + 1 + i, col);
            const existing = newCells[targetKey] || { value: null, formula: null, displayValue: '' };
            newCells[targetKey] = {
              ...existing,
              value: fillValues[i],
              displayValue: String(fillValues[i] ?? ''),
              formula: null,
            };
          }
        }
      } else {
        // Fill across rows
        for (let row = start.row; row <= end.row; row++) {
          // Get source values from the first cell(s)
          const sourceValues: CellValue[] = [];
          const sourceCell = sheet.cells[getCellKey(row, start.col)];
          if (sourceCell) {
            sourceValues.push(sourceCell.value);
          }

          if (sourceValues.length === 0) continue;

          // Calculate how many cells to fill
          const count = end.col - start.col;
          if (count <= 0) continue;

          // Generate fill values
          const fillValues = applyFillSeries(sourceValues, count, config);

          // Apply fill values
          for (let i = 0; i < count; i++) {
            const targetKey = getCellKey(row, start.col + 1 + i);
            const existing = newCells[targetKey] || { value: null, formula: null, displayValue: '' };
            newCells[targetKey] = {
              ...existing,
              value: fillValues[i],
              displayValue: String(fillValues[i] ?? ''),
              formula: null,
            };
          }
        }
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HIDE/UNHIDE ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    hideRow: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, selectionRange, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const hiddenRows = new Set(sheet.hiddenRows || []);

      if (index !== undefined) {
        hiddenRows.add(index);
      } else if (selectionRange) {
        // Hide all rows in selection
        for (let row = selectionRange.start.row; row <= selectionRange.end.row; row++) {
          hiddenRows.add(row);
        }
      } else if (selectedCell) {
        hiddenRows.add(selectedCell.row);
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, hiddenRows } },
      });
    },

    unhideRow: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, selectionRange, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const hiddenRows = new Set(sheet.hiddenRows || []);

      if (index !== undefined) {
        hiddenRows.delete(index);
      } else if (selectionRange) {
        // Unhide all rows in/around selection
        for (let row = Math.max(0, selectionRange.start.row - 1); row <= selectionRange.end.row + 1; row++) {
          hiddenRows.delete(row);
        }
      } else if (selectedCell) {
        // Unhide rows adjacent to selection
        hiddenRows.delete(selectedCell.row);
        hiddenRows.delete(selectedCell.row - 1);
        hiddenRows.delete(selectedCell.row + 1);
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, hiddenRows } },
      });
    },

    hideColumn: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, selectionRange, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const hiddenColumns = new Set(sheet.hiddenColumns || []);

      if (index !== undefined) {
        hiddenColumns.add(index);
      } else if (selectionRange) {
        // Hide all columns in selection
        for (let col = selectionRange.start.col; col <= selectionRange.end.col; col++) {
          hiddenColumns.add(col);
        }
      } else if (selectedCell) {
        hiddenColumns.add(selectedCell.col);
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, hiddenColumns } },
      });
    },

    unhideColumn: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, selectionRange, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const hiddenColumns = new Set(sheet.hiddenColumns || []);

      if (index !== undefined) {
        hiddenColumns.delete(index);
      } else if (selectionRange) {
        // Unhide all columns in/around selection
        for (let col = Math.max(0, selectionRange.start.col - 1); col <= selectionRange.end.col + 1; col++) {
          hiddenColumns.delete(col);
        }
      } else if (selectedCell) {
        // Unhide columns adjacent to selection
        hiddenColumns.delete(selectedCell.col);
        hiddenColumns.delete(selectedCell.col - 1);
        hiddenColumns.delete(selectedCell.col + 1);
      }

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, hiddenColumns } },
      });
    },

    hideSheet: (sheetId) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};

        // Can't hide if it's the only visible sheet
        const visibleSheets = Object.values(state.sheets).filter((s) => !s.hidden);
        if (visibleSheets.length <= 1) return {};

        return {
          sheets: {
            ...state.sheets,
            [sheetId]: { ...sheet, hidden: true },
          },
          // If hiding active sheet, switch to another
          activeSheetId:
            state.activeSheetId === sheetId
              ? state.sheetOrder.find((id) => id !== sheetId && !state.sheets[id]?.hidden) || state.activeSheetId
              : state.activeSheetId,
        };
      });
    },

    unhideSheet: (sheetId) => {
      set((state) => {
        const sheet = state.sheets[sheetId];
        if (!sheet) return {};

        const { hidden: _, ...restSheet } = sheet as typeof sheet & { hidden?: boolean };

        return {
          sheets: {
            ...state.sheets,
            [sheetId]: restSheet,
          },
        };
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AUTOFIT ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    autoFitColumn: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const colIndex = index ?? selectedCell?.col;
      if (colIndex === undefined) return;

      // Calculate max content width for the column
      let maxWidth = 64; // Minimum width
      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [, colStr] = key.split(':');
        if (parseInt(colStr) === colIndex) {
          const contentLength = String(cell.displayValue || cell.value || '').length;
          const estimatedWidth = Math.max(64, Math.min(400, contentLength * 8 + 16));
          maxWidth = Math.max(maxWidth, estimatedWidth);
        }
      });

      const columnWidths = { ...sheet.columnWidths, [colIndex]: maxWidth };

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, columnWidths } },
      });
    },

    autoFitRow: (index) => {
      const state = get();
      const { activeSheetId, selectedCell, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const rowIndex = index ?? selectedCell?.row;
      if (rowIndex === undefined) return;

      // For now, set a default height (real autofit needs DOM measurement)
      const rowHeights = { ...sheet.rowHeights, [rowIndex]: 24 };

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, rowHeights } },
      });
    },

    setRowHeight: (index, height) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const rowHeights = { ...sheet.rowHeights, [index]: Math.max(12, Math.min(400, height)) };

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, rowHeights } },
      });
    },

    setColumnWidth: (index, width) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const columnWidths = { ...sheet.columnWidths, [index]: Math.max(20, Math.min(500, width)) };

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, columnWidths } },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FREEZE PANES
    // ═══════════════════════════════════════════════════════════════════════

    setFreezePane: (row, col) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      set({
        sheets: {
          ...sheets,
          [activeSheetId]: { ...sheet, freezePane: { row, col } },
        },
      });
    },

    clearFreezePane: () => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const { freezePane: _, ...restSheet } = sheet;

      set({
        sheets: { ...sheets, [activeSheetId]: restSheet as typeof sheet },
      });
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COMMENTS
    // ═══════════════════════════════════════════════════════════════════════

    addComment: (row, col, text) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const key = getCellKey(row, col);
      const existing = sheet.cells[key] || { value: null, formula: null, displayValue: '' };

      const newCell = {
        ...existing,
        comment: {
          id: `comment-${Date.now()}`,
          text,
          author: 'User',
          createdAt: new Date().toISOString(),
        },
      };

      set({
        sheets: {
          ...sheets,
          [activeSheetId]: { ...sheet, cells: { ...sheet.cells, [key]: newCell } },
        },
      });
    },

    editComment: (row, col, text) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const key = getCellKey(row, col);
      const cell = sheet.cells[key];
      if (!cell?.comment) return;

      const newCell = {
        ...cell,
        comment: { ...cell.comment, text },
      };

      set({
        sheets: {
          ...sheets,
          [activeSheetId]: { ...sheet, cells: { ...sheet.cells, [key]: newCell } },
        },
      });
    },

    deleteComment: (row, col) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return;

      const sheet = sheets[activeSheetId];
      if (!sheet) return;

      const key = getCellKey(row, col);
      const cell = sheet.cells[key];
      if (!cell) return;

      const { comment: _, ...restCell } = cell;

      set({
        sheets: {
          ...sheets,
          [activeSheetId]: { ...sheet, cells: { ...sheet.cells, [key]: restCell as typeof cell } },
        },
      });
    },

    getComment: (row, col) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return null;

      const sheet = sheets[activeSheetId];
      if (!sheet) return null;

      const key = getCellKey(row, col);
      const cell = sheet.cells[key];

      if (cell?.comment) {
        return {
          text: cell.comment.text,
          author: cell.comment.author,
          createdAt: cell.comment.createdAt,
        };
      }

      return null;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FIND & REPLACE
    // ═══════════════════════════════════════════════════════════════════════

    findAll: (query, options = {}) => {
      const state = get();
      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return [];

      const sheet = sheets[activeSheetId];
      if (!sheet) return [];

      const results: { row: number; col: number }[] = [];
      const { matchCase = false, wholeCell = false } = options;
      const searchQuery = matchCase ? query : query.toLowerCase();

      Object.entries(sheet.cells).forEach(([key, cell]) => {
        const [rowStr, colStr] = key.split(':');
        const value = String(cell.value ?? '');
        const searchValue = matchCase ? value : value.toLowerCase();

        let match = false;
        if (wholeCell) {
          match = searchValue === searchQuery;
        } else {
          match = searchValue.includes(searchQuery);
        }

        if (match) {
          results.push({ row: parseInt(rowStr), col: parseInt(colStr) });
        }
      });

      return results.sort((a, b) => a.row - b.row || a.col - b.col);
    },

    replaceAll: (query, replacement, options = {}) => {
      const state = get();
      const results = state.findAll(query, options);

      if (results.length === 0) return 0;

      const { activeSheetId, sheets } = state;
      if (!activeSheetId) return 0;

      const sheet = sheets[activeSheetId];
      if (!sheet) return 0;

      state.pushHistory();

      const { matchCase = false, wholeCell = false } = options;
      const newCells = { ...sheet.cells };

      results.forEach(({ row, col }) => {
        const key = getCellKey(row, col);
        const cell = newCells[key];
        if (!cell) return;

        let newValue: string;
        if (wholeCell) {
          newValue = replacement;
        } else {
          const regex = new RegExp(query, matchCase ? 'g' : 'gi');
          newValue = String(cell.value).replace(regex, replacement);
        }

        newCells[key] = { ...cell, value: newValue, displayValue: newValue };
      });

      set({
        sheets: { ...sheets, [activeSheetId]: { ...sheet, cells: newCells } },
      });

      return results.length;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════

    getCellValue: (sheetId, row, col) => {
      const sheet = get().sheets[sheetId];
      if (!sheet) return null;
      return sheet.cells[getCellKey(row, col)]?.value ?? null;
    },

    getCellFormula: (sheetId, row, col) => {
      const sheet = get().sheets[sheetId];
      if (!sheet) return null;
      return sheet.cells[getCellKey(row, col)]?.formula ?? null;
    },

    getCellDisplayValue: (sheetId, row, col) => {
      const sheet = get().sheets[sheetId];
      if (!sheet) return '';
      return sheet.cells[getCellKey(row, col)]?.displayValue ?? '';
    },

    getCellFormat: (sheetId, row, col) => {
      const sheet = get().sheets[sheetId];
      if (!sheet) return undefined;
      return sheet.cells[getCellKey(row, col)]?.format;
    },

    getActiveSheet: () => {
      const state = get();
      if (!state.activeSheetId) return null;
      return state.sheets[state.activeSheetId] ?? null;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FORMULA ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    recalculateCells: (cells) => {
      const state = get();

      // Create data provider
      const dataProvider: CellDataProvider = {
        getCellValue: (sid: string, r: number, c: number): FormulaValue => {
          const s = state.sheets[sid];
          if (!s) return null;
          const cell = s.cells[getCellKey(r, c)];
          if (!cell) return null;
          return cell.value as FormulaValue;
        },
        getCellFormula: (sid: string, r: number, c: number): string | undefined => {
          const s = state.sheets[sid];
          if (!s) return undefined;
          const cell = s.cells[getCellKey(r, c)];
          return cell?.formula ?? undefined;
        },
      };

      // Collect updates
      const updates: Record<string, Record<string, CellData>> = {};

      for (const { sheetId, row, col } of cells) {
        const sheet = state.sheets[sheetId];
        if (!sheet) continue;

        const key = getCellKey(row, col);
        const cell = sheet.cells[key];
        if (!cell || !cell.formula || !cell.formula.startsWith('=')) continue;

        // Recalculate
        const result = formulaEngine.calculate(cell.formula, sheetId, row, col, dataProvider);

        // Store update
        if (!updates[sheetId]) {
          updates[sheetId] = {};
        }
        updates[sheetId][key] = {
          ...cell,
          value: result.error ? result.displayValue : result.value as CellValue,
          displayValue: result.displayValue,
        };
      }

      // Apply all updates at once
      if (Object.keys(updates).length > 0) {
        set((prevState) => {
          const newSheets = { ...prevState.sheets };
          for (const [sheetId, cellUpdates] of Object.entries(updates)) {
            const sheet = newSheets[sheetId];
            if (sheet) {
              newSheets[sheetId] = {
                ...sheet,
                cells: { ...sheet.cells, ...cellUpdates },
              };
            }
          }
          return { sheets: newSheets };
        });
      }
    },

    evaluateFormula: (formula, sheetId, row, col) => {
      const state = get();

      const dataProvider: CellDataProvider = {
        getCellValue: (sid: string, r: number, c: number): FormulaValue => {
          const s = state.sheets[sid];
          if (!s) return null;
          const cell = s.cells[getCellKey(r, c)];
          if (!cell) return null;
          return cell.value as FormulaValue;
        },
        getCellFormula: (sid: string, r: number, c: number): string | undefined => {
          const s = state.sheets[sid];
          if (!s) return undefined;
          const cell = s.cells[getCellKey(r, c)];
          return cell?.formula ?? undefined;
        },
      };

      const result = formulaEngine.calculate(formula, sheetId, row, col, dataProvider);
      return result.displayValue;
    },
  }))
);
