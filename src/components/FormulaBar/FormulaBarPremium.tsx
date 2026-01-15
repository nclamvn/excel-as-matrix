import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { colToLetter } from '../../types/cell';

interface FormulaBarPremiumProps {
  workbookId: string;  // Reserved for future API calls
  sheetId: string;
}

export const FormulaBarPremium: React.FC<FormulaBarPremiumProps> = ({
  workbookId: _workbookId,
  sheetId,
}) => {
  const { sheets, updateCell } = useWorkbookStore();
  const { selectedCell } = useSelectionStore();
  const [value, setValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get cell reference string (e.g., "A1")
  const cellRef = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : '';

  // Get current cell value
  useEffect(() => {
    if (selectedCell && sheetId) {
      const sheet = sheets[sheetId];
      if (sheet) {
        const cellKey = `${selectedCell.row},${selectedCell.col}`;
        const cell = sheet.cells[cellKey];
        setValue(cell?.formula || cell?.value?.toString() || '');
      }
    }
  }, [selectedCell, sheetId, sheets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitValue();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const commitValue = () => {
    if (selectedCell && sheetId) {
      const isFormula = value.startsWith('=');
      updateCell(sheetId, selectedCell.row, selectedCell.col, {
        value: isFormula ? null : value,
        formula: isFormula ? value : null,
        displayValue: value,
      });
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    if (selectedCell && sheetId) {
      const sheet = sheets[sheetId];
      if (sheet) {
        const cellKey = `${selectedCell.row},${selectedCell.col}`;
        const cell = sheet.cells[cellKey];
        setValue(cell?.formula || cell?.value?.toString() || '');
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="formula-bar-premium">
      {/* Cell Reference Box */}
      <div className="formula-bar__cell-ref">
        {cellRef}
        <ChevronDown style={{ width: 10, height: 10, marginLeft: 4, opacity: 0.5 }} />
      </div>

      <div className="formula-bar__divider" />

      {/* fx Label */}
      <span className="formula-bar__fx">fx</span>

      {/* Formula Input */}
      <input
        ref={inputRef}
        type="text"
        className="formula-bar__input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => isEditing && commitValue()}
        placeholder="Enter formula or value"
      />
    </div>
  );
};
