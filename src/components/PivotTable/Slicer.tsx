// ============================================================
// SLICER COMPONENT — Interactive Filter for Pivot Tables
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Filter,
  Check,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useSlicerStore } from '../../stores/slicerStore';
import { usePivotStore } from '../../stores/pivotStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { Slicer as SlicerType, PivotTable, PivotCellValue } from '../../types/pivot';
import './PivotTable.css';

interface SlicerProps {
  slicer: SlicerType;
  pivot: PivotTable;
  onPositionChange?: (x: number, y: number) => void;
}

export const Slicer: React.FC<SlicerProps> = ({
  slicer,
  pivot,
  onPositionChange,
}) => {
  const {
    toggleSlicerValue,
    clearSlicerSelection,
    selectAllSlicerValues,
    deleteSlicer,
    selectSlicer,
    updateSlicerPosition,
  } = useSlicerStore();
  const { setFilter, removeFilter } = usePivotStore();
  const { getCellValue } = useWorkbookStore();

  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get unique values for this field from source data
  const uniqueValues = useMemo(() => {
    const fieldDef = pivot.fields.find(f => f.id === slicer.fieldId);
    if (!fieldDef) return [];

    // Parse source range
    const rangeMatch = pivot.sourceRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
    if (!rangeMatch) return [];

    const startCol = rangeMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(rangeMatch[2], 10) - 1;
    const endRow = parseInt(rangeMatch[4], 10) - 1;

    const colIndex = fieldDef.sourceColumn;
    const values = new Set<PivotCellValue>();

    // Skip header row
    for (let r = startRow + 1; r <= endRow; r++) {
      const value = getCellValue(pivot.sourceSheetId, r, startCol + colIndex);
      if (value !== null && value !== undefined && value !== '') {
        values.add(value);
      }
    }

    const result = Array.from(values);

    // Sort based on slicer setting
    if (slicer.sortOrder === 'asc') {
      result.sort((a, b) => String(a).localeCompare(String(b)));
    } else if (slicer.sortOrder === 'desc') {
      result.sort((a, b) => String(b).localeCompare(String(a)));
    }

    return result;
  }, [pivot, slicer.fieldId, slicer.sortOrder, getCellValue]);

  // Check if a value is selected
  const isSelected = useCallback((value: PivotCellValue) => {
    // If no selection, all values are "selected" (no filter)
    if (slicer.selectedValues.length === 0) return true;
    return slicer.selectedValues.includes(value);
  }, [slicer.selectedValues]);

  // Handle value click
  const handleValueClick = (value: PivotCellValue) => {
    toggleSlicerValue(slicer.id, value);

    // Update pivot filter
    const newSelected = slicer.selectedValues.includes(value)
      ? slicer.selectedValues.filter(v => v !== value)
      : [...slicer.selectedValues, value];

    if (newSelected.length === 0 || newSelected.length === uniqueValues.length) {
      // No filter - remove it
      removeFilter(pivot.id, slicer.fieldId);
    } else {
      setFilter(pivot.id, {
        fieldId: slicer.fieldId,
        selectedValues: newSelected,
        excludeMode: false,
      });
    }
  };

  // Clear all selections (show all)
  const handleClearFilter = () => {
    clearSlicerSelection(slicer.id);
    removeFilter(pivot.id, slicer.fieldId);
  };

  // Select all values
  const handleSelectAll = () => {
    selectAllSlicerValues(slicer.id, uniqueValues);
    removeFilter(pivot.id, slicer.fieldId);
  };

  // Delete slicer
  const handleDelete = () => {
    removeFilter(pivot.id, slicer.fieldId);
    deleteSlicer(slicer.id);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.slicer-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - slicer.position.x,
        y: e.clientY - slicer.position.y,
      });
      selectSlicer(slicer.id);
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateSlicerPosition(slicer.id, { x: newX, y: newY });
      onPositionChange?.(newX, newY);
    }
  }, [isDragging, dragOffset, slicer.id, updateSlicerPosition, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const hasActiveFilter = slicer.selectedValues.length > 0 &&
    slicer.selectedValues.length < uniqueValues.length;

  return (
    <div
      className={`slicer ${isDragging ? 'dragging' : ''}`}
      style={{
        left: slicer.position.x,
        top: slicer.position.y,
        width: slicer.position.width,
        height: slicer.position.height,
        borderColor: slicer.style.borderColor,
        borderRadius: slicer.style.borderRadius,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      {slicer.showHeader && (
        <div
          className="slicer-header"
          style={{
            backgroundColor: slicer.style.headerColor,
            color: slicer.style.headerTextColor,
          }}
        >
          <span className="slicer-title">{slicer.name}</span>
          <div className="slicer-actions">
            {hasActiveFilter && (
              <button
                className="slicer-action-btn"
                onClick={handleClearFilter}
                title="Clear Filter"
              >
                <Filter size={14} />
              </button>
            )}
            <button
              className="slicer-action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Menu Dropdown */}
          {showMenu && (
            <div className="slicer-menu" onClick={e => e.stopPropagation()}>
              <button onClick={handleSelectAll}>
                <Check size={14} />
                Select All
              </button>
              <button onClick={handleClearFilter}>
                <X size={14} />
                Clear Filter
              </button>
              <div className="menu-divider" />
              <button onClick={handleDelete} className="danger">
                <Trash2 size={14} />
                Remove Slicer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Values List */}
      <div className="slicer-body">
        <div
          className="slicer-values"
          style={{
            gridTemplateColumns: `repeat(${slicer.columns}, 1fr)`,
          }}
        >
          {uniqueValues.map((value, index) => (
            <button
              key={index}
              className={`slicer-value ${isSelected(value) ? 'selected' : 'unselected'}`}
              style={{
                backgroundColor: isSelected(value)
                  ? slicer.style.selectedColor
                  : slicer.style.unselectedColor,
                color: isSelected(value)
                  ? slicer.style.selectedTextColor
                  : slicer.style.unselectedTextColor,
                borderRadius: slicer.style.borderRadius,
              }}
              onClick={() => handleValueClick(value)}
            >
              <span className="value-text">{String(value)}</span>
              {isSelected(value) && hasActiveFilter && (
                <Check size={12} className="check-icon" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer with count */}
      <div className="slicer-footer">
        <span>
          {hasActiveFilter
            ? `${slicer.selectedValues.length} of ${uniqueValues.length} selected`
            : `${uniqueValues.length} items`
          }
        </span>
      </div>
    </div>
  );
};

export default Slicer;
