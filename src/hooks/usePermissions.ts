// Phase 4: Permissions Hook
import { useEffect, useCallback, useMemo } from 'react';
import { usePermissionStore, hasRole } from '../stores/permissionStore';
import { useAuthStore } from '../stores/authStore';
import { WorkbookRole, PermissionCheck } from '../types/auth';

interface UsePermissionsOptions {
  workbookId: string;
  autoFetch?: boolean;
}

interface UsePermissionsReturn {
  // Permission checks
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  role: WorkbookRole | null;
  isOwner: boolean;
  isEditor: boolean;

  // Cell-level
  canEditCell: (sheetId: string, row: number, col: number) => boolean;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  grantPermission: (
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId: string | undefined,
    role: WorkbookRole
  ) => Promise<void>;
  revokePermission: (
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId?: string
  ) => Promise<void>;
}

export const usePermissions = (options: UsePermissionsOptions): UsePermissionsReturn => {
  const { workbookId, autoFetch = true } = options;

  const { user } = useAuthStore();
  const {
    isLoading,
    error,
    fetchWorkbookPermissions,
    grantPermission: storeGrantPermission,
    revokePermission: storeRevokePermission,
    checkPermission,
    canEditCell: storeCanEditCell,
  } = usePermissionStore();

  // Get user's team IDs (in production, would come from auth store)
  const userTeamIds = useMemo(() => {
    // Placeholder - in real app, user.teamIds would be available
    return [] as string[];
  }, []);

  // Fetch permissions on mount
  useEffect(() => {
    if (autoFetch && user && workbookId) {
      fetchWorkbookPermissions(workbookId);
    }
  }, [autoFetch, user?.id, workbookId, fetchWorkbookPermissions]);

  // Calculate permissions
  const permissions = useMemo((): PermissionCheck => {
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canComment: false,
        canShare: false,
        canDelete: false,
        role: null,
      };
    }
    return checkPermission(workbookId, user.id, userTeamIds);
  }, [workbookId, user, userTeamIds, checkPermission]);

  const canEditCell = useCallback((sheetId: string, row: number, col: number) => {
    if (!user) return false;
    return storeCanEditCell(workbookId, sheetId, row, col, user.id, userTeamIds);
  }, [workbookId, user, userTeamIds, storeCanEditCell]);

  const refresh = useCallback(async () => {
    if (user && workbookId) {
      await fetchWorkbookPermissions(workbookId);
    }
  }, [user?.id, workbookId, fetchWorkbookPermissions]);

  const grantPermission = useCallback(async (
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId: string | undefined,
    role: WorkbookRole
  ) => {
    await storeGrantPermission(workbookId, granteeType, granteeId, role);
  }, [workbookId, storeGrantPermission]);

  const revokePermission = useCallback(async (
    granteeType: 'User' | 'Team' | 'Anyone',
    granteeId?: string
  ) => {
    await storeRevokePermission(workbookId, granteeType, granteeId);
  }, [workbookId, storeRevokePermission]);

  return {
    ...permissions,
    isOwner: permissions.role === 'Owner',
    isEditor: permissions.role === 'Owner' || permissions.role === 'Editor',
    canEditCell,
    isLoading,
    error,
    refresh,
    grantPermission,
    revokePermission,
  };
};

// Hook for checking if a specific action is allowed
interface UseCanOptions {
  workbookId: string;
  action: 'view' | 'edit' | 'comment' | 'share' | 'delete';
}

export const useCan = (options: UseCanOptions): boolean => {
  const { workbookId, action } = options;
  const permissions = usePermissions({ workbookId, autoFetch: true });

  switch (action) {
    case 'view':
      return permissions.canView;
    case 'edit':
      return permissions.canEdit;
    case 'comment':
      return permissions.canComment;
    case 'share':
      return permissions.canShare;
    case 'delete':
      return permissions.canDelete;
    default:
      return false;
  }
};

// Hook for role-based rendering
interface UseRoleGateOptions {
  workbookId: string;
  requiredRole: WorkbookRole;
}

export const useRoleGate = (options: UseRoleGateOptions): boolean => {
  const { workbookId, requiredRole } = options;
  const { role } = usePermissions({ workbookId, autoFetch: true });

  if (!role) return false;
  return hasRole(role, requiredRole);
};

// Hook for conditional cell editing
interface UseCellEditableOptions {
  workbookId: string;
  sheetId: string;
  row: number;
  col: number;
}

export const useCellEditable = (options: UseCellEditableOptions): boolean => {
  const { workbookId, sheetId, row, col } = options;
  const { canEditCell } = usePermissions({ workbookId, autoFetch: true });

  return canEditCell(sheetId, row, col);
};
