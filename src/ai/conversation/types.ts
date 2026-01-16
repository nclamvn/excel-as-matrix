// =============================================================================
// CONVERSATION TYPES — Multi-turn conversation state machine (Blueprint §5.6)
// =============================================================================

// -----------------------------------------------------------------------------
// State Machine States
// -----------------------------------------------------------------------------

/**
 * All possible conversation states
 */
export type ConversationState =
  | 'idle'               // Ready for input
  | 'intent_gathering'   // Understanding request
  | 'clarifying'         // Asking questions
  | 'planning'           // Breaking down task
  | 'executing'          // Running steps
  | 'reviewing'          // User checks results
  | 'awaiting_approval'  // Waiting for approval
  | 'complete'           // Task finished
  | 'error'              // Something went wrong
  | 'cancelled';         // User cancelled

/**
 * Valid state transitions
 */
export const STATE_TRANSITIONS: Record<ConversationState, ConversationState[]> = {
  idle: ['intent_gathering'],
  intent_gathering: ['clarifying', 'planning', 'executing', 'error'],
  clarifying: ['intent_gathering', 'planning', 'executing', 'cancelled'],
  planning: ['executing', 'clarifying', 'error', 'cancelled'],
  executing: ['reviewing', 'error', 'cancelled'],
  reviewing: ['awaiting_approval', 'executing', 'complete', 'cancelled'],
  awaiting_approval: ['complete', 'executing', 'cancelled'],
  complete: ['idle'],
  error: ['idle', 'executing', 'cancelled'],
  cancelled: ['idle'],
};

// -----------------------------------------------------------------------------
// Conversation Context
// -----------------------------------------------------------------------------

/**
 * Full conversation context
 */
export interface ConversationContext {
  id: string;
  state: ConversationState;
  startedAt: Date;
  updatedAt: Date;

  // User request
  originalRequest: string;
  parsedIntent?: ParsedIntent;

  // Task planning
  taskPlan?: TaskPlan;
  currentStepIndex: number;

  // Clarification
  pendingClarification?: ClarificationRequest;
  clarificationHistory: ClarificationResponse[];

  // Execution
  executionResults: StepResult[];

  // Error handling
  lastError?: ConversationError;
  recoveryAttempts: number;

  // Feedback
  feedback?: UserFeedback;

  // Metadata
  metadata: Record<string, unknown>;
}

/**
 * Parsed user intent
 */
export interface ParsedIntent {
  action: string;           // What to do
  target?: string;          // Where to do it
  parameters: Record<string, unknown>;
  confidence: number;
  ambiguities: string[];
  needsClarification: boolean;
}

// -----------------------------------------------------------------------------
// Task Planning
// -----------------------------------------------------------------------------

/**
 * A plan for executing a complex task
 */
export interface TaskPlan {
  id: string;
  name: string;
  description: string;
  steps: TaskStep[];
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  createdAt: Date;
}

/**
 * A single step in a task plan
 */
export interface TaskStep {
  id: string;
  index: number;
  name: string;
  description: string;
  action: string;
  parameters: Record<string, unknown>;
  dependencies: string[];   // IDs of steps this depends on
  status: StepStatus;
  canRetry: boolean;
  optional: boolean;
}

/**
 * Status of a task step
 */
export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

/**
 * Result of executing a step
 */
export interface StepResult {
  stepId: string;
  status: StepStatus;
  result?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  retryCount: number;
}

// -----------------------------------------------------------------------------
// Clarification
// -----------------------------------------------------------------------------

/**
 * Types of clarification questions
 */
export type ClarificationType =
  | 'target_selection'       // Which cells?
  | 'action_confirmation'    // Is this right?
  | 'parameter_value'        // What value?
  | 'ambiguity_resolution'   // Which meaning?
  | 'scope_definition'       // How much?
  | 'format_preference';     // How to display?

/**
 * A clarification request to the user
 */
export interface ClarificationRequest {
  id: string;
  type: ClarificationType;
  question: string;
  context: string;
  options?: ClarificationOption[];
  allowFreeText: boolean;
  required: boolean;
  defaultValue?: string;
}

/**
 * A predefined option for clarification
 */
export interface ClarificationOption {
  id: string;
  label: string;
  description?: string;
  value: unknown;
}

