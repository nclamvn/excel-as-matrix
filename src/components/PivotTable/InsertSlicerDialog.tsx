// ============================================================
// INSERT SLICER DIALOG — Add Slicer or Timeline to Pivot Table
// ============================================================

import React, { useState, useMemo } from 'react';
import { X, Filter, Calendar, Check } from 'lucide-react';
import { useSlicerStore } from '../../stores/slicerStore';
import { PivotTable } from '../../types/pivot';
import './PivotTable.css';

interface InsertSlicerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pivot: PivotTable;
  mode: 'slicer' | 'timeline';
}

export const InsertSlicerDialog: React.FC<InsertSlicerDialogProps> = ({
  isOpen,
  onClose,
  pivot,
  mode,
}) => {
  const { createSlicer, createTimeline, getSlicersForPivot, getTimelinesForPivot } = useSlicerStore();

  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Get available fields based on mode
  const availableFields = useMemo(() => {
    const existingSlicerFields = getSlicersForPivot(pivot.id).map(s => s.fieldId);
    const existingTimelineFields = getTimelinesForPivot(pivot.id).map(t => t.fieldId);

    return pivot.fields.filter(field => {
      if (mode === 'slicer') {
        // Slicers can be on any field not already having a slicer
        return !existingSlicerFields.includes(field.id);
      } else {
        // Timelines only for date fields not already having a timeline
        return field.dataType === 'date' && !existingTimelineFields.includes(field.id);
      }
    });
  }, [pivot, mode, getSlicersForPivot, getTimelinesForPivot]);

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId);
      } else {
        return [...prev, fieldId];
      }
    });
  };

  const handleInsert = () => {
    let offsetY = 50;

    selectedFields.forEach((fieldId, index) => {
      const field = pivot.fields.find(f => f.id === fieldId);
      if (!field) return;

      const position = { x: 50, y: offsetY + index * (mode === 'slicer' ? 220 : 120) };

      if (mode === 'slicer') {
        createSlicer(pivot.id, fieldId, field.name, position);
      } else {
        createTimeline(pivot.id, fieldId, field.name, position);
      }
    });

    setSelectedFields([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pivot-dialog-overlay" onClick={onClose}>
      <div
        className="pivot-dialog insert-slicer-dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="pivot-dialog-header">
          <div className="pivot-dialog-title">
            {mode === 'slicer' ? <Filter size={20} /> : <Calendar size={20} />}
            <h2>Insert {mode === 'slicer' ? 'Slicer' : 'Timeline'}</h2>
          </div>
          <button className="pivot-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pivot-dialog-body">
          <div className="pivot-dialog-section">
            <h3>Select Fields</h3>
            <p className="section-hint">
              {mode === 'slicer'
                ? 'Choose fields to create slicers for interactive filtering'
                : 'Choose date fields to create timeline filters'}
            </p>

            {availableFields.length === 0 ? (
              <div className="no-fields-message">
                {mode === 'slicer'
                  ? 'All fields already have slicers or no fields available'
                  : 'No date fields available for timeline'}
              </div>
            ) : (
              <div className="field-list">
                {availableFields.map(field => (
                  <label
                    key={field.id}
                    className={`field-item ${selectedFields.includes(field.id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                    />
                    <div className="field-info">
                      <span className="field-name">{field.name}</span>
                      <span className="field-type">{field.dataType}</span>
                    </div>
                    {selectedFields.includes(field.id) && (
                      <Check size={16} className="check-icon" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedFields.length > 0 && (
            <div className="selection-summary">
              <strong>{selectedFields.length}</strong> {mode === 'slicer' ? 'slicer(s)' : 'timeline(s)'} will be created
            </div>
          )}
        </div>

        <div className="pivot-dialog-footer">
          <button className="pivot-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pivot-btn-primary"
            onClick={handleInsert}
            disabled={selectedFields.length === 0}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertSlicerDialog;
