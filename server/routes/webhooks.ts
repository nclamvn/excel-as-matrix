// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK ROUTES — Receive external HTTP triggers for macro execution
// Supports: generic JSON, Slack incoming webhook format
// ═══════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import crypto from 'crypto';

export const webhookRouter = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface WebhookRegistration {
  id: string;
  macroId: string;
  secret: string;
  createdAt: number;
  lastTriggeredAt: number | null;
  triggerCount: number;
}

interface WebhookEvent {
  webhookId: string;
  macroId: string;
  payload: unknown;
  source: string;
  timestamp: number;
}

// In-memory webhook registry (in production, use database)
const webhookRegistry = new Map<string, WebhookRegistration>();
const pendingEvents: WebhookEvent[] = [];
const MAX_PENDING_EVENTS = 100;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/:webhookId — Receive webhook trigger
// ─────────────────────────────────────────────────────────────────────────────

webhookRouter.post('/:webhookId', async (c) => {
  const webhookId = c.req.param('webhookId');
  const registration = webhookRegistry.get(webhookId);

  if (!registration) {
    return c.json({ error: 'Webhook not found' }, 404);
  }

  // Verify HMAC signature if secret is set
  const signature = c.req.header('x-webhook-signature') || c.req.header('x-hub-signature-256');
  if (registration.secret) {
    const body = await c.req.text();

    if (signature) {
      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', registration.secret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSig) {
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }

    // Re-parse the body since we consumed it
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }

    // Queue the event
    const event: WebhookEvent = {
      webhookId,
      macroId: registration.macroId,
      payload,
      source: c.req.header('user-agent') || 'unknown',
      timestamp: Date.now(),
    };

    pendingEvents.push(event);
    if (pendingEvents.length > MAX_PENDING_EVENTS) {
      pendingEvents.shift(); // Drop oldest
    }

    // Update trigger stats
    registration.lastTriggeredAt = Date.now();
    registration.triggerCount++;

    console.log(`[Webhook] Triggered ${webhookId} → macro ${registration.macroId}`);

    return c.json({
      ok: true,
      webhookId,
      macroId: registration.macroId,
      queuePosition: pendingEvents.length,
    });
  }

  // No secret — accept any payload
  const payload = await c.req.json().catch(() => ({}));

  const event: WebhookEvent = {
    webhookId,
    macroId: registration.macroId,
    payload,
    source: c.req.header('user-agent') || 'unknown',
    timestamp: Date.now(),
  };

  pendingEvents.push(event);
  if (pendingEvents.length > MAX_PENDING_EVENTS) {
    pendingEvents.shift();
  }

  registration.lastTriggeredAt = Date.now();
  registration.triggerCount++;

  return c.json({
    ok: true,
    webhookId,
    macroId: registration.macroId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/:webhookId/slack — Slack-format webhook
// ─────────────────────────────────────────────────────────────────────────────

webhookRouter.post('/:webhookId/slack', async (c) => {
  const webhookId = c.req.param('webhookId');
  const registration = webhookRegistry.get(webhookId);

  if (!registration) {
    return c.json({ error: 'Webhook not found' }, 404);
  }

  // Slack sends application/x-www-form-urlencoded or JSON
  const contentType = c.req.header('content-type') || '';
  let payload: unknown;

  if (contentType.includes('application/json')) {
    payload = await c.req.json();
  } else {
    const text = await c.req.text();
    const params = new URLSearchParams(text);
    payload = Object.fromEntries(params.entries());
  }

  const event: WebhookEvent = {
    webhookId,
    macroId: registration.macroId,
    payload: {
      source: 'slack',
      data: payload,
    },
    source: 'Slack',
    timestamp: Date.now(),
  };

  pendingEvents.push(event);
  registration.lastTriggeredAt = Date.now();
  registration.triggerCount++;

  // Slack expects 200 with optional text
  return c.json({ text: 'Webhook received', response_type: 'ephemeral' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Management endpoints
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/webhooks — Register a new webhook
webhookRouter.post('/', async (c) => {
  const body = await c.req.json();
  const { macroId, secret } = body;

  if (!macroId) {
    return c.json({ error: 'macroId is required' }, 400);
  }

  const id = crypto.randomUUID();

  const registration: WebhookRegistration = {
    id,
    macroId,
    secret: secret || '',
    createdAt: Date.now(),
    lastTriggeredAt: null,
    triggerCount: 0,
  };

  webhookRegistry.set(id, registration);

  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    id,
    url: `${baseUrl}/api/webhooks/${id}`,
    slackUrl: `${baseUrl}/api/webhooks/${id}/slack`,
    macroId,
    hasSecret: !!secret,
  }, 201);
});

// GET /api/webhooks — List registered webhooks
webhookRouter.get('/', (c) => {
  const webhooks = Array.from(webhookRegistry.values()).map((w) => ({
    id: w.id,
    macroId: w.macroId,
    hasSecret: !!w.secret,
    createdAt: w.createdAt,
    lastTriggeredAt: w.lastTriggeredAt,
    triggerCount: w.triggerCount,
  }));

  return c.json({ webhooks });
});

// DELETE /api/webhooks/:webhookId — Remove a webhook
webhookRouter.delete('/:webhookId', (c) => {
  const webhookId = c.req.param('webhookId');

  if (!webhookRegistry.has(webhookId)) {
    return c.json({ error: 'Webhook not found' }, 404);
  }

  webhookRegistry.delete(webhookId);
  return c.json({ ok: true, deleted: webhookId });
});

// GET /api/webhooks/events — Poll pending events (for client-side macro execution)
webhookRouter.get('/events', (c) => {
  const events = [...pendingEvents];
  pendingEvents.length = 0; // Clear after consumption

  return c.json({ events, count: events.length });
});
