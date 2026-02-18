// Phase 11: Authentication Provider
// React context for auth state management with Supabase SSO support

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  orgId?: string;
  mfaEnabled?: boolean;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithSSO: (provider: 'google' | 'microsoft' | 'saml') => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  verifyMfa: (code: string) => Promise<boolean>;
  clearError: () => void;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    error: null,
  });

  // Check existing auth on mount (REST token first, then Supabase SSO)
  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for Supabase auth state changes (SSO session detection)
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && !state.isAuthenticated) {
          // User signed in via Supabase (SSO) — set auth state
          const supaUser = session.user;
          setState({
            user: {
              id: supaUser.id,
              email: supaUser.email || '',
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || '',
              roles: ['Member'],
              permissions: ['workbooks:*'],
              orgId: supaUser.user_metadata?.org_id,
              picture: supaUser.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
            isLoading: false,
            accessToken: session.access_token,
            error: null,
          });
        } else if (event === 'SIGNED_OUT' && !localStorage.getItem('accessToken')) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            accessToken: null,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [state.isAuthenticated]);

  // Token refresh interval
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000); // Refresh 1 minute before 15min expiry

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  const checkAuth = async () => {
    try {
      // 1. Check existing REST token first
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const user = await response.json();
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: token,
            error: null,
          });
          return;
        }
        // Token invalid — try refresh
        await refreshToken();
        if (localStorage.getItem('accessToken')) return; // refresh succeeded
      }

      // 2. Check Supabase session (SSO)
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const supaUser = session.user;
          setState({
            user: {
              id: supaUser.id,
              email: supaUser.email || '',
              name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || '',
              roles: ['Member'],
              permissions: ['workbooks:*'],
              orgId: supaUser.user_metadata?.org_id,
              picture: supaUser.user_metadata?.avatar_url,
            },
            isAuthenticated: true,
            isLoading: false,
            accessToken: session.access_token,
            error: null,
          });
          return;
        }
      }

      // 3. No auth found
      setState(prev => ({ ...prev, isLoading: false }));
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        error: null,
      });
    }
  };

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid email or password');
      }

      const { user, accessToken, refreshToken, requiresMfa } = await response.json();

      if (requiresMfa) {
        // Store temp token for MFA verification
        sessionStorage.setItem('mfaTempToken', accessToken);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'MFA_REQUIRED',
        }));
        return;
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      throw err;
    }
  };

  const loginWithSSO = async (provider: 'google' | 'microsoft' | 'saml') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/auth/sso/${provider}/init`);
      if (!response.ok) {
        throw new Error('Failed to initialize SSO');
      }

      const { redirectUrl } = await response.json();
      window.location.href = redirectUrl;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'SSO initialization failed',
      }));
      throw err;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore errors during logout
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('mfaTempToken');

    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      error: null,
    });
  };

  const refreshToken = useCallback(async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
      }));
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (response.ok) {
        const { accessToken, user } = await response.json();
        localStorage.setItem('accessToken', accessToken);
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
          isLoading: false,
          accessToken,
        }));
      } else {
        throw new Error('Token refresh failed');
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        error: null,
      });
    }
  }, []);

  const verifyMfa = async (code: string): Promise<boolean> => {
    const tempToken = sessionStorage.getItem('mfaTempToken');
    if (!tempToken) return false;

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const { user, accessToken, refreshToken } = await response.json();
        sessionStorage.removeItem('mfaTempToken');
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          accessToken,
          error: null,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;

    return state.user.permissions.some(p => {
      if (p === '*:*') return true;
      if (p === permission) return true;

      const [pResource, pAction] = p.split(':');
      const [rResource, rAction] = permission.split(':');

      if (pResource === rResource && pAction === '*') return true;
      if (pResource === '*' && pAction === rAction) return true;

      return false;
    });
  };

  const hasRole = (role: string): boolean => {
    return state.user?.roles.includes(role) ?? false;
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithSSO,
        logout,
        refreshToken,
        hasPermission,
        hasRole,
        verifyMfa,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) => {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default AuthProvider;
