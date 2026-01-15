// Phase 5: Pivot Field Panel
// Drag-and-drop interface for managing pivot table fields

import React, { useState, useCallback } from 'react';
import { usePivotStore, createPivotField, createValueField } from '../../stores/pivotStore';
import { PivotTable, PivotField, ValueField, Aggregation } from '../../types/visualization';

interface PivotFieldPanelProps {
  pivot: PivotTable;
  availableFields: { column: number; name: string }[];
}

type FieldArea = 'available' | 'row' | 'column' | 'value' | 'filter';

export const PivotFieldPanel: React.FC<PivotFieldPanelProps> = ({ pivot, availableFields }) => {
  const {
    addRowField,
    addColumnField,
    addValueField,
    addFilterField,
    removeField,
  } = usePivotStore();

  const [draggedField, setDraggedField] = useState<{
    id: string;
    from: FieldArea;
    data: PivotField | ValueField | { column: number; name: string };
  } | null>(null);

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    from: FieldArea,
    data: PivotField | ValueField | { column: number; name: string }
  ) => {
    setDraggedField({ id, from, data });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, targetArea: FieldArea) => {
      e.preventDefault();
      if (!draggedField) return;

      const { id, from, data } = draggedField;

      // Remove from old area if moving from existing areas
      if (from !== 'available' && from !== targetArea) {
        removeField(pivot.id, id, from as 'row' | 'column' | 'value' | 'filter');
      }

      // Add to new area
      if (targetArea !== 'available' && from !== targetArea) {
        const fieldData = 'sourceColumn' in data ? data : { sourceColumn: data.column, name: data.name };

        switch (targetArea) {
          case 'row':
            addRowField(pivot.id, createPivotField(fieldData.sourceColumn, fieldData.name));
            break;
          case 'column':
            addColumnField(pivot.id, createPivotField(fieldData.sourceColumn, fieldData.name));
            break;
          case 'value':
            addValueField(pivot.id, createValueField(fieldData.sourceColumn, fieldData.name, 'Sum'));
            break;
          case 'filter':
            addFilterField(pivot.id, createPivotField(fieldData.sourceColumn, fieldData.name));
            break;
        }
      }

      setDraggedField(null);
    },
    [draggedField, pivot.id, addRowField, addColumnField, addValueField, addFilterField, removeField]
  );

  const handleRemoveField = (fieldId: string, area: FieldArea) => {
    if (area !== 'available') {
      removeField(pivot.id, fieldId, area as 'row' | 'column' | 'value' | 'filter');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border rounded-lg">
      {/* Available Fields */}
      <FieldDropZone
        title="Available Fields"
        area="available"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'available')}
        isDragTarget={draggedField?.from !== 'available'}
      >
        {availableFields.map((field) => (
          <FieldChip
            key={`available-${field.column}`}
            label={field.name}
            area="available"
            onDragStart={(e) => handleDragStart(e, `available-${field.column}`, 'available', field)}
          />
        ))}
      </FieldDropZone>

      <div className="grid grid-cols-2 gap-4">
        {/* Filter Area */}
        <FieldDropZone
          title="Filters"
          area="filter"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'filter')}
          isDragTarget={draggedField !== null && draggedField.from !== 'filter'}
          className="col-span-2"
        >
          {pivot.filterFields.map((field) => (
            <FieldChip
              key={field.id}
              label={field.name}
              area="filter"
              onDragStart={(e) => handleDragStart(e, field.id, 'filter', field)}
              onRemove={() => handleRemoveField(field.id, 'filter')}
            />
          ))}
        </FieldDropZone>

        {/* Row Area */}
        <FieldDropZone
          title="Rows"
          area="row"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'row')}
          isDragTarget={draggedField !== null && draggedField.from !== 'row'}
        >
          {pivot.rowFields.map((field) => (
            <FieldChip
              key={field.id}
              label={field.name}
              area="row"
              onDragStart={(e) => handleDragStart(e, field.id, 'row', field)}
              onRemove={() => handleRemoveField(field.id, 'row')}
            />
          ))}
        </FieldDropZone>

        {/* Column Area */}
        <FieldDropZone
          title="Columns"
          area="column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'column')}
          isDragTarget={draggedField !== null && draggedField.from !== 'column'}
        >
          {pivot.columnFields.map((field) => (
            <FieldChip
              key={field.id}
              label={field.name}
              area="column"
              onDragStart={(e) => handleDragStart(e, field.id, 'column', field)}
              onRemove={() => handleRemoveField(field.id, 'column')}
            />
          ))}
        </FieldDropZone>

        {/* Value Area */}
        <FieldDropZone
          title="Values"
          area="value"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'value')}
          isDragTarget={draggedField !== null && draggedField.from !== 'value'}
          className="col-span-2"
        >
          {pivot.valueFields.map((field) => (
            <ValueFieldChip
              key={field.id}
              field={field}
              pivotId={pivot.id}
              onDragStart={(e) => handleDragStart(e, field.id, 'value', field)}
              onRemove={() => handleRemoveField(field.id, 'value')}
            />
          ))}
        </FieldDropZone>
      </div>
    </div>
  );
};

