// Phase 4: Presence Store - Real-time Collaboration
import { create } from 'zustand';
import {
  UserPresence,
  CursorPosition,
  SelectionRange,
  ConnectionStatus,
  getColorForUser,
} from '../types/collab';

interface PresenceState {
  // State
  localUser: UserPresence | null;
  remoteUsers: Map<string, UserPresence>;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  lastConnected: string | null;
  error: string | null;

  // Actions
  setLocalUser: (presence: Partial<UserPresence>) => void;
  initLocalUser: (userId: string, displayName: string, workbookId: string, sheetId: string, avatarUrl?: string) => void;
  updateCursor: (position: CursorPosition) => void;
  updateSelection: (selection: SelectionRange | null) => void;
  updateSheet: (sheetId: string) => void;
  setStatus: (status: 'active' | 'idle' | 'away') => void;

  // Remote users
  addRemoteUser: (presence: UserPresence) => void;
  updateRemoteUser: (sessionId: string, updates: Partial<UserPresence>) => void;
  removeRemoteUser: (sessionId: string) => void;
  clearRemoteUsers: () => void;

  // Connection
  setConnectionStatus: (status: ConnectionStatus) => void;
  setReconnectAttempts: (attempts: number) => void;
  setError: (error: string | null) => void;

  // Getters
  getRemoteUsersOnSheet: (sheetId: string) => UserPresence[];
  getUsersAtCell: (sheetId: string, row: number, col: number) => UserPresence[];
  getActiveUserCount: () => number;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  // Initial state
  localUser: null,
  remoteUsers: new Map(),
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  lastConnected: null,
  error: null,

  setLocalUser: (presence) => {
    set((state) => ({
      localUser: state.localUser
        ? { ...state.localUser, ...presence, lastActivity: new Date().toISOString() }
        : null,
    }));
  },

  initLocalUser: (userId, displayName, workbookId, sheetId, avatarUrl) => {
    const sessionId = `${userId}-${Date.now()}`;
    set({
      localUser: {
        sessionId,
        userId,
        displayName,
        workbookId,
        sheetId,
        avatarUrl,
        color: getColorForUser(userId),
        cursorPosition: undefined,
        selection: undefined,
        lastActivity: new Date().toISOString(),
        status: 'active',
      },
    });
  },

  updateCursor: (position) => {
    set((state) => ({
      localUser: state.localUser
        ? {
            ...state.localUser,
            cursorPosition: position,
            lastActivity: new Date().toISOString(),
            status: 'active',
          }
        : null,
    }));
  },

  updateSelection: (selection) => {
    set((state) => ({
      localUser: state.localUser
        ? {
            ...state.localUser,
            selection: selection || undefined,
            lastActivity: new Date().toISOString(),
          }
        : null,
    }));
  },

  updateSheet: (sheetId) => {
    set((state) => ({
      localUser: state.localUser
        ? {
            ...state.localUser,
            sheetId,
            cursorPosition: undefined,
            selection: undefined,
            lastActivity: new Date().toISOString(),
          }
        : null,
    }));
  },

  setStatus: (status) => {
    set((state) => ({
      localUser: state.localUser
        ? { ...state.localUser, status, lastActivity: new Date().toISOString() }
        : null,
    }));
  },

  addRemoteUser: (presence) => {
    set((state) => {
      const newUsers = new Map(state.remoteUsers);
      newUsers.set(presence.sessionId, presence);
      return { remoteUsers: newUsers };
    });
  },

  updateRemoteUser: (sessionId, updates) => {
    set((state) => {
      const existing = state.remoteUsers.get(sessionId);
      if (!existing) return {};

      const newUsers = new Map(state.remoteUsers);
      newUsers.set(sessionId, { ...existing, ...updates });
      return { remoteUsers: newUsers };
    });
  },

  removeRemoteUser: (sessionId) => {
    set((state) => {
      const newUsers = new Map(state.remoteUsers);
      newUsers.delete(sessionId);
      return { remoteUsers: newUsers };
    });
  },

  clearRemoteUsers: () => {
    set({ remoteUsers: new Map() });
  },

  setConnectionStatus: (status) => {
    set((state) => ({
      connectionStatus: status,
      lastConnected: status === 'connected' ? new Date().toISOString() : state.lastConnected,
      error: status === 'connected' ? null : state.error,
    }));
  },

  setReconnectAttempts: (attempts) => {
    set({ reconnectAttempts: attempts });
  },

  setError: (error) => {
    set({ error });
  },

  getRemoteUsersOnSheet: (sheetId) => {
    const { remoteUsers } = get();
    return Array.from(remoteUsers.values()).filter((u) => u.sheetId === sheetId);
  },

  getUsersAtCell: (sheetId, row, col) => {
    const { remoteUsers } = get();
    return Array.from(remoteUsers.values()).filter(
      (u) =>
        u.sheetId === sheetId &&
        u.cursorPosition?.row === row &&
        u.cursorPosition?.col === col
    );
  },

  getActiveUserCount: () => {
    const { remoteUsers, localUser } = get();
    let count = localUser ? 1 : 0;
    for (const user of remoteUsers.values()) {
      if (user.status === 'active') count++;
    }
    return count;
  },
}));

// Idle detection
let idleTimeout: ReturnType<typeof setTimeout> | null = null;
const IDLE_TIMEOUT = 60000; // 1 minute
const AWAY_TIMEOUT = 300000; // 5 minutes

export const startIdleDetection = () => {
  const resetIdle = () => {
    const store = usePresenceStore.getState();
    if (store.localUser?.status !== 'active') {
      store.setStatus('active');
    }

    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      usePresenceStore.getState().setStatus('idle');
      idleTimeout = setTimeout(() => {
        usePresenceStore.getState().setStatus('away');
      }, AWAY_TIMEOUT - IDLE_TIMEOUT);
    }, IDLE_TIMEOUT);
  };

  window.addEventListener('mousemove', resetIdle);
  window.addEventListener('keydown', resetIdle);
  window.addEventListener('click', resetIdle);
  window.addEventListener('scroll', resetIdle);

  resetIdle();

  return () => {
    window.removeEventListener('mousemove', resetIdle);
    window.removeEventListener('keydown', resetIdle);
    window.removeEventListener('click', resetIdle);
    window.removeEventListener('scroll', resetIdle);
    if (idleTimeout) clearTimeout(idleTimeout);
  };
};
