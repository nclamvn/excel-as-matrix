import React, { useMemo } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';

export const SelectionStats: React.FC = () => {
  const { selectedCell, selectionRange } = useSelectionStore();
  const { activeSheetId, sheets } = useWorkbookStore();

  const stats = useMemo(() => {
    if (!activeSheetId || !sheets[activeSheetId]) return null;

    const sheet = sheets[activeSheetId];
    const values: number[] = [];

    // Collect numeric values from selection
    if (selectionRange) {
      const { start, end } = selectionRange;
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const cellKey = getCellKey(row, col);
          const cell = sheet.cells[cellKey];
          if (cell?.value !== null && cell?.value !== undefined) {
            const num = parseFloat(String(cell.value));
            if (!isNaN(num)) {
              values.push(num);
            }
          }
        }
      }
    } else if (selectedCell) {
      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      const cell = sheet.cells[cellKey];
      if (cell?.value !== null && cell?.value !== undefined) {
        const num = parseFloat(String(cell.value));
        if (!isNaN(num)) {
          values.push(num);
        }
      }
    }

    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      sum,
      avg,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [selectedCell, selectionRange, activeSheetId, sheets]);

  if (!stats || stats.count <= 1) return null;

  return (
    <div className="selection-stats">
      <span className="stat">
        <span className="stat-label">Average:</span>
        <span className="stat-value">{stats.avg.toFixed(2)}</span>
      </span>
      <span className="stat">
        <span className="stat-label">Count:</span>
        <span className="stat-value">{stats.count}</span>
      </span>
      <span className="stat">
        <span className="stat-label">Sum:</span>
        <span className="stat-value">{stats.sum.toFixed(2)}</span>
      </span>
    </div>
  );
};
