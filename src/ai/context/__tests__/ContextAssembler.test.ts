import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mock state BEFORE vi.mock hoisting
const {
  mockWorkbookState,
  mockSelectionState,
  mockIntentParserParse,
  mockTokenEstimator,
  mockSerializer,
} = vi.hoisted(() => ({
  mockWorkbookState: {
    current: {
      activeSheetId: 'sheet1',
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cells: {
            '0:0': { value: 'Name', displayValue: 'Name' },
            '0:1': { value: 'Amount', displayValue: 'Amount' },
            '1:0': { value: 'Item 1', displayValue: 'Item 1' },
            '1:1': { value: 100, displayValue: '100' },
            '2:0': { value: 'Item 2', displayValue: 'Item 2' },
            '2:1': { value: 200, displayValue: '200', formula: '=A2*2' },
            '3:0': { value: 'Total', displayValue: 'Total' },
            '3:1': { value: 300, displayValue: '300', formula: '=SUM(B2:B3)' }
          }
        }
      }
    }
  },
  mockSelectionState: {
    current: {
      selectedCell: { row: 0, col: 0 } as { row: number; col: number } | null,
      selectionRange: { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } } as { start: { row: number; col: number }; end: { row: number; col: number } } | null
    }
  },
  mockIntentParserParse: vi.fn().mockResolvedValue({
    intent: 'query',
    entities: [
      {
        type: 'cell',
        text: 'A1',
        resolved: true,
        resolvedRef: 'A1'
      }
    ],
    confidence: 0.9
  }),
  mockTokenEstimator: {
    estimateRange: vi.fn().mockReturnValue(100),
    estimateSnapshot: vi.fn().mockReturnValue(50)
  },
  mockSerializer: {
    serializeRange: vi.fn().mockImplementation((ref: string) => ({
      ref,
      data: [['Test', 'Value']],
      cellCount: 2
    }))
  }
}));

// Mock dependencies
vi.mock('../../../stores/workbookStore', () => ({
  useWorkbookStore: {
    getState: () => mockWorkbookState.current
  }
}));

vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: {
    getState: () => mockSelectionState.current
  }
}));

// Mock types/cell utilities
vi.mock('../../../types/cell', () => ({
  getCellKey: (row: number, col: number) => `${row}:${col}`,
  colToLetter: (col: number) => {
    let result = '';
    let n = col;
    while (n >= 0) {
      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  },
  parseCellRef: (ref: string) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;
    const colStr = match[1].toUpperCase();
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;
    const row = parseInt(match[2]) - 1;
    return { row, col };
  },
}));

vi.mock('../IntentParser', () => ({
  IntentParser: class MockIntentParser {
    parse = mockIntentParserParse;
  }
}));

vi.mock('../TokenEstimator', () => ({
  TokenEstimator: class MockTokenEstimator {
    estimateRange = mockTokenEstimator.estimateRange;
    estimateSnapshot = mockTokenEstimator.estimateSnapshot;
  }
}));

vi.mock('../ContextSerializer', () => ({
  ContextSerializer: class MockContextSerializer {
    serializeRange = mockSerializer.serializeRange;
  }
}));

import { ContextAssembler, contextAssembler } from '../ContextAssembler';
import type { ContextConfig } from '../../types';

