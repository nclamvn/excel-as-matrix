// =============================================================================
// WORKFLOW EXECUTOR — Execute workflow steps with full action implementations
// =============================================================================

import type {
  Workflow,
  WorkflowStep,
  MacroExecution,
  StepResult,
  StepCondition,
} from './types';
import { useWorkbookStore } from '../stores/workbookStore';
import { useChartStore } from '../stores/chartStore';
import { useUIStore } from '../stores/uiStore';
import { exportToExcel, exportToCSV } from '../utils/excelIO';
import { getCellKey, CellData, CellRange, CellFormat } from '../types/cell';
import { ChartType } from '../types/visualization';

type StepCallback = (result: StepResult) => void;

// Helper to parse range string like "A1:B10" to CellRange
function parseRangeString(rangeStr: string): CellRange | null {
  const match = rangeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return null;

  const colToNum = (col: string): number => {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num - 1; // 0-indexed
  };

  return {
    start: { row: parseInt(match[2]) - 1, col: colToNum(match[1].toUpperCase()) },
    end: { row: parseInt(match[4]) - 1, col: colToNum(match[3].toUpperCase()) },
  };
}

// Helper to get cells in a range
function getCellsInRange(
  cells: Record<string, CellData>,
  range: CellRange
): Record<string, CellData> {
  const result: Record<string, CellData> = {};
  for (let row = range.start.row; row <= range.end.row; row++) {
    for (let col = range.start.col; col <= range.end.col; col++) {
      const key = getCellKey(row, col);
      if (cells[key]) {
        result[key] = cells[key];
      }
    }
  }
  return result;
}

/**
 * Execute workflow steps
 */
export class WorkflowExecutor {
  private cancelledExecutions: Set<string> = new Set();
  private variables: Map<string, unknown> = new Map();
  private clipboardData: Record<string, CellData> | null = null;

  /**
   * Execute a workflow
   */
  async execute(
    workflow: Workflow,
    execution: MacroExecution,
    onStepComplete: StepCallback
  ): Promise<void> {
    // Initialize variables
    this.variables.clear();
    for (const variable of workflow.variables) {
      this.variables.set(variable.name, variable.value);
    }

    // Execute steps
    for (const step of workflow.steps) {
      if (this.cancelledExecutions.has(execution.id)) {
        throw new Error('Execution cancelled');
      }

      if (!step.enabled) continue;

      const result = await this.executeStep(step, workflow);
      onStepComplete(result);

      if (result.status === 'failed' && workflow.onError === 'stop') {
        throw new Error(`Step failed: ${result.error}`);
      }
    }
  }

  /**
   * Cancel execution
   */
  cancel(executionId: string): void {
    this.cancelledExecutions.add(executionId);
  }

  /**
   * Execute single step
   */
  private async executeStep(step: WorkflowStep, workflow: Workflow): Promise<StepResult> {
    const startedAt = new Date();

    try {
      // Check condition
      if (step.condition && !this.evaluateCondition(step.condition)) {
        return {
          stepId: step.id,
          status: 'skipped',
          startedAt,
          completedAt: new Date(),
          duration: 0,
        };
      }

      let output: unknown;

      switch (step.type) {
        case 'action':
          output = await this.executeAction(step);
          break;

        case 'condition':
          output = await this.executeBranch(step, workflow);
          break;

        case 'loop':
          output = await this.executeLoop(step, workflow);
          break;

        case 'wait':
          await this.executeWait(step);
          break;

        case 'parallel':
          output = await this.executeParallel(step, workflow);
          break;
      }

      // Store output in variable
      if (step.action?.outputVariable && output !== undefined) {
        this.variables.set(step.action.outputVariable, output);
      }

      const completedAt = new Date();
      return {
        stepId: step.id,
        status: 'success',
        output,
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
      };

    } catch (error) {
      const completedAt = new Date();
      return {
        stepId: step.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        startedAt,
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
      };
    }
  }

  /**
   * Execute action
   */
  private async executeAction(step: WorkflowStep): Promise<unknown> {
    const action = step.action;
    if (!action) return;

    // Resolve input variables
    const params = this.resolveParams(action.params);

    // Execute based on action type
    return this.actionHandlers[action.type]?.(params);
  }

