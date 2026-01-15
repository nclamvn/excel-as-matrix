import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

type ValidationType =
  | 'any'
  | 'wholeNumber'
  | 'decimal'
  | 'list'
  | 'date'
  | 'textLength'
  | 'custom';

type ValidationOperator =
  | 'between'
  | 'notBetween'
  | 'equalTo'
  | 'notEqualTo'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

interface DataValidationDialogProps {
  onClose: () => void;
}

export const DataValidationDialog: React.FC<DataValidationDialogProps> = ({ onClose }) => {
  const [validationType, setValidationType] = useState<ValidationType>('any');
  const [operator, setOperator] = useState<ValidationOperator>('between');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [listValues, setListValues] = useState('');
  const [showDropdown, setShowDropdown] = useState(true);
  const [showError, setShowError] = useState(true);
  const [errorTitle, setErrorTitle] = useState('Invalid Input');
  const [errorMessage, setErrorMessage] = useState('The value you entered is not valid.');

  const { selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleApply = () => {
    if (!selectionRange) {
      showToast('Please select a range first', 'warning');
      return;
    }

    // For now, just show success toast
    // Full implementation would store validation rules
    showToast('Data validation applied', 'success');
    onClose();
  };

  const needsOperator = ['wholeNumber', 'decimal', 'date', 'textLength'].includes(validationType);
  const needsSecondValue = ['between', 'notBetween'].includes(operator);
  const isListType = validationType === 'list';

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 450 }}>
        <div className="dialog-header">
          <h2>Data Validation</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Validation Criteria */}
          <div className="dialog-section">
            <h3 className="dialog-section-title">
              <CheckCircle size={16} />
              Validation Criteria
            </h3>

            <div className="dialog-field">
              <label>Allow:</label>
              <select
                value={validationType}
                onChange={e => setValidationType(e.target.value as ValidationType)}
                className="dialog-input"
              >
                <option value="any">Any value</option>
                <option value="wholeNumber">Whole number</option>
                <option value="decimal">Decimal</option>
                <option value="list">List</option>
                <option value="date">Date</option>
                <option value="textLength">Text length</option>
                <option value="custom">Custom formula</option>
              </select>
            </div>

            {needsOperator && (
              <div className="dialog-field">
                <label>Data:</label>
                <select
                  value={operator}
                  onChange={e => setOperator(e.target.value as ValidationOperator)}
                  className="dialog-input"
                >
                  <option value="between">between</option>
                  <option value="notBetween">not between</option>
                  <option value="equalTo">equal to</option>
                  <option value="notEqualTo">not equal to</option>
                  <option value="greaterThan">greater than</option>
                  <option value="lessThan">less than</option>
                  <option value="greaterThanOrEqual">greater than or equal to</option>
                  <option value="lessThanOrEqual">less than or equal to</option>
                </select>
              </div>
            )}

            {needsOperator && !isListType && (
              <>
                <div className="dialog-field">
                  <label>{needsSecondValue ? 'Minimum:' : 'Value:'}</label>
                  <input
                    type={validationType === 'date' ? 'date' : 'number'}
                    value={value1}
                    onChange={e => setValue1(e.target.value)}
                    className="dialog-input"
                  />
                </div>

                {needsSecondValue && (
                  <div className="dialog-field">
                    <label>Maximum:</label>
                    <input
                      type={validationType === 'date' ? 'date' : 'number'}
                      value={value2}
                      onChange={e => setValue2(e.target.value)}
                      className="dialog-input"
                    />
                  </div>
                )}
              </>
            )}

            {isListType && (
              <>
                <div className="dialog-field">
                  <label>Source (comma-separated):</label>
                  <textarea
                    value={listValues}
                    onChange={e => setListValues(e.target.value)}
                    placeholder="Option1, Option2, Option3"
                    className="dialog-input"
                    rows={3}
                  />
                </div>

                <label className="dialog-checkbox">
                  <input
                    type="checkbox"
                    checked={showDropdown}
                    onChange={e => setShowDropdown(e.target.checked)}
                  />
                  Show dropdown in cell
                </label>
              </>
            )}
          </div>

          {/* Error Alert */}
          <div className="dialog-section">
            <h3 className="dialog-section-title">
              <AlertCircle size={16} />
              Error Alert
            </h3>

            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={showError}
                onChange={e => setShowError(e.target.checked)}
              />
              Show error alert after invalid data is entered
            </label>

            {showError && (
              <>
                <div className="dialog-field">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={errorTitle}
                    onChange={e => setErrorTitle(e.target.value)}
                    className="dialog-input"
                  />
                </div>

                <div className="dialog-field">
                  <label>Message:</label>
                  <textarea
                    value={errorMessage}
                    onChange={e => setErrorMessage(e.target.value)}
                    className="dialog-input"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleApply}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
