import React, { useState } from 'react';
import { X, ArrowLeft, ArrowUp } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface DeleteCellsDialogProps {
  onClose: () => void;
}

type ShiftDirection = 'left' | 'up' | 'row' | 'column';

export const DeleteCellsDialog: React.FC<DeleteCellsDialogProps> = ({ onClose }) => {
  const [direction, setDirection] = useState<ShiftDirection>('left');
  const { deleteRow, deleteColumn, selectedCell, activeSheetId } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleDelete = () => {
    if (!activeSheetId || !selectedCell) {
      showToast('Please select a cell first', 'warning');
      onClose();
      return;
    }

    switch (direction) {
      case 'left':
        // Shift cells left - delete column at current position
        deleteColumn(selectedCell.col, 1);
        showToast('Cells shifted left', 'success');
        break;
      case 'up':
        // Shift cells up - delete row at current position
        deleteRow(selectedCell.row, 1);
        showToast('Cells shifted up', 'success');
        break;
      case 'row':
        deleteRow(selectedCell.row, 1);
        showToast('Row deleted', 'success');
        break;
      case 'column':
        deleteColumn(selectedCell.col, 1);
        showToast('Column deleted', 'success');
        break;
    }

    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 320 }}>
        <div className="dialog-header">
          <h2>Delete Cells</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-radio-group">
            <label className="dialog-radio">
              <input
                type="radio"
                name="deleteDirection"
                checked={direction === 'left'}
                onChange={() => setDirection('left')}
              />
              <ArrowLeft size={16} />
              <span>Shift cells left</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="deleteDirection"
                checked={direction === 'up'}
                onChange={() => setDirection('up')}
              />
              <ArrowUp size={16} />
              <span>Shift cells up</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="deleteDirection"
                checked={direction === 'row'}
                onChange={() => setDirection('row')}
              />
              <span>Entire row</span>
            </label>

            <label className="dialog-radio">
              <input
                type="radio"
                name="deleteDirection"
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
          <button className="dialog-btn-primary" onClick={handleDelete}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
