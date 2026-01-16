// =============================================================================
// CONVERSATION MODULE — Multi-turn conversation state machine (Blueprint §5.6)
// =============================================================================

// Types
export type {
  ConversationState,
  ConversationContext,
  ConversationEvent,
  ConversationEventType,
  ConversationConfig,
  ParsedIntent,
  TaskPlan,
  TaskStep,
  StepStatus,
  StepResult,
  ClarificationType,
  ClarificationRequest,
  ClarificationOption,
  ClarificationResponse,
  ErrorType,
  ConversationError,
  RecoveryAction,
  RecoveryAttempt,
  FeedbackType,
  UserFeedback,
  FeedbackCategory,
} from './types';

// Constants
export {
  STATE_TRANSITIONS,
  DEFAULT_CONVERSATION_CONFIG,
  STATE_DESCRIPTIONS,
  STATE_ICONS,
  FEEDBACK_CATEGORIES,
} from './types';

// State Machine
export {
  ConversationStateMachine,
  conversationStateMachine,
} from './StateMachine';

// State Handlers
export {
  stateHandlers,
  getStateHandler,
  IdleHandler,
  IntentGatheringHandler,
  ClarifyingHandler,
  PlanningHandler,
  ExecutingHandler,
  ReviewingHandler,
} from './StateHandlers';

// Task Planner
export { TaskPlanner, taskPlanner } from './TaskPlanner';

// Clarification Engine
export { ClarificationEngine, clarificationEngine } from './ClarificationEngine';

// Error Recovery
export { ErrorRecovery, errorRecovery } from './ErrorRecovery';

// Feedback Loop
export { FeedbackLoop, feedbackLoop } from './FeedbackLoop';
