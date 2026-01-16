// =============================================================================
// ERROR RECOVERY — Handle and recover from failures (Blueprint §5.7)
// =============================================================================

import type {
  ConversationError,
  ErrorType,
  RecoveryAction,
  RecoveryAttempt,
  TaskStep,
} from './types';

// -----------------------------------------------------------------------------
// Recovery Strategies
// -----------------------------------------------------------------------------

interface RecoveryStrategy {
  errorType: ErrorType;
  canRecover: boolean;
  suggestedAction: RecoveryAction;
  maxRetries: number;
  message: string;
}

const RECOVERY_STRATEGIES: Record<ErrorType, RecoveryStrategy> = {
  parse_error: {
    errorType: 'parse_error',
    canRecover: true,
    suggestedAction: 'ask_user',
    maxRetries: 2,
    message: "I didn't understand that. Could you rephrase?",
  },
  validation_error: {
    errorType: 'validation_error',
    canRecover: true,
    suggestedAction: 'modify',
    maxRetries: 2,
    message: 'Some values were invalid. Let me adjust.',
  },
  execution_error: {
    errorType: 'execution_error',
    canRecover: true,
    suggestedAction: 'retry',
    maxRetries: 3,
    message: 'The operation failed. Attempting to retry.',
  },
  permission_error: {
    errorType: 'permission_error',
    canRecover: false,
    suggestedAction: 'abort',
    maxRetries: 0,
    message: "You don't have permission to perform this action.",
  },
  timeout_error: {
    errorType: 'timeout_error',
    canRecover: true,
    suggestedAction: 'retry',
    maxRetries: 2,
    message: 'The operation timed out. Retrying...',
  },
  unknown_error: {
    errorType: 'unknown_error',
    canRecover: false,
    suggestedAction: 'ask_user',
    maxRetries: 1,
    message: 'An unexpected error occurred.',
  },
};

// -----------------------------------------------------------------------------
// Error Recovery Class
// -----------------------------------------------------------------------------

export class ErrorRecovery {
  private attempts: Map<string, RecoveryAttempt[]> = new Map();

  /**
   * Create an error from exception
   */
  createError(
    type: ErrorType,
    error: Error | string,
    stepId?: string
  ): ConversationError {
    const strategy = RECOVERY_STRATEGIES[type];
    const message = error instanceof Error ? error.message : error;

    return {
      id: crypto.randomUUID(),
      type,
      message,
      details: error instanceof Error ? error.stack : undefined,
      stepId,
      recoverable: strategy.canRecover,
      suggestedRecovery: strategy.suggestedAction,
      occurredAt: new Date(),
    };
  }

  /**
   * Get recovery options for an error
   */
  getRecoveryOptions(error: ConversationError): RecoveryAction[] {
    const options: RecoveryAction[] = [];

    if (!error.recoverable) {
      return ['abort'];
    }

    const strategy = RECOVERY_STRATEGIES[error.type];

    // Add suggested action first
    options.push(strategy.suggestedAction);

    // Add other applicable options
    if (strategy.suggestedAction !== 'retry') {
      options.push('retry');
    }
    if (strategy.suggestedAction !== 'skip' && error.stepId) {
      options.push('skip');
    }
    if (strategy.suggestedAction !== 'modify') {
      options.push('modify');
    }
    if (strategy.suggestedAction !== 'ask_user') {
      options.push('ask_user');
    }

    options.push('abort');

    return [...new Set(options)];
  }

  /**
   * Check if recovery is possible
   */
  canRecover(
    conversationId: string,
    error: ConversationError
  ): boolean {
    if (!error.recoverable) {
      return false;
    }

    const attempts = this.attempts.get(conversationId) || [];
    const errorAttempts = attempts.filter((a) => a.errorId === error.id);
    const strategy = RECOVERY_STRATEGIES[error.type];

    return errorAttempts.length < strategy.maxRetries;
  }

  /**
   * Record a recovery attempt
   */
  recordAttempt(
    conversationId: string,
    errorId: string,
    action: RecoveryAction,
    success: boolean,
    message?: string
  ): RecoveryAttempt {
    const attempt: RecoveryAttempt = {
      errorId,
      action,
      success,
      message,
      attemptedAt: new Date(),
    };

    const attempts = this.attempts.get(conversationId) || [];
    attempts.push(attempt);
    this.attempts.set(conversationId, attempts);

    return attempt;
  }

  /**
   * Get attempt count for an error
   */
  getAttemptCount(conversationId: string, errorId: string): number {
    const attempts = this.attempts.get(conversationId) || [];
    return attempts.filter((a) => a.errorId === errorId).length;
  }

  /**
   * Get recovery message for user
   */
  getRecoveryMessage(
    _error: ConversationError,
    action: RecoveryAction
  ): string {
    switch (action) {
      case 'retry':
        return 'Let me try that again...';
      case 'skip':
        return 'Skipping this step and continuing...';
      case 'modify':
        return 'Let me try a different approach...';
      case 'abort':
        return 'Cancelling the operation.';
      case 'ask_user':
        return 'I need your help to continue.';
    }
  }

  /**
   * Suggest fix for step failure
   */
  suggestFix(step: TaskStep, error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('not found')) {
      return 'The specified cells could not be found. Please verify the range.';
    }

    if (lowerError.includes('invalid')) {
      return 'The data format appears to be invalid. Please check the values.';
    }

    if (lowerError.includes('permission') || lowerError.includes('protected')) {
      return 'This area is protected. Please unprotect it first.';
    }

    if (lowerError.includes('timeout')) {
      return 'The operation took too long. Try with a smaller range.';
    }

    return `Step "${step.name}" failed. You can retry or skip this step.`;
  }

  /**
   * Determine if error is transient (might succeed on retry)
   */
  isTransient(error: ConversationError): boolean {
    const transientTypes: ErrorType[] = [
      'timeout_error',
      'execution_error',
    ];
    return transientTypes.includes(error.type);
  }

  /**
   * Get exponential backoff delay for retries
   */
  getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    // Add jitter
    return delay + Math.random() * 500;
  }

  /**
   * Clear attempts for a conversation
   */
  clearAttempts(conversationId: string): void {
    this.attempts.delete(conversationId);
  }

  /**
   * Get all attempts for a conversation
   */
  getAttempts(conversationId: string): RecoveryAttempt[] {
    return this.attempts.get(conversationId) || [];
  }

  /**
   * Format error for display
   */
  formatError(error: ConversationError): string {
    const strategy = RECOVERY_STRATEGIES[error.type];
    const lines: string[] = [];

    lines.push(`Error: ${error.message}`);
    lines.push('');
    lines.push(strategy.message);

    if (error.recoverable) {
      const options = this.getRecoveryOptions(error);
      lines.push('');
      lines.push('Options:');
      for (const option of options) {
        lines.push(`  - ${this.formatAction(option)}`);
      }
    }

    return lines.join('\n');
  }

  private formatAction(action: RecoveryAction): string {
    switch (action) {
      case 'retry':
        return 'Try again';
      case 'skip':
        return 'Skip this step';
      case 'modify':
        return 'Try different approach';
      case 'abort':
        return 'Cancel operation';
      case 'ask_user':
        return 'Ask for help';
    }
  }
}

// Export singleton
export const errorRecovery = new ErrorRecovery();
