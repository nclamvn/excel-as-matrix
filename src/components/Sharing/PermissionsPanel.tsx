// Phase 4: Permissions Panel - Manage user/team permissions
import React, { useState, useCallback, useEffect } from 'react';
import { WorkbookPermission, WorkbookRole } from '../../types/auth';
import { getAuthHeaders } from '../../stores/authStore';
import { loggers } from '@/utils/logger';

interface PermissionsPanelProps {
  workbookId: string;
  permissions: WorkbookPermission[];
  onPermissionsChange: (permissions: WorkbookPermission[]) => void;
  canEdit: boolean;
}

const API_BASE = 'http://localhost:3001/api';

const PermissionsPanel: React.FC<PermissionsPanelProps> = ({
  workbookId,
  permissions,
  onPermissionsChange,
  canEdit,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkbookRole>('Viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          onPermissionsChange(data);
        }
      } catch (e) {
        loggers.ui.error('Failed to fetch permissions:', e);
      }
    };
    fetchPermissions();
  }, [workbookId, onPermissionsChange]);

  const handleAddPermission = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          granteeType: 'User',
          granteeId: email, // In production, would lookup user by email
          role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add permission');
      }

      // Refresh permissions
      const refreshResponse = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        headers: getAuthHeaders(),
      });
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        onPermissionsChange(data);
      }

      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add permission');
    } finally {
      setIsLoading(false);
    }
  }, [email, role, workbookId, onPermissionsChange]);

  const handleRemovePermission = useCallback(async (perm: WorkbookPermission) => {
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          granteeType: perm.granteeType,
          granteeId: perm.granteeId,
        }),
      });

      if (response.ok) {
        onPermissionsChange(permissions.filter((p) =>
          p.granteeType !== perm.granteeType || p.granteeId !== perm.granteeId
        ));
      }
    } catch (e) {
      setError('Failed to remove permission');
    }
  }, [workbookId, permissions, onPermissionsChange]);

  const handleRoleChange = useCallback(async (perm: WorkbookPermission, newRole: WorkbookRole) => {
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          granteeType: perm.granteeType,
          granteeId: perm.granteeId,
          role: newRole,
        }),
      });

      if (response.ok) {
        onPermissionsChange(
          permissions.map((p) =>
            p.granteeType === perm.granteeType && p.granteeId === perm.granteeId
              ? { ...p, role: newRole }
              : p
          )
        );
      }
    } catch (e) {
      setError('Failed to update permission');
    }
  }, [workbookId, permissions, onPermissionsChange]);

  return (
    <div className="permissions-panel">
      {/* Add person form */}
      {canEdit && (
        <form onSubmit={handleAddPermission} style={formStyle}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Add people by email"
              style={inputStyle}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkbookRole)}
              style={selectStyle}
            >
              <option value="Viewer">Viewer</option>
              <option value="Commenter">Commenter</option>
              <option value="Editor">Editor</option>
            </select>
            <button type="submit" disabled={isLoading || !email.trim()} style={addButtonStyle}>
              Add
            </button>
          </div>
        </form>
      )}

      {/* Error message */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {/* Permissions list */}
      <div style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          People with access
        </h4>

        {permissions.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 }}>
            No one else has access to this workbook
          </div>
        ) : (
          <div>
            {permissions.map((perm, index) => (
              <PermissionItem
                key={`${perm.granteeType}-${perm.granteeId}-${index}`}
                permission={perm}
                canEdit={canEdit && perm.role !== 'Owner'}
                onRoleChange={(newRole) => handleRoleChange(perm, newRole)}
                onRemove={() => handleRemovePermission(perm)}
              />
            ))}
          </div>
        )}
      </div>

      {/* General access */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
          General access
        </h4>
        <GeneralAccessControl
          workbookId={workbookId}
          permissions={permissions}
          canEdit={canEdit}
          onPermissionsChange={onPermissionsChange}
        />
      </div>
    </div>
  );
};

