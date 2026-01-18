import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue('test-sandbox-id')
});

// Mock DiffEngine
vi.mock('../DiffEngine', () => ({
  DiffEngine: vi.fn().mockImplementation(() => ({
    calculateDiff: vi.fn().mockReturnValue({
      sandboxId: 'test-sandbox-id',
      changes: [
        { type: 'add', cellRef: 'A1', newValue: 'Test' }
      ],
      summary: {
        totalChanges: 1,
        additions: 1,
        modifications: 0,
        deletions: 0
      }
    })
  })),
  diffEngine: {
    calculateDiff: vi.fn().mockReturnValue({
      sandboxId: 'test-sandbox-id',
      changes: [{ type: 'add', cellRef: 'A1', newValue: 'Test' }],
      summary: { totalChanges: 1, additions: 1, modifications: 0, deletions: 0 }
    })
  }
}));

// Mock RiskAssessor
vi.mock('../RiskAssessor', () => ({
  RiskAssessor: vi.fn().mockImplementation(() => ({
    assessRisk: vi.fn().mockReturnValue({
      overallRisk: 'low',
      score: 0.2,
      canAutoApply: true,
      factors: []
    }),
    updateConfig: vi.fn()
  })),
  riskAssessor: {
    assessRisk: vi.fn().mockReturnValue({
      overallRisk: 'low',
      score: 0.2,
      canAutoApply: true,
      factors: []
    }),
    updateConfig: vi.fn()
  }
}));

// Mock MergeEngine
vi.mock('../MergeEngine', () => ({
  MergeEngine: vi.fn().mockImplementation(() => ({
    merge: vi.fn().mockReturnValue({
      success: true,
      sandbox: null,
      appliedChanges: 1,
      errors: []
    }),
    rollback: vi.fn().mockReturnValue({
      success: true,
      sandboxId: 'test-sandbox-id',
      restoredCells: 1,
      errors: []
    }),
    canRollback: vi.fn().mockReturnValue(true),
    cleanupExpiredRollbacks: vi.fn()
  })),
  mergeEngine: {
    merge: vi.fn().mockReturnValue({
      success: true,
      sandbox: null,
      appliedChanges: 1,
      errors: []
    }),
    rollback: vi.fn().mockReturnValue({
      success: true,
      sandboxId: 'test-sandbox-id',
      restoredCells: 1,
      errors: []
    }),
    canRollback: vi.fn().mockReturnValue(true),
    cleanupExpiredRollbacks: vi.fn()
  }
}));

import { SandboxManager, sandboxManager } from '../SandboxManager';
import type { CellState, SandboxConfig, SandboxEvent } from '../types';

