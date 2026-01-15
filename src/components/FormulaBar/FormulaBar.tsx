import React, { useCallback, useEffect, useState } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { apiClient } from '../../api/client';
import { toCellRef } from '../../types/cell';

interface FormulaBarProps {
  workbookId: string;
  sheetId: string;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  workbookId,
  sheetId,
}) => {
  const { selectedCell, isEditing, setIsEditing } = useSelectionStore();
  const { getCellFormula, getCellDisplayValue, updateCell } = useWorkbookStore();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update input when selection changes
  useEffect(() => {
    if (selectedCell && !isFocused) {
      const formula = getCellFormula(sheetId, selectedCell.row, selectedCell.col);
      const display = getCellDisplayValue(sheetId, selectedCell.row, selectedCell.col);
      setInputValue(formula || display || '');
    }
  }, [selectedCell, sheetId, getCellFormula, getCellDisplayValue, isFocused]);

  const handleSubmit = useCallback(async () => {
    if (!selectedCell || !workbookId || !sheetId) return;

    const { row, col } = selectedCell;

    try {
      const isFormula = inputValue.startsWith('=');
      const response = isFormula
        ? await apiClient.setCellFormula(workbookId, sheetId, row, col, inputValue)
        : await apiClient.setCellValue(workbookId, sheetId, row, col, inputValue);

      if (response.success) {
        const cellData = await apiClient.getCell(workbookId, sheetId, row, col);
        updateCell(sheetId, row, col, {
          value: cellData.value,
          formula: cellData.formula,
          displayValue: cellData.display_value,
        });
      }
    } catch (error) {
      console.error('Failed to update cell:', error);
    }

    setIsFocused(false);
    setIsEditing(false);
  }, [selectedCell, workbookId, sheetId, inputValue, updateCell, setIsEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      setIsEditing(false);
      // Reset to original value
      if (selectedCell) {
        const formula = getCellFormula(sheetId, selectedCell.row, selectedCell.col);
        const display = getCellDisplayValue(sheetId, selectedCell.row, selectedCell.col);
        setInputValue(formula || display || '');
      }
    }
  };

  const cellRef = selectedCell ? toCellRef(selectedCell.row, selectedCell.col) : '';

  return (
    <div className="formula-bar">
      {/* Cell reference */}
      <div className="w-16 px-2 py-1 text-sm font-medium text-center bg-gray-100 border border-gray-300 rounded">
        {cellRef}
      </div>

      {/* Function button */}
      <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
        <span className="italic">fx</span>
      </button>

      {/* Formula input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          setIsFocused(true);
          setIsEditing(true);
        }}
        onBlur={() => {
          if (!isEditing) {
            setIsFocused(false);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Enter value or formula..."
        className="formula-input"
      />
    </div>
  );
};
