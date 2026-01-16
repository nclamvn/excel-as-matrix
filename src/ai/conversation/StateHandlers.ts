// =============================================================================
// STATE HANDLERS — Handle logic for each state (Blueprint §5.6)
// =============================================================================

import type {
  ConversationState,
  ConversationContext,
  ParsedIntent,
  TaskPlan,
  ClarificationRequest,
} from './types';
import { ConversationStateMachine } from './StateMachine';

// -----------------------------------------------------------------------------
// State Handler Interface
// -----------------------------------------------------------------------------

export interface StateHandler {
  state: ConversationState;
  enter(context: ConversationContext, machine: ConversationStateMachine): Promise<void>;
  exit?(context: ConversationContext): void;
  canProceed(context: ConversationContext): boolean;
}

// -----------------------------------------------------------------------------
// Idle State Handler
// -----------------------------------------------------------------------------

export class IdleHandler implements StateHandler {
  state: ConversationState = 'idle';

  async enter(): Promise<void> {
    // Nothing to do in idle state
  }

  canProceed(): boolean {
    return true; // Always ready for input
  }
}

// -----------------------------------------------------------------------------
// Intent Gathering Handler
// -----------------------------------------------------------------------------

export class IntentGatheringHandler implements StateHandler {
  state: ConversationState = 'intent_gathering';

  async enter(
    context: ConversationContext,
    machine: ConversationStateMachine
  ): Promise<void> {
    // Parse the user's request
    const intent = await this.parseIntent(context.originalRequest, context);

    // Check if we gathered intent from clarifications
    if (context.clarificationHistory.length > 0) {
      // Enhance intent with clarification responses
      this.enhanceIntentWithClarifications(intent, context);
    }

    machine.setIntent(intent);
  }

  private async parseIntent(
    request: string,
    _context: ConversationContext
  ): Promise<ParsedIntent> {
    // Basic intent parsing (would be AI-powered in production)
    const lowerRequest = request.toLowerCase();

    // Detect action type
    let action = 'unknown';
    if (lowerRequest.includes('sum') || lowerRequest.includes('total')) {
      action = 'calculate_sum';
    } else if (lowerRequest.includes('average') || lowerRequest.includes('avg')) {
      action = 'calculate_average';
    } else if (lowerRequest.includes('format')) {
      action = 'format_cells';
    } else if (lowerRequest.includes('sort')) {
      action = 'sort_data';
    } else if (lowerRequest.includes('fill')) {
      action = 'fill_range';
    } else if (lowerRequest.includes('formula')) {
      action = 'write_formula';
    } else if (lowerRequest.includes('chart') || lowerRequest.includes('graph')) {
      action = 'create_chart';
    }

    // Detect ambiguities
    const ambiguities: string[] = [];
    if (!this.hasTargetReference(lowerRequest)) {
      ambiguities.push('target_cells');
    }

    return {
      action,
      parameters: {},
      confidence: action === 'unknown' ? 0.3 : 0.7,
      ambiguities,
      needsClarification: ambiguities.length > 0 || action === 'unknown',
    };
  }

  private hasTargetReference(request: string): boolean {
    // Check for cell references like A1, B2:C10, etc.
    const cellRefPattern = /[A-Z]+\d+/i;
    const rangePattern = /[A-Z]+\d+:[A-Z]+\d+/i;
    return cellRefPattern.test(request) || rangePattern.test(request);
  }

  private enhanceIntentWithClarifications(
    intent: ParsedIntent,
    context: ConversationContext
  ): void {
    for (const response of context.clarificationHistory) {
      switch (response.type) {
        case 'target_selection':
          intent.target = String(response.value);
          intent.ambiguities = intent.ambiguities.filter(
            (a) => a !== 'target_cells'
          );
          break;
        case 'parameter_value':
          intent.parameters[response.requestId] = response.value;
          break;
        case 'action_confirmation':
          if (response.value === true) {
            intent.confidence = Math.min(1, intent.confidence + 0.2);
          }
          break;
      }
    }

    // Recalculate needsClarification
    intent.needsClarification = intent.ambiguities.length > 0;
  }