interface PermissionItemProps {
  permission: WorkbookPermission;
  canEdit: boolean;
  onRoleChange: (role: WorkbookRole) => void;
  onRemove: () => void;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  permission,
  canEdit,
  onRoleChange,
  onRemove,
}) => {
  const getGranteeDisplay = () => {
    if (permission.granteeType === 'Anyone') return 'Anyone with the link';
    if (permission.granteeType === 'Team') return `Team: ${permission.granteeId}`;
    return permission.granteeId || 'Unknown';
  };

  const getIcon = () => {
    if (permission.granteeType === 'Anyone') return <GlobeIcon />;
    if (permission.granteeType === 'Team') return <TeamIcon />;
    return <UserIcon />;
  };

  return (
    <div style={itemStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <div style={iconContainerStyle}>
          {getIcon()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            {getGranteeDisplay()}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {permission.granteeType}
          </div>
        </div>
      </div>

      {permission.role === 'Owner' ? (
        <span style={ownerBadgeStyle}>Owner</span>
      ) : canEdit ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={permission.role}
            onChange={(e) => onRoleChange(e.target.value as WorkbookRole)}
            style={roleSelectStyle}
          >
            <option value="Viewer">Viewer</option>
            <option value="Commenter">Commenter</option>
            <option value="Editor">Editor</option>
          </select>
          <button onClick={onRemove} style={removeButtonStyle} title="Remove access">
            <RemoveIcon />
          </button>
        </div>
      ) : (
        <span style={roleBadgeStyle}>{permission.role}</span>
      )}
    </div>
  );
};

interface GeneralAccessControlProps {
  workbookId: string;
  permissions: WorkbookPermission[];
  canEdit: boolean;
  onPermissionsChange: (permissions: WorkbookPermission[]) => void;
}

const GeneralAccessControl: React.FC<GeneralAccessControlProps> = ({
  workbookId,
  permissions,
  canEdit,
  onPermissionsChange,
}) => {
  const anyonePermission = permissions.find((p) => p.granteeType === 'Anyone');
  const [isRestricted, setIsRestricted] = useState(!anyonePermission);
  const [anyoneRole, setAnyoneRole] = useState<WorkbookRole>(anyonePermission?.role || 'Viewer');

  const handleAccessChange = async (restricted: boolean) => {
    setIsRestricted(restricted);

    if (restricted && anyonePermission) {
      // Remove "Anyone" permission
      try {
        await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            granteeType: 'Anyone',
          }),
        });
        onPermissionsChange(permissions.filter((p) => p.granteeType !== 'Anyone'));
      } catch (e) {
        loggers.ui.error('Failed to update access:', e);
      }
    } else if (!restricted && !anyonePermission) {
      // Add "Anyone" permission
      try {
        await fetch(`${API_BASE}/workbooks/${workbookId}/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            granteeType: 'Anyone',
            role: anyoneRole,
          }),
        });
        const newPerm: WorkbookPermission = {
          workbookId,
          granteeType: 'Anyone',
          role: anyoneRole,
          grantedBy: '',
          grantedAt: new Date().toISOString(),
        };
        onPermissionsChange([...permissions, newPerm]);
      } catch (e) {
        loggers.ui.error('Failed to update access:', e);
      }
    }
  };

  return (
    <div style={generalAccessStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ ...iconContainerStyle, backgroundColor: isRestricted ? '#f3f4f6' : '#dbeafe' }}>
          {isRestricted ? <LockIcon /> : <GlobeIcon />}
        </div>
        <div style={{ flex: 1 }}>
          {canEdit ? (
            <select
              value={isRestricted ? 'restricted' : 'anyone'}
              onChange={(e) => handleAccessChange(e.target.value === 'restricted')}
              style={{ ...selectStyle, padding: '6px 10px', fontSize: 14, fontWeight: 500 }}
            >
              <option value="restricted">Restricted</option>
              <option value="anyone">Anyone with the link</option>
            </select>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
              {isRestricted ? 'Restricted' : 'Anyone with the link'}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {isRestricted
              ? 'Only people with access can open'
              : 'Anyone on the internet with the link can view'}
          </div>
        </div>

        {!isRestricted && canEdit && (
          <select
            value={anyoneRole}
            onChange={(e) => setAnyoneRole(e.target.value as WorkbookRole)}
            style={roleSelectStyle}
          >
            <option value="Viewer">Viewer</option>
            <option value="Commenter">Commenter</option>
            <option value="Editor">Editor</option>
          </select>
        )}
      </div>
    </div>
  );
};

// Icons
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
  </svg>
);

const TeamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6zm-5.784 6A2.238 2.238 0 015 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 005 9c-4 0-5 3-5 4s1 1 1 1h4.216zM4.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855-.143.268-.276.56-.395.872.705.157 1.472.257 2.282.287V1.077zM4.249 3.539c.142-.384.304-.744.481-1.078a6.7 6.7 0 01.597-.933A7.01 7.01 0 003.051 3.05c.362.184.763.349 1.198.49zM3.509 7.5c.036-1.07.188-2.087.436-3.008a9.124 9.124 0 01-1.565-.667A6.964 6.964 0 001.018 7.5h2.49zm1.4-2.741a12.344 12.344 0 00-.4 2.741H7.5V5.091c-.91-.03-1.783-.145-2.591-.332zM8.5 5.09v2.409h2.99a12.342 12.342 0 00-.399-2.741c-.808.187-1.681.301-2.591.332zM4.51 8.5c.035.987.176 1.914.399 2.741A13.612 13.612 0 017.5 10.91V8.5H4.51zm3.99 0v2.409c.91.03 1.783.145 2.591.332.223-.827.364-1.754.4-2.741H8.5zm-3.282 3.696c.12.312.252.604.395.872.552 1.035 1.218 1.65 1.887 1.855V11.91c-.81.03-1.577.13-2.282.287zm.11 2.276a6.696 6.696 0 01-.598-.933 8.853 8.853 0 01-.481-1.079 8.38 8.38 0 01-1.198.49 7.01 7.01 0 002.276 1.522zm-1.383-2.964A13.36 13.36 0 013.508 8.5h-2.49a6.963 6.963 0 001.362 3.675c.47-.258.995-.482 1.565-.667zm6.728 2.964a7.009 7.009 0 002.275-1.521 8.376 8.376 0 01-1.197-.49 8.853 8.853 0 01-.481 1.078 6.688 6.688 0 01-.597.933zM8.5 11.909v3.014c.67-.204 1.335-.82 1.887-1.855.143-.268.276-.56.395-.872A12.63 12.63 0 008.5 11.91zm3.555-.401c.57.185 1.095.409 1.565.667A6.963 6.963 0 0014.982 8.5h-2.49a13.36 13.36 0 01-.437 3.008zM14.982 7.5a6.963 6.963 0 00-1.362-3.675c-.47.258-.995.482-1.565.667.248.92.4 1.938.437 3.008h2.49zM11.27 2.461c.177.334.339.694.482 1.078a8.368 8.368 0 011.196-.49 7.01 7.01 0 00-2.275-1.52c.218.283.418.597.597.932zm-.488 1.343a7.765 7.765 0 00-.395-.872C9.835 1.897 9.17 1.282 8.5 1.077V4.09c.81-.03 1.577-.13 2.282-.287z" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a2 2 0 012 2v4H6V3a2 2 0 012-2zm3 6V3a3 3 0 00-6 0v4a2 2 0 00-2 2v5a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2z" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M4.646 4.646a.5.5 0 01.708 0L7 6.293l1.646-1.647a.5.5 0 01.708.708L7.707 7l1.647 1.646a.5.5 0 01-.708.708L7 7.707l-1.646 1.647a.5.5 0 01-.708-.708L6.293 7 4.646 5.354a.5.5 0 010-.708z" />
  </svg>
);

// Styles
const formStyle: React.CSSProperties = {
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
};

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  fontSize: 14,
  backgroundColor: 'white',
};

const addButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  borderRadius: 8,
  fontSize: 13,
  marginTop: 8,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
};

const iconContainerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
};

const ownerBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: '#fef3c7',
  color: '#92400e',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
};

const roleBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
};

const roleSelectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: 'white',
};

const removeButtonStyle: React.CSSProperties = {
  padding: 6,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#9ca3af',
};

const generalAccessStyle: React.CSSProperties = {
  padding: '12px 0',
};

export default PermissionsPanel;
