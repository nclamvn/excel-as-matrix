// ═══════════════════════════════════════════════════════════════════════════
// CLAUDE API CLIENT — AI Integration
// ═══════════════════════════════════════════════════════════════════════════

import type { AIMessage, AIToolCall, AIConfig, AITool, AIAvailability } from '../ai/types';
import { loggers } from '@/utils/logger';
import { PIIRedactor } from '../security/PIIRedactor';
import { aiUsageLogger } from '../audit/AIUsageLogger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Responses
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, string> = {
  sum: 'Tôi sẽ giúp bạn tính tổng. Dựa trên vùng chọn hiện tại [📍A1:A10], tôi đề xuất formula:\n\n```\n=SUM(A1:A10)\n```\n\nBạn có muốn tôi áp dụng formula này không?',
  average:
    'Để tính trung bình của vùng dữ liệu [📍B1:B20], bạn có thể dùng:\n\n```\n=AVERAGE(B1:B20)\n```\n\nTôi có thể thêm formula này vào ô được chọn.',
  explain:
    'Đây là bảng tính với các cột:\n- Cột A: Tên sản phẩm\n- Cột B: Số lượng\n- Cột C: Đơn giá\n- Cột D: Thành tiền (có thể dùng formula =B*C)\n\nBạn muốn tôi giúp gì thêm?',
  default:
    'Tôi là AI Copilot của ExcelAI. Tôi có thể giúp bạn:\n\n1. **Viết formulas** - SUM, AVERAGE, VLOOKUP...\n2. **Phân tích dữ liệu** - Tìm patterns, outliers\n3. **Định dạng** - Conditional formatting, styles\n4. **Giải thích** - Dependencies, cell references\n\nHãy hỏi tôi bất cứ điều gì về spreadsheet!',
};

function getMockResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('sum') || lowerQuery.includes('tổng')) {
    return MOCK_RESPONSES.sum;
  }
  if (lowerQuery.includes('average') || lowerQuery.includes('trung bình')) {
    return MOCK_RESPONSES.average;
  }
  if (
    lowerQuery.includes('explain') ||
    lowerQuery.includes('giải thích') ||
    lowerQuery.includes('là gì')
  ) {
    return MOCK_RESPONSES.explain;
  }

  return MOCK_RESPONSES.default;
}

