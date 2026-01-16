// =============================================================================
// CLARIFICATION ENGINE — Generate clarifying questions (Blueprint §5.6)
// =============================================================================

import type {
  ClarificationRequest,
  ClarificationResponse,
  ClarificationType,
  ClarificationOption,
  ParsedIntent,
} from './types';

// -----------------------------------------------------------------------------
// Question Templates
// -----------------------------------------------------------------------------

interface QuestionTemplate {
  type: ClarificationType;
  question: string;
  contextTemplate: string;
  options?: ClarificationOption[];
  allowFreeText: boolean;
  required: boolean;
}

const QUESTION_TEMPLATES: Record<ClarificationType, QuestionTemplate> = {
  target_selection: {
    type: 'target_selection',
    question: 'Which cells should I apply this to?',
    contextTemplate: 'You asked to {action} but didn\'t specify the target cells.',
    options: [
      { id: 'selected', label: 'Currently selected cells', value: 'selected' },
      { id: 'column', label: 'Entire column', value: 'column' },
      { id: 'row', label: 'Entire row', value: 'row' },
      { id: 'range', label: 'Let me specify a range...', value: 'range' },
    ],
    allowFreeText: true,
    required: true,
  },
  action_confirmation: {
    type: 'action_confirmation',
    question: 'Is this what you want me to do?',
    contextTemplate: 'I understood: {action}. Please confirm this is correct.',
    options: [
      { id: 'yes', label: 'Yes, that\'s correct', value: true },
      { id: 'no', label: 'No, let me clarify', value: false },
    ],
    allowFreeText: true,
    required: true,
  },
  parameter_value: {
    type: 'parameter_value',
    question: 'What value should I use?',
    contextTemplate: 'For {action}, I need to know: {parameter}',
    allowFreeText: true,
    required: true,
  },
  ambiguity_resolution: {
    type: 'ambiguity_resolution',
    question: 'Which option did you mean?',
    contextTemplate: 'Your request "{request}" could mean different things.',
    allowFreeText: true,
    required: true,
  },
  scope_definition: {
    type: 'scope_definition',
    question: 'How much data should I include?',
    contextTemplate: 'For {action}, I need to know the scope.',
    options: [
      { id: 'visible', label: 'Only visible cells', value: 'visible' },
      { id: 'all', label: 'All cells including hidden', value: 'all' },
      { id: 'filtered', label: 'Only filtered results', value: 'filtered' },
    ],
    allowFreeText: false,
    required: true,
  },
  format_preference: {
    type: 'format_preference',
    question: 'How should I format the result?',
    contextTemplate: 'The result of {action} can be displayed in different ways.',
    options: [
      { id: 'number', label: 'As a number', value: 'number' },
      { id: 'currency', label: 'As currency', value: 'currency' },
      { id: 'percentage', label: 'As percentage', value: 'percentage' },
      { id: 'text', label: 'As text', value: 'text' },
    ],
    allowFreeText: false,
    required: false,
  },
};

// -----------------------------------------------------------------------------
// Clarification Engine Class
// -----------------------------------------------------------------------------

export class ClarificationEngine {
  private history: Map<string, ClarificationResponse[]> = new Map();

  /**
   * Generate clarification questions for an intent
   */
  generateQuestions(intent: ParsedIntent): ClarificationRequest[] {
    const questions: ClarificationRequest[] = [];

    // Check for missing target
    if (!intent.target) {
      questions.push(
        this.createQuestion('target_selection', {
          action: intent.action,
        })
      );
    }

    // Check for unknown action
    if (intent.action === 'unknown' || intent.confidence < 0.5) {
      questions.push(
        this.createQuestion('ambiguity_resolution', {
          request: intent.action,
        })
      );
    }

    // Low confidence needs confirmation
    if (intent.confidence >= 0.5 && intent.confidence < 0.8) {
      questions.push(
        this.createQuestion('action_confirmation', {
          action: this.formatAction(intent.action),
        })
      );
    }

    return questions;
  }

  /**
   * Generate a single question for a specific type
   */
  generateQuestion(
    type: ClarificationType,
    context: Record<string, string>
  ): ClarificationRequest {
    return this.createQuestion(type, context);
  }

