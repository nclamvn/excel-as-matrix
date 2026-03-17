// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET MANAGER — Room-based real-time collaboration
// ═══════════════════════════════════════════════════════════════════════════

import type { WSContext } from 'hono/ws';

interface RoomMember {
  userId: string;
  userName: string;
  ws: WSContext;
  cursor?: { row: number; col: number };
  joinedAt: number;
}

interface Room {
  id: string;
  members: Map<string, RoomMember>;
  createdAt: number;
}

export type WSMessageType =
  | 'join'
  | 'leave'
  | 'cell_update'
  | 'cursor_move'
  | 'selection_change'
  | 'presence_update'
  | 'sheet_change'
  | 'format_change'
  | 'ping'
  | 'pong'
  | 'undo' | 'redo';

interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
  userId?: string;
  timestamp?: number;
}

class WebSocketManager {
  private rooms: Map<string, Room> = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  handleConnection(roomId: string, userId: string, userName: string, ws: WSContext): void {
    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { id: roomId, members: new Map(), createdAt: Date.now() };
      this.rooms.set(roomId, room);
    }

    // Close existing connection for this user (reconnect scenario)
    const existing = room.members.get(userId);
    if (existing) {
      try { existing.ws.close(); } catch { /* ignore */ }
    }

    // Add member
    const member: RoomMember = { userId, userName, ws, joinedAt: Date.now() };
    room.members.set(userId, member);

    // Send current presence to new member
    const presenceList = Array.from(room.members.values())
      .filter((m) => m.userId !== userId)
      .map((m) => ({
        userId: m.userId,
        userName: m.userName,
        cursor: m.cursor,
      }));

    this.send(ws, {
      type: 'presence_update',
      payload: { action: 'init', members: presenceList },
    });

    // Broadcast join to others
    this.broadcast(room, userId, {
      type: 'presence_update',
      payload: { action: 'join', userId, userName },
    });

    console.log(`[WS] ${userName} (${userId}) joined room ${roomId} (${room.members.size} members)`);
  }

  handleDisconnect(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const member = room.members.get(userId);
    room.members.delete(userId);

    // Broadcast leave
    this.broadcast(room, userId, {
      type: 'presence_update',
      payload: { action: 'leave', userId, userName: member?.userName },
    });

    // Clean up empty rooms
    if (room.members.size === 0) {
      this.rooms.delete(roomId);
    }

    console.log(`[WS] ${member?.userName || userId} left room ${roomId} (${room.members.size} remaining)`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  handleMessage(roomId: string, userId: string, data: WSMessage, _ws: WSContext): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const member = room.members.get(userId);
    if (!member) return;

    // Attach metadata
    data.userId = userId;
    data.timestamp = Date.now();

    switch (data.type) {
      case 'ping':
        // Respond with pong directly to sender
        this.send(_ws, { type: 'pong', payload: {} });
        break;

      case 'join':
        // Client sends join after connect — broadcast presence to others
        this.broadcast(room, userId, {
          type: 'presence_update',
          payload: { action: 'join', userId, userName: member.userName },
        });
        break;

      case 'leave':
        // Handled by onClose, but acknowledge if sent explicitly
        break;

      case 'cell_update':
      case 'format_change':
      case 'sheet_change':
      case 'undo':
      case 'redo':
        // Broadcast data changes to all other members
        this.broadcast(room, userId, data);
        break;

      case 'cursor_move':
        // Update member cursor and broadcast
        if (data.payload.row !== undefined && data.payload.col !== undefined) {
          member.cursor = {
            row: data.payload.row as number,
            col: data.payload.col as number,
          };
        }
        this.broadcast(room, userId, data);
        break;

      case 'selection_change':
        this.broadcast(room, userId, data);
        break;

      default:
        // Unknown message type — broadcast anyway for extensibility
        this.broadcast(room, userId, data);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════════════════════════════════

  private send(ws: WSContext, message: WSMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Connection may be closed
    }
  }

  private broadcast(room: Room, excludeUserId: string, message: WSMessage): void {
    for (const [memberId, member] of room.members) {
      if (memberId !== excludeUserId) {
        this.send(member.ws, message);
      }
    }
  }

  // Stats
  getRoomCount(): number {
    return this.rooms.size;
  }

  getMemberCount(roomId: string): number {
    return this.rooms.get(roomId)?.members.size ?? 0;
  }
}

export const wsManager = new WebSocketManager();
