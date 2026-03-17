// =============================================================================
// AUTO-VIZ ENGINE — Main orchestrator for automatic visualization
// =============================================================================

import { loggers } from '@/utils/logger';
import type {
  DataRange,
  DataCharacteristics,
  ChartRecommendation,
  ChartConfig,
  ChartInsight,
  NLChartQuery,
  NLParseResult,
  Dashboard,
  ColorScheme,
  ChartType,
  AutoVizEvent,
  AutoVizEventHandler,
} from './types';
import { DataAnalyzer } from './DataAnalyzer';
import { ChartRecommender } from './ChartRecommender';
import { InsightExtractor } from './InsightExtractor';
import { ChartGenerator } from './ChartGenerator';
import { ChartBeautifier, BeautifyOptions, BeautifyPreset } from './ChartBeautifier';
import { AnnotationEngine } from './AnnotationEngine';
import { NLQueryParser } from './NLQueryParser';
import { DashboardGenerator, DashboardOptions, DashboardTemplate } from './DashboardGenerator';
import { COLOR_SCHEMES, getColorScheme } from './ColorSchemes';

/**
 * Quick visualization options
 */
export interface QuickVizOptions {
  autoBeautify?: boolean;
  addInsights?: boolean;
  colorScheme?: string | ColorScheme;
  title?: string;
}

/**
 * Main Auto-Viz Engine that coordinates all visualization components
 */
export class AutoVizEngine {
  private dataAnalyzer: DataAnalyzer;
  private chartRecommender: ChartRecommender;
  private insightExtractor: InsightExtractor;
  private chartGenerator: ChartGenerator;
  private chartBeautifier: ChartBeautifier;
  private annotationEngine: AnnotationEngine;
  private nlQueryParser: NLQueryParser;
  private dashboardGenerator: DashboardGenerator;

  private eventHandlers: Set<AutoVizEventHandler> = new Set();

  constructor() {
    this.dataAnalyzer = new DataAnalyzer();
    this.chartRecommender = new ChartRecommender();
    this.insightExtractor = new InsightExtractor();
    this.chartGenerator = new ChartGenerator();
    this.chartBeautifier = new ChartBeautifier();
    this.annotationEngine = new AnnotationEngine();
    this.nlQueryParser = new NLQueryParser();
    this.dashboardGenerator = new DashboardGenerator();
  }

  // ===========================================================================
  // MAIN API
  // ===========================================================================

  /**
   * Analyze data and get recommendations
   */
  async recommend(data: DataRange): Promise<ChartRecommendation[]> {
    this.emit({ type: 'analysis_started', data });

    // Analyze data characteristics
    const characteristics = this.dataAnalyzer.analyze(data);
    this.emit({ type: 'analysis_completed', characteristics });

    // Get chart recommendations
    const recommendations = this.chartRecommender.recommend(data, characteristics);
    this.emit({ type: 'recommendations_ready', recommendations });

    return recommendations;
  }

  /**
   * Create chart from recommendation
   */
  async createChart(
    recommendation: ChartRecommendation,
    data?: DataRange,
    options?: QuickVizOptions
  ): Promise<ChartConfig> {
    let config = recommendation.suggestedConfig;

    // Regenerate if data provided
    if (data) {
      const characteristics = this.dataAnalyzer.analyze(data);
      config = this.chartGenerator.generate(
        recommendation.chartType,
        data,
        characteristics,
        { title: options?.title }
      );
    }

    // Apply beautification
    if (options?.autoBeautify !== false) {
      config = this.chartBeautifier.autoBeautify(config);
    }

    // Apply custom color scheme
    if (options?.colorScheme) {
      const scheme = typeof options.colorScheme === 'string'
        ? getColorScheme(options.colorScheme)
        : options.colorScheme;
      config = this.chartBeautifier.beautify(config, { colorScheme: scheme });
    }

    // Add insight annotations
    if (options?.addInsights && data) {
      const characteristics = this.dataAnalyzer.analyze(data);
      const insights = this.insightExtractor.extract(data, characteristics);
      config = this.annotationEngine.addInsightAnnotations(config, insights);
    }

    this.emit({ type: 'chart_created', config });
    return config;
  }

