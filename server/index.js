// =============================================================================
// EXCEL-AS-MATRIX WEBSOCKET SERVER
// Handles real-time collaboration for spreadsheets
// =============================================================================

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

const PORT = process.env.PORT || 8080;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

class CollaborationServer {
  constructor() {
    // Map of documentId -> Set of clients
    this.documents = new Map();

    // Map of documentId -> document state (CRDT data)
    this.documentState = new Map();

    // Map of userId -> presence info
    this.userPresence = new Map();

    // Message history for sync
    this.messageHistory = new Map();
  }

  /**
   * Add client to document session
   */
  addClient(documentId, client) {
    if (!this.documents.has(documentId)) {
      this.documents.set(documentId, new Set());
      this.documentState.set(documentId, { cells: {}, vectorClock: {} });
      this.messageHistory.set(documentId, []);
    }

    this.documents.get(documentId).add(client);

    console.log(`[Server] Client joined document ${documentId}. Total clients: ${this.documents.get(documentId).size}`);
  }

  /**
   * Remove client from document session
   */
  removeClient(documentId, client) {
    const clients = this.documents.get(documentId);
    if (clients) {
      clients.delete(client);

      if (clients.size === 0) {
        // Cleanup empty sessions after delay
        setTimeout(() => {
          if (this.documents.get(documentId)?.size === 0) {
            this.documents.delete(documentId);
            this.documentState.delete(documentId);
            this.messageHistory.delete(documentId);
            console.log(`[Server] Cleaned up empty document ${documentId}`);
          }
        }, 60000); // Keep state for 1 minute after last client leaves
      }

      console.log(`[Server] Client left document ${documentId}. Remaining: ${clients.size}`);
    }
  }

  /**
   * Broadcast message to all clients in document except sender
   */
  broadcast(documentId, message, sender) {
    const clients = this.documents.get(documentId);
    if (!clients) return;

    const messageStr = JSON.stringify(message);

    clients.forEach((client) => {
      if (client !== sender && client.readyState === 1) { // 1 = OPEN
        client.send(messageStr);
      }
    });
  }

  /**
   * Send message to specific client
   */
  sendTo(client, message) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Store message in history
   */
  addToHistory(documentId, message) {
    const history = this.messageHistory.get(documentId);
    if (history) {
      history.push(message);

      // Keep only last 1000 messages
      if (history.length > 1000) {
        history.shift();
      }
    }
  }

  /**
   * Apply CRDT operation to document state
   */
  applyOperation(documentId, operation) {
    const state = this.documentState.get(documentId);
    if (!state) return;

    // Simple LWW (Last-Write-Wins) CRDT
    const { cellKey, value, timestamp, userId } = operation;

    const currentCell = state.cells[cellKey];
    if (!currentCell || timestamp > currentCell.timestamp) {
      state.cells[cellKey] = {
        value,
        timestamp,
        userId,
      };
    }

    // Update vector clock
    state.vectorClock[userId] = (state.vectorClock[userId] || 0) + 1;
  }

  /**
   * Get current document state
   */
  getDocumentState(documentId) {
    return this.documentState.get(documentId) || { cells: {}, vectorClock: {} };
  }

  /**
   * Update user presence
   */
  updatePresence(userId, documentId, presence) {
    this.userPresence.set(userId, {
      ...presence,
      documentId,
      lastSeen: Date.now(),
    });
  }

  /**
   * Get all users in document
   */
  getDocumentUsers(documentId) {
    const users = [];
    this.userPresence.forEach((presence, userId) => {
      if (presence.documentId === documentId) {
        users.push({ userId, ...presence });
      }
    });
    return users;
  }
}

// =============================================================================
// SERVER SETUP
// =============================================================================

const server = new CollaborationServer();

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      documents: server.documents.size,
      timestamp: Date.now()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Excel-as-Matrix Collaboration Server\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer });

// =============================================================================
// WEBSOCKET HANDLERS
// =============================================================================

wss.on('connection', (ws, req) => {
  const { query } = parse(req.url, true);
  const documentId = query.doc;
  const userId = query.user;

  if (!documentId || !userId) {
    ws.close(1008, 'Missing documentId or userId');
    return;
  }

  console.log(`[Server] New connection: user=${userId}, doc=${documentId}`);

  // Store metadata on connection
  ws.documentId = documentId;
  ws.userId = userId;
  ws.isAlive = true;

  // Add client to document
  server.addClient(documentId, ws);

  // Send current document state
  const currentState = server.getDocumentState(documentId);
  server.sendTo(ws, {
    type: 'sync',
    payload: {
      state: currentState,
      users: server.getDocumentUsers(documentId),
    },
  });

  // Notify others of new user
  server.broadcast(documentId, {
    type: 'user_join',
    userId,
    timestamp: Date.now(),
  }, ws);

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (error) {
      console.error('[Server] Failed to parse message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`[Server] Connection closed: user=${userId}, doc=${documentId}`);

    server.removeClient(documentId, ws);

    // Notify others of user leaving
    server.broadcast(documentId, {
      type: 'user_leave',
      userId,
      timestamp: Date.now(),
    }, ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[Server] WebSocket error for user ${userId}:`, error);
  });

  // Pong for heartbeat
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

/**
 * Handle incoming messages
 */
function handleMessage(ws, message) {
  const { type, payload } = message;
  const { documentId, userId } = ws;

  console.log(`[Server] Message from ${userId}: ${type}`);

  switch (type) {
    case 'cell_update':
      // CRDT operation
      server.applyOperation(documentId, payload);
      server.addToHistory(documentId, message);

      // Broadcast to other clients
      server.broadcast(documentId, message, ws);
      break;

    case 'cursor_move':
      // Update presence
      server.updatePresence(userId, documentId, payload);

      // Broadcast cursor position
      server.broadcast(documentId, message, ws);
      break;

    case 'selection_change':
      // Broadcast selection
      server.broadcast(documentId, message, ws);
      break;

    case 'comment':
      // Store and broadcast comment
      server.addToHistory(documentId, message);
      server.broadcast(documentId, message, ws);
      break;

    case 'ping':
      // Respond to heartbeat
      server.sendTo(ws, { type: 'pong', timestamp: Date.now() });
      break;

    case 'request_sync':
      // Send current state
      const state = server.getDocumentState(documentId);
      server.sendTo(ws, {
        type: 'sync',
        payload: {
          state,
          users: server.getDocumentUsers(documentId),
        },
      });
      break;

    default:
      // Unknown message type - just broadcast
      server.broadcast(documentId, message, ws);
  }
}

// =============================================================================
// HEARTBEAT
// =============================================================================

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`[Server] Terminating stale connection: ${ws.userId}`);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeat);
});

// =============================================================================
// START SERVER
// =============================================================================

httpServer.listen(PORT, () => {
  console.log(`[Server] Excel-as-Matrix Collaboration Server running on port ${PORT}`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');

  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');

  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});
