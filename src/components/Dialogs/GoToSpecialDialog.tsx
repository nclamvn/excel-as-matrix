import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { useValidationStore } from '../../stores/validationStore';
import { getCellKey } from '../../types/cell';

interface GoToSpecialDialogProps {
  onClose: () => void;
}

type SpecialType =
  | 'comments'
  | 'constants'
  | 'formulas'
  | 'blanks'
  | 'currentRegion'
  | 'currentArray'
  | 'rowDifferences'
  | 'columnDifferences'
  | 'precedents'
  | 'dependents'
  | 'lastCell'
  | 'visibleCellsOnly'
  | 'conditionalFormats'
  | 'dataValidation';

interface ConstantOptions {
  numbers: boolean;
  text: boolean;
  logicals: boolean;
  errors: boolean;
}

export const GoToSpecialDialog: React.FC<GoToSpecialDialogProps> = ({ onClose }) => {
  const [selectedType, setSelectedType] = useState<SpecialType>('blanks');
  const [constantOptions, setConstantOptions] = useState<ConstantOptions>({
    numbers: true,
    text: true,
    logicals: true,
    errors: true,
  });
  const [formulaOptions, setFormulaOptions] = useState<ConstantOptions>({
    numbers: true,
    text: true,
    logicals: true,
    errors: true,
  });

  const { sheets, activeSheetId, selectionRange } = useWorkbookStore();
  const { setSelectedCell, setSelectionRange } = useSelectionStore();
  const { showToast } = useUIStore();

  const handleGo = () => {
    if (!activeSheetId) {
      showToast('No active sheet', 'error');
      return;
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      showToast('Sheet not found', 'error');
      return;
    }

    const matchingCells: { row: number; col: number }[] = [];

    // Define search range
    const searchRange = selectionRange || {
      start: { row: 0, col: 0 },
      end: { row: 999, col: 25 }, // Default to reasonable range
    };

    // Find all cells in range
    for (let row = searchRange.start.row; row <= searchRange.end.row; row++) {
      for (let col = searchRange.start.col; col <= searchRange.end.col; col++) {
        const key = getCellKey(row, col);
        const cell = sheet.cells[key];

        let matches = false;

        switch (selectedType) {
          case 'blanks':
            matches = !cell || cell.value === null || cell.value === '' || cell.value === undefined;
            break;

          case 'constants':
            if (cell && cell.value !== null && cell.value !== '' && !cell.formula) {
              const value = cell.value;
              if (constantOptions.numbers && typeof value === 'number') matches = true;
              if (constantOptions.text && typeof value === 'string' && isNaN(Number(value))) matches = true;
              if (constantOptions.logicals && typeof value === 'boolean') matches = true;
              if (constantOptions.errors && typeof value === 'string' && value.startsWith('#')) matches = true;
            }
            break;

          case 'formulas':
            if (cell?.formula && cell.formula.startsWith('=')) {
              const value = cell.value;
              if (formulaOptions.numbers && typeof value === 'number') matches = true;
              if (formulaOptions.text && typeof value === 'string' && !value.startsWith('#')) matches = true;
              if (formulaOptions.logicals && typeof value === 'boolean') matches = true;
              if (formulaOptions.errors && typeof value === 'string' && value.startsWith('#')) matches = true;
              // If no specific option, match all formulas
              if (!formulaOptions.numbers && !formulaOptions.text && !formulaOptions.logicals && !formulaOptions.errors) {
                matches = true;
              }
            }
            break;

          case 'comments':
            matches = !!(cell?.comment);
            break;

          case 'conditionalFormats':
            // Check for conditional formatting (format property with conditions)
            matches = !!(cell?.format && Object.keys(cell.format).length > 0);
            break;

          case 'dataValidation':
            // Check for data validation (would need to be added to CellData if needed)
            matches = !!(cell && useValidationStore.getState().getRuleForCell(activeSheetId, row, col));
            break;

          case 'lastCell':
            // Find the last used cell
            break;

          case 'visibleCellsOnly':
            // All visible cells in selection
            const isRowHidden = sheet.hiddenRows?.has(row);
            const isColHidden = sheet.hiddenColumns?.has(col);
            matches = !isRowHidden && !isColHidden && cell !== undefined;
            break;

          default:
            break;
        }

        if (matches) {
          matchingCells.push({ row, col });
        }
      }
    }

    // Handle lastCell specially
    if (selectedType === 'lastCell') {
      let lastRow = 0;
      let lastCol = 0;
      Object.keys(sheet.cells).forEach((key) => {
        const [rowStr, colStr] = key.split(':');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        if (row > lastRow || (row === lastRow && col > lastCol)) {
          lastRow = row;
          lastCol = col;
        }
      });
      matchingCells.push({ row: lastRow, col: lastCol });
    }

    if (matchingCells.length === 0) {
      showToast('No cells found matching criteria', 'info');
      return;
    }

    // Select the first matching cell
    const first = matchingCells[0];
    setSelectedCell(first);

    // If multiple cells, set selection range
    if (matchingCells.length > 1) {
      const minRow = Math.min(...matchingCells.map((c) => c.row));
      const maxRow = Math.max(...matchingCells.map((c) => c.row));
      const minCol = Math.min(...matchingCells.map((c) => c.col));
      const maxCol = Math.max(...matchingCells.map((c) => c.col));

      setSelectionRange({
        start: { row: minRow, col: minCol },
        end: { row: maxRow, col: maxCol },
      });
    }

    showToast(`Found ${matchingCells.length} cell(s)`, 'success');
    onClose();
  };

  const showConstantOptions = selectedType === 'constants';
  const showFormulaOptions = selectedType === 'formulas';

  const specialTypes: { id: SpecialType; label: string; description: string }[] = [
    { id: 'comments', label: 'Comments', description: 'Cells with comments' },
    { id: 'constants', label: 'Constants', description: 'Cells with constant values' },
    { id: 'formulas', label: 'Formulas', description: 'Cells containing formulas' },
    { id: 'blanks', label: 'Blanks', description: 'Empty cells' },
    { id: 'lastCell', label: 'Last cell', description: 'Last used cell in sheet' },
    { id: 'visibleCellsOnly', label: 'Visible cells only', description: 'Only visible cells' },
    { id: 'conditionalFormats', label: 'Conditional formats', description: 'Cells with conditional formatting' },
    { id: 'dataValidation', label: 'Data validation', description: 'Cells with validation rules' },
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog goto-special-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400 }}
      >
        <div className="dialog-header">
          <h2>Go To Special</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="goto-special-types">
            {specialTypes.map((type) => (
              <label key={type.id} className="goto-special-option">
                <input
                  type="radio"
                  name="specialType"
                  checked={selectedType === type.id}
                  onChange={() => setSelectedType(type.id)}
                />
                <div className="goto-special-option-content">
                  <span className="goto-special-option-label">{type.label}</span>
                  <span className="goto-special-option-desc">{type.description}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Sub-options for Constants */}
          {showConstantOptions && (
            <div className="goto-special-suboptions">
              <div className="goto-special-suboptions-title">Include:</div>
              <div className="goto-special-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={constantOptions.numbers}
                    onChange={(e) =>
                      setConstantOptions({ ...constantOptions, numbers: e.target.checked })
                    }
                  />
                  Numbers
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={constantOptions.text}
                    onChange={(e) =>
                      setConstantOptions({ ...constantOptions, text: e.target.checked })
                    }
                  />
                  Text
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={constantOptions.logicals}
                    onChange={(e) =>
                      setConstantOptions({ ...constantOptions, logicals: e.target.checked })
                    }
                  />
                  Logicals
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={constantOptions.errors}
                    onChange={(e) =>
                      setConstantOptions({ ...constantOptions, errors: e.target.checked })
                    }
                  />
                  Errors
                </label>
              </div>
            </div>
          )}

          {/* Sub-options for Formulas */}
          {showFormulaOptions && (
            <div className="goto-special-suboptions">
              <div className="goto-special-suboptions-title">Formula results:</div>
              <div className="goto-special-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={formulaOptions.numbers}
                    onChange={(e) =>
                      setFormulaOptions({ ...formulaOptions, numbers: e.target.checked })
                    }
                  />
                  Numbers
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formulaOptions.text}
                    onChange={(e) =>
                      setFormulaOptions({ ...formulaOptions, text: e.target.checked })
                    }
                  />
                  Text
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formulaOptions.logicals}
                    onChange={(e) =>
                      setFormulaOptions({ ...formulaOptions, logicals: e.target.checked })
                    }
                  />
                  Logicals
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formulaOptions.errors}
                    onChange={(e) =>
                      setFormulaOptions({ ...formulaOptions, errors: e.target.checked })
                    }
                  />
                  Errors
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleGo}>
            <Check size={14} style={{ marginRight: 6 }} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
