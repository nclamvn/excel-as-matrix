// ═══════════════════════════════════════════════════════════════════════════
// AI PROXY ROUTES — Claude API Proxy (hides API key server-side)
// ═══════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { streamText } from 'hono/streaming';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export const aiRouter = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat — Non-streaming chat
// ─────────────────────────────────────────────────────────────────────────────

aiRouter.post('/chat', async (c) => {
  if (!ANTHROPIC_API_KEY) {
    return c.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, 500);
  }

  const body = await c.req.json();

  // Validate required fields
  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 4096,
        temperature: body.temperature ?? 0.7,
        system: body.system || '',
        messages: body.messages,
        tools: body.tools || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return c.json({ error: error.error?.message || 'Anthropic API error' }, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('AI proxy error:', error);
    return c.json({ error: 'Failed to reach Anthropic API' }, 502);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/stream — Streaming chat (SSE)
// ─────────────────────────────────────────────────────────────────────────────

aiRouter.post('/stream', async (c) => {
  if (!ANTHROPIC_API_KEY) {
    return c.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, 500);
  }

  const body = await c.req.json();

  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json({ error: 'messages array is required' }, 400);
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 4096,
        temperature: body.temperature ?? 0.7,
        system: body.system || '',
        messages: body.messages,
        tools: body.tools || undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return c.json({ error: error.error?.message || 'Anthropic API error' }, response.status);
    }

    // Pipe the SSE stream directly to the client
    return streamText(c, async (stream) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await stream.write(decoder.decode(value, { stream: true }));
      }
    });
  } catch (error) {
    console.error('AI stream error:', error);
    return c.json({ error: 'Failed to reach Anthropic API' }, 502);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status — Check if AI is configured
// ─────────────────────────────────────────────────────────────────────────────

aiRouter.get('/status', (c) => {
  return c.json({
    configured: !!ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
  });
});
