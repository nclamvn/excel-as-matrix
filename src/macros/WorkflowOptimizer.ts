// =============================================================================
// WORKFLOW OPTIMIZER — Optimize workflows for better performance
// =============================================================================

import type {
  Workflow,
  WorkflowStep,
  OptimizationSuggestion,
  ActionType,
} from './types';

/**
 * Optimize workflows
 */
export class WorkflowOptimizer {
  /**
   * Optimize a workflow
   */
  optimize(workflow: Workflow): Workflow {
    let optimized = { ...workflow, steps: [...workflow.steps] };

    // Apply optimizations
    optimized = this.mergeConsecutiveActions(optimized);
    optimized = this.removeRedundantSteps(optimized);
    optimized = this.reorderForEfficiency(optimized);
    optimized = this.parallelizeIndependentSteps(optimized);

    return optimized;
  }

  /**
   * Get optimization suggestions without applying
   */
  getSuggestions(workflow: Workflow): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check for mergeable actions
    const mergeables = this.findMergeableActions(workflow);
    for (const group of mergeables) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'merge',
        description: `Merge ${group.length} consecutive ${group[0].action.type} actions`,
        descriptionVi: `Gộp ${group.length} hành động ${group[0].action.type} liên tiếp`,
        impact: 'medium',
        affectedSteps: group.map(s => s.id),
      });
    }

    // Check for parallelizable steps
    const parallelizable = this.findParallelizableSteps(workflow);
    if (parallelizable.length >= 2) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'parallelize',
        description: `Run ${parallelizable.length} independent steps in parallel`,
        descriptionVi: `Chạy ${parallelizable.length} bước độc lập song song`,
        impact: 'high',
        affectedSteps: parallelizable.map(s => s.id),
      });
    }

    // Check for redundant steps
    const redundant = this.findRedundantSteps(workflow);
    for (const step of redundant) {
      suggestions.push({
        id: crypto.randomUUID(),
        type: 'simplify',
        description: `Remove redundant step: ${step.label || step.action.type}`,
        descriptionVi: `Xóa bước thừa: ${step.label || step.action.type}`,
        impact: 'low',
        affectedSteps: [step.id],
      });
    }

    // Check for inefficient ordering
    const reordering = this.findReorderingSuggestions(workflow);
    for (const suggestion of reordering) {
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * Apply a specific suggestion
   */
  applySuggestion(workflow: Workflow, suggestionId: string): Workflow {
    const suggestions = this.getSuggestions(workflow);
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return workflow;

    switch (suggestion.type) {
      case 'merge':
        return this.applyMerge(workflow, suggestion.affectedSteps);
      case 'parallelize':
        return this.applyParallelize(workflow, suggestion.affectedSteps);
      case 'simplify':
        return this.applySimplify(workflow, suggestion.affectedSteps);
      case 'reorder':
        return this.applyReorder(workflow, suggestion.affectedSteps);
      default:
        return workflow;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZATION STRATEGIES
  // ═══════════════════════════════════════════════════════════════

  private mergeConsecutiveActions(workflow: Workflow): Workflow {
    const mergeableTypes: ActionType[] = ['format_cells', 'copy_range'];
    const newSteps: WorkflowStep[] = [];
    let i = 0;

    while (i < workflow.steps.length) {
      const step = workflow.steps[i];

      if (mergeableTypes.includes(step.action.type)) {
        // Look ahead for consecutive same actions
        const group = [step];
        let j = i + 1;

        while (j < workflow.steps.length &&
               workflow.steps[j].action.type === step.action.type) {
          group.push(workflow.steps[j]);
          j++;
        }

        if (group.length > 1) {
          // Merge into single step
          const merged = this.mergeSteps(group);
          newSteps.push(merged);
          i = j;
          continue;
        }
      }

      newSteps.push(step);
      i++;
    }

    return { ...workflow, steps: newSteps };
  }

  private removeRedundantSteps(workflow: Workflow): Workflow {
    const newSteps: WorkflowStep[] = [];
    const seenActions = new Set<string>();

    for (const step of workflow.steps) {
      const key = `${step.action.type}-${JSON.stringify(step.action.params)}`;

      // Skip duplicate actions on same range
      if (!seenActions.has(key)) {
        newSteps.push(step);
        seenActions.add(key);
      }
    }

    return { ...workflow, steps: newSteps };
  }

  private reorderForEfficiency(workflow: Workflow): Workflow {
    // Priority order: data ops → formulas → formatting → charts → exports → notifications
    const priority: Record<string, number> = {
      copy_range: 1,
      paste_range: 1,
      clear_range: 1,
      filter_data: 2,
      sort_data: 2,
      remove_duplicates: 2,
      apply_formula: 3,
      fill_formula: 3,
      recalculate: 3,
      format_cells: 4,
      conditional_format: 4,
      create_chart: 5,
      update_chart: 5,
      export_pdf: 6,
      export_excel: 6,
      export_csv: 6,
      send_email: 7,
      show_notification: 7,
    };

    const steps = [...workflow.steps];

    // Only reorder if there are no dependencies between steps
    const canReorder = !this.hasStepDependencies(steps);

    if (canReorder) {
      steps.sort((a, b) => {
        const priorityA = priority[a.action.type] || 99;
        const priorityB = priority[b.action.type] || 99;
        return priorityA - priorityB;
      });

      // Update order numbers
      steps.forEach((step, i) => {
        step.order = i + 1;
      });
    }

    return { ...workflow, steps };
  }

  private parallelizeIndependentSteps(workflow: Workflow): Workflow {
    // Find groups of independent steps that can run in parallel
    const parallelGroups = this.findParallelGroups(workflow.steps);

    if (parallelGroups.length === 0) {
      return workflow;
    }

    // For now, just mark them - actual parallel execution handled by executor
    return workflow;
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYSIS HELPERS
  // ═══════════════════════════════════════════════════════════════

  private findMergeableActions(workflow: Workflow): WorkflowStep[][] {
    const mergeableTypes: ActionType[] = ['format_cells', 'copy_range'];
    const groups: WorkflowStep[][] = [];
    let i = 0;

    while (i < workflow.steps.length) {
      const step = workflow.steps[i];

      if (mergeableTypes.includes(step.action.type)) {
        const group = [step];
        let j = i + 1;

        while (j < workflow.steps.length &&
               workflow.steps[j].action.type === step.action.type) {
          group.push(workflow.steps[j]);
          j++;
        }

        if (group.length > 1) {
          groups.push(group);
        }
        i = j;
      } else {
        i++;
      }
    }

    return groups;
  }

  private findParallelizableSteps(workflow: Workflow): WorkflowStep[] {
    // Steps that don't depend on each other
    const independentTypes: ActionType[] = [
      'send_email',
      'send_slack',
      'show_notification',
      'export_pdf',
      'export_excel',
      'export_csv',
    ];

    return workflow.steps.filter(step =>
      independentTypes.includes(step.action.type)
    );
  }

  private findRedundantSteps(workflow: Workflow): WorkflowStep[] {
    const redundant: WorkflowStep[] = [];
    const seen = new Map<string, WorkflowStep>();

    for (const step of workflow.steps) {
      const key = `${step.action.type}-${JSON.stringify(step.action.params)}`;

      if (seen.has(key)) {
        redundant.push(step);
      } else {
        seen.set(key, step);
      }
    }

    return redundant;
  }

  private findReorderingSuggestions(workflow: Workflow): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check if exports come before data operations
    let hasExport = false;
    for (const step of workflow.steps) {
      if (['export_pdf', 'export_excel', 'export_csv'].includes(step.action.type)) {
        hasExport = true;
      }

      if (hasExport && ['filter_data', 'sort_data', 'apply_formula'].includes(step.action.type)) {
        suggestions.push({
          id: crypto.randomUUID(),
          type: 'reorder',
          description: 'Data operations should come before exports',
          descriptionVi: 'Thao tác dữ liệu nên đặt trước xuất file',
          impact: 'high',
          affectedSteps: workflow.steps.map(s => s.id),
        });
        break;
      }
    }

    return suggestions;
  }

  private findParallelGroups(steps: WorkflowStep[]): WorkflowStep[][] {
    // Simple heuristic: export and notification steps can be parallel
    const exportSteps = steps.filter(s =>
      ['export_pdf', 'export_excel', 'export_csv', 'send_email', 'show_notification'].includes(s.action.type)
    );

    return exportSteps.length >= 2 ? [exportSteps] : [];
  }

  private hasStepDependencies(steps: WorkflowStep[]): boolean {
    // Check if any step uses output from another
    for (const step of steps) {
      if (step.action.inputMapping?.some(m => m.source === 'variable')) {
        return true;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // APPLY HELPERS
  // ═══════════════════════════════════════════════════════════════

  private mergeSteps(steps: WorkflowStep[]): WorkflowStep {
    const first = steps[0];
    const ranges = steps.map(s => s.action.params.range).filter(Boolean);

    return {
      ...first,
      id: crypto.randomUUID(),
      label: `${first.label || first.action.type} (×${steps.length})`,
      action: {
        ...first.action,
        id: crypto.randomUUID(),
        params: {
          ...first.action.params,
          ranges: ranges.length > 1 ? ranges : undefined,
        },
      },
    };
  }

  private applyMerge(workflow: Workflow, stepIds: string[]): Workflow {
    const stepsToMerge = workflow.steps.filter(s => stepIds.includes(s.id));
    const otherSteps = workflow.steps.filter(s => !stepIds.includes(s.id));

    if (stepsToMerge.length < 2) return workflow;

    const merged = this.mergeSteps(stepsToMerge);
    const insertIndex = workflow.steps.findIndex(s => s.id === stepIds[0]);

    const newSteps = [...otherSteps];
    newSteps.splice(insertIndex, 0, merged);

    // Renumber
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });

    return { ...workflow, steps: newSteps };
  }

  private applyParallelize(workflow: Workflow, stepIds: string[]): Workflow {
    // Create a parallel step containing the selected steps
    const parallelSteps = workflow.steps.filter(s => stepIds.includes(s.id));
    const otherSteps = workflow.steps.filter(s => !stepIds.includes(s.id));

    const parallelStep: WorkflowStep = {
      id: crypto.randomUUID(),
      order: 1,
      type: 'parallel',
      action: {
        id: crypto.randomUUID(),
        type: 'copy_range', // Placeholder, parallel handles internally
        params: {},
      },
      branches: [{
        id: crypto.randomUUID(),
        name: 'Parallel Execution',
        condition: { type: 'value', operator: 'equals', rightOperand: true },
        steps: parallelSteps,
      }],
      enabled: true,
      label: `Parallel (${parallelSteps.length} steps)`,
    };

    const insertIndex = workflow.steps.findIndex(s => s.id === stepIds[0]);
    const newSteps = [...otherSteps];
    newSteps.splice(insertIndex, 0, parallelStep);

    // Renumber
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });

    return { ...workflow, steps: newSteps };
  }

  private applySimplify(workflow: Workflow, stepIds: string[]): Workflow {
    const newSteps = workflow.steps.filter(s => !stepIds.includes(s.id));

    // Renumber
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });

    return { ...workflow, steps: newSteps };
  }

  private applyReorder(workflow: Workflow, _stepIds: string[]): Workflow {
    return this.reorderForEfficiency(workflow);
  }
}
