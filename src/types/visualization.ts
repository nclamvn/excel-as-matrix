// Phase 5: Visualization Types
// Charts, Pivot Tables, Sparklines, Conditional Formatting, Dashboard

// ============== CHARTS ==============

export type ChartType =
  | 'Line'
  | 'Bar'
  | 'ColumnStacked'
  | 'ColumnClustered'
  | 'Pie'
  | 'Doughnut'
  | 'Area'
  | 'AreaStacked'
  | 'Scatter'
  | 'Bubble'
  | 'Radar'
  | 'Combo';

export interface Chart {
  id: string;
  workbookId: string;
  sheetId: string;
  name: string;
  chartType: ChartType;
  dataSource: ChartDataSource;
  series: ChartSeries[];
  position: ChartPosition;
  title?: ChartTitle;
  legend: LegendConfig;
  axes: AxesConfig;
  colors: string[];
  style: ChartStyle;
  createdAt: string;
  updatedAt: string;
}

export interface ChartDataSource {
  sourceType: 'Range' | 'Table' | 'PivotTable' | 'Dynamic';
  range?: CellRange;
  tableId?: string;
  categoriesInFirstColumn: boolean;
  seriesInRows: boolean;
}

export interface CellRange {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface ChartSeries {
  id: string;
  name: string;
  valuesRange: CellRange;
  categoriesRange?: CellRange;
  color?: string;
  seriesType?: ChartType;
  axis: 'Primary' | 'Secondary';
  dataLabels: DataLabelConfig;
  trendline?: Trendline;
}

export interface ChartPosition {
  anchorType: 'Absolute' | 'CellAnchored' | 'Floating';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface ChartTitle {
  text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  position: 'Top' | 'Bottom' | 'Left' | 'Right' | 'None';
}

export interface LegendConfig {
  visible: boolean;
  position: 'Top' | 'Bottom' | 'Left' | 'Right' | 'None';
  fontSize: number;
}

export interface AxesConfig {
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  y2Axis?: AxisConfig;
}

export interface AxisConfig {
  visible: boolean;
  title?: string;
  min?: number;
  max?: number;
  gridlines: boolean;
  labelsVisible: boolean;
  labelRotation: number;
  format?: string;
}

export interface DataLabelConfig {
  visible: boolean;
  position: 'Inside' | 'Outside' | 'Center' | 'Above' | 'Below';
  showValue: boolean;
  showPercentage: boolean;
  format?: string;
}

export interface Trendline {
  trendlineType: TrendlineType;
  displayEquation: boolean;
  displayRSquared: boolean;
}

export type TrendlineType =
  | { type: 'Linear' }
  | { type: 'Exponential' }
  | { type: 'Logarithmic' }
  | { type: 'Polynomial'; degree: number }
  | { type: 'MovingAverage'; period: number };

export interface ChartStyle {
  backgroundColor: string;
  borderColor?: string;
  borderWidth: number;
  shadow: boolean;
  roundedCorners: boolean;
  animation: boolean;
}

// Chart Data (rendered)
export interface ChartData {
  chartId: string;
  chartType: ChartType;
  categories: string[];
  series: SeriesData[];
  bounds: DataBounds;
}

export interface SeriesData {
  id: string;
  name: string;
  values: number[];
  color: string;
  chartType?: ChartType;
  statistics: SeriesStatistics;
}

export interface SeriesStatistics {
  min: number;
  max: number;
  sum: number;
  avg: number;
  count: number;
}

export interface DataBounds {
  minValue: number;
  maxValue: number;
  suggestedMin: number;
  suggestedMax: number;
}

export interface PieChartData {
  chartId: string;
  slices: PieSlice[];
  total: number;
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

// ============== PIVOT TABLES ==============

export interface PivotTable {
  id: string;
  workbookId: string;
  sheetId: string;
  name: string;
  sourceRange: CellRange;
  targetCell: [number, number];
  rowFields: PivotField[];
  columnFields: PivotField[];
  valueFields: ValueField[];
  filterFields: PivotField[];
  filters: PivotFilter[];
  options: PivotOptions;
  style: PivotStyle;
  createdAt: string;
  updatedAt: string;
}

export interface PivotField {
  id: string;
  sourceColumn: number;
  name: string;
  sortOrder: 'None' | 'Ascending' | 'Descending';
  showSubtotals: boolean;
  collapsed: boolean;
}

export interface ValueField {
  id: string;
  sourceColumn: number;
  name: string;
  aggregation: Aggregation;
  numberFormat?: string;
  showAs?: ShowValueAs;
}

export type Aggregation =
  | 'Sum'
  | 'Count'
  | 'Average'
  | 'Min'
  | 'Max'
  | 'Product'
  | 'CountNumbers'
  | 'StdDev'
  | 'StdDevP'
  | 'Var'
  | 'VarP';

export type ShowValueAs =
  | 'Normal'
  | 'PercentOfGrandTotal'
  | 'PercentOfColumnTotal'
  | 'PercentOfRowTotal'
  | 'Difference'
  | 'PercentDifference'
  | 'RunningTotal';

export interface PivotFilter {
  fieldId: string;
  filterType: 'Include' | 'Exclude' | 'TopN' | 'BottomN' | 'ValueFilter';
  values: string[];
  topN?: number;
}

export interface PivotOptions {
  showGrandTotalRow: boolean;
  showGrandTotalColumn: boolean;
  showSubtotalRows: boolean;
  showSubtotalColumns: boolean;
  repeatRowLabels: boolean;
  compactForm: boolean;
  showEmptyCells: boolean;
  emptyCellValue: string;
}

export interface PivotStyle {
  headerBackground: string;
  headerForeground: string;
  rowBackground: string;
  alternateRowBackground: string;
  grandTotalBackground: string;
  borderColor: string;
}

// Pivot Table rendered result
export interface PivotResult {
  pivotId: string;
  headers: PivotHeader[][];
  rows: PivotRow[];
  grandTotals: PivotCell[];
  columnCount: number;
}

export interface PivotHeader {
  label: string;
  span: number;
  level: number;
  isValue: boolean;
}

export interface PivotRow {
  cells: PivotCell[];
  level: number;
  isSubtotal: boolean;
  isGrandTotal: boolean;
  expanded: boolean;
  groupKey: string;
}

export interface PivotCell {
  value: string | number | null;
  formatted: string;
  isHeader: boolean;
  isSubtotal: boolean;
  style?: PivotCellStyle;
}

export interface PivotCellStyle {
  backgroundColor?: string;
  fontWeight?: string;
  textAlign?: string;
}

// ============== SPARKLINES ==============

export type SparklineType = 'Line' | 'Column' | 'WinLoss';

export interface Sparkline {
  id: string;
  sheetId: string;
  sparklineType: SparklineType;
  dataRange: CellRange;
  location: [number, number];
  style: SparklineStyle;
  options: SparklineOptions;
}

export interface SparklineStyle {
  lineColor: string;
  fillColor?: string;
  lineWidth: number;
  markerColor: string;
  negativeColor: string;
  firstColor?: string;
  lastColor?: string;
  highColor?: string;
  lowColor?: string;
}

export interface SparklineOptions {
  showMarkers: boolean;
  showFirst: boolean;
  showLast: boolean;
  showHigh: boolean;
  showLow: boolean;
  showNegative: boolean;
  dateAxis: boolean;
  rightToLeft: boolean;
  minAxisType: 'Auto' | 'SameForAll' | 'Custom';
  maxAxisType: 'Auto' | 'SameForAll' | 'Custom';
  manualMin?: number;
  manualMax?: number;
}

export interface SparklineData {
  sparklineId: string;
  sparklineType: SparklineType;
  values: number[];
  points: SparklinePoint[];
  min: number;
  max: number;
  style: SparklineStyle;
}

export interface SparklinePoint {
  x: number;
  y: number;
  value: number;
  isFirst: boolean;
  isLast: boolean;
  isHigh: boolean;
  isLow: boolean;
  isNegative: boolean;
  color: string;
}

// ============== CONDITIONAL FORMATTING ==============

export type ConditionType =
  | 'CellValue'
  | 'TextContains'
  | 'DateOccurring'
  | 'TopBottom'
  | 'AboveBelowAverage'
  | 'Duplicate'
  | 'Unique'
  | 'Blank'
  | 'Error'
  | 'ColorScale'
  | 'DataBar'
  | 'IconSet'
  | 'Formula';

export interface ConditionalRule {
  id: string;
  sheetId: string;
  range: CellRange;
  priority: number;
  stopIfTrue: boolean;
  conditionType: ConditionType;
  condition: ConditionalCondition;
  format?: CellFormat;
}

export type ConditionalCondition =
  | CellValueCondition
  | TextCondition
  | TopBottomCondition
  | AboveAverageCondition
  | ColorScaleCondition
  | DataBarCondition
  | IconSetCondition
  | FormulaCondition
  | SimpleCondition;

export interface CellValueCondition {
  type: 'CellValue';
  operator: ComparisonOperator;
  value1: string | number;
  value2?: string | number;
}

export type ComparisonOperator =
  | 'Equal'
  | 'NotEqual'
  | 'GreaterThan'
  | 'LessThan'
  | 'GreaterOrEqual'
  | 'LessOrEqual'
  | 'Between'
  | 'NotBetween';

export interface TextCondition {
  type: 'TextContains';
  operator: 'Contains' | 'NotContains' | 'BeginsWith' | 'EndsWith';
  text: string;
}

export interface TopBottomCondition {
  type: 'TopBottom';
  isTop: boolean;
  isPercent: boolean;
  value: number;
}

export interface AboveAverageCondition {
  type: 'AboveBelowAverage';
  isAbove: boolean;
  includeEqual: boolean;
  stdDev?: number;
}

export interface ColorScaleCondition {
  type: 'ColorScale';
  minType: ThresholdType;
  minValue?: number;
  minColor: string;
  midType?: ThresholdType;
  midValue?: number;
  midColor?: string;
  maxType: ThresholdType;
  maxValue?: number;
  maxColor: string;
}

export type ThresholdType = 'Min' | 'Max' | 'Number' | 'Percent' | 'Percentile' | 'Formula';

export interface DataBarCondition {
  type: 'DataBar';
  minType: ThresholdType;
  minValue?: number;
  maxType: ThresholdType;
  maxValue?: number;
  fillColor: string;
  borderColor?: string;
  negativeFillColor: string;
  negativeBorderColor?: string;
  showValue: boolean;
  gradientFill: boolean;
  direction: 'LeftToRight' | 'RightToLeft';
}

export interface IconSetCondition {
  type: 'IconSet';
  iconSetType: IconSetType;
  reverseOrder: boolean;
  showValueOnly: boolean;
  thresholds: IconThreshold[];
}

export type IconSetType =
  | 'Arrows3'
  | 'Arrows4'
  | 'Arrows5'
  | 'Flags3'
  | 'TrafficLights3'
  | 'TrafficLights4'
  | 'Signs3'
  | 'Symbols3'
  | 'Stars3'
  | 'Ratings4'
  | 'Ratings5';

export interface IconThreshold {
  type: ThresholdType;
  value: number;
  operator: '>=' | '>';
}

export interface FormulaCondition {
  type: 'Formula';
  formula: string;
}

export interface SimpleCondition {
  type: 'Duplicate' | 'Unique' | 'Blank' | 'Error';
}

export interface CellFormat {
  backgroundColor?: string;
  fontColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  border?: string;
}

// Conditional formatting result
export interface ConditionalResult {
  row: number;
  col: number;
  format?: CellFormat;
  dataBar?: DataBarResult;
  iconSet?: string;
  colorScale?: string;
}

export interface DataBarResult {
  percentage: number;
  color: string;
  direction: 'LeftToRight' | 'RightToLeft';
}

// ============== DASHBOARD ==============

export interface Dashboard {
  id: string;
  workbookId: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  theme: DashboardTheme;
  settings: DashboardSettings;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  layoutType: 'Grid' | 'FreeForm' | 'Tabbed' | 'Stacked';
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
  isDraggable: boolean;
  isResizable: boolean;
  preventCollision: boolean;
}

export type WidgetType =
  | 'Chart'
  | 'PivotTable'
  | 'Table'
  | 'KPI'
  | 'Sparkline'
  | 'Text'
  | 'Image'
  | 'Filter'
  | 'Slicer'
  | 'Map'
  | 'Gauge'
  | 'Custom';

export interface DashboardWidget {
  id: string;
  widgetType: WidgetType;
  title?: string;
  position: WidgetPosition;
  dataSource: WidgetDataSource;
  config: WidgetConfig;
  style: WidgetStyle;
  interactions: WidgetInteraction[];
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  isStatic: boolean;
}

export interface WidgetDataSource {
  chartId?: string;
  pivotId?: string;
  sheetId?: string;
  cellRange?: string;
  query?: string;
  refreshInterval?: number;
}

export interface WidgetConfig {
  showTitle: boolean;
  showBorder: boolean;
  showShadow: boolean;
  textContent?: string;
  imageUrl?: string;
  kpiConfig?: KPIConfig;
  gaugeConfig?: GaugeConfig;
}

export interface KPIConfig {
  valueCell: string;
  format?: string;
  prefix?: string;
  suffix?: string;
  comparisonCell?: string;
  comparisonType: 'None' | 'PreviousPeriod' | 'Target' | 'YearOverYear';
  goodThreshold?: number;
  badThreshold?: number;
  sparklineRange?: string;
}

export interface GaugeConfig {
  valueCell: string;
  minValue: number;
  maxValue: number;
  thresholds: GaugeThreshold[];
  showValue: boolean;
  showPercentage: boolean;
}

export interface GaugeThreshold {
  value: number;
  color: string;
  label?: string;
}

export interface WidgetStyle {
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  titleFontSize: number;
  titleColor: string;
}

export interface WidgetInteraction {
  interactionType: 'CrossFilter' | 'DrillDown' | 'DrillThrough' | 'Navigate' | 'Highlight';
  sourceField: string;
  targetWidgets: string[];
  targetField?: string;
}

export interface DashboardFilter {
  id: string;
  name: string;
  filterType: FilterType;
  sourceField: string;
  values: FilterValue[];
  defaultValue?: string;
  affectsWidgets: string[];
  position: WidgetPosition;
}

export type FilterType =
  | 'Dropdown'
  | 'MultiSelect'
  | 'DateRange'
  | 'DatePicker'
  | 'Slider'
  | 'RangeSlider'
  | 'Search'
  | 'Slicer'
  | 'Toggle';

export type FilterValue =
  | { type: 'Text'; value: string }
  | { type: 'Number'; value: number }
  | { type: 'Date'; value: string }
  | { type: 'Boolean'; value: boolean };

export interface DashboardTheme {
  name: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  chartColors: string[];
  fontFamily: string;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showToolbar: boolean;
  showFilters: boolean;
  allowExport: boolean;
  allowFullscreen: boolean;
  viewMode: 'Edit' | 'View' | 'Presentation';
}

// Default themes
export const DEFAULT_THEMES: Record<string, DashboardTheme> = {
  default: {
    name: 'Default',
    backgroundColor: '#F5F5F5',
    textColor: '#333333',
    primaryColor: '#4E79A7',
    secondaryColor: '#76B7B2',
    accentColor: '#F28E2B',
    chartColors: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  dark: {
    name: 'Dark',
    backgroundColor: '#1E1E1E',
    textColor: '#E0E0E0',
    primaryColor: '#5C9BD1',
    secondaryColor: '#6BC5B9',
    accentColor: '#F5A623',
    chartColors: ['#5C9BD1', '#F5A623', '#E86B6B', '#6BC5B9', '#7AC56A'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  corporate: {
    name: 'Corporate',
    backgroundColor: '#FFFFFF',
    textColor: '#2C3E50',
    primaryColor: '#2980B9',
    secondaryColor: '#27AE60',
    accentColor: '#E74C3C',
    chartColors: ['#2980B9', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12'],
    fontFamily: 'Roboto, Arial, sans-serif',
  },
};

// Default chart colors
export const DEFAULT_CHART_COLORS = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
];
