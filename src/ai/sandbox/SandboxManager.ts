// =============================================================================
// SANDBOX MANAGER — Main orchestration for sandbox workflow (Blueprint §2.2.3)
// =============================================================================

import { loggers } from '@/utils/logger';
import type {
  Sandbox,
  SandboxStatus,
  SandboxConfig,
  SandboxEvent,
  SandboxEventType,
  CellState,
  CreateSandboxResult,
  MergeSandboxResult,
  RollbackSandboxResult,
} from './types';
import { DEFAULT_SANDBOX_CONFIG } from './types';
import { DiffEngine, diffEngine } from './DiffEngine';
import { RiskAssessor, riskAssessor } from './RiskAssessor';
import { MergeEngine, mergeEngine } from './MergeEngine';
import { parseCellRef, colToLetter } from '../../types/cell';

// -----------------------------------------------------------------------------
// Sandbox Manager Class
// -----------------------------------------------------------------------------

export class SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map();
  private activeSandboxId: string | null = null;
  private eventListeners: ((event: SandboxEvent) => void)[] = [];
  private config: SandboxConfig;

  // Engines
  private diffEngine: DiffEngine;
  private riskAssessor: RiskAssessor;
  private mergeEngine: MergeEngine;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    this.diffEngine = diffEngine;
    this.riskAssessor = riskAssessor;
    this.mergeEngine = mergeEngine;

    // Start cleanup timer
    this.startCleanupTimer();
  }

  // ---------------------------------------------------------------------------
  // Sandbox Creation
  // ---------------------------------------------------------------------------

  /**
   * Create a new sandbox for proposed changes
   */
  createSandbox(
    name: string,
    description: string,
    proposedChanges: Map<string, CellState>,
    options: {
      createdBy?: 'ai' | 'user';
      aiConversationId?: string;
      aiMessageId?: string;
      intent?: string;
      reasoning?: string;
    } = {}
  ): CreateSandboxResult {
    const id = crypto.randomUUID();

    // Create sandbox
    const sandbox: Sandbox = {
      id,
      name,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.createdBy || 'ai',
      aiConversationId: options.aiConversationId,
      aiMessageId: options.aiMessageId,
      proposedChanges,
      metadata: {
        intent: options.intent,
        reasoning: options.reasoning,
      },
    };

    // Calculate diff
    const diff = this.diffEngine.calculateDiff(id, proposedChanges);
    sandbox.diff = diff;

    // Assess risk
    const riskAssessment = this.riskAssessor.assessRisk(id, diff);
    sandbox.riskAssessment = riskAssessment;

    // Store sandbox
    this.sandboxes.set(id, sandbox);
    this.activeSandboxId = id;

    // Emit event
    this.emitEvent('sandbox_created', id, {
      name,
      changesCount: diff.summary.totalChanges,
      riskLevel: riskAssessment.overallRisk,
    });

    return { sandbox, diff, riskAssessment };
  }

  /**
   * Create sandbox for a range write operation
   */
  createSandboxForRangeWrite(
    sheetId: string,
    startRef: string,
    values: unknown[][],
    options: {
      name?: string;
      createdBy?: 'ai' | 'user';
      aiConversationId?: string;
      intent?: string;
    } = {}
  ): CreateSandboxResult {
    const proposedChanges = new Map<string, CellState>();

    const startPos = parseCellRef(startRef);
    if (!startPos) {
      throw new Error(`Invalid start reference: ${startRef}`);
    }

    // Build proposed changes
    for (let rowOffset = 0; rowOffset < values.length; rowOffset++) {
      const row = values[rowOffset];
      for (let colOffset = 0; colOffset < row.length; colOffset++) {
        const cellRow = startPos.row + rowOffset;
        const cellCol = startPos.col + colOffset;
        const cellRef = `${colToLetter(cellCol)}${cellRow + 1}`;
        const value = row[colOffset];

        const isFormula = typeof value === 'string' && value.startsWith('=');

        proposedChanges.set(`${sheetId}:${cellRef}`, {
          ref: cellRef,
          value: isFormula ? null : value,
          formula: isFormula ? value : null,
        });
      }
    }

    const endRow = startPos.row + values.length - 1;
    const endCol = startPos.col + (values[0]?.length || 1) - 1;
    const endRef = `${colToLetter(endCol)}${endRow + 1}`;

    return this.createSandbox(
      options.name || `Write to ${startRef}:${endRef}`,
      `Write ${values.length} rows x ${values[0]?.length || 1} columns starting at ${startRef}`,
      proposedChanges,
      {
        createdBy: options.createdBy || 'ai',
        aiConversationId: options.aiConversationId,
        intent: options.intent,
      }
    );
  }

  /**
   * Create sandbox for a single cell change
   */
  createSandboxForCellChange(
    sheetId: string,
    cellRef: string,
    newValue: unknown,
    options: {
      createdBy?: 'ai' | 'user';
      intent?: string;
    } = {}
  ): CreateSandboxResult {
    const isFormula = typeof newValue === 'string' && newValue.startsWith('=');

    const proposedChanges = new Map<string, CellState>();
    proposedChanges.set(`${sheetId}:${cellRef}`, {
      ref: cellRef,
      value: isFormula ? null : newValue,
      formula: isFormula ? newValue : null,
    });

    return this.createSandbox(
      `Update ${cellRef}`,
      `Change value of cell ${cellRef}`,
      proposedChanges,
      {
        createdBy: options.createdBy || 'ai',
        intent: options.intent,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Sandbox Actions
  // ---------------------------------------------------------------------------

  /**
   * Approve a sandbox for merging
   */
  approve(sandboxId: string): Sandbox {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    if (sandbox.status !== 'pending') {
      throw new Error(`Cannot approve sandbox with status: ${sandbox.status}`);
    }

    sandbox.status = 'approved';
    sandbox.updatedAt = new Date();

    this.emitEvent('sandbox_approved', sandboxId);

    return sandbox;
  }

  /**
   * Reject a sandbox
   */
  reject(sandboxId: string, reason?: string): Sandbox {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    if (sandbox.status !== 'pending') {
      throw new Error(`Cannot reject sandbox with status: ${sandbox.status}`);
    }

    sandbox.status = 'rejected';
    sandbox.rejectedAt = new Date();
    sandbox.updatedAt = new Date();

    this.emitEvent('sandbox_rejected', sandboxId, { reason });

    return sandbox;
  }

  /**
   * Merge an approved sandbox
   */
  merge(sandboxId: string): MergeSandboxResult {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      return {
        success: false,
        sandbox: null,
        appliedChanges: 0,
        errors: [`Sandbox not found: ${sandboxId}`],
      };
    }

    // Auto-approve if pending and can auto-apply
    if (
      sandbox.status === 'pending' &&
      sandbox.riskAssessment?.canAutoApply
    ) {
      this.approve(sandboxId);
    }

    if (sandbox.status !== 'approved') {
      return {
        success: false,
        sandbox,
        appliedChanges: 0,
        errors: [`Sandbox must be approved before merging. Current status: ${sandbox.status}`],
      };
    }

    const result = this.mergeEngine.merge(sandbox);

    if (result.success) {
      this.emitEvent('sandbox_merged', sandboxId, {
        appliedChanges: result.appliedChanges,
      });
    }

    return result;
  }

  /**
   * Approve and merge in one step
   */
  approveAndMerge(sandboxId: string): MergeSandboxResult {
    this.approve(sandboxId);
    return this.merge(sandboxId);
  }

  /**
   * Discard a sandbox
   */
  discard(sandboxId: string): Sandbox {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    if (sandbox.status === 'merged') {
      throw new Error('Cannot discard a merged sandbox. Use rollback instead.');
    }

    sandbox.status = 'discarded';
    sandbox.updatedAt = new Date();

    this.emitEvent('sandbox_discarded', sandboxId);

    return sandbox;
  }

  /**
   * Rollback a merged sandbox
   */
  rollback(sandboxId: string): RollbackSandboxResult {
    const sandbox = this.getSandbox(sandboxId);
    if (!sandbox) {
      return {
        success: false,
        sandboxId,
        restoredCells: 0,
        errors: [`Sandbox not found: ${sandboxId}`],
      };
    }

    if (sandbox.status !== 'merged') {
      return {
        success: false,
        sandboxId,
        restoredCells: 0,
        errors: ['Can only rollback merged sandboxes'],
      };
    }

    const result = this.mergeEngine.rollback(sandboxId);

    if (result.success) {
      sandbox.status = 'rolled_back';
      sandbox.updatedAt = new Date();
      this.emitEvent('sandbox_rolled_back', sandboxId, {
        restoredCells: result.restoredCells,
      });
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Sandbox Queries
  // ---------------------------------------------------------------------------

  /**
   * Get a sandbox by ID
   */
  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  /**
   * Get the active sandbox
   */
  getActiveSandbox(): Sandbox | undefined {
    return this.activeSandboxId
      ? this.sandboxes.get(this.activeSandboxId)
      : undefined;
  }

  /**
   * Set the active sandbox
   */
  setActiveSandbox(id: string | null): void {
    this.activeSandboxId = id;
  }

  /**
   * Get all sandboxes
   */
  getAllSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Get sandboxes by status
   */
  getSandboxesByStatus(status: SandboxStatus): Sandbox[] {
    return this.getAllSandboxes().filter((s) => s.status === status);
  }

  /**
   * Get pending sandboxes
   */
  getPendingSandboxes(): Sandbox[] {
    return this.getSandboxesByStatus('pending');
  }

  /**
   * Check if a sandbox can be rolled back
   */
  canRollback(sandboxId: string): boolean {
    return this.mergeEngine.canRollback(sandboxId);
  }

  // ---------------------------------------------------------------------------
  // Event Handling
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to sandbox events
   */
  onEvent(listener: (event: SandboxEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(
    type: SandboxEventType,
    sandboxId: string,
    details?: Record<string, unknown>
  ): void {
    const event: SandboxEvent = {
      type,
      sandboxId,
      timestamp: new Date(),
      details,
    };

    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        loggers.ai.error('Sandbox event listener error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...config };
    this.riskAssessor.updateConfig(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSandboxes();
      this.mergeEngine.cleanupExpiredRollbacks();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredSandboxes(): void {
    const now = new Date();
    const expiryMs = this.config.timeouts.pendingExpiry * 60 * 1000;

    for (const [id, sandbox] of this.sandboxes) {
      if (sandbox.status === 'pending') {
        const age = now.getTime() - sandbox.createdAt.getTime();
        if (age > expiryMs) {
          sandbox.status = 'discarded';
          this.emitEvent('sandbox_discarded', id, { reason: 'timeout' });
        }
      }
    }
  }

  /**
   * Clear all sandboxes (for testing)
   */
  clear(): void {
    this.sandboxes.clear();
    this.activeSandboxId = null;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    pending: number;
    approved: number;
    merged: number;
    rejected: number;
    discarded: number;
  } {
    const all = this.getAllSandboxes();
    return {
      total: all.length,
      pending: all.filter((s) => s.status === 'pending').length,
      approved: all.filter((s) => s.status === 'approved').length,
      merged: all.filter((s) => s.status === 'merged').length,
      rejected: all.filter((s) => s.status === 'rejected').length,
      discarded: all.filter((s) => s.status === 'discarded').length,
    };
  }
}

// Export singleton
export const sandboxManager = new SandboxManager();
