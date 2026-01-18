// ============================================================
// GROUPING DIALOG — Date and Number Grouping for Pivot Fields
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Hash, AlertCircle } from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { PivotTable, PivotAreaField, DateGrouping } from '../../types/pivot';
import './PivotTable.css';

interface GroupingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pivot: PivotTable;
  field: PivotAreaField | null;
  area?: 'row' | 'column'; // Optional for future number grouping implementation
}

type NumberGroupingType = 'none' | 'custom';

interface NumberGroupingConfig {
  type: NumberGroupingType;
  startValue: number;
  endValue: number;
  interval: number;
}

const DATE_GROUPING_OPTIONS: { value: DateGrouping | undefined; label: string; description: string }[] = [
  { value: undefined, label: 'None', description: 'Show individual dates' },
  { value: 'years', label: 'Years', description: 'Group by year (2023, 2024...)' },
  { value: 'quarters', label: 'Quarters', description: 'Group by quarter (Q1 2024, Q2 2024...)' },
  { value: 'months', label: 'Months', description: 'Group by month (Jan 2024, Feb 2024...)' },
  { value: 'days', label: 'Days', description: 'Group by day' },
  { value: 'hours', label: 'Hours', description: 'Group by hour' },
];

export const GroupingDialog: React.FC<GroupingDialogProps> = ({
  isOpen,
  onClose,
  pivot,
  field,
  // area is used for potential future number grouping implementation
}) => {
  const { setDateGrouping } = usePivotStore();

  const [dateGrouping, setLocalDateGrouping] = useState<DateGrouping | undefined>(undefined);
  const [numberGrouping, setNumberGrouping] = useState<NumberGroupingConfig>({
    type: 'none',
    startValue: 0,
    endValue: 100,
    interval: 10,
  });
  const [error, setError] = useState<string | null>(null);

  // Get field info
  const fieldInfo = useMemo(() => {
    if (!field) return null;
    return pivot.fields.find(f => f.id === field.fieldId);
  }, [field, pivot.fields]);

  const isDateField = fieldInfo?.dataType === 'date';
  const isNumberField = fieldInfo?.dataType === 'number';

  // Initialize from field
  useEffect(() => {
    if (field) {
      setLocalDateGrouping(field.dateGrouping);
      // Number grouping would need to be stored differently - for now we show the UI
      setNumberGrouping({
        type: 'none',
        startValue: 0,
        endValue: 100,
        interval: 10,
      });
    }
    setError(null);
  }, [field, isOpen]);

  const handleApply = () => {
    setError(null);

    if (!field) {
      setError('No field selected');
      return;
    }

    if (isDateField) {
      setDateGrouping(pivot.id, field.fieldId, dateGrouping);
    } else if (isNumberField && numberGrouping.type === 'custom') {
      // Validate number grouping
      if (numberGrouping.interval <= 0) {
        setError('Interval must be greater than 0');
        return;
      }
      if (numberGrouping.endValue <= numberGrouping.startValue) {
        setError('End value must be greater than start value');
        return;
      }
      // Store number grouping config - this would need a store extension
      // For now, we'll show the UI but note it needs backend support
    }

    onClose();
  };

  if (!isOpen || !field) return null;

  return (
    <div className="pivot-dialog-overlay" onClick={onClose}>
      <div className="pivot-dialog grouping-dialog" onClick={e => e.stopPropagation()}>
        <div className="pivot-dialog-header">
          <div className="pivot-dialog-title">
            {isDateField ? <Calendar size={20} /> : <Hash size={20} />}
            <h2>Grouping - {fieldInfo?.name}</h2>
          </div>
          <button className="pivot-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pivot-dialog-body">
          {error && (
            <div className="pivot-dialog-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isDateField && (
            <div className="pivot-dialog-section">
              <h3>Date Grouping</h3>
              <p className="section-hint">
                Choose how to group dates in the pivot table
              </p>
              <div className="grouping-options">
                {DATE_GROUPING_OPTIONS.map(option => (
                  <label key={option.label} className="grouping-option">
                    <input
                      type="radio"
                      name="dateGrouping"
                      checked={dateGrouping === option.value}
                      onChange={() => setLocalDateGrouping(option.value)}
                    />
                    <div className="option-content">
                      <span className="option-label">{option.label}</span>
                      <span className="option-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {isNumberField && (
            <div className="pivot-dialog-section">
              <h3>Number Grouping</h3>
              <p className="section-hint">
                Create ranges to group numeric values
              </p>

              <div className="grouping-options">
                <label className="grouping-option">
                  <input
                    type="radio"
                    name="numberGrouping"
                    checked={numberGrouping.type === 'none'}
                    onChange={() => setNumberGrouping(prev => ({ ...prev, type: 'none' }))}
                  />
                  <div className="option-content">
                    <span className="option-label">None</span>
                    <span className="option-description">Show individual values</span>
                  </div>
                </label>
                <label className="grouping-option">
                  <input
                    type="radio"
                    name="numberGrouping"
                    checked={numberGrouping.type === 'custom'}
                    onChange={() => setNumberGrouping(prev => ({ ...prev, type: 'custom' }))}
                  />
                  <div className="option-content">
                    <span className="option-label">Custom Ranges</span>
                    <span className="option-description">Define start, end, and interval</span>
                  </div>
                </label>
              </div>

              {numberGrouping.type === 'custom' && (
                <div className="number-grouping-config">
                  <div className="config-row">
                    <div className="config-field">
                      <label>Starting at:</label>
                      <input
                        type="number"
                        value={numberGrouping.startValue}
                        onChange={e => setNumberGrouping(prev => ({
                          ...prev,
                          startValue: parseFloat(e.target.value) || 0,
                        }))}
                        className="pivot-dialog-input"
                      />
                    </div>
                    <div className="config-field">
                      <label>Ending at:</label>
                      <input
                        type="number"
                        value={numberGrouping.endValue}
                        onChange={e => setNumberGrouping(prev => ({
                          ...prev,
                          endValue: parseFloat(e.target.value) || 0,
                        }))}
                        className="pivot-dialog-input"
                      />
                    </div>
                  </div>
                  <div className="config-row">
                    <div className="config-field">
                      <label>By (interval):</label>
                      <input
                        type="number"
                        value={numberGrouping.interval}
                        onChange={e => setNumberGrouping(prev => ({
                          ...prev,
                          interval: parseFloat(e.target.value) || 1,
                        }))}
                        className="pivot-dialog-input"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grouping-preview">
                    <h4>Preview:</h4>
                    <div className="preview-ranges">
                      {Array.from({ length: Math.min(5, Math.ceil((numberGrouping.endValue - numberGrouping.startValue) / numberGrouping.interval)) }, (_, i) => {
                        const start = numberGrouping.startValue + (i * numberGrouping.interval);
                        const end = start + numberGrouping.interval;
                        return (
                          <span key={i} className="preview-range">
                            {start} - {Math.min(end, numberGrouping.endValue)}
                          </span>
                        );
                      })}
                      {Math.ceil((numberGrouping.endValue - numberGrouping.startValue) / numberGrouping.interval) > 5 && (
                        <span className="preview-more">...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isDateField && !isNumberField && (
            <div className="pivot-dialog-section">
              <div className="no-grouping-message">
                <AlertCircle size={24} />
                <p>
                  Grouping is only available for Date and Number fields.
                  <br />
                  <strong>{fieldInfo?.name}</strong> is a {fieldInfo?.dataType} field.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pivot-dialog-footer">
          <button className="pivot-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pivot-btn-primary"
            onClick={handleApply}
            disabled={!isDateField && !isNumberField}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupingDialog;
