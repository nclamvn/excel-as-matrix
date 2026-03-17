// ═══════════════════════════════════════════════════════════════════════════
// ARIA GRID OVERLAY — Accessible Hidden Grid for Screen Readers
// Since Canvas is not accessible, this provides a parallel ARIA grid
// that screen readers can navigate while the visual grid shows the canvas
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo, useRef } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { getCellKey } from '../../types/cell';
import { useScreenReaderAnnounce } from '../../hooks/useScreenReaderAnnounce';

interface AriaGridProps {
  sheetId: string;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
}

const getColLetter = (col: number): string => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

/**
 * Hidden ARIA grid that mirrors the visible canvas grid.
 * Only renders the visible viewport to maintain performance.
 * Screen readers navigate this grid; visual users see the canvas.
 */
export const AriaGrid: React.FC<AriaGridProps> = ({ sheetId, visibleRows, visibleCols }) => {
  const sheet = useWorkbookStore(useCallback((s) => s.sheets[sheetId], [sheetId]));
  const selectedCell = useSelectionStore((s) => s.selectedCell);
  const setSelectedCell = useSelectionStore((s) => s.setSelectedCell);
  const setIsEditing = useSelectionStore((s) => s.setIsEditing);
  const { announceCell } = useScreenReaderAnnounce();
  const gridRef = useRef<HTMLTableElement>(null);

  // Track focused cell for keyboard nav within ARIA grid
  const handleCellFocus = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    const key = getCellKey(row, col);
    const cellData = sheet?.cells[key];
    announceCell(col, row, cellData?.displayValue || '', cellData?.formula);
  }, [setSelectedCell, sheet?.cells, announceCell]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      setSelectedCell({ row, col });
      setIsEditing(true);
    }
  }, [setSelectedCell, setIsEditing]);

  // Build visible rows
  const rows = useMemo(() => {
    const result = [];
    for (let r = visibleRows.start; r <= visibleRows.end; r++) {
      const cells = [];
      for (let c = visibleCols.start; c <= visibleCols.end; c++) {
        const key = getCellKey(r, c);
        const cellData = sheet?.cells[key];
        const isSelected = selectedCell?.row === r && selectedCell?.col === c;
        cells.push({ row: r, col: c, key, cellData, isSelected });
      }
      result.push({ row: r, cells });
    }
    return result;
  }, [visibleRows, visibleCols, sheet?.cells, selectedCell]);

  return (
    <table
      ref={gridRef}
      role="grid"
      aria-label={`Spreadsheet ${sheet?.name || 'Sheet'}`}
      aria-rowcount={100000}
      aria-colcount={26}
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {/* Column headers */}
      <thead>
        <tr role="row">
          <th role="columnheader" scope="col" aria-label="Row number" />
          {Array.from({ length: visibleCols.end - visibleCols.start + 1 }, (_, i) => {
            const col = visibleCols.start + i;
            return (
              <th
                key={col}
                role="columnheader"
                scope="col"
                aria-colindex={col + 1}
                aria-label={`Column ${getColLetter(col)}`}
              >
                {getColLetter(col)}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ row, cells }) => (
          <tr key={row} role="row" aria-rowindex={row + 1}>
            <th role="rowheader" scope="row" aria-label={`Row ${row + 1}`}>
              {row + 1}
            </th>
            {cells.map(({ col, cellData, isSelected }) => (
              <td
                key={col}
                role="gridcell"
                aria-colindex={col + 1}
                aria-rowindex={row + 1}
                aria-selected={isSelected}
                aria-label={`${getColLetter(col)}${row + 1}: ${cellData?.displayValue || 'empty'}`}
                tabIndex={isSelected ? 0 : -1}
                onFocus={() => handleCellFocus(row, col)}
                onKeyDown={(e) => handleCellKeyDown(e, row, col)}
              >
                {cellData?.displayValue || ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
