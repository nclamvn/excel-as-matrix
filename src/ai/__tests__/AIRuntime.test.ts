import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the ClaudeAPIClient service
vi.mock('../../services/claudeAPI', () => ({
  ClaudeAPIClient: class MockClaudeAPIClient {
    apiKey: string | null = null;
    setApiKey = vi.fn().mockImplementation(function(this: { apiKey: string | null }, key: string) {
      this.apiKey = key;
    });
    hasApiKey = vi.fn().mockReturnValue(true);
    updateConfig = vi.fn();
    sendMessage = vi.fn().mockResolvedValue({
      message: 'Hello! How can I help?',
      tokensUsed: 150,
      toolCalls: []
    });
    streamMessage = vi.fn().mockImplementation(async function* () {
      yield { type: 'text', content: 'Streaming ' };
      yield { type: 'text', content: 'response' };
    });
  },
  AI_SYSTEM_PROMPT: 'You are a helpful assistant.'
}));

// Mock AI tools
vi.mock('../tools', () => ({
  AI_TOOLS: [
    { name: 'read_cell', requiresApproval: false, riskLevel: 'low' },
    { name: 'write_range', requiresApproval: true, riskLevel: 'medium' },
  ],
  AIToolExecutor: class MockAIToolExecutor {
    execute = vi.fn().mockResolvedValue({ success: true, data: 'executed' });
  }
}));

// Mock workbook store
vi.mock('../../stores/workbookStore', () => ({
  useWorkbookStore: {
    getState: vi.fn().mockReturnValue({
      activeSheetId: 'sheet1',
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cells: {
            '0-0': { value: 'Name', displayValue: 'Name' },
            '0-1': { value: 'Amount', displayValue: 'Amount' },
            '1-0': { value: 'Item 1', displayValue: 'Item 1' },
            '1-1': { value: 100, displayValue: '100' }
          }
        }
      },
      getCell: vi.fn().mockReturnValue({ value: 'Test', displayValue: 'Test' }),
      getCellRange: vi.fn().mockReturnValue([
        [{ value: 'A', displayValue: 'A' }, { value: 'B', displayValue: 'B' }],
        [{ value: 1, displayValue: '1' }, { value: 2, displayValue: '2' }]
      ])
    })
  }
}));

// Mock selection store
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: {
    getState: vi.fn().mockReturnValue({
      selectedCell: { row: 0, col: 0 },
      selectionRange: { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } }
    })
  }
}));

// Mock context assembler
vi.mock('../context/ContextAssembler', () => ({
  ContextAssembler: class MockContextAssembler {
    assembleContext = vi.fn().mockResolvedValue({
      directData: { ranges: [], totalCells: 0, tokensUsed: 0 },
      dependencyContext: { upstreamCells: [], downstreamCells: [], formulaChain: [], tokensUsed: 0 },
      schemaContext: { tables: [], namedRanges: [], semanticTypes: [], tokensUsed: 0 },
      eventContext: { recentChanges: [], tokensUsed: 0 },
      metadata: { totalTokens: 0, budgetRemaining: 50000, truncatedItems: [], warnings: [], assemblyTime: 1 }
    });
  }
}));

// Mock grounding manager
vi.mock('../grounding/GroundingManager', () => ({
  GroundingManager: class MockGroundingManager {
    createDirectReadClaim = vi.fn().mockReturnValue({
      id: 'claim-1',
      groundingType: 'direct_read',
      statement: 'test',
      source: { type: 'cell', ref: 'A1', valueAtRead: 'Test', readTimestamp: new Date() },
      confidence: 1.0,
      verified: false
    });
    createComputedClaim = vi.fn().mockReturnValue({
      id: 'claim-2',
      groundingType: 'computed',
      statement: 'test',
      source: { type: 'formula_eval', ref: 'A1:A10', valueAtRead: 100, readTimestamp: new Date() },
      confidence: 1.0,
      verified: false
    });
    createInferredClaim = vi.fn().mockReturnValue({
      id: 'claim-3',
      groundingType: 'inferred',
      statement: 'test',
      source: { type: 'cell', ref: 'A1', valueAtRead: null, readTimestamp: new Date() },
      confidence: 0.8,
      verified: false
    });
    verifyClaim = vi.fn().mockResolvedValue({ valid: true });
    verifyAllClaims = vi.fn().mockResolvedValue([{ valid: true }]);
    generateReport = vi.fn().mockReturnValue({
      totalClaims: 1,
      verified: 1,
      unverified: 0,
      byType: { direct_read: 1 }
    });
    getClaims = vi.fn().mockReturnValue([]);
    clear = vi.fn();
  }
}));