function getMockToolCalls(query: string): AIToolCall[] {
  // Deliberately narrow syntax: demo writes are explicit, deterministic, and
  // still travel through preview -> approval -> apply -> rollback.
  const match = query.trim().match(/^demo\s+write\s+([A-Z]+\d+)\s*=\s*(.*)$/i);
  if (!match) return [];
  const rawValue = match[2];
  const numericValue = Number(rawValue);
  const value = rawValue !== '' && Number.isFinite(numericValue) ? numericValue : rawValue;
  return [
    {
      id: crypto.randomUUID(),
      tool: 'write_range',
      arguments: { range: match[1].toUpperCase(), values: [[value]], type: 'value' },
      status: 'pending',
      timestamp: new Date(),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude API Client
// ─────────────────────────────────────────────────────────────────────────────

export class ClaudeAPIClient {
  private apiKey: string | null = null;
  private config: AIConfig;
  private baseUrl = 'https://api.anthropic.com/v1';
  private proxyUrl = '/api/ai'; // Server-side proxy (hides API key)
  private useProxy = false; // Will be set to true when server proxy is available
  private piiRedactor = new PIIRedactor();
  private conversationId = crypto.randomUUID();
  private availability: AIAvailability;
  private availabilityCheck: Promise<AIAvailability>;

  constructor(config: AIConfig) {
    this.config = config;
    this.apiKey = config.apiKey || null;
    this.availability = config.mockMode
      ? { mode: 'mock', transport: null, reason: 'Demo mode was explicitly enabled' }
      : this.apiKey
        ? { mode: 'configured', transport: 'browser-key', reason: 'Browser API key configured' }
        : { mode: 'checking', transport: null, reason: 'Checking server AI configuration' };
    this.availabilityCheck = this.checkProxyAvailability();
  }

  private async checkProxyAvailability(): Promise<AIAvailability> {
    try {
      const response = await fetch(`${this.proxyUrl}/status`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        const data = await response.json();
        this.useProxy = data.configured === true;
        if (this.useProxy) {
          this.config.mockMode = false;
          this.availability = {
            mode: 'configured',
            transport: 'server-proxy',
            reason: 'Server AI proxy configured',
          };
          return this.availability;
        }
      }
    } catch {
      // Resolve below from explicit local configuration.
    }

    this.availability = this.config.mockMode
      ? { mode: 'mock', transport: null, reason: 'Demo mode was explicitly enabled' }
      : this.apiKey
        ? { mode: 'configured', transport: 'browser-key', reason: 'Browser API key configured' }
        : {
            mode: 'offline',
            transport: null,
            reason: 'AI server is unavailable or not configured',
          };
    return this.availability;
  }

  setApiKey(key: string) {
    this.apiKey = key.trim() || null;
    this.config.mockMode = false;
    this.availability = this.apiKey
      ? { mode: 'configured', transport: 'browser-key', reason: 'Browser API key configured' }
      : { mode: 'offline', transport: null, reason: 'AI server is unavailable or not configured' };
  }

  updateConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
    if (this.useProxy) {
      this.availability = {
        mode: 'configured',
        transport: 'server-proxy',
        reason: 'Server AI proxy configured',
      };
    } else if (this.config.mockMode) {
      this.availability = {
        mode: 'mock',
        transport: null,
        reason: 'Demo mode was explicitly enabled',
      };
    } else if (this.apiKey) {
      this.availability = {
        mode: 'configured',
        transport: 'browser-key',
        reason: 'Browser API key configured',
      };
    } else {
      this.availability = {
        mode: 'offline',
        transport: null,
        reason: 'AI server is unavailable or not configured',
      };
    }
  }

  async getAvailability(): Promise<AIAvailability> {
    await this.availabilityCheck;
    return { ...this.availability };
  }

  async refreshAvailability(): Promise<AIAvailability> {
    if (!this.config.mockMode && !this.apiKey) {
      this.availability = {
        mode: 'checking',
        transport: null,
        reason: 'Checking server AI configuration',
      };
    }
    this.availabilityCheck = this.checkProxyAvailability();
    return this.getAvailability();
  }

  /** Returns true if either API key is set or server proxy is configured */
  get isReady(): boolean {
    return this.availability.mode === 'configured';
  }

  private async requireAvailable(): Promise<AIAvailability> {
    const availability = await this.getAvailability();
    if (availability.mode === 'offline') {
      throw new AIUnavailableError(availability.reason);
    }
    return availability;
  }

  // Convert our tools to Claude format
  private toolsToClaude(tools: AITool[]): ClaudeToolDefinition[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters.reduce(
          (acc, param) => ({
            ...acc,
            [param.name]: {
              type: param.type,
              description: param.description,
            },
          }),
          {}
        ),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    }));
  }

  // Send message to Claude
  async sendMessage(
    messages: AIMessage[],
    tools: AITool[],
    systemPrompt: string
  ): Promise<{
    message: string;
    toolCalls: AIToolCall[];
    tokensUsed: number;
  }> {
    const availability = await this.requireAvailable();
    if (availability.mode === 'mock') {
      const lastMessage = messages[messages.length - 1];
      const mockResponse = getMockResponse(lastMessage?.content || '');
      const mockToolCalls = getMockToolCalls(lastMessage?.content || '');

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

      return {
        message: mockToolCalls.length
          ? 'Demo write proposal created. Review the exact before/after values in Actions.'
          : mockResponse,
        toolCalls: mockToolCalls,
        tokensUsed: Math.floor(Math.random() * 500) + 100,
      };
    }

    // Real API call — use server proxy when available, direct API otherwise
    const startTime = Date.now();
    try {
      const claudeMessages: ClaudeMessage[] = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // PII Redaction — mask sensitive data before sending to API
      const { messages: redactedMessages, totalRedactions } =
        this.piiRedactor.redactMessages(claudeMessages);
      const redactedSystemPrompt = this.piiRedactor.redactSystemPrompt(systemPrompt);

      if (totalRedactions > 0 || redactedSystemPrompt.hasRedactions) {
        loggers.api.info(
          `PII redacted: ${totalRedactions + redactedSystemPrompt.matches.length} items before API call`
        );
      }

      const requestBody = {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: redactedSystemPrompt.text,
        messages: redactedMessages,
        tools: this.toolsToClaude(tools),
      };

      let response: Response;

      if (this.useProxy) {
        // Use server proxy (API key is server-side)
        response = await fetch(`${this.proxyUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Direct API call (API key in browser — less secure)
        response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey!,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data: ClaudeResponse = await response.json();

      // Extract text and tool calls
      let messageText = '';
      const toolCalls: AIToolCall[] = [];

      for (const block of data.content) {
        if (block.type === 'text' && block.text) {
          messageText += block.text;
        } else if (block.type === 'tool_use' && block.id && block.name && block.input) {
          toolCalls.push({
            id: block.id,
            tool: block.name as AIToolCall['tool'],
            arguments: block.input,
            status: 'pending',
            timestamp: new Date(),
          });
        }
      }

      // Restore PII tokens in AI response so user sees original data
      messageText = this.piiRedactor.restoreResponse(messageText);

      const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;
      const durationMs = Date.now() - startTime;
      const totalPII = totalRedactions + redactedSystemPrompt.matches.length;

      // Log AI usage
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      aiUsageLogger
        .logChat({
          conversationId: this.conversationId,
          inputLength: typeof lastUserMsg === 'string' ? lastUserMsg.length : 0,
          outputLength: messageText.length,
          tokensUsed,
          durationMs,
          piiRedacted: totalPII,
          streaming: false,
          status: 'success',
        })
        .catch(() => {
          /* non-blocking */
        });

      return {
        message: messageText,
        toolCalls,
        tokensUsed,
      };
    } catch (error) {
      loggers.api.error('Claude API error:', error);

      // Log failed request
      aiUsageLogger
        .logChat({
          conversationId: this.conversationId,
          inputLength: 0,
          outputLength: 0,
          tokensUsed: 0,
          durationMs: Date.now() - startTime,
          piiRedacted: 0,
          streaming: false,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .catch(() => {
          /* non-blocking */
        });

      throw error;
    }
  }

  // Stream message (for real-time responses)
  async *streamMessage(
    messages: AIMessage[],
    tools: AITool[],
    systemPrompt: string
  ): AsyncGenerator<{ type: 'text' | 'tool'; content: string | AIToolCall }> {
    const availability = await this.requireAvailable();
    if (availability.mode === 'mock') {
      const lastMessage = messages[messages.length - 1];
      const query = lastMessage?.content || '';
      const toolCalls = getMockToolCalls(query);
      const mockResponse = toolCalls.length
        ? 'Demo write proposal created. Review the exact before/after values in Actions.'
        : getMockResponse(query);

      // Stream character by character with small delays
      for (const char of mockResponse) {
        await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 20));
        yield { type: 'text', content: char };
      }
      for (const toolCall of toolCalls) {
        yield { type: 'tool', content: toolCall };
      }
      return;
    }

    // Real streaming implementation would go here
    // For now, fall back to non-streaming
    const result = await this.sendMessage(messages, tools, systemPrompt);
    yield { type: 'text', content: result.message };

    for (const toolCall of result.toolCalls) {
      yield { type: 'tool', content: toolCall };
    }
  }
}

export class AIUnavailableError extends Error {
  readonly code = 'AI_UNAVAILABLE';

  constructor(message = 'AI is unavailable or not configured') {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt
// ─────────────────────────────────────────────────────────────────────────────

export const AI_SYSTEM_PROMPT = `Bạn là AI Copilot của ExcelAI 2026, một ứng dụng bảng tính hiện đại.

## Vai trò
- Giúp user làm việc hiệu quả với spreadsheet
- Viết formulas, phân tích dữ liệu, định dạng
- Giải thích các dependencies và cell references

## Quy tắc Grounding
- Luôn trích dẫn nguồn dữ liệu với notation [📍CellAddress]
- Ví dụ: "Dựa trên [📍A1:A10], tổng là 1000"
- Không bao giờ đoán giá trị - luôn đọc từ spreadsheet

## Tools có sẵn
- read_range: Đọc giá trị và formulas
- write_range: Ghi giá trị (cần approval nếu >10 cells)
- get_dependencies: Xem cell phụ thuộc vào đâu
- search_cells: Tìm kiếm trong spreadsheet
- propose_action: Đề xuất thay đổi cần user approve

## Phong cách
- Trả lời ngắn gọn, rõ ràng
- Sử dụng tiếng Việt khi user hỏi tiếng Việt
- Cung cấp code/formula trong markdown code blocks
- Luôn confirm trước khi thực hiện thay đổi lớn

## Confidence Levels
- Sử dụng "Tôi chắc chắn..." cho facts từ spreadsheet
- Sử dụng "Tôi đề xuất..." cho suggestions
- Sử dụng "Tôi không chắc..." khi cần thêm thông tin`;

// Export singleton for easy use
export const createClaudeClient = (config: AIConfig) => new ClaudeAPIClient(config);
