// ═══════════════════════════════════════════════════════════════════════════
// AI COMPONENTS — Exports
// ═══════════════════════════════════════════════════════════════════════════

export { AICopilotDock } from './AICopilotDock';
export { ChatPanel } from './ChatPanel';
export { ActionsPanel } from './ActionsPanel';
export { ContextPanel } from './ContextPanel';
export { HistoryPanel } from './HistoryPanel';

// Sandbox Components (Phase 3)
export { RiskBadge } from './RiskBadge';
export { DiffViewer } from './DiffViewer';
export { ApprovalControls } from './ApprovalControls';
export { SandboxPreview } from './SandboxPreview';

// Trust UI Components (Phase 4)
export { ConfidenceMeter, ConfidenceBadge } from './ConfidenceMeter';
export { ConfidenceTooltip, InlineConfidence, ConfidenceDetails } from './ConfidenceTooltip';
export { UncertaintyBadge, UncertaintyIndicator, UncertaintyList } from './UncertaintyBadge';
export { SourceAttribution, SourceCitation, SourcesSummary, CellSource, SourceTypeList } from './SourceAttribution';
export { TrustDashboard } from './TrustDashboard';
export { CalibrationChart, CalibrationBucketsTable, MiniCalibration, CalibrationStatusBar } from './CalibrationChart';

// Conversation Components (Phase 5)
export { ConversationFlow, StateBadge, StateTimeline, StateIndicator } from './ConversationFlow';
export { ClarificationDialog, InlineClarification, QuickSuggestions } from './ClarificationDialog';
export { TaskProgress, CompactProgress, StepList, ProgressSummary } from './TaskProgress';
export { FeedbackPrompt, MiniFeedback, FeedbackCard } from './FeedbackPrompt';

// Contextual AI Components (Phase 5 Enhancement)
export { FloatingAIButton } from './FloatingAIButton';
export { InlineAISuggestions, FormulaBarAIHint } from './InlineAISuggestions';
export { ProactiveAINotifications, useAINotificationStore, useProactiveAITriggers, generateInsight } from './ProactiveAINotifications';