  /**
   * Create a question from template
   */
  private createQuestion(
    type: ClarificationType,
    context: Record<string, string>
  ): ClarificationRequest {
    const template = QUESTION_TEMPLATES[type];

    // Replace context placeholders
    let contextStr = template.contextTemplate;
    for (const [key, value] of Object.entries(context)) {
      contextStr = contextStr.replace(`{${key}}`, value);
    }

    return {
      id: crypto.randomUUID(),
      type,
      question: template.question,
      context: contextStr,
      options: template.options,
      allowFreeText: template.allowFreeText,
      required: template.required,
    };
  }

  /**
   * Create custom question
   */
  createCustomQuestion(params: {
    type: ClarificationType;
    question: string;
    context: string;
    options?: ClarificationOption[];
    allowFreeText?: boolean;
    required?: boolean;
  }): ClarificationRequest {
    return {
      id: crypto.randomUUID(),
      type: params.type,
      question: params.question,
      context: params.context,
      options: params.options,
      allowFreeText: params.allowFreeText ?? true,
      required: params.required ?? true,
    };
  }

  /**
   * Process clarification response
   */
  processResponse(
    conversationId: string,
    request: ClarificationRequest,
    response: {
      selectedOptionId?: string;
      freeTextResponse?: string;
    }
  ): ClarificationResponse {
    // Determine value
    let value: unknown;

    if (response.selectedOptionId && request.options) {
      const option = request.options.find(
        (o) => o.id === response.selectedOptionId
      );
      value = option?.value ?? response.freeTextResponse;
    } else {
      value = response.freeTextResponse;
    }

    const clarificationResponse: ClarificationResponse = {
      requestId: request.id,
      type: request.type,
      selectedOptionId: response.selectedOptionId,
      freeTextResponse: response.freeTextResponse,
      value,
      respondedAt: new Date(),
    };

    // Store in history
    const history = this.history.get(conversationId) || [];
    history.push(clarificationResponse);
    this.history.set(conversationId, history);

    return clarificationResponse;
  }

  /**
   * Get clarification history for a conversation
   */
  getHistory(conversationId: string): ClarificationResponse[] {
    return this.history.get(conversationId) || [];
  }

  /**
   * Check if question was already asked
   */
  wasQuestionAsked(
    conversationId: string,
    type: ClarificationType
  ): boolean {
    const history = this.history.get(conversationId) || [];
    return history.some((r) => r.type === type);
  }

  /**
   * Get response for a specific type
   */
  getResponse(
    conversationId: string,
    type: ClarificationType
  ): ClarificationResponse | undefined {
    const history = this.history.get(conversationId) || [];
    return history.find((r) => r.type === type);
  }

  /**
   * Clear history for a conversation
   */
  clearHistory(conversationId: string): void {
    this.history.delete(conversationId);
  }

  /**
   * Format action for display
   */
  private formatAction(action: string): string {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Validate response
   */
  validateResponse(
    request: ClarificationRequest,
    response: { selectedOptionId?: string; freeTextResponse?: string }
  ): { valid: boolean; error?: string } {
    // Required check
    if (request.required) {
      if (!response.selectedOptionId && !response.freeTextResponse) {
        return { valid: false, error: 'This question requires an answer' };
      }
    }

    // Option validation
    if (response.selectedOptionId && request.options) {
      const validOption = request.options.some(
        (o) => o.id === response.selectedOptionId
      );
      if (!validOption) {
        return { valid: false, error: 'Invalid option selected' };
      }
    }

    // Free text validation when not allowed
    if (response.freeTextResponse && !request.allowFreeText) {
      if (!response.selectedOptionId) {
        return {
          valid: false,
          error: 'Please select one of the provided options',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get question suggestions based on conversation context
   */
  getSuggestions(intent: ParsedIntent): string[] {
    const suggestions: string[] = [];

    if (!intent.target) {
      suggestions.push('Specify which cells to use');
    }

    if (intent.confidence < 0.7) {
      suggestions.push('Clarify what you want to do');
    }

    if (Object.keys(intent.parameters).length === 0) {
      suggestions.push('Provide more details');
    }

    return suggestions;
  }
}

// Export singleton
export const clarificationEngine = new ClarificationEngine();
