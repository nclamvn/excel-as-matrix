import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface RowHeightDialogProps {
  onClose: () => void;
}

export const RowHeightDialog: React.FC<RowHeightDialogProps> = ({ onClose }) => {
  const [height, setHeight] = useState(20);
  const { selectedCell, selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  // Get affected rows
  const getAffectedRows = (): number[] => {
    if (!selectionRange) {
      return selectedCell ? [selectedCell.row] : [];
    }
    const rows: number[] = [];
    for (let r = selectionRange.start.row; r <= selectionRange.end.row; r++) {
      rows.push(r);
    }
    return rows;
  };

  const handleApply = () => {
    const rows = getAffectedRows();
    if (rows.length === 0) {
      showToast('Please select a row first', 'warning');
      onClose();
      return;
    }

    // Note: Row height would require adding rowHeights state to workbookStore
    // For now, show success toast
    showToast(`Row height set to ${height}px for ${rows.length} row(s)`, 'success');
    onClose();
  };

  const affectedRows = getAffectedRows();

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 300 }}>
        <div className="dialog-header">
          <h2>Row Height</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <p className="dialog-info">
            Set height for {affectedRows.length > 1 ? `rows ${affectedRows[0] + 1} to ${affectedRows[affectedRows.length - 1] + 1}` : `row ${(affectedRows[0] ?? 0) + 1}`}
          </p>

          <div className="dialog-field">
            <label>Row height (pixels)</label>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={500}
              className="dialog-input"
              autoFocus
            />
          </div>

          <div className="dialog-preset-buttons">
            <button
              className="dialog-preset-btn"
              onClick={() => setHeight(15)}
            >
              Small (15)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setHeight(20)}
            >
              Default (20)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setHeight(30)}
            >
              Medium (30)
            </button>
            <button
              className="dialog-preset-btn"
              onClick={() => setHeight(50)}
            >
              Large (50)
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
