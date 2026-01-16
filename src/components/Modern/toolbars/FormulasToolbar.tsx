import React, { useState } from 'react';
import {
  FunctionSquare, Calculator, Search,
  DollarSign, Calendar, Sigma,
  ChevronDown, Type, GitBranch
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useSelectionStore } from '../../../stores/selectionStore';
import { useUIStore } from '../../../stores/uiStore';
import { InsertFunctionDialog } from '../../Dialogs/InsertFunctionDialog';

// Function categories for dropdowns
const FUNCTION_CATEGORIES = {
  math: [
    { name: 'SUM', desc: 'Adds numbers' },
    { name: 'AVERAGE', desc: 'Returns average' },
    { name: 'COUNT', desc: 'Counts numbers' },
    { name: 'MAX', desc: 'Maximum value' },
    { name: 'MIN', desc: 'Minimum value' },
    { name: 'ROUND', desc: 'Rounds number' },
    { name: 'ABS', desc: 'Absolute value' },
    { name: 'SQRT', desc: 'Square root' },
  ],
  financial: [
    { name: 'PMT', desc: 'Loan payment' },
    { name: 'PV', desc: 'Present value' },
    { name: 'FV', desc: 'Future value' },
    { name: 'NPV', desc: 'Net present value' },
    { name: 'IRR', desc: 'Rate of return' },
  ],
  text: [
    { name: 'CONCATENATE', desc: 'Join text' },
    { name: 'LEFT', desc: 'Left characters' },
    { name: 'RIGHT', desc: 'Right characters' },
    { name: 'MID', desc: 'Middle characters' },
    { name: 'LEN', desc: 'Text length' },
    { name: 'UPPER', desc: 'Uppercase' },
    { name: 'LOWER', desc: 'Lowercase' },
    { name: 'TRIM', desc: 'Remove spaces' },
  ],
  date: [
    { name: 'TODAY', desc: 'Current date' },
    { name: 'NOW', desc: 'Current date/time' },
    { name: 'DATE', desc: 'Creates date' },
    { name: 'YEAR', desc: 'Gets year' },
    { name: 'MONTH', desc: 'Gets month' },
    { name: 'DAY', desc: 'Gets day' },
    { name: 'DATEDIF', desc: 'Date difference' },
  ],
  lookup: [
    { name: 'VLOOKUP', desc: 'Vertical lookup' },
    { name: 'HLOOKUP', desc: 'Horizontal lookup' },
    { name: 'INDEX', desc: 'Value at position' },
    { name: 'MATCH', desc: 'Returns position' },
    { name: 'XLOOKUP', desc: 'Modern lookup' },
  ],
  logical: [
    { name: 'IF', desc: 'Conditional' },
    { name: 'AND', desc: 'All true' },
    { name: 'OR', desc: 'Any true' },
    { name: 'NOT', desc: 'Inverts' },
    { name: 'IFERROR', desc: 'Handle errors' },
  ],
};

