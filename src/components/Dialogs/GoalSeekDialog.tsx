// ═══════════════════════════════════════════════════════════════════════════
// GOAL SEEK DIALOG
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { X, Target } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { goalSeek } from '../../engine/solver';
import { getCellKey } from '../../types/cell';

interface GoalSeekDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalSeekDialog: React.FC<GoalSeekDialogProps> = ({ isOpen, onClose }) => {
  const [setCell, setSetCell] = useState('');
  const [toValue, setToValue] = useState('');
  const [byChanging, setByChanging] = useState('');
  const [result, setResult] = useState<{ found: boolean; value: number; iterations: number } | null>(null);
  const [error, setError] = useState('');

  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const sheets = useWorkbookStore((s) => s.sheets);
  const setCellValue = useWorkbookStore((s) => s.setCellValue);
  const evaluateFormula = useWorkbookStore((s) => s.evaluateFormula);

  const parseCellRef = (ref: string): { row: number; col: number } | null => {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    let col = 0;
    for (let i = 0; i < match[1].length; i++) {
      col = col * 26 + (match[1].charCodeAt(i) - 64);
    }
    return { row: parseInt(match[2]) - 1, col: col - 1 };
  };

  const handleSeek = useCallback(() => {
    if (!activeSheetId) return;

    const setCellRef = parseCellRef(setCell);
    const changeCellRef = parseCellRef(byChanging);
    const target = parseFloat(toValue);

    if (!setCellRef || !changeCellRef || isNaN(target)) {
      setError('Invalid cell reference or target value');
      return;
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) return;

    const setCellKey = getCellKey(setCellRef.row, setCellRef.col);
    const formulaCell = sheet.cells[setCellKey];
    if (!formulaCell?.formula) {
      setError('Set cell must contain a formula');
      return;
    }

    try {
      const seekResult = goalSeek({
        evaluate: (x: number) => {
          // Temporarily set the changing cell value
          setCellValue(activeSheetId, changeCellRef.row, changeCellRef.col, x);
          // Evaluate the formula cell
          const result = evaluateFormula(formulaCell.formula!, activeSheetId, setCellRef.row, setCellRef.col);
          return parseFloat(result) || 0;
        },
        targetValue: target,
        initialGuess: Number(sheet.cells[getCellKey(changeCellRef.row, changeCellRef.col)]?.value) || 0,
      });

      setResult(seekResult);

      if (seekResult.found) {
        // Apply the result
        setCellValue(activeSheetId, changeCellRef.row, changeCellRef.col, seekResult.value);
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Goal Seek failed');
    }
  }, [activeSheetId, setCell, toValue, byChanging, sheets, setCellValue, evaluateFormula]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-green-600" />
            <h2 className="text-base font-semibold">Goal Seek</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Set cell:</label>
            <input
              value={setCell}
              onChange={(e) => setSetCell(e.target.value)}
              placeholder="e.g. B5"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">To value:</label>
            <input
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">By changing cell:</label>
            <input
              value={byChanging}
              onChange={(e) => setByChanging(e.target.value)}
              placeholder="e.g. A1"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          {result && (
            <div className={`p-2 rounded text-sm ${result.found ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>
              {result.found
                ? `Found: ${result.value.toFixed(6)} (${result.iterations} iterations)`
                : `Could not converge after ${result.iterations} iterations`}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700">
            Close
          </button>
          <button onClick={handleSeek} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">
            Seek
          </button>
        </div>
      </div>
    </div>
  );
};
