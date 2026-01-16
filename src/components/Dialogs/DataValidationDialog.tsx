import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { useValidationStore } from '../../stores/validationStore';
import { ValidationType as ValidationTypeType, ComparisonOperator } from '../../types/cell';

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

// Map UI operator to store operator
const operatorMap: Record<ValidationOperator, ComparisonOperator> = {
  between: 'between',
  notBetween: 'notBetween',
  equalTo: 'equal',
  notEqualTo: 'notEqual',
  greaterThan: 'greaterThan',
  lessThan: 'lessThan',
  greaterThanOrEqual: 'greaterThanOrEqual',
  lessThanOrEqual: 'lessThanOrEqual',
};

export const DataValidationDialog: React.FC<DataValidationDialogProps> = ({ onClose }) => {
  const [validationType, setValidationType] = useState<ValidationType>('any');
  const [operator, setOperator] = useState<ValidationOperator>('between');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [listValues, setListValues] = useState('');
  const [showDropdown, setShowDropdown] = useState(true);
  const [allowBlank, setAllowBlank] = useState(true);
  const [showInputMessage, setShowInputMessage] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showError, setShowError] = useState(true);
  const [errorStyle, setErrorStyle] = useState<'stop' | 'warning' | 'information'>('stop');
  const [errorTitle, setErrorTitle] = useState('Invalid Input');
  const [errorMessage, setErrorMessage] = useState('The value you entered is not valid.');

  const { selectionRange, activeSheetId } = useWorkbookStore();
  const { showToast } = useUIStore();
  const { addRule, applyToRange } = useValidationStore();

  const handleApply = () => {
    if (!selectionRange || !activeSheetId) {
      showToast('Please select a range first', 'warning');
      return;
    }

    // Create validation type based on selection
    let valType: ValidationTypeType;
    const storeOperator = operatorMap[operator];

    switch (validationType) {
      case 'any':
        valType = { type: 'any' };
        break;
      case 'wholeNumber':
        valType = {
          type: 'wholeNumber',
          operator: storeOperator,
          value1: parseFloat(value1) || 0,
          value2: ['between', 'notBetween'].includes(operator) ? parseFloat(value2) || 0 : undefined,
        };
        break;
      case 'decimal':
        valType = {
          type: 'decimal',
          operator: storeOperator,
          value1: parseFloat(value1) || 0,
          value2: ['between', 'notBetween'].includes(operator) ? parseFloat(value2) || 0 : undefined,
        };
        break;
      case 'list':
        valType = {
          type: 'list',
          source: { type: 'values', values: listValues.split(',').map(s => s.trim()).filter(Boolean) },
          dropdown: showDropdown,
        };
        break;
      case 'textLength':
        valType = {
          type: 'textLength',
          operator: storeOperator,
          value1: parseInt(value1) || 0,
          value2: ['between', 'notBetween'].includes(operator) ? parseInt(value2) || 0 : undefined,
        };
        break;
      case 'date':
        valType = {
          type: 'date',
          operator: storeOperator,
          value1: value1 || new Date().toISOString().split('T')[0],
          value2: ['between', 'notBetween'].includes(operator) ? value2 : undefined,
        };
        break;
      case 'custom':
        valType = { type: 'custom', formula: value1 };
        break;
      default:
        valType = { type: 'any' };
    }

    // Create the rule
    const ruleId = `rule_${Date.now()}`;
    addRule({
      id: ruleId,
      validationType: valType,
      allowBlank,
      inputMessage: showInputMessage ? {
        title: inputTitle,
        message: inputMessage,
        show: true,
      } : undefined,
      errorAlert: showError ? {
        style: errorStyle,
        title: errorTitle,
        message: errorMessage,
        show: true,
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Apply to selection range
    applyToRange(
      ruleId,
      activeSheetId,
      selectionRange.start.row,
      selectionRange.start.col,
      selectionRange.end.row,
      selectionRange.end.col
    );

    showToast('Data validation applied', 'success');
    onClose();
  };

  const handleClear = () => {
    setValidationType('any');
    setOperator('between');
    setValue1('');
    setValue2('');
    setListValues('');
    showToast('Validation cleared', 'info');
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

            {validationType === 'custom' && (
              <div className="dialog-field">
                <label>Formula:</label>
                <input
                  type="text"
                  value={value1}
                  onChange={e => setValue1(e.target.value)}
                  placeholder="=A1>0"
                  className="dialog-input"
                />
              </div>
            )}

            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={allowBlank}
                onChange={e => setAllowBlank(e.target.checked)}
              />
              Ignore blank cells
            </label>
          </div>

          {/* Input Message */}
          <div className="dialog-section">
            <h3 className="dialog-section-title">
              <Info size={16} />
              Input Message
            </h3>

            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={showInputMessage}
                onChange={e => setShowInputMessage(e.target.checked)}
              />
              Show input message when cell is selected
            </label>

            {showInputMessage && (
              <>
                <div className="dialog-field">
                  <label>Title:</label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={e => setInputTitle(e.target.value)}
                    className="dialog-input"
                    placeholder="Enter a title"
                  />
                </div>

                <div className="dialog-field">
                  <label>Message:</label>
                  <textarea
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    className="dialog-input"
                    rows={2}
                    placeholder="Enter a helpful message"
                  />
                </div>
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
                  <label>Style:</label>
                  <select
                    value={errorStyle}
                    onChange={e => setErrorStyle(e.target.value as 'stop' | 'warning' | 'information')}
                    className="dialog-input"
                  >
                    <option value="stop">Stop</option>
                    <option value="warning">Warning</option>
                    <option value="information">Information</option>
                  </select>
                </div>

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
          <button className="dialog-btn-danger" onClick={handleClear} style={{ marginRight: 'auto' }}>
            Clear All
          </button>
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
