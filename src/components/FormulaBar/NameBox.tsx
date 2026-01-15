import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

export const NameBox: React.FC = () => {
  const { selectedCell, setSelectedCell } = useWorkbookStore();
  const { showToast } = useUIStore();
  const [isOpen, setOpen] = useState(false);

  // Helper to convert column letter to number
  const letterToCol = (letter: string): number => {
    let col = 0;
    for (let i = 0; i < letter.length; i++) {
      col = col * 26 + (letter.charCodeAt(i) - 64);
    }
    return col - 1;
  };

  // Format cell reference (e.g., "A1", "B2")
  const cellRef = selectedCell
    ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}`
    : 'A1';

  const [inputValue, setInputValue] = useState(cellRef);

  // Update input when selection changes
  useEffect(() => {
    setInputValue(cellRef);
  }, [cellRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Parse and go to cell
      const match = inputValue.match(/^([A-Z]+)(\d+)$/i);
      if (match) {
        const colLetter = match[1].toUpperCase();
        const row = parseInt(match[2]) - 1;
        const col = letterToCol(colLetter);

        if (row >= 0 && col >= 0) {
          setSelectedCell({ row, col });
          showToast(`Moved to ${inputValue.toUpperCase()}`, 'info');
        }
      } else {
        showToast('Invalid cell reference', 'warning');
      }
    }
  };

  return (
    <div className="name-box">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        className="name-box-input"
      />
      <button
        className="name-box-dropdown"
        onClick={() => setOpen(!isOpen)}
      >
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
};
