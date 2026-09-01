import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_CONFIG } from '../../ai/types';
import { AIUnavailableError, ClaudeAPIClient } from '../claudeAPI';

const config = (mockMode = false) => ({ ...DEFAULT_AI_CONFIG, mockMode });
const statusResponse = (configured: boolean) =>
  new Response(JSON.stringify({ configured, model: DEFAULT_AI_CONFIG.model }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('ClaudeAPIClient availability contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fails closed offline and never turns an unconfigured request into a mock answer', async () => {
    vi.mocked(fetch).mockResolvedValue(statusResponse(false));
    const client = new ClaudeAPIClient(config(false));

    await expect(client.getAvailability()).resolves.toMatchObject({
      mode: 'offline',
      transport: null,
    });
    await expect(client.sendMessage([], [], 'system')).rejects.toBeInstanceOf(AIUnavailableError);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/ai/status');
  });

  it('returns simulated output only after demo mode is explicitly enabled', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(statusResponse(false));
    const client = new ClaudeAPIClient(config(true));

    await expect(client.getAvailability()).resolves.toMatchObject({ mode: 'mock' });
    const response = client.sendMessage(
      [{ id: '1', role: 'user', content: 'tổng', timestamp: new Date() }],
      [],
      'system'
    );
    await vi.runAllTimersAsync();
    await expect(response).resolves.toMatchObject({ toolCalls: [] });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('uses the configured server proxy for a live request', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (input === '/api/ai/status') return statusResponse(true);
      if (input === '/api/ai/chat') {
        return new Response(
          JSON.stringify({
            id: 'msg-1',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'Live response' }],
            model: DEFAULT_AI_CONFIG.model,
            stop_reason: 'end_turn',
            usage: { input_tokens: 5, output_tokens: 3 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    const client = new ClaudeAPIClient(config(false));
    await expect(client.getAvailability()).resolves.toMatchObject({
      mode: 'configured',
      transport: 'server-proxy',
    });
    await expect(
      client.sendMessage(
        [{ id: '1', role: 'user', content: 'hello', timestamp: new Date() }],
        [],
        'system'
      )
    ).resolves.toMatchObject({ message: 'Live response', tokensUsed: 8 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