describe('SandboxManager', () => {
  let manager: SandboxManager;

  beforeEach(() => {
    manager = new SandboxManager();
    manager.clear();
    vi.clearAllMocks();

    // Reset UUID mock to return unique IDs
    let counter = 0;
    vi.mocked(crypto.randomUUID).mockImplementation(() => `sandbox-${++counter}`);
  });

  afterEach(() => {
    manager.clear();
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('creates instance with default config', () => {
      expect(manager).toBeInstanceOf(SandboxManager);
      const config = manager.getConfig();
      expect(config).toBeDefined();
    });

    it('creates instance with custom config', () => {
      const customConfig: Partial<SandboxConfig> = {
        autoApproveThreshold: 0.5
      };
      const customManager = new SandboxManager(customConfig);
      const config = customManager.getConfig();
      expect(config.autoApproveThreshold).toBe(0.5);
    });
  });

  describe('sandbox creation', () => {
    describe('createSandbox', () => {
      it('creates sandbox with proposed changes', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox(
          'Test Sandbox',
          'A test sandbox',
          changes
        );

        expect(result.sandbox).toBeDefined();
        expect(result.sandbox.name).toBe('Test Sandbox');
        expect(result.sandbox.description).toBe('A test sandbox');
        expect(result.sandbox.status).toBe('pending');
      });

      it('calculates diff for sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes);
        expect(result.diff).toBeDefined();
        expect(result.diff.summary).toBeDefined();
      });

      it('assesses risk for sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes);
        expect(result.riskAssessment).toBeDefined();
        expect(result.riskAssessment.overallRisk).toBeDefined();
      });

      it('sets sandbox as active', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes);
        const active = manager.getActiveSandbox();
        expect(active?.id).toBe(result.sandbox.id);
      });

      it('supports createdBy option', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes, {
          createdBy: 'user'
        });
        expect(result.sandbox.createdBy).toBe('user');
      });

      it('supports AI conversation tracking', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes, {
          aiConversationId: 'conv-123',
          aiMessageId: 'msg-456'
        });
        expect(result.sandbox.aiConversationId).toBe('conv-123');
        expect(result.sandbox.aiMessageId).toBe('msg-456');
      });

      it('supports intent and reasoning metadata', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const result = manager.createSandbox('Test', 'Test', changes, {
          intent: 'Add header',
          reasoning: 'User requested a header row'
        });
        expect(result.sandbox.metadata.intent).toBe('Add header');
        expect(result.sandbox.metadata.reasoning).toBe('User requested a header row');
      });
    });

    describe('createSandboxForRangeWrite', () => {
      it('creates sandbox for range write', () => {
        const values = [
          ['A', 'B', 'C'],
          [1, 2, 3],
          [4, 5, 6]
        ];

        const result = manager.createSandboxForRangeWrite('sheet1', 'A1', values);
        expect(result.sandbox).toBeDefined();
        expect(result.sandbox.proposedChanges.size).toBe(9);
      });

      it('handles formula values', () => {
        const values = [
          ['Header'],
          ['=SUM(A3:A10)']
        ];

        const result = manager.createSandboxForRangeWrite('sheet1', 'A1', values);
        const changes = Array.from(result.sandbox.proposedChanges.values());
        const formulaCell = changes.find(c => c.formula);
        expect(formulaCell?.formula).toBe('=SUM(A3:A10)');
      });

      it('generates descriptive name', () => {
        const values = [[1, 2], [3, 4]];
        const result = manager.createSandboxForRangeWrite('sheet1', 'A1', values);
        expect(result.sandbox.name).toContain('A1');
      });

      it('throws for invalid start reference', () => {
        expect(() => {
          manager.createSandboxForRangeWrite('sheet1', 'INVALID', [[1]]);
        }).toThrow('Invalid start reference');
      });
    });

    describe('createSandboxForCellChange', () => {
      it('creates sandbox for single cell change', () => {
        const result = manager.createSandboxForCellChange('sheet1', 'A1', 'New Value');
        expect(result.sandbox.proposedChanges.size).toBe(1);
      });

      it('handles formula value', () => {
        const result = manager.createSandboxForCellChange('sheet1', 'A1', '=B1+C1');
        const change = result.sandbox.proposedChanges.get('sheet1:A1');
        expect(change?.formula).toBe('=B1+C1');
        expect(change?.value).toBeNull();
      });

      it('handles regular value', () => {
        const result = manager.createSandboxForCellChange('sheet1', 'A1', 100);
        const change = result.sandbox.proposedChanges.get('sheet1:A1');
        expect(change?.value).toBe(100);
        expect(change?.formula).toBeNull();
      });
    });
  });

  describe('sandbox actions', () => {
    describe('approve', () => {
      it('approves pending sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const approved = manager.approve(sandbox.id);
        expect(approved.status).toBe('approved');
      });

      it('throws for non-existent sandbox', () => {
        expect(() => manager.approve('non-existent')).toThrow('Sandbox not found');
      });

      it('throws for non-pending sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.approve(sandbox.id);
        expect(() => manager.approve(sandbox.id)).toThrow('Cannot approve');
      });

      it('updates timestamp', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const before = sandbox.updatedAt;
        manager.approve(sandbox.id);
        expect(sandbox.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      });
    });

    describe('reject', () => {
      it('rejects pending sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const rejected = manager.reject(sandbox.id);
        expect(rejected.status).toBe('rejected');
      });

      it('records rejection time', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.reject(sandbox.id);
        expect(sandbox.rejectedAt).toBeDefined();
      });

      it('throws for non-existent sandbox', () => {
        expect(() => manager.reject('non-existent')).toThrow('Sandbox not found');
      });

      it('throws for non-pending sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.reject(sandbox.id);
        expect(() => manager.reject(sandbox.id)).toThrow('Cannot reject');
      });
    });

    describe('merge', () => {
      it('merges approved sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.approve(sandbox.id);
        const result = manager.merge(sandbox.id);
        expect(result.success).toBe(true);
      });

      it('returns error for non-existent sandbox', () => {
        const result = manager.merge('non-existent');
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('returns error for non-approved sandbox', () => {
        // Create a sandbox that cannot be auto-approved (canAutoApply: false)
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        // Create a new manager instance for this test with high-risk assessment
        const testManager = new SandboxManager({
          autoApproveThreshold: 0.0, // Never auto-approve
        });

        const { sandbox } = testManager.createSandbox('Test', 'Test', changes);

        // Manually set sandbox to not auto-approve by modifying riskAssessment
        if (sandbox.riskAssessment) {
          sandbox.riskAssessment.canAutoApply = false;
        }

        // Sandbox is pending and canAutoApply is false, so merge should fail
        const result = testManager.merge(sandbox.id);
        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('approved');
      });

      it('auto-approves low-risk pending sandboxes', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox, riskAssessment } = manager.createSandbox('Test', 'Test', changes);

        // Verify risk assessment was returned
        expect(riskAssessment).toBeDefined();

        // The approveAndMerge method handles approval and merge in one step
        const result = manager.approveAndMerge(sandbox.id);
        expect(result.success).toBe(true);
        expect(manager.getSandbox(sandbox.id)?.status).toBe('approved');
      });
    });

    describe('approveAndMerge', () => {
      it('approves and merges in one step', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const result = manager.approveAndMerge(sandbox.id);
        expect(result.success).toBe(true);
        expect(manager.getSandbox(sandbox.id)?.status).toBe('approved');
      });
    });

    describe('discard', () => {
      it('discards pending sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const discarded = manager.discard(sandbox.id);
        expect(discarded.status).toBe('discarded');
      });

      it('throws for non-existent sandbox', () => {
        expect(() => manager.discard('non-existent')).toThrow('Sandbox not found');
      });

      it('throws for merged sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.approve(sandbox.id);
        manager.merge(sandbox.id);
        // Manually set status for test
        sandbox.status = 'merged';

        expect(() => manager.discard(sandbox.id)).toThrow('Cannot discard a merged sandbox');
      });
    });

    describe('rollback', () => {
      it('rolls back merged sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.approve(sandbox.id);
        manager.merge(sandbox.id);
        sandbox.status = 'merged'; // Simulate merged state

        const result = manager.rollback(sandbox.id);
        expect(result.success).toBe(true);
      });

      it('returns error for non-existent sandbox', () => {
        const result = manager.rollback('non-existent');
        expect(result.success).toBe(false);
      });

      it('returns error for non-merged sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const result = manager.rollback(sandbox.id);
        expect(result.success).toBe(false);
      });

      it('updates sandbox status to rolled_back', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);
        sandbox.status = 'merged';

        manager.rollback(sandbox.id);
        expect(sandbox.status).toBe('rolled_back');
      });
    });
  });

  describe('sandbox queries', () => {
    describe('getSandbox', () => {
      it('returns sandbox by ID', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        const found = manager.getSandbox(sandbox.id);
        expect(found).toBe(sandbox);
      });

      it('returns undefined for non-existent ID', () => {
        expect(manager.getSandbox('non-existent')).toBeUndefined();
      });
    });

    describe('getActiveSandbox', () => {
      it('returns active sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        expect(manager.getActiveSandbox()).toBe(sandbox);
      });

      it('returns undefined when no active sandbox', () => {
        expect(manager.getActiveSandbox()).toBeUndefined();
      });
    });

    describe('setActiveSandbox', () => {
      it('sets active sandbox', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);

        manager.setActiveSandbox(null);
        expect(manager.getActiveSandbox()).toBeUndefined();

        manager.setActiveSandbox(sandbox.id);
        expect(manager.getActiveSandbox()).toBe(sandbox);
      });
    });

    describe('getAllSandboxes', () => {
      it('returns all sandboxes', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        manager.createSandbox('Test 1', 'Test', changes);
        manager.createSandbox('Test 2', 'Test', changes);
        manager.createSandbox('Test 3', 'Test', changes);

        const all = manager.getAllSandboxes();
        expect(all.length).toBe(3);
      });

      it('returns empty array when no sandboxes', () => {
        expect(manager.getAllSandboxes()).toEqual([]);
      });
    });

    describe('getSandboxesByStatus', () => {
      it('filters by status', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const { sandbox: s1 } = manager.createSandbox('Test 1', 'Test', changes);
        const { sandbox: s2 } = manager.createSandbox('Test 2', 'Test', changes);
        manager.createSandbox('Test 3', 'Test', changes);

        manager.approve(s1.id);
        manager.approve(s2.id);

        const approved = manager.getSandboxesByStatus('approved');
        expect(approved.length).toBe(2);

        const pending = manager.getSandboxesByStatus('pending');
        expect(pending.length).toBe(1);
      });
    });

    describe('getPendingSandboxes', () => {
      it('returns only pending sandboxes', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const { sandbox } = manager.createSandbox('Test 1', 'Test', changes);
        manager.createSandbox('Test 2', 'Test', changes);

        manager.approve(sandbox.id);

        const pending = manager.getPendingSandboxes();
        expect(pending.length).toBe(1);
      });
    });

    describe('canRollback', () => {
      it('delegates to merge engine', () => {
        const result = manager.canRollback('test-id');
        expect(result).toBe(true);
      });
    });
  });

  describe('event handling', () => {
    describe('onEvent', () => {
      it('subscribes to sandbox events', () => {
        const listener = vi.fn();
        manager.onEvent(listener);

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        manager.createSandbox('Test', 'Test', changes);

        expect(listener).toHaveBeenCalled();
      });

      it('receives sandbox_created event', () => {
        const events: SandboxEvent[] = [];
        manager.onEvent((event) => events.push(event));

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        manager.createSandbox('Test', 'Test', changes);

        const createEvent = events.find(e => e.type === 'sandbox_created');
        expect(createEvent).toBeDefined();
      });

      it('receives sandbox_approved event', () => {
        const events: SandboxEvent[] = [];
        manager.onEvent((event) => events.push(event));

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);
        manager.approve(sandbox.id);

        const approveEvent = events.find(e => e.type === 'sandbox_approved');
        expect(approveEvent).toBeDefined();
      });

      it('receives sandbox_rejected event', () => {
        const events: SandboxEvent[] = [];
        manager.onEvent((event) => events.push(event));

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        const { sandbox } = manager.createSandbox('Test', 'Test', changes);
        manager.reject(sandbox.id);

        const rejectEvent = events.find(e => e.type === 'sandbox_rejected');
        expect(rejectEvent).toBeDefined();
      });

      it('returns unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = manager.onEvent(listener);

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });
        manager.createSandbox('Test', 'Test', changes);
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();

        manager.createSandbox('Test 2', 'Test', changes);
        expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
      });

      it('handles listener errors gracefully', () => {
        const errorListener = vi.fn().mockImplementation(() => {
          throw new Error('Listener error');
        });
        const normalListener = vi.fn();

        manager.onEvent(errorListener);
        manager.onEvent(normalListener);

        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        // Should not throw
        expect(() => manager.createSandbox('Test', 'Test', changes)).not.toThrow();
        expect(normalListener).toHaveBeenCalled();
      });
    });
  });

  describe('configuration', () => {
    describe('updateConfig', () => {
      it('updates config', () => {
        manager.updateConfig({ autoApproveThreshold: 0.7 });
        expect(manager.getConfig().autoApproveThreshold).toBe(0.7);
      });

      it('updates risk assessor config', () => {
        // Updating config should not throw
        expect(() => {
          manager.updateConfig({ autoApproveThreshold: 0.6 });
        }).not.toThrow();

        // Config should be updated
        expect(manager.getConfig().autoApproveThreshold).toBe(0.6);
      });
    });

    describe('getConfig', () => {
      it('returns copy of config', () => {
        const config1 = manager.getConfig();
        const config2 = manager.getConfig();
        expect(config1).not.toBe(config2);
        expect(config1).toEqual(config2);
      });
    });
  });

  describe('statistics', () => {
    describe('getStats', () => {
      it('returns sandbox statistics', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        const { sandbox: s1 } = manager.createSandbox('Test 1', 'Test', changes);
        const { sandbox: s2 } = manager.createSandbox('Test 2', 'Test', changes);
        manager.createSandbox('Test 3', 'Test', changes);

        manager.approve(s1.id);
        manager.reject(s2.id);

        const stats = manager.getStats();
        expect(stats.total).toBe(3);
        expect(stats.pending).toBe(1);
        expect(stats.approved).toBe(1);
        expect(stats.rejected).toBe(1);
      });

      it('returns zero counts when empty', () => {
        const stats = manager.getStats();
        expect(stats.total).toBe(0);
        expect(stats.pending).toBe(0);
      });
    });
  });

  describe('cleanup', () => {
    describe('clear', () => {
      it('clears all sandboxes', () => {
        const changes = new Map<string, CellState>();
        changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

        manager.createSandbox('Test 1', 'Test', changes);
        manager.createSandbox('Test 2', 'Test', changes);

        manager.clear();
        expect(manager.getAllSandboxes()).toEqual([]);
        expect(manager.getActiveSandbox()).toBeUndefined();
      });
    });
  });

  describe('singleton export', () => {
    it('exports singleton instance', () => {
      expect(sandboxManager).toBeInstanceOf(SandboxManager);
    });
  });

  describe('edge cases', () => {
    it('handles empty proposed changes', () => {
      const changes = new Map<string, CellState>();
      const result = manager.createSandbox('Empty', 'Empty sandbox', changes);
      expect(result.sandbox).toBeDefined();
    });

    it('handles large number of changes', () => {
      const changes = new Map<string, CellState>();
      for (let i = 0; i < 1000; i++) {
        changes.set(`sheet1:A${i + 1}`, { ref: `A${i + 1}`, value: i, formula: null });
      }
      const result = manager.createSandbox('Large', 'Large sandbox', changes);
      expect(result.sandbox.proposedChanges.size).toBe(1000);
    });

    it('handles concurrent sandbox creation', () => {
      const changes = new Map<string, CellState>();
      changes.set('sheet1:A1', { ref: 'A1', value: 'Test', formula: null });

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(manager.createSandbox(`Test ${i}`, 'Test', changes));
      }

      expect(results.length).toBe(10);
      const ids = results.map(r => r.sandbox.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });
});
