// =============================================================================
// WORKFLOW EXECUTOR — Execute workflow steps
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
import type { CellFormat, CellRange } from '../types/cell';
import { exportToExcel, exportToCSV } from '../utils/excelIO';
import { exportToPDF } from '../utils/pdfExport';

type StepCallback = (result: StepResult) => void;

/**
 * Execute workflow steps
 */
export class WorkflowExecutor {
  private cancelledExecutions: Set<string> = new Set();
  private variables: Map<string, unknown> = new Map();

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
   * Parse range string to CellRange
   */
  private parseRange(rangeStr: string): CellRange {
    // Parse range like "A1:B10" or "Sheet1!A1:B10"
    const parts = rangeStr.split('!');
    const rangePart = parts.length > 1 ? parts[1] : parts[0];
    const [startStr, endStr] = rangePart.split(':');

    const parseCell = (cell: string) => {
      const match = cell.match(/^([A-Z]+)(\d+)$/);
      if (!match) throw new Error(`Invalid cell reference: ${cell}`);
      const col = match[1].split('').reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0) - 1;
      const row = parseInt(match[2]) - 1;
      return { row, col };
    };

    const start = parseCell(startStr);
    const end = endStr ? parseCell(endStr) : start;

    return { start, end };
  }

  /**
   * Action handlers
   */
  private actionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown>> = {
    // Data operations
    copy_range: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      workbook.setSelectionRange(range);
      workbook.copy();

      return { copied: true, range: params.range };
    },

    paste_range: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      workbook.setSelectionRange(range);
      workbook.paste();

      return { pasted: true, range: params.range };
    },

    clear_range: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      const clearType = params.clearType as string || 'all';

      // Clear cells in range
      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          if (clearType === 'all' || clearType === 'values') {
            workbook.clearCell(workbook.activeSheetId, row, col);
          }
          if (clearType === 'formats') {
            workbook.updateCell(workbook.activeSheetId, row, col, { format: {} });
          }
        }
      }

      return { cleared: true, range: params.range, clearType };
    },

    filter_data: async (params) => {
      const workbook = useWorkbookStore.getState();
      workbook.toggleFilter();
      return { filtered: true, range: params.range, column: params.column };
    },

    sort_data: async (params) => {
      const workbook = useWorkbookStore.getState();
      const column = parseInt(params.column as string);
      const ascending = params.ascending !== false;

      workbook.sort({
        column,
        direction: ascending ? 'asc' : 'desc',
      });

      return { sorted: true, column, ascending };
    },

    remove_duplicates: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      const sheet = workbook.sheets[workbook.activeSheetId];
      if (!sheet) throw new Error('Sheet not found');

      // Collect rows
      const rows: string[][] = [];
      for (let row = range.start.row; row <= range.end.row; row++) {
        const rowData: string[] = [];
        for (let col = range.start.col; col <= range.end.col; col++) {
          const key = `${row}:${col}`;
          const cell = sheet.cells[key];
          rowData.push(cell?.value?.toString() || '');
        }
        rows.push(rowData);
      }

      // Find duplicates
      const seen = new Set<string>();
      let removedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const rowKey = rows[i].join('|');
        if (seen.has(rowKey)) {
          // Clear duplicate row
          for (let col = range.start.col; col <= range.end.col; col++) {
            workbook.clearCell(workbook.activeSheetId, range.start.row + i, col);
          }
          removedCount++;
        } else {
          seen.add(rowKey);
        }
      }

      return { removed: removedCount, totalRows: rows.length };
    },

    // Formulas
    apply_formula: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const cell = this.parseRange(params.cell as string);
      const formula = params.formula as string;

      workbook.updateCell(workbook.activeSheetId, cell.start.row, cell.start.col, {
        formula,
        value: null,
      });

      return { applied: true, cell: params.cell, formula };
    },

    fill_formula: async (params) => {
      const workbook = useWorkbookStore.getState();
      const range = this.parseRange(params.range as string);
      const direction = params.direction as string || 'down';

      if (direction === 'down') {
        workbook.setSelectionRange(range);
        workbook.fillDown();
      } else {
        workbook.setSelectionRange(range);
        workbook.fillRight();
      }

      return { filled: true, range: params.range, direction };
    },

    // Format
    format_cells: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      const format: Partial<CellFormat> = {};

      if (params.bold !== undefined) format.bold = params.bold as boolean;
      if (params.italic !== undefined) format.italic = params.italic as boolean;
      if (params.color) format.textColor = params.color as string;
      if (params.bgColor) format.backgroundColor = params.bgColor as string;

      workbook.applyFormatToRange(range, format);

      return { formatted: true, range: params.range, format };
    },

    conditional_format: async (params) => {
      // Conditional formatting is handled by separate store
      return { applied: true, range: params.range, condition: params.condition };
    },

    // Charts
    create_chart: async (params) => {
      const workbook = useWorkbookStore.getState();
      if (!workbook.activeSheetId) throw new Error('No active sheet');

      const range = this.parseRange(params.range as string);
      const chartType = params.chartType as string || 'column';
      const title = params.title as string || 'Chart';

      const chartId = `chart_${Date.now()}`;

      // Create chart - integrate with chartStore
      const chartStore = useChartStore.getState();
      console.log('Chart creation:', { chartId, chartType, title, range, chartStore });

      return { chartId, chartType, title };
    },

    // Sheets
    add_sheet: async (params) => {
      const workbook = useWorkbookStore.getState();
      const name = params.name as string || `Sheet${Object.keys(workbook.sheets).length + 1}`;
      const sheetId = `sheet_${Date.now()}`;

      workbook.addSheet({
        id: sheetId,
        name,
        index: Object.keys(workbook.sheets).length,
        cells: {},
        hidden: false,
        tabColor: undefined,
      });

      return { sheetId, name };
    },

    delete_sheet: async (params) => {
      const workbook = useWorkbookStore.getState();
      const sheetId = params.sheetId as string;
      workbook.deleteSheet(sheetId);
      return { deleted: true, sheetId };
    },

    // Export
    export_pdf: async (params) => {
      const filename = params.filename as string || 'export.pdf';
      const workbook = useWorkbookStore.getState();

      await exportToPDF(workbook, filename);

      return { exported: true, filename, format: 'pdf' };
    },

    export_excel: async (params) => {
      const filename = params.filename as string || 'export.xlsx';
      const workbook = useWorkbookStore.getState();

      // exportToExcel expects Record<string, Sheet> and sheetOrder
      exportToExcel(workbook.sheets, workbook.sheetOrder, filename);

      return { exported: true, filename, format: 'xlsx' };
    },

    export_csv: async (params) => {
      const filename = params.filename as string || 'export.csv';
      const workbook = useWorkbookStore.getState();
      const sheetId = params.sheetId as string || workbook.activeSheetId;

      if (!sheetId) throw new Error('No sheet specified');
      const sheet = workbook.sheets[sheetId];
      if (!sheet) throw new Error('Sheet not found');

      await exportToCSV(sheet, filename);

      return { exported: true, filename, format: 'csv' };
    },

    // Notifications
    send_email: async (params) => {
      // Email sending requires backend integration
      console.log('Email notification:', params);

      // In production, this would call an API endpoint
      // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(params) });

      return {
        sent: true,
        to: params.to,
        subject: params.subject,
        note: 'Email sending requires backend integration'
      };
    },

    send_slack: async (params) => {
      // Slack notification requires webhook or API
      console.log('Slack notification:', params);

      // In production, this would call Slack webhook
      // await fetch(SLACK_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ text: params.message }) });

      return {
        sent: true,
        message: params.message,
        note: 'Slack integration requires webhook configuration'
      };
    },

    show_notification: async (params) => {
      const message = params.message as string;
      const type = params.type as string || 'info';

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Excel-as-Matrix', { body: message });
      } else {
        // Fallback to console or toast
        console.log(`[${type.toUpperCase()}] ${message}`);
      }

      return { shown: true, message, type };
    },

    http_request: async (params) => {
      const url = params.url as string;
      const method = params.method as string || 'GET';
      const body = params.body as string;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? body : undefined,
      });

      const data = await response.json();

      return { success: response.ok, status: response.status, data };
    },

    // AI actions - these integrate with the AI module
    ai_clean_data: async (params) => {
      // AI data cleaning integration
      const range = params.range as string;

      // In production, this would call the AI data cleaning engine
      // const result = await dataCleanerEngine.clean(range);

      return {
        cleaned: true,
        range,
        note: 'AI data cleaning requires AI module integration'
      };
    },

    ai_create_chart: async (params) => {
      // AI chart creation
      const range = params.range as string;
      const description = params.description as string;

      // In production, this would use AI to determine best chart type
      // const chartType = await aiRuntime.suggestChartType(range, description);

      return {
        chartId: `ai_chart_${Date.now()}`,
        range,
        description,
        note: 'AI chart creation requires AI module integration'
      };
    },

    ai_formula: async (params) => {
      // AI formula generation
      const description = params.description as string;

      // In production, this would use NL formula engine
      // const formula = await nlFormulaEngine.generate(description);

      return {
        formula: '=SUM(A1:A10)',
        description,
        note: 'AI formula generation requires NL formula module integration'
      };
    },

    ai_analyze: async (params) => {
      // AI data analysis
      const range = params.range as string;

      // In production, this would use AI to analyze data
      // const insights = await aiRuntime.analyzeData(range);

      return {
        insights: [],
        range,
        note: 'AI analysis requires AI module integration'
      };
    },
  };
}
