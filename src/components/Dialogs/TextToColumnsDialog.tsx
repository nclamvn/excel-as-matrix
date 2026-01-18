import React, { useState, useMemo } from 'react';
import { X, SplitSquareHorizontal, AlertTriangle } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { colToLetter, getCellKey } from '../../types/cell';

interface TextToColumnsDialogProps {
  onClose: () => void;
}

type DelimiterType = 'tab' | 'semicolon' | 'comma' | 'space' | 'custom';

export const TextToColumnsDialog: React.FC<TextToColumnsDialogProps> = ({ onClose }) => {
  const { activeSheetId, sheets, selectionRange, selectedCell, batchUpdateCells } = useWorkbookStore();
  const { showToast } = useUIStore();

  const sheet = activeSheetId ? sheets[activeSheetId] : null;

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Delimiter options
  const [delimiterType, setDelimiterType] = useState<DelimiterType>('comma');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [treatConsecutive, setTreatConsecutive] = useState(false);

  // Get the actual delimiter character
  const delimiter = useMemo(() => {
    switch (delimiterType) {
      case 'tab':
        return '\t';
      case 'semicolon':
        return ';';
      case 'comma':
        return ',';
      case 'space':
        return ' ';
      case 'custom':
        return customDelimiter;
      default:
        return ',';
    }
  }, [delimiterType, customDelimiter]);

  // Determine the range to work with
  const range = useMemo(() => {
    if (selectionRange) {
      return selectionRange;
    }
    if (selectedCell) {
      return { start: selectedCell, end: selectedCell };
    }
    return null;
  }, [selectionRange, selectedCell]);

  // Get source data and preview
  const previewData = useMemo(() => {
    if (!range || !sheet || !delimiter) return [];

    const preview: Array<{ row: number; original: string; split: string[] }> = [];
    const maxPreview = 5;

    for (let row = range.start.row; row <= Math.min(range.end.row, range.start.row + maxPreview - 1); row++) {
      const cellKey = getCellKey(row, range.start.col);
      const cell = sheet.cells[cellKey];
      const value = String(cell?.value ?? '');

      let splitValues: string[];
      if (treatConsecutive && delimiter) {
        // Treat consecutive delimiters as one
        const regex = new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+', 'g');
        splitValues = value.split(regex);
      } else {
        splitValues = delimiter ? value.split(delimiter) : [value];
      }

      preview.push({
        row,
        original: value,
        split: splitValues,
      });
    }

    return preview;
  }, [range, sheet, delimiter, treatConsecutive]);

  // Calculate max columns needed
  const maxColumns = useMemo(() => {
    return previewData.reduce((max, item) => Math.max(max, item.split.length), 0);
  }, [previewData]);

  const handleApply = () => {
    if (!range || !sheet || !activeSheetId || !delimiter) {
      showToast('No data range selected', 'warning');
      return;
    }

    const updates: Array<{ row: number; col: number; data: { value: string; displayValue: string; formula: null } }> = [];

    for (let row = range.start.row; row <= range.end.row; row++) {
      const cellKey = getCellKey(row, range.start.col);
      const cell = sheet.cells[cellKey];
      const value = String(cell?.value ?? '');

      let splitValues: string[];
      if (treatConsecutive && delimiter) {
        const regex = new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+', 'g');
        splitValues = value.split(regex);
      } else {
        splitValues = delimiter ? value.split(delimiter) : [value];
      }

      // Update cells starting from the source column
      splitValues.forEach((val, idx) => {
        const trimmedVal = val.trim();
        updates.push({
          row,
          col: range.start.col + idx,
          data: {
            value: trimmedVal,
            displayValue: trimmedVal,
            formula: null,
          },
        });
      });
    }

    if (updates.length > 0) {
      batchUpdateCells(activeSheetId, updates);
    }

    const rowCount = range.end.row - range.start.row + 1;
    showToast(`Split ${rowCount} rows into ${maxColumns} columns`, 'success');
    onClose();
  };

  if (!range) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog text-to-columns-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>
              <SplitSquareHorizontal className="w-4 h-4" />
              Text to Columns
            </h3>
            <button className="dialog-close" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="dialog-content">
            <div className="warning-message">
              <AlertTriangle className="w-5 h-5" />
              <p>Please select a column of data to split.</p>
            </div>
          </div>
          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog text-to-columns-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <SplitSquareHorizontal className="w-4 h-4" />
            Text to Columns
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          {step === 1 && (
            <>
              <div className="step-indicator">
                <span className="step active">Step 1: Choose delimiter</span>
                <span className="step">Step 2: Preview & Apply</span>
              </div>

              <div className="range-info">
                <span>
                  Source: {colToLetter(range.start.col)}
                  {range.start.row + 1}:{colToLetter(range.end.col)}
                  {range.end.row + 1}
                </span>
              </div>

              <div className="delimiter-section">
                <label className="field-label">Choose the delimiter that separates your data:</label>

                <div className="delimiter-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={delimiterType === 'comma'}
                      onChange={() => setDelimiterType('comma')}
                    />
                    <span>Comma (,)</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={delimiterType === 'semicolon'}
                      onChange={() => setDelimiterType('semicolon')}
                    />
                    <span>Semicolon (;)</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={delimiterType === 'tab'}
                      onChange={() => setDelimiterType('tab')}
                    />
                    <span>Tab</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={delimiterType === 'space'}
                      onChange={() => setDelimiterType('space')}
                    />
                    <span>Space</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio"
                      name="delimiter"
                      checked={delimiterType === 'custom'}
                      onChange={() => setDelimiterType('custom')}
                    />
                    <span>Custom:</span>
                    <input
                      type="text"
                      className="custom-delimiter-input"
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      disabled={delimiterType !== 'custom'}
                      placeholder="Enter delimiter"
                      maxLength={5}
                    />
                  </label>
                </div>

                <label className="checkbox-label consecutive-option">
                  <input
                    type="checkbox"
                    checked={treatConsecutive}
                    onChange={(e) => setTreatConsecutive(e.target.checked)}
                  />
                  <span>Treat consecutive delimiters as one</span>
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="step-indicator">
                <span className="step completed">Step 1: Choose delimiter</span>
                <span className="step active">Step 2: Preview & Apply</span>
              </div>

              <div className="preview-section">
                <label className="field-label">
                  Preview (first {previewData.length} rows):
                </label>

                <div className="preview-table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Original</th>
                        {Array.from({ length: maxColumns }).map((_, idx) => (
                          <th key={idx}>{colToLetter(range.start.col + idx)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item, idx) => (
                        <tr key={idx}>
                          <td className="original-cell">{item.original}</td>
                          {Array.from({ length: maxColumns }).map((_, colIdx) => (
                            <td key={colIdx} className="split-cell">
                              {item.split[colIdx] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="preview-info">
                  <p>
                    This will split data into <strong>{maxColumns}</strong> columns starting from column{' '}
                    <strong>{colToLetter(range.start.col)}</strong>.
                  </p>
                  <p className="warning-text">
                    Note: Existing data in columns{' '}
                    {colToLetter(range.start.col + 1)} to {colToLetter(range.start.col + maxColumns - 1)}{' '}
                    will be overwritten.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="dialog-footer">
          {step === 1 ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={delimiterType === 'custom' && !customDelimiter}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleApply}>
                Apply
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
