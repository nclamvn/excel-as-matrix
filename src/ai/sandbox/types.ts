// =============================================================================
// SANDBOX TYPES — Type definitions for Sandbox/PR Workflow (Blueprint §2.2.3)
// =============================================================================

// -----------------------------------------------------------------------------
// Core Sandbox Types
// -----------------------------------------------------------------------------

/**
 * Sandbox status
 */
export type SandboxStatus =
  | 'pending'    // Created, awaiting review
  | 'approved'   // User approved, ready to merge
  | 'merged'     // Applied to main spreadsheet
  | 'rejected'   // User rejected
  | 'discarded'  // Auto-discarded (timeout, etc.)
  | 'rolled_back'; // Merged but then undone

/**
 * Risk level for changes
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Types of cell changes
 */
export type ChangeType = 'added' | 'modified' | 'deleted';

/**
 * Risk factors that can be detected
 */
export type RiskFactor =
  | 'large_blast_radius'    // >20 cells affected
  | 'formula_complexity'    // Nested/complex formulas
  | 'data_loss'             // Deleting existing data
  | 'formula_removal'       // Removing formulas
  | 'cross_sheet'           // Multiple sheets affected
  | 'circular_dependency'   // Potential circular refs
  | 'external_reference'    // External workbook refs
  | 'array_formula'         // Array/spill formulas
  | 'volatile_function';    // RAND, NOW, etc.

// -----------------------------------------------------------------------------
// Cell Change Types
// -----------------------------------------------------------------------------

/**
 * Snapshot of a cell's state
 */
export interface CellState {
  ref: string;           // e.g., "A1"
  value: unknown;        // Current value
  formula: string | null; // Formula if any
  format?: string;       // Format string
}

/**
 * A single cell change
 */
export interface CellChange {
  ref: string;
  sheetId: string;
  sheetName: string;
  changeType: ChangeType;
  before: CellState | null;  // null for 'added'
  after: CellState | null;   // null for 'deleted'
}

/**
 * Diff summary statistics
 */
export interface DiffSummary {
  totalChanges: number;
  added: number;
  modified: number;
  deleted: number;
  formulaChanges: number;
  sheetsAffected: string[];
}

/**
 * Complete diff between current state and proposed changes
 */
export interface SandboxDiff {
  id: string;
  sandboxId: string;
  changes: CellChange[];
  summary: DiffSummary;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// Risk Assessment Types
// -----------------------------------------------------------------------------

/**
 * Individual risk factor with details
 */
export interface DetectedRisk {
  factor: RiskFactor;
  severity: RiskLevel;
  description: string;
  affectedCells?: string[];  // Cells triggering this risk
  suggestion?: string;       // Mitigation suggestion
}

/**
 * Complete risk assessment for a sandbox
 */
export interface RiskAssessment {
  sandboxId: string;
  overallRisk: RiskLevel;
  riskScore: number;        // 0-100 numeric score
  detectedRisks: DetectedRisk[];
  requiresApproval: boolean;
  canAutoApply: boolean;
  assessedAt: Date;
}

// -----------------------------------------------------------------------------
// Rollback Types
// -----------------------------------------------------------------------------

/**
 * Rollback information for merged sandboxes
 */
export interface RollbackInfo {
  sandboxId: string;
  originalStates: CellState[];
  mergedAt: Date;
  expiresAt: Date;           // 24 hours after merge
  canRollback: boolean;
}

// -----------------------------------------------------------------------------
// Main Sandbox Type
// -----------------------------------------------------------------------------

/**
 * Complete sandbox representing a proposed set of changes
 */
export interface Sandbox {
  id: string;
  name: string;
  description: string;

  // Status tracking
  status: SandboxStatus;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  rejectedAt?: Date;

  // Source information
  createdBy: 'ai' | 'user';
  aiConversationId?: string;
  aiMessageId?: string;

  // Changes
  proposedChanges: Map<string, CellState>;  // key: "sheetId:cellRef"
  diff?: SandboxDiff;

  // Risk
  riskAssessment?: RiskAssessment;

  // Rollback
  rollbackInfo?: RollbackInfo;

  // Metadata
  metadata?: {
    intent?: string;           // What the user asked for
    reasoning?: string;        // AI's reasoning
    tokensUsed?: number;
  };
}

// -----------------------------------------------------------------------------
// Sandbox Events (Blueprint §4.1.2)
// -----------------------------------------------------------------------------

export type SandboxEventType =
  | 'sandbox_created'
  | 'sandbox_updated'
  | 'sandbox_approved'
  | 'sandbox_rejected'
  | 'sandbox_merged'
  | 'sandbox_discarded'
  | 'sandbox_rolled_back';

export interface SandboxEvent {
  type: SandboxEventType;
  sandboxId: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Configuration Types
// -----------------------------------------------------------------------------

/**
 * Sandbox configuration options
 */
export interface SandboxConfig {
  // Auto-approval settings
  autoApprove: {
    enabled: boolean;
    maxRiskLevel: RiskLevel;
    maxAffectedCells: number;
    requireForFormulas: boolean;
  };

  // Rollback settings
  rollback: {
    enabled: boolean;
    retentionHours: number;    // Default: 24
  };

  // Risk thresholds
  riskThresholds: {
    largeBatchSize: number;    // Default: 20
    highRiskScore: number;     // Default: 70
    mediumRiskScore: number;   // Default: 40
  };

  // Timeout settings
  timeouts: {
    pendingExpiry: number;     // Minutes before auto-discard
  };
}

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  autoApprove: {
    enabled: true,
    maxRiskLevel: 'low',
    maxAffectedCells: 5,
    requireForFormulas: true,
  },
  rollback: {
    enabled: true,
    retentionHours: 24,
  },
  riskThresholds: {
    largeBatchSize: 20,
    highRiskScore: 70,
    mediumRiskScore: 40,
  },
  timeouts: {
    pendingExpiry: 60,  // 1 hour
  },
};

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

/**
 * Result of creating a sandbox
 */
export interface CreateSandboxResult {
  sandbox: Sandbox;
  diff: SandboxDiff;
  riskAssessment: RiskAssessment;
}

/**
 * Result of merging a sandbox
 */
export interface MergeSandboxResult {
  success: boolean;
  sandbox: Sandbox | null;
  appliedChanges: number;
  rollbackInfo?: RollbackInfo;
  errors?: string[];
}

/**
 * Result of rolling back a sandbox
 */
export interface RollbackSandboxResult {
  success: boolean;
  sandboxId: string;
  restoredCells: number;
  errors?: string[];
}
