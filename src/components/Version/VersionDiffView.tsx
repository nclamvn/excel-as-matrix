/**
 * Version Diff View — compares two snapshots and shows cell-level changes.
 * Reuses the existing DiffViewer component from AI sandbox.
 */
import { useMemo } from 'react';
import { DiffViewer } from '@/components/AI/DiffViewer';
import { SnapshotData } from '@/types/version';
import type { SandboxDiff, CellChange, CellState } from '@/ai/sandbox/types';

interface VersionDiffViewProps {
  oldData: SnapshotData;
  newData: SnapshotData;
  oldLabel?: string;
  newLabel?: string;
  onClose: () => void;
}

export function VersionDiffView({ oldData, newData, oldLabel, newLabel, onClose }: VersionDiffViewProps) {
  const diff = useMemo(() => computeSnapshotDiff(oldData, newData), [oldData, newData]);

  return (
    <div className="vh-diff-panel">
      <div className="vh-diff-header">
        <h3>Changes</h3>
        <div className="vh-diff-labels">
          {oldLabel && <span className="vh-diff-label vh-diff-label--old">{oldLabel}</span>}
          {newLabel && <span className="vh-diff-label vh-diff-label--new">{newLabel}</span>}
        </div>
        <button type="button" className="vh-close" onClick={onClose}>&times;</button>
      </div>
      <div className="vh-diff-content">
        <DiffViewer diff={diff} maxRows={100} showSummary={true} />
      </div>
    </div>
  );
}

/**
 * Compute a SandboxDiff-compatible diff between two snapshot data objects.
 */
function computeSnapshotDiff(oldData: SnapshotData, newData: SnapshotData): SandboxDiff {
  const changes: CellChange[] = [];
  let added = 0;
  let modified = 0;
  let deleted = 0;
  let formulaChanges = 0;
  const sheetsAffected = new Set<string>();

  const allSheetIds = new Set([
    ...Object.keys(oldData.sheets || {}),
    ...Object.keys(newData.sheets || {}),
  ]);

  for (const sheetId of allSheetIds) {
    const oldSheet = oldData.sheets?.[sheetId];
    const newSheet = newData.sheets?.[sheetId];
    const sheetName = newSheet?.name || oldSheet?.name || sheetId;
    const oldCells = (oldSheet?.cells || {}) as Record<string, Record<string, unknown>>;
    const newCells = (newSheet?.cells || {}) as Record<string, Record<string, unknown>>;

    const allKeys = new Set([...Object.keys(oldCells), ...Object.keys(newCells)]);

    for (const cellKey of allKeys) {
      const oldCell = oldCells[cellKey];
      const newCell = newCells[cellKey];
      const oldVal = oldCell?.value;
      const newVal = newCell?.value;
      const oldFormula = (oldCell?.formula as string) || null;
      const newFormula = (newCell?.formula as string) || null;

      // Parse cell key like "0,0" → "A1"
      const ref = cellKeyToRef(cellKey);

      const makeCellState = (cell: Record<string, unknown> | undefined): CellState | null => {
        if (!cell) return null;
        return {
          ref,
          value: cell.value as string | number | boolean | null,
          formula: (cell.formula as string) || null,
        };
      };

      if (!oldCell && newCell) {
        changes.push({ ref, sheetId, sheetName, changeType: 'added', before: null, after: makeCellState(newCell) });
        added++;
        sheetsAffected.add(sheetName);
      } else if (oldCell && !newCell) {
        changes.push({ ref, sheetId, sheetName, changeType: 'deleted', before: makeCellState(oldCell), after: null });
        deleted++;
        sheetsAffected.add(sheetName);
      } else if (oldVal !== newVal || oldFormula !== newFormula) {
        changes.push({ ref, sheetId, sheetName, changeType: 'modified', before: makeCellState(oldCell), after: makeCellState(newCell) });
        modified++;
        if (oldFormula !== newFormula) formulaChanges++;
        sheetsAffected.add(sheetName);
      }
    }
  }

  return {
    id: `diff-${Date.now()}`,
    sandboxId: 'version-compare',
    changes,
    summary: {
      totalChanges: changes.length,
      added,
      modified,
      deleted,
      formulaChanges,
      sheetsAffected: Array.from(sheetsAffected),
    },
    createdAt: new Date(),
  };
}

/** Convert "row,col" key to "A1" style reference */
function cellKeyToRef(key: string): string {
  const parts = key.split(',');
  if (parts.length !== 2) return key;
  const row = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);
  if (isNaN(row) || isNaN(col)) return key;
  return `${colToLetter(col)}${row + 1}`;
}

function colToLetter(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}
