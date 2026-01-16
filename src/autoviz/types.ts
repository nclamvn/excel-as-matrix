// =============================================================================
// AUTO-VIZ — Type Definitions
// =============================================================================

// =============================================================================
// CHART TYPES
// =============================================================================

export type ChartType =
  | 'line'
  | 'bar'
  | 'column'
  | 'pie'
  | 'donut'
  | 'area'
  | 'stacked_bar'
  | 'stacked_area'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'treemap'
  | 'funnel'
  | 'waterfall'
  | 'radar'
  | 'combo'
  | 'sparkline'
  | 'gauge'
  | 'kpi';

// =============================================================================
// RECOMMENDATION TYPES
// =============================================================================

export interface ChartRecommendation {
  id: string;
  chartType: ChartType;
  score: number; // 0-100
  reason: string;
  reasonVi: string;
  insight: string;
  insightVi: string;
  preview: ChartPreview;
  suggestedConfig: ChartConfig;
  isTopRecommendation: boolean;
  alternatives?: ChartType[];
  pros: string[];
  cons: string[];
}

export interface ChartPreview {
  width: number;
  height: number;
  config: ChartConfig;
  thumbnail?: string;
}

// =============================================================================
// CHART CONFIG TYPES
// =============================================================================

export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  data: ChartData;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  series: SeriesConfig[];
  legend?: LegendConfig;
  colorScheme: ColorScheme;
  annotations?: Annotation[];
  style: ChartStyle;
  interactive: boolean;
  tooltip?: TooltipConfig;
}

export interface ChartData {
  labels?: string[];
  datasets: DataSet[];
  sourceRange?: string;
}

export interface DataSet {
  label: string;
  data: number[];
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fill?: boolean;
}

export interface AxisConfig {
  label?: string;
  type: 'category' | 'linear' | 'logarithmic' | 'time';
  min?: number;
  max?: number;
  format?: string;
  showGrid?: boolean;
  gridColor?: string;
}

export interface SeriesConfig {
  name: string;
  dataKey: string;
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  showPoints?: boolean;
  chartType?: ChartType;
  fillOpacity?: number;
}

export interface LegendConfig {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
}

export interface TooltipConfig {
  enabled: boolean;
  showTitle?: boolean;
  shared?: boolean;
  format?: string;
}

// =============================================================================
// COLOR & STYLE TYPES
// =============================================================================

export interface ColorScheme {
  name: string;
  colors: string[];
  positive?: string;
  negative?: string;
  neutral?: string;
  highlight?: string;
  background?: string;
  gridColor?: string;
  textColor?: string;
}

export interface ChartStyle {
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  titleFont: FontConfig;
  subtitleFont: FontConfig;
  labelFont: FontConfig;
  axisFont: FontConfig;
  animation?: boolean;
  shadow?: boolean;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: string;
  color: string;
}

// =============================================================================
// ANNOTATION TYPES
// =============================================================================

export interface Annotation {
  id: string;
  type: 'point' | 'line' | 'region' | 'label' | 'arrow' | 'trend';
  x?: number | string;
  y?: number | string;
  x2?: number | string;
  y2?: number | string;
  label?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

// =============================================================================
// INSIGHT TYPES
// =============================================================================

export interface ChartInsight {
  id: string;
  type: InsightType;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  value?: number | string;
  changePercent?: number;
  dataPoint?: { x: unknown; y: unknown };
  importance: 'high' | 'medium' | 'low';
  suggestedAnnotation?: Annotation;
}

export type InsightType =
  | 'peak'
  | 'valley'
  | 'trend_up'
  | 'trend_down'
  | 'anomaly'
  | 'milestone'
  | 'correlation'
  | 'seasonality';

// =============================================================================
// DATA ANALYSIS TYPES
// =============================================================================

export interface DataCharacteristics {
  rowCount: number;
  columnCount: number;
  columns: ColumnAnalysis[];
  hasTimeColumn: boolean;
  hasCategoryColumn: boolean;
  hasMultipleSeries: boolean;
  patterns: DataPattern[];
}

export interface ColumnAnalysis {
  index: number;
  name: string;
  dataType: 'number' | 'text' | 'date' | 'boolean' | 'mixed';
  min?: number;
  max?: number;
  mean?: number;
  stdDev?: number;
  uniqueValues?: number;
  nullCount?: number;
  suggestedRole: ColumnRole;
}

export type ColumnRole = 'category' | 'value' | 'time' | 'label' | 'size';

export interface DataPattern {
  type: 'trend' | 'seasonality' | 'correlation' | 'distribution' | 'outlier';
  description: string;
  confidence: number;
  columns: number[];
}

// =============================================================================
// NL QUERY TYPES
// =============================================================================

export interface NLChartQuery {
  text: string;
  language: 'en' | 'vi' | 'auto';
}

export interface NLParseResult {
  understood: boolean;
  intent: ChartIntent;
  chartType?: ChartType;
  metrics?: string[];
  dimensions?: string[];
  filters?: NLFilter[];
  timeRange?: string;
  confidence: number;
}

export interface NLFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: unknown;
}

export type ChartIntent =
  | 'show_trend'
  | 'compare_values'
  | 'show_composition'
  | 'show_distribution'
  | 'show_relationship'
  | 'show_ranking'
  | 'show_change'
  | 'show_correlation';

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  charts: DashboardChart[];
  filters?: DashboardFilter[];
  theme: ColorScheme;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardLayout {
  type: 'grid' | 'freeform';
  columns: number;
  rowHeight: number;
  gap: number;
}

export interface DashboardChart {
  id: string;
  config: ChartConfig;
  position: { x: number; y: number; w: number; h: number };
  linkedFilters?: string[];
}

export interface DashboardFilter {
  id: string;
  type: 'dropdown' | 'range' | 'date' | 'text';
  column: string;
  label: string;
  defaultValue?: unknown;
}

// =============================================================================
// DATA RANGE TYPE
// =============================================================================

export interface DataRange {
  headers: string[];
  data: unknown[][];
  rowCount: number;
  colCount: number;
  sourceRange?: string;
}

// =============================================================================
// EXPORT TYPES
// =============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  quality?: number;
  includeTitle?: boolean;
  includeAnnotations?: boolean;
  backgroundColor?: string;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export type AutoVizEvent =
  | { type: 'analysis_started'; data: DataRange }
  | { type: 'analysis_completed'; characteristics: DataCharacteristics }
  | { type: 'recommendations_ready'; recommendations: ChartRecommendation[] }
  | { type: 'chart_created'; config: ChartConfig }
  | { type: 'error'; message: string };

export type AutoVizEventHandler = (event: AutoVizEvent) => void;
