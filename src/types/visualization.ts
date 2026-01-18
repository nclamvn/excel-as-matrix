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

// ============== CHART TEMPLATES ==============

export type ChartTemplateCategory =
  | 'basic'
  | 'comparison'
  | 'trend'
  | 'distribution'
  | 'composition'
  | 'financial'
  | 'custom';

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: ChartTemplateCategory;
  chartType: ChartType;
  thumbnail: string;  // Icon or preview image reference
  colorScheme: string[];
  style: ChartStyle;
  legendConfig: LegendConfig;
  axesConfig: AxesConfig;
  isBuiltIn: boolean;
  createdAt?: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
  isDark: boolean;
}

// Built-in color schemes
export const CHART_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948'],
    isDark: false,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E', '#023E8A'],
    isDark: false,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8C42', '#E74C3C', '#C0392B'],
    isDark: false,
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7'],
    isDark: false,
  },
  {
    id: 'corporate',
    name: 'Corporate',
    colors: ['#2C3E50', '#3498DB', '#1ABC9C', '#9B59B6', '#E74C3C', '#F39C12'],
    isDark: false,
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E3C8F0'],
    isDark: false,
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    colors: ['#FF0080', '#FF8C00', '#40E0D0', '#8A2BE2', '#00FF7F', '#FFD700'],
    isDark: false,
  },
  {
    id: 'monochrome-blue',
    name: 'Monochrome Blue',
    colors: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4'],
    isDark: false,
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    colors: ['#BB86FC', '#03DAC6', '#CF6679', '#FFC107', '#8BC34A', '#FF5722'],
    isDark: true,
  },
  {
    id: 'earth',
    name: 'Earth Tones',
    colors: ['#8B4513', '#CD853F', '#DEB887', '#D2691E', '#A0522D', '#BC8F8F'],
    isDark: false,
  },
];

// Built-in chart templates
export const BUILT_IN_CHART_TEMPLATES: Omit<ChartTemplate, 'createdAt'>[] = [
  // Basic Charts
  {
    id: 'basic-column',
    name: 'Basic Column Chart',
    description: 'Simple vertical bar chart for comparing values across categories',
    category: 'basic',
    chartType: 'ColumnClustered',
    thumbnail: 'column',
    colorScheme: CHART_COLOR_SCHEMES[0].colors,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'basic-bar',
    name: 'Basic Bar Chart',
    description: 'Horizontal bar chart for ranking or comparison',
    category: 'basic',
    chartType: 'Bar',
    thumbnail: 'bar',
    colorScheme: CHART_COLOR_SCHEMES[0].colors,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Right',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'basic-line',
    name: 'Basic Line Chart',
    description: 'Line chart for showing trends over time',
    category: 'trend',
    chartType: 'Line',
    thumbnail: 'line',
    colorScheme: CHART_COLOR_SCHEMES[0].colors,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'basic-pie',
    name: 'Basic Pie Chart',
    description: 'Pie chart for showing proportions of a whole',
    category: 'composition',
    chartType: 'Pie',
    thumbnail: 'pie',
    colorScheme: CHART_COLOR_SCHEMES[0].colors,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: true,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Right',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: false, gridlines: false, labelsVisible: false, labelRotation: 0 },
      yAxis: { visible: false, gridlines: false, labelsVisible: false, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'basic-doughnut',
    name: 'Doughnut Chart',
    description: 'Doughnut chart with center space for key metrics',
    category: 'composition',
    chartType: 'Doughnut',
    thumbnail: 'doughnut',
    colorScheme: CHART_COLOR_SCHEMES[5].colors, // Pastel
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: true,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Right',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: false, gridlines: false, labelsVisible: false, labelRotation: 0 },
      yAxis: { visible: false, gridlines: false, labelsVisible: false, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Comparison Charts
  {
    id: 'stacked-column',
    name: 'Stacked Column Chart',
    description: 'Stacked columns for showing composition over categories',
    category: 'comparison',
    chartType: 'ColumnStacked',
    thumbnail: 'stacked-column',
    colorScheme: CHART_COLOR_SCHEMES[1].colors, // Ocean
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Trend Charts
  {
    id: 'area-chart',
    name: 'Area Chart',
    description: 'Filled area chart for emphasizing volume over time',
    category: 'trend',
    chartType: 'Area',
    thumbnail: 'area',
    colorScheme: CHART_COLOR_SCHEMES[1].colors, // Ocean
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'stacked-area',
    name: 'Stacked Area Chart',
    description: 'Stacked areas for showing cumulative trends',
    category: 'trend',
    chartType: 'AreaStacked',
    thumbnail: 'stacked-area',
    colorScheme: CHART_COLOR_SCHEMES[3].colors, // Forest
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Distribution Charts
  {
    id: 'scatter-plot',
    name: 'Scatter Plot',
    description: 'Scatter plot for showing correlation between variables',
    category: 'distribution',
    chartType: 'Scatter',
    thumbnail: 'scatter',
    colorScheme: CHART_COLOR_SCHEMES[6].colors, // Vibrant
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'bubble-chart',
    name: 'Bubble Chart',
    description: 'Bubble chart for visualizing three dimensions of data',
    category: 'distribution',
    chartType: 'Bubble',
    thumbnail: 'bubble',
    colorScheme: CHART_COLOR_SCHEMES[5].colors, // Pastel
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Combo Charts
  {
    id: 'combo-bar-line',
    name: 'Combo Chart (Bar + Line)',
    description: 'Combined bar and line chart for dual metrics',
    category: 'comparison',
    chartType: 'Combo',
    thumbnail: 'combo',
    colorScheme: CHART_COLOR_SCHEMES[4].colors, // Corporate
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
      y2Axis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'radar-chart',
    name: 'Radar Chart',
    description: 'Radar/Spider chart for comparing multiple attributes',
    category: 'comparison',
    chartType: 'Radar',
    thumbnail: 'radar',
    colorScheme: CHART_COLOR_SCHEMES[0].colors,
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Financial Charts
  {
    id: 'waterfall',
    name: 'Waterfall Chart',
    description: 'Waterfall chart for showing cumulative effect of values',
    category: 'financial',
    chartType: 'ColumnClustered',
    thumbnail: 'waterfall',
    colorScheme: ['#2ECC71', '#E74C3C', '#3498DB', '#95A5A6', '#2ECC71', '#E74C3C'],
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      shadow: false,
      roundedCorners: false,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  // Dark Mode Templates
  {
    id: 'dark-column',
    name: 'Dark Column Chart',
    description: 'Column chart optimized for dark mode',
    category: 'basic',
    chartType: 'ColumnClustered',
    thumbnail: 'column',
    colorScheme: CHART_COLOR_SCHEMES[8].colors, // Dark Mode
    style: {
      backgroundColor: '#1E1E1E',
      borderColor: '#333333',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
  {
    id: 'dark-line',
    name: 'Dark Line Chart',
    description: 'Line chart optimized for dark mode',
    category: 'trend',
    chartType: 'Line',
    thumbnail: 'line',
    colorScheme: CHART_COLOR_SCHEMES[8].colors, // Dark Mode
    style: {
      backgroundColor: '#1E1E1E',
      borderColor: '#333333',
      borderWidth: 1,
      shadow: false,
      roundedCorners: true,
      animation: true,
    },
    legendConfig: {
      visible: true,
      position: 'Bottom',
      fontSize: 12,
    },
    axesConfig: {
      xAxis: { visible: true, gridlines: false, labelsVisible: true, labelRotation: 0 },
      yAxis: { visible: true, gridlines: true, labelsVisible: true, labelRotation: 0 },
    },
    isBuiltIn: true,
  },
];
