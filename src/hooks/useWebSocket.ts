// Phase 4: WebSocket Hook - Real-time Collaboration
import { useEffect, useRef, useCallback } from 'react';
import { usePresenceStore } from '../stores/presenceStore';
import { useAuthStore } from '../stores/authStore';
import {
  WsMessage,
  WsMessageType,
  JoinPayload,
  CellUpdatePayload,
  CursorMovePayload,
  SelectionChangePayload,
  UserPresence,
  ConnectionStatus,
} from '../types/collab';

const WS_URL = 'ws://localhost:3001/ws';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // Exponential backoff
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 10000;

interface UseWebSocketOptions {
  workbookId: string;
  sheetId: string;
  onCellUpdate?: (payload: CellUpdatePayload) => void;
  onConflict?: (payload: unknown) => void;
  onSync?: (payload: unknown) => void;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  status: ConnectionStatus;
  sendCellUpdate: (payload: CellUpdatePayload) => void;
  sendCursorMove: (row: number, col: number) => void;
  sendSelectionChange: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  sendSheetChange: (newSheetId: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const { workbookId, sheetId, onCellUpdate, onConflict, onSync, autoConnect = true } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, tokens } = useAuthStore();
  const {
    localUser,
    setConnectionStatus,
    reconnectAttempts,
    setReconnectAttempts,
    addRemoteUser,
    updateRemoteUser,
    removeRemoteUser,
    clearRemoteUsers,
    connectionStatus,
    setError,
    initLocalUser,
    updateSheet,
  } = usePresenceStore();

  const sendMessage = useCallback((type: WsMessageType, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WsMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        senderId: localUser?.sessionId,
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, [localUser?.sessionId]);

  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage('Ping', {});

        // Set pong timeout
        pongTimeoutRef.current = setTimeout(() => {
          console.warn('Pong timeout, reconnecting...');
          wsRef.current?.close();
        }, PONG_TIMEOUT);
      }
    }, PING_INTERVAL);
  }, [sendMessage]);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WsMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'Pong':
          if (pongTimeoutRef.current) {
            clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = null;
          }
          break;

        case 'PresenceUpdate':
          const presencePayload = message.payload as UserPresence;
          if (presencePayload.sessionId !== localUser?.sessionId) {
            addRemoteUser(presencePayload);
          }
          break;

        case 'Join':
          const joinPayload = message.payload as UserPresence;
          if (joinPayload.sessionId !== localUser?.sessionId) {
            addRemoteUser(joinPayload);
          }
          break;

        case 'Leave':
          const leavePayload = message.payload as { sessionId: string };
          removeRemoteUser(leavePayload.sessionId);
          break;

        case 'CursorMove':
          const cursorPayload = message.payload as CursorMovePayload & { sessionId: string };
          if (cursorPayload.sessionId !== localUser?.sessionId) {
            updateRemoteUser(cursorPayload.sessionId, {
              cursorPosition: {
                row: cursorPayload.row,
                col: cursorPayload.col,
                sheetId: cursorPayload.sheetId,
              },
            });
          }
          break;

        case 'SelectionChange':
          const selPayload = message.payload as SelectionChangePayload & { sessionId: string };
          if (selPayload.sessionId !== localUser?.sessionId) {
            updateRemoteUser(selPayload.sessionId, {
              selection: {
                sheetId: selPayload.sheetId,
                startRow: selPayload.startRow,
                startCol: selPayload.startCol,
                endRow: selPayload.endRow,
                endCol: selPayload.endCol,
              },
            });
          }
          break;

        case 'CellUpdate':
          const cellPayload = message.payload as CellUpdatePayload;
          onCellUpdate?.(cellPayload);
          break;

        case 'Conflict':
          onConflict?.(message.payload);
          break;

        case 'Sync':
          onSync?.(message.payload);
          break;

        case 'SheetChange':
          const sheetPayload = message.payload as { sessionId: string; sheetId: string };
          if (sheetPayload.sessionId !== localUser?.sessionId) {
            updateRemoteUser(sheetPayload.sessionId, {
              sheetId: sheetPayload.sheetId,
              cursorPosition: undefined,
              selection: undefined,
            });
          }
          break;

        case 'Error':
          const errorPayload = message.payload as { message: string };
          setError(errorPayload.message);
          break;
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }, [
    localUser?.sessionId,
    addRemoteUser,
    removeRemoteUser,
    updateRemoteUser,
    onCellUpdate,
    onConflict,
    onSync,
    setError,
  ]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!user || !tokens?.token) {
      setError('Not authenticated');
      return;
    }

    setConnectionStatus('connecting');

    try {
      const url = `${WS_URL}?token=${tokens.token}&workbook=${workbookId}`;
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        clearRemoteUsers();

        // Initialize local user if not already
        if (!localUser) {
          initLocalUser(user.id, user.displayName, workbookId, sheetId, user.avatarUrl);
        }

        // Send join message
        const joinPayload: JoinPayload = {
          workbookId,
          sheetId,
          userId: user.id,
          displayName: user.displayName,
        };
        sendMessage('Join', joinPayload);

        // Start ping
        startPing();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        stopPing();

        if (event.code !== 1000) {
          // Abnormal close, attempt reconnect
          setConnectionStatus('reconnecting');
          const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)];
          setReconnectAttempts(reconnectAttempts + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionStatus('disconnected');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('Connection error');
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setConnectionStatus('error');
      setError('Failed to connect');
    }
  }, [
    user,
    tokens,
    workbookId,
    sheetId,
    localUser,
    reconnectAttempts,
    setConnectionStatus,
    setReconnectAttempts,
    clearRemoteUsers,
    initLocalUser,
    sendMessage,
    handleMessage,
    startPing,
    stopPing,
    setError,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopPing();

    if (wsRef.current) {
      sendMessage('Leave', { sessionId: localUser?.sessionId });
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    clearRemoteUsers();
  }, [localUser?.sessionId, sendMessage, stopPing, setConnectionStatus, clearRemoteUsers]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user && tokens?.token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user?.id, tokens?.token, workbookId]);

  // Update sheet when it changes
  useEffect(() => {
    if (connectionStatus === 'connected' && localUser) {
      updateSheet(sheetId);
      sendMessage('SheetChange', { sheetId });
    }
  }, [sheetId, connectionStatus, localUser, updateSheet, sendMessage]);

  const sendCellUpdate = useCallback((payload: CellUpdatePayload) => {
    sendMessage('CellUpdate', payload);
  }, [sendMessage]);

  const sendCursorMove = useCallback((row: number, col: number) => {
    sendMessage('CursorMove', { sheetId, row, col });
  }, [sendMessage, sheetId]);

  const sendSelectionChange = useCallback((startRow: number, startCol: number, endRow: number, endCol: number) => {
    sendMessage('SelectionChange', {
      sheetId,
      startRow,
      startCol,
      endRow,
      endCol,
    });
  }, [sendMessage, sheetId]);

  const sendSheetChange = useCallback((newSheetId: string) => {
    sendMessage('SheetChange', { sheetId: newSheetId });
  }, [sendMessage]);

  return {
    isConnected: connectionStatus === 'connected',
    status: connectionStatus,
    sendCellUpdate,
    sendCursorMove,
    sendSelectionChange,
    sendSheetChange,
    connect,
    disconnect,
  };
};
