// ============================================================
// SPARKLINE DIALOG — Insert/Edit Sparklines
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useSparklineStore } from '../../stores/sparklineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import {
  SparklineType,
  SPARKLINE_PRESETS,
} from '../../types/sparkline';
import './Sparklines.css';

interface SparklineDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
  initialType?: SparklineType;
}

export const SparklineDialog: React.FC<SparklineDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
  initialType = 'line',
}) => {
  const [type, setType] = useState<SparklineType>(initialType);
  const [dataRange, setDataRange] = useState('');
  const [locationRange, setLocationRange] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [showMarkers, setShowMarkers] = useState(false);
  const [showHighLow, setShowHighLow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addSparkline, addSparklineRange } = useSparklineStore();
  const { selectedCell } = useSelectionStore();

  // Update type when initialType changes
  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  // Auto-fill location from selection
  useEffect(() => {
    if (selectedCell && isOpen) {
      const colLetter = String.fromCharCode(65 + selectedCell.col);
      const rowNum = selectedCell.row + 1;
      setLocationRange(`${colLetter}${rowNum}`);
    }
  }, [selectedCell, isOpen]);

  const handleInsert = () => {
    setError(null);

    // Validate inputs
    if (!dataRange.trim()) {
      setError('Please enter a data range.');
      return;
    }
    if (!locationRange.trim()) {
      setError('Please enter a location range.');
      return;
    }

    // Parse location range
    const locMatch = locationRange.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
    if (!locMatch) {
      setError('Invalid location range format. Use format like A1 or A1:A5');
      return;
    }

    const startCol = locMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(locMatch[2]) - 1;
    const endCol = locMatch[3] ? locMatch[3].toUpperCase().charCodeAt(0) - 65 : startCol;
    const endRow = locMatch[4] ? parseInt(locMatch[4]) - 1 : startRow;

    // Single sparkline or multiple
    if (startRow === endRow && startCol === endCol) {
      // Single sparkline
      addSparkline(
        sheetId,
        type,
        dataRange.toUpperCase(),
        locationRange.toUpperCase(),
        startRow,
        startCol
      );
    } else {
      // Multiple sparklines - parse data ranges for each
      const dataRanges: string[] = [];
      const locations: { cell: string; row: number; col: number }[] = [];

      // Determine if vertical or horizontal range
      if (startCol === endCol) {
        // Vertical range of sparklines
        for (let row = startRow; row <= endRow; row++) {
          // Assume data is in adjacent columns
          const dataRangeForRow = dataRange.replace(/(\d+)/g, String(row + 1));
          dataRanges.push(dataRangeForRow.toUpperCase());
          locations.push({
            cell: `${String.fromCharCode(65 + startCol)}${row + 1}`,
            row,
            col: startCol,
          });
        }
      } else {
        // Horizontal range of sparklines
        for (let col = startCol; col <= endCol; col++) {
          const colLetter = String.fromCharCode(65 + col);
          dataRanges.push(dataRange.toUpperCase());
          locations.push({
            cell: `${colLetter}${startRow + 1}`,
            row: startRow,
            col,
          });
        }
      }

      addSparklineRange(sheetId, type, dataRanges, locations);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog sparkline-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Insert Sparklines</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          {/* Type Selection */}
          <div className="sparkline-types">
            <button
              className={`type-btn ${type === 'line' ? 'active' : ''}`}
              onClick={() => setType('line')}
            >
              <TrendingUp size={24} />
              <span>Line</span>
            </button>
            <button
              className={`type-btn ${type === 'column' ? 'active' : ''}`}
              onClick={() => setType('column')}
            >
              <BarChart3 size={24} />
              <span>Column</span>
            </button>
            <button
              className={`type-btn ${type === 'winloss' ? 'active' : ''}`}
              onClick={() => setType('winloss')}
            >
              <Activity size={24} />
              <span>Win/Loss</span>
            </button>
          </div>

          {/* Data Range */}
          <div className="form-group">
            <label>Data Range:</label>
            <input
              type="text"
              value={dataRange}
              onChange={(e) => setDataRange(e.target.value)}
              placeholder="e.g., B2:B10"
              className="range-input"
            />
            <span className="input-hint">Enter the range containing the data values</span>
          </div>

          {/* Location Range */}
          <div className="form-group">
            <label>Location Range:</label>
            <input
              type="text"
              value={locationRange}
              onChange={(e) => setLocationRange(e.target.value)}
              placeholder="e.g., A2 or A2:A10"
              className="range-input"
            />
            <span className="input-hint">Where to place the sparkline(s)</span>
          </div>

          {/* Color Selection */}
          <div className="form-group">
            <label>Color:</label>
            <div className="color-options">
              {Object.keys(SPARKLINE_PRESETS).map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                  style={{
                    backgroundColor: SPARKLINE_PRESETS[color]?.lineColor || '#2563eb'
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          {type === 'line' && (
            <div className="form-group">
              <label>Options:</label>
              <div className="checkbox-options">
                <label>
                  <input
                    type="checkbox"
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                  />
                  Show markers
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showHighLow}
                    onChange={(e) => setShowHighLow(e.target.checked)}
                  />
                  Highlight high/low points
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="form-group">
            <label>Preview:</label>
            <div className="sparkline-preview">
              <SparklinePreview type={type} color={selectedColor} showMarkers={showMarkers} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleInsert}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple preview component with mock data
const SparklinePreview: React.FC<{
  type: SparklineType;
  color: string;
  showMarkers: boolean;
}> = ({ type, color, showMarkers }) => {
  const mockData = [3, 7, 2, 9, 4, 6, 8, 5];
  const width = 200;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const colorPreset = SPARKLINE_PRESETS[color] || SPARKLINE_PRESETS.blue;
  const lineColor = colorPreset.lineColor || '#2563eb';
  const columnColor = colorPreset.columnColor || '#2563eb';
  const markerColor = colorPreset.markerColor || '#2563eb';
  const winColor = colorPreset.winColor || '#2563eb';

  const min = Math.min(...mockData);
  const max = Math.max(...mockData);
  const range = max - min;

  const normalize = (v: number) => (v - min) / range;

  if (type === 'line') {
    const points = mockData.map((v, i) => {
      const x = padding + (i / (mockData.length - 1)) * chartWidth;
      const y = padding + (1 - normalize(v)) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {showMarkers && mockData.map((v, i) => {
          const x = padding + (i / (mockData.length - 1)) * chartWidth;
          const y = padding + (1 - normalize(v)) * chartHeight;
          return <circle key={i} cx={x} cy={y} r={3} fill={markerColor} />;
        })}
      </svg>
    );
  }

  if (type === 'column') {
    const barWidth = (chartWidth / mockData.length) - 2;
    return (
      <svg width={width} height={height}>
        {mockData.map((v, i) => {
          const x = padding + (i / mockData.length) * chartWidth + 1;
          const barHeight = normalize(v) * chartHeight;
          return (
            <rect
              key={i}
              x={x}
              y={padding + chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={columnColor}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  if (type === 'winloss') {
    const winLossData = [1, 1, -1, 1, -1, -1, 1, 1];
    const barWidth = (chartWidth / winLossData.length) - 2;
    const halfHeight = chartHeight / 2;

    return (
      <svg width={width} height={height}>
        <line
          x1={padding}
          y1={padding + halfHeight}
          x2={width - padding}
          y2={padding + halfHeight}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        {winLossData.map((v, i) => {
          const x = padding + (i / winLossData.length) * chartWidth + 1;
          const isWin = v > 0;
          return (
            <rect
              key={i}
              x={x}
              y={isWin ? padding + 2 : padding + halfHeight + 2}
              width={barWidth}
              height={halfHeight - 4}
              fill={isWin ? winColor : '#dc2626'}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  return null;
};

export default SparklineDialog;
