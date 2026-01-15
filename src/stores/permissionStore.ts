// Phase 4: Permission Store - RBAC & ACL
import { create } from 'zustand';
import {
  WorkbookRole,
  WorkbookPermission,
  PermissionCheck,
  CellAcl,
} from '../types/auth';
import { getAuthHeaders } from './authStore';

interface PermissionState {
  // State
  workbookPermissions: Map<string, WorkbookPermission[]>;
  cellAcls: Map<string, CellAcl[]>; // key: workbookId
  userRoles: Map<string, WorkbookRole>; // key: workbookId
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkbookPermissions: (workbookId: string) => Promise<void>;
  grantPermission: (
    workbookId: string,
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId: string | undefined,
    role: WorkbookRole
  ) => Promise<void>;
  revokePermission: (
    workbookId: string,
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId?: string
  ) => Promise<void>;
  fetchCellAcls: (workbookId: string) => Promise<void>;
  setCellAcl: (workbookId: string, acl: CellAcl) => Promise<void>;
  removeCellAcl: (workbookId: string, sheetId: string, startRow: number, startCol: number) => Promise<void>;

  // Getters
  checkPermission: (workbookId: string, userId: string, teamIds: string[]) => PermissionCheck;
  canEditCell: (workbookId: string, sheetId: string, row: number, col: number, userId: string, teamIds: string[]) => boolean;
  getUserRole: (workbookId: string) => WorkbookRole | null;
  setUserRole: (workbookId: string, role: WorkbookRole) => void;
  setError: (error: string | null) => void;
  clearPermissions: (workbookId: string) => void;
}

const API_BASE = 'http://localhost:3001/api';

const ROLE_HIERARCHY: Record<WorkbookRole, number> = {
  Owner: 4,
  Editor: 3,
  Commenter: 2,
  Viewer: 1,
};

export const usePermissionStore = create<PermissionState>()((set, get) => ({
  // Initial state
  workbookPermissions: new Map(),
  cellAcls: new Map(),
  userRoles: new Map(),
  isLoading: false,
  error: null,

  fetchWorkbookPermissions: async (workbookId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const permissions: WorkbookPermission[] = await response.json();
      set((state) => {
        const newPermissions = new Map(state.workbookPermissions);
        newPermissions.set(workbookId, permissions);
        return { workbookPermissions: newPermissions, isLoading: false };
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      });
    }
  },

  grantPermission: async (workbookId, granteeType, granteeId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ granteeType, granteeId, role }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant permission');
      }

      // Refresh permissions
      await get().fetchWorkbookPermissions(workbookId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to grant permission',
      });
      throw error;
    }
  },

  revokePermission: async (workbookId, granteeType, granteeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ granteeType, granteeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke permission');
      }

      // Refresh permissions
      await get().fetchWorkbookPermissions(workbookId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to revoke permission',
      });
      throw error;
    }
  },

  fetchCellAcls: async (workbookId: string) => {
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/acls`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cell ACLs');
      }

      const acls: CellAcl[] = await response.json();
      set((state) => {
        const newAcls = new Map(state.cellAcls);
        newAcls.set(workbookId, acls);
        return { cellAcls: newAcls };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch cell ACLs',
      });
    }
  },

  setCellAcl: async (workbookId, acl) => {
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/acls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(acl),
      });

      if (!response.ok) {
        throw new Error('Failed to set cell ACL');
      }

      // Refresh ACLs
      await get().fetchCellAcls(workbookId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to set cell ACL',
      });
      throw error;
    }
  },

  removeCellAcl: async (workbookId, sheetId, startRow, startCol) => {
    try {
      const response = await fetch(
        `${API_BASE}/workbooks/${workbookId}/acls/${sheetId}/${startRow}/${startCol}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove cell ACL');
      }

      // Refresh ACLs
      await get().fetchCellAcls(workbookId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove cell ACL',
      });
      throw error;
    }
  },

  checkPermission: (workbookId, userId, teamIds) => {
    const { workbookPermissions } = get();
    const permissions = workbookPermissions.get(workbookId) || [];

    let highestRole: WorkbookRole | null = null;

    for (const perm of permissions) {
      let matches = false;

      if (perm.granteeType === 'Anyone') {
        matches = true;
      } else if (perm.granteeType === 'User' && perm.granteeId === userId) {
        matches = true;
      } else if (perm.granteeType === 'Team' && perm.granteeId && teamIds.includes(perm.granteeId)) {
        matches = true;
      }

      if (matches) {
        if (!highestRole || ROLE_HIERARCHY[perm.role] > ROLE_HIERARCHY[highestRole]) {
          highestRole = perm.role;
        }
      }
    }

    return {
      canView: !!highestRole,
      canEdit: highestRole === 'Owner' || highestRole === 'Editor',
      canComment: highestRole === 'Owner' || highestRole === 'Editor' || highestRole === 'Commenter',
      canShare: highestRole === 'Owner',
      canDelete: highestRole === 'Owner',
      role: highestRole,
    };
  },

  canEditCell: (workbookId, sheetId, row, col, userId, teamIds) => {
    const { cellAcls, checkPermission } = get();
    const permission = checkPermission(workbookId, userId, teamIds);

    // First check workbook-level permission
    if (!permission.canEdit) return false;

    // Check cell-level ACLs
    const acls = cellAcls.get(workbookId) || [];
    for (const acl of acls) {
      if (acl.sheetId !== sheetId) continue;
      if (row < acl.startRow || row > acl.endRow) continue;
      if (col < acl.startCol || col > acl.endCol) continue;

      // Cell is in ACL range
      // Check deny first
      if (acl.denyUsers.includes(userId)) return false;
      if (teamIds.some((t) => acl.denyTeams.includes(t))) return false;

      // If there are allow lists, must be in them
      if (acl.allowedUsers.length > 0 || acl.allowedTeams.length > 0) {
        const inAllowedUsers = acl.allowedUsers.includes(userId);
        const inAllowedTeams = teamIds.some((t) => acl.allowedTeams.includes(t));
        if (!inAllowedUsers && !inAllowedTeams) return false;
      }
    }

    return true;
  },

  getUserRole: (workbookId) => {
    return get().userRoles.get(workbookId) || null;
  },

  setUserRole: (workbookId, role) => {
    set((state) => {
      const newRoles = new Map(state.userRoles);
      newRoles.set(workbookId, role);
      return { userRoles: newRoles };
    });
  },

  setError: (error) => set({ error }),

  clearPermissions: (workbookId) => {
    set((state) => {
      const newPermissions = new Map(state.workbookPermissions);
      const newAcls = new Map(state.cellAcls);
      const newRoles = new Map(state.userRoles);
      newPermissions.delete(workbookId);
      newAcls.delete(workbookId);
      newRoles.delete(workbookId);
      return {
        workbookPermissions: newPermissions,
        cellAcls: newAcls,
        userRoles: newRoles,
      };
    });
  },
}));

// Permission check hooks
export const hasRole = (role: WorkbookRole, requiredRole: WorkbookRole): boolean => {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
};
