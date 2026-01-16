// =============================================================================
// MACRO & WORKFLOW TYPES — Type definitions for AI Macros
// =============================================================================

// ═══════════════════════════════════════════════════════════════
// MACRO & WORKFLOW
// ═══════════════════════════════════════════════════════════════

export interface Macro {
  id: string;
  name: string;
  description: string;

  // Workflow
  workflow: Workflow;

  // Trigger
  trigger: MacroTrigger;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  runCount: number;

  // Status
  enabled: boolean;

  // Tags
  tags: string[];

  // Settings
  settings: MacroSettings;
}

export interface Workflow {
  id: string;
  name: string;

  // Steps
  steps: WorkflowStep[];

  // Variables
  variables: WorkflowVariable[];

  // Error handling
  onError: 'stop' | 'continue' | 'retry';
  retryCount?: number;
}

export interface WorkflowStep {
  id: string;
  order: number;

  // Step type
  type: StepType;

  // Action
  action: WorkflowAction;

  // Conditions
  condition?: StepCondition;

  // Branching
  branches?: WorkflowBranch[];

  // Loop
  loop?: LoopConfig;

  // Status
  enabled: boolean;

  // Display
  label?: string;
  description?: string;

  // Position (for visual builder)
  position?: { x: number; y: number };
}

export type StepType =
  | 'action'      // Single action
  | 'condition'   // If/else branch
  | 'loop'        // Repeat
  | 'parallel'    // Run in parallel
  | 'wait'        // Wait/delay
  | 'subworkflow';// Call another workflow

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

export interface WorkflowAction {
  id: string;
  type: ActionType;

  // Configuration
  params: Record<string, unknown>;

  // Input/Output
  inputMapping?: VariableMapping[];
  outputVariable?: string;
}

export type ActionType =
  // Data Operations
  | 'copy_range'
  | 'paste_range'
  | 'clear_range'
  | 'delete_rows'
  | 'insert_rows'
  | 'filter_data'
  | 'sort_data'
  | 'find_replace'
  | 'remove_duplicates'

  // Formulas
  | 'apply_formula'
  | 'fill_formula'
  | 'recalculate'

  // Formatting
  | 'format_cells'
  | 'conditional_format'
  | 'auto_fit'
  | 'merge_cells'

  // Charts
  | 'create_chart'
  | 'update_chart'
  | 'delete_chart'

  // Sheets
  | 'add_sheet'
  | 'delete_sheet'
  | 'rename_sheet'
  | 'copy_sheet'

  // Files
  | 'import_data'
  | 'export_pdf'
  | 'export_excel'
  | 'export_csv'
  | 'save_file'

  // Notifications
  | 'send_email'
  | 'send_slack'
  | 'show_notification'

  // External
  | 'http_request'
  | 'run_script'

  // AI Actions
  | 'ai_clean_data'
  | 'ai_create_chart'
  | 'ai_formula'
  | 'ai_analyze';

export interface ActionDefinition {
  type: ActionType;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  category: ActionCategory;
  icon: string;

  // Parameters
  params: ActionParam[];

  // Output
  hasOutput: boolean;
  outputType?: string;

  // Requirements
  requiresSelection?: boolean;
  requiresSheet?: boolean;
}

export type ActionCategory =
  | 'data'
  | 'formula'
  | 'format'
  | 'chart'
  | 'sheet'
  | 'file'
  | 'notification'
  | 'external'
  | 'ai';

export interface ActionParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'range' | 'formula' | 'select' | 'file';
  label: string;
  labelVi: string;
  required: boolean;
  default?: unknown;
  options?: { value: unknown; label: string }[];
  validation?: string;
}

// ═══════════════════════════════════════════════════════════════
// TRIGGERS
// ═══════════════════════════════════════════════════════════════

export interface MacroTrigger {
  type: TriggerType;
  config: TriggerConfig;
  enabled: boolean;
}

export type TriggerType =
  | 'manual'      // Button click
  | 'schedule'    // Cron schedule
  | 'data_change' // Cell/range change
  | 'file_open'   // File opened
  | 'webhook'     // External webhook
  | 'email';      // Email received

export interface TriggerConfig {
  // For schedule
  schedule?: ScheduleConfig;

  // For data change
  watchRange?: string;
  watchSheet?: string;
  changeType?: 'any' | 'value' | 'formula' | 'format';

  // For webhook
  webhookUrl?: string;
  webhookSecret?: string;

