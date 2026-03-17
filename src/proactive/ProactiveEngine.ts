// =============================================================================
// PROACTIVE ENGINE — Main orchestrator for proactive AI
// =============================================================================

import { loggers } from '@/utils/logger';
import { DataScanner } from './DataScanner';
import { InsightDetector } from './InsightDetector';
import { FormulaOptimizer } from './FormulaOptimizer';
import { PatternRecognizer } from './PatternRecognizer';
import { SuggestionRanker } from './SuggestionRanker';
import { ActionExecutor, ActionResult } from './ActionExecutor';
import { ProactiveScheduler } from './ProactiveScheduler';
import type {
  ProactiveSuggestion,
  SuggestionType,
  SheetData,
  ScanConfig,
  ScanResult,
  ScanSummary,
  ActionRecord,
  ProactiveEvent,
  ProactiveEventHandler,
} from './types';

/**
 * Main Proactive AI Engine
 * Coordinates scanning, detection, and action execution
 */
export class ProactiveEngine {
  private config: ScanConfig;
  private scanner: DataScanner;
  private insightDetector: InsightDetector;
  private formulaOptimizer: FormulaOptimizer;
  private patternRecognizer: PatternRecognizer;
  private ranker: SuggestionRanker;
  private executor: ActionExecutor;
  private scheduler: ProactiveScheduler;

  // State
  private suggestions: Map<string, ProactiveSuggestion> = new Map();
  private lastScanResult: ScanResult | null = null;
  private eventHandlers: Set<ProactiveEventHandler> = new Set();

  constructor(config: Partial<ScanConfig> = {}) {
    this.config = { ...DEFAULT_SCAN_CONFIG_VALUES, ...config };

    this.scanner = new DataScanner(this.config);
    this.insightDetector = new InsightDetector(this.config);
    this.formulaOptimizer = new FormulaOptimizer(this.config);
    this.patternRecognizer = new PatternRecognizer(this.config);
    this.ranker = new SuggestionRanker(this.config);
    this.executor = new ActionExecutor();
    this.scheduler = new ProactiveScheduler(this.config);
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Start the proactive engine
   */
  start(getDataCallback: () => SheetData | null): void {
    this.scheduler.start(getDataCallback, this.runScan.bind(this));
  }

  /**
   * Stop the proactive engine
   */
  stop(): void {
    this.scheduler.stop();
  }

  /**
   * Pause scanning
   */
  pause(): void {
    this.scheduler.pause();
  }

  /**
   * Resume scanning
   */
  resume(): void {
    this.scheduler.resume();
  }

  // ==========================================================================
  // SCANNING
  // ==========================================================================

  /**
   * Run a full scan
   */
  async runScan(data: SheetData): Promise<ScanResult> {
    const startTime = Date.now();

    this.emit({ type: 'scan_started', timestamp: startTime });

    const allSuggestions: ProactiveSuggestion[] = [];

    // Run scanners in parallel
    const [issues, insights, optimizations, patterns] = await Promise.all([
      this.config.scanIssues ? this.scanner.scan(data) : Promise.resolve([]),
      this.config.scanInsights ? this.insightDetector.detect(data) : Promise.resolve([]),
      this.config.scanOptimizations ? this.formulaOptimizer.optimize(data) : Promise.resolve([]),
      this.config.scanPatterns ? this.patternRecognizer.detect(data) : Promise.resolve([]),
    ]);

    allSuggestions.push(...issues, ...insights, ...optimizations, ...patterns);

    // Rank and limit suggestions
    const ranked = this.ranker.rank(allSuggestions);

    // Update suggestions map
    this.updateSuggestions(ranked);

    // Build result
    const result: ScanResult = {
      timestamp: startTime,
      duration: Date.now() - startTime,
      cellsScanned: data.rowCount * data.colCount,
      issues,
      insights,
      optimizations,
      patterns,
      summary: this.buildSummary(ranked),
    };

    this.lastScanResult = result;
    this.emit({ type: 'scan_completed', result });

    return result;
  }

  /**
   * Scan only specific types
   */
  async scanTypes(
    data: SheetData,
    types: SuggestionType[]
  ): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];

    if (types.includes('issue')) {
      suggestions.push(...await this.scanner.scan(data));
    }
    if (types.includes('insight')) {
      suggestions.push(...await this.insightDetector.detect(data));
    }
    if (types.includes('optimization')) {
      suggestions.push(...await this.formulaOptimizer.optimize(data));
    }
    if (types.includes('pattern')) {
      suggestions.push(...await this.patternRecognizer.detect(data));
    }

