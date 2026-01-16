// =============================================================================
// UNIT PICKER — Select units for measurement types
// =============================================================================

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { UNITS, getDimensions, getUnitsForDimension, type Unit } from '../../types/units/UnitSystem';

// -----------------------------------------------------------------------------
// Unit Picker Props
// -----------------------------------------------------------------------------

interface UnitPickerProps {
  value?: string;
  dimension?: string;
  onChange: (unit: Unit) => void;
  onClose?: () => void;
  showSearch?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Unit Picker Component
// -----------------------------------------------------------------------------

export const UnitPicker: React.FC<UnitPickerProps> = ({
  value,
  dimension,
  onChange,
  onClose,
  showSearch = true,
  className = '',
}) => {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(dimension || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get dimensions to show
  const dimensions = useMemo(() => getDimensions(), []);

  // Filter units based on dimension and search
  const filteredUnits = useMemo(() => {
    let units: Unit[] = [];

    if (selectedDimension) {
      units = getUnitsForDimension(selectedDimension);
    } else if (searchQuery) {
      // Search across all dimensions
      for (const dim of dimensions) {
        units.push(...getUnitsForDimension(dim));
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      units = units.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.symbol.toLowerCase().includes(q) ||
          u.aliases?.some((a) => a.toLowerCase().includes(q))
      );
    }

    return units;
  }, [selectedDimension, searchQuery, dimensions]);

  // Handle unit selection
  const handleSelect = (unit: Unit) => {
    onChange(unit);
    onClose?.();
  };

  return (
    <div className={`unit-picker ${className}`}>
      {/* Search */}
      {showSearch && (
        <div className="unit-picker-search">
          <Search size={14} className="unit-picker-search-icon" />
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="unit-picker-search-input"
          />
        </div>
      )}

      {/* Dimensions */}
      {!selectedDimension && !searchQuery && (
        <div className="unit-picker-dimensions">
          {dimensions.map((dim) => (
            <button
              key={dim}
              className="unit-picker-dimension"
              onClick={() => setSelectedDimension(dim)}
            >
              <span className="unit-picker-dimension-name">
                {dim.charAt(0).toUpperCase() + dim.slice(1)}
              </span>
              <span className="unit-picker-dimension-count">
                {getUnitsForDimension(dim).length} units
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Units */}
      {(selectedDimension || searchQuery) && (
        <div className="unit-picker-units">
          {selectedDimension && !searchQuery && (
            <button
              className="unit-picker-back"
              onClick={() => setSelectedDimension(null)}
            >
              ← Back to dimensions
            </button>
          )}

          {filteredUnits.length === 0 ? (
            <div className="unit-picker-empty">No units found</div>
          ) : (
            filteredUnits.map((unit) => (
              <button
                key={unit.id}
                className={`unit-picker-unit ${value === unit.id ? 'selected' : ''}`}
                onClick={() => handleSelect(unit)}
              >
                <span className="unit-picker-unit-symbol">{unit.symbol}</span>
                <span className="unit-picker-unit-name">{unit.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Unit Picker (dropdown style)
// -----------------------------------------------------------------------------

interface CompactUnitPickerProps {
  value?: string;
  dimension?: string;
  onChange: (unit: Unit) => void;
  className?: string;
}

export const CompactUnitPicker: React.FC<CompactUnitPickerProps> = ({
  value,
  dimension,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find selected unit
  const selectedUnit = useMemo(() => {
    if (!value) return null;
    const dims = dimension ? [dimension] : getDimensions();
    for (const dim of dims) {
      const units = UNITS[dim];
      if (units && units[value]) {
        return units[value];
      }
    }
    return null;
  }, [value, dimension]);

  return (
    <div className={`compact-unit-picker ${className}`}>
      <button
        className="compact-unit-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedUnit ? (
          <span className="compact-unit-picker-value">{selectedUnit.symbol}</span>
        ) : (
          <span className="compact-unit-picker-placeholder">Unit</span>
        )}
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="compact-unit-picker-dropdown">
          <UnitPicker
            value={value}
            dimension={dimension}
            onChange={(unit) => {
              onChange(unit);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Unit Quick Select (inline buttons for common units)
// -----------------------------------------------------------------------------

interface UnitQuickSelectProps {
  dimension: string;
  value?: string;
  onChange: (unit: Unit) => void;
  limit?: number;
  className?: string;
}

export const UnitQuickSelect: React.FC<UnitQuickSelectProps> = ({
  dimension,
  value,
  onChange,
  limit = 5,
  className = '',
}) => {
  const units = useMemo(
    () => getUnitsForDimension(dimension).slice(0, limit),
    [dimension, limit]
  );

  return (
    <div className={`unit-quick-select ${className}`}>
      {units.map((unit) => (
        <button
          key={unit.id}
          className={`unit-quick-select-btn ${value === unit.id ? 'selected' : ''}`}
          onClick={() => onChange(unit)}
          title={unit.name}
        >
          {unit.symbol}
        </button>
      ))}
    </div>
  );
};
