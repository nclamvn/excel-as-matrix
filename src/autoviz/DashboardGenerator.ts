// =============================================================================
// DASHBOARD GENERATOR — Generate smart dashboards from data
// =============================================================================

import type {
  Dashboard,
  DashboardLayout,
  DashboardChart,
  DashboardFilter,
  ChartConfig,
  DataRange,
  DataCharacteristics,
  ColorScheme,
  ChartType,
} from './types';
import { ChartGenerator } from './ChartGenerator';
import { ChartBeautifier } from './ChartBeautifier';
import { COLOR_SCHEMES } from './ColorSchemes';

/**
 * Dashboard template types
 */
export type DashboardTemplate =
  | 'overview'
  | 'sales'
  | 'financial'
  | 'marketing'
  | 'operations'
  | 'kpi_focused'
  | 'comparison'
  | 'trend_analysis';

/**
 * Dashboard configuration options
 */
export interface DashboardOptions {
  name?: string;
  description?: string;
  template?: DashboardTemplate;
  columns?: number;
  theme?: string | ColorScheme;
  includeFilters?: boolean;
  includeKpis?: boolean;
  maxCharts?: number;
}

/**
 * Chart position in grid
 */
interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Template configuration
 */
interface TemplateConfig {
  charts: Array<{
    type: ChartType;
    position: GridPosition;
    title?: string;
  }>;
  includeKpis: boolean;
  kpiCount: number;
  layout: Partial<DashboardLayout>;
}

/**
 * Template definitions
 */
