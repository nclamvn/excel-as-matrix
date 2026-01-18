import React, { useState, useMemo } from 'react';
import { X, BarChart3, LineChart, PieChart, Layers, TrendingUp, Grid3X3 } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { useChartStore } from '../../stores/chartStore';
import { useChartTemplateStore } from '../../stores/chartTemplateStore';
import { ChartType, ChartTemplate, ColorScheme, DEFAULT_CHART_COLORS } from '../../types/visualization';
import { ChartTemplatesDialog } from '../Charts/ChartTemplatesDialog';

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
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChartTemplate | null>(null);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme | null>(null);

  const { selectionRange, workbookId, activeSheetId, getCellDisplayValue } = useWorkbookStore();
  const { showToast } = useUIStore();
  const { createChart, setChartData, updateChart } = useChartStore();
  const { addToRecent } = useChartTemplateStore();

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

  const handleSelectTemplate = (template: ChartTemplate, colorScheme?: ColorScheme) => {
    setSelectedTemplate(template);
    setSelectedColorScheme(colorScheme || null);
    setShowTemplatesDialog(false);

    // Update chart type based on template
    const simpleType = template.chartType === 'Bar' ? 'bar' :
                       template.chartType === 'Line' ? 'line' :
                       template.chartType === 'Pie' || template.chartType === 'Doughnut' ? 'pie' : 'bar';
    setChartType(simpleType);
  };

  const handleInsert = () => {
    if (!workbookId || !activeSheetId) {
      showToast('No active sheet', 'error');
      return;
    }

    // Determine chart type from template or selection
    const finalChartType = selectedTemplate ? selectedTemplate.chartType : mapToChartType(chartType);

    // Create the chart
    const chart = createChart(workbookId, activeSheetId, title, finalChartType);

    // Apply template settings if selected
    if (selectedTemplate) {
      const colors = selectedColorScheme?.colors || selectedTemplate.colorScheme;
      updateChart(chart.id, {
        colors,
        style: selectedTemplate.style,
        legend: selectedTemplate.legendConfig,
        axes: selectedTemplate.axesConfig,
      });
      addToRecent(selectedTemplate.id);
    }

    // Set chart data
    if (extractedData.categories.length > 0) {
      const colors = selectedColorScheme?.colors || selectedTemplate?.colorScheme || DEFAULT_CHART_COLORS;
      setChartData(chart.id, {
        chartId: chart.id,
        chartType: finalChartType,
        categories: extractedData.categories,
        series: [{
          id: 'series-1',
          name: 'Values',
          values: extractedData.values,
          color: colors[0],
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

    const chartTypeName = selectedTemplate?.name || (chartType.charAt(0).toUpperCase() + chartType.slice(1));
    showToast(`${chartTypeName} chart created!`, 'success');
    onClose();
  };

  return (
    <>
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
          <div className="dialog-header">
            <h2>Insert Chart</h2>
            <button className="dialog-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="dialog-body">
            {/* Template Selection */}
            <div className="dialog-field">
              <label>Template</label>
              {selectedTemplate ? (
                <div className="selected-template-info">
                  <div className="template-badge">
                    <Layers size={14} />
                    <span>{selectedTemplate.name}</span>
                    <button
                      className="clear-template-btn"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setSelectedColorScheme(null);
                      }}
                      title="Clear template"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {selectedColorScheme && (
                    <div className="color-scheme-badge">
                      <div className="mini-color-bar">
                        {selectedColorScheme.colors.slice(0, 4).map((c, i) => (
                          <div key={i} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span>{selectedColorScheme.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="browse-templates-btn"
                  onClick={() => setShowTemplatesDialog(true)}
                >
                  <Grid3X3 size={16} />
                  <span>Browse Templates</span>
                </button>
              )}
            </div>

            {/* Chart Type */}
            <div className="dialog-field">
              <label>Chart Type</label>
              <div className="chart-type-selector">
                <button
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => { setChartType('bar'); setSelectedTemplate(null); }}
                >
                  <BarChart3 size={24} />
                  <span>Bar</span>
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                  onClick={() => { setChartType('line'); setSelectedTemplate(null); }}
                >
                  <LineChart size={24} />
                  <span>Line</span>
                </button>
                <button
                  className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                  onClick={() => { setChartType('pie'); setSelectedTemplate(null); }}
                >
                  <PieChart size={24} />
                  <span>Pie</span>
                </button>
                <button
                  className={`chart-type-btn ${selectedTemplate && !['bar', 'line', 'pie'].includes(chartType) ? 'active' : ''}`}
                  onClick={() => setShowTemplatesDialog(true)}
                  title="More chart types"
                >
                  <TrendingUp size={24} />
                  <span>More</span>
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

      {/* Chart Templates Dialog */}
      <ChartTemplatesDialog
        isOpen={showTemplatesDialog}
        onClose={() => setShowTemplatesDialog(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
};
