// =============================================================================
// STATE MACHINE — Multi-turn conversation orchestrator (Blueprint §5.6)
// =============================================================================

import type {
  ConversationState,
  ConversationContext,
  ConversationEvent,
  ConversationEventType,
  ConversationConfig,
  ParsedIntent,
  TaskPlan,
  ClarificationRequest,
  ClarificationResponse,
  UserFeedback,
  ConversationError,
  RecoveryAction,
} from './types';
import { loggers } from '@/utils/logger';
import { STATE_TRANSITIONS, DEFAULT_CONVERSATION_CONFIG } from './types';

// -----------------------------------------------------------------------------
// State Machine Class
// -----------------------------------------------------------------------------

export class ConversationStateMachine {
  private context: ConversationContext;
  private config: ConversationConfig;
  private eventListeners: ((event: ConversationEvent) => void)[] = [];

  constructor(config: Partial<ConversationConfig> = {}) {
    this.config = { ...DEFAULT_CONVERSATION_CONFIG, ...config };
    this.context = this.createInitialContext();
  }

  // ---------------------------------------------------------------------------
  // Context Management
  // ---------------------------------------------------------------------------

  private createInitialContext(): ConversationContext {
    return {
      id: crypto.randomUUID(),
      state: 'idle',
      startedAt: new Date(),
      updatedAt: new Date(),
      originalRequest: '',
      currentStepIndex: 0,
      clarificationHistory: [],
      executionResults: [],
      recoveryAttempts: 0,
      metadata: {},
    };
  }

  /**
   * Get current context
   */
  getContext(): ConversationContext {
    return { ...this.context };
  }

  /**
   * Get current state
   */
  getState(): ConversationState {
    return this.context.state;
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.context = this.createInitialContext();
    this.emitEvent('state_changed', {
      previousState: undefined,
      newState: 'idle',
    });
  }

  // ---------------------------------------------------------------------------
  // State Transitions
  // ---------------------------------------------------------------------------

  /**
   * Check if a transition is valid
   */
  canTransition(toState: ConversationState): boolean {
    const validTransitions = STATE_TRANSITIONS[this.context.state];
    return validTransitions.includes(toState);
  }

  /**
   * Transition to a new state
   */
  transition(toState: ConversationState, data?: Record<string, unknown>): boolean {
    if (!this.canTransition(toState)) {
      loggers.ai.warn(
        `Invalid state transition: ${this.context.state} -> ${toState}`
      );
      return false;
    }

    const previousState = this.context.state;
    this.context.state = toState;
    this.context.updatedAt = new Date();

    this.emitEvent('state_changed', {
      previousState,
      newState: toState,
      data,
    });

    return true;
  }

  // ---------------------------------------------------------------------------
  // Conversation Flow
  // ---------------------------------------------------------------------------

  /**
   * Start a new conversation with user request
   */
  start(request: string): void {
    this.context = this.createInitialContext();
    this.context.originalRequest = request;
    this.transition('intent_gathering');
  }

  /**
   * Set parsed intent
   */
  setIntent(intent: ParsedIntent): void {
    this.context.parsedIntent = intent;
    this.context.updatedAt = new Date();

    if (intent.needsClarification) {
      this.transition('clarifying');
    } else if (this.needsPlanning(intent)) {
      this.transition('planning');
    } else {
      this.transition('executing');
    }
  }

  /**
   * Set task plan
   */
  setPlan(plan: TaskPlan): void {
    this.context.taskPlan = plan;
    this.context.currentStepIndex = 0;
    this.context.updatedAt = new Date();
    this.transition('executing');
  }

  /**
   * Request clarification from user
   */
  requestClarification(request: ClarificationRequest): void {
    this.context.pendingClarification = request;
    this.context.updatedAt = new Date();

    if (this.context.state !== 'clarifying') {
      this.transition('clarifying');
    }

    this.emitEvent('clarification_requested', { data: { request } });
  }

  /**
   * Receive clarification response
   */
  receiveClarification(response: ClarificationResponse): void {
    this.context.clarificationHistory.push(response);
    this.context.pendingClarification = undefined;
    this.context.updatedAt = new Date();

    this.emitEvent('clarification_received', { data: { response } });

    // Return to intent gathering to re-evaluate
    this.transition('intent_gathering');
  }

  /**
   * Start executing a step
   */
  startStep(stepIndex: number): void {
    this.context.currentStepIndex = stepIndex;
    this.context.updatedAt = new Date();

    if (this.context.taskPlan) {
      const step = this.context.taskPlan.steps[stepIndex];
      if (step) {
        step.status = 'running';
        this.emitEvent('step_started', { data: { stepId: step.id, stepIndex } });
      }
    }
  }

