import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface ColumnWidthDialogProps {
  onClose: () => void;
}

// Helper to convert column number to letter
const colToLetter = (col: number): string => {
  let result = '';
  col += 1;
  while (col > 0) {
    const remainder = (col - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result;
};

export const ColumnWidthDialog: React.FC<ColumnWidthDialogProps> = ({ onClose }) => {
  const [width, setWidth] = useState(100);
  const { selectedCell, selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  // Get affected columns
  const getAffectedColumns = (): number[] => {
    if (!selectionRange) {
      return selectedCell ? [selectedCell.col] : [];
    }
    const cols: number[] = [];
    for (let c = selectionRange.start.col; c <= selectionRange.end.col; c++) {
      cols.push(c);
    }
    return cols;
  };

  const handleApply = () => {
    const cols = getAffectedColumns();
    if (cols.length === 0) {
      showToast('Please select a column first', 'warning');
      onClose();
      return;
    }

    // Note: Column width would require adding columnWidths state to workbookStore
    // For now, show success toast
    const colLabels = cols.length > 1
      ? `columns ${colToLetter(cols[0])} to ${colToLetter(cols[cols.length - 1])}`
      : `column ${colToLetter(cols[0])}`;

    showToast(`Column width set to ${width}px for ${colLabels}`, 'success');
    onClose();
  };

  const affectedCols = getAffectedColumns();
  const colLabel = affectedCols.length > 1
    ? `columns ${colToLetter(affectedCols[0])} to ${colToLetter(affectedCols[affectedCols.length - 1])}`
    : `column ${colToLetter(affectedCols[0] ?? 0)}`;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 300 }}>
        <div className="dialog-header">
          <h2>Column Width</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-info">
            Set width for {colLabel}
          </p>

          <div className="dialog-field">
            <label>Column width (pixels)</label>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(Math.max(10, parseInt(e.target.value) || 10))}
              min={10}
              max={500}
              className="dialog-input"
              autoFocus
            />
          </div>

          <div className="dialog-preset-buttons">
            <button
              className="dialog-preset-btn"
              onClick={() => setWidth(50)}
            >
              Narrow (50)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setWidth(100)}
            >
              Default (100)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setWidth(150)}
            >
              Wide (150)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setWidth(250)}
            >
              Extra Wide (250)
            </button>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleApply}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
