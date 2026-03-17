// ═══════════════════════════════════════════════════════════════════════════
// EXCELAI SERVER — WebSocket Collaboration + AI Proxy
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createNodeWebSocket } from '@hono/node-ws';
import { aiRouter } from './routes/ai';
import { wsManager } from './ws/WebSocketManager';

const app = new Hono();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
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
    const roomId = c.req.param('roomId');
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

// AI routes
app.route('/api/ai', aiRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

const port = parseInt(process.env.PORT || '3001', 10);

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`ExcelAI Server running on http://localhost:${info.port}`);
  console.log(`  WebSocket: ws://localhost:${info.port}/ws/:roomId`);
  console.log(`  AI Proxy:  http://localhost:${info.port}/api/ai/chat`);
});

injectWebSocket(server);
