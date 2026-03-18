// =============================================================================
// USE NL FORMULA CONTEXT — Build CellContext for NL Formula engine
// =============================================================================

import { useMemo } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import type { CellContext, ColumnHeader, DataRange } from '../nlformula/types';
import { colToLetter, getCellKey } from '../types/cell';

/**
 * Hook to build CellContext for NL Formula engine
 * Extracts headers from first row and determines data range
 */
export function useNLFormulaContext(
  row: number,
  col: number
): CellContext | null {
  const sheets = useWorkbookStore(state => state.sheets);
  const activeSheetId = useWorkbookStore(state => state.activeSheetId);

  return useMemo(() => {
    if (!activeSheetId || !sheets[activeSheetId]) return null;

    const sheet = sheets[activeSheetId];
    const cellRef = `${colToLetter(col)}${row + 1}`;

    // Extract headers from first row (row 0)
    // Dynamic detection: scan until 10 consecutive empty columns
    const headers: ColumnHeader[] = [];
    let emptyStreak = 0;
    const maxScan = 500; // safety limit

    for (let c = 0; c < maxScan && emptyStreak < 10; c++) {
      const cellKey = getCellKey(0, c);
      const cell = sheet.cells[cellKey];
      const headerValue = cell?.displayValue || cell?.value;

      if (headerValue && typeof headerValue === 'string' && headerValue.trim()) {
        emptyStreak = 0;
        // Get sample values from column (rows 1-10)
        const sampleValues: unknown[] = [];
        for (let r = 1; r <= 10; r++) {
          const sampleKey = getCellKey(r, c);
          const sampleCell = sheet.cells[sampleKey];
          if (sampleCell?.value !== null && sampleCell?.value !== undefined) {
            sampleValues.push(sampleCell.value);
          }
        }

        // Infer data type from samples
        const dataType = inferDataType(sampleValues);

        headers.push({
          col: c,
          colLetter: colToLetter(c),
          name: headerValue.trim(),
          dataType,
          sampleValues,
        });
      } else {
        emptyStreak++;
      }
    }

    // Determine data range (find last used row and column)
    let maxRow = 0;
    let maxCol = 0;

    for (const key of Object.keys(sheet.cells)) {
      const [r, c] = key.split(':').map(Number);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }

    const dataRange: DataRange = {
      startRow: 0,
      endRow: Math.max(maxRow, 100),
      startCol: 0,
      endCol: Math.max(maxCol, 26),
      hasHeaders: headers.length > 0,
      rowCount: maxRow + 1,
      colCount: maxCol + 1,
    };

    return {
      cellRef,
      sheetId: sheet.id,
      sheetName: sheet.name,
      headers,
      dataRange,
    };
  }, [sheets, activeSheetId, row, col]);
}

/**
 * Infer data type from sample values
 */
function inferDataType(
  samples: unknown[]
): 'number' | 'text' | 'date' | 'currency' | 'mixed' {
  if (!samples || samples.length === 0) return 'text';

  const types = samples.map((v) => {
    if (v === null || v === undefined) return 'text';
    if (typeof v === 'number') return 'number';
    if (v instanceof Date) return 'date';
    if (typeof v === 'string') {
      // Check for currency
      if (/^\$[\d,]+\.?\d*$/.test(v) || /^[\d,]+\.?\d*\s*(?:đ|VND|USD)$/i.test(v)) {
        return 'currency';
      }
      // Check for number string
      if (!isNaN(Number(v)) && v.trim() !== '') {
        return 'number';
      }
      // Check for date string
      if (/^\d{4}-\d{2}-\d{2}/.test(v) || !isNaN(Date.parse(v))) {
        return 'date';
      }
    }
    return 'text';
  });

  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length > 1) return 'mixed';
  return (uniqueTypes[0] as 'number' | 'text' | 'date' | 'currency') || 'text';
}

export default useNLFormulaContext;
