// ============================================================
// NAME MANAGER DIALOG — Manage Named Ranges and LAMBDA Functions
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  BookOpen,
  Code,
  Grid3X3,
  Hash,
  ChevronDown,
} from 'lucide-react';
import { useNameManagerStore, NamedItem, NameType, NameScope } from '../../stores/nameManagerStore';
import { useWorkbookStore } from '../../stores/workbookStore';

interface NameManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'range' | 'formula' | 'lambda' | 'constant';

const TYPE_LABELS: Record<NameType, string> = {
  range: 'Named Range',
  formula: 'Formula',
  lambda: 'LAMBDA Function',
  constant: 'Constant',
};

const TYPE_ICONS: Record<NameType, React.ReactNode> = {
  range: <Grid3X3 size={14} />,
  formula: <BookOpen size={14} />,
  lambda: <Code size={14} />,
  constant: <Hash size={14} />,
};

export const NameManagerDialog: React.FC<NameManagerDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { getAllNames, createName, updateName, deleteName, isValidName, isNameAvailable } = useNameManagerStore();
  const { sheets } = useWorkbookStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<NamedItem | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // New name form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<NameType>('range');
  const [newScope, setNewScope] = useState<NameScope>('workbook');
  const [newRefersTo, setNewRefersTo] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newParameters, setNewParameters] = useState('');
  const [formError, setFormError] = useState('');

  const allNames = getAllNames();

  const filteredNames = useMemo(() => {
    let result = allNames;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(n => n.type === filterType);
    }

    // Filter by search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.name.toLowerCase().includes(lower) ||
        n.refersTo.toLowerCase().includes(lower) ||
        (n.comment?.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [allNames, filterType, searchQuery]);

  const resetForm = () => {
    setNewName('');
    setNewType('range');
    setNewScope('workbook');
    setNewRefersTo('');
    setNewComment('');
    setNewParameters('');
    setFormError('');
  };

  const handleCreate = () => {
    setFormError('');

    // Validate
    if (!newName) {
      setFormError('Name is required');
      return;
    }

    if (!isValidName(newName)) {
      setFormError('Invalid name format. Must start with a letter or underscore.');
      return;
    }

    if (!isNameAvailable(newName, newScope)) {
      setFormError('Name already exists in this scope');
      return;
    }

    if (!newRefersTo) {
      setFormError('Refers To is required');
      return;
    }

    // Parse parameters for LAMBDA
    const parameters = newType === 'lambda' && newParameters
      ? newParameters.split(',').map(p => p.trim()).filter(p => p)
      : undefined;

    const result = createName(newName, newType, newRefersTo, newScope, newComment || undefined, parameters);

    if (result) {
      resetForm();
      setShowNewDialog(false);
    } else {
      setFormError('Failed to create name');
    }
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    setFormError('');

    if (!newName) {
      setFormError('Name is required');
      return;
    }

    if (!isValidName(newName)) {
      setFormError('Invalid name format');
      return;
    }

    if (newName.toUpperCase() !== editingItem.name && !isNameAvailable(newName, newScope, editingItem.id)) {
      setFormError('Name already exists in this scope');
      return;
    }

    const parameters = newType === 'lambda' && newParameters
      ? newParameters.split(',').map(p => p.trim()).filter(p => p)
      : undefined;

    updateName(editingItem.id, {
      name: newName,
      type: newType,
      scope: newScope,
      refersTo: newRefersTo,
      comment: newComment || undefined,
      parameters,
    });

    resetForm();
    setEditingItem(null);
  };

  const handleEdit = (item: NamedItem) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewType(item.type);
    setNewScope(item.scope);
    setNewRefersTo(item.refersTo);
    setNewComment(item.comment || '');
    setNewParameters(item.parameters?.join(', ') || '');
    setShowNewDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this name?')) {
      deleteName(id);
    }
  };

  const getScopeName = (scope: NameScope): string => {
    if (scope === 'workbook') return 'Workbook';
    const sheet = Object.values(sheets).find(s => s.id === scope);
    return sheet?.name || 'Unknown Sheet';
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog name-manager-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Name Manager</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Toolbar */}
          <div className="name-manager-toolbar">
            <button
              className="dialog-btn-primary"
              onClick={() => {
                resetForm();
                setEditingItem(null);
                setShowNewDialog(true);
              }}
            >
              <Plus size={14} />
              New
            </button>

            <div className="name-manager-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search names..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-dropdown">
              <button
                className="filter-btn"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <Filter size={14} />
                <span>
                  {filterType === 'all' ? 'All Types' : TYPE_LABELS[filterType as NameType]}
                </span>
                <ChevronDown size={14} />
              </button>
              {showFilterMenu && (
                <div className="filter-menu">
                  <button onClick={() => { setFilterType('all'); setShowFilterMenu(false); }}>
                    All Types
                  </button>
                  <button onClick={() => { setFilterType('range'); setShowFilterMenu(false); }}>
                    {TYPE_ICONS.range} Named Ranges
                  </button>
                  <button onClick={() => { setFilterType('formula'); setShowFilterMenu(false); }}>
                    {TYPE_ICONS.formula} Formulas
                  </button>
                  <button onClick={() => { setFilterType('lambda'); setShowFilterMenu(false); }}>
                    {TYPE_ICONS.lambda} LAMBDA Functions
                  </button>
                  <button onClick={() => { setFilterType('constant'); setShowFilterMenu(false); }}>
                    {TYPE_ICONS.constant} Constants
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Names Table */}
          <div className="names-table-container">
            <table className="names-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Refers To</th>
                  <th>Scope</th>
                  <th>Comment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNames.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="no-names">
                      {searchQuery || filterType !== 'all'
                        ? 'No matching names found'
                        : 'No names defined. Click "New" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredNames.map(item => (
                    <tr key={item.id}>
                      <td className="name-cell">
                        {TYPE_ICONS[item.type]}
                        <span>{item.name}</span>
                      </td>
                      <td>{TYPE_LABELS[item.type]}</td>
                      <td className="refers-to-cell" title={item.refersTo}>
                        {item.refersTo}
                      </td>
                      <td>{getScopeName(item.scope)}</td>
                      <td className="comment-cell" title={item.comment}>
                        {item.comment || '-'}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Status */}
          <div className="name-manager-status">
            {filteredNames.length} name{filteredNames.length !== 1 ? 's' : ''} shown
            {filterType !== 'all' || searchQuery ? ` (filtered from ${allNames.length})` : ''}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* New/Edit Name Dialog */}
        {showNewDialog && (
          <div className="name-edit-overlay" onClick={() => { setShowNewDialog(false); resetForm(); setEditingItem(null); }}>
            <div className="name-edit-dialog" onClick={e => e.stopPropagation()}>
              <div className="name-edit-header">
                <h3>{editingItem ? 'Edit Name' : 'New Name'}</h3>
                <button onClick={() => { setShowNewDialog(false); resetForm(); setEditingItem(null); }}>
                  <X size={16} />
                </button>
              </div>

              <div className="name-edit-body">
                {formError && (
                  <div className="form-error">{formError}</div>
                )}

                <div className="form-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., TaxRate, MySum"
                  />
                </div>

                <div className="form-field">
                  <label>Type:</label>
                  <select value={newType} onChange={e => setNewType(e.target.value as NameType)}>
                    <option value="range">Named Range</option>
                    <option value="formula">Formula</option>
                    <option value="lambda">LAMBDA Function</option>
                    <option value="constant">Constant</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Scope:</label>
                  <select value={newScope} onChange={e => setNewScope(e.target.value)}>
                    <option value="workbook">Workbook</option>
                    {Object.values(sheets).map(sheet => (
                      <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                    ))}
                  </select>
                </div>

                {newType === 'lambda' && (
                  <div className="form-field">
                    <label>Parameters:</label>
                    <input
                      type="text"
                      value={newParameters}
                      onChange={e => setNewParameters(e.target.value)}
                      placeholder="e.g., x, y, z"
                    />
                    <small>Comma-separated parameter names</small>
                  </div>
                )}

                <div className="form-field">
                  <label>Refers To:</label>
                  <input
                    type="text"
                    value={newRefersTo}
                    onChange={e => setNewRefersTo(e.target.value)}
                    placeholder={
                      newType === 'range' ? 'e.g., Sheet1!$A$1:$B$10' :
                      newType === 'lambda' ? 'e.g., x + y * 2' :
                      newType === 'constant' ? 'e.g., 0.0825' :
                      'e.g., =SUM(A:A)'
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Comment (optional):</label>
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Description of this name"
                  />
                </div>
              </div>

              <div className="name-edit-footer">
                <button
                  className="dialog-btn-secondary"
                  onClick={() => { setShowNewDialog(false); resetForm(); setEditingItem(null); }}
                >
                  Cancel
                </button>
                <button
                  className="dialog-btn-primary"
                  onClick={editingItem ? handleUpdate : handleCreate}
                >
                  {editingItem ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NameManagerDialog;
