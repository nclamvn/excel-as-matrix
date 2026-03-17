// ============================================================
// CREATE PIVOT DIALOG
// ============================================================

import React, { useState, useMemo } from 'react';
import { X, Table2, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { usePivotStore } from '../../stores/pivotStore';
import { PivotField } from '../../types/pivot';
import './PivotTable.css';

interface CreatePivotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePivotDialog: React.FC<CreatePivotDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { sheets, activeSheetId, getCellValue } = useWorkbookStore();
  const selectionRange = useSelectionStore((s) => s.selectionRange);
  const { createPivotTable } = usePivotStore();

  const [pivotName, setPivotName] = useState('PivotTable1');
  const [sourceSheet, setSourceSheet] = useState(activeSheetId || '');
  const [sourceRange, setSourceRange] = useState('');
  const [targetLocation, setTargetLocation] = useState<'newSheet' | 'existingSheet'>('newSheet');
  const [targetSheet, setTargetSheet] = useState(activeSheetId || '');
  const [targetCell, setTargetCell] = useState('A1');
  const [error, setError] = useState<string | null>(null);

  // Auto-detect selection range
  useMemo(() => {
    if (selectionRange && activeSheetId) {
      const startCol = String.fromCharCode(65 + selectionRange.start.col);
      const endCol = String.fromCharCode(65 + selectionRange.end.col);
      const range = `${startCol}${selectionRange.start.row + 1}:${endCol}${selectionRange.end.row + 1}`;
      setSourceRange(range);
      setSourceSheet(activeSheetId);
    }
  }, [selectionRange, activeSheetId]);

  // Parse range and detect fields from headers
  const detectedFields = useMemo((): PivotField[] => {
    if (!sourceRange || !sourceSheet) return [];

    try {
      const match = sourceRange.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
      if (!match) return [];

      const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
      const startRow = parseInt(match[2], 10) - 1;
      const endCol = match[3].toUpperCase().charCodeAt(0) - 65;

      const fields: PivotField[] = [];

      for (let col = startCol; col <= endCol; col++) {
        const headerValue = getCellValue(sourceSheet, startRow, col);
        const headerStr = headerValue !== null && headerValue !== undefined
          ? String(headerValue)
          : `Column ${String.fromCharCode(65 + col)}`;

        // Detect data type from first data row
        const firstDataValue = getCellValue(sourceSheet, startRow + 1, col);
        let dataType: 'string' | 'number' | 'date' | 'boolean' = 'string';

        if (typeof firstDataValue === 'number') {
          dataType = 'number';
        } else if (typeof firstDataValue === 'boolean') {
          dataType = 'boolean';
        } else if (firstDataValue && typeof firstDataValue === 'string' && !isNaN(Date.parse(firstDataValue))) {
          dataType = 'date';
        }

        fields.push({
          id: `field_${col}`,
          name: headerStr,
          sourceColumn: col,
          dataType,
        });
      }

      return fields;
    } catch {
      return [];
    }
  }, [sourceRange, sourceSheet, getCellValue]);

  const handleCreate = () => {
    setError(null);

    // Validation
    if (!pivotName.trim()) {
      setError('Please enter a name for the pivot table');
      return;
    }

    if (!sourceRange) {
      setError('Please specify a source data range');
      return;
    }

    if (detectedFields.length === 0) {
      setError('Could not detect fields from the specified range');
      return;
    }

    if (targetLocation === 'existingSheet' && !targetSheet) {
      setError('Please select a target sheet');
      return;
    }

    try {
      let finalTargetSheet = targetSheet;

      // Create new sheet if needed
      if (targetLocation === 'newSheet') {
        // For now, use the current sheet
        // In a real implementation, you'd create a new sheet here
        finalTargetSheet = activeSheetId || sourceSheet;
      }

      // Create the pivot table
      createPivotTable(
        pivotName.trim(),
        sourceSheet,
        sourceRange,
        finalTargetSheet,
        targetCell,
        detectedFields
      );

      onClose();
    } catch (err) {
      setError('Failed to create pivot table');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pivot-dialog-overlay" onClick={onClose}>
      <div className="pivot-dialog" onClick={e => e.stopPropagation()}>
        <div className="pivot-dialog-header">
          <div className="pivot-dialog-title">
            <Table2 size={20} />
            <h2>Create PivotTable</h2>
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

          <div className="pivot-dialog-section">
            <h3>PivotTable Name</h3>
            <input
              type="text"
              value={pivotName}
              onChange={e => setPivotName(e.target.value)}
              className="pivot-dialog-input"
              placeholder="Enter pivot table name"
            />
          </div>

          <div className="pivot-dialog-section">
            <h3>Source Data</h3>
            <div className="pivot-dialog-field">
              <label>Sheet:</label>
              <select
                value={sourceSheet}
                onChange={e => setSourceSheet(e.target.value)}
                className="pivot-dialog-select"
              >
                {Object.values(sheets).map(sheet => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="pivot-dialog-field">
              <label>Range:</label>
              <input
                type="text"
                value={sourceRange}
                onChange={e => setSourceRange(e.target.value.toUpperCase())}
                className="pivot-dialog-input"
                placeholder="e.g., A1:H100"
              />
            </div>
          </div>

          {detectedFields.length > 0 && (
            <div className="pivot-dialog-section">
              <h3>
                <CheckCircle size={16} className="success-icon" />
                Detected Fields ({detectedFields.length})
              </h3>
              <div className="pivot-detected-fields">
                {detectedFields.map(field => (
                  <div key={field.id} className="pivot-detected-field">
                    <span className="field-name">{field.name}</span>
                    <span className={`field-type type-${field.dataType}`}>
                      {field.dataType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pivot-dialog-section">
            <h3>Location</h3>
            <div className="pivot-dialog-radio-group">
              <label className="pivot-dialog-radio">
                <input
                  type="radio"
                  name="location"
                  checked={targetLocation === 'newSheet'}
                  onChange={() => setTargetLocation('newSheet')}
                />
                <span>New Worksheet</span>
              </label>
              <label className="pivot-dialog-radio">
                <input
                  type="radio"
                  name="location"
                  checked={targetLocation === 'existingSheet'}
                  onChange={() => setTargetLocation('existingSheet')}
                />
                <span>Existing Worksheet</span>
              </label>
            </div>

            {targetLocation === 'existingSheet' && (
              <div className="pivot-dialog-field">
                <label>Sheet:</label>
                <select
                  value={targetSheet}
                  onChange={e => setTargetSheet(e.target.value)}
                  className="pivot-dialog-select"
                >
                  {Object.values(sheets).map(sheet => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pivot-dialog-field">
              <label>Cell:</label>
              <input
                type="text"
                value={targetCell}
                onChange={e => setTargetCell(e.target.value.toUpperCase())}
                className="pivot-dialog-input"
                placeholder="e.g., A1"
              />
            </div>
          </div>
        </div>

        <div className="pivot-dialog-footer">
          <button className="pivot-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pivot-btn-primary"
            onClick={handleCreate}
            disabled={detectedFields.length === 0}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePivotDialog;