const TEMPLATES: Record<DashboardTemplate, TemplateConfig> = {
  overview: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'kpi', position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'kpi', position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'kpi', position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'line', position: { x: 0, y: 2, w: 8, h: 4 }, title: 'Trend' },
      { type: 'pie', position: { x: 8, y: 2, w: 4, h: 4 }, title: 'Distribution' },
      { type: 'bar', position: { x: 0, y: 6, w: 6, h: 4 }, title: 'Top Items' },
      { type: 'column', position: { x: 6, y: 6, w: 6, h: 4 }, title: 'Comparison' },
    ],
    includeKpis: true,
    kpiCount: 4,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  sales: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 }, title: 'Total Sales' },
      { type: 'kpi', position: { x: 3, y: 0, w: 3, h: 2 }, title: 'Orders' },
      { type: 'kpi', position: { x: 6, y: 0, w: 3, h: 2 }, title: 'Avg Order' },
      { type: 'gauge', position: { x: 9, y: 0, w: 3, h: 2 }, title: 'Target' },
      { type: 'line', position: { x: 0, y: 2, w: 8, h: 4 }, title: 'Sales Trend' },
      { type: 'donut', position: { x: 8, y: 2, w: 4, h: 4 }, title: 'By Category' },
      { type: 'bar', position: { x: 0, y: 6, w: 6, h: 4 }, title: 'Top Products' },
      { type: 'heatmap', position: { x: 6, y: 6, w: 6, h: 4 }, title: 'Sales by Region' },
    ],
    includeKpis: true,
    kpiCount: 3,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  financial: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 4, h: 2 }, title: 'Revenue' },
      { type: 'kpi', position: { x: 4, y: 0, w: 4, h: 2 }, title: 'Expenses' },
      { type: 'kpi', position: { x: 8, y: 0, w: 4, h: 2 }, title: 'Profit' },
      { type: 'waterfall', position: { x: 0, y: 2, w: 6, h: 5 }, title: 'P&L Breakdown' },
      { type: 'line', position: { x: 6, y: 2, w: 6, h: 5 }, title: 'Revenue Trend' },
      { type: 'stacked_bar', position: { x: 0, y: 7, w: 12, h: 4 }, title: 'By Category' },
    ],
    includeKpis: true,
    kpiCount: 3,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  marketing: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 3, h: 2 }, title: 'Leads' },
      { type: 'kpi', position: { x: 3, y: 0, w: 3, h: 2 }, title: 'Conversions' },
      { type: 'kpi', position: { x: 6, y: 0, w: 3, h: 2 }, title: 'CAC' },
      { type: 'kpi', position: { x: 9, y: 0, w: 3, h: 2 }, title: 'ROI' },
      { type: 'funnel', position: { x: 0, y: 2, w: 5, h: 5 }, title: 'Conversion Funnel' },
      { type: 'line', position: { x: 5, y: 2, w: 7, h: 5 }, title: 'Campaign Performance' },
      { type: 'pie', position: { x: 0, y: 7, w: 4, h: 4 }, title: 'Traffic Sources' },
      { type: 'bar', position: { x: 4, y: 7, w: 8, h: 4 }, title: 'Top Campaigns' },
    ],
    includeKpis: true,
    kpiCount: 4,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  operations: {
    charts: [
      { type: 'gauge', position: { x: 0, y: 0, w: 4, h: 3 }, title: 'Efficiency' },
      { type: 'gauge', position: { x: 4, y: 0, w: 4, h: 3 }, title: 'Quality' },
      { type: 'gauge', position: { x: 8, y: 0, w: 4, h: 3 }, title: 'Uptime' },
      { type: 'line', position: { x: 0, y: 3, w: 8, h: 4 }, title: 'Performance Trend' },
      { type: 'bar', position: { x: 8, y: 3, w: 4, h: 4 }, title: 'By Department' },
      { type: 'heatmap', position: { x: 0, y: 7, w: 12, h: 4 }, title: 'Activity Heatmap' },
    ],
    includeKpis: false,
    kpiCount: 0,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  kpi_focused: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 3, h: 3 } },
      { type: 'kpi', position: { x: 3, y: 0, w: 3, h: 3 } },
      { type: 'kpi', position: { x: 6, y: 0, w: 3, h: 3 } },
      { type: 'kpi', position: { x: 9, y: 0, w: 3, h: 3 } },
      { type: 'kpi', position: { x: 0, y: 3, w: 3, h: 3 } },
      { type: 'kpi', position: { x: 3, y: 3, w: 3, h: 3 } },
      { type: 'sparkline', position: { x: 6, y: 3, w: 6, h: 3 } },
      { type: 'line', position: { x: 0, y: 6, w: 12, h: 4 }, title: 'Trend' },
    ],
    includeKpis: true,
    kpiCount: 6,
    layout: { columns: 12, rowHeight: 60, gap: 12 },
  },
  comparison: {
    charts: [
      { type: 'column', position: { x: 0, y: 0, w: 6, h: 5 }, title: 'Comparison A' },
      { type: 'column', position: { x: 6, y: 0, w: 6, h: 5 }, title: 'Comparison B' },
      { type: 'radar', position: { x: 0, y: 5, w: 6, h: 5 }, title: 'Multi-dimension' },
      { type: 'scatter', position: { x: 6, y: 5, w: 6, h: 5 }, title: 'Correlation' },
    ],
    includeKpis: false,
    kpiCount: 0,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
  trend_analysis: {
    charts: [
      { type: 'kpi', position: { x: 0, y: 0, w: 4, h: 2 } },
      { type: 'kpi', position: { x: 4, y: 0, w: 4, h: 2 } },
      { type: 'kpi', position: { x: 8, y: 0, w: 4, h: 2 } },
      { type: 'line', position: { x: 0, y: 2, w: 12, h: 4 }, title: 'Primary Trend' },
      { type: 'area', position: { x: 0, y: 6, w: 6, h: 4 }, title: 'Volume' },
      { type: 'stacked_area', position: { x: 6, y: 6, w: 6, h: 4 }, title: 'Composition' },
    ],
    includeKpis: true,
    kpiCount: 3,
    layout: { columns: 12, rowHeight: 60, gap: 16 },
  },
};

/**
 * Generates dashboards from data
 */
