import React, { useState } from 'react';
import { X, ArrowRight, ArrowDown } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface InsertCellsDialogProps {
  onClose: () => void;
}

type ShiftDirection = 'right' | 'down' | 'row' | 'column';

export const InsertCellsDialog: React.FC<InsertCellsDialogProps> = ({ onClose }) => {
  const [direction, setDirection] = useState<ShiftDirection>('right');
  const { insertRow, insertColumn, selectedCell, activeSheetId } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleInsert = () => {
    if (!activeSheetId || !selectedCell) {
      showToast('Please select a cell first', 'warning');
      onClose();
      return;
    }

    switch (direction) {
      case 'right':
        // Shift cells right - insert column at current position
        insertColumn(selectedCell.col, 1);
        showToast('Cells shifted right', 'success');
        break;
      case 'down':
        // Shift cells down - insert row at current position
        insertRow(selectedCell.row, 1);
        showToast('Cells shifted down', 'success');
        break;
      case 'row':
        insertRow(selectedCell.row, 1);
        showToast('Row inserted', 'success');
        break;
      case 'column':
        insertColumn(selectedCell.col, 1);
        showToast('Column inserted', 'success');
        break;
    }

    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 320 }}>
        <div className="dialog-header">
          <h2>Insert Cells</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-radio-group">
            <label className="dialog-radio">
              <input
                type="radio"
                name="insertDirection"
                checked={direction === 'right'}
                onChange={() => setDirection('right')}
              />
              <ArrowRight size={16} />
              <span>Shift cells right</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="insertDirection"
                checked={direction === 'down'}
                onChange={() => setDirection('down')}
              />
              <ArrowDown size={16} />
              <span>Shift cells down</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="insertDirection"
                checked={direction === 'row'}
                onChange={() => setDirection('row')}
              />
              <span>Entire row</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="insertDirection"
                checked={direction === 'column'}
                onChange={() => setDirection('column')}
              />
              <span>Entire column</span>
            </label>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleInsert}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
