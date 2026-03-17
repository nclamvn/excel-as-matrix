// Phase 11: Role Editor Component
// Create and manage custom roles with granular permissions

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Save,
  Users,
} from 'lucide-react';
import { loggers } from '@/utils/logger';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
}

const PERMISSION_CATEGORIES = {
  workbooks: {
    label: 'Workbooks',
    permissions: [
      { id: 'workbooks:read', name: 'View', description: 'View workbooks' },
      { id: 'workbooks:create', name: 'Create', description: 'Create new workbooks' },
      { id: 'workbooks:update', name: 'Edit', description: 'Edit workbooks' },
      { id: 'workbooks:delete', name: 'Delete', description: 'Delete workbooks' },
      { id: 'workbooks:share', name: 'Share', description: 'Share workbooks with others' },
      { id: 'workbooks:export', name: 'Export', description: 'Export workbooks' },
    ],
  },
  sheets: {
    label: 'Sheets',
    permissions: [
      { id: 'sheets:read', name: 'View', description: 'View sheets' },
      { id: 'sheets:create', name: 'Create', description: 'Create new sheets' },
      { id: 'sheets:update', name: 'Edit', description: 'Edit sheets' },
      { id: 'sheets:delete', name: 'Delete', description: 'Delete sheets' },
    ],
  },
  cells: {
    label: 'Cells',
    permissions: [
      { id: 'cells:read', name: 'View', description: 'View cell data' },
      { id: 'cells:update', name: 'Edit', description: 'Edit cell data' },
    ],
  },
  formulas: {
    label: 'Formulas',
    permissions: [
      { id: 'formulas:read', name: 'View', description: 'View formulas' },
      { id: 'formulas:create', name: 'Create', description: 'Create formulas' },
      { id: 'formulas:update', name: 'Edit', description: 'Edit formulas' },
    ],
  },
  comments: {
    label: 'Comments',
    permissions: [
      { id: 'comments:read', name: 'View', description: 'View comments' },
      { id: 'comments:create', name: 'Create', description: 'Add comments' },
      { id: 'comments:update', name: 'Edit', description: 'Edit comments' },
      { id: 'comments:delete', name: 'Delete', description: 'Delete comments' },
    ],
  },
  users: {
    label: 'Users',
    permissions: [
      { id: 'users:read', name: 'View', description: 'View users' },
      { id: 'users:create', name: 'Create', description: 'Create users' },
      { id: 'users:update', name: 'Edit', description: 'Edit users' },
      { id: 'users:delete', name: 'Delete', description: 'Delete users' },
    ],
  },
  roles: {
    label: 'Roles',
    permissions: [
      { id: 'roles:read', name: 'View', description: 'View roles' },
      { id: 'roles:create', name: 'Create', description: 'Create roles' },
      { id: 'roles:update', name: 'Edit', description: 'Edit roles' },
      { id: 'roles:delete', name: 'Delete', description: 'Delete roles' },
    ],
  },
  audit: {
    label: 'Audit Logs',
    permissions: [
      { id: 'audit:read', name: 'View', description: 'View audit logs' },
      { id: 'audit:export', name: 'Export', description: 'Export audit logs' },
    ],
  },
  settings: {
    label: 'Settings',
    permissions: [
      { id: 'settings:read', name: 'View', description: 'View settings' },
      { id: 'settings:update', name: 'Edit', description: 'Edit settings' },
    ],
  },
};

