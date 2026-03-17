import React, { useState, useEffect, useRef } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { colToLetter, getCellKey } from '../../types/cell';
import { InlineAISuggestions, FormulaBarAIHint } from '../AI/InlineAISuggestions';

interface FormulaBar2026Props {
  sheetId: string;
}

export const FormulaBar2026: React.FC<FormulaBar2026Props> = ({ sheetId }) => {
  const { sheets, updateCell } = useWorkbookStore();
  const { selectedCell } = useSelectionStore();
  const [value, setValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cellRef = selectedCell
    ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`
    : '';

  useEffect(() => {
    if (selectedCell && sheetId) {
      const sheet = sheets[sheetId];
      if (sheet) {
        const cellKey = getCellKey(selectedCell.row, selectedCell.col);
        const cell = sheet.cells[cellKey];
        setValue(cell?.formula || cell?.value?.toString() || '');
      }
    }
  }, [selectedCell, sheetId, sheets]);

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
        const cellKey = getCellKey(selectedCell.row, selectedCell.col);
        const cell = sheet.cells[cellKey];
        setValue(cell?.formula || cell?.value?.toString() || '');
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="formula-bar-2026-wrapper">
      <div className="formula-bar-2026">
        <div className="formula-bar-2026__cell">{cellRef}</div>
        <span className="formula-bar-2026__fx">fx</span>
        <input
          ref={inputRef}
          type="text"
          className="formula-bar-2026__input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setIsEditing(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => isEditing && commitValue()}
          placeholder="Enter value or formula"
        />
      </div>
      {/* AI-powered formula hints */}
      <FormulaBarAIHint formula={value} />
      {/* Inline AI suggestions for errors and optimizations */}
      {selectedCell && (
        <InlineAISuggestions
          formula={value}
          cellRow={selectedCell.row}
          cellCol={selectedCell.col}
        />
      )}
    </div>
  );
};