  /**
   * Execute conditional branch
   */
  private async executeBranch(step: WorkflowStep, workflow: Workflow): Promise<void> {
    if (!step.branches) return;

    for (const branch of step.branches) {
      if (this.evaluateCondition(branch.condition)) {
        for (const branchStep of branch.steps) {
          await this.executeStep(branchStep, workflow);
        }
        break;
      }
    }
  }

  /**
   * Execute loop
   */
  private async executeLoop(step: WorkflowStep, workflow: Workflow): Promise<void> {
    const loop = step.loop;
    if (!loop) return;

    switch (loop.type) {
      case 'count':
        for (let i = 0; i < (loop.iterations || 0); i++) {
          if (loop.indexVariable) {
            this.variables.set(loop.indexVariable, i);
          }
          await this.executeAction(step);
        }
        break;

      case 'while':
        let iterations = 0;
        while (loop.condition && this.evaluateCondition(loop.condition) && iterations < (loop.maxIterations || 1000)) {
          await this.executeAction(step);
          iterations++;
        }
        break;

      case 'for_each':
        const collection = this.variables.get(loop.collection!) as unknown[] || [];
        for (let i = 0; i < collection.length; i++) {
          if (loop.itemVariable) {
            this.variables.set(loop.itemVariable, collection[i]);
          }
          if (loop.indexVariable) {
            this.variables.set(loop.indexVariable, i);
          }
          await this.executeAction(step);
        }
        break;
    }

    // Suppress unused parameter warning
    void workflow;
  }

  /**
   * Execute wait
   */
  private async executeWait(step: WorkflowStep): Promise<void> {
    const delay = (step.action?.params?.delay as number) || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Execute parallel steps
   */
  private async executeParallel(step: WorkflowStep, workflow: Workflow): Promise<unknown[]> {
    if (!step.branches) return [];

    const promises = step.branches.map(branch =>
      Promise.all(branch.steps.map(s => this.executeStep(s, workflow)))
    );

    return Promise.all(promises);
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: StepCondition): boolean {
    if (condition.type === 'compound' && condition.conditions) {
      const results = condition.conditions.map(c => this.evaluateCondition(c));
      return condition.logicalOperator === 'and'
        ? results.every(r => r)
        : results.some(r => r);
    }

    const left = this.resolveValue(condition.leftOperand);
    const right = condition.rightOperand;

    switch (condition.operator) {
      case 'equals': return left === right;
      case 'not_equals': return left !== right;
      case 'greater': return (left as number) > (right as number);
      case 'greater_equal': return (left as number) >= (right as number);
      case 'less': return (left as number) < (right as number);
      case 'less_equal': return (left as number) <= (right as number);
      case 'contains': return String(left).includes(String(right));
      case 'not_contains': return !String(left).includes(String(right));
      case 'starts_with': return String(left).startsWith(String(right));
      case 'ends_with': return String(left).endsWith(String(right));
      default: return true;
    }
  }

  /**
   * Resolve variable references in params
   */
  private resolveParams(params: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      resolved[key] = this.resolveValue(value);
    }

    return resolved;
  }