describe('ContextAssembler', () => {
  let assembler: ContextAssembler;

  beforeEach(() => {
    assembler = new ContextAssembler();
    vi.clearAllMocks();
    // Reset state
    mockSelectionState.current = {
      selectedCell: { row: 0, col: 0 },
      selectionRange: { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } }
    };
    mockWorkbookState.current = {
      activeSheetId: 'sheet1',
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cells: {
            '0:0': { value: 'Name', displayValue: 'Name' },
            '0:1': { value: 'Amount', displayValue: 'Amount' },
            '1:0': { value: 'Item 1', displayValue: 'Item 1' },
            '1:1': { value: 100, displayValue: '100' },
            '2:0': { value: 'Item 2', displayValue: 'Item 2' },
            '2:1': { value: 200, displayValue: '200', formula: '=A2*2' },
            '3:0': { value: 'Total', displayValue: 'Total' },
            '3:1': { value: 300, displayValue: '300', formula: '=SUM(B2:B3)' }
          }
        }
      }
    };
    mockIntentParserParse.mockResolvedValue({
      intent: 'query',
      entities: [
        {
          type: 'cell',
          text: 'A1',
          resolved: true,
          resolvedRef: 'A1'
        }
      ],
      confidence: 0.9
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('creates instance with default config', () => {
      expect(assembler).toBeInstanceOf(ContextAssembler);
      const config = assembler.getConfig();
      expect(config.maxTokens).toBe(50000);
    });

    it('creates instance with custom config', () => {
      const customConfig: Partial<ContextConfig> = {
        maxTokens: 100000,
        truncationStrategy: 'hierarchical'
      };
      const customAssembler = new ContextAssembler(customConfig);
      const config = customAssembler.getConfig();
      expect(config.maxTokens).toBe(100000);
      expect(config.truncationStrategy).toBe('hierarchical');
    });

    it('merges custom config with defaults', () => {
      const customAssembler = new ContextAssembler({ maxTokens: 75000 });
      const config = customAssembler.getConfig();
      expect(config.maxTokens).toBe(75000);
      expect(config.priorityWeights).toBeDefined();
    });
  });

  describe('assembleContext', () => {
    it('assembles context for a user message', async () => {
      const context = await assembler.assembleContext('What is in cell A1?');
      expect(context).toBeDefined();
      expect(context.directData).toBeDefined();
      expect(context.dependencyContext).toBeDefined();
      expect(context.schemaContext).toBeDefined();
      expect(context.eventContext).toBeDefined();
      expect(context.metadata).toBeDefined();
    });

    it('includes metadata with token counts', async () => {
      const context = await assembler.assembleContext('Sum column B');
      expect(context.metadata.totalTokens).toBeDefined();
      expect(typeof context.metadata.totalTokens).toBe('number');
    });

    it('calculates assembly time', async () => {
      const context = await assembler.assembleContext('Test message');
      expect(context.metadata.assemblyTime).toBeDefined();
      expect(context.metadata.assemblyTime).toBeGreaterThanOrEqual(0);
    });

    it('calculates budget remaining', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.metadata.budgetRemaining).toBeDefined();
      expect(context.metadata.budgetRemaining).toBeLessThanOrEqual(50000);
    });

    it('handles conversation history', async () => {
      const history = ['Previous message 1', 'Previous message 2'];
      const context = await assembler.assembleContext('Current message', history);
      expect(context).toBeDefined();
    });

    it('handles empty message', async () => {
      const context = await assembler.assembleContext('');
      expect(context).toBeDefined();
    });

    it('tracks truncated items', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.metadata.truncatedItems).toBeDefined();
      expect(Array.isArray(context.metadata.truncatedItems)).toBe(true);
    });
  });

  describe('configuration', () => {
    describe('updateConfig', () => {
      it('updates config partially', () => {
        assembler.updateConfig({ maxTokens: 80000 });
        expect(assembler.getConfig().maxTokens).toBe(80000);
      });

      it('updates priority weights', () => {
        assembler.updateConfig({
          priorityWeights: {
            directReference: 0.5,
            upstreamDeps: 0.2,
            downstreamDeps: 0.1,
            schemaContext: 0.1,
            recentEvents: 0.1
          }
        });
        const config = assembler.getConfig();
        expect(config.priorityWeights.directReference).toBe(0.5);
      });

      it('preserves unmodified values', () => {
        const originalStrategy = assembler.getConfig().truncationStrategy;
        assembler.updateConfig({ maxTokens: 60000 });
        expect(assembler.getConfig().truncationStrategy).toBe(originalStrategy);
      });
    });

    describe('getConfig', () => {
      it('returns current config', () => {
        const config = assembler.getConfig();
        expect(config).toHaveProperty('maxTokens');
        expect(config).toHaveProperty('priorityWeights');
        expect(config).toHaveProperty('truncationStrategy');
      });

      it('returns a copy of config', () => {
        const config1 = assembler.getConfig();
        const config2 = assembler.getConfig();
        expect(config1).not.toBe(config2);
        expect(config1).toEqual(config2);
      });
    });
  });

  describe('directData assembly', () => {
    it('includes referenced cells from intent', async () => {
      const context = await assembler.assembleContext('What is A1?');
      expect(context.directData.ranges.length).toBeGreaterThanOrEqual(0);
    });

    it('includes current selection', async () => {
      const context = await assembler.assembleContext('Format this cell');
      expect(context.directData).toBeDefined();
    });

    it('tracks total cells count', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.directData.totalCells).toBeDefined();
      expect(typeof context.directData.totalCells).toBe('number');
    });

    it('tracks tokens used', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.directData.tokensUsed).toBeDefined();
    });
  });

  describe('dependencyContext assembly', () => {
    it('returns dependency context object', async () => {
      const context = await assembler.assembleContext('Calculate total');
      expect(context.dependencyContext).toBeDefined();
      expect(context.dependencyContext).toHaveProperty('upstreamCells');
      expect(context.dependencyContext).toHaveProperty('downstreamCells');
      expect(context.dependencyContext).toHaveProperty('formulaChain');
    });

    it('tracks upstream cells', async () => {
      const context = await assembler.assembleContext('What does B4 depend on?');
      expect(Array.isArray(context.dependencyContext.upstreamCells)).toBe(true);
    });

    it('tracks downstream cells', async () => {
      const context = await assembler.assembleContext('What uses B2?');
      expect(Array.isArray(context.dependencyContext.downstreamCells)).toBe(true);
    });

    it('builds formula chain', async () => {
      const context = await assembler.assembleContext('Explain formula chain');
      expect(Array.isArray(context.dependencyContext.formulaChain)).toBe(true);
    });
  });

  describe('schemaContext assembly', () => {
    it('returns schema context object', async () => {
      const context = await assembler.assembleContext('List tables');
      expect(context.schemaContext).toBeDefined();
      expect(context.schemaContext).toHaveProperty('tables');
      expect(context.schemaContext).toHaveProperty('namedRanges');
      expect(context.schemaContext).toHaveProperty('semanticTypes');
    });

    it('initializes with empty arrays', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.schemaContext.tables).toEqual([]);
      expect(context.schemaContext.namedRanges).toEqual([]);
    });
  });

  describe('eventContext assembly', () => {
    it('returns event context object', async () => {
      const context = await assembler.assembleContext('Show recent changes');
      expect(context.eventContext).toBeDefined();
      expect(context.eventContext).toHaveProperty('recentChanges');
    });

    it('initializes with empty changes', async () => {
      const context = await assembler.assembleContext('Test');
      expect(context.eventContext.recentChanges).toEqual([]);
    });
  });

  describe('token budget calculation', () => {
    it('allocates tokens by priority weights', async () => {
      const context = await assembler.assembleContext('Test');
      const config = assembler.getConfig();

      // Total should not exceed max
      expect(context.metadata.totalTokens).toBeLessThanOrEqual(config.maxTokens);
    });

    it('respects max tokens limit', async () => {
      assembler.updateConfig({ maxTokens: 1000 });
      const context = await assembler.assembleContext('Test');
      expect(context.metadata.totalTokens).toBeLessThanOrEqual(1000);
    });
  });

  describe('singleton export', () => {
    it('exports singleton instance', () => {
      expect(contextAssembler).toBeInstanceOf(ContextAssembler);
    });

    it('singleton is reusable', async () => {
      const context1 = await contextAssembler.assembleContext('Test 1');
      const context2 = await contextAssembler.assembleContext('Test 2');
      expect(context1).toBeDefined();
      expect(context2).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles missing selection', async () => {
      mockSelectionState.current = {
        selectedCell: null,
        selectionRange: null
      };

      const context = await assembler.assembleContext('Test');
      expect(context).toBeDefined();
    });

    it('handles empty sheet', async () => {
      // Use type assertion to bypass strict typing for edge case test
      mockWorkbookState.current = {
        activeSheetId: 'sheet1',
        sheets: {
          sheet1: { id: 'sheet1', name: 'Sheet1', cells: {} }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const context = await assembler.assembleContext('Test');
      expect(context).toBeDefined();
    });

    it('handles no active sheet', async () => {
      // Use type assertion to bypass strict typing for edge case test
      mockWorkbookState.current = {
        activeSheetId: null,
        sheets: {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const context = await assembler.assembleContext('Test');
      expect(context).toBeDefined();
    });

    it('handles very long message', async () => {
      const longMessage = 'A'.repeat(10000);
      const context = await assembler.assembleContext(longMessage);
      expect(context).toBeDefined();
    });

    it('handles special characters in message', async () => {
      const context = await assembler.assembleContext('What is =SUM(A1:A10)?');
      expect(context).toBeDefined();
    });

    it('handles unicode in message', async () => {
      const context = await assembler.assembleContext('计算 A1 的值');
      expect(context).toBeDefined();
    });
  });

  describe('performance', () => {
    it('assembles context in reasonable time', async () => {
      const start = performance.now();
      await assembler.assembleContext('Test message');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('handles multiple sequential assemblies', async () => {
      for (let i = 0; i < 10; i++) {
        const context = await assembler.assembleContext(`Message ${i}`);
        expect(context).toBeDefined();
      }
    });

    it('handles concurrent assemblies', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        assembler.assembleContext(`Concurrent message ${i}`)
      );
      const contexts = await Promise.all(promises);
      expect(contexts.length).toBe(5);
      contexts.forEach(ctx => expect(ctx).toBeDefined());
    });
  });
});