interface FieldDropZoneProps {
  title: string;
  area: FieldArea;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragTarget: boolean;
  className?: string;
  children: React.ReactNode;
}

const FieldDropZone: React.FC<FieldDropZoneProps> = ({
  title,
  area: _area,
  onDragOver,
  onDrop,
  isDragTarget,
  className = '',
  children,
}) => {
  return (
    <div
      className={`
        p-3 border rounded min-h-[80px]
        ${isDragTarget ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}
        transition-colors duration-150
        ${className}
      `}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="text-xs font-medium text-gray-500 mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {children}
        {React.Children.count(children) === 0 && (
          <span className="text-xs text-gray-400 italic">Drop fields here</span>
        )}
      </div>
    </div>
  );
};

interface FieldChipProps {
  label: string;
  area: FieldArea;
  onDragStart: (e: React.DragEvent) => void;
  onRemove?: () => void;
}

const FieldChip: React.FC<FieldChipProps> = ({ label, area, onDragStart, onRemove }) => {
  const colors: Record<FieldArea, string> = {
    available: 'bg-gray-100 text-gray-700 border-gray-300',
    row: 'bg-green-100 text-green-700 border-green-300',
    column: 'bg-blue-100 text-blue-700 border-blue-300',
    value: 'bg-orange-100 text-orange-700 border-orange-300',
    filter: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        flex items-center gap-1 px-2 py-1 text-xs rounded border cursor-move
        ${colors[area]}
        hover:shadow-sm transition-shadow
      `}
    >
      <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
      </svg>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ValueFieldChipProps {
  field: ValueField;
  pivotId: string;
  onDragStart: (e: React.DragEvent) => void;
  onRemove: () => void;
}

const ValueFieldChip: React.FC<ValueFieldChipProps> = ({ field, pivotId: _pivotId, onDragStart, onRemove }) => {
  const [showMenu, setShowMenu] = useState(false);

  const aggregations: Aggregation[] = [
    'Sum',
    'Count',
    'Average',
    'Min',
    'Max',
    'Product',
    'CountNumbers',
    'StdDev',
    'Var',
  ];

  const handleAggregationChange = (_agg: Aggregation) => {
    // This would need the proper update through the store
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <div
        draggable
        onDragStart={onDragStart}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded border cursor-move
          bg-orange-100 text-orange-700 border-orange-300 hover:shadow-sm transition-shadow"
      >
        <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
        <span>{field.aggregation}({field.name})</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="ml-1 hover:text-orange-900"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10">
          {aggregations.map((agg) => (
            <button
              key={agg}
              onClick={() => handleAggregationChange(agg)}
              className={`block w-full px-3 py-1 text-left text-xs hover:bg-gray-100
                ${field.aggregation === agg ? 'bg-orange-50 font-medium' : ''}`}
            >
              {agg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
