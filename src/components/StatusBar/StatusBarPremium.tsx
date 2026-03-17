import React, { useState } from 'react';
import { LayoutGrid, Table2, BarChart3, Minus, Plus } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';

export const StatusBarPremium: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'normal' | 'page' | 'break'>('normal');

  const { selectedCell, selectionRange } = useSelectionStore();
  const { activeSheetId, sheets } = useWorkbookStore();

  // Calculate selection stats
  const stats = React.useMemo(() => {
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
            if (!isNaN(num)) {
              values.push(num);
            }
          }
        }
      }
    }

    if (values.length <= 1) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return { sum, avg, count: values.length };
  }, [selectedCell, selectionRange, activeSheetId, sheets]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.min(200, Math.max(50, newZoom)));
  };

  return (
    <div className="status-bar-premium">
      <div className="status-bar__section">
        <span className="status-bar__mode">Ready</span>
      </div>

      {stats && (
        <div className="status-bar__section">
          <span className="status-bar__stat">
            <span className="status-bar__stat-label">Average:</span>
            <span className="status-bar__stat-value">{stats.avg.toFixed(2)}</span>
          </span>
          <span className="status-bar__stat">
            <span className="status-bar__stat-label">Count:</span>
            <span className="status-bar__stat-value">{stats.count}</span>
          </span>
          <span className="status-bar__stat">
            <span className="status-bar__stat-label">Sum:</span>
            <span className="status-bar__stat-value">{stats.sum.toFixed(2)}</span>
          </span>
        </div>
      )}

      <div className="status-bar__section status-bar__section--right">
        <div className="status-bar__view-btns">
          <button
            className={`status-bar__view-btn ${viewMode === 'normal' ? 'status-bar__view-btn--active' : ''}`}
            onClick={() => setViewMode('normal')}
            title="Normal View"
          >
            <LayoutGrid />
          </button>
          <button
            className={`status-bar__view-btn ${viewMode === 'page' ? 'status-bar__view-btn--active' : ''}`}
            onClick={() => setViewMode('page')}
            title="Page Layout View"
          >
            <Table2 />
          </button>
          <button
            className={`status-bar__view-btn ${viewMode === 'break' ? 'status-bar__view-btn--active' : ''}`}
            onClick={() => setViewMode('break')}
            title="Page Break Preview"
          >
            <BarChart3 />
          </button>
        </div>

        <div className="status-bar__divider" />

        <div className="status-bar__zoom">
          <button
            className="status-bar__zoom-btn"
            onClick={() => handleZoomChange(zoom - 10)}
            title="Zoom Out"
          >
            <Minus />
          </button>
          <input
            type="range"
            className="status-bar__zoom-slider"
            min="50"
            max="200"
            value={zoom}
            onChange={(e) => handleZoomChange(parseInt(e.target.value))}
          />
          <button
            className="status-bar__zoom-btn"
            onClick={() => handleZoomChange(zoom + 10)}
            title="Zoom In"
          >
            <Plus />
          </button>
          <span className="status-bar__zoom-value">{zoom}%</span>
        </div>
      </div>
    </div>
  );
};
