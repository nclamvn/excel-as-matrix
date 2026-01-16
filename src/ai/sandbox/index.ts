// =============================================================================
// SANDBOX MODULE — Exports (Blueprint §2.2.3)
// =============================================================================

// Types
export type {
  Sandbox,
  SandboxStatus,
  SandboxConfig,
  SandboxEvent,
  SandboxEventType,
  CellState,
  CellChange,
  ChangeType,
  SandboxDiff,
  DiffSummary,
  RiskLevel,
  RiskFactor,
  DetectedRisk,
  RiskAssessment,
  RollbackInfo,
  CreateSandboxResult,
  MergeSandboxResult,
  RollbackSandboxResult,
} from './types';

export { DEFAULT_SANDBOX_CONFIG } from './types';

// Managers & Engines
export { SandboxManager, sandboxManager } from './SandboxManager';
export { DiffEngine, diffEngine } from './DiffEngine';
export { RiskAssessor, riskAssessor } from './RiskAssessor';
export { MergeEngine, mergeEngine } from './MergeEngine';
