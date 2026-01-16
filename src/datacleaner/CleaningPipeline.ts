// =============================================================================
// CLEANING PIPELINE — Execute cleaning steps
// =============================================================================

import type {
  CleanerSheetData,
  CleaningStep,
  CleaningPipelineConfig,
  CleaningResult,
  StepResult,
  CellChange,
  CleaningSummary,
  ChangeType,
} from './types';
import { DuplicateDetector } from './DuplicateDetector';
import { FormatStandardizer } from './FormatStandardizer';
import { MissingValueHandler } from './MissingValueHandler';
import { InconsistencyFixer } from './InconsistencyFixer';
import { OutlierDetector } from './OutlierDetector';
import { DataValidator } from './DataValidator';

/**
 * Executes cleaning pipeline steps
 */
export class CleaningPipeline {
  private config: CleaningPipelineConfig;
  private duplicateDetector: DuplicateDetector;
  private formatStandardizer: FormatStandardizer;
  private missingValueHandler: MissingValueHandler;
  private inconsistencyFixer: InconsistencyFixer;
  private outlierDetector: OutlierDetector;
  private dataValidator: DataValidator;

  constructor(config: Partial<CleaningPipelineConfig> = {}) {
    this.config = {
      steps: [],
      previewMode: true,
      batchSize: 1000,
      stopOnError: false,
      ...config,
    };

    this.duplicateDetector = new DuplicateDetector();
    this.formatStandardizer = new FormatStandardizer();
    this.missingValueHandler = new MissingValueHandler();
    this.inconsistencyFixer = new InconsistencyFixer();
    this.outlierDetector = new OutlierDetector();
    this.dataValidator = new DataValidator();
  }

