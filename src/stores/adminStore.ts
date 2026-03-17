// Phase 11: Admin Store
// Zustand store for admin panel state management

import { create } from 'zustand';
import { loggers } from '@/utils/logger';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  mfaEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

interface AuditEvent {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  userEmail: string;
  resource: string;
  resourceId?: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
  success: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
}

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  mfaEnabledUsers: number;
  pendingRequests: number;
  recentEvents: number;
  failedLogins: number;
}

interface AdminState {
  // Users
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  selectedUser: User | null;

  // Roles
  roles: Role[];
  rolesLoading: boolean;
  rolesError: string | null;
  selectedRole: Role | null;

  // Audit
  auditEvents: AuditEvent[];
  auditLoading: boolean;
  auditError: string | null;
  auditTotal: number;
  auditPage: number;

  // GDPR
  dsrRequests: DataSubjectRequest[];
  dsrLoading: boolean;
  dsrError: string | null;

  // Security Stats
  securityStats: SecurityStats | null;
  statsLoading: boolean;

  // Actions
  fetchUsers: (filters?: Record<string, string>) => Promise<void>;
  createUser: (data: Partial<User>) => Promise<boolean>;
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  setSelectedUser: (user: User | null) => void;

  fetchRoles: () => Promise<void>;
  createRole: (data: Partial<Role>) => Promise<boolean>;
  updateRole: (id: string, data: Partial<Role>) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  setSelectedRole: (role: Role | null) => void;

  fetchAuditEvents: (filters?: Record<string, string>) => Promise<void>;
  exportAuditLog: (format: 'csv' | 'json') => Promise<void>;
  setAuditPage: (page: number) => void;

  fetchDsrRequests: (filters?: Record<string, string>) => Promise<void>;
  processDsrRequest: (id: string, action: 'approve' | 'reject', notes?: string) => Promise<boolean>;

  fetchSecurityStats: () => Promise<void>;

  // Utility
  clearErrors: () => void;
}

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  users: [],
  usersLoading: false,
  usersError: null,
  selectedUser: null,

  roles: [],
  rolesLoading: false,
  rolesError: null,
  selectedRole: null,

  auditEvents: [],
  auditLoading: false,
  auditError: null,
  auditTotal: 0,
  auditPage: 1,

  dsrRequests: [],
  dsrLoading: false,
  dsrError: null,

  securityStats: null,
  statsLoading: false,

  // User Management
  fetchUsers: async (filters = {}) => {
    set({ usersLoading: true, usersError: null });

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      set({ users: data.users, usersLoading: false });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Failed to fetch users',
        usersLoading: false,
      });
    }
  },

  createUser: async (data) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create user');

      await get().fetchUsers();
      return true;
    } catch (error) {
      set({ usersError: error instanceof Error ? error.message : 'Failed to create user' });
      return false;
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update user');

      await get().fetchUsers();
      return true;
    } catch (error) {
      set({ usersError: error instanceof Error ? error.message : 'Failed to update user' });
      return false;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to delete user');

      await get().fetchUsers();
      return true;
    } catch (error) {
      set({ usersError: error instanceof Error ? error.message : 'Failed to delete user' });
      return false;
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),

  // Role Management
  fetchRoles: async () => {
    set({ rolesLoading: true, rolesError: null });

    try {
      const response = await fetch('/api/admin/roles', {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch roles');

      const data = await response.json();
      set({ roles: data.roles, rolesLoading: false });
    } catch (error) {
      set({
        rolesError: error instanceof Error ? error.message : 'Failed to fetch roles',
        rolesLoading: false,
      });
    }
  },

  createRole: async (data) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create role');

      await get().fetchRoles();
      return true;
    } catch (error) {
      set({ rolesError: error instanceof Error ? error.message : 'Failed to create role' });
      return false;
    }
  },

  updateRole: async (id, data) => {
    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update role');

      await get().fetchRoles();
      return true;
    } catch (error) {
      set({ rolesError: error instanceof Error ? error.message : 'Failed to update role' });
      return false;
    }
  },

  deleteRole: async (id) => {
    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to delete role');

      await get().fetchRoles();
      return true;
    } catch (error) {
      set({ rolesError: error instanceof Error ? error.message : 'Failed to delete role' });
      return false;
    }
  },

  setSelectedRole: (role) => set({ selectedRole: role }),

  // Audit Log
  fetchAuditEvents: async (filters = {}) => {
    set({ auditLoading: true, auditError: null });

    try {
      const params = new URLSearchParams({
        ...filters,
        page: get().auditPage.toString(),
        limit: '50',
      });

      const response = await fetch(`/api/admin/audit?${params}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch audit events');

      const data = await response.json();
      set({
        auditEvents: data.events,
        auditTotal: data.total,
        auditLoading: false,
      });
    } catch (error) {
      set({
        auditError: error instanceof Error ? error.message : 'Failed to fetch audit events',
        auditLoading: false,
      });
    }
  },

  exportAuditLog: async (format) => {
    try {
      const response = await fetch(`/api/admin/audit/export?format=${format}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to export audit log');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      set({ auditError: error instanceof Error ? error.message : 'Failed to export audit log' });
    }
  },

  setAuditPage: (page) => set({ auditPage: page }),

  // GDPR / DSR
  fetchDsrRequests: async (filters = {}) => {
    set({ dsrLoading: true, dsrError: null });

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/gdpr/requests?${params}`, {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch DSR requests');

      const data = await response.json();
      set({ dsrRequests: data.requests, dsrLoading: false });
    } catch (error) {
      set({
        dsrError: error instanceof Error ? error.message : 'Failed to fetch DSR requests',
        dsrLoading: false,
      });
    }
  },

  processDsrRequest: async (id, action, notes) => {
    try {
      const response = await fetch(`/api/admin/gdpr/requests/${id}/${action}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} request`);

      await get().fetchDsrRequests();
      return true;
    } catch (error) {
      set({ dsrError: error instanceof Error ? error.message : `Failed to ${action} request` });
      return false;
    }
  },

  // Security Stats
  fetchSecurityStats: async () => {
    set({ statsLoading: true });

    try {
      const response = await fetch('/api/admin/security/stats', {
        headers: getAuthHeader(),
      });

      if (!response.ok) throw new Error('Failed to fetch security stats');

      const data = await response.json();
      set({ securityStats: data, statsLoading: false });
    } catch (error) {
      loggers.store.error('Failed to fetch security stats:', error);
      set({ statsLoading: false });
    }
  },

  // Utility
  clearErrors: () =>
    set({
      usersError: null,
      rolesError: null,
      auditError: null,
      dsrError: null,
    }),
}));

export default useAdminStore;
