// =============================================================================
// TASK PLANNER — Break complex tasks into steps (Blueprint §5.6)
// =============================================================================

import type {
  TaskPlan,
  TaskStep,
  StepStatus,
  ParsedIntent,
} from './types';

// -----------------------------------------------------------------------------
// Task Templates
// -----------------------------------------------------------------------------

interface TaskTemplate {
  name: string;
  description: string;
  pattern: string[];
  steps: Omit<TaskStep, 'id' | 'index' | 'status'>[];
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: 'Calculate Sum',
    description: 'Sum values in a range',
    pattern: ['sum', 'total', 'add up'],
    steps: [
      {
        name: 'Identify source range',
        description: 'Determine which cells to sum',
        action: 'identify_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Read values',
        description: 'Read numeric values from range',
        action: 'read_values',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Calculate sum',
        description: 'Add all values together',
        action: 'calculate_sum',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Write result',
        description: 'Write sum to target cell',
        action: 'write_result',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
    ],
  },
  {
    name: 'Format Range',
    description: 'Apply formatting to cells',
    pattern: ['format', 'style', 'color'],
    steps: [
      {
        name: 'Identify target range',
        description: 'Determine which cells to format',
        action: 'identify_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Prepare format options',
        description: 'Build formatting configuration',
        action: 'prepare_format',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Apply formatting',
        description: 'Apply format to each cell',
        action: 'apply_format',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
    ],
  },
  {
    name: 'Sort Data',
    description: 'Sort data in a range',
    pattern: ['sort', 'order', 'arrange'],
    steps: [
      {
        name: 'Identify data range',
        description: 'Determine which cells to sort',
        action: 'identify_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Read current data',
        description: 'Read all values in range',
        action: 'read_values',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Sort data',
        description: 'Sort values by specified criteria',
        action: 'sort_values',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Write sorted data',
        description: 'Write sorted values back to range',
        action: 'write_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
    ],
  },
  {
    name: 'Fill Series',
    description: 'Fill cells with a series of values',
    pattern: ['fill', 'series', 'sequence'],
    steps: [
      {
        name: 'Identify target range',
        description: 'Determine cells to fill',
        action: 'identify_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Detect pattern',
        description: 'Determine the series pattern',
        action: 'detect_pattern',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: true,
      },
      {
        name: 'Generate series',
        description: 'Generate the series values',
        action: 'generate_series',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
      {
        name: 'Fill range',
        description: 'Write series values to range',
        action: 'write_range',
        parameters: {},
        dependencies: [],
        canRetry: true,
        optional: false,
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Task Planner Class
// -----------------------------------------------------------------------------

export class TaskPlanner {
  /**
   * Create a plan from parsed intent
   */
  createPlan(intent: ParsedIntent): TaskPlan {
    // Try to match a template
    const template = this.findTemplate(intent.action);

    if (template) {
      return this.createFromTemplate(template, intent);
    }

    // Create generic plan
    return this.createGenericPlan(intent);
  }

  /**
   * Find matching template
   */
  private findTemplate(action: string): TaskTemplate | undefined {
    const lowerAction = action.toLowerCase();

    return TASK_TEMPLATES.find((template) =>
      template.pattern.some((pattern) => lowerAction.includes(pattern))
    );
  }

  /**
   * Create plan from template
   */
  private createFromTemplate(
    template: TaskTemplate,
    intent: ParsedIntent
  ): TaskPlan {
    const steps: TaskStep[] = template.steps.map((step, index) => ({
      ...step,
      id: crypto.randomUUID(),
      index,
      status: 'pending' as StepStatus,
      parameters: {
        ...step.parameters,
        ...intent.parameters,
        target: intent.target,
      },
    }));

    // Set up dependencies
    for (let i = 1; i < steps.length; i++) {
      steps[i].dependencies = [steps[i - 1].id];
    }

    return {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      steps,
      estimatedComplexity: this.estimateComplexity(steps),
      createdAt: new Date(),
    };
  }

  /**
   * Create generic plan for unknown tasks
   */
  private createGenericPlan(intent: ParsedIntent): TaskPlan {
    const validateStep: TaskStep = {
      id: crypto.randomUUID(),
      index: 0,
      name: 'Validate Request',
      description: 'Verify all required information is available',
      action: 'validate',
      parameters: intent.parameters,
      dependencies: [],
      status: 'pending',
      canRetry: true,
      optional: false,
    };

    const executeStep: TaskStep = {
      id: crypto.randomUUID(),
      index: 1,
      name: `Execute: ${intent.action}`,
      description: `Perform ${intent.action} operation`,
      action: intent.action,
      parameters: {
        ...intent.parameters,
        target: intent.target,
      },
      dependencies: [validateStep.id],
      status: 'pending',
      canRetry: true,
      optional: false,
    };

    const verifyStep: TaskStep = {
      id: crypto.randomUUID(),
      index: 2,
      name: 'Verify Result',
      description: 'Check that the operation completed successfully',
      action: 'verify',
      parameters: {},
      dependencies: [executeStep.id],
      status: 'pending',
      canRetry: false,
      optional: true,
    };

    return {
      id: crypto.randomUUID(),
      name: `Task: ${intent.action}`,
      description: `Execute ${intent.action} operation`,
      steps: [validateStep, executeStep, verifyStep],
      estimatedComplexity: 'simple',
      createdAt: new Date(),
    };
  }

  /**
   * Estimate task complexity
   */
  private estimateComplexity(
    steps: TaskStep[]
  ): 'simple' | 'medium' | 'complex' {
    const requiredSteps = steps.filter((s) => !s.optional).length;

    if (requiredSteps <= 2) return 'simple';
    if (requiredSteps <= 4) return 'medium';
    return 'complex';
  }

  /**
   * Merge two plans
   */
  mergePlans(plan1: TaskPlan, plan2: TaskPlan): TaskPlan {
    const mergedSteps = [...plan1.steps];

    // Reindex and append plan2 steps
    const lastIndex = mergedSteps.length;
    const lastStepId = mergedSteps[mergedSteps.length - 1]?.id;

    for (const step of plan2.steps) {
      const newStep: TaskStep = {
        ...step,
        id: crypto.randomUUID(),
        index: lastIndex + step.index,
        dependencies:
          step.index === 0 && lastStepId
            ? [lastStepId]
            : step.dependencies,
      };
      mergedSteps.push(newStep);
    }

    return {
      id: crypto.randomUUID(),
      name: `${plan1.name} + ${plan2.name}`,
      description: `Combined task: ${plan1.description} then ${plan2.description}`,
      steps: mergedSteps,
      estimatedComplexity: this.estimateComplexity(mergedSteps),
      createdAt: new Date(),
    };
  }

  /**
   * Add step to existing plan
   */
  addStep(plan: TaskPlan, step: Omit<TaskStep, 'id' | 'index'>): TaskPlan {
    const newStep: TaskStep = {
      ...step,
      id: crypto.randomUUID(),
      index: plan.steps.length,
      status: 'pending',
    };

    return {
      ...plan,
      steps: [...plan.steps, newStep],
      estimatedComplexity: this.estimateComplexity([...plan.steps, newStep]),
    };
  }

  /**
   * Remove step from plan
   */
  removeStep(plan: TaskPlan, stepId: string): TaskPlan {
    const steps = plan.steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, index: i }));

    // Update dependencies
    for (const step of steps) {
      step.dependencies = step.dependencies.filter((d) => d !== stepId);
    }

    return {
      ...plan,
      steps,
      estimatedComplexity: this.estimateComplexity(steps),
    };
  }

  /**
   * Get plan summary
   */
  getPlanSummary(plan: TaskPlan): string {
    const lines: string[] = [
      `Plan: ${plan.name}`,
      `Description: ${plan.description}`,
      `Complexity: ${plan.estimatedComplexity}`,
      `Steps: ${plan.steps.length}`,
      '',
    ];

    for (const step of plan.steps) {
      const status = step.status === 'pending' ? '○' : step.status === 'completed' ? '✓' : '×';
      const optional = step.optional ? ' (optional)' : '';
      lines.push(`  ${status} ${step.index + 1}. ${step.name}${optional}`);
    }

    return lines.join('\n');
  }
}

// Export singleton
export const taskPlanner = new TaskPlanner();
