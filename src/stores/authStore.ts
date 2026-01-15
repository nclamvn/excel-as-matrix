// Phase 4 + Phase 11: Authentication Store with Enterprise Security
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  Session,
  UpdateUserRequest,
  UpdatePreferencesRequest,
} from '../types/auth';

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  sessions: Session[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Phase 11: MFA State
  mfaPending: boolean;
  mfaSessionToken: string | null;

  // Actions
  login: (request: LoginRequest) => Promise<void>;
  loginWithSSO: (provider: 'google' | 'microsoft' | 'saml') => Promise<void>;
  verifyMfa: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (request: UpdateUserRequest) => Promise<void>;
  updatePreferences: (request: UpdatePreferencesRequest) => Promise<void>;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  clearError: () => void;

  // Phase 11: Permission helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

const API_BASE = 'http://localhost:3001/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      sessions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaPending: false,
      mfaSessionToken: null,

      login: async (request: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const data: LoginResponse & { mfaRequired?: boolean; mfaSessionToken?: string } = await response.json();

          // Phase 11: Check if MFA is required
          if (data.mfaRequired) {
            set({
              mfaPending: true,
              mfaSessionToken: data.mfaSessionToken || null,
              isLoading: false,
            });
            return;
          }

          set({
            user: data.user,
            tokens: {
              token: data.token,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            },
            isAuthenticated: true,
            isLoading: false,
            mfaPending: false,
            mfaSessionToken: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // Phase 11: SSO Login
      loginWithSSO: async (provider: 'google' | 'microsoft' | 'saml') => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/sso/${provider}/authorize`);
          const data = await response.json();

          if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'SSO login failed',
          });
        }
      },

      // Phase 11: MFA Verification
      verifyMfa: async (code: string) => {
        const { mfaSessionToken } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/auth/mfa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, sessionToken: mfaSessionToken }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'MFA verification failed');
          }

          const data: LoginResponse = await response.json();
          set({
            user: data.user,
            tokens: {
              token: data.token,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            },
            isAuthenticated: true,
            mfaPending: false,
            mfaSessionToken: null,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'MFA verification failed',
          });
          return false;
        }
      },

      logout: async () => {
        const { tokens } = get();
        try {
          if (tokens?.token) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokens.token}`,
              },
            });
          }
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          tokens: null,
          sessions: [],
          isAuthenticated: false,
          mfaPending: false,
          mfaSessionToken: null,
        });
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token');
        }

        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data: LoginResponse = await response.json();
          set({
            tokens: {
              token: data.token,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            },
          });
        } catch (error) {
          // Clear auth on refresh failure
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      fetchCurrentUser: async () => {
        const { tokens } = get();
        if (!tokens?.token) return;

        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Try to refresh token
              await get().refreshToken();
              return get().fetchCurrentUser();
            }
            throw new Error('Failed to fetch user');
          }

          const user: User = await response.json();
          set({ user, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user',
          });
        }
      },

      updateUser: async (request: UpdateUserRequest) => {
        const { user, tokens } = get();
        if (!user || !tokens?.token) return;

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.token}`,
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            throw new Error('Failed to update user');
          }

          const updatedUser: User = await response.json();
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update user',
          });
          throw error;
        }
      },

      updatePreferences: async (request: UpdatePreferencesRequest) => {
        const { user, tokens } = get();
        if (!user || !tokens?.token) return;

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/users/${user.id}/preferences`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokens.token}`,
            },
            body: JSON.stringify(request),
          });

          if (!response.ok) {
            throw new Error('Failed to update preferences');
          }

          const updatedUser: User = await response.json();
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update preferences',
          });
          throw error;
        }
      },

      fetchSessions: async () => {
        const { tokens } = get();
        if (!tokens?.token) return;

        try {
          const response = await fetch(`${API_BASE}/sessions`, {
            headers: {
              'Authorization': `Bearer ${tokens.token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch sessions');
          }

          const sessions: Session[] = await response.json();
          set({ sessions });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch sessions',
          });
        }
      },

      revokeSession: async (sessionId: string) => {
        const { tokens } = get();
        if (!tokens?.token) return;

        try {
          const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${tokens.token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to revoke session');
          }

          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to revoke session',
          });
          throw error;
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (tokens) => set({ tokens }),
      setError: (error) => set({ error }),
      clearAuth: () =>
        set({
          user: null,
          tokens: null,
          sessions: [],
          isAuthenticated: false,
          error: null,
          mfaPending: false,
          mfaSessionToken: null,
        }),
      clearError: () => set({ error: null }),

      // Phase 11: Permission helpers
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;

        // Check if user has permissions array
        const permissions = (user as User & { permissions?: string[] }).permissions || [];

        return permissions.some((p: string) => {
          if (p === '*') return true;
          if (p === permission) return true;

          // Check wildcard patterns (e.g., "workbooks:*" matches "workbooks:read")
          const pParts = p.split(':');
          const permParts = permission.split(':');

          if (pParts.length !== permParts.length) return false;

          return pParts.every((part, i) => part === '*' || part === permParts[i]);
        });
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles: string[]) => {
        const { user } = get();
        return user ? roles.includes(user.role || '') : false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auth header helper
export const getAuthHeaders = (): HeadersInit => {
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.token) return {};
  return {
    Authorization: `Bearer ${tokens.token}`,
  };
};