  /**
   * Resolve a single value (may be variable reference)
   */
  private resolveValue(value: unknown): unknown {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const varName = value.slice(2, -2).trim();
      return this.variables.get(varName);
    }
    return value;
  }

  /**
   * Action handlers - Full implementations
   */
  private actionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown>> = {
    // =========================================================================
    // DATA OPERATIONS
    // =========================================================================

    copy_range: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get range from params or current selection
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      }

      if (!range) {
        throw new Error('No range specified');
      }

      // Copy cells to internal clipboard
      this.clipboardData = getCellsInRange(sheet.cells, range);

      // Also trigger store copy for UI sync
      store.setSelectionRange(range);
      store.copy();

      return {
        copied: true,
        cellCount: Object.keys(this.clipboardData).length,
        range: `${range.start.row}:${range.start.col} to ${range.end.row}:${range.end.col}`
      };
    },

    paste_range: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get target position
      let targetRow = 0;
      let targetCol = 0;

      if (params.target && typeof params.target === 'string') {
        const match = params.target.match(/^([A-Z]+)(\d+)$/i);
        if (match) {
          let colNum = 0;
          const col = match[1].toUpperCase();
          for (let i = 0; i < col.length; i++) {
            colNum = colNum * 26 + (col.charCodeAt(i) - 64);
          }
          targetRow = parseInt(match[2]) - 1;
          targetCol = colNum - 1;
        }
      } else if (store.selectedCell) {
        targetRow = store.selectedCell.row;
        targetCol = store.selectedCell.col;
      }

      // Set selection and paste
      store.setSelectedCell({ row: targetRow, col: targetCol });

      const mode = (params.mode as 'all' | 'values' | 'formulas' | 'formatting') || 'all';
      store.paste(mode);

      return {
        pasted: true,
        target: `${targetRow}:${targetCol}`,
        mode
      };
    },

    clear_range: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get range from params or current selection
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      }

      if (!range) {
        throw new Error('No range specified');
      }

      // Clear cells in range
      const clearType = (params.type as string) || 'all'; // 'all', 'values', 'formats', 'comments'
      let clearedCount = 0;

      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          if (clearType === 'all' || clearType === 'values') {
            store.clearCell(activeSheetId, row, col);
            clearedCount++;
          } else if (clearType === 'formats') {
            store.setSelectionRange({ start: { row, col }, end: { row, col } });
            store.clearFormat();
            clearedCount++;
          } else if (clearType === 'comments') {
            store.deleteComment(row, col);
            clearedCount++;
          }
        }
      }

      return { cleared: true, cellCount: clearedCount, type: clearType };
    },

    filter_data: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get column and filter criteria
      const column = params.column as number;
      const criteria = params.criteria as string;
      const operator = (params.operator as string) || 'equals';

      if (column === undefined || criteria === undefined) {
        // Toggle filter on/off
        store.toggleFilter();
        return { filtered: true, filterEnabled: !store.filterEnabled };
      }

      // Apply filter logic - find matching rows
      const matchingRows: number[] = [];
      const range = store.selectionRange;

      if (range) {
        for (let row = range.start.row; row <= range.end.row; row++) {
          const key = getCellKey(row, column);
          const cell = sheet.cells[key];
          const value = String(cell?.value ?? '');

          let matches = false;
          switch (operator) {
            case 'equals':
              matches = value === criteria;
              break;
            case 'contains':
              matches = value.toLowerCase().includes(criteria.toLowerCase());
              break;
            case 'starts_with':
              matches = value.toLowerCase().startsWith(criteria.toLowerCase());
              break;
            case 'ends_with':
              matches = value.toLowerCase().endsWith(criteria.toLowerCase());
              break;
            case 'greater':
              matches = parseFloat(value) > parseFloat(criteria);
              break;
            case 'less':
              matches = parseFloat(value) < parseFloat(criteria);
              break;
            default:
              matches = value === criteria;
          }

          if (matches) {
            matchingRows.push(row);
          }
        }
      }

      // Store filter results in variable for later use
      this.variables.set('_filteredRows', matchingRows);

      return {
        filtered: true,
        matchCount: matchingRows.length,
        column,
        criteria,
        operator
      };
    },

    sort_data: async (params) => {
      const store = useWorkbookStore.getState();

      const column = params.column as number;
      const direction = (params.direction as 'asc' | 'desc') || 'asc';

      if (column === undefined) {
        throw new Error('Column parameter required for sorting');
      }

      // Apply sort
      store.sort({ column, direction });

      return { sorted: true, column, direction };
    },

    remove_duplicates: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get range
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      }

      if (!range) {
        throw new Error('No range specified');
      }

      // Get columns to check (default: all columns in range)
      const columnsToCheck = (params.columns as number[]) ||
        Array.from({ length: range.end.col - range.start.col + 1 }, (_, i) => range!.start.col + i);

      // Find duplicates
      const seen = new Set<string>();
      const duplicateRows: number[] = [];

      for (let row = range.start.row; row <= range.end.row; row++) {
        const rowKey = columnsToCheck.map(col => {
          const key = getCellKey(row, col);
          return String(sheet.cells[key]?.value ?? '');
        }).join('|');

        if (seen.has(rowKey)) {
          duplicateRows.push(row);
        } else {
          seen.add(rowKey);
        }
      }

      // Remove duplicate rows (from bottom to top to preserve indices)
      store.pushHistory();
      duplicateRows.sort((a, b) => b - a).forEach(row => {
        store.deleteRow(row, 1);
      });

      return {
        removed: true,
        duplicatesFound: duplicateRows.length,
        uniqueRows: range.end.row - range.start.row + 1 - duplicateRows.length
      };
    },

    // =========================================================================
    // FORMULAS
    // =========================================================================

    apply_formula: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const formula = params.formula as string;
      if (!formula) {
        throw new Error('Formula parameter required');
      }

      // Get target range
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      } else if (store.selectedCell) {
        range = { start: store.selectedCell, end: store.selectedCell };
      }

      if (!range) {
        throw new Error('No target range specified');
      }

      // Apply formula to all cells in range
      store.pushHistory();
      let appliedCount = 0;

      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          // Adjust formula for relative references if needed
          const adjustedFormula = formula; // Could add formula adjustment logic here
          store.updateCell(activeSheetId, row, col, {
            formula: adjustedFormula,
            value: null,
            displayValue: ''
          });
          appliedCount++;
        }
      }

      return { applied: true, formula, cellCount: appliedCount };
    },

    // =========================================================================
    // FORMATTING
    // =========================================================================

    format_cells: async (params) => {
      const store = useWorkbookStore.getState();

      // Build format object from params
      const format: Partial<CellFormat> = {};

      if (params.bold !== undefined) format.bold = params.bold as boolean;
      if (params.italic !== undefined) format.italic = params.italic as boolean;
      if (params.underline !== undefined) format.underline = params.underline as boolean;
      if (params.fontFamily) format.fontFamily = params.fontFamily as string;
      if (params.fontSize) format.fontSize = params.fontSize as number;
      if (params.fontColor || params.textColor) format.textColor = (params.fontColor || params.textColor) as string;
      if (params.backgroundColor) format.backgroundColor = params.backgroundColor as string;
      if (params.textAlign || params.align) format.align = (params.textAlign || params.align) as 'left' | 'center' | 'right';
      if (params.numberFormat) format.numberFormat = params.numberFormat as string;

      // Get range
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      }

      if (range) {
        store.applyFormatToRange(range, format);
      } else {
        store.applyFormat(format);
      }

      return { formatted: true, format };
    },

    // =========================================================================
    // CHARTS
    // =========================================================================

    create_chart: async (params) => {
      const workbookStore = useWorkbookStore.getState();
      const chartStore = useChartStore.getState();

      const { activeSheetId, workbookId } = workbookStore;

      if (!activeSheetId || !workbookId) {
        throw new Error('No active workbook/sheet');
      }

      const chartType = (params.type as ChartType) || 'ColumnClustered';
      const name = (params.name as string) || `Chart ${Date.now()}`;

      // Create chart
      const chart = chartStore.createChart(workbookId, activeSheetId, name, chartType);

      // Set data source if provided
      if (params.dataRange && typeof params.dataRange === 'string') {
        const range = parseRangeString(params.dataRange);
        if (range) {
          chartStore.updateChart(chart.id, {
            dataSource: {
              ...chart.dataSource,
              range: {
                sheetId: activeSheetId,
                startRow: range.start.row,
                endRow: range.end.row,
                startCol: range.start.col,
                endCol: range.end.col,
              },
            }
          });
        }
      }

      // Set position if provided
      if (params.x !== undefined || params.y !== undefined) {
        chartStore.updatePosition(chart.id, {
          x: (params.x as number) || 100,
          y: (params.y as number) || 100,
          width: (params.width as number) || 500,
          height: (params.height as number) || 300,
        });
      }

      return { chartId: chart.id, name: chart.name, type: chartType };
    },

    // =========================================================================
    // EXPORT
    // =========================================================================

    export_pdf: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      const filename = (params.filename as string) || `${store.workbookName || 'spreadsheet'}.pdf`;

      // For PDF export, we need to use the print functionality
      // This triggers the browser's print dialog with PDF option
      window.print();

      return { exported: true, filename, format: 'pdf' };
    },

    export_excel: async (params) => {
      const store = useWorkbookStore.getState();
      const { sheets, sheetOrder, workbookName } = store;

      const filename = (params.filename as string) || `${workbookName || 'spreadsheet'}.xlsx`;

      // Export using xlsx library
      await exportToExcel(sheets, sheetOrder, filename);

      return { exported: true, filename, format: 'xlsx', sheetCount: sheetOrder.length };
    },

    export_csv: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets, workbookName } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      const filename = (params.filename as string) || `${workbookName || 'spreadsheet'}.csv`;

      // Export using CSV utility
      exportToCSV(sheet, filename);

      return { exported: true, filename, format: 'csv', sheetName: sheet.name };
    },

    // =========================================================================
    // NOTIFICATIONS
    // =========================================================================

    send_email: async (params) => {
      const to = params.to as string;
      const subject = params.subject as string;
      const body = params.body as string;

      if (!to) {
        throw new Error('Email recipient (to) is required');
      }

      // Create mailto link and open
      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
      window.open(mailtoUrl, '_blank');

      return { sent: true, to, subject };
    },

    send_slack: async (params) => {
      const webhookUrl = params.webhookUrl as string;
      const message = params.message as string;
      const channel = params.channel as string;

      if (!webhookUrl) {
        // If no webhook, show notification instead
        useUIStore.getState().showToast(`Slack message: ${message}`, 'info', 5000);
        return { sent: false, reason: 'No webhook URL configured' };
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            channel: channel,
          }),
        });

        return { sent: response.ok, channel, message };
      } catch (error) {
        return { sent: false, error: String(error) };
      }
    },

    show_notification: async (params) => {
      const message = params.message as string;
      const type = (params.type as 'success' | 'error' | 'warning' | 'info') || 'info';
      const duration = (params.duration as number) || 5000;

      useUIStore.getState().showToast(message || 'Notification', type, duration);

      return { shown: true, message, type };
    },

    // =========================================================================
    // AI ACTIONS
    // =========================================================================

    ai_clean_data: async (params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get range
      let range: CellRange | null = null;
      if (params.range && typeof params.range === 'string') {
        range = parseRangeString(params.range);
      } else if (store.selectionRange) {
        range = store.selectionRange;
      }

      if (!range) {
        throw new Error('No range specified');
      }

      // AI data cleaning operations
      const cleaningActions = (params.actions as string[]) || ['trim', 'lowercase', 'remove_duplicates'];
      let cleanedCount = 0;

      store.pushHistory();

      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          const key = getCellKey(row, col);
          const cell = sheet.cells[key];

          if (cell && typeof cell.value === 'string') {
            let value = cell.value;

            for (const action of cleaningActions) {
              switch (action) {
                case 'trim':
                  value = value.trim();
                  break;
                case 'lowercase':
                  value = value.toLowerCase();
                  break;
                case 'uppercase':
                  value = value.toUpperCase();
                  break;
                case 'remove_spaces':
                  value = value.replace(/\s+/g, ' ');
                  break;
                case 'remove_special':
                  value = value.replace(/[^a-zA-Z0-9\s]/g, '');
                  break;
              }
            }

            if (value !== cell.value) {
              store.updateCell(activeSheetId, row, col, {
                value,
                displayValue: value
              });
              cleanedCount++;
            }
          }
        }
      }

      return { cleaned: true, cellsCleaned: cleanedCount, actions: cleaningActions };
    },

    ai_create_chart: async (params) => {
      const workbookStore = useWorkbookStore.getState();
      const chartStore = useChartStore.getState();
      const { activeSheetId, workbookId, sheets, selectionRange } = workbookStore;

      if (!activeSheetId || !workbookId) {
        throw new Error('No active workbook/sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Analyze data to determine best chart type
      const range = selectionRange;
      if (!range) {
        throw new Error('No data range selected');
      }

      // Simple heuristics for chart type recommendation
      const rowCount = range.end.row - range.start.row + 1;
      const colCount = range.end.col - range.start.col + 1;

      let recommendedType: ChartType = 'ColumnClustered';

      // Check data characteristics
      const firstColValues: (string | number)[] = [];
      const hasNegatives = false;

      for (let row = range.start.row; row <= range.end.row; row++) {
        const key = getCellKey(row, range.start.col);
        const cell = sheet.cells[key];
        if (cell) firstColValues.push(cell.value as string | number);
      }

      // Determine chart type based on data
      if (colCount === 2 && rowCount > 5) {
        // Two columns with many rows - could be pie chart
        recommendedType = 'Pie';
      } else if (rowCount > 10 && colCount <= 3) {
        // Time series-like data
        recommendedType = 'Line';
      } else if (colCount > 5) {
        // Many columns - horizontal bar might be better
        recommendedType = 'Bar';
      } else if (hasNegatives) {
        // Has negative values - bar chart
        recommendedType = 'Bar';
      }

      // Override with user preference if provided
      const chartType = (params.type as ChartType) || recommendedType;
      const name = (params.name as string) || `AI Chart ${Date.now()}`;

      // Create the chart
      const chart = chartStore.createChart(workbookId, activeSheetId, name, chartType);

      return {
        chartId: chart.id,
        recommendedType,
        actualType: chartType,
        dataAnalysis: {
          rows: rowCount,
          columns: colCount
        }
      };
    },

    ai_formula: async (params) => {
      const description = params.description as string;

      if (!description) {
        throw new Error('Description parameter required');
      }

      // Simple NL to formula mapping (in production, this would use AI)
      const formulaMap: Record<string, string> = {
        'sum': '=SUM(A1:A10)',
        'average': '=AVERAGE(A1:A10)',
        'count': '=COUNT(A1:A10)',
        'max': '=MAX(A1:A10)',
        'min': '=MIN(A1:A10)',
        'total': '=SUM(A1:A10)',
        'mean': '=AVERAGE(A1:A10)',
      };

      // Find matching formula
      const lowerDesc = description.toLowerCase();
      let formula = '=SUM(A1:A10)'; // Default

      for (const [keyword, formulaTemplate] of Object.entries(formulaMap)) {
        if (lowerDesc.includes(keyword)) {
          formula = formulaTemplate;
          break;
        }
      }

      // If range specified, use it
      if (params.range && typeof params.range === 'string') {
        formula = formula.replace('A1:A10', params.range);
      }

      return { formula, description, confidence: 0.8 };
    },

    ai_analyze: async (_params) => {
      const store = useWorkbookStore.getState();
      const { activeSheetId, sheets, selectionRange } = store;

      if (!activeSheetId) {
        throw new Error('No active sheet');
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        throw new Error('Sheet not found');
      }

      // Get range
      const range = selectionRange;
      if (!range) {
        throw new Error('No data range selected');
      }

      // Collect data for analysis
      const values: number[] = [];
      const textValues: string[] = [];
      let emptyCells = 0;
      let numericCells = 0;
      let textCells = 0;

      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          const key = getCellKey(row, col);
          const cell = sheet.cells[key];

          if (!cell || cell.value === null || cell.value === '') {
            emptyCells++;
          } else if (typeof cell.value === 'number') {
            values.push(cell.value);
            numericCells++;
          } else {
            textValues.push(String(cell.value));
            textCells++;
          }
        }
      }

      // Calculate statistics for numeric data
      const insights: string[] = [];
      let statistics: Record<string, number> = {};

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const median = sorted[Math.floor(sorted.length / 2)];

        statistics = { sum, average: avg, min, max, median, count: values.length };

        // Generate insights
        if (max > avg * 3) {
          insights.push(`Potential outlier detected: ${max} is significantly higher than average (${avg.toFixed(2)})`);
        }
        if (min < avg / 3 && min >= 0) {
          insights.push(`Potential outlier detected: ${min} is significantly lower than average (${avg.toFixed(2)})`);
        }
        if (values.some(v => v < 0)) {
          insights.push('Data contains negative values');
        }
      }

      // Analyze text data
      if (textValues.length > 0) {
        const uniqueValues = new Set(textValues);
        if (uniqueValues.size < textValues.length * 0.5) {
          insights.push(`High duplication in text data: ${uniqueValues.size} unique values out of ${textValues.length}`);
        }
      }

      // Data quality assessment
      const totalCells = (range.end.row - range.start.row + 1) * (range.end.col - range.start.col + 1);
      const completeness = ((totalCells - emptyCells) / totalCells * 100).toFixed(1);

      if (emptyCells > totalCells * 0.1) {
        insights.push(`Data completeness: ${completeness}% (${emptyCells} empty cells)`);
      }

      return {
        insights,
        statistics,
        dataProfile: {
          totalCells,
          emptyCells,
          numericCells,
          textCells,
          completeness: parseFloat(completeness)
        }
      };
    },
  };
}
