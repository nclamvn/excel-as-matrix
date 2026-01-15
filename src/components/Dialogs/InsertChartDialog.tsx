import React, { useState } from 'react';
import { X, BarChart3, LineChart, PieChart } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface InsertChartDialogProps {
  type: 'bar' | 'line' | 'pie';
  onClose: () => void;
}

export const InsertChartDialog: React.FC<InsertChartDialogProps> = ({
  type: initialType,
  onClose
}) => {
  const [chartType, setChartType] = useState(initialType);
  const [title, setTitle] = useState('Chart Title');
  const { selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const colToLetter = (col: number): string => {
    return String.fromCharCode(65 + col);
  };

  const getRangeString = () => {
    if (!selectionRange) return 'No selection';
    const start = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
    const end = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
    return start === end ? start : `${start}:${end}`;
  };

  const handleInsert = () => {
    console.log(`Creating ${chartType} chart from ${getRangeString()} with title "${title}"`);
    showToast(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart created from ${getRangeString()}`, 'success');
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
        <div className="dialog-header">
          <h2>Insert Chart</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Chart Type */}
          <div className="dialog-field">
            <label>Chart Type</label>
            <div className="chart-type-selector">
              <button
                className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                <BarChart3 size={24} />
                <span>Bar</span>
              </button>
              <button
                className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                <LineChart size={24} />
                <span>Line</span>
              </button>
              <button
                className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                <PieChart size={24} />
                <span>Pie</span>
              </button>
            </div>
          </div>

          {/* Data Range */}
          <div className="dialog-field">
            <label>Data Range</label>
            <input
              type="text"
              value={getRangeString()}
              readOnly
              className="dialog-input"
            />
            <small>Select data in the grid before opening this dialog</small>
          </div>

          {/* Chart Title */}
          <div className="dialog-field">
            <label>Chart Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter chart title"
              className="dialog-input"
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleInsert}>
            Insert Chart
          </button>
        </div>
      </div>
    </div>
  );
};
