// ═══════════════════════════════════════════════════════════════════════════
// EXCELAI SERVER — WebSocket Collaboration + AI Proxy
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createNodeWebSocket } from '@hono/node-ws';
import { serverConfig } from './config/env.js';
import { toProxyErrorStatus } from './http/upstreamStatus.js';
import { aiRouter } from './routes/ai.js';
import { webhookRouter } from './routes/webhooks.js';
import { billingRouter } from './routes/billing.js';
import { scimRouter } from './routes/scim.js';
import { complianceRouter } from './routes/compliance.js';
import { wsManager } from './ws/WebSocketManager.js';

const app = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: serverConfig.corsOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket Setup
// ─────────────────────────────────────────────────────────────────────────────

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// WebSocket endpoint for real-time collaboration
app.get(
  '/ws/:roomId',
  upgradeWebSocket((c) => {
    const roomId = c.req.param('roomId') || '';
    const userId = c.req.query('userId') || 'anonymous';
    const userName = c.req.query('userName') || 'Anonymous';

    return {
      onOpen(_event, ws) {
        wsManager.handleConnection(roomId, userId, userName, ws);
      },
      onMessage(event, ws) {
        try {
          const data = JSON.parse(String(event.data));
          wsManager.handleMessage(roomId, userId, data, ws);
        } catch {
          // Ignore malformed messages
        }
      },
      onClose() {
        wsManager.handleDisconnect(roomId, userId);
      },
    };
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Google Sheets proxy — fetches public sheet as xlsx to avoid CORS
app.get('/api/google-sheets-proxy', async (c) => {
  const spreadsheetId = c.req.query('spreadsheetId');
  if (!spreadsheetId || !/^[a-zA-Z0-9_-]+$/.test(spreadsheetId)) {
    return c.json({ error: 'Invalid spreadsheet ID' }, 400);
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

  try {
    const response = await fetch(exportUrl, { redirect: 'follow' });

    if (!response.ok) {
      const status = response.status === 401 || response.status === 403
        ? 403
        : toProxyErrorStatus(response.status);
      return c.json(
        { error: status === 403 ? 'Sheet is not public' : `Google returned ${response.status}` },
        status
      );
    }

    const buffer = await response.arrayBuffer();
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', 'attachment; filename="google-sheet.xlsx"');
    return c.body(buffer);
  } catch (err) {
    return c.json({ error: `Proxy error: ${err instanceof Error ? err.message : 'unknown'}` }, 500);
  }
});

// AI routes
app.route('/api/ai', aiRouter);

// Webhook routes
app.route('/api/webhooks', webhookRouter);

// Billing routes (Stripe)
app.route('/api/billing', billingRouter);

// SCIM 2.0 provisioning
app.route('/scim/v2', scimRouter);

// Compliance / SOC2 health checks
app.route('/api/compliance', complianceRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

const server = serve({ fetch: app.fetch, port: serverConfig.port }, (info) => {
  console.log(`ExcelAI Server running on http://localhost:${info.port}`);
  console.log(`  WebSocket: ws://localhost:${info.port}/ws/:roomId`);
  console.log(`  AI Proxy:  http://localhost:${info.port}/api/ai/chat`);
});

injectWebSocket(server);
