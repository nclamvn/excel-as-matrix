// Store test helpers
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import type { Sheet, CellData, CellRange, CellFormat } from '../../types/cell';

// Reset all stores to initial state
export function resetAllStores(): void {
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
    showFormulaBar: true,
    sortConfig: null,
    filterEnabled: false,
  });

  useSelectionStore.setState({
    selectedCell: null,
    selectionRange: null,
    editingCell: null,
    editingValue: '',
    selectionMode: 'cell',
    highlightedCells: [],
  });
}

// Create a test sheet with optional cells
export function createTestSheet(
  id: string = 'sheet-1',
  name: string = 'Sheet1',
  cells: Record<string, CellData> = {}
): Sheet {
  return {
    id,
    name,
    index: 0,
    cells,
    columnWidths: {},
    rowHeights: {},
  };
}

// Create a test cell data object
export function createTestCell(
  value: string | number | boolean | null = null,
  options: {
    formula?: string;
    displayValue?: string;
    format?: CellFormat;
  } = {}
): CellData {
  return {
    value,
    formula: options.formula ?? null,
    displayValue: options.displayValue ?? String(value ?? ''),
    format: options.format,
  };
}

// Setup a basic workbook for testing
export function setupTestWorkbook(
  sheetCount: number = 1,
  cellsPerSheet: { rows: number; cols: number } = { rows: 0, cols: 0 }
): void {
  const store = useWorkbookStore.getState();
  store.setWorkbook('test-workbook', 'Test Workbook');

  for (let i = 0; i < sheetCount; i++) {
    const cells: Record<string, CellData> = {};

    if (cellsPerSheet.rows > 0 && cellsPerSheet.cols > 0) {
      for (let row = 0; row < cellsPerSheet.rows; row++) {
        for (let col = 0; col < cellsPerSheet.cols; col++) {
          const key = `${row}:${col}`;
          cells[key] = createTestCell(`R${row}C${col}`);
        }
      }
    }

    store.addSheet(createTestSheet(`sheet-${i + 1}`, `Sheet${i + 1}`, cells));
  }
}

// Setup workbook with specific test data
export function setupWorkbookWithData(
  data: Array<{
    sheetId: string;
    sheetName: string;
    cells: Record<string, CellData>;
  }>
): void {
  const store = useWorkbookStore.getState();
  store.setWorkbook('test-workbook', 'Test Workbook');

  data.forEach((sheetData, index) => {
    const sheet = createTestSheet(
      sheetData.sheetId,
      sheetData.sheetName,
      sheetData.cells
    );
    sheet.index = index;
    store.addSheet(sheet);
  });
}

// Create cells from 2D array (like Excel ranges)
export function createCellsFromArray(
  data: (string | number | boolean | null)[][],
  startRow: number = 0,
  startCol: number = 0
): Record<string, CellData> {
  const cells: Record<string, CellData> = {};

  data.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const key = `${startRow + rowIndex}:${startCol + colIndex}`;
      cells[key] = createTestCell(value);
    });
  });

  return cells;
}

// Create cells with formulas
export function createCellsWithFormulas(
  formulas: Array<{
    row: number;
    col: number;
    formula: string;
    displayValue?: string;
  }>
): Record<string, CellData> {
  const cells: Record<string, CellData> = {};

  formulas.forEach(({ row, col, formula, displayValue }) => {
    const key = `${row}:${col}`;
    cells[key] = createTestCell(null, { formula, displayValue: displayValue ?? formula });
  });

  return cells;
}

// Set selection in workbook store
export function setTestSelection(
  row: number,
  col: number,
  endRow?: number,
  endCol?: number
): void {
  const store = useWorkbookStore.getState();
  const range: CellRange = {
    start: { row, col },
    end: { row: endRow ?? row, col: endCol ?? col },
  };

  store.setSelectedCell({ row, col });
  store.setSelectionRange(range);
}

// Get cell value from store
export function getCellValue(
  sheetId: string,
  row: number,
  col: number
): string | number | boolean | null {
  return useWorkbookStore.getState().getCellValue(sheetId, row, col);
}

// Get cell from store
export function getCell(sheetId: string, row: number, col: number): CellData | undefined {
  const sheet = useWorkbookStore.getState().sheets[sheetId];
  if (!sheet) return undefined;
  return sheet.cells[`${row}:${col}`];
}

// Update cell and wait for formula recalculation
export async function updateCellAndWait(
  sheetId: string,
  row: number,
  col: number,
  data: Partial<CellData>
): Promise<void> {
  const store = useWorkbookStore.getState();
  store.updateCell(sheetId, row, col, data);

  // Wait for async formula recalculation
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// Create a range for testing
export function createTestRange(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): CellRange {
  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  };
}

// Verify cell values match expected
export function verifyCellValues(
  sheetId: string,
  expected: Record<string, unknown>
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  Object.entries(expected).forEach(([key, expectedValue]) => {
    const [row, col] = key.split(':').map(Number);
    const actual = getCellValue(sheetId, row, col);

    if (actual !== expectedValue) {
      errors.push(`Cell ${key}: expected ${expectedValue}, got ${actual}`);
    }
  });

  return {
    passed: errors.length === 0,
    errors,
  };
}

// Count cells in a sheet
export function countCells(sheetId: string): number {
  const sheet = useWorkbookStore.getState().sheets[sheetId];
  if (!sheet) return 0;
  return Object.keys(sheet.cells).length;
}

// Get all cell keys in a sheet
export function getCellKeys(sheetId: string): string[] {
  const sheet = useWorkbookStore.getState().sheets[sheetId];
  if (!sheet) return [];
  return Object.keys(sheet.cells);
}

// Wait for store to update
export async function waitForStoreUpdate(ms: number = 10): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Batch update cells for testing
export function batchUpdateTestCells(
  sheetId: string,
  updates: Array<{ row: number; col: number; value: string | number | boolean | null }>
): void {
  const store = useWorkbookStore.getState();
  const cellUpdates = updates.map((u) => ({
    row: u.row,
    col: u.col,
    data: { value: u.value, displayValue: String(u.value ?? '') },
  }));
  store.batchUpdateCells(sheetId, cellUpdates);
}

// Simulate user typing in a cell
export function simulateCellInput(
  sheetId: string,
  row: number,
  col: number,
  value: string
): void {
  const store = useWorkbookStore.getState();
  const isFormula = value.startsWith('=');

  if (isFormula) {
    store.updateCell(sheetId, row, col, { formula: value });
  } else {
    const numValue = Number(value);
    const cellValue = isNaN(numValue) ? value : numValue;
    store.updateCell(sheetId, row, col, {
      value: cellValue,
      formula: null,
      displayValue: value,
    });
  }
}

// Get store snapshot for assertions
export function getStoreSnapshot(): ReturnType<typeof useWorkbookStore.getState> {
  return useWorkbookStore.getState();
}

// Type guard for checking if value is a number
export function isNumericCell(sheetId: string, row: number, col: number): boolean {
  const value = getCellValue(sheetId, row, col);
  return typeof value === 'number';
}

export default {
  resetAllStores,
  createTestSheet,
  createTestCell,
  setupTestWorkbook,
  setupWorkbookWithData,
  createCellsFromArray,
  createCellsWithFormulas,
  setTestSelection,
  getCellValue,
  getCell,
  updateCellAndWait,
  createTestRange,
  verifyCellValues,
  countCells,
  getCellKeys,
  waitForStoreUpdate,
  batchUpdateTestCells,
  simulateCellInput,
  getStoreSnapshot,
  isNumericCell,
};
