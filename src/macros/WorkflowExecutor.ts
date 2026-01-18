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
   * Action handlers
   */
  private actionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown>> = {
    // Data operations
    copy_range: async (_params) => {
      // TODO: Implement copy range action
      return { copied: true };
    },

    paste_range: async (_params) => {
      // TODO: Implement paste action
      return { pasted: true };
    },

    clear_range: async (_params) => {
      // TODO: Implement clear action
      return { cleared: true };
    },

    filter_data: async (_params) => {
      // TODO: Implement filter action
      return { filtered: true };
    },

    sort_data: async (_params) => {
      // TODO: Implement sort action
      return { sorted: true };
    },

    remove_duplicates: async (_params) => {
      // TODO: Implement remove duplicates action
      return { removed: true };
    },

    // Formulas
    apply_formula: async (_params) => {
      // TODO: Implement apply formula action
      return { applied: true };
    },

    // Format
    format_cells: async (_params) => {
      // TODO: Implement format cells action
      return { formatted: true };
    },

    // Charts
    create_chart: async (_params) => {
      // TODO: Implement create chart action
      return { chartId: `chart_${Date.now()}` };
    },

    // Export
    export_pdf: async (params) => {
      // TODO: Implement export PDF action
      return { exported: true, filename: params.filename };
    },

    export_excel: async (params) => {
      // TODO: Implement export Excel action
      return { exported: true, filename: params.filename };
    },

    export_csv: async (params) => {
      // TODO: Implement export CSV action
      return { exported: true, filename: params.filename };
    },

    // Notifications
    send_email: async (_params) => {
      // TODO: Implement send email action
      return { sent: true };
    },

    send_slack: async (_params) => {
      // TODO: Implement send Slack action
      return { sent: true };
    },

    show_notification: async (_params) => {
      // TODO: Implement notification action
      return { shown: true };
    },

    // AI actions
    ai_clean_data: async (_params) => {
      // TODO: Implement AI clean action
      return { cleaned: true };
    },

    ai_create_chart: async (_params) => {
      // TODO: Implement AI chart action
      return { chartId: `ai_chart_${Date.now()}` };
    },

    ai_formula: async (_params) => {
      // TODO: Implement AI formula action
      return { formula: '=SUM(A1:A10)' };
    },

    ai_analyze: async (_params) => {
      // TODO: Implement AI analyze action
      return { insights: [] };
    },
  };
}