  /**
   * Execute the cleaning pipeline
   */
  async execute(
    data: CleanerSheetData,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CleaningResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const allChanges: CellChange[] = [];

    // Sort steps by order
    const sortedSteps = [...this.config.steps]
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);

    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i];
      const stepStartTime = Date.now();

      onProgress?.(step.name, (i / sortedSteps.length) * 100);

      try {
        const changes = await this.executeStep(step, data);
        const stepResult: StepResult = {
          stepId: step.id,
          stepType: step.type,
          success: true,
          changes,
          duration: Date.now() - stepStartTime,
        };

        stepResults.push(stepResult);
        allChanges.push(...changes);

        // Apply changes to data if not in preview mode
        if (!this.config.previewMode) {
          this.applyChanges(data, changes);
        }
      } catch (error) {
        const stepResult: StepResult = {
          stepId: step.id,
          stepType: step.type,
          success: false,
          changes: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - stepStartTime,
        };

        stepResults.push(stepResult);

        if (this.config.stopOnError) {
          break;
        }
      }
    }

    onProgress?.('Complete', 100);

    return {
      success: stepResults.every(r => r.success),
      stepResults,
      summary: this.calculateSummary(allChanges),
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: CleaningStep,
    data: CleanerSheetData
  ): Promise<CellChange[]> {
    switch (step.type) {
      case 'remove_duplicates':
        return this.executeDuplicateRemoval(data, step);
      case 'fill_missing':
        return this.executeFillMissing(data, step);
      case 'standardize_format':
        return this.executeFormatStandardization(data, step);
      case 'fix_inconsistencies':
        return this.executeInconsistencyFix(data, step);
      case 'trim_whitespace':
        return this.executeTrimWhitespace(data, step);
      case 'handle_outliers':
        return this.executeOutlierHandling(data, step);
      case 'validate':
        return this.executeValidation(data, step);
      default:
        return [];
    }
  }

  /**
   * Execute duplicate removal
   */
  private executeDuplicateRemoval(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    const groups = this.duplicateDetector.detect(data);
    const rowsToDelete = this.duplicateDetector.removeDuplicates(groups);

    return rowsToDelete.map(row => ({
      row,
      col: 0,
      ref: `Row ${row + 1}`,
      before: 'row data',
      after: null,
      changeType: 'deleted' as ChangeType,
    }));
  }

  /**
   * Execute fill missing values
   */
  private executeFillMissing(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    const info = this.missingValueHandler.analyze(data);
    return this.missingValueHandler.fill(data, info);
  }

  /**
   * Execute format standardization
   */
  private executeFormatStandardization(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    const issues = this.formatStandardizer.analyze(data);
    return this.formatStandardizer.standardize(data, issues);
  }

  /**
   * Execute inconsistency fix
   */
  private executeInconsistencyFix(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    const groups = this.inconsistencyFixer.detect(data);
    return this.inconsistencyFixer.fix(data, groups);
  }

  /**
   * Execute trim whitespace
   */
  private executeTrimWhitespace(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    const changes: CellChange[] = [];

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
            ref: `${this.colToLetter(col)}${row + 1}`,
            before: value,
            after: trimmed,
            changeType: 'trimmed',
          });
        }
      }
    }

    return changes;
  }

  /**
   * Execute outlier handling (detection only - removal requires manual review)
   */
  private executeOutlierHandling(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    // Outlier detection - return empty changes as outliers need manual review
    this.outlierDetector.detect(data);
    return [];
  }

  /**
   * Execute validation
   */
  private executeValidation(
    data: CleanerSheetData,
    _step: CleaningStep
  ): CellChange[] {
    // Validation doesn't make changes, just returns results
    this.dataValidator.validate(data);
    return [];
  }

  /**
   * Apply changes to data
   */
  private applyChanges(data: CleanerSheetData, changes: CellChange[]): void {
    // Sort deletions by row descending to avoid index issues
    const deletions = changes
      .filter(c => c.changeType === 'deleted')
      .sort((a, b) => b.row - a.row);

    const modifications = changes.filter(c => c.changeType !== 'deleted');

    // Apply modifications first
    for (const change of modifications) {
      const cell = data.cells[change.row]?.[change.col];
      if (cell) {
        cell.value = change.after;
        cell.displayValue = String(change.after);
        cell.isEmpty = change.after === null || change.after === undefined || change.after === '';
      }
    }

    // Apply deletions
    for (const deletion of deletions) {
      data.cells.splice(deletion.row, 1);
      data.rowCount--;
    }
  }

  /**
   * Calculate summary from changes
   */
  private calculateSummary(changes: CellChange[]): CleaningSummary {
    const byType: Record<ChangeType, number> = {
      modified: 0,
      deleted: 0,
      filled: 0,
      trimmed: 0,
      standardized: 0,
    };

    const affectedRows = new Set<number>();
    const affectedCells = new Set<string>();
    let rowsDeleted = 0;

    for (const change of changes) {
      byType[change.changeType]++;
      affectedRows.add(change.row);
      affectedCells.add(`${change.row}-${change.col}`);

      if (change.changeType === 'deleted') {
        rowsDeleted++;
      }
    }

    return {
      totalChanges: changes.length,
      byType,
      rowsAffected: affectedRows.size,
      cellsAffected: affectedCells.size,
      rowsDeleted,
    };
  }

  /**
   * Add a cleaning step
   */
  addStep(step: CleaningStep): void {
    this.config.steps.push(step);
  }

  /**
   * Remove a step by ID
   */
  removeStep(stepId: string): void {
    this.config.steps = this.config.steps.filter(s => s.id !== stepId);
  }

  /**
   * Enable/disable a step
   */
  toggleStep(stepId: string, enabled: boolean): void {
    const step = this.config.steps.find(s => s.id === stepId);
    if (step) {
      step.enabled = enabled;
    }
  }

  /**
   * Reorder steps
   */
  reorderSteps(stepIds: string[]): void {
    for (let i = 0; i < stepIds.length; i++) {
      const step = this.config.steps.find(s => s.id === stepIds[i]);
      if (step) {
        step.order = i;
      }
    }
  }

  /**
   * Set preview mode
   */
  setPreviewMode(preview: boolean): void {
    this.config.previewMode = preview;
  }

  /**
   * Get default cleaning steps
   */
  static getDefaultSteps(): CleaningStep[] {
    return [
      {
        id: 'step-trim',
        type: 'trim_whitespace',
        name: 'Trim Whitespace',
        config: { trimAll: true },
        enabled: true,
        order: 0,
      },
      {
        id: 'step-duplicates',
        type: 'remove_duplicates',
        name: 'Remove Duplicates',
        config: {},
        enabled: true,
        order: 1,
      },
      {
        id: 'step-missing',
        type: 'fill_missing',
        name: 'Fill Missing Values',
        config: {},
        enabled: true,
        order: 2,
      },
      {
        id: 'step-format',
        type: 'standardize_format',
        name: 'Standardize Formats',
        config: {},
        enabled: true,
        order: 3,
      },
      {
        id: 'step-inconsistency',
        type: 'fix_inconsistencies',
        name: 'Fix Inconsistencies',
        config: {},
        enabled: true,
        order: 4,
      },
    ];
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
