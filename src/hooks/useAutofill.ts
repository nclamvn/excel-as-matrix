import { useCallback } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import { useUndoStore } from '../stores/undoStore';
import { CellValue } from '../types/cell';

export type FillDirection = 'down' | 'up' | 'left' | 'right';

export interface FillPattern {
  type: 'copy' | 'series' | 'date' | 'custom';
  step?: number;
  format?: string;
}

export function useAutofill() {
  const detectPattern = useCallback((values: CellValue[]): FillPattern => {
    if (values.length < 2) {
      return { type: 'copy' };
    }

    const numbers = values.map((v) => parseFloat(String(v))).filter((n) => !isNaN(n));
    if (numbers.length === values.length && numbers.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < numbers.length; i++) {
        diffs.push(numbers[i] - numbers[i - 1]);
      }

      const allSame = diffs.every((d) => Math.abs(d - diffs[0]) < 0.0001);
      if (allSame) {
        return { type: 'series', step: diffs[0] };
      }
    }

    const dates = values.map((v) => new Date(String(v))).filter((d) => !isNaN(d.getTime()));
    if (dates.length === values.length && dates.length >= 2) {
      const dayDiffs: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        dayDiffs.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
      }

      const allSame = dayDiffs.every((d) => Math.abs(d - dayDiffs[0]) < 0.1);
      if (allSame) {
        return { type: 'date', step: dayDiffs[0] };
      }
    }

    return { type: 'copy' };
  }, []);

  const generateFillValues = useCallback(
    (sourceValues: CellValue[], pattern: FillPattern, count: number): CellValue[] => {
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
        const cell = sheet.cells[`${row},${col}`];
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