  /**
   * Create chart from natural language query
   */
  async createFromNL(
    query: NLChartQuery,
    data: DataRange
  ): Promise<{ parseResult: NLParseResult; config: ChartConfig | null }> {
    // Parse the query
    const parseResult = this.nlQueryParser.parse(query, data);

    if (!parseResult.understood || !parseResult.chartType) {
      return { parseResult, config: null };
    }

    // Analyze data
    const characteristics = this.dataAnalyzer.analyze(data);

    // Generate chart
    let config = this.chartGenerator.generate(
      parseResult.chartType,
      data,
      characteristics
    );

    // Beautify
    config = this.chartBeautifier.autoBeautify(config);

    this.emit({ type: 'chart_created', config });
    return { parseResult, config };
  }

  /**
   * Quick one-click visualization
   */
  async quickVisualize(
    data: DataRange,
    options?: QuickVizOptions
  ): Promise<ChartConfig> {
    // Analyze and get top recommendation
    const recommendations = await this.recommend(data);

    if (recommendations.length === 0) {
      throw new Error('Unable to generate visualization for this data');
    }

    // Create chart from top recommendation
    return this.createChart(recommendations[0], data, options);
  }

  // ===========================================================================
  // ANALYSIS API
  // ===========================================================================

  /**
   * Analyze data characteristics
   */
  analyzeData(data: DataRange): DataCharacteristics {
    return this.dataAnalyzer.analyze(data);
  }

  /**
   * Get data summary text
   */
  getDataSummary(data: DataRange): string {
    const characteristics = this.dataAnalyzer.analyze(data);
    return this.dataAnalyzer.getSummary(characteristics);
  }

  /**
   * Extract insights from data
   */
  extractInsights(data: DataRange): ChartInsight[] {
    const characteristics = this.dataAnalyzer.analyze(data);
    return this.insightExtractor.extract(data, characteristics);
  }

  /**
   * Get top insights
   */
  getTopInsights(data: DataRange, limit: number = 3): ChartInsight[] {
    const insights = this.extractInsights(data);
    return this.insightExtractor.getTopInsights(insights, limit);
  }

  /**
   * Generate insights summary text
   */
  getInsightsSummary(data: DataRange, language: 'en' | 'vi' = 'en'): string {
    const insights = this.extractInsights(data);
    return this.insightExtractor.generateSummary(insights, language);
  }

  // ===========================================================================
  // CHART CUSTOMIZATION API
  // ===========================================================================

  /**
   * Beautify chart with options
   */
  beautifyChart(config: ChartConfig, options?: BeautifyOptions): ChartConfig {
    return this.chartBeautifier.beautify(config, options);
  }

  /**
   * Apply beautification preset
   */
  applyPreset(config: ChartConfig, preset: BeautifyPreset): ChartConfig {
    return this.chartBeautifier.beautify(config, { preset });
  }

  /**
   * Change chart color scheme
   */
  changeColorScheme(config: ChartConfig, schemeName: string): ChartConfig {
    const scheme = getColorScheme(schemeName);
    return this.chartBeautifier.beautify(config, { colorScheme: scheme });
  }

  /**
   * Convert chart to different type
   */
  convertChartType(config: ChartConfig, newType: ChartType): ChartConfig {
    return this.chartGenerator.convertType(config, newType);
  }

  /**
   * Add annotation to chart
   */
  addAnnotation(
    config: ChartConfig,
    type: 'average' | 'target' | 'minmax',
    options?: { value?: number; label?: string }
  ): ChartConfig {
    switch (type) {
      case 'average':
        return this.annotationEngine.addAverageLine(config);
      case 'target':
        return this.annotationEngine.addTargetLine(
          config,
          options?.value || 100,
          { label: options?.label }
        );
      case 'minmax':
        return this.annotationEngine.addMinMaxAnnotations(config);
      default:
        return config;
    }
  }