  /**
   * Complete a step successfully
   */
  completeStep(stepIndex: number, result: unknown): void {
    if (!this.context.taskPlan) return;

    const step = this.context.taskPlan.steps[stepIndex];
    if (!step) return;

    step.status = 'completed';
    this.context.executionResults.push({
      stepId: step.id,
      status: 'completed',
      result,
      startedAt: new Date(),
      completedAt: new Date(),
      retryCount: 0,
    });
    this.context.updatedAt = new Date();

    this.emitEvent('step_completed', { data: { stepId: step.id, stepIndex, result } });

    // Check if all steps complete
    const allComplete = this.context.taskPlan.steps.every(
      (s) => s.status === 'completed' || s.status === 'skipped'
    );

    if (allComplete) {
      this.transition('reviewing');
    }
  }

  /**
   * Mark a step as failed
   */
  failStep(stepIndex: number, error: string): void {
    if (!this.context.taskPlan) return;

    const step = this.context.taskPlan.steps[stepIndex];
    if (!step) return;

    step.status = 'failed';
    this.context.executionResults.push({
      stepId: step.id,
      status: 'failed',
      error,
      startedAt: new Date(),
      completedAt: new Date(),
      retryCount: 0,
    });
    this.context.updatedAt = new Date();

    this.emitEvent('step_failed', { data: { stepId: step.id, stepIndex, error } });

    // Set error and transition
    this.setError({
      id: crypto.randomUUID(),
      type: 'execution_error',
      message: `Step "${step.name}" failed: ${error}`,
      stepId: step.id,
      recoverable: step.canRetry,
      suggestedRecovery: step.canRetry ? 'retry' : 'skip',
      occurredAt: new Date(),
    });
  }

  /**
   * Set an error
   */
  setError(error: ConversationError): void {
    this.context.lastError = error;
    this.context.updatedAt = new Date();
    this.transition('error');
    this.emitEvent('error_occurred', { data: { error } });
  }

  /**
   * Attempt recovery from error
   */
  attemptRecovery(action: RecoveryAction): boolean {
    this.context.recoveryAttempts++;
    this.context.updatedAt = new Date();

    if (this.context.recoveryAttempts > this.config.maxRecoveryAttempts) {
      return false;
    }

    this.emitEvent('recovery_attempted', { data: { action } });

    switch (action) {
      case 'retry':
        return this.transition('executing');
      case 'skip':
        if (this.context.taskPlan && this.context.currentStepIndex >= 0) {
          const step = this.context.taskPlan.steps[this.context.currentStepIndex];
          if (step) {
            step.status = 'skipped';
          }
        }
        return this.transition('executing');
      case 'modify':
        return this.transition('planning');
      case 'abort':
        return this.transition('cancelled');
      case 'ask_user':
        return this.transition('clarifying');
      default:
        return false;
    }
  }

  /**
   * Move to review state
   */
  review(): void {
    this.transition('reviewing');
  }

  /**
   * Request approval
   */
  requestApproval(): void {
    this.transition('awaiting_approval');
  }

  /**
   * Approve and complete
   */
  approve(): void {
    this.transition('complete');
    this.emitEvent('conversation_complete', { data: { success: true } });
  }

  /**
   * Cancel conversation
   */
  cancel(): void {
    this.transition('cancelled');
    this.emitEvent('conversation_cancelled', {});
  }

  /**
   * Receive user feedback
   */
  receiveFeedback(feedback: UserFeedback): void {
    this.context.feedback = feedback;
    this.context.updatedAt = new Date();
    this.emitEvent('feedback_received', { data: { feedback } });
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private needsPlanning(intent: ParsedIntent): boolean {
    // Complex intents need planning
    const complexActions = ['batch_update', 'complex_formula', 'multi_step'];
    return (
      complexActions.some((a) => intent.action.includes(a)) ||
      intent.confidence < 0.7
    );
  }

  /**
   * Get next step to execute
   */
  getNextStep(): number {
    if (!this.context.taskPlan) return -1;

    return this.context.taskPlan.steps.findIndex(
      (step) => step.status === 'pending'
    );
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.context.taskPlan) return 0;

    const completed = this.context.taskPlan.steps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length;

    return Math.round((completed / this.context.taskPlan.steps.length) * 100);
  }

  /**
   * Check if conversation is in a terminal state
   */
  isTerminal(): boolean {
    return ['complete', 'cancelled'].includes(this.context.state);
  }

  /**
   * Check if conversation can be cancelled
   */
  canCancel(): boolean {
    return !this.isTerminal() && this.context.state !== 'idle';
  }

  // ---------------------------------------------------------------------------
  // Event Handling
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to events
   */
  onEvent(listener: (event: ConversationEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(
    type: ConversationEventType,
    data: Partial<ConversationEvent>
  ): void {
    const event: ConversationEvent = {
      type,
      conversationId: this.context.id,
      timestamp: new Date(),
      ...data,
    };

    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        loggers.ai.error('Event listener error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConversationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ConversationConfig {
    return { ...this.config };
  }
}

// Export singleton
export const conversationStateMachine = new ConversationStateMachine();
