// ============================================================
// AUTOSUM DROPDOWN - Quick Formula Insertion
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useSelectionStore } from '../../../stores/selectionStore';
import { ChevronDown } from 'lucide-react';
import './AutoSumDropdown.css';

interface AutoSumFunction {
  name: string;
  formula: string;
  icon: string;
  description: string;
  shortcut?: string;
}

const AUTO_SUM_FUNCTIONS: AutoSumFunction[] = [
  {
    name: 'Sum',
    formula: 'SUM',
    icon: 'Σ',
    description: 'Add all numbers in a range',
    shortcut: 'Alt+=',
  },
  {
    name: 'Average',
    formula: 'AVERAGE',
    icon: 'x̄',
    description: 'Calculate the average of numbers',
  },
  {
    name: 'Count Numbers',
    formula: 'COUNT',
    icon: '#',
    description: 'Count cells containing numbers',
  },
  {
    name: 'Max',
    formula: 'MAX',
    icon: '↑',
    description: 'Find the largest value',
  },
  {
    name: 'Min',
    formula: 'MIN',
    icon: '↓',
    description: 'Find the smallest value',
  },
];

const MORE_FUNCTIONS: AutoSumFunction[] = [
  {
    name: 'Count All',
    formula: 'COUNTA',
    icon: 'A#',
    description: 'Count non-empty cells',
  },
  {
    name: 'Product',
    formula: 'PRODUCT',
    icon: '×',
    description: 'Multiply all numbers',
  },
  {
    name: 'Stdev',
    formula: 'STDEV',
    icon: 'σ',
    description: 'Calculate standard deviation',
  },
  {
    name: 'Var',
    formula: 'VAR',
    icon: 's²',
    description: 'Calculate variance',
  },
];

export const AutoSumDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { updateCell, activeSheetId } = useWorkbookStore();
  const { selectedCell } = useSelectionStore();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect adjacent range for formula
  const detectRange = useCallback((): string => {
    if (!selectedCell) return '';

    // Look up for numbers
    const { row, col } = selectedCell;

    // Simple heuristic: assume range above current cell
    if (row > 0) {
      const startRow = Math.max(0, row - 10);
      const colLetter = String.fromCharCode(65 + col);
      return `${colLetter}${startRow + 1}:${colLetter}${row}`;
    }

    return '';
  }, [selectedCell]);

  // Insert formula
  const insertFormula = useCallback(
    (formula: string) => {
      if (!selectedCell || !activeSheetId) return;

      const range = detectRange();
      const fullFormula = range ? `=${formula}(${range})` : `=${formula}()`;

      updateCell(activeSheetId, selectedCell.row, selectedCell.col, {
        value: fullFormula,
        displayValue: fullFormula,
      });

      setIsOpen(false);
      setShowMore(false);
    },
    [selectedCell, activeSheetId, detectRange, updateCell]
  );

  // Quick Sum
  const handleQuickSum = useCallback(() => {
    insertFormula('SUM');
  }, [insertFormula]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '=') {
        e.preventDefault();
        handleQuickSum();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSum]);

  return (
    <div className="autosum-dropdown" ref={dropdownRef}>
      <div className="autosum-btn-group">
        <button
          className="autosum-main-btn"
          onClick={handleQuickSum}
          title="Sum (Alt+=)"
        >
          <span className="autosum-icon">Σ</span>
          <span className="autosum-label">AutoSum</span>
        </button>
        <button
          className="autosum-arrow-btn"
          onClick={() => setIsOpen(!isOpen)}
          title="More functions"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {isOpen && (
        <div className="autosum-menu">
          {AUTO_SUM_FUNCTIONS.map((func) => (
            <button
              key={func.formula}
              className="autosum-item"
              onClick={() => insertFormula(func.formula)}
            >
              <span className="func-icon">{func.icon}</span>
              <div className="func-info">
                <span className="func-name">{func.name}</span>
                <span className="func-desc">{func.description}</span>
              </div>
              {func.shortcut && (
                <span className="func-shortcut">{func.shortcut}</span>
              )}
            </button>
          ))}

          <div className="menu-divider" />

          <button
            className="autosum-item more-toggle"
            onClick={() => setShowMore(!showMore)}
          >
            <span className="func-icon">{showMore ? '▲' : '▼'}</span>
            <span className="func-name">More Functions...</span>
          </button>

          {showMore && (
            <>
              <div className="menu-divider" />
              {MORE_FUNCTIONS.map((func) => (
                <button
                  key={func.formula}
                  className="autosum-item"
                  onClick={() => insertFormula(func.formula)}
                >
                  <span className="func-icon">{func.icon}</span>
                  <div className="func-info">
                    <span className="func-name">{func.name}</span>
                    <span className="func-desc">{func.description}</span>
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="menu-divider" />

          <button className="autosum-item" onClick={() => setIsOpen(false)}>
            <span className="func-icon">ƒx</span>
            <span className="func-name">Insert Function...</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoSumDropdown;
