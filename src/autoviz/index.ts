// =============================================================================
// AUTO-VIZ MODULE — Smart Chart Visualization System
// =============================================================================

// Main engine and singleton
export {
  AutoVizEngine,
  autoVizEngine,
  DataAnalyzer,
  ChartRecommender,
  InsightExtractor,
  ChartGenerator,
  ChartBeautifier,
  AnnotationEngine,
  NLQueryParser,
  DashboardGenerator,
} from './AutoVizEngine';

// Types
export type {
  // Chart types
  ChartType,
  ChartConfig,
  ChartData,
  DataSet,
  SeriesConfig,
  AxisConfig,
  LegendConfig,
  TooltipConfig,

  // Recommendation types
  ChartRecommendation,
  ChartPreview,

  // Color and style types
  ColorScheme,
  ChartStyle,
  FontConfig,

  // Annotation types
  Annotation,

  // Insight types
  ChartInsight,
  InsightType,

  // Data analysis types
  DataRange,
  DataCharacteristics,
  ColumnAnalysis,
  ColumnRole,
  DataPattern,

  // NL query types
  NLChartQuery,
  NLParseResult,
  NLFilter,
  ChartIntent,

  // Dashboard types
  Dashboard,
  DashboardLayout,
  DashboardChart,
  DashboardFilter,

  // Export types
  ExportFormat,
  ExportOptions,

  // Event types
  AutoVizEvent,
  AutoVizEventHandler,
} from './types';

// Options types
export type {
  BeautifyOptions,
  BeautifyPreset,
  DashboardOptions,
  DashboardTemplate,
  QuickVizOptions,
} from './AutoVizEngine';

// Color schemes
export {
  COLOR_SCHEMES,
  getColorScheme,
  getColorSchemeNames,
  getAllColorSchemes,
  getColorByIndex,
  generateGradient,
  adjustBrightness,
  getContrastColor,
  createColorScheme,
  getRecommendedScheme,
  CATEGORICAL_PALETTES,
  getCategoricalPalette,
  SEQUENTIAL_PALETTES,
  getSequentialPalette,
  DIVERGING_PALETTES,
  getDivergingPalette,
} from './ColorSchemes';
