// ============================================================
// PIVOT CHART DIALOG — Create Charts from Pivot Table Data
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  BarChart2,
  LineChart,
  PieChart,
  AreaChart,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useChartStore } from '../../stores/chartStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { PivotTable, PivotCellValue } from '../../types/pivot';
import { ChartType, DEFAULT_CHART_COLORS } from '../../types/visualization';
import {
  extractPivotChartData,
  getRecommendedChartTypes,
  toChartData,
  PivotChartConfig,
} from '../../utils/pivotChartUtils';
import { loggers } from '@/utils/logger';
import './PivotTable.css';

interface PivotChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pivot: PivotTable;
}

interface ChartTypeOption {
  type: ChartType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  {
    type: 'ColumnClustered',
    label: 'Column',
    icon: <BarChart2 size={24} className="rotate-90" />,
    description: 'Compare values across categories',
  },
  {
    type: 'Bar',
    label: 'Bar',
    icon: <BarChart2 size={24} />,
    description: 'Horizontal comparison',
  },
  {
    type: 'Line',
    label: 'Line',
    icon: <LineChart size={24} />,
    description: 'Show trends over time',
  },
  {
    type: 'Area',
    label: 'Area',
    icon: <AreaChart size={24} />,
    description: 'Show volume changes',
  },
  {
    type: 'AreaStacked',
    label: 'Stacked Area',
    icon: <Layers size={24} />,
    description: 'Compare parts of a whole over time',
  },
  {
    type: 'ColumnStacked',
    label: 'Stacked Column',
    icon: <Layers size={24} className="rotate-90" />,
    description: 'Compare parts of a whole',
  },
  {
    type: 'Pie',
    label: 'Pie',
    icon: <PieChart size={24} />,
    description: 'Show proportion of parts',
  },
  {
    type: 'Doughnut',
    label: 'Doughnut',
    icon: <PieChart size={24} />,
    description: 'Show proportion with center space',
  },
  {
    type: 'Combo',
    label: 'Combo',
    icon: <TrendingUp size={24} />,
    description: 'Combine chart types',
  },
];