  // For email
  emailFilter?: string;
}

export interface ScheduleConfig {
  type: 'once' | 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';

  // For once
  runAt?: Date;

  // For interval
  intervalMinutes?: number;

  // For daily
  timeOfDay?: string;  // "09:00"

  // For weekly
  daysOfWeek?: number[];  // 0=Sun, 1=Mon, etc.

  // For monthly
  dayOfMonth?: number;

  // For cron
  cronExpression?: string;

  // Time zone
  timezone?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONS & BRANCHING
// ═══════════════════════════════════════════════════════════════

export interface StepCondition {
  type: ConditionType;

  // For value comparison
  leftOperand?: string;   // Variable or cell reference
  operator?: ComparisonOperator;
  rightOperand?: unknown;

  // For compound conditions
  conditions?: StepCondition[];
  logicalOperator?: 'and' | 'or';
}

export type ConditionType = 'value' | 'empty' | 'exists' | 'contains' | 'matches' | 'compound';

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater'
  | 'greater_equal'
  | 'less'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with';

export interface WorkflowBranch {
  id: string;
  name: string;
  condition: StepCondition;
  steps: WorkflowStep[];
}

export interface LoopConfig {
  type: 'count' | 'while' | 'for_each';

  // For count
  iterations?: number;

  // For while
  condition?: StepCondition;
  maxIterations?: number;

  // For for_each
  collection?: string;  // Variable name
  itemVariable?: string;
  indexVariable?: string;
}

// ═══════════════════════════════════════════════════════════════
// VARIABLES
// ═══════════════════════════════════════════════════════════════

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  value?: unknown;
  description?: string;

  // For input variables
  isInput?: boolean;
  inputLabel?: string;
  required?: boolean;
}

export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'range' | 'array' | 'object';

export interface VariableMapping {
  variableName: string;
  source: 'literal' | 'variable' | 'cell' | 'formula';
  value: unknown;
}

// ═══════════════════════════════════════════════════════════════
// EXECUTION
// ═══════════════════════════════════════════════════════════════

export interface MacroExecution {
  id: string;
  macroId: string;

  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number;

  // Status
  status: ExecutionStatus;
  currentStep?: number;

  // Results
  results: StepResult[];

  // Error
  error?: ExecutionError;

  // Trigger info
  triggeredBy: TriggerType;
  triggerData?: unknown;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface StepResult {
  stepId: string;
  status: 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

export interface ExecutionError {
  stepId?: string;
  message: string;
  code?: string;
  details?: unknown;
}

// ═══════════════════════════════════════════════════════════════
// RECORDING
// ═══════════════════════════════════════════════════════════════

export interface RecordedAction {
  id: string;
  timestamp: Date;

  // Action type
  type: ActionType;

  // Context
  sheetId?: string;
  sheetName?: string;
  range?: string;

  // Data
  params: Record<string, unknown>;

  // Before/After
  beforeState?: unknown;
  afterState?: unknown;
}

export interface RecordingSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;

  // Actions
  actions: RecordedAction[];

  // Status
  status: 'recording' | 'paused' | 'stopped';
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export interface MacroSettings {
  // Execution
  timeout: number;            // ms
  maxRetries: number;
  retryDelay: number;         // ms

  // Logging
  logLevel: 'none' | 'errors' | 'all';
  keepLogs: number;           // days

  // Notifications
  notifyOnComplete: boolean;
  notifyOnError: boolean;

  // Permissions
  allowExternalAccess: boolean;
  allowFileAccess: boolean;
}

export const DEFAULT_MACRO_SETTINGS: MacroSettings = {
  timeout: 300000,            // 5 minutes
  maxRetries: 3,
  retryDelay: 5000,
  logLevel: 'errors',
  keepLogs: 30,
  notifyOnComplete: false,
  notifyOnError: true,
  allowExternalAccess: false,
  allowFileAccess: true,
};

// ═══════════════════════════════════════════════════════════════
// PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

export interface DetectedPattern {
  id: string;
  name: string;
  suggestedName: string;
  description: string;
  actions: RecordedAction[];
  occurrences: number;
  lastSeen: Date;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// OPTIMIZATION
// ═══════════════════════════════════════════════════════════════

export interface OptimizationSuggestion {
  id: string;
  type: 'merge' | 'parallelize' | 'simplify' | 'reorder';
  description: string;
  descriptionVi: string;
  impact: 'low' | 'medium' | 'high';
  affectedSteps: string[];
}
