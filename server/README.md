# Excel-as-Matrix Collaboration Server

WebSocket server for real-time collaboration in Excel-as-Matrix.

## Features

- **Real-time cell updates** - CRDT-based conflict resolution
- **User presence** - Cursor tracking and selection sharing
- **Comments** - Collaborative commenting
- **Auto-reconnection** - Handles network failures gracefully
- **Heartbeat monitoring** - Detects and cleans up stale connections

## Installation

```bash
cd server
npm install
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on port 8080 by default. You can change this with the `PORT` environment variable:

```bash
PORT=3001 npm start
```

## Endpoints

- **WebSocket**: `ws://localhost:8080?doc=<documentId>&user=<userId>`
- **Health Check**: `http://localhost:8080/health`

## Message Types

### Client → Server

| Type | Description |
|------|-------------|
| `cell_update` | Update cell value (CRDT operation) |
| `cursor_move` | Update cursor position |
| `selection_change` | Update selection range |
| `comment` | Add/edit comment |
| `ping` | Heartbeat |
| `request_sync` | Request current document state |

### Server → Client

| Type | Description |
|------|-------------|
| `sync` | Full document state sync |
| `user_join` | User joined document |
| `user_leave` | User left document |
| `pong` | Heartbeat response |
| (All client messages are also broadcast) |

## Architecture

### CRDT Implementation

The server uses a simple Last-Write-Wins (LWW) CRDT for conflict resolution:
- Each cell update has a timestamp
- Latest timestamp wins on conflicts
- Vector clocks track operation order per user

### State Management

- **Documents**: In-memory document state per `documentId`
- **History**: Last 1000 messages per document
- **Cleanup**: Empty documents cleaned up after 1 minute

### Scalability

For production deployments with multiple server instances:

1. **Redis Adapter**: Use Redis for pub/sub across servers
2. **Database**: Store document state in PostgreSQL/MongoDB
3. **Load Balancer**: Use sticky sessions or shared state

Example with Redis:
```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

wss.adapter(createAdapter(pubClient, subClient));
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | Server port |
| `NODE_ENV` | development | Environment |
| `HEARTBEAT_INTERVAL` | 30000 | Heartbeat interval (ms) |

## Client Integration

Update the frontend to connect to the collaboration server:

```typescript
// src/config.ts
export const COLLABORATION_SERVER_URL =
  process.env.NODE_ENV === 'production'
    ? 'wss://your-server.com'
    : 'ws://localhost:8080';
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/ ./
EXPOSE 8080
CMD ["node", "index.js"]
```

### Deploy to Render/Railway/Fly.io

1. Push server code to Git repository
2. Create new web service
3. Set build command: `cd server && npm install`
4. Set start command: `node server/index.js`
5. Expose port 8080

## Monitoring

The server logs:
- Connection/disconnection events
- Message types and counts
- Document session info
- Error events

For production, integrate:
- **Logging**: Winston, Pino
- **Metrics**: Prometheus
- **APM**: New Relic, Datadog

## Security

Current implementation is for development. For production:

1. **Authentication**: Verify user tokens
2. **Authorization**: Check document permissions
3. **Rate Limiting**: Prevent DoS attacks
4. **Encryption**: Use WSS (WebSocket Secure)
5. **CORS**: Restrict origins

Example authentication:
```javascript
wss.on('connection', async (ws, req) => {
  const token = query.token;
  const user = await verifyToken(token);
  if (!user) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  // ... rest of connection handler
});
```

## License

Private - All Rights Reserved