  canProceed(context: ConversationContext): boolean {
    return context.originalRequest.length > 0;
  }
}

// -----------------------------------------------------------------------------
// Clarifying Handler
// -----------------------------------------------------------------------------

export class ClarifyingHandler implements StateHandler {
  state: ConversationState = 'clarifying';

  async enter(
    context: ConversationContext,
    machine: ConversationStateMachine
  ): Promise<void> {
    // Generate clarification question if not already pending
    if (!context.pendingClarification && context.parsedIntent) {
      const question = this.generateClarificationQuestion(context.parsedIntent);
      if (question) {
        machine.requestClarification(question);
      }
    }
  }

  private generateClarificationQuestion(
    intent: ParsedIntent
  ): ClarificationRequest | null {
    // Generate based on ambiguities
    const ambiguity = intent.ambiguities[0];

    if (ambiguity === 'target_cells') {
      return {
        id: crypto.randomUUID(),
        type: 'target_selection',
        question: 'Which cells would you like to apply this to?',
        context: `You asked to "${intent.action}" but didn\'t specify the target cells.`,
        options: [
          { id: 'selected', label: 'Selected cells', value: 'selected' },
          { id: 'column', label: 'Entire column', value: 'column' },
          { id: 'row', label: 'Entire row', value: 'row' },
          { id: 'range', label: 'Specify range', value: 'range' },
        ],
        allowFreeText: true,
        required: true,
      };
    }

    if (intent.action === 'unknown') {
      return {
        id: crypto.randomUUID(),
        type: 'ambiguity_resolution',
        question: "I'm not sure what you'd like to do. Can you clarify?",
        context: `Your request: "${intent.action}"`,
        options: [
          { id: 'formula', label: 'Write a formula', value: 'write_formula' },
          { id: 'format', label: 'Format cells', value: 'format_cells' },
          { id: 'calculate', label: 'Calculate values', value: 'calculate' },
          { id: 'other', label: 'Something else', value: 'other' },
        ],
        allowFreeText: true,
        required: true,
      };
    }

    return null;
  }

  canProceed(context: ConversationContext): boolean {
    return !context.pendingClarification;
  }
}

// -----------------------------------------------------------------------------
// Planning Handler
// -----------------------------------------------------------------------------

export class PlanningHandler implements StateHandler {
  state: ConversationState = 'planning';

  async enter(
    context: ConversationContext,
    machine: ConversationStateMachine
  ): Promise<void> {
    if (!context.parsedIntent) return;

    const plan = await this.createPlan(context.parsedIntent, context);
    machine.setPlan(plan);
  }

  private async createPlan(
    intent: ParsedIntent,
    _context: ConversationContext
  ): Promise<TaskPlan> {
    // Create task plan based on intent
    const steps = this.generateSteps(intent);

    return {
      id: crypto.randomUUID(),
      name: `Execute: ${intent.action}`,
      description: `Plan to ${intent.action}`,
      steps,
      estimatedComplexity: steps.length > 3 ? 'complex' : 'simple',
      createdAt: new Date(),
    };
  }

