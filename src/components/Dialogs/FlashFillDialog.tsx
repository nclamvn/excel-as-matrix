import React, { useState, useMemo } from 'react';
import { X, Zap, AlertTriangle, Check, Lightbulb } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { colToLetter, getCellKey } from '../../types/cell';
import { autoFlashFill, FlashFillResult } from '../../utils/flashFillUtils';

interface FlashFillDialogProps {
  onClose: () => void;
}

export const FlashFillDialog: React.FC<FlashFillDialogProps> = ({ onClose }) => {
  const { activeSheetId, sheets, selectionRange, selectedCell, batchUpdateCells } = useWorkbookStore();
  const { showToast } = useUIStore();

  const sheet = activeSheetId ? sheets[activeSheetId] : null;

  // Determine the range - expect source column + target column
  const range = useMemo(() => {
    if (selectionRange && selectionRange.end.col > selectionRange.start.col) {
      return selectionRange;
    }
    if (selectedCell) {
      // Default to current column and the one to the left as source
      return {
        start: { row: selectedCell.row, col: Math.max(0, selectedCell.col - 1) },
        end: { row: selectedCell.row + 10, col: selectedCell.col },
      };
    }
    return null;
  }, [selectionRange, selectedCell]);

  const [sourceCol, setSourceCol] = useState(range?.start.col ?? 0);
  const [targetCol, setTargetCol] = useState(range?.end.col ?? 1);
  const [flashFillResult, setFlashFillResult] = useState<FlashFillResult | null>(null);

  // Get source and example values
  const { sourceValues, exampleValues, rowStart } = useMemo(() => {
    if (!sheet || !range) {
      return { sourceValues: [], exampleValues: [], rowStart: 0, rowEnd: 0 };
    }

    const sources: string[] = [];
    const examples: string[] = [];
    const startRow = range.start.row;
    const endRow = Math.min(range.end.row, startRow + 100); // Limit to 100 rows

    for (let row = startRow; row <= endRow; row++) {
      const sourceKey = getCellKey(row, sourceCol);
      const targetKey = getCellKey(row, targetCol);

      const sourceCell = sheet.cells[sourceKey];
      const targetCell = sheet.cells[targetKey];

      sources.push(String(sourceCell?.value ?? ''));
      examples.push(String(targetCell?.value ?? ''));
    }

    return {
      sourceValues: sources,
      exampleValues: examples,
      rowStart: startRow,
      rowEnd: endRow,
    };
  }, [sheet, range, sourceCol, targetCol]);

  // Preview flash fill
  const handlePreview = () => {
    if (sourceValues.length === 0) {
      showToast('No source data found', 'warning');
      return;
    }

    const result = autoFlashFill(sourceValues, exampleValues);
    setFlashFillResult(result);

    if (!result.success) {
      showToast(result.message, 'warning');
    }
  };

  // Apply flash fill
  const handleApply = () => {
    if (!flashFillResult || !flashFillResult.success || !activeSheetId) {
      showToast('Please preview first', 'warning');
      return;
    }

    const updates: Array<{
      row: number;
      col: number;
      data: { value: string; displayValue: string; formula: null };
    }> = [];

    flashFillResult.values.forEach((value, idx) => {
      const row = rowStart + idx;
      // Only update if the value is different from what's already there
      const existingKey = getCellKey(row, targetCol);
      const existingCell = sheet?.cells[existingKey];
      const existingValue = String(existingCell?.value ?? '');

      if (value !== existingValue) {
        updates.push({
          row,
          col: targetCol,
          data: {
            value,
            displayValue: value,
            formula: null,
          },
        });
      }
    });

    if (updates.length > 0) {
      batchUpdateCells(activeSheetId, updates);
      showToast(`Flash Fill applied to ${updates.length} cells`, 'success');
    } else {
      showToast('No changes to apply', 'info');
    }

    onClose();
  };

  // Count how many examples user has provided
  const exampleCount = exampleValues.filter((v) => v && v.trim()).length;

  if (!range || !sheet) {
    return (
      <div className="dialog-overlay" onClick={onClose}>
        <div className="dialog flash-fill-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h3>
              <Zap className="w-4 h-4" />
              Flash Fill
            </h3>
            <button className="dialog-close" onClick={onClose}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="dialog-content">
            <div className="warning-message">
              <AlertTriangle className="w-5 h-5" />
              <p>Please select a data range with source and target columns.</p>
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
      <div className="dialog flash-fill-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <Zap className="w-4 h-4" />
            Flash Fill
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          <div className="flash-fill-intro">
            <Lightbulb className="w-4 h-4" />
            <p>
              Flash Fill detects patterns from your examples and applies them automatically.
              Enter a few examples in the target column, then click Preview.
            </p>
          </div>

          <div className="column-selection">
            <div className="column-select">
              <label className="field-label">Source Column:</label>
              <select
                value={sourceCol}
                onChange={(e) => {
                  setSourceCol(Number(e.target.value));
                  setFlashFillResult(null);
                }}
                className="dialog-select"
              >
                {Array.from({ length: 26 }).map((_, i) => (
                  <option key={i} value={i}>
                    {colToLetter(i)}
                  </option>
                ))}
              </select>
            </div>

            <div className="column-select">
              <label className="field-label">Target Column:</label>
              <select
                value={targetCol}
                onChange={(e) => {
                  setTargetCol(Number(e.target.value));
                  setFlashFillResult(null);
                }}
                className="dialog-select"
              >
                {Array.from({ length: 26 }).map((_, i) => (
                  <option key={i} value={i}>
                    {colToLetter(i)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="examples-info">
            <span className={exampleCount > 0 ? 'has-examples' : 'no-examples'}>
              {exampleCount > 0
                ? `${exampleCount} example${exampleCount > 1 ? 's' : ''} provided`
                : 'No examples provided yet'}
            </span>
            {exampleCount === 0 && (
              <span className="hint">
                Enter at least one example in column {colToLetter(targetCol)} to get started
              </span>
            )}
          </div>

          {flashFillResult && (
            <div className="flash-fill-result">
              {flashFillResult.success ? (
                <>
                  <div className="result-header success">
                    <Check className="w-4 h-4" />
                    <span>Pattern detected!</span>
                  </div>
                  <div className="pattern-info">
                    <span className="pattern-type">{flashFillResult.pattern?.type}</span>
                    <span className="pattern-desc">{flashFillResult.pattern?.description}</span>
                    <span className="pattern-confidence">
                      {Math.round((flashFillResult.pattern?.confidence ?? 0) * 100)}% confidence
                    </span>
                  </div>
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Source ({colToLetter(sourceCol)})</th>
                          <th>Result ({colToLetter(targetCol)})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flashFillResult.values.slice(0, 10).map((value, idx) => (
                          <tr key={idx}>
                            <td>{rowStart + idx + 1}</td>
                            <td>{sourceValues[idx]}</td>
                            <td className={idx < exampleCount ? 'example-cell' : 'generated-cell'}>
                              {value}
                              {idx < exampleCount && <span className="example-badge">example</span>}
                            </td>
                          </tr>
                        ))}
                        {flashFillResult.values.length > 10 && (
                          <tr>
                            <td colSpan={3} className="more-rows">
                              ...and {flashFillResult.values.length - 10} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="result-header error">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{flashFillResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {!flashFillResult ? (
            <button
              className="btn btn-primary"
              onClick={handlePreview}
              disabled={exampleCount === 0}
            >
              Preview
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleApply}
              disabled={!flashFillResult.success}
            >
              Apply Flash Fill
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