    return this.ranker.rank(suggestions);
  }

  // ==========================================================================
  // SUGGESTIONS
  // ==========================================================================

  /**
   * Get all suggestions
   */
  getSuggestions(): ProactiveSuggestion[] {
    return Array.from(this.suggestions.values())
      .filter(s => s.status === 'pending');
  }

  /**
   * Get suggestions by type
   */
  getSuggestionsByType(type: SuggestionType): ProactiveSuggestion[] {
    return this.getSuggestions().filter(s => s.type === type);
  }

  /**
   * Get suggestion by ID
   */
  getSuggestion(id: string): ProactiveSuggestion | undefined {
    return this.suggestions.get(id);
  }

  /**
   * Get suggestion count
   */
  getSuggestionCount(): number {
    return this.getSuggestions().length;
  }

  /**
   * Get grouped suggestions
   */
  getGroupedSuggestions(): Record<SuggestionType, ProactiveSuggestion[]> {
    return this.ranker.groupByType(this.getSuggestions());
  }

  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(id: string): void {
    const suggestion = this.suggestions.get(id);
    if (suggestion) {
      suggestion.status = 'dismissed';
      this.emit({ type: 'suggestion_dismissed', suggestionId: id });
    }
  }

  /**
   * Dismiss all suggestions of a type
   */
  dismissAllOfType(type: SuggestionType): void {
    for (const [id, suggestion] of this.suggestions) {
      if (suggestion.type === type) {
        suggestion.status = 'dismissed';
        this.emit({ type: 'suggestion_dismissed', suggestionId: id });
      }
    }
  }

  /**
   * Clear all suggestions
   */
  clearSuggestions(): void {
    this.suggestions.clear();
  }

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /**
   * Execute an action
   */
  async executeAction(
    suggestionId: string,
    actionId: string
  ): Promise<ActionResult> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      return { success: false, message: 'Suggestion not found' };
    }

    const action = suggestion.actions.find(a => a.id === actionId);
    if (!action) {
      return { success: false, message: 'Action not found' };
    }

    const result = await this.executor.execute(suggestion, action);

    this.emit({
      type: 'action_executed',
      actionId,
      success: result.success,
    });

    // Update suggestion status if action was successful
    if (result.success && (result.suggestionDismissed || action.type === 'primary')) {
      suggestion.status = 'applied';
    }

    return result;
  }

  /**
   * Register callbacks for sheet operations
   */
  registerCallbacks(callbacks: {
    onCellUpdate?: (cellRef: string, value: unknown, formula?: string) => void;
    onRowDelete?: (rows: number[]) => void;
    onFormatApply?: (cells: string[], format: unknown) => void;
    onChartCreate?: (config: unknown) => void;
  }): void {
    this.executor.registerCallbacks(callbacks);
  }

  // ==========================================================================
  // PATTERNS
  // ==========================================================================

  /**
   * Record a user action for pattern detection
   */
  recordAction(action: ActionRecord): void {
    this.patternRecognizer.recordAction(action);
  }

  /**
   * Clear action history
   */
  clearActionHistory(): void {
    this.patternRecognizer.clearHistory();
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...config };
    this.scheduler.updateConfig(config);
    this.emit({ type: 'settings_changed', config });
  }

  /**
   * Get configuration
   */
  getConfig(): ScanConfig {
    return { ...this.config };
  }

  /**
   * Get scheduler status
   */
  getSchedulerStatus() {
    return this.scheduler.getStatus();
  }

  /**
   * Get last scan result
   */
  getLastScanResult(): ScanResult | null {
    return this.lastScanResult;
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * Subscribe to events
   */
  on(handler: ProactiveEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit an event
   */
  private emit(event: ProactiveEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        loggers.proactive.error('Event handler error:', error);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Update suggestions map
   */
  private updateSuggestions(newSuggestions: ProactiveSuggestion[]): void {
    // Remove expired snoozed suggestions
    for (const [_id, suggestion] of this.suggestions) {
      if (suggestion.status === 'snoozed' && suggestion.expiresAt && suggestion.expiresAt < Date.now()) {
        suggestion.status = 'pending';
      }
    }

    // Add/update new suggestions
    for (const suggestion of newSuggestions) {
      const existing = this.suggestions.get(suggestion.id);

      if (!existing || existing.status === 'pending') {
        this.suggestions.set(suggestion.id, suggestion);

        if (!existing) {
          this.emit({ type: 'suggestion_added', suggestion });
        }
      }
    }

    // Limit total suggestions
    if (this.suggestions.size > this.config.maxSuggestions * 2) {
      const sorted = Array.from(this.suggestions.entries())
        .sort((a, b) => b[1].detectedAt - a[1].detectedAt);

      const toRemove = sorted.slice(this.config.maxSuggestions * 2);
      for (const [id] of toRemove) {
        this.suggestions.delete(id);
      }
    }
  }

  /**
   * Build scan summary
   */
  private buildSummary(suggestions: ProactiveSuggestion[]): ScanSummary {
    const byType: Record<SuggestionType, number> = {
      issue: 0,
      insight: 0,
      optimization: 0,
      pattern: 0,
    };

    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const s of suggestions) {
      byType[s.type]++;
      byPriority[s.priority]++;
    }

    const topIssues = suggestions
      .filter(s => s.type === 'issue')
      .slice(0, 3)
      .map(s => s.title);

    return {
      totalSuggestions: suggestions.length,
      byType,
      byPriority,
      topIssues,
    };
  }
}

// Default config values (runtime)
const DEFAULT_SCAN_CONFIG_VALUES: ScanConfig = {
  enabled: true,
  interval: 30000,
  scanIssues: true,
  scanInsights: true,
  scanOptimizations: true,
  scanPatterns: true,
  duplicateThreshold: 2,
  outlierZScore: 3,
  correlationThreshold: 0.7,
  patternMinFrequency: 3,
  maxSuggestions: 50,
  maxCellsToScan: 10000,
};

// Export singleton
export const proactiveEngine = new ProactiveEngine();