export const RoleEditor: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
        if (data.roles.length > 0 && !selectedRole) {
          setSelectedRole(data.roles[0]);
        }
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    if (!selectedRole || !isEditing) return;

    const newPermissions = selectedRole.permissions.includes(permissionId)
      ? selectedRole.permissions.filter((p) => p !== permissionId)
      : [...selectedRole.permissions, permissionId];

    setSelectedRole({ ...selectedRole, permissions: newPermissions });
  };

  const toggleCategoryPermissions = (category: string) => {
    if (!selectedRole || !isEditing) return;

    const categoryPermissions =
      PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions.map(
        (p) => p.id
      );
    const allSelected = categoryPermissions.every((p) => selectedRole.permissions.includes(p));

    let newPermissions: string[];
    if (allSelected) {
      newPermissions = selectedRole.permissions.filter((p) => !categoryPermissions.includes(p));
    } else {
      newPermissions = [...new Set([...selectedRole.permissions, ...categoryPermissions])];
    }

    setSelectedRole({ ...selectedRole, permissions: newPermissions });
  };

  const saveRole = async () => {
    if (!selectedRole) return;

    setError('');
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: selectedRole.permissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save role');
      }

      setIsEditing(false);
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        setSelectedRole(null);
        fetchRoles();
      }
    } catch (error) {
      loggers.admin.error('Failed to delete role:', error);
    }
  };

  const getCategoryPermissionCount = (category: string) => {
    if (!selectedRole) return { selected: 0, total: 0 };

    const categoryPermissions =
      PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].permissions;
    const selected = categoryPermissions.filter((p) =>
      selectedRole.permissions.includes(p.id)
    ).length;

    return { selected, total: categoryPermissions.length };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500 mt-1">Create and manage roles with granular permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Role
        </button>
      </div>

      <div className="flex gap-6">
        {/* Role List */}
        <div className="w-80 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Roles</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading roles...</div>
              ) : (
                roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role);
                      setIsEditing(false);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedRole?.id === role.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            role.isSystem ? 'bg-purple-100' : 'bg-blue-100'
                          }`}
                        >
                          <Shield
                            className={`w-4 h-4 ${
                              role.isSystem ? 'text-purple-600' : 'text-blue-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-500">
                            {role.permissions.length} permissions
                          </div>
                        </div>
                      </div>
                      {role.isSystem && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {role.userCount} users
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Role Editor */}
        <div className="flex-1">
          {selectedRole ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Role Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedRole.name}
                        onChange={(e) =>
                          setSelectedRole({ ...selectedRole, name: e.target.value })
                        }
                        className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={selectedRole.description}
                        onChange={(e) =>
                          setSelectedRole({ ...selectedRole, description: e.target.value })
                        }
                        className="mt-1 text-gray-500 border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
                        placeholder="Role description..."
                      />
                    ) : (
                      <p className="text-gray-500 mt-1">{selectedRole.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            fetchRoles();
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={saveRole}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      </>
                    ) : (
                      <>
                        {!selectedRole.isSystem && (
                          <>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteRole(selectedRole.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Permissions</h3>

                <div className="space-y-2">
                  {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
                    const { selected, total } = getCategoryPermissionCount(categoryKey);
                    const isExpanded = expandedCategories.has(categoryKey);
                    const allSelected = selected === total;

                    return (
                      <div
                        key={categoryKey}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="font-medium text-gray-900">{category.label}</span>
                            <span className="text-sm text-gray-500">
                              {selected}/{total}
                            </span>
                          </div>
                          {isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryPermissions(categoryKey);
                              }}
                              className={`px-3 py-1 text-sm rounded ${
                                allSelected
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50 p-3">
                            <div className="grid grid-cols-2 gap-2">
                              {category.permissions.map((permission) => {
                                const isSelected =
                                  selectedRole.permissions.includes(permission.id);
                                return (
                                  <label
                                    key={permission.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                                      isEditing ? 'hover:bg-white' : ''
                                    } ${isSelected ? 'bg-blue-50' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => togglePermission(permission.id)}
                                      disabled={!isEditing}
                                      className="rounded border-gray-300 text-blue-600"
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900 text-sm">
                                        {permission.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {permission.description}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Select a role to view and edit permissions
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRoles();
          }}
        />
      )}
    </div>
  );
};

// Create Role Modal
interface CreateRoleModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    copyFrom: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create role');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Role</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Project Manager"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the role"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copy Permissions From
            </label>
            <select
              value={formData.copyFrom}
              onChange={(e) => setFormData({ ...formData, copyFrom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Start with no permissions</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.permissions.length} permissions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleEditor;
