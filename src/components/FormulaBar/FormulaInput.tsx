import React, { useState, useEffect, useRef } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';

export const FormulaInput: React.FC = () => {
  const { selectedCell, activeSheetId, sheets, updateCell } = useWorkbookStore();
  const [value, setValue] = useState('');
  const [_isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current cell value
  useEffect(() => {
    if (selectedCell && activeSheetId) {
      const sheet = sheets[activeSheetId];
      if (sheet) {
        const cellKey = `${selectedCell.row},${selectedCell.col}`;
        const cell = sheet.cells[cellKey];
        setValue(cell?.formula || cell?.value?.toString() || '');
      }
    }
  }, [selectedCell, activeSheetId, sheets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedCell && activeSheetId) {
        const isFormula = value.startsWith('=');
        updateCell(activeSheetId, selectedCell.row, selectedCell.col, {
          value: isFormula ? null : value,
          formula: isFormula ? value : null,
          displayValue: value,
        });
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      // Revert changes
      if (selectedCell && activeSheetId) {
        const sheet = sheets[activeSheetId];
        if (sheet) {
          const cellKey = `${selectedCell.row},${selectedCell.col}`;
          const cell = sheet.cells[cellKey];
          setValue(cell?.formula || cell?.value?.toString() || '');
        }
      }
      setIsEditing(false);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <div className="formula-input-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className="formula-input"
        placeholder="Enter formula or value"
      />
    </div>
  );
};
