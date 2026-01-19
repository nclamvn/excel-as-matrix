// ============================================================
// PIVOT CHART UTILITIES
// Functions to convert pivot table data to chart data
// ============================================================

import { PivotTable, PivotAreaField, PivotCellValue } from '../types/pivot';
import { ChartType, ChartData, SeriesData, DEFAULT_CHART_COLORS } from '../types/visualization';
import { aggregate } from '../stores/pivotStore';

export interface PivotChartConfig {
  chartType: ChartType;
  pivotId: string;
  title?: string;
  useRowsAsCategories: boolean; // If true, rows are X-axis; if false, columns are X-axis
  selectedValueFields?: string[]; // Which value fields to include (default all)
}

export interface PivotChartData {
  categories: string[];
  series: SeriesData[];
  chartType: ChartType;
  title: string;
}

/**
 * Extracts chart-compatible data from pivot table result
 */
export function extractPivotChartData(
  pivot: PivotTable,
  sourceData: PivotCellValue[][],
  config: PivotChartConfig
): PivotChartData {
  const { chartType, useRowsAsCategories, selectedValueFields } = config;

  // Get row and column field data
  const rowLabels = getFieldUniqueValues(pivot, 'row', sourceData);
  const colLabels = getFieldUniqueValues(pivot, 'column', sourceData);

  // Determine categories based on configuration
  const categories = useRowsAsCategories ? rowLabels : colLabels;
  const seriesLabels = useRowsAsCategories ? colLabels : rowLabels;

  // Get value fields to chart
  const valueFields = pivot.valueFields.filter(vf =>
    !selectedValueFields || selectedValueFields.includes(vf.fieldId)
  );

  // Build series data
  const series: SeriesData[] = [];

  if (seriesLabels.length === 0) {
    // No column/row grouping - one series per value field
    valueFields.forEach((vf, idx) => {
      const fieldDef = pivot.fields.find(f => f.id === vf.fieldId);
      const seriesData = buildSeriesFromValues(
        pivot,
        sourceData,
        vf,
        categories,
        useRowsAsCategories
      );

      series.push({
        id: `series_${vf.fieldId}`,
        name: vf.customName || fieldDef?.name || `Series ${idx + 1}`,
        values: seriesData,
        color: DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length],
        statistics: calculateStats(seriesData),
      });
    });
  } else {
    // Multiple series from row/column grouping
    seriesLabels.forEach((label, idx) => {
      const seriesData = buildSeriesForLabel(
        pivot,
        sourceData,
        valueFields[0], // Use first value field
        categories,
        label,
        useRowsAsCategories
      );

      series.push({
        id: `series_${idx}`,
        name: label,
        values: seriesData,
        color: DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length],
        statistics: calculateStats(seriesData),
      });
    });
  }

  return {
    categories,
    series,
    chartType,
    title: config.title || `${pivot.name} Chart`,
  };
}

/**
 * Get unique values for a field area (row or column)
 */
function getFieldUniqueValues(
  pivot: PivotTable,
  area: 'row' | 'column',
  sourceData: PivotCellValue[][]
): string[] {
  const areaFields = area === 'row' ? pivot.rowFields : pivot.columnFields;
  if (areaFields.length === 0) return [];

  const firstField = areaFields[0];
  const fieldDef = pivot.fields.find(f => f.id === firstField.fieldId);
  if (!fieldDef) return [];

  const colIndex = fieldDef.sourceColumn;
  const values = new Set<string>();

  // Skip header row (index 0)
  for (let i = 1; i < sourceData.length; i++) {
    const value = sourceData[i]?.[colIndex];
    if (value !== undefined && value !== null && value !== '') {
      values.add(formatGroupValue(value, firstField));
    }
  }

  return Array.from(values).sort();
}

/**
 * Format a value based on grouping settings
 */
function formatGroupValue(value: PivotCellValue, field: PivotAreaField): string {
  if (field.dateGrouping && value instanceof Date) {
    switch (field.dateGrouping) {
      case 'years':
        return value.getFullYear().toString();
      case 'quarters':
        return `Q${Math.ceil((value.getMonth() + 1) / 3)} ${value.getFullYear()}`;
      case 'months':
        return value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'days':
        return value.toLocaleDateString();
      default:
        return String(value);
    }
  }
  return String(value);
}

/**
 * Build series values for a single value field
 */
