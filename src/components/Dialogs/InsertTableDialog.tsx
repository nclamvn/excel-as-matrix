import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface InsertTableDialogProps {
  onClose: () => void;
}

export const InsertTableDialog: React.FC<InsertTableDialogProps> = ({ onClose }) => {
  const [hasHeaders, setHasHeaders] = useState(true);
  const [tableName, setTableName] = useState('Table1');
  const { selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const colToLetter = (col: number): string => {
    return String.fromCharCode(65 + col);
  };

  const getRangeString = () => {
    if (!selectionRange) return 'A1:D10';
    const start = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
    const end = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
    return start === end ? `${start}:${colToLetter(selectionRange.start.col + 3)}${selectionRange.start.row + 10}` : `${start}:${end}`;
  };

  const handleCreate = () => {
    console.log(`Creating table "${tableName}" from ${getRangeString()}, headers: ${hasHeaders}`);
    showToast(`Table "${tableName}" created from ${getRangeString()}`, 'success');
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <div className="dialog-header">
          <h2>Create Table</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Data Range */}
          <div className="dialog-field">
            <label>Data Range</label>
            <input
              type="text"
              value={getRangeString()}
              readOnly
              className="dialog-input"
            />
          </div>

          {/* Table Name */}
          <div className="dialog-field">
            <label>Table Name</label>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="dialog-input"
            />
          </div>

          {/* Has Headers */}
          <label className="dialog-checkbox">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={e => setHasHeaders(e.target.checked)}
            />
            My table has headers
          </label>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleCreate}>
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
};
