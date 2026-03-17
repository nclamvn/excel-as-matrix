// =============================================================================
// DATA CLEANER ENGINE — Main orchestrator
// =============================================================================

import { loggers } from '@/utils/logger';
import { QualityAnalyzer } from './QualityAnalyzer';
import { DuplicateDetector } from './DuplicateDetector';
import { FormatStandardizer } from './FormatStandardizer';
import { MissingValueHandler } from './MissingValueHandler';
import { InconsistencyFixer } from './InconsistencyFixer';
import { OutlierDetector } from './OutlierDetector';
import { DataValidator } from './DataValidator';
import { CleaningPipeline } from './CleaningPipeline';
import { CleaningPreview } from './CleaningPreview';
import type {
  CleanerSheetData,
  QualityScore,
  CleaningResult,
  CleaningSession,
  CellChange,
  CleanerEvent,
  CleanerEventHandler,
  DuplicateGroup,
  FormatIssue,
  MissingValueInfo,
  InconsistencyGroup,
  OutlierInfo,
  ValidationResult,
  CleaningStep,
} from './types';

/**
 * Main Data Cleaner Engine
 * Orchestrates all cleaning operations
 */
export class DataCleanerEngine {
  private qualityAnalyzer: QualityAnalyzer;
  private duplicateDetector: DuplicateDetector;
  private formatStandardizer: FormatStandardizer;
  private missingValueHandler: MissingValueHandler;
  private inconsistencyFixer: InconsistencyFixer;
  private outlierDetector: OutlierDetector;
  private dataValidator: DataValidator;
  private cleaningPipeline: CleaningPipeline;
  private cleaningPreview: CleaningPreview;

  // State
  private currentScore: QualityScore | null = null;
  private sessions: CleaningSession[] = [];
  private eventHandlers: Set<CleanerEventHandler> = new Set();

  constructor() {
    this.qualityAnalyzer = new QualityAnalyzer();
    this.duplicateDetector = new DuplicateDetector();
    this.formatStandardizer = new FormatStandardizer();
    this.missingValueHandler = new MissingValueHandler();
    this.inconsistencyFixer = new InconsistencyFixer();
    this.outlierDetector = new OutlierDetector();
    this.dataValidator = new DataValidator();
    this.cleaningPipeline = new CleaningPipeline();
    this.cleaningPreview = new CleaningPreview();
  }

  // ==========================================================================
  // ANALYSIS
  // ==========================================================================

  /**
   * Analyze data quality
   */
  analyze(data: CleanerSheetData): QualityScore {
    this.emit({ type: 'analysis_started', timestamp: Date.now() });

    const score = this.qualityAnalyzer.analyze(data);
    this.currentScore = score;

    this.emit({ type: 'analysis_completed', score });

    return score;
  }

  /**
   * Get current quality score
   */
  getQualityScore(): QualityScore | null {
    return this.currentScore;
  }

  // ==========================================================================
  // DUPLICATE DETECTION
  // ==========================================================================

  /**
   * Detect duplicates
   */
  detectDuplicates(data: CleanerSheetData): DuplicateGroup[] {
    return this.duplicateDetector.detect(data);
  }

  /**
   * Remove duplicates
   */
  removeDuplicates(
    data: CleanerSheetData,
    groups: DuplicateGroup[]
  ): CellChange[] {
    const rowsToDelete = this.duplicateDetector.removeDuplicates(groups);

    return rowsToDelete.map(row => ({
      row,
      col: 0,
      ref: `Row ${row + 1}`,
      before: data.cells[row]?.map(c => c.value).join(', '),
      after: null,
      changeType: 'deleted' as const,
    }));
  }

  // ==========================================================================
  // FORMAT STANDARDIZATION
  // ==========================================================================

  /**
   * Analyze format issues
   */
  analyzeFormats(data: CleanerSheetData): FormatIssue[] {
    return this.formatStandardizer.analyze(data);
  }

  /**
   * Standardize formats
   */
  standardizeFormats(
    data: CleanerSheetData,
    issues: FormatIssue[]
  ): CellChange[] {
    return this.formatStandardizer.standardize(data, issues);
  }

  // ==========================================================================
  // MISSING VALUES
  // ==========================================================================

  /**
   * Analyze missing values
   */
  analyzeMissingValues(data: CleanerSheetData): MissingValueInfo[] {
    return this.missingValueHandler.analyze(data);
  }

  /**
   * Fill missing values
   */
  fillMissingValues(
    data: CleanerSheetData,
    info: MissingValueInfo[]
  ): CellChange[] {
    return this.missingValueHandler.fill(data, info);
  }

  // ==========================================================================
  // INCONSISTENCIES
  // ==========================================================================