// Mock source tracker
vi.mock('../grounding/SourceTracker', () => ({
  SourceTracker: class MockSourceTracker {
    trackCellRead = vi.fn();
    trackRangeRead = vi.fn();
    trackFormulaEval = vi.fn();
    getChangedSources = vi.fn().mockReturnValue([]);
    getStats = vi.fn().mockReturnValue({ cellReads: 0, rangeReads: 0, formulaEvals: 0 });
    clear = vi.fn();
  }
}));

import { AIRuntime, getAIRuntime, resetAIRuntime } from '../AIRuntime';
import type { AIConfig } from '../types';

describe('AIRuntime', () => {
  let runtime: AIRuntime;

  beforeEach(() => {
    resetAIRuntime();
    runtime = new AIRuntime();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetAIRuntime();
  });

  describe('constructor', () => {
    it('creates instance with default config', () => {
      expect(runtime).toBeInstanceOf(AIRuntime);
      const config = runtime.getConfig();
      expect(config).toBeDefined();
    });

    it('creates instance with custom config', () => {
      const customConfig: Partial<AIConfig> = {
        model: 'claude-3-opus-20240229',
        maxTokens: 2048,
        temperature: 0.5
      };
      const customRuntime = new AIRuntime(customConfig);
      const config = customRuntime.getConfig();
      expect(config.model).toBe('claude-3-opus-20240229');
      expect(config.maxTokens).toBe(2048);
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('configuration', () => {
    describe('setApiKey', () => {
      it('sets the API key', () => {
        runtime.setApiKey('sk-ant-test-key');
        // API key is internal, verify it doesn't throw
        expect(() => runtime.setApiKey('sk-ant-another-key')).not.toThrow();
      });

      it('handles empty API key', () => {
        expect(() => runtime.setApiKey('')).not.toThrow();
      });
    });

    describe('updateConfig', () => {
      it('updates config partially', () => {
        runtime.updateConfig({ temperature: 0.8 });
        expect(runtime.getConfig().temperature).toBe(0.8);
      });

      it('updates multiple config values', () => {
        runtime.updateConfig({
          model: 'claude-3-haiku-20240307',
          maxTokens: 1024,
          temperature: 0.3
        });
        const config = runtime.getConfig();
        expect(config.model).toBe('claude-3-haiku-20240307');
        expect(config.maxTokens).toBe(1024);
        expect(config.temperature).toBe(0.3);
      });

      it('preserves unmodified config values', () => {
        const originalModel = runtime.getConfig().model;
        runtime.updateConfig({ temperature: 0.9 });
        expect(runtime.getConfig().model).toBe(originalModel);
      });
    });

    describe('getConfig', () => {
      it('returns current config', () => {
        const config = runtime.getConfig();
        expect(config).toHaveProperty('model');
        expect(config).toHaveProperty('maxTokens');
        expect(config).toHaveProperty('temperature');
      });

      it('returns a copy, not the original', () => {
        const config1 = runtime.getConfig();
        const config2 = runtime.getConfig();
        expect(config1).not.toBe(config2);
        expect(config1).toEqual(config2);
      });
    });
  });

  describe('conversation management', () => {
    describe('startConversation', () => {
      it('starts a new conversation', () => {
        const conversation = runtime.startConversation();
        expect(conversation).toBeDefined();
        expect(conversation.id).toBeDefined();
        expect(typeof conversation.id).toBe('string');
      });

      it('generates unique conversation IDs', () => {
        const conv1 = runtime.startConversation();
        runtime.clearConversation();
        const conv2 = runtime.startConversation();
        expect(conv1.id).not.toBe(conv2.id);
      });

      it('returns conversation with empty messages', () => {
        const conversation = runtime.startConversation();
        expect(conversation.messages).toBeDefined();
        expect(Array.isArray(conversation.messages)).toBe(true);
        expect(conversation.messages.length).toBe(0);
      });

      it('includes context in conversation', () => {
        const conversation = runtime.startConversation();
        expect(conversation.context).toBeDefined();
      });
    });

    describe('getConversation', () => {
      it('returns conversation after starting', () => {
        runtime.startConversation();
        const conversation = runtime.getConversation();
        expect(conversation).toBeDefined();
        expect(conversation?.id).toBeDefined();
      });

      it('returns null when no conversation', () => {
        const conversation = runtime.getConversation();
        expect(conversation).toBeNull();
      });

      it('returns conversation with messages', () => {
        runtime.startConversation();
        const conversation = runtime.getConversation();
        expect(conversation?.messages).toBeDefined();
        expect(Array.isArray(conversation?.messages)).toBe(true);
      });
    });

    describe('clearConversation', () => {
      it('clears conversation', () => {
        runtime.startConversation();
        runtime.clearConversation();
        const conversation = runtime.getConversation();
        expect(conversation).toBeNull();
      });

      it('handles clearing when no conversation exists', () => {
        expect(() => runtime.clearConversation()).not.toThrow();
      });
    });
  });

  describe('message handling', () => {
    describe('sendMessage', () => {
      it('sends message and receives response', async () => {
        runtime.setApiKey('sk-ant-test');
        const response = await runtime.sendMessage('Hello');
        expect(response).toBeDefined();
      });

      it('auto-starts conversation if none exists', async () => {
        runtime.setApiKey('sk-ant-test');
        await runtime.sendMessage('Hello');
        const conversation = runtime.getConversation();
        expect(conversation).not.toBeNull();
      });

      it('adds user message to conversation', async () => {
        runtime.setApiKey('sk-ant-test');
        await runtime.sendMessage('Hello');
        const conversation = runtime.getConversation();
        const userMessages = conversation?.messages.filter(m => m.role === 'user');
        expect(userMessages?.length).toBeGreaterThan(0);
      });

      it('adds assistant response to conversation', async () => {
        runtime.setApiKey('sk-ant-test');
        await runtime.sendMessage('Hello');
        const conversation = runtime.getConversation();
        const assistantMessages = conversation?.messages.filter(m => m.role === 'assistant');
        expect(assistantMessages?.length).toBeGreaterThan(0);
      });

      it('returns assistant message with content', async () => {
        runtime.setApiKey('sk-ant-test');
        const response = await runtime.sendMessage('Hello');
        expect(response.role).toBe('assistant');
        expect(response.content).toBeDefined();
      });
    });

    describe('streamMessage', () => {
      it('streams message response', async () => {
        runtime.setApiKey('sk-ant-test');
        const chunks: string[] = [];

        for await (const chunk of runtime.streamMessage('Hello')) {
          if (chunk.type === 'text') {
            chunks.push(chunk.content as string);
          }
        }

        expect(chunks.length).toBeGreaterThan(0);
      });

      it('yields content chunks', async () => {
        runtime.setApiKey('sk-ant-test');
        let hasContent = false;

        for await (const chunk of runtime.streamMessage('Hello')) {
          if (chunk.type === 'text' && chunk.content) {
            hasContent = true;
          }
        }

        expect(hasContent).toBe(true);
      });

      it('auto-starts conversation if none exists', async () => {
        runtime.setApiKey('sk-ant-test');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _chunk of runtime.streamMessage('Hello')) {
          // consume stream
        }
        const conversation = runtime.getConversation();
        expect(conversation).not.toBeNull();
      });
    });
  });

  describe('action management', () => {
    describe('getPendingActions', () => {
      it('returns empty array initially', () => {
        const actions = runtime.getPendingActions();
        expect(actions).toEqual([]);
      });

      it('returns array type', () => {
        runtime.startConversation();
        const actions = runtime.getPendingActions();
        expect(Array.isArray(actions)).toBe(true);
      });
    });

    describe('approveAction', () => {
      it('returns false when no conversation', async () => {
        const result = await runtime.approveAction('action_1');
        expect(result).toBe(false);
      });

      it('returns false for non-existent action', async () => {
        runtime.startConversation();
        const result = await runtime.approveAction('non-existent');
        expect(result).toBe(false);
      });
    });

    describe('rejectAction', () => {
      it('returns false when no conversation', async () => {
        const result = await runtime.rejectAction('action_1');
        expect(result).toBe(false);
      });

      it('returns false for non-existent action', async () => {
        runtime.startConversation();
        const result = await runtime.rejectAction('non-existent');
        expect(result).toBe(false);
      });
    });

    describe('getHistory', () => {
      it('returns action history', () => {
        runtime.startConversation();
        const history = runtime.getHistory();
        expect(Array.isArray(history)).toBe(true);
      });

      it('returns empty array when no conversation', () => {
        const history = runtime.getHistory();
        expect(history).toEqual([]);
      });
    });
  });

  describe('context assembly', () => {
    describe('assembleContext', () => {
      it('assembles context for a message', async () => {
        const context = await runtime.assembleContext('What is in cell A1?');
        expect(context).toBeDefined();
      });

      it('stores last assembled context', async () => {
        await runtime.assembleContext('Test message');
        const lastContext = runtime.getLastAssembledContext();
        expect(lastContext).toBeDefined();
      });
    });

    describe('getLastAssembledContext', () => {
      it('returns null before any assembly', () => {
        const context = runtime.getLastAssembledContext();
        expect(context).toBeNull();
      });

      it('returns last assembled context', async () => {
        await runtime.assembleContext('Test');
        const context = runtime.getLastAssembledContext();
        expect(context).toBeDefined();
      });
    });

    describe('getContextAssembler', () => {
      it('returns context assembler instance', () => {
        const assembler = runtime.getContextAssembler();
        expect(assembler).toBeDefined();
      });
    });
  });

  describe('grounding system', () => {
    describe('trackCellRead', () => {
      it('tracks cell read operation', () => {
        expect(() => runtime.trackCellRead('A1')).not.toThrow();
      });

      it('accepts sheet name parameter', () => {
        expect(() => runtime.trackCellRead('A1', 'Sheet1')).not.toThrow();
      });
    });

    describe('trackRangeRead', () => {
      it('tracks range read operation', () => {
        expect(() => runtime.trackRangeRead('A1:B2')).not.toThrow();
      });

      it('accepts sheet name parameter', () => {
        expect(() => runtime.trackRangeRead('A1:B2', 'Sheet1')).not.toThrow();
      });
    });

    describe('createDirectReadClaim', () => {
      it('creates direct read claim', () => {
        const claim = runtime.createDirectReadClaim('Cell A1 contains Test', 'A1', 'Test');
        expect(claim).toBeDefined();
        expect(claim.groundingType).toBe('direct_read');
      });

      it('accepts sheet name parameter', () => {
        const claim = runtime.createDirectReadClaim('Cell A1 contains Test', 'A1', 'Test', 'Sheet1');
        expect(claim).toBeDefined();
      });
    });

    describe('createComputedClaim', () => {
      it('creates computed claim', () => {
        const claim = runtime.createComputedClaim(
          'Sum is 100',
          '=SUM(A1:A10)',
          100,
          ['A1:A10']
        );
        expect(claim).toBeDefined();
        expect(claim.groundingType).toBe('computed');
      });

      it('includes source cells', () => {
        const claim = runtime.createComputedClaim(
          'Result is 15',
          '=A1+B1',
          15,
          ['A1', 'B1']
        );
        expect(claim).toBeDefined();
      });
    });

    describe('createInferredClaim', () => {
      it('creates inferred claim', () => {
        const claim = runtime.createInferredClaim(
          'Trend is increasing',
          'Based on data pattern',
          ['A1:A10 shows growth']
        );
        expect(claim).toBeDefined();
        expect(claim.groundingType).toBe('inferred');
      });
    });

    describe('verifyClaim', () => {
      it('verifies a claim', async () => {
        const result = await runtime.verifyClaim('claim-1');
        expect(result).toBeDefined();
        expect(result).toHaveProperty('valid');
      });
    });

    describe('verifyAllClaims', () => {
      it('verifies all claims', async () => {
        const results = await runtime.verifyAllClaims();
        expect(Array.isArray(results)).toBe(true);
      });
    });

    describe('getGroundingReport', () => {
      it('generates grounding report', () => {
        const report = runtime.getGroundingReport();
        expect(report).toBeDefined();
        expect(report).toHaveProperty('totalClaims');
      });

      it('includes verification summary', () => {
        const report = runtime.getGroundingReport();
        expect(report).toHaveProperty('verified');
        expect(report).toHaveProperty('unverified');
      });
    });

    describe('getClaims', () => {
      it('returns claims array', () => {
        const claims = runtime.getClaims();
        expect(Array.isArray(claims)).toBe(true);
      });
    });

    describe('clearGrounding', () => {
      it('clears grounding data', () => {
        expect(() => runtime.clearGrounding()).not.toThrow();
      });

      it('clears last assembled context', async () => {
        await runtime.assembleContext('Test');
        runtime.clearGrounding();
        const context = runtime.getLastAssembledContext();
        expect(context).toBeNull();
      });
    });

    describe('getChangedSources', () => {
      it('returns changed sources', () => {
        const changed = runtime.getChangedSources();
        expect(Array.isArray(changed)).toBe(true);
      });
    });

    describe('getSourceTrackerStats', () => {
      it('returns stats object', () => {
        const stats = runtime.getSourceTrackerStats();
        expect(stats).toBeDefined();
      });
    });

    describe('getGroundingManager', () => {
      it('returns grounding manager instance', () => {
        const manager = runtime.getGroundingManager();
        expect(manager).toBeDefined();
      });
    });

    describe('getSourceTracker', () => {
      it('returns source tracker instance', () => {
        const tracker = runtime.getSourceTracker();
        expect(tracker).toBeDefined();
      });
    });
  });

  describe('singleton export', () => {
    describe('getAIRuntime', () => {
      it('returns singleton instance', () => {
        const instance1 = getAIRuntime();
        const instance2 = getAIRuntime();
        expect(instance1).toBe(instance2);
      });

      it('returns AIRuntime instance', () => {
        const instance = getAIRuntime();
        expect(instance).toBeInstanceOf(AIRuntime);
      });
    });

    describe('resetAIRuntime', () => {
      it('resets singleton instance', () => {
        const instance1 = getAIRuntime();
        resetAIRuntime();
        const instance2 = getAIRuntime();
        expect(instance1).not.toBe(instance2);
      });

      it('clears all state', () => {
        const instance = getAIRuntime();
        instance.startConversation();
        resetAIRuntime();
        const newInstance = getAIRuntime();
        expect(newInstance.getConversation()).toBeNull();
      });
    });
  });

  describe('error handling', () => {
    it('handles errors in sendMessage gracefully', async () => {
      runtime.setApiKey('sk-ant-test');
      // Even with mock, should not throw
      const response = await runtime.sendMessage('Hello');
      expect(response).toBeDefined();
    });
  });
});