export const FormulasToolbar: React.FC = () => {
  const [showFunctionDialog, setShowFunctionDialog] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { setCellValue, activeSheetId, selectionRange } = useWorkbookStore();
  const { selectedCell } = useSelectionStore();
  const { showToast } = useUIStore();

  // Convert column number to letter
  const colToLetter = (col: number): string => {
    let result = '';
    let c = col;
    while (c >= 0) {
      result = String.fromCharCode((c % 26) + 65) + result;
      c = Math.floor(c / 26) - 1;
    }
    return result;
  };

  // Get cell reference string
  const getCellRef = (row: number, col: number): string => {
    return `${colToLetter(col)}${row + 1}`;
  };

  // Get range reference string
  const getRangeRef = (): string => {
    if (!selectionRange) {
      if (selectedCell) {
        return getCellRef(selectedCell.row, selectedCell.col);
      }
      return 'A1';
    }
    const start = getCellRef(selectionRange.start.row, selectionRange.start.col);
    const end = getCellRef(selectionRange.end.row, selectionRange.end.col);
    return start === end ? start : `${start}:${end}`;
  };

  // Insert function at current cell
  const insertFunction = (funcName: string) => {
    if (!selectedCell || !activeSheetId) {
      showToast('Select a cell first', 'warning');
      return;
    }

    const { row, col } = selectedCell;
    const rangeRef = getRangeRef();

    // Functions that typically use a range
    const rangeFunctions = ['SUM', 'AVERAGE', 'COUNT', 'COUNTA', 'MAX', 'MIN', 'COUNTIF', 'SUMIF'];

    let formula: string;
    if (rangeFunctions.includes(funcName)) {
      formula = `=${funcName}(${rangeRef})`;
    } else if (['TODAY', 'NOW', 'RAND'].includes(funcName)) {
      formula = `=${funcName}()`;
    } else {
      formula = `=${funcName}()`;
    }

    setCellValue(activeSheetId, row, col, formula);
    setActiveDropdown(null);
    showToast(`Inserted ${funcName}`, 'success');
  };

  // AutoSum - detect range above and insert SUM
  const handleAutoSum = () => {
    if (!selectedCell || !activeSheetId) {
      showToast('Select a cell first', 'warning');
      return;
    }

    const { row, col } = selectedCell;

    // If there's a selection range, use it
    if (selectionRange && (selectionRange.start.row !== selectionRange.end.row || selectionRange.start.col !== selectionRange.end.col)) {
      const start = getCellRef(selectionRange.start.row, selectionRange.start.col);
      const end = getCellRef(selectionRange.end.row, selectionRange.end.col);
      setCellValue(activeSheetId, row, col, `=SUM(${start}:${end})`);
    } else if (row > 0) {
      // Try to detect range above
      const rangeRef = `${colToLetter(col)}1:${colToLetter(col)}${row}`;
      setCellValue(activeSheetId, row, col, `=SUM(${rangeRef})`);
    } else {
      setCellValue(activeSheetId, row, col, '=SUM()');
    }

    showToast('AutoSum inserted', 'success');
  };

  // Close dropdown when clicking outside
  const handleDropdownClick = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <>
      <div className="toolbar-2026">
        {/* Insert Function */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => setShowFunctionDialog(true)}
            title="Insert Function"
          >
            <FunctionSquare size={16} />
            <span>Function</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* AutoSum & Quick Functions */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={handleAutoSum}
            title="AutoSum (Alt+=)"
          >
            <Sigma size={16} />
            <span>AutoSum</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => insertFunction('AVERAGE')}
            title="Average"
          >
            <span>Avg</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => insertFunction('COUNT')}
            title="Count"
          >
            <span>Count</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => insertFunction('MAX')}
            title="Max"
          >
            <span>Max</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => insertFunction('MIN')}
            title="Min"
          >
            <span>Min</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Function Categories */}
        <div className="toolbar-2026__group">
          {/* Math */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('math')}
              title="Math Functions"
            >
              <Calculator size={16} />
              <span>Math</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'math' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.math.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Financial */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('financial')}
              title="Financial Functions"
            >
              <DollarSign size={16} />
              <span>Financial</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'financial' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.financial.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('text')}
              title="Text Functions"
            >
              <Type size={16} />
              <span>Text</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'text' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.text.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('date')}
              title="Date Functions"
            >
              <Calendar size={16} />
              <span>Date</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'date' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.date.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lookup */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('lookup')}
              title="Lookup Functions"
            >
              <Search size={16} />
              <span>Lookup</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'lookup' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.lookup.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logical */}
          <div className="toolbar-2026__dropdown">
            <button
              className="toolbar-2026__btn"
              onClick={() => handleDropdownClick('logical')}
              title="Logical Functions"
            >
              <GitBranch size={16} />
              <span>Logical</span>
              <ChevronDown size={12} />
            </button>
            {activeDropdown === 'logical' && (
              <div className="toolbar-2026__dropdown-menu">
                {FUNCTION_CATEGORIES.logical.map(fn => (
                  <button
                    key={fn.name}
                    className="toolbar-2026__dropdown-item"
                    onClick={() => insertFunction(fn.name)}
                  >
                    <span className="fn-name">{fn.name}</span>
                    <span className="fn-desc">{fn.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insert Function Dialog */}
      {showFunctionDialog && (
        <InsertFunctionDialog
          onClose={() => setShowFunctionDialog(false)}
          onInsert={(funcName) => {
            insertFunction(funcName);
            setShowFunctionDialog(false);
          }}
        />
      )}
    </>
  );
};