  private generateSteps(intent: ParsedIntent): TaskPlan['steps'] {
    const baseSteps: TaskPlan['steps'] = [
      {
        id: crypto.randomUUID(),
        index: 0,
        name: 'Validate Input',
        description: 'Check that all required data is available',
        action: 'validate',
        parameters: {},
        dependencies: [],
        status: 'pending',
        canRetry: true,
        optional: false,
      },
    ];

    // Add action-specific steps
    switch (intent.action) {
      case 'calculate_sum':
      case 'calculate_average':
        baseSteps.push({
          id: crypto.randomUUID(),
          index: 1,
          name: 'Read Source Data',
          description: 'Read values from source cells',
          action: 'read_range',
          parameters: { target: intent.target },
          dependencies: [baseSteps[0].id],
          status: 'pending',
          canRetry: true,
          optional: false,
        });
        baseSteps.push({
          id: crypto.randomUUID(),
          index: 2,
          name: 'Calculate Result',
          description: `Calculate ${intent.action}`,
          action: intent.action,
          parameters: {},
          dependencies: [baseSteps[1]?.id || ''],
          status: 'pending',
          canRetry: true,
          optional: false,
        });
        baseSteps.push({
          id: crypto.randomUUID(),
          index: 3,
          name: 'Write Result',
          description: 'Write result to target cell',
          action: 'write_cell',
          parameters: {},
          dependencies: [baseSteps[2]?.id || ''],
          status: 'pending',
          canRetry: true,
          optional: false,
        });
        break;

      default:
        baseSteps.push({
          id: crypto.randomUUID(),
          index: 1,
          name: 'Execute Action',
          description: `Execute ${intent.action}`,
          action: intent.action,
          parameters: intent.parameters,
          dependencies: [baseSteps[0].id],
          status: 'pending',
          canRetry: true,
          optional: false,
        });
    }

    return baseSteps;
  }

  canProceed(context: ConversationContext): boolean {
    return context.parsedIntent !== undefined;
  }
}

// -----------------------------------------------------------------------------
// Executing Handler
// -----------------------------------------------------------------------------

export class ExecutingHandler implements StateHandler {
  state: ConversationState = 'executing';

  async enter(
    context: ConversationContext,
    machine: ConversationStateMachine
  ): Promise<void> {
    const nextStep = machine.getNextStep();

    if (nextStep >= 0 && context.taskPlan) {
      machine.startStep(nextStep);

      try {
        // Execute the step (mock execution)
        const result = await this.executeStep(
          context.taskPlan.steps[nextStep],
          context
        );
        machine.completeStep(nextStep, result);
      } catch (error) {
        machine.failStep(
          nextStep,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } else {
      // No more steps, move to review
      machine.review();
    }
  }

  private async executeStep(
    step: TaskPlan['steps'][number],
    _context: ConversationContext
  ): Promise<unknown> {
    // Simulate step execution
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock results
    switch (step.action) {
      case 'validate':
        return { valid: true };
      case 'read_range':
        return { values: [[1, 2, 3], [4, 5, 6]] };
      case 'calculate_sum':
        return { result: 21 };
      case 'calculate_average':
        return { result: 3.5 };
      case 'write_cell':
        return { written: true };
      default:
        return { executed: true };
    }
  }

  canProceed(context: ConversationContext): boolean {
    return context.taskPlan !== undefined;
  }
}

// -----------------------------------------------------------------------------
// Reviewing Handler
// -----------------------------------------------------------------------------

export class ReviewingHandler implements StateHandler {
  state: ConversationState = 'reviewing';

  async enter(
    _context: ConversationContext,
    machine: ConversationStateMachine
  ): Promise<void> {
    // Check if approval is required
    const config = machine.getConfig();
    if (config.requireApprovalForChanges) {
      machine.requestApproval();
    } else {
      machine.approve();
    }
  }

  canProceed(context: ConversationContext): boolean {
    return context.executionResults.length > 0;
  }
}

// -----------------------------------------------------------------------------
// State Handler Registry
// -----------------------------------------------------------------------------

export const stateHandlers: Record<ConversationState, StateHandler> = {
  idle: new IdleHandler(),
  intent_gathering: new IntentGatheringHandler(),
  clarifying: new ClarifyingHandler(),
  planning: new PlanningHandler(),
  executing: new ExecutingHandler(),
  reviewing: new ReviewingHandler(),
  awaiting_approval: {
    state: 'awaiting_approval',
    enter: async () => {},
    canProceed: () => true,
  },
  complete: {
    state: 'complete',
    enter: async () => {},
    canProceed: () => false,
  },
  error: {
    state: 'error',
    enter: async () => {},
    canProceed: () => false,
  },
  cancelled: {
    state: 'cancelled',
    enter: async () => {},
    canProceed: () => false,
  },
};

/**
 * Get handler for a state
 */
export function getStateHandler(state: ConversationState): StateHandler {
  return stateHandlers[state];
}