function buildSeriesFromValues(
  pivot: PivotTable,
  sourceData: PivotCellValue[][],
  valueField: PivotAreaField,
  categories: string[],
  useRowsAsCategories: boolean
): number[] {
  const fieldDef = pivot.fields.find(f => f.id === valueField.fieldId);
  if (!fieldDef) return categories.map(() => 0);

  const valueColIndex = fieldDef.sourceColumn;
  const categoryField = useRowsAsCategories
    ? pivot.rowFields[0]
    : pivot.columnFields[0];

  if (!categoryField) {
    // No grouping - aggregate all values
    const allValues = sourceData.slice(1)
      .map(row => parseFloat(String(row[valueColIndex] ?? '')) || 0);
    return [aggregate(allValues, valueField.aggregateFunction || 'sum')];
  }

  const categoryFieldDef = pivot.fields.find(f => f.id === categoryField.fieldId);
  if (!categoryFieldDef) return categories.map(() => 0);

  const categoryColIndex = categoryFieldDef.sourceColumn;

  // Group values by category
  const valuesByCategory = new Map<string, number[]>();
  categories.forEach(cat => valuesByCategory.set(cat, []));

  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    const categoryValue = formatGroupValue(row[categoryColIndex], categoryField);
    const numValue = parseFloat(String(row[valueColIndex] ?? '')) || 0;

    if (valuesByCategory.has(categoryValue)) {
      valuesByCategory.get(categoryValue)!.push(numValue);
    }
  }

  // Aggregate values for each category
  return categories.map(cat => {
    const values = valuesByCategory.get(cat) || [];
    return aggregate(values, valueField.aggregateFunction || 'sum');
  });
}

/**
 * Build series values for a specific label (row or column value)
 */
function buildSeriesForLabel(
  pivot: PivotTable,
  sourceData: PivotCellValue[][],
  valueField: PivotAreaField,
  categories: string[],
  seriesLabel: string,
  useRowsAsCategories: boolean
): number[] {
  const valueFieldDef = pivot.fields.find(f => f.id === valueField.fieldId);
  if (!valueFieldDef) return categories.map(() => 0);

  const valueColIndex = valueFieldDef.sourceColumn;

  const categoryField = useRowsAsCategories
    ? pivot.rowFields[0]
    : pivot.columnFields[0];
  const seriesField = useRowsAsCategories
    ? pivot.columnFields[0]
    : pivot.rowFields[0];

  if (!categoryField || !seriesField) return categories.map(() => 0);

  const categoryFieldDef = pivot.fields.find(f => f.id === categoryField.fieldId);
  const seriesFieldDef = pivot.fields.find(f => f.id === seriesField.fieldId);

  if (!categoryFieldDef || !seriesFieldDef) return categories.map(() => 0);

  const categoryColIndex = categoryFieldDef.sourceColumn;
  const seriesColIndex = seriesFieldDef.sourceColumn;

  // Group values by category for this series
  const valuesByCategory = new Map<string, number[]>();
  categories.forEach(cat => valuesByCategory.set(cat, []));

  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    const categoryValue = formatGroupValue(row[categoryColIndex], categoryField);
    const seriesValue = formatGroupValue(row[seriesColIndex], seriesField);
    const numValue = parseFloat(String(row[valueColIndex] ?? '')) || 0;

    if (seriesValue === seriesLabel && valuesByCategory.has(categoryValue)) {
      valuesByCategory.get(categoryValue)!.push(numValue);
    }
  }

  return categories.map(cat => {
    const values = valuesByCategory.get(cat) || [];
    return aggregate(values, valueField.aggregateFunction || 'sum');
  });
}

/**
 * Calculate statistics for a series
 */
function calculateStats(values: number[]): SeriesData['statistics'] {
  if (values.length === 0) {
    return { min: 0, max: 0, sum: 0, avg: 0, count: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const count = values.length;
  const avg = sum / count;

  return { min, max, sum, avg, count };
}

/**
 * Get recommended chart types for pivot data structure
 */
export function getRecommendedChartTypes(pivot: PivotTable): ChartType[] {
  const hasMultipleRowFields = pivot.rowFields.length > 0;
  const hasMultipleColFields = pivot.columnFields.length > 0;
  const hasMultipleValueFields = pivot.valueFields.length > 1;

  const types: ChartType[] = [];

  // Bar charts work well for most pivot data
  types.push('Bar', 'ColumnClustered');

  // Line charts good for trends
  if (hasMultipleRowFields || hasMultipleColFields) {
    types.push('Line', 'Area');
  }

  // Stacked charts for comparing parts of a whole
  if (hasMultipleColFields || hasMultipleValueFields) {
    types.push('ColumnStacked', 'AreaStacked');
  }

  // Pie charts for single series with categories
  if (pivot.valueFields.length === 1 && !hasMultipleColFields) {
    types.push('Pie', 'Doughnut');
  }

  // Combo charts for multiple value fields
  if (hasMultipleValueFields) {
    types.push('Combo');
  }

  return types;
}

/**
 * Convert pivot chart data to ChartData format for the chart renderer
 */
export function toChartData(chartId: string, pivotChartData: PivotChartData): ChartData {
  const allValues = pivotChartData.series.flatMap(s => s.values);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;

  return {
    chartId,
    chartType: pivotChartData.chartType,
    categories: pivotChartData.categories,
    series: pivotChartData.series,
    bounds: {
      minValue,
      maxValue,
      suggestedMin: minValue >= 0 ? 0 : minValue - range * 0.1,
      suggestedMax: maxValue + range * 0.1,
    },
  };
}