/**
 * User's response to a clarification
 */
export interface ClarificationResponse {
  requestId: string;
  type: ClarificationType;
  selectedOptionId?: string;
  freeTextResponse?: string;
  value: unknown;
  respondedAt: Date;
}

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

/**
 * Types of errors that can occur
 */
export type ErrorType =
  | 'parse_error'        // Failed to understand request
  | 'validation_error'   // Invalid parameters
  | 'execution_error'    // Step failed to execute
  | 'permission_error'   // Not allowed
  | 'timeout_error'      // Took too long
  | 'unknown_error';     // Something else

/**
 * A conversation error
 */
export interface ConversationError {
  id: string;
  type: ErrorType;
  message: string;
  details?: string;
  stepId?: string;
  recoverable: boolean;
  suggestedRecovery?: RecoveryAction;
  occurredAt: Date;
}

/**
 * Possible recovery actions
 */
export type RecoveryAction =
  | 'retry'      // Try again
  | 'skip'       // Skip this step
  | 'modify'     // Change approach
  | 'abort'      // Cancel task
  | 'ask_user';  // Get help

/**
 * Recovery attempt
 */
export interface RecoveryAttempt {
  errorId: string;
  action: RecoveryAction;
  success: boolean;
  newState?: ConversationState;
  message?: string;
  attemptedAt: Date;
}

// -----------------------------------------------------------------------------
// Feedback
// -----------------------------------------------------------------------------

/**
 * Types of feedback
 */
export type FeedbackType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'correction'
  | 'suggestion';

/**
 * User feedback on AI response
 */
export interface UserFeedback {
  id: string;
  conversationId: string;
  type: FeedbackType;
  rating?: number;          // 1-5
  comment?: string;
  correction?: string;      // What should have happened
  categories?: FeedbackCategory[];    // What went wrong
  providedAt: Date;
}

/**
 * Feedback categories for what went wrong
 */
export const FEEDBACK_CATEGORIES = [
  'wrong_cells',
  'wrong_formula',
  'wrong_values',
  'misunderstood_intent',
  'incomplete_result',
  'too_slow',
  'other',
] as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORIES[number];

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

/**
 * Types of state machine events
 */
export type ConversationEventType =
  | 'state_changed'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'clarification_requested'
  | 'clarification_received'
  | 'error_occurred'
  | 'recovery_attempted'
  | 'feedback_received'
  | 'conversation_complete'
  | 'conversation_cancelled';

/**
 * A state machine event
 */
export interface ConversationEvent {
  type: ConversationEventType;
  conversationId: string;
  timestamp: Date;
  previousState?: ConversationState;
  newState?: ConversationState;
  data?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/**
 * State machine configuration
 */
export interface ConversationConfig {
  maxClarificationAttempts: number;
  maxRecoveryAttempts: number;
  stepTimeout: number;          // ms
  autoRetryOnError: boolean;
  requireApprovalForChanges: boolean;
  collectFeedback: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONVERSATION_CONFIG: ConversationConfig = {
  maxClarificationAttempts: 3,
  maxRecoveryAttempts: 2,
  stepTimeout: 30000,
  autoRetryOnError: false,
  requireApprovalForChanges: true,
  collectFeedback: true,
};

// -----------------------------------------------------------------------------
// State Descriptions
// -----------------------------------------------------------------------------

/**
 * Human-readable state descriptions
 */
export const STATE_DESCRIPTIONS: Record<ConversationState, string> = {
  idle: 'Ready for your request',
  intent_gathering: 'Understanding your request...',
  clarifying: 'Need some clarification',
  planning: 'Planning the task...',
  executing: 'Working on it...',
  reviewing: 'Please review the results',
  awaiting_approval: 'Waiting for your approval',
  complete: 'Task completed!',
  error: 'Something went wrong',
  cancelled: 'Task cancelled',
};

/**
 * State icons
 */
export const STATE_ICONS: Record<ConversationState, string> = {
  idle: '💭',
  intent_gathering: '🔍',
  clarifying: '❓',
  planning: '📋',
  executing: '⚡',
  reviewing: '👁',
  awaiting_approval: '✋',
  complete: '✅',
  error: '❌',
  cancelled: '🚫',
};
