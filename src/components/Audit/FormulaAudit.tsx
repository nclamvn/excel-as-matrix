// ═══════════════════════════════════════════════════════════════════════════
// FORMULA AUDIT — Trace Precedents/Dependents + Watch Window
// SVG arrow overlay showing cell dependencies
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo, useState } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { formulaEngine } from '../../engine';
import { getCellKey } from '../../types/cell';
import type { CellKey } from '../../engine/types';
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ArrowDef {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  type: 'precedent' | 'dependent';
}

interface WatchItem {
  sheetId: string;
  row: number;
  col: number;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrow Overlay — SVG arrows for precedent/dependent tracing
// ─────────────────────────────────────────────────────────────────────────────

interface ArrowOverlayProps {
  arrows: ArrowDef[];
  cellWidth: number;
  cellHeight: number;
  scrollLeft: number;
  scrollTop: number;
  containerWidth: number;
  containerHeight: number;
}

export const ArrowOverlay: React.FC<ArrowOverlayProps> = ({
  arrows,
  cellWidth,
  cellHeight,
  scrollLeft,
  scrollTop,
  containerWidth,
  containerHeight,
}) => {
  if (arrows.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={containerWidth}
      height={containerHeight}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead-blue"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-red"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
      </defs>
      {arrows.map((arrow, i) => {
        const x1 = arrow.fromCol * cellWidth + cellWidth / 2 - scrollLeft;
        const y1 = arrow.fromRow * cellHeight + cellHeight / 2 - scrollTop;
        const x2 = arrow.toCol * cellWidth + cellWidth / 2 - scrollLeft;
        const y2 = arrow.toRow * cellHeight + cellHeight / 2 - scrollTop;
        const color = arrow.type === 'precedent' ? '#3b82f6' : '#ef4444';
        const markerId = arrow.type === 'precedent' ? 'arrowhead-blue' : 'arrowhead-red';

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={2}
            markerEnd={`url(#${markerId})`}
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Watch Window — Monitor cell values in real-time
// ─────────────────────────────────────────────────────────────────────────────

export const WatchWindow: React.FC = () => {
  const [watchItems, setWatchItems] = useState<WatchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedCell = useSelectionStore((s) => s.selectedCell);
  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const sheets = useWorkbookStore((s) => s.sheets);

  const addWatch = useCallback(() => {
    if (!selectedCell || !activeSheetId) return;
    const label = `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}`;
    // Avoid duplicates
    if (watchItems.some((w) => w.sheetId === activeSheetId && w.row === selectedCell.row && w.col === selectedCell.col)) return;
    setWatchItems((prev) => [...prev, { sheetId: activeSheetId, row: selectedCell.row, col: selectedCell.col, label }]);
  }, [selectedCell, activeSheetId, watchItems]);

  const removeWatch = useCallback((index: number) => {
    setWatchItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-700"
      >
        <Eye size={16} />
        Watch Window
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Watch Window</span>
        <div className="flex gap-1">
          <button onClick={addWatch} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50">
            + Add
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
            <EyeOff size={14} />
          </button>
        </div>
      </div>

      {/* Watch items */}
      <div className="max-h-48 overflow-y-auto">
        {watchItems.length === 0 ? (
          <div className="px-3 py-4 text-xs text-neutral-400 text-center">
            Select a cell and click + Add to watch it
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-500 border-b border-neutral-100 dark:border-neutral-700">
                <th className="text-left px-3 py-1">Cell</th>
                <th className="text-left px-2 py-1">Value</th>
                <th className="w-6"></th>
              </tr>
            </thead>
            <tbody>
              {watchItems.map((item, i) => {
                const sheet = sheets[item.sheetId];
                const key = getCellKey(item.row, item.col);
                const cellData = sheet?.cells[key];
                return (
                  <tr key={i} className="border-b border-neutral-50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                    <td className="px-3 py-1.5 font-mono text-blue-600 dark:text-blue-400">{item.label}</td>
                    <td className="px-2 py-1.5 text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]">
                      {cellData?.displayValue || cellData?.value?.toString() || '(empty)'}
                    </td>
                    <td className="px-1">
                      <button onClick={() => removeWatch(i)} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                        <X size={12} className="text-neutral-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useFormulaAudit — Compute arrows for selected cell
// ─────────────────────────────────────────────────────────────────────────────

export function useFormulaAudit() {
  const selectedCell = useSelectionStore((s) => s.selectedCell);
  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const [showPrecedents, setShowPrecedents] = useState(false);
  const [showDependents, setShowDependents] = useState(false);

  const arrows = useMemo<ArrowDef[]>(() => {
    if (!selectedCell || !activeSheetId) return [];

    const result: ArrowDef[] = [];

    if (showPrecedents) {
      // Get cells that the selected cell depends on
      const cellKey = `${activeSheetId}:${selectedCell.row}:${selectedCell.col}` as CellKey;
      const deps = formulaEngine['dependencyGraph'].get(cellKey);
      if (deps) {
        for (const depKey of deps) {
          const parsed = formulaEngine.parseCellKey(depKey);
          if (parsed.sheetId === activeSheetId) {
            result.push({
              fromRow: parsed.row,
              fromCol: parsed.col,
              toRow: selectedCell.row,
              toCol: selectedCell.col,
              type: 'precedent',
            });
          }
        }
      }
    }

    if (showDependents) {
      // Get cells that depend on the selected cell
      const dependentKeys = formulaEngine.getDependentCells(activeSheetId, selectedCell.row, selectedCell.col);
      for (const depKey of dependentKeys) {
        const parsed = formulaEngine.parseCellKey(depKey);
        if (parsed.sheetId === activeSheetId) {
          result.push({
            fromRow: selectedCell.row,
            fromCol: selectedCell.col,
            toRow: parsed.row,
            toCol: parsed.col,
            type: 'dependent',
          });
        }
      }
    }

    return result;
  }, [selectedCell, activeSheetId, showPrecedents, showDependents]);

  return {
    arrows,
    showPrecedents,
    showDependents,
    togglePrecedents: () => setShowPrecedents((v) => !v),
    toggleDependents: () => setShowDependents((v) => !v),
    clearArrows: () => { setShowPrecedents(false); setShowDependents(false); },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Toolbar Buttons
// ─────────────────────────────────────────────────────────────────────────────

interface AuditToolbarProps {
  onTogglePrecedents: () => void;
  onToggleDependents: () => void;
  onClear: () => void;
  showPrecedents: boolean;
  showDependents: boolean;
}

export const AuditToolbar: React.FC<AuditToolbarProps> = ({
  onTogglePrecedents,
  onToggleDependents,
  onClear,
  showPrecedents,
  showDependents,
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onTogglePrecedents}
        className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
          showPrecedents
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
        }`}
        title="Trace Precedents"
      >
        <ArrowUpRight size={14} />
        Precedents
      </button>
      <button
        onClick={onToggleDependents}
        className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
          showDependents
            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
        }`}
        title="Trace Dependents"
      >
        <ArrowDownRight size={14} />
        Dependents
      </button>
      {(showPrecedents || showDependents) && (
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
          title="Remove Arrows"
        >
          Clear
        </button>
      )}
    </div>
  );
};
