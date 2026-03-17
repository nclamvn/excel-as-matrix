// ═══════════════════════════════════════════════════════════════════════════
// SOLVER DIALOG — Linear/Nonlinear Optimization
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { X, Calculator, Plus, Trash2 } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { solve } from '../../engine/solver';
import { getCellKey } from '../../types/cell';

interface ConstraintRow {
  id: string;
  cellRef: string;
  operator: '<=' | '>=' | '=';
  value: string;
}

interface SolverDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SolverDialog: React.FC<SolverDialogProps> = ({ isOpen, onClose }) => {
  const [objectiveCell, setObjectiveCell] = useState('');
  const [goal, setGoal] = useState<'maximize' | 'minimize' | 'value'>('maximize');
  const [targetValue, setTargetValue] = useState('');
  const [changingCells, setChangingCells] = useState('');
  const [constraints, setConstraints] = useState<ConstraintRow[]>([]);
  const [result, setResult] = useState<{ found: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const sheets = useWorkbookStore((s) => s.sheets);
  const setCellValue = useWorkbookStore((s) => s.setCellValue);
  const evaluateFormula = useWorkbookStore((s) => s.evaluateFormula);

  const parseCellRef = (ref: string): { row: number; col: number } | null => {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    let col = 0;
    for (let i = 0; i < match[1].length; i++) col = col * 26 + (match[1].charCodeAt(i) - 64);
    return { row: parseInt(match[2]) - 1, col: col - 1 };
  };

  const addConstraint = useCallback(() => {
    setConstraints((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, cellRef: '', operator: '<=', value: '' },
    ]);
  }, []);

  const removeConstraint = useCallback((id: string) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateConstraint = useCallback((id: string, field: keyof ConstraintRow, val: string) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  }, []);

  const handleSolve = useCallback(() => {
    if (!activeSheetId) return;
    const sheet = sheets[activeSheetId];
    if (!sheet) return;

    const objRef = parseCellRef(objectiveCell);
    if (!objRef) { setError('Invalid objective cell'); return; }

    // Parse changing cells (e.g., "A1:A5" or "A1,B1,C1")
    const changingRefs: Array<{ row: number; col: number }> = [];
    for (const part of changingCells.split(',')) {
      const trimmed = part.trim();
      if (trimmed.includes(':')) {
        const [s, e] = trimmed.split(':').map(parseCellRef);
        if (s && e) {
          for (let r = s.row; r <= e.row; r++)
            for (let c = s.col; c <= e.col; c++)
              changingRefs.push({ row: r, col: c });
        }
      } else {
        const ref = parseCellRef(trimmed);
        if (ref) changingRefs.push(ref);
      }
    }

    if (changingRefs.length === 0) { setError('No changing cells specified'); return; }

    const objFormula = sheet.cells[getCellKey(objRef.row, objRef.col)]?.formula;
    if (!objFormula) { setError('Objective cell must contain a formula'); return; }

    try {
      const initialValues = changingRefs.map((r) => {
        const v = sheet.cells[getCellKey(r.row, r.col)]?.value;
        return typeof v === 'number' ? v : 0;
      });

      const solverResult = solve({
        objective: (vars) => {
          vars.forEach((v, i) => {
            setCellValue(activeSheetId, changingRefs[i].row, changingRefs[i].col, v);
          });
          const result = evaluateFormula(objFormula, activeSheetId, objRef.row, objRef.col);
          return parseFloat(result) || 0;
        },
        initialValues,
        goal: goal === 'value' ? 'minimize' : goal,
        constraints: constraints
          .filter((c) => c.cellRef && c.value)
          .map((c) => {
            const cRef = parseCellRef(c.cellRef);
            const cVal = parseFloat(c.value);
            return (vars: number[]) => {
              if (!cRef) return true;
              vars.forEach((v, i) => {
                setCellValue(activeSheetId, changingRefs[i].row, changingRefs[i].col, v);
              });
              const cellVal = parseFloat(
                sheet.cells[getCellKey(cRef.row, cRef.col)]?.displayValue || '0'
              );
              switch (c.operator) {
                case '<=': return cellVal <= cVal;
                case '>=': return cellVal >= cVal;
                case '=': return Math.abs(cellVal - cVal) < 0.001;
                default: return true;
              }
            };
          }),
        maxIterations: 500,
      });

      if (solverResult.found) {
        // Apply final values
        solverResult.values.forEach((v, i) => {
          setCellValue(activeSheetId, changingRefs[i].row, changingRefs[i].col, Math.round(v * 1e6) / 1e6);
        });
        setResult({
          found: true,
          message: `Optimal solution found. Objective: ${solverResult.objectiveValue.toFixed(4)} (${solverResult.iterations} iterations)`,
        });
      } else {
        setResult({
          found: false,
          message: `Could not find optimal solution (status: ${solverResult.status})`,
        });
      }
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Solver failed');
    }
  }, [activeSheetId, sheets, objectiveCell, changingCells, goal, constraints, setCellValue, evaluateFormula]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[520px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold">Solver</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
          {/* Objective */}
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Set Objective:</label>
            <input value={objectiveCell} onChange={(e) => setObjectiveCell(e.target.value)} placeholder="e.g. D10"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700" />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">To:</label>
            <div className="flex gap-3">
              {(['maximize', 'minimize', 'value'] as const).map((g) => (
                <label key={g} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="goal" checked={goal === g} onChange={() => setGoal(g)} className="text-green-600" />
                  {g === 'value' ? 'Value of:' : g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
              {goal === 'value' && (
                <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="0"
                  className="w-20 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700" />
              )}
            </div>
          </div>

          {/* Changing cells */}
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">By Changing Variable Cells:</label>
            <input value={changingCells} onChange={(e) => setChangingCells(e.target.value)} placeholder="e.g. A1:A5 or A1,B1,C1"
              className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700" />
          </div>

          {/* Constraints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-neutral-600 dark:text-neutral-400">Subject to Constraints:</label>
              <button onClick={addConstraint} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {constraints.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <input value={c.cellRef} onChange={(e) => updateConstraint(c.id, 'cellRef', e.target.value)} placeholder="Cell"
                    className="w-20 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700" />
                  <select value={c.operator} onChange={(e) => updateConstraint(c.id, 'operator', e.target.value)}
                    className="px-1 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700">
                    <option value="<=">{'<='}</option>
                    <option value=">=">{'>='}</option>
                    <option value="=">=</option>
                  </select>
                  <input value={c.value} onChange={(e) => updateConstraint(c.id, 'value', e.target.value)} placeholder="Value"
                    className="w-20 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700" />
                  <button onClick={() => removeConstraint(c.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}
          {result && (
            <div className={`p-2 rounded text-sm ${result.found ? 'bg-green-50 dark:bg-green-900/20 text-green-700' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700'}`}>
              {result.message}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700">
            Close
          </button>
          <button onClick={handleSolve} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Solve
          </button>
        </div>
      </div>
    </div>
  );
};
