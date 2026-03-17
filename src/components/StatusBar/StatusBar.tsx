import React, { useMemo, useState, memo } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';

interface StatusBarProps {
  selection?: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null;
  onZoomChange?: (zoom: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = memo(({ selection, onZoomChange }) => {
  const [zoom, setZoom] = useState(100);
  const { sheets, activeSheetId } = useWorkbookStore();

  const stats = useMemo(() => {
    if (!selection || !activeSheetId) return null;

    const sheet = sheets[activeSheetId];
    if (!sheet) return null;

    const values: number[] = [];

    for (let row = selection.startRow; row <= selection.endRow; row++) {
      for (let col = selection.startCol; col <= selection.endCol; col++) {
        const cell = sheet.cells[getCellKey(row, col)];
        if (cell?.value !== undefined && cell?.value !== null && cell?.value !== '') {
          const num = parseFloat(String(cell.value));
          if (!isNaN(num)) {
            values.push(num);
          }
        }
      }
    }

    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: values.length,
      sum,
      average: avg,
      min,
      max,
    };
  }, [selection, activeSheetId, sheets]);

  const cellCount = useMemo(() => {
    if (!selection) return 0;
    return (selection.endRow - selection.startRow + 1) * (selection.endCol - selection.startCol + 1);
  }, [selection]);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  return (
    <div className="h-6 bg-gray-100 border-t flex items-center justify-between px-4 text-xs text-gray-600">
      <div className="flex items-center gap-4">
        <span>Ready</span>
      </div>

      <div className="flex items-center gap-4">
        {stats && (
          <>
            <StatItem label="Average" value={stats.average.toFixed(2)} />
            <StatItem label="Count" value={stats.count.toString()} />
            <StatItem label="Sum" value={stats.sum.toLocaleString()} />
            {stats.count > 1 && (
              <>
                <StatItem label="Min" value={stats.min.toLocaleString()} />
                <StatItem label="Max" value={stats.max.toLocaleString()} />
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {cellCount > 1 && <span>{cellCount} cells selected</span>}
        <ZoomControl zoom={zoom} onZoomChange={handleZoomChange} />
      </div>
    </div>
  );
});

StatusBar.displayName = 'StatusBar';

const StatItem = memo<{ label: string; value: string }>(({ label, value }) => (
  <div className="flex items-center gap-1">
    <span className="text-gray-500">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
));

StatItem.displayName = 'StatItem';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZoomControl = memo<ZoomControlProps>(({ zoom, onZoomChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onZoomChange(Math.max(25, zoom - 10))}
        className="px-1 hover:bg-gray-200 rounded"
      >
        −
      </button>
      <span className="w-12 text-center">{zoom}%</span>
      <button
        onClick={() => onZoomChange(Math.min(400, zoom + 10))}
        className="px-1 hover:bg-gray-200 rounded"
      >
        +
      </button>
      <input
        type="range"
        min={25}
        max={400}
        value={zoom}
        onChange={(e) => onZoomChange(parseInt(e.target.value))}
        className="w-24 h-1"
      />
    </div>
  );
});

ZoomControl.displayName = 'ZoomControl';

export default StatusBar;
