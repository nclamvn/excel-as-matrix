// =============================================================================
// TYPE SELECTOR — Select semantic type for a cell/column
// =============================================================================

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, Check } from 'lucide-react';
import {
  BUILT_IN_TYPES,
  TYPE_CATEGORIES,
  type SemanticType,
  type TypeCategory,
} from '../../types/semantic/types';
import { TypeBadge, CategoryBadge } from './TypeBadge';

// -----------------------------------------------------------------------------
// Type Selector Props
// -----------------------------------------------------------------------------

interface TypeSelectorProps {
  value?: string;
  onChange: (type: SemanticType) => void;
  onClose?: () => void;
  showSearch?: boolean;
  showCategories?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Type Selector Component
// -----------------------------------------------------------------------------

export const TypeSelector: React.FC<TypeSelectorProps> = ({
  value,
  onChange,
  onClose,
  showSearch = true,
  showCategories = true,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TypeCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter types based on category and search
  const filteredTypes = useMemo(() => {
    let types = Object.values(BUILT_IN_TYPES);

    if (selectedCategory) {
      types = types.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      types = types.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    return types;
  }, [selectedCategory, searchQuery]);

  // Handle type selection
  const handleSelect = (type: SemanticType) => {
    onChange(type);
    onClose?.();
  };

  // Handle back button
  const handleBack = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  return (
    <div className={`type-selector ${className}`}>
      {/* Header */}
      <div className="type-selector-header">
        {selectedCategory ? (
          <button className="type-selector-back" onClick={handleBack}>
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <span className="type-selector-title">Select Type</span>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="type-selector-search">
          <Search size={14} className="type-selector-search-icon" />
          <input
            type="text"
            placeholder="Search types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="type-selector-search-input"
          />
        </div>
      )}

      {/* Categories or Types */}
      <div className="type-selector-content">
        {showCategories && !selectedCategory && !searchQuery ? (
          // Show categories
          <div className="type-selector-categories">
            {TYPE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className="type-selector-category"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="type-selector-category-icon" style={{ color: cat.color }}>
                  {cat.icon}
                </span>
                <div className="type-selector-category-info">
                  <span className="type-selector-category-name">{cat.name}</span>
                  <span className="type-selector-category-desc">{cat.description}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Show types
          <div className="type-selector-types">
            {filteredTypes.length === 0 ? (
              <div className="type-selector-empty">No types found</div>
            ) : (
              filteredTypes.map((type) => (
                <button
                  key={type.id}
                  className={`type-selector-type ${value === type.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(type)}
                >
                  <TypeBadge type={type} size="small" showLabel={false} />
                  <div className="type-selector-type-info">
                    <span className="type-selector-type-name">{type.name}</span>
                    <span className="type-selector-type-desc">{type.description}</span>
                  </div>
                  {value === type.id && <Check size={14} className="type-selector-check" />}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Type Selector (dropdown style)
// -----------------------------------------------------------------------------

interface CompactTypeSelectorProps {
  value?: string;
  onChange: (type: SemanticType) => void;
  className?: string;
}

export const CompactTypeSelector: React.FC<CompactTypeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedType = value ? BUILT_IN_TYPES[value] : null;

  return (
    <div className={`compact-type-selector ${className}`}>
      <button className="compact-type-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        {selectedType ? (
          <TypeBadge type={selectedType} size="small" />
        ) : (
          <span className="compact-type-selector-placeholder">Select type</span>
        )}
      </button>

      {isOpen && (
        <div className="compact-type-selector-dropdown">
          <TypeSelector
            value={value}
            onChange={(type) => {
              onChange(type);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
            showSearch={true}
            showCategories={false}
          />
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Type Quick Select (inline buttons)
// -----------------------------------------------------------------------------

interface TypeQuickSelectProps {
  value?: string;
  onChange: (type: SemanticType) => void;
  types?: string[];
  className?: string;
}

export const TypeQuickSelect: React.FC<TypeQuickSelectProps> = ({
  value,
  onChange,
  types = ['text', 'number', 'currency', 'date', 'percentage', 'boolean'],
  className = '',
}) => {
  return (
    <div className={`type-quick-select ${className}`}>
      {types.map((typeId) => {
        const type = BUILT_IN_TYPES[typeId];
        if (!type) return null;

        return (
          <button
            key={typeId}
            className={`type-quick-select-btn ${value === typeId ? 'selected' : ''}`}
            onClick={() => onChange(type)}
            title={type.name}
          >
            <span style={{ color: type.color }}>{type.icon}</span>
          </button>
        );
      })}
    </div>
  );
};

export { CategoryBadge };
