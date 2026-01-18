// Mock Claude API for testing
import { vi } from 'vitest';

export interface MockAIResponse {
  message: string;
  toolCalls: MockToolCall[];
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

export interface MockToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  status?: 'pending' | 'executed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface MockStreamChunk {
  type: 'text' | 'tool' | 'done';
  content: string | MockToolCall;
}

// Default mock responses
const DEFAULT_RESPONSE: MockAIResponse = {
  message: 'Mock response from Claude AI',
  toolCalls: [],
  tokensUsed: {
    input: 100,
    output: 50,
    total: 150,
  },
};

// Configurable mock behavior
let mockResponse = DEFAULT_RESPONSE;
let mockStreamChunks: MockStreamChunk[] = [];
let shouldFail = false;
let failureError = 'Mock API error';

// Mock ClaudeAPIClient
export const mockClaudeAPIClient = {
  sendMessage: vi.fn().mockImplementation(async () => {
    if (shouldFail) {
      throw new Error(failureError);
    }
    return mockResponse;
  }),

  streamMessage: vi.fn().mockImplementation(async function* () {
    if (shouldFail) {
      throw new Error(failureError);
    }

    if (mockStreamChunks.length === 0) {
      // Default streaming behavior
      yield { type: 'text', content: 'Streaming ' };
      yield { type: 'text', content: 'response ' };
      yield { type: 'text', content: 'from Claude.' };
      yield { type: 'done', content: 'Streaming response from Claude.' };
    } else {
      for (const chunk of mockStreamChunks) {
        yield chunk;
      }
    }
  }),

  setApiKey: vi.fn(),
  updateConfig: vi.fn(),
  getConfig: vi.fn().mockReturnValue({
    apiKey: 'mock-api-key',
    model: 'claude-3-sonnet',
    maxTokens: 4096,
    mockMode: true,
  }),
};

// Test helpers to configure mock behavior
export function setMockResponse(response: Partial<MockAIResponse>): void {
  mockResponse = { ...DEFAULT_RESPONSE, ...response };
}

export function setMockStreamChunks(chunks: MockStreamChunk[]): void {
  mockStreamChunks = chunks;
}

export function setMockToFail(error: string = 'Mock API error'): void {
  shouldFail = true;
  failureError = error;
}

export function setMockToSucceed(): void {
  shouldFail = false;
}

export function resetMockClaudeAPI(): void {
  mockResponse = DEFAULT_RESPONSE;
  mockStreamChunks = [];
  shouldFail = false;
  failureError = 'Mock API error';
  mockClaudeAPIClient.sendMessage.mockClear();
  mockClaudeAPIClient.streamMessage.mockClear();
  mockClaudeAPIClient.setApiKey.mockClear();
  mockClaudeAPIClient.updateConfig.mockClear();
}

// Mock the AI tools
export const mockAITools = [
  {
    name: 'read_range',
    description: 'Read values from a cell range',
    requiresApproval: false,
    riskLevel: 'low',
  },
  {
    name: 'write_range',
    description: 'Write values to a cell range',
    requiresApproval: true,
    riskLevel: 'medium',
  },
  {
    name: 'insert_formula',
    description: 'Insert a formula into a cell',
    requiresApproval: true,
    riskLevel: 'low',
  },
  {
    name: 'create_chart',
    description: 'Create a chart from data',
    requiresApproval: true,
    riskLevel: 'medium',
  },
  {
    name: 'format_cells',
    description: 'Apply formatting to cells',
    requiresApproval: false,
    riskLevel: 'low',
  },
];

// Mock tool executor
export const mockToolExecutor = {
  execute: vi.fn().mockImplementation(async (toolCall: MockToolCall) => {
    switch (toolCall.tool) {
      case 'read_range':
        return { values: [[1, 2], [3, 4]] };
      case 'write_range':
        return { success: true, cellsWritten: 4 };
      case 'insert_formula':
        return { success: true, result: 100 };
      case 'create_chart':
        return { success: true, chartId: 'chart-123' };
      case 'format_cells':
        return { success: true };
      default:
        throw new Error(`Unknown tool: ${toolCall.tool}`);
    }
  }),
};

// Export mock class that can be used in place of real ClaudeAPIClient
export class MockClaudeAPIClient {
  private apiKey: string | null = null;
  private config: Record<string, unknown> = {};

  constructor(config?: Record<string, unknown>) {
    this.config = config || {};
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    mockClaudeAPIClient.setApiKey(key);
  }

  updateConfig(config: Record<string, unknown>): void {
    this.config = { ...this.config, ...config };
    mockClaudeAPIClient.updateConfig(config);
  }

  async sendMessage(...args: unknown[]): Promise<MockAIResponse> {
    return mockClaudeAPIClient.sendMessage(...args);
  }

  async *streamMessage(...args: unknown[]): AsyncGenerator<MockStreamChunk> {
    yield* mockClaudeAPIClient.streamMessage(...args);
  }

  getConfig(): Record<string, unknown> {
    return mockClaudeAPIClient.getConfig();
  }
}

export default mockClaudeAPIClient;