  /**
   * Add insights as annotations
   */
  addInsightAnnotations(config: ChartConfig, data: DataRange): ChartConfig {
    const insights = this.extractInsights(data);
    return this.annotationEngine.addInsightAnnotations(config, insights);
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(config: ChartConfig): ChartConfig {
    return this.annotationEngine.clearAnnotations(config);
  }

  // ===========================================================================
  // DASHBOARD API
  // ===========================================================================

  /**
   * Generate dashboard from data
   */
  generateDashboard(
    data: DataRange,
    options?: DashboardOptions
  ): Dashboard {
    const characteristics = this.dataAnalyzer.analyze(data);
    return this.dashboardGenerator.generate(data, characteristics, options);
  }

  /**
   * Add chart to dashboard
   */
  addChartToDashboard(dashboard: Dashboard, config: ChartConfig): Dashboard {
    return this.dashboardGenerator.addChart(dashboard, config);
  }

  /**
   * Get available dashboard templates
   */
  getDashboardTemplates(): DashboardTemplate[] {
    return this.dashboardGenerator.getTemplates();
  }

  /**
   * Suggest dashboard template for data
   */
  suggestDashboardTemplate(data: DataRange): DashboardTemplate {
    const characteristics = this.dataAnalyzer.analyze(data);
    return this.dashboardGenerator.suggestTemplate(characteristics);
  }

  // ===========================================================================
  // NATURAL LANGUAGE API
  // ===========================================================================

  /**
   * Parse natural language query
   */
  parseNLQuery(query: NLChartQuery, data?: DataRange): NLParseResult {
    return this.nlQueryParser.parse(query, data);
  }

  /**
   * Get query suggestions based on data
   */
  getQuerySuggestions(data: DataRange): string[] {
    return this.nlQueryParser.generateSuggestions(data);
  }

  /**
   * Get suggested chart types for an intent
   */
  getSuggestedChartTypes(intent: string): ChartType[] {
    return this.nlQueryParser.getSuggestedChartTypes(intent as any);
  }

  // ===========================================================================
  // UTILITY API
  // ===========================================================================

  /**
   * Get all available color schemes
   */
  getColorSchemes(): Record<string, ColorScheme> {
    return COLOR_SCHEMES;
  }

  /**
   * Get color scheme by name
   */
  getColorScheme(name: string): ColorScheme {
    return getColorScheme(name);
  }

  /**
   * Get beautification presets
   */
  getBeautifyPresets(): BeautifyPreset[] {
    return this.chartBeautifier.getPresets();
  }

  /**
   * Get all chart types
   */
  getChartTypes(): ChartType[] {
    return this.chartRecommender.getAllChartTypes();
  }

  /**
   * Get chart type metadata
   */
  getChartTypeInfo(type: ChartType): unknown {
    return this.chartRecommender.getChartMetadata(type);
  }

  /**
   * Generate CSS variables for chart
   */
  generateCssVariables(config: ChartConfig): Record<string, string> {
    return this.chartBeautifier.generateCssVariables(config);
  }

  /**
   * Export chart config as JSON
   */
  exportConfig(config: ChartConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import chart config from JSON
   */
  importConfig(json: string): ChartConfig {
    return JSON.parse(json) as ChartConfig;
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  /**
   * Subscribe to Auto-Viz events
   */
  on(handler: AutoVizEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(handler: AutoVizEventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Emit event to all handlers
   */
  private emit(event: AutoVizEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        loggers.autoviz.error('Auto-Viz event handler error:', error);
      }
    }
  }
}

// Export singleton instance
export const autoVizEngine = new AutoVizEngine();

// Export types and classes
export {
  DataAnalyzer,
  ChartRecommender,
  InsightExtractor,
  ChartGenerator,
  ChartBeautifier,
  AnnotationEngine,
  NLQueryParser,
  DashboardGenerator,
};

export type { BeautifyOptions, BeautifyPreset, DashboardOptions, DashboardTemplate };
