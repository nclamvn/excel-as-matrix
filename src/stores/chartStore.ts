// Phase 5: Chart Store
// State management for charts with D3.js integration

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Chart,
  ChartType,
  ChartData,
  ChartSeries,
  ChartPosition,
  PieChartData,
  DEFAULT_CHART_COLORS,
} from '../types/visualization';

interface ChartState {
  charts: Map<string, Chart>;
  chartData: Map<string, ChartData>;
  selectedChartId: string | null;
  editingChartId: string | null;
  hoveredSeriesId: string | null;
  isCreating: boolean;
  loading: boolean;
  error: string | null;
}

interface ChartActions {
  // Chart CRUD
  createChart: (workbookId: string, sheetId: string, name: string, type: ChartType) => Chart;
  updateChart: (chartId: string, updates: Partial<Chart>) => void;
  deleteChart: (chartId: string) => void;

  // Data management
  setChartData: (chartId: string, data: ChartData) => void;

  // Series management
  addSeries: (chartId: string, series: ChartSeries) => void;
  updateSeries: (chartId: string, seriesId: string, updates: Partial<ChartSeries>) => void;
  removeSeries: (chartId: string, seriesId: string) => void;

  // Position
  updatePosition: (chartId: string, position: Partial<ChartPosition>) => void;

  // Selection & UI state
  selectChart: (chartId: string | null) => void;
  startEditing: (chartId: string | null) => void;
  hoverSeries: (seriesId: string | null) => void;
  setCreating: (creating: boolean) => void;

  // Loading
  getChartsBySheet: (sheetId: string) => Chart[];
  getChartsByWorkbook: (workbookId: string) => Chart[];

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: ChartState = {
  charts: new Map(),
  chartData: new Map(),
  selectedChartId: null,
  editingChartId: null,
  hoveredSeriesId: null,
  isCreating: false,
  loading: false,
  error: null,
};

export const useChartStore = create<ChartState & ChartActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      createChart: (workbookId, sheetId, name, chartType) => {
        const chart: Chart = {
          id: crypto.randomUUID(),
          workbookId,
          sheetId,
          name,
          chartType,
          dataSource: {
            sourceType: 'Range',
            categoriesInFirstColumn: true,
            seriesInRows: false,
          },
          series: [],
          position: {
            anchorType: 'Floating',
            x: 100,
            y: 100,
            width: 500,
            height: 300,
            zIndex: 1,
          },
          legend: {
            visible: true,
            position: 'Bottom',
            fontSize: 12,
          },
          axes: {
            xAxis: {
              visible: true,
              gridlines: true,
              labelsVisible: true,
              labelRotation: 0,
            },
            yAxis: {
              visible: true,
              gridlines: true,
              labelsVisible: true,
              labelRotation: 0,
            },
          },
          colors: [...DEFAULT_CHART_COLORS],
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#E0E0E0',
            borderWidth: 1,
            shadow: false,
            roundedCorners: true,
            animation: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => {
          const charts = new Map(state.charts);
          charts.set(chart.id, chart);
          return { charts };
        });

        return chart;
      },

      updateChart: (chartId, updates) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chart = charts.get(chartId);
          if (chart) {
            charts.set(chartId, {
              ...chart,
              ...updates,
              updatedAt: new Date().toISOString(),
            });
          }
          return { charts };
        });
      },

      deleteChart: (chartId) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chartData = new Map(state.chartData);
          charts.delete(chartId);
          chartData.delete(chartId);
          return {
            charts,
            chartData,
            selectedChartId: state.selectedChartId === chartId ? null : state.selectedChartId,
            editingChartId: state.editingChartId === chartId ? null : state.editingChartId,
          };
        });
      },

      setChartData: (chartId, data) => {
        set((state) => {
          const chartData = new Map(state.chartData);
          chartData.set(chartId, data);
          return { chartData };
        });
      },

      addSeries: (chartId, series) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chart = charts.get(chartId);
          if (chart) {
            const colorIndex = chart.series.length;
            const newSeries = {
              ...series,
              color: series.color || DEFAULT_CHART_COLORS[colorIndex % DEFAULT_CHART_COLORS.length],
            };
            charts.set(chartId, {
              ...chart,
              series: [...chart.series, newSeries],
              updatedAt: new Date().toISOString(),
            });
          }
          return { charts };
        });
      },

      updateSeries: (chartId, seriesId, updates) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chart = charts.get(chartId);
          if (chart) {
            charts.set(chartId, {
              ...chart,
              series: chart.series.map((s) =>
                s.id === seriesId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date().toISOString(),
            });
          }
          return { charts };
        });
      },

      removeSeries: (chartId, seriesId) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chart = charts.get(chartId);
          if (chart) {
            charts.set(chartId, {
              ...chart,
              series: chart.series.filter((s) => s.id !== seriesId),
              updatedAt: new Date().toISOString(),
            });
          }
          return { charts };
        });
      },

      updatePosition: (chartId, position) => {
        set((state) => {
          const charts = new Map(state.charts);
          const chart = charts.get(chartId);
          if (chart) {
            charts.set(chartId, {
              ...chart,
              position: { ...chart.position, ...position },
              updatedAt: new Date().toISOString(),
            });
          }
          return { charts };
        });
      },

      selectChart: (chartId) => {
        set({ selectedChartId: chartId });
      },

      startEditing: (chartId) => {
        set({ editingChartId: chartId });
      },

      hoverSeries: (seriesId) => {
        set({ hoveredSeriesId: seriesId });
      },

      setCreating: (creating) => {
        set({ isCreating: creating });
      },

      getChartsBySheet: (sheetId) => {
        const { charts } = get();
        return Array.from(charts.values()).filter((c) => c.sheetId === sheetId);
      },

      getChartsByWorkbook: (workbookId) => {
        const { charts } = get();
        return Array.from(charts.values()).filter((c) => c.workbookId === workbookId);
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'chart-store' }
  )
);

// Utility functions for chart data processing
export function calculateSeriesStatistics(values: number[]) {
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

export function calculateDataBounds(series: { values: number[] }[]) {
  if (series.length === 0) {
    return { minValue: 0, maxValue: 100, suggestedMin: 0, suggestedMax: 100 };
  }

  const allValues = series.flatMap((s) => s.values);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;

  const suggestedMin = minValue >= 0 ? 0 : minValue - padding;
  const suggestedMax = maxValue + padding;

  return { minValue, maxValue, suggestedMin, suggestedMax };
}

export function buildPieChartData(
  chartId: string,
  labels: string[],
  values: number[],
  colors: string[]
): PieChartData {
  const total = values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;

  const slices = labels.map((label, i) => {
    const value = values[i] || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      label,
      value,
      percentage,
      color: colors[i % colors.length],
      startAngle,
      endAngle,
    };
  });

  return { chartId, slices, total };
}

export function calculateTrendline(values: number[]) {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, points: [] };
  }

  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * values[i], 0);
  const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssTot = values.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = xValues.reduce((acc, x, i) => {
    const predicted = slope * x + intercept;
    return acc + Math.pow(values[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const points: [number, number][] = [
    [0, intercept],
    [n - 1, slope * (n - 1) + intercept],
  ];

  return { slope, intercept, rSquared, points };
}
