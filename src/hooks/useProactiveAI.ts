// =============================================================================
// USE PROACTIVE AI HOOK — Integrates Proactive Engine with Workbook
// =============================================================================

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import {
  proactiveEngine,
  ProactiveSuggestion,
  ScanResult,
} from '../proactive';
import type { SheetData, CellData, ColumnInfo } from '../proactive/types';

// Constants for grid size estimation
const DEFAULT_ROWS = 100;

// Detect the actual column count used in the sheet (up to 10 consecutive empty columns)
function detectColCount(cells: Record<string, unknown> | undefined): number {
  if (!cells) return 26;
  let maxCol = 0;
  for (const key of Object.keys(cells)) {
    const c = parseInt(key.split(':')[1]);
    if (c > maxCol) maxCol = c;
  }
  return Math.max(26, maxCol + 1);
}

/**
 * Hook to integrate Proactive AI Engine with the workbook
 * Handles:
 * - Starting/stopping the engine based on settings
 * - Providing sheet data to the scanner
 * - Registering callbacks for actions
 * - Recording user actions for pattern detection
 */
export function useProactiveAI() {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Get workbook state and actions
  const sheets = useWorkbookStore(state => state.sheets);
  const activeSheetId = useWorkbookStore(state => state.activeSheetId);
  const updateCell = useWorkbookStore(state => state.updateCell);

  // Get current sheet
  const currentSheet = useMemo(() => {
    return activeSheetId ? sheets[activeSheetId] : null;
  }, [sheets, activeSheetId]);

  /**
   * Get current sheet data in the format expected by Proactive Engine
   */
  const getSheetData = useCallback((): SheetData | null => {
    if (!currentSheet || !activeSheetId) return null;

    // Build headers from first row
    const colCount = detectColCount(currentSheet.cells);
    const headers: ColumnInfo[] = [];
    for (let col = 0; col < colCount; col++) {
      const cellKey = `0:${col}`;
      const cell = currentSheet.cells?.[cellKey];
      const colLetter = colToLetter(col);
      headers.push({
        index: col,
        letter: colLetter,
        name: cell?.value?.toString() || colLetter,
        type: 'text',
        hasFormulas: false,
        uniqueValues: 0,
        emptyCount: 0,
      });
    }

    // Build cells 2D array from Record<string, CellData>
    const cells: CellData[][] = [];
    for (let row = 0; row < DEFAULT_ROWS; row++) {
      cells[row] = [];
      for (let col = 0; col < colCount; col++) {
        const cellKey = `${row}:${col}`;
        const cell = currentSheet.cells?.[cellKey];
        const ref = `${colToLetter(col)}${row + 1}`;

        cells[row][col] = {
          ref,
          row,
          col,
          value: cell?.value ?? null,
          formula: cell?.formula || undefined,
          displayValue: cell?.value?.toString(),
          type: getCellType(cell?.value),
        };
      }
    }

    return {
      sheetId: currentSheet.id,
      sheetName: currentSheet.name,
      cells,
      headers,
      rowCount: DEFAULT_ROWS,
      colCount,
    };
  }, [currentSheet, activeSheetId]);

  /**
   * Handle cell update callback from Proactive Engine
   */
  const handleCellUpdate = useCallback((cellRef: string, value: unknown) => {
    if (!activeSheetId) return;

    const { row, col } = parseRef(cellRef);
    updateCell(activeSheetId, row, col, { value: value as string | number | boolean | null });
  }, [activeSheetId, updateCell]);

  /**
   * Handle row delete callback from Proactive Engine
   */
  const handleRowDelete = useCallback((rows: number[]) => {
    if (!activeSheetId) return;
    // Mark cells as empty for deleted rows
    const sortedRows = [...rows].sort((a, b) => b - a);
    for (const row of sortedRows) {
      const deleteColCount = detectColCount(useWorkbookStore.getState().sheets[activeSheetId]?.cells);
      for (let col = 0; col < deleteColCount; col++) {
        updateCell(activeSheetId, row, col, { value: null });
      }
    }
  }, [activeSheetId, updateCell]);

  /**
   * Handle format apply callback from Proactive Engine
   */
  const handleFormatApply = useCallback((cells: string[], format: unknown) => {
    if (!activeSheetId || !cells.length) return;

    // Parse cell references and find the range
    const parsedCells = cells.map(cell => {
      const match = cell.match(/^([A-Z]+)(\d+)$/i);
      if (!match) return null;

      let col = 0;
      const colStr = match[1].toUpperCase();
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
      }
      return { row: parseInt(match[2]) - 1, col: col - 1 };
    }).filter(Boolean) as { row: number; col: number }[];

    if (parsedCells.length === 0) return;

    // Find bounding range
    const minRow = Math.min(...parsedCells.map(c => c.row));
    const maxRow = Math.max(...parsedCells.map(c => c.row));
    const minCol = Math.min(...parsedCells.map(c => c.col));
    const maxCol = Math.max(...parsedCells.map(c => c.col));

    // Apply format to the range
    const { applyFormatToRange } = useWorkbookStore.getState();
    applyFormatToRange(
      { start: { row: minRow, col: minCol }, end: { row: maxRow, col: maxCol } },
      format as Record<string, unknown>
    );
  }, [activeSheetId]);

  /**
   * Setup event listener for scan results
   */
  useEffect(() => {
    const unsubscribe = proactiveEngine.on((event) => {
      switch (event.type) {
        case 'scan_started':
          setIsScanning(true);
          break;
        case 'scan_completed':
          setIsScanning(false);
          if ('result' in event && event.result) {
            setLastScanResult(event.result);
            setSuggestions(proactiveEngine.getSuggestions());
          }
          break;
        case 'suggestion_added':
        case 'suggestion_dismissed':
          setSuggestions(proactiveEngine.getSuggestions());
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Start/stop engine based on data availability
   */
  useEffect(() => {
    if (currentSheet && activeSheetId) {
      // Register callbacks
      proactiveEngine.registerCallbacks({
        onCellUpdate: handleCellUpdate,
        onRowDelete: handleRowDelete,
        onFormatApply: handleFormatApply,
      });

      // Start the engine with data callback
      proactiveEngine.start(getSheetData);
    }

    return () => {
      proactiveEngine.stop();
    };
  }, [currentSheet, activeSheetId, getSheetData, handleCellUpdate, handleRowDelete, handleFormatApply]);

  /**
   * Record user action for pattern detection
   */
  const recordAction = useCallback((actionType: string, cellRef?: string, value?: unknown, formula?: string) => {
    proactiveEngine.recordAction({
      type: actionType,
      timestamp: Date.now(),
      cellRef,
      value,
      formula,
    });
  }, []);

  /**
   * Execute a suggestion action
   */
  const executeAction = useCallback(async (suggestionId: string, actionId: string) => {
    const result = await proactiveEngine.executeAction(suggestionId, actionId);
    setSuggestions(proactiveEngine.getSuggestions());
    return result;
  }, []);

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback((id: string) => {
    proactiveEngine.dismissSuggestion(id);
    setSuggestions(proactiveEngine.getSuggestions());
  }, []);

  /**
   * Trigger a manual scan
   */
  const triggerScan = useCallback(async () => {
    const data = getSheetData();
    if (data) {
      const result = await proactiveEngine.runScan(data);
      setLastScanResult(result);
      setSuggestions(proactiveEngine.getSuggestions());
      return result;
    }
    return null;
  }, [getSheetData]);

  return {
    // State
    suggestions,
    lastScanResult,
    isScanning,

    // Actions
    recordAction,
    executeAction,
    dismissSuggestion,
    triggerScan,

    // Configuration
    getConfig: proactiveEngine.getConfig.bind(proactiveEngine),
    updateConfig: proactiveEngine.updateConfig.bind(proactiveEngine),
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert column index to letter
 */
function colToLetter(col: number): string {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Parse cell reference to row and column
 */
function parseRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 0, col: 0 };

  const colStr = match[1].toUpperCase();
  const row = parseInt(match[2], 10) - 1;

  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + colStr.charCodeAt(i) - 64;
  }
  col -= 1;

  return { row, col };
}

/**
 * Get cell type from value
 */
function getCellType(value: unknown): CellData['type'] {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string') {
    // Check for date string
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    // Check for error
    if (/^#(DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|NULL!)$/.test(value)) return 'error';
  }
  return 'text';
}

export default useProactiveAI;