export const PivotChartDialog: React.FC<PivotChartDialogProps> = ({
  isOpen,
  onClose,
  pivot,
}) => {
  const { activeSheetId, getCellValue } = useWorkbookStore();
  const { createChart, setChartData } = useChartStore();

  const [selectedType, setSelectedType] = useState<ChartType>('ColumnClustered');
  const [chartTitle, setChartTitle] = useState(`${pivot.name} Chart`);
  const [useRowsAsCategories, setUseRowsAsCategories] = useState(true);
  const [selectedValueFields, setSelectedValueFields] = useState<string[]>(
    pivot.valueFields.map(vf => vf.fieldId)
  );

  // Get recommended chart types
  const recommendedTypes = useMemo(
    () => getRecommendedChartTypes(pivot),
    [pivot]
  );

  // Get source data using getCellValue
  const sourceData = useMemo(() => {
    const data: PivotCellValue[][] = [];

    // Parse source range
    const rangeMatch = pivot.sourceRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
    if (!rangeMatch) return data;

    const startCol = rangeMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(rangeMatch[2], 10) - 1;
    const endCol = rangeMatch[3].toUpperCase().charCodeAt(0) - 65;
    const endRow = parseInt(rangeMatch[4], 10) - 1;

    for (let r = startRow; r <= endRow; r++) {
      const row: PivotCellValue[] = [];
      for (let c = startCol; c <= endCol; c++) {
        row.push(getCellValue(pivot.sourceSheetId, r, c) ?? '');
      }
      data.push(row);
    }

    return data;
  }, [getCellValue, pivot.sourceSheetId, pivot.sourceRange]);

  // Preview chart data
  const previewData = useMemo(() => {
    if (sourceData.length === 0) return null;

    const config: PivotChartConfig = {
      chartType: selectedType,
      pivotId: pivot.id,
      title: chartTitle,
      useRowsAsCategories,
      selectedValueFields: selectedValueFields.length > 0 ? selectedValueFields : undefined,
    };

    try {
      return extractPivotChartData(pivot, sourceData, config);
    } catch (e) {
      loggers.ui.error('Error extracting pivot chart data:', e);
      return null;
    }
  }, [pivot, sourceData, selectedType, chartTitle, useRowsAsCategories, selectedValueFields]);

  const handleValueFieldToggle = (fieldId: string) => {
    setSelectedValueFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  const handleCreateChart = () => {
    if (!previewData || !activeSheetId) return;

    // Create the chart
    const chart = createChart(
      'workbook_1', // Default workbook ID
      activeSheetId,
      chartTitle,
      selectedType
    );

    // Set the chart data
    setChartData(chart.id, toChartData(chart.id, previewData));

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pivot-dialog-overlay" onClick={onClose}>
      <div
        className="pivot-dialog pivot-chart-dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="pivot-dialog-header">
          <div className="pivot-dialog-title">
            <BarChart2 size={20} />
            <h2>Create Pivot Chart</h2>
          </div>
          <button className="pivot-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pivot-dialog-body">
          {/* Chart Title */}
          <div className="pivot-dialog-section">
            <h3>Chart Title</h3>
            <input
              type="text"
              value={chartTitle}
              onChange={e => setChartTitle(e.target.value)}
              className="pivot-dialog-input"
              placeholder="Enter chart title..."
            />
          </div>

          {/* Chart Type Selection */}
          <div className="pivot-dialog-section">
            <h3>Chart Type</h3>
            <p className="section-hint">
              Recommended: {recommendedTypes.slice(0, 3).join(', ')}
            </p>
            <div className="chart-type-grid">
              {CHART_TYPE_OPTIONS.map(option => (
                <button
                  key={option.type}
                  className={`chart-type-btn ${selectedType === option.type ? 'selected' : ''} ${recommendedTypes.includes(option.type) ? 'recommended' : ''}`}
                  onClick={() => setSelectedType(option.type)}
                  title={option.description}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Configuration */}
          <div className="pivot-dialog-section">
            <h3>Data Configuration</h3>
            <div className="config-options">
              <label className="config-option">
                <input
                  type="radio"
                  checked={useRowsAsCategories}
                  onChange={() => setUseRowsAsCategories(true)}
                />
                <span>Use Row Fields as Categories (X-axis)</span>
              </label>
              <label className="config-option">
                <input
                  type="radio"
                  checked={!useRowsAsCategories}
                  onChange={() => setUseRowsAsCategories(false)}
                />
                <span>Use Column Fields as Categories (X-axis)</span>
              </label>
            </div>
          </div>

          {/* Value Fields Selection */}
          {pivot.valueFields.length > 1 && (
            <div className="pivot-dialog-section">
              <h3>Value Fields</h3>
              <p className="section-hint">Select which value fields to include in the chart</p>
              <div className="value-field-list">
                {pivot.valueFields.map(vf => {
                  const fieldDef = pivot.fields.find(f => f.id === vf.fieldId);
                  return (
                    <label key={vf.fieldId} className="value-field-option">
                      <input
                        type="checkbox"
                        checked={selectedValueFields.includes(vf.fieldId)}
                        onChange={() => handleValueFieldToggle(vf.fieldId)}
                      />
                      <span>{vf.customName || fieldDef?.name || 'Field'}</span>
                      <span className="field-aggregate">({vf.aggregateFunction || 'sum'})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart Preview */}
          <div className="pivot-dialog-section">
            <h3>Preview</h3>
            <div className="chart-preview">
              {previewData ? (
                <div className="preview-content">
                  <div className="preview-summary">
                    <strong>{previewData.title}</strong>
                    <span className="preview-stats">
                      {previewData.categories.length} categories,{' '}
                      {previewData.series.length} series
                    </span>
                  </div>
                  <div className="preview-data">
                    <div className="preview-categories">
                      <strong>Categories:</strong>{' '}
                      {previewData.categories.slice(0, 5).join(', ')}
                      {previewData.categories.length > 5 && '...'}
                    </div>
                    <div className="preview-series">
                      <strong>Series:</strong>
                      {previewData.series.map((s, i) => (
                        <span
                          key={s.id}
                          className="series-badge"
                          style={{ backgroundColor: DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length] }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Mini bar chart visualization */}
                  <div className="preview-mini-chart">
                    {previewData.series[0]?.values.slice(0, 8).map((val, i) => {
                      const max = Math.max(...previewData.series[0].values);
                      const height = max > 0 ? (val / max) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="preview-bar"
                          style={{
                            height: `${Math.max(5, height)}%`,
                            backgroundColor: DEFAULT_CHART_COLORS[0],
                          }}
                          title={`${previewData.categories[i]}: ${val}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="preview-empty">
                  <p>No data available for chart preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pivot-dialog-footer">
          <button className="pivot-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pivot-btn-primary"
            onClick={handleCreateChart}
            disabled={!previewData}
          >
            Create Chart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PivotChartDialog;
