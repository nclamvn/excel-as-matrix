import React, { useState } from 'react';
import { X, Clipboard } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface PasteSpecialDialogProps {
  onClose: () => void;
}

type PasteType = 'all' | 'formulas' | 'values' | 'formats' | 'comments' | 'validation' | 'allExceptBorders' | 'columnWidths' | 'formulasAndNumberFormats' | 'valuesAndNumberFormats';

type PasteOperation = 'none' | 'add' | 'subtract' | 'multiply' | 'divide';

export const PasteSpecialDialog: React.FC<PasteSpecialDialogProps> = ({ onClose }) => {
  const [pasteType, setPasteType] = useState<PasteType>('all');
  const [operation, setOperation] = useState<PasteOperation>('none');
  const [skipBlanks, setSkipBlanks] = useState(false);
  const [transpose, setTranspose] = useState(false);

  const { paste, pasteSpecial, clipboard } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handlePaste = () => {
    if (!clipboard) {
      showToast('Nothing to paste. Copy cells first.', 'warning');
      onClose();
      return;
    }

    // Map to store's paste modes
    let mode: 'all' | 'values' | 'formulas' | 'formatting' = 'all';
    switch (pasteType) {
      case 'values':
      case 'valuesAndNumberFormats':
        mode = 'values';
        break;
      case 'formulas':
      case 'formulasAndNumberFormats':
        mode = 'formulas';
        break;
      case 'formats':
        mode = 'formatting';
        break;
      default:
        mode = 'all';
    }

    // Use pasteSpecial if available, otherwise use regular paste
    if (pasteSpecial) {
      pasteSpecial({
        mode,
        operation,
        skipBlanks,
        transpose,
      });
    } else {
      paste(mode);
    }

    showToast('Pasted successfully', 'success');
    onClose();
  };

  const pasteTypes: { id: PasteType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'values', label: 'Values' },
    { id: 'formats', label: 'Formats' },
    { id: 'comments', label: 'Comments' },
    { id: 'validation', label: 'Validation' },
    { id: 'allExceptBorders', label: 'All except borders' },
    { id: 'columnWidths', label: 'Column widths' },
    { id: 'formulasAndNumberFormats', label: 'Formulas and number formats' },
    { id: 'valuesAndNumberFormats', label: 'Values and number formats' },
  ];

  const operations: { id: PasteOperation; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'add', label: 'Add' },
    { id: 'subtract', label: 'Subtract' },
    { id: 'multiply', label: 'Multiply' },
    { id: 'divide', label: 'Divide' },
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog paste-special-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420 }}
      >
        <div className="dialog-header">
          <h2>Paste Special</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="paste-special-layout">
            {/* Paste Type Section */}
            <div className="paste-special-section">
              <div className="paste-special-section-title">Paste</div>
              <div className="paste-special-options">
                {pasteTypes.map((type) => (
                  <label key={type.id} className="paste-special-radio">
                    <input
                      type="radio"
                      name="pasteType"
                      checked={pasteType === type.id}
                      onChange={() => setPasteType(type.id)}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operation Section */}
            <div className="paste-special-section">
              <div className="paste-special-section-title">Operation</div>
              <div className="paste-special-options paste-special-options-horizontal">
                {operations.map((op) => (
                  <label key={op.id} className="paste-special-radio">
                    <input
                      type="radio"
                      name="operation"
                      checked={operation === op.id}
                      onChange={() => setOperation(op.id)}
                    />
                    <span>{op.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="paste-special-checkboxes">
              <label className="paste-special-checkbox">
                <input
                  type="checkbox"
                  checked={skipBlanks}
                  onChange={(e) => setSkipBlanks(e.target.checked)}
                />
                <span>Skip blanks</span>
              </label>
              <label className="paste-special-checkbox">
                <input
                  type="checkbox"
                  checked={transpose}
                  onChange={(e) => setTranspose(e.target.checked)}
                />
                <span>Transpose</span>
              </label>
            </div>
          </div>

          {!clipboard && (
            <p className="dialog-info" style={{ marginTop: 'var(--spacing-md)', color: 'var(--orange-accent)' }}>
              No data in clipboard. Copy cells first (Ctrl+C).
            </p>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handlePaste} disabled={!clipboard}>
            <Clipboard size={14} style={{ marginRight: 6 }} />
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
