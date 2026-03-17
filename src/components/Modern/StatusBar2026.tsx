import React, { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';

export const StatusBar2026: React.FC = () => {
  const { selectedCell, selectionRange } = useSelectionStore();
  const { activeSheetId, sheets, zoom, setZoom } = useWorkbookStore();

  const stats = useMemo(() => {
    if (!activeSheetId || !sheets[activeSheetId]) return null;

    const sheet = sheets[activeSheetId];
    const values: number[] = [];

    if (selectionRange) {
      const { start, end } = selectionRange;
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const cellKey = getCellKey(row, col);
          const cell = sheet.cells[cellKey];
          if (cell?.value !== null && cell?.value !== undefined) {
            const num = parseFloat(String(cell.value));
            if (!isNaN(num)) values.push(num);
          }
        }
      }
    }

    if (values.length <= 1) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return { sum, avg: sum / values.length, count: values.length };
  }, [selectedCell, selectionRange, activeSheetId, sheets]);

  return (
    <div className="status-bar-2026">
      <div className="status-bar-2026__left">
        <span className="status-bar-2026__mode">Ready</span>

        {stats && (
          <div className="status-bar-2026__stats">
            <span className="status-bar-2026__stat">
              <span className="status-bar-2026__stat-label">Average:</span>
              <span className="status-bar-2026__stat-value">{stats.avg.toFixed(2)}</span>
            </span>
            <span className="status-bar-2026__stat">
              <span className="status-bar-2026__stat-label">Count:</span>
              <span className="status-bar-2026__stat-value">{stats.count}</span>
            </span>
            <span className="status-bar-2026__stat">
              <span className="status-bar-2026__stat-label">Sum:</span>
              <span className="status-bar-2026__stat-value">{stats.sum.toFixed(2)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="status-bar-2026__right">
        <div className="status-bar-2026__zoom">
          <button
            className="status-bar-2026__zoom-btn"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <Minus />
          </button>
          <span className="status-bar-2026__zoom-value">{zoom}%</span>
          <button
            className="status-bar-2026__zoom-btn"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <Plus />
          </button>
        </div>
      </div>
    </div>
  );
};
