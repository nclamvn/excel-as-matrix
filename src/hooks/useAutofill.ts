import { useCallback } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import { useUndoStore } from '../stores/undoStore';
import { CellValue, getCellKey } from '../types/cell';
import { detectPattern as detectPatternUtil, generateSeriesValues, DetectedPattern } from '../utils/fillSeriesUtils';

export type FillDirection = 'down' | 'up' | 'left' | 'right';

export interface FillPattern {
  type: 'copy' | 'series' | 'date' | 'dayName' | 'monthName' | 'quarter' | 'textWithNumber' | 'custom';
  step?: number;
  format?: string;
  detectedPattern?: DetectedPattern;
}

export function useAutofill() {
  const detectPattern = useCallback((values: CellValue[]): FillPattern => {
    // Use the new pattern detection utility
    const detected = detectPatternUtil(values);

    // Map the detected pattern type to our FillPattern format
    switch (detected.type) {
      case 'linear':
        return { type: 'series', step: detected.step ?? 1, detectedPattern: detected };
      case 'growth':
        return { type: 'series', step: detected.step ?? 2, detectedPattern: detected };
      case 'date':
        return { type: 'date', step: detected.step ?? 1, detectedPattern: detected };
      case 'dayName':
        return { type: 'dayName', step: detected.step ?? 1, detectedPattern: detected };
      case 'monthName':
        return { type: 'monthName', step: detected.step ?? 1, detectedPattern: detected };
      case 'quarter':
        return { type: 'quarter', step: detected.step ?? 1, detectedPattern: detected };
      case 'textWithNumber':
        return { type: 'textWithNumber', step: detected.step ?? 1, detectedPattern: detected };
      case 'copy':
      default:
        return { type: 'copy', detectedPattern: detected };
    }
  }, []);

  const generateFillValues = useCallback(
    (sourceValues: CellValue[], pattern: FillPattern, count: number): CellValue[] => {
      // If we have a detected pattern from the new utility, use it
      if (pattern.detectedPattern) {
        return generateSeriesValues(sourceValues, pattern.detectedPattern, count);
      }

      // Fallback to legacy behavior for backward compatibility
      const result: CellValue[] = [];

      switch (pattern.type) {
        case 'series': {
          const lastNum = parseFloat(String(sourceValues[sourceValues.length - 1]));
          for (let i = 1; i <= count; i++) {
            result.push(lastNum + (pattern.step || 1) * i);
          }
          break;
        }

        case 'date': {
          const lastDate = new Date(String(sourceValues[sourceValues.length - 1]));
          for (let i = 1; i <= count; i++) {
            const newDate = new Date(lastDate);
            newDate.setDate(newDate.getDate() + (pattern.step || 1) * i);
            result.push(newDate.toISOString().split('T')[0]);
          }
          break;
        }

        case 'copy':
        default:
          for (let i = 0; i < count; i++) {
            result.push(sourceValues[i % sourceValues.length]);
          }
          break;
      }

      return result;
    },
    []
  );

  const autofill = useCallback(
    (
      sheetId: string,
      sourceRange: { startRow: number; startCol: number; endRow: number; endCol: number },
      targetRange: { startRow: number; startCol: number; endRow: number; endCol: number },
      direction: FillDirection
    ) => {
      const workbookStore = useWorkbookStore.getState();
      const sheet = workbookStore.sheets[sheetId];
      if (!sheet) return;

      const getCellValue = (row: number, col: number): CellValue => {
        const cell = sheet.cells[getCellKey(row, col)];
        return cell?.value ?? null;
      };

      const sourceValues: CellValue[][] = [];

      for (let row = sourceRange.startRow; row <= sourceRange.endRow; row++) {
        const rowValues: CellValue[] = [];
        for (let col = sourceRange.startCol; col <= sourceRange.endCol; col++) {
          rowValues.push(getCellValue(row, col));
        }
        sourceValues.push(rowValues);
      }

      const updates: Array<{ row: number; col: number; value: CellValue }> = [];

      if (direction === 'down' || direction === 'up') {
        const count =
          direction === 'down'
            ? targetRange.endRow - sourceRange.endRow
            : sourceRange.startRow - targetRange.startRow;

        for (let col = sourceRange.startCol; col <= sourceRange.endCol; col++) {
          const colIndex = col - sourceRange.startCol;
          const colValues = sourceValues.map((row) => row[colIndex]);
          const pattern = detectPattern(colValues);
          const fillValues = generateFillValues(colValues, pattern, count);

          for (let i = 0; i < count; i++) {
            const row =
              direction === 'down' ? sourceRange.endRow + 1 + i : sourceRange.startRow - 1 - i;

            updates.push({ row, col, value: fillValues[i] });
          }
        }
      } else {
        const count =
          direction === 'right'
            ? targetRange.endCol - sourceRange.endCol
            : sourceRange.startCol - targetRange.startCol;

        for (let row = sourceRange.startRow; row <= sourceRange.endRow; row++) {
          const rowIndex = row - sourceRange.startRow;
          const rowValues = sourceValues[rowIndex];
          const pattern = detectPattern(rowValues);
          const fillValues = generateFillValues(rowValues, pattern, count);

          for (let i = 0; i < count; i++) {
            const col =
              direction === 'right' ? sourceRange.endCol + 1 + i : sourceRange.startCol - 1 - i;

            updates.push({ row, col, value: fillValues[i] });
          }
        }
      }

      const oldValues = updates.map((u) => ({
        ...u,
        oldValue: getCellValue(u.row, u.col),
      }));

      for (const update of updates) {
        workbookStore.setCellValue(sheetId, update.row, update.col, update.value);
      }

      useUndoStore.getState().push({
        type: 'AUTOFILL',
        description: `Autofill ${updates.length} cells`,
        undo: () => {
          for (const v of oldValues) {
            workbookStore.setCellValue(sheetId, v.row, v.col, v.oldValue);
          }
        },
        redo: () => {
          for (const update of updates) {
            workbookStore.setCellValue(sheetId, update.row, update.col, update.value);
          }
        },
      });
    },
    [detectPattern, generateFillValues]
  );

  return { autofill, detectPattern };
}
