// =============================================================================
// ACTION PICKER — Select action to add to workflow
// =============================================================================

import React, { useState } from 'react';
import { macroEngine } from '../../macros/MacroEngine';
import type { ActionType, ActionCategory } from '../../macros/types';

interface ActionPickerProps {
  onSelect: (actionType: ActionType) => void;
  onClose: () => void;
}

export const ActionPicker: React.FC<ActionPickerProps> = ({
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all');

  const categories = macroEngine.getActionCategories();
  const allActions = macroEngine.getAvailableActions();

  const filteredActions = allActions.filter(action => {
    const matchesSearch = searchQuery === '' ||
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.nameVi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: ActionCategory) => {
    const icons: Record<ActionCategory, JSX.Element> = {
      data: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
      formula: <path d="M4 4h16M4 12h16M4 20h16"/>,
      format: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
      chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
      sheet: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
      file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
      notification: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
      external: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
      ai: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
    };

    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[category] || <circle cx="12" cy="12" r="10"/>}
      </svg>
    );
  };

  return (
    <div className="action-picker-overlay" onClick={onClose}>
      <div className="action-picker" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="picker-header">
          <h3>Add Action</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="picker-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className="picker-categories">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.category}
              className={`category-btn ${selectedCategory === cat.category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.category)}
            >
              {getCategoryIcon(cat.category)}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Actions List */}
        <div className="picker-actions">
          {filteredActions.length === 0 ? (
            <div className="no-actions">
              <p>No actions found</p>
            </div>
          ) : (
            filteredActions.map(action => (
              <button
                key={action.type}
                className="action-item"
                onClick={() => onSelect(action.type)}
              >
                <span className="action-icon">
                  {getCategoryIcon(action.category)}
                </span>
                <div className="action-info">
                  <span className="action-name">{action.name}</span>
                  <span className="action-desc">{action.description}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionPicker;