  /**
   * Detect inconsistencies
   */
  detectInconsistencies(data: CleanerSheetData): InconsistencyGroup[] {
    return this.inconsistencyFixer.detect(data);
  }

  /**
   * Fix inconsistencies
   */
  fixInconsistencies(
    data: CleanerSheetData,
    groups: InconsistencyGroup[]
  ): CellChange[] {
    return this.inconsistencyFixer.fix(data, groups);
  }

  // ==========================================================================
  // OUTLIERS
  // ==========================================================================

  /**
   * Detect outliers
   */
  detectOutliers(data: CleanerSheetData): OutlierInfo[] {
    return this.outlierDetector.detect(data);
  }

  // ==========================================================================
  // VALIDATION
  // ==========================================================================

  /**
   * Validate data
   */
  validate(data: CleanerSheetData): ValidationResult[] {
    return this.dataValidator.validate(data);
  }

  // ==========================================================================
  // CLEANING PIPELINE
  // ==========================================================================

  /**
   * Execute cleaning pipeline
   */
  async executePipeline(
    data: CleanerSheetData,
    steps?: CleaningStep[],
    onProgress?: (step: string, progress: number) => void
  ): Promise<CleaningResult> {
    // Set up pipeline with steps
    if (steps) {
      for (const step of steps) {
        this.cleaningPipeline.addStep(step);
      }
    } else {
      // Use default steps
      for (const step of CleaningPipeline.getDefaultSteps()) {
        this.cleaningPipeline.addStep(step);
      }
    }

    this.emit({
      type: 'cleaning_started',
      steps: steps || CleaningPipeline.getDefaultSteps(),
    });

    const result = await this.cleaningPipeline.execute(data, (step, progress) => {
      onProgress?.(step, progress);
    });

    // Create session
    if (result.success) {
      const session: CleaningSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        sheetId: data.sheetId,
        sheetName: data.sheetName,
        qualityBefore: this.currentScore?.overall || 0,
        qualityAfter: 0, // Will be updated after re-analysis
        changes: result.stepResults.flatMap(r => r.changes),
        canUndo: true,
      };

      this.sessions.push(session);

      // Re-analyze to get new quality score
      const newScore = this.analyze(data);
      session.qualityAfter = newScore.overall;
    }

    this.emit({ type: 'cleaning_completed', result });

    return result;
  }

  /**
   * Preview cleaning changes
   */
  previewCleaning(
    data: CleanerSheetData,
    changes: CellChange[]
  ) {
    return this.cleaningPreview.generatePreview(data, changes);
  }

  // ==========================================================================
  // QUICK FIX
  // ==========================================================================

  /**
   * Fix all auto-fixable issues
   */
  async fixAllAutoFixable(data: CleanerSheetData): Promise<CellChange[]> {
    const changes: CellChange[] = [];

    // Trim whitespace
    for (let row = 0; row < data.rowCount; row++) {
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.isEmpty) continue;

        const value = String(cell.value);
        const trimmed = value.trim().replace(/\s+/g, ' ');

        if (trimmed !== value) {
          changes.push({
            row,
            col,
            ref: this.getCellRef(col, row),
            before: value,
            after: trimmed,
            changeType: 'trimmed',
          });
        }
      }
    }

    // Remove duplicates
    const duplicates = this.detectDuplicates(data);
    changes.push(...this.removeDuplicates(data, duplicates));

    // Fill missing values
    const missing = this.analyzeMissingValues(data);
    changes.push(...this.fillMissingValues(data, missing));

    // Standardize formats
    const formats = this.analyzeFormats(data);
    changes.push(...this.standardizeFormats(data, formats));

    // Fix inconsistencies
    const inconsistencies = this.detectInconsistencies(data);
    changes.push(...this.fixInconsistencies(data, inconsistencies));

    return changes;
  }

  // ==========================================================================
  // HISTORY
  // ==========================================================================

  /**
   * Get cleaning sessions
   */
  getSessions(): CleaningSession[] {
    return [...this.sessions];
  }

  /**
   * Undo last session
   */
  undoSession(sessionId: string): boolean {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return false;

    const session = this.sessions[sessionIndex];
    if (!session.canUndo) return false;

    // Mark as undone
    session.canUndo = false;

    this.emit({ type: 'cleaning_undone', sessionId });

    return true;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.sessions = [];
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * Subscribe to events
   */
  on(handler: CleanerEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Emit event
   */
  private emit(event: CleanerEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        loggers.datacleaner.error('Event handler error:', error);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Get cell reference string
   */
  private getCellRef(col: number, row: number): string {
    return `${this.colToLetter(col)}${row + 1}`;
  }

  /**
   * Convert column index to letter
   */
  private colToLetter(col: number): string {
    let letter = '';
    let temp = col;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}

// Export singleton
export const dataCleanerEngine = new DataCleanerEngine();
