/**
 * Filter View Selector — dropdown to create, switch, and manage personal filter views.
 */
import { useState, useRef, useEffect } from 'react';
import { useFilterViewStore } from '@/stores/filterViewStore';

interface FilterViewSelectorProps {
  workbookId: string;
  sheetId: string;
  userId: string;
  userName: string;
}

export function FilterViewSelector({ workbookId, sheetId, userId, userName }: FilterViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getViews, getActiveView, setActiveView, createView, deleteView } = useFilterViewStore();

  const views = getViews(workbookId, sheetId, userId);
  const activeView = getActiveView(sheetId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createView(workbookId, sheetId, name, userId, userName);
    setActiveView(sheetId, id);
    setNewName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    deleteView(workbookId, viewId);
  };

  return (
    <div className="fv-selector" ref={dropdownRef}>
      <button
        type="button"
        className={`fv-trigger ${activeView ? 'fv-trigger--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{activeView?.name || 'Filter Views'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="fv-dropdown">
          {/* Default (no filter) */}
          <div
            className={`fv-item ${!activeView ? 'fv-item--active' : ''}`}
            onClick={() => { setActiveView(sheetId, null); setIsOpen(false); }}
          >
            <span className="fv-item-name">Default view</span>
          </div>

          {/* Saved views */}
          {views.map((view) => (
            <div
              key={view.id}
              className={`fv-item ${activeView?.id === view.id ? 'fv-item--active' : ''}`}
              onClick={() => { setActiveView(sheetId, view.id); setIsOpen(false); }}
            >
              <span className="fv-item-name">
                {view.name}
                {view.filters.length > 0 && (
                  <span className="fv-count">{view.filters.length}</span>
                )}
              </span>
              {view.isPersonal && <span className="fv-badge">Personal</span>}
              <button
                type="button"
                className="fv-delete"
                onClick={(e) => handleDelete(e, view.id)}
                title="Delete"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Separator */}
          <div className="fv-separator" />

          {/* Create new */}
          {isCreating ? (
            <div className="fv-create-form">
              <input
                autoFocus
                placeholder="View name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />
              <button type="button" className="fv-create-btn" onClick={handleCreate}>
                Create
              </button>
            </div>
          ) : (
            <div className="fv-item fv-item--create" onClick={() => setIsCreating(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create filter view</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterViewSelector;
