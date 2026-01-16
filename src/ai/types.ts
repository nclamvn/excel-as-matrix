// ═══════════════════════════════════════════════════════════════════════════
// AI COPILOT TYPES — Based on Blueprint §5
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Core AI Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIActor {
  id: string;
  type: 'user' | 'ai' | 'system';
  name: string;
  permissions: AIPermission[];
  budget?: AIBudget;
}

export interface AIPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'execute')[];
  conditions?: Record<string, unknown>;
}

export interface AIBudget {
  maxTokens: number;
  usedTokens: number;
  maxActionsPerTurn: number;
  resetAt?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: AIMessageMetadata;
}

export interface AIMessageMetadata {
  tokensUsed?: number;
  toolCalls?: AIToolCall[];
  sources?: AISource[];
  confidence?: number;
}

export interface AISource {
  type: 'cell' | 'range' | 'formula' | 'sheet' | 'external';
  reference: string;
  value?: unknown;
  notation: string; // e.g., "[📍A1]"
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Types (Blueprint §5.2)
// ─────────────────────────────────────────────────────────────────────────────

export type AIToolName =
  | 'read_range'
  | 'write_range'
  | 'get_dependencies'
  | 'search_cells'
  | 'propose_action'
  | 'get_sheet_info'
  | 'get_selection';

export interface AITool {
  name: AIToolName;
  description: string;
  parameters: AIToolParameter[];
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AIToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface AIToolCall {
  id: string;
  tool: AIToolName;
  arguments: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  result?: unknown;
  error?: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Types (Approval Workflow)
// ─────────────────────────────────────────────────────────────────────────────

export interface AIProposedAction {
  id: string;
  type: 'write' | 'delete' | 'format' | 'formula' | 'bulk';
  description: string;
  preview: AIActionPreview;
  riskLevel: 'low' | 'medium' | 'high';
  affectedCells: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: Date;
  executedAt?: Date;
}

export interface AIActionPreview {
  before: AIRangeSnapshot;
  after: AIRangeSnapshot;
  changes: AIChange[];
}

export interface AIRangeSnapshot {
  range: string;
  values: (string | number | boolean | null)[][];
  formulas?: (string | null)[][];
}

export interface AIChange {
  cell: string;
  field: 'value' | 'formula' | 'format';
  oldValue: unknown;
  newValue: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Types (Grounding Contract)
// ─────────────────────────────────────────────────────────────────────────────

export interface AIContext {
  selection?: AISelectionContext;
  sheet: AISheetContext;
  recentCells: AICellContext[];
  dependencies?: AIDependencyGraph;
}

export interface AISelectionContext {
  range: string;
  values: unknown[][];
  formulas?: string[][];
  cellCount: number;
}

export interface AISheetContext {
  id: string;
  name: string;
  usedRange: string;
  cellCount: number;
  formulaCount: number;
  namedRanges?: string[];
}

export interface AICellContext {
  address: string;
  value: unknown;
  formula?: string;
  format?: Record<string, unknown>;
  dependencies?: string[];
  dependents?: string[];
}

export interface AIDependencyGraph {
  nodes: Map<string, AICellContext>;
  edges: Map<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context: AIContext;
  pendingActions: AIProposedAction[];
  history: AIActionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIActionHistory {
  id: string;
  action: AIProposedAction;
  outcome: 'success' | 'failed' | 'reverted';
  executedBy: string;
  timestamp: Date;
  revertedAt?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  mockMode: boolean;
  autoApprove: {
    enabled: boolean;
    maxCells: number;
    riskLevels: ('low' | 'medium')[];
  };
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
  mockMode: true, // Start in mock mode
  autoApprove: {
    enabled: false,
    maxCells: 10,
    riskLevels: ['low'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UI State Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AICopilotState {
  isOpen: boolean;
  isDocked: boolean;
  activeTab: 'chat' | 'context' | 'actions' | 'history';
  isLoading: boolean;
  error: string | null;
  conversation: AIConversation | null;
  config: AIConfig;
}

export type AICopilotTab = 'chat' | 'context' | 'actions' | 'history';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLY TYPES (Blueprint §5.3)
// ═══════════════════════════════════════════════════════════════════════════

export interface ContextConfig {
  maxTokens: number; // e.g., 50000
  priorityWeights: PriorityWeights;
  truncationStrategy: 'summarize' | 'sample' | 'hierarchical';
}

export interface PriorityWeights {
  directReference: number; // 0.40 - cells user is asking about
  upstreamDeps: number; // 0.25 - formulas feeding into those
  downstreamDeps: number; // 0.10 - cells affected by changes
  schemaContext: number; // 0.15 - table defs, semantic types
  recentEvents: number; // 0.10 - audit trail
}

export interface AssembledContext {
  // User's current focus
  directData: {
    ranges: SerializedRange[];
    totalCells: number;
    tokensUsed: number;
  };

  // Computation structure
  dependencyContext: {
    upstreamCells: CellSnapshot[];
    downstreamCells: CellSnapshot[];
    formulaChain: string[];
    tokensUsed: number;
  };

  // Schema information
  schemaContext: {
    tables: TableSummary[];
    namedRanges: NamedRangeSummary[];
    semanticTypes: string[];
    tokensUsed: number;
  };

  // Recent history
  eventContext: {
    recentChanges: ChangeEvent[];
    tokensUsed: number;
  };

  // Assembly metadata
  metadata: {
    totalTokens: number;
    budgetRemaining: number;
    truncatedItems: TruncationRecord[];
    warnings: string[];
    assemblyTime: number;
  };
}

export interface SerializedRange {
  ref: string; // e.g., "A1:C10"
  sheetName: string;
  values: unknown[][];
  formulas: (string | null)[][];
  formats: (string | null)[][];
  hasFormulas: boolean;
  cellCount: number;
}

export interface CellSnapshot {
  ref: string;
  value: unknown;
  formula: string | null;
  format: string | null;
  dependencies: string[];
  dependents: string[];
  lastModified?: Date;
}

export interface TableSummary {
  name: string;
  range: string;
  columns: string[];
  rowCount: number;
  hasHeaders: boolean;
}

export interface NamedRangeSummary {
  name: string;
  range: string;
  scope: 'workbook' | 'sheet';
}

export interface ChangeEvent {
  timestamp: Date;
  type: 'value_change' | 'formula_change' | 'format_change' | 'structure_change';
  cellRef: string;
  oldValue?: unknown;
  newValue?: unknown;
  actor: 'user' | 'ai' | 'system';
}

export interface TruncationRecord {
  itemType: string;
  originalSize: number;
  truncatedSize: number;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTENT PARSING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ParsedIntent {
  // What the user wants to do
  action: IntentAction;

  // Entities mentioned
  entities: IntentEntity[];

  // Confidence in parsing
  confidence: number;

  // Ambiguities that need clarification
  ambiguities: string[];

  // Suggested clarifying questions
  clarifyingQuestions: string[];
}

export type IntentAction =
  | 'read' // Just want to see data
  | 'calculate' // Want a formula/calculation
  | 'analyze' // Want analysis/insights
  | 'modify' // Want to change data
  | 'create' // Want to create new structure
  | 'explain' // Want explanation of existing
  | 'debug' // Want to fix something
  | 'unknown';

export interface IntentEntity {
  type: 'cell' | 'range' | 'column' | 'row' | 'table' | 'sheet' | 'formula' | 'value';
  reference: string; // e.g., "A1", "Column B", "Sales table"
  resolved: boolean; // Whether we found it in spreadsheet
  resolvedRef?: string; // Actual cell/range reference
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUNDING TYPES (Blueprint §5.4.2)
// ═══════════════════════════════════════════════════════════════════════════

export interface GroundedClaim {
  id: string;
  statement: string; // The claim being made

  groundingType: 'direct_read' | 'computed' | 'inferred';

  source: ClaimSource;
  confidence: number;
  verificationQuery?: string; // How to verify
  verified: boolean;
}

export interface ClaimSource {
  type: 'cell' | 'range' | 'formula_eval' | 'event_log' | 'user_input';
  ref: string; // Cell/range reference
  valueAtRead: unknown; // Snapshot when read
  readTimestamp: Date;
  sheetName?: string;
}

export interface Evidence {
  id: string;
  type:
    | 'user_instruction' // From conversation
    | 'cell_data' // From spreadsheet
    | 'pattern_detected' // Found in data
    | 'best_practice' // Standard approach
    | 'domain_knowledge' // From training
    | 'inferred'; // AI reasoning

  source: string; // Where from
  content: string; // The evidence content
  quote?: string; // Relevant excerpt
  confidence: number;
  timestamp: Date;
}

export interface GroundingReport {
  claims: GroundedClaim[];
  evidence: Evidence[];
  ungroundedStatements: string[];
  overallConfidence: number;
  verificationStatus: 'verified' | 'partial' | 'unverified';
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface VerificationResult {
  claimId: string;
  verified: boolean;
  currentValue: unknown;
  expectedValue: unknown;
  discrepancy?: string;
  timestamp: Date;
}
