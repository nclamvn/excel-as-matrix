// ============================================================
// PIVOT FIELD LIST — Field Management Panel
// ============================================================

import React, { useState } from 'react';
import {
  GripVertical,
  ChevronDown,
  X,
  Filter,
  ArrowUpDown,
  Calculator,
} from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import {
  PivotTable,
  PivotField,
  PivotAreaField,
  AggregateFunction,
  AGGREGATE_LABELS,
} from '../../types/pivot';
import './PivotTable.css';

interface PivotFieldListProps {
  pivot: PivotTable;
  onFieldsChange?: () => void;
}

type AreaType = 'row' | 'column' | 'value' | 'filter';

const AREA_LABELS: Record<AreaType, string> = {
  filter: 'Filters',
  column: 'Columns',
  row: 'Rows',
  value: 'Values',
};

export const PivotFieldList: React.FC<PivotFieldListProps> = ({
  pivot,
  onFieldsChange,
}) => {
  const {
    addFieldToArea,
    removeFieldFromArea,
    moveField,
    setAggregateFunction,
    setSortOrder,
  } = usePivotStore();

  const [draggedField, setDraggedField] = useState<{
    fieldId: string;
    fromArea?: AreaType;
  } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Get fields not yet added to any area
  const availableFields = pivot.fields.filter(field => {
    const inRow = pivot.rowFields.some(f => f.fieldId === field.id);
    const inCol = pivot.columnFields.some(f => f.fieldId === field.id);
    const inVal = pivot.valueFields.some(f => f.fieldId === field.id);
    const inFilter = pivot.filterFields.some(f => f.fieldId === field.id);
    return !inRow && !inCol && !inVal && !inFilter;
  });

  const handleDragStart = (
    e: React.DragEvent,
    fieldId: string,
    fromArea?: AreaType
  ) => {
    setDraggedField({ fieldId, fromArea });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toArea: AreaType) => {
    e.preventDefault();

    if (!draggedField) return;

    const { fieldId, fromArea } = draggedField;

    if (fromArea) {
      // Moving from one area to another
      moveField(pivot.id, fieldId, fromArea, toArea, 0);
    } else {
      // Adding from available fields
      const field = pivot.fields.find(f => f.id === fieldId);
      if (field) {
        const areaField: PivotAreaField = {
          fieldId: field.id,
          sortOrder: 'asc',
          showSubtotals: true,
          aggregateFunction: toArea === 'value' ? 'sum' : undefined,
        };
        addFieldToArea(pivot.id, toArea, areaField);
      }
    }

    setDraggedField(null);
    onFieldsChange?.();
  };

  const handleRemoveField = (area: AreaType, fieldId: string) => {
    removeFieldFromArea(pivot.id, area, fieldId);
    onFieldsChange?.();
  };

  const handleAggregateChange = (fieldId: string, func: AggregateFunction) => {
    setAggregateFunction(pivot.id, fieldId, func);
    setActiveDropdown(null);
    onFieldsChange?.();
  };

  const handleSortChange = (
    fieldId: string,
    area: 'row' | 'column',
    order: 'asc' | 'desc' | 'none'
  ) => {
    setSortOrder(pivot.id, fieldId, area, order);
    setActiveDropdown(null);
    onFieldsChange?.();
  };

  const getFieldName = (fieldId: string): string => {
    const field = pivot.fields.find(f => f.id === fieldId);
    return field?.name || fieldId;
  };

  const renderAvailableField = (field: PivotField) => (
    <div
      key={field.id}
      className="pivot-field-item available"
      draggable
      onDragStart={e => handleDragStart(e, field.id)}
    >
      <GripVertical size={14} className="grip-icon" />
      <span className="field-name">{field.name}</span>
      <span className={`field-type-badge type-${field.dataType}`}>
        {field.dataType.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  const renderAreaField = (
    areaField: PivotAreaField,
    area: AreaType
  ) => {
    const fieldName = getFieldName(areaField.fieldId);
    const dropdownId = `${area}-${areaField.fieldId}`;
    const isDropdownOpen = activeDropdown === dropdownId;

    return (
      <div
        key={areaField.fieldId}
        className="pivot-field-item in-area"
        draggable
        onDragStart={e => handleDragStart(e, areaField.fieldId, area)}
      >
        <GripVertical size={14} className="grip-icon" />
        <span className="field-name">
          {area === 'value' && areaField.aggregateFunction
            ? `${AGGREGATE_LABELS[areaField.aggregateFunction]} of ${fieldName}`
            : fieldName}
        </span>

        <div className="field-actions">
          <button
            className="field-action-btn"
            onClick={() => setActiveDropdown(isDropdownOpen ? null : dropdownId)}
          >
            <ChevronDown size={14} />
          </button>
          <button
            className="field-action-btn remove"
            onClick={() => handleRemoveField(area, areaField.fieldId)}
          >
            <X size={14} />
          </button>
        </div>

        {isDropdownOpen && (
          <div className="field-dropdown" onClick={e => e.stopPropagation()}>
            {area === 'value' && (
              <>
                <div className="dropdown-section">
                  <span className="dropdown-label">
                    <Calculator size={12} />
                    Summarize by
                  </span>
                  {(Object.keys(AGGREGATE_LABELS) as AggregateFunction[]).map(func => (
                    <button
                      key={func}
                      className={`dropdown-item ${areaField.aggregateFunction === func ? 'active' : ''}`}
                      onClick={() => handleAggregateChange(areaField.fieldId, func)}
                    >
                      {AGGREGATE_LABELS[func]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(area === 'row' || area === 'column') && (
              <>
                <div className="dropdown-section">
                  <span className="dropdown-label">
                    <ArrowUpDown size={12} />
                    Sort
                  </span>
                  <button
                    className={`dropdown-item ${areaField.sortOrder === 'asc' ? 'active' : ''}`}
                    onClick={() => handleSortChange(areaField.fieldId, area, 'asc')}
                  >
                    A to Z
                  </button>
                  <button
                    className={`dropdown-item ${areaField.sortOrder === 'desc' ? 'active' : ''}`}
                    onClick={() => handleSortChange(areaField.fieldId, area, 'desc')}
                  >
                    Z to A
                  </button>
                  <button
                    className={`dropdown-item ${areaField.sortOrder === 'none' ? 'active' : ''}`}
                    onClick={() => handleSortChange(areaField.fieldId, area, 'none')}
                  >
                    No Sort
                  </button>
                </div>
              </>
            )}

            {area === 'filter' && (
              <div className="dropdown-section">
                <span className="dropdown-label">
                  <Filter size={12} />
                  Filter options
                </span>
                <button className="dropdown-item">
                  Select values...
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderArea = (area: AreaType) => {
    const fields = {
      row: pivot.rowFields,
      column: pivot.columnFields,
      value: pivot.valueFields,
      filter: pivot.filterFields,
    }[area];

    return (
      <div
        className={`pivot-area ${draggedField ? 'droppable' : ''}`}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, area)}
      >
        <div className="pivot-area-header">
          <span>{AREA_LABELS[area]}</span>
          <span className="field-count">{fields.length}</span>
        </div>
        <div className="pivot-area-content">
          {fields.length === 0 ? (
            <div className="pivot-area-placeholder">
              Drag fields here
            </div>
          ) : (
            fields.map(f => renderAreaField(f, area))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pivot-field-list">
      <div className="pivot-fields-section">
        <h3>PivotTable Fields</h3>
        <p className="pivot-fields-hint">
          Drag fields to the areas below
        </p>
        <div className="pivot-available-fields">
          {availableFields.length === 0 ? (
            <div className="no-fields-message">
              All fields have been added
            </div>
          ) : (
            availableFields.map(renderAvailableField)
          )}
        </div>
      </div>

      <div className="pivot-areas-section">
        <div className="pivot-areas-grid">
          {renderArea('filter')}
          {renderArea('column')}
          {renderArea('row')}
          {renderArea('value')}
        </div>
      </div>
    </div>
  );
};

export default PivotFieldList;