export class DashboardGenerator {
  private chartGenerator: ChartGenerator;
  private chartBeautifier: ChartBeautifier;
  private idCounter = 0;

  constructor() {
    this.chartGenerator = new ChartGenerator();
    this.chartBeautifier = new ChartBeautifier();
  }

  /**
   * Generate dashboard from data
   */
  generate(
    data: DataRange,
    characteristics: DataCharacteristics,
    options: DashboardOptions = {}
  ): Dashboard {
    const template = options.template || this.suggestTemplate(characteristics);
    const templateConfig = TEMPLATES[template];
    const theme = this.resolveTheme(options.theme);

    // Create layout
    const layout: DashboardLayout = {
      type: 'grid',
      columns: options.columns || templateConfig.layout.columns || 12,
      rowHeight: templateConfig.layout.rowHeight || 60,
      gap: templateConfig.layout.gap || 16,
    };

    // Generate charts
    const charts = this.generateCharts(
      data,
      characteristics,
      templateConfig,
      theme,
      options.maxCharts
    );

    // Generate filters if requested
    const filters = options.includeFilters !== false
      ? this.generateFilters(characteristics)
      : [];

    return {
      id: `dashboard-${++this.idCounter}-${Date.now()}`,
      name: options.name || this.generateName(template),
      description: options.description,
      layout,
      charts,
      filters,
      theme,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Suggest best template based on data characteristics
   */
  suggestTemplate(characteristics: DataCharacteristics): DashboardTemplate {
    // Time series data -> trend analysis
    if (characteristics.hasTimeColumn) {
      return 'trend_analysis';
    }

    // Multiple series -> comparison
    if (characteristics.hasMultipleSeries && characteristics.columns.length > 3) {
      return 'comparison';
    }

    // Few columns -> KPI focused
    if (characteristics.columnCount <= 3) {
      return 'kpi_focused';
    }

    // Default to overview
    return 'overview';
  }

  /**
   * Generate charts for dashboard
   */
  private generateCharts(
    data: DataRange,
    characteristics: DataCharacteristics,
    templateConfig: TemplateConfig,
    theme: ColorScheme,
    maxCharts?: number
  ): DashboardChart[] {
    const charts: DashboardChart[] = [];
    const chartConfigs = templateConfig.charts.slice(0, maxCharts || templateConfig.charts.length);

    for (const chartDef of chartConfigs) {
      // Generate chart config
      let config = this.chartGenerator.generate(
        chartDef.type,
        data,
        characteristics,
        {
          colorScheme: theme,
          title: chartDef.title,
        }
      );

      // Beautify chart
      config = this.chartBeautifier.beautify(config, {
        colorScheme: theme,
        preset: 'dashboard',
      });

      charts.push({
        id: `chart-${++this.idCounter}-${Date.now()}`,
        config,
        position: chartDef.position,
      });
    }

    return charts;
  }

  /**
   * Generate filters based on data characteristics
   */
  private generateFilters(characteristics: DataCharacteristics): DashboardFilter[] {
    const filters: DashboardFilter[] = [];

    // Add filter for time column
    const timeCol = characteristics.columns.find((c) => c.suggestedRole === 'time');
    if (timeCol) {
      filters.push({
        id: `filter-${++this.idCounter}`,
        type: 'date',
        column: timeCol.name,
        label: timeCol.name,
      });
    }

    // Add filter for category columns
    const categoryCols = characteristics.columns.filter(
      (c) => c.suggestedRole === 'category'
    );

    for (const col of categoryCols.slice(0, 2)) {
      filters.push({
        id: `filter-${++this.idCounter}`,
        type: 'dropdown',
        column: col.name,
        label: col.name,
      });
    }

    return filters;
  }

  /**
   * Resolve theme
   */
  private resolveTheme(theme?: string | ColorScheme): ColorScheme {
    if (typeof theme === 'object' && theme !== null) {
      return theme;
    }

    return COLOR_SCHEMES[theme || 'professional'] || COLOR_SCHEMES.professional;
  }

  /**
   * Generate dashboard name
   */
  private generateName(template: DashboardTemplate): string {
    const names: Record<DashboardTemplate, string> = {
      overview: 'Overview Dashboard',
      sales: 'Sales Dashboard',
      financial: 'Financial Dashboard',
      marketing: 'Marketing Dashboard',
      operations: 'Operations Dashboard',
      kpi_focused: 'KPI Dashboard',
      comparison: 'Comparison Dashboard',
      trend_analysis: 'Trend Analysis Dashboard',
    };

    return names[template] || 'Dashboard';
  }

  /**
   * Add chart to existing dashboard
   */
  addChart(
    dashboard: Dashboard,
    chartConfig: ChartConfig,
    position?: GridPosition
  ): Dashboard {
    const newPosition = position || this.findEmptyPosition(dashboard);

    const newChart: DashboardChart = {
      id: `chart-${++this.idCounter}-${Date.now()}`,
      config: chartConfig,
      position: newPosition,
    };

    return {
      ...dashboard,
      charts: [...dashboard.charts, newChart],
      updatedAt: Date.now(),
    };
  }

  /**
   * Remove chart from dashboard
   */
  removeChart(dashboard: Dashboard, chartId: string): Dashboard {
    return {
      ...dashboard,
      charts: dashboard.charts.filter((c) => c.id !== chartId),
      updatedAt: Date.now(),
    };
  }

  /**
   * Update chart in dashboard
   */
  updateChart(
    dashboard: Dashboard,
    chartId: string,
    updates: Partial<DashboardChart>
  ): Dashboard {
    return {
      ...dashboard,
      charts: dashboard.charts.map((c) =>
        c.id === chartId ? { ...c, ...updates } : c
      ),
      updatedAt: Date.now(),
    };
  }

  /**
   * Resize chart in dashboard
   */
  resizeChart(
    dashboard: Dashboard,
    chartId: string,
    width: number,
    height: number
  ): Dashboard {
    return this.updateChart(dashboard, chartId, {
      position: {
        ...dashboard.charts.find((c) => c.id === chartId)!.position,
        w: width,
        h: height,
      },
    });
  }

  /**
   * Move chart in dashboard
   */
  moveChart(
    dashboard: Dashboard,
    chartId: string,
    x: number,
    y: number
  ): Dashboard {
    return this.updateChart(dashboard, chartId, {
      position: {
        ...dashboard.charts.find((c) => c.id === chartId)!.position,
        x,
        y,
      },
    });
  }

  /**
   * Find empty position for new chart
   */
  private findEmptyPosition(dashboard: Dashboard): GridPosition {
    // Find the lowest y position with space
    let maxY = 0;
    for (const chart of dashboard.charts) {
      const bottom = chart.position.y + chart.position.h;
      if (bottom > maxY) {
        maxY = bottom;
      }
    }

    return {
      x: 0,
      y: maxY,
      w: 6,
      h: 4,
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): DashboardTemplate[] {
    return Object.keys(TEMPLATES) as DashboardTemplate[];
  }

  /**
   * Get template configuration
   */
  getTemplateConfig(template: DashboardTemplate): TemplateConfig {
    return TEMPLATES[template];
  }

  /**
   * Clone dashboard
   */
  cloneDashboard(dashboard: Dashboard, newName?: string): Dashboard {
    return {
      ...dashboard,
      id: `dashboard-${++this.idCounter}-${Date.now()}`,
      name: newName || `${dashboard.name} (Copy)`,
      charts: dashboard.charts.map((c) => ({
        ...c,
        id: `chart-${++this.idCounter}-${Date.now()}`,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Export dashboard configuration
   */
  exportConfig(dashboard: Dashboard): string {
    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Import dashboard from configuration
   */
  importConfig(configJson: string): Dashboard {
    const config = JSON.parse(configJson);
    return {
      ...config,
      id: `dashboard-${++this.idCounter}-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}
