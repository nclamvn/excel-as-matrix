import React, { useState, useMemo } from 'react';
import { X, BarChart3, LineChart, PieChart } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { useChartStore } from '../../stores/chartStore';
import { ChartType, DEFAULT_CHART_COLORS } from '../../types/visualization';

interface InsertChartDialogProps {
  type: 'bar' | 'line' | 'pie';
  onClose: () => void;
}

// Map simple type to visualization ChartType
const mapToChartType = (type: 'bar' | 'line' | 'pie'): ChartType => {
  switch (type) {
    case 'bar': return 'Bar';
    case 'line': return 'Line';
    case 'pie': return 'Pie';
    default: return 'Bar';
  }
};

export const InsertChartDialog: React.FC<InsertChartDialogProps> = ({
  type: initialType,
  onClose
}) => {
  const [chartType, setChartType] = useState(initialType);
  const [title, setTitle] = useState('Chart Title');

  const { selectionRange, workbookId, activeSheetId, getCellDisplayValue } = useWorkbookStore();
  const { showToast } = useUIStore();
  const { createChart, setChartData } = useChartStore();

  const colToLetter = (col: number): string => {
    let result = '';
    let n = col + 1;
    while (n > 0) {
      n -= 1;
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  };

  const getRangeString = () => {
    if (!selectionRange) return 'No selection';
    const start = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
    const end = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
    return start === end ? start : `${start}:${end}`;
  };

  // Extract data from selection
  const extractedData = useMemo(() => {
    if (!selectionRange || !activeSheetId) {
      return { categories: [] as string[], values: [] as number[] };
    }

    const categories: string[] = [];
    const values: number[] = [];

    const startRow = selectionRange.start.row;
    const endRow = selectionRange.end.row;
    const startCol = selectionRange.start.col;
    const endCol = selectionRange.end.col;

    // If single column, use row numbers as categories
    if (startCol === endCol) {
      for (let row = startRow; row <= endRow; row++) {
        const value = getCellDisplayValue(activeSheetId, row, startCol);
        const numValue = parseFloat(String(value)) || 0;
        categories.push(`Row ${row + 1}`);
        values.push(numValue);
      }
    }
    // If two columns, first is category, second is value
    else if (endCol - startCol === 1) {
      for (let row = startRow; row <= endRow; row++) {
        const cat = getCellDisplayValue(activeSheetId, row, startCol);
        const val = getCellDisplayValue(activeSheetId, row, startCol + 1);
        categories.push(String(cat) || `Item ${row - startRow + 1}`);
        values.push(parseFloat(String(val)) || 0);
      }
    }
    // Multiple columns - first column is category, rest are values (use first value column)
    else {
      for (let row = startRow; row <= endRow; row++) {
        const cat = getCellDisplayValue(activeSheetId, row, startCol);
        const val = getCellDisplayValue(activeSheetId, row, startCol + 1);
        categories.push(String(cat) || `Item ${row - startRow + 1}`);
        values.push(parseFloat(String(val)) || 0);
      }
    }

    return { categories, values };
  }, [selectionRange, activeSheetId, getCellDisplayValue]);

  const handleInsert = () => {
    if (!workbookId || !activeSheetId) {
      showToast('No active sheet', 'error');
      return;
    }

    // Create the chart
    const chart = createChart(workbookId, activeSheetId, title, mapToChartType(chartType));

    // Set chart data
    if (extractedData.categories.length > 0) {
      setChartData(chart.id, {
        chartId: chart.id,
        chartType: mapToChartType(chartType),
        categories: extractedData.categories,
        series: [{
          id: 'series-1',
          name: 'Values',
          values: extractedData.values,
          color: DEFAULT_CHART_COLORS[0],
          statistics: {
            min: Math.min(...extractedData.values),
            max: Math.max(...extractedData.values),
            sum: extractedData.values.reduce((a, b) => a + b, 0),
            avg: extractedData.values.reduce((a, b) => a + b, 0) / extractedData.values.length,
            count: extractedData.values.length,
          },
        }],
        bounds: {
          minValue: Math.min(...extractedData.values, 0),
          maxValue: Math.max(...extractedData.values),
          suggestedMin: 0,
          suggestedMax: Math.max(...extractedData.values) * 1.1,
        },
      });
    }

    showToast(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart created!`, 'success');
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
