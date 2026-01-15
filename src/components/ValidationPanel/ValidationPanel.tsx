import { useState } from 'react';
import { useValidationStore } from '../../stores/validationStore';
import { ValidationRule, ValidationType, ErrorStyle } from '../../types/cell';

interface ValidationPanelProps {
  sheetId: string;
  selectedRow?: number;
  selectedCol?: number;
  onClose: () => void;
}

type ValidationTypeOption = 'any' | 'wholeNumber' | 'decimal' | 'list' | 'textLength' | 'date' | 'custom';

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  sheetId,
  selectedRow,
  selectedCol,
  onClose,
}) => {
  const {
    addRule,
    applyToCell,
    applyToRange,
    getRuleForCell,
    clearCellValidation,
  } = useValidationStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'input' | 'error'>('settings');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Form state
  const [validationType, setValidationType] = useState<ValidationTypeOption>('any');
  const [allowBlank, setAllowBlank] = useState(true);

  // Number validation
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  // List validation
  const [listValues, setListValues] = useState('');
  const [showDropdown, setShowDropdown] = useState(true);

  // Text length
  const [maxLength, setMaxLength] = useState('');

  // Custom formula
  const [customFormula, setCustomFormula] = useState('');

  // Input message
  const [inputTitle, setInputTitle] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showInputMessage, setShowInputMessage] = useState(false);

  // Error alert
  const [errorStyle, setErrorStyle] = useState<ErrorStyle>('stop');
  const [errorTitle, setErrorTitle] = useState('Invalid Entry');
  const [errorMessage, setErrorMessage] = useState('The value you entered is not valid.');
  const [showErrorAlert, setShowErrorAlert] = useState(true);

  // Range application
  const [applyMode] = useState<'cell' | 'range'>('cell');
  const [rangeStart] = useState('');
  const [rangeEnd] = useState('');

  const currentRule = selectedRow !== undefined && selectedCol !== undefined
    ? getRuleForCell(sheetId, selectedRow, selectedCol)
    : undefined;

  const handleCreateRule = () => {
    const now = new Date().toISOString();
    let validationTypeObj: ValidationType;

    switch (validationType) {
      case 'wholeNumber':
      case 'decimal':
        const min = parseFloat(minValue) || 0;
        const max = parseFloat(maxValue) || 100;
        validationTypeObj = {
          type: validationType,
          operator: 'between',
          value1: min,
          value2: max,
        };
        break;

      case 'list':
        const values = listValues.split(',').map(v => v.trim()).filter(Boolean);
        validationTypeObj = {
          type: 'list',
          source: { type: 'values', values },
          dropdown: showDropdown,
        };
        break;

      case 'textLength':
        validationTypeObj = {
          type: 'textLength',
          operator: 'lessThanOrEqual',
          value1: parseInt(maxLength) || 255,
        };
        break;

      case 'custom':
        validationTypeObj = {
          type: 'custom',
          formula: customFormula,
        };
        break;

      default:
        validationTypeObj = { type: 'any' };
    }

    const newRule: ValidationRule = {
      id: crypto.randomUUID(),
      validationType: validationTypeObj,
      allowBlank,
      inputMessage: showInputMessage ? {
        title: inputTitle,
        message: inputMessage,
        show: true,
      } : undefined,
      errorAlert: showErrorAlert ? {
        style: errorStyle,
        title: errorTitle,
        message: errorMessage,
        show: true,
      } : undefined,
      createdAt: now,
      updatedAt: now,
    };

    addRule(newRule);
    setSelectedRuleId(newRule.id);
  };

  const handleApplyRule = () => {
    if (!selectedRuleId) return;

    if (applyMode === 'cell') {
      if (selectedRow !== undefined && selectedCol !== undefined) {
        applyToCell(selectedRuleId, sheetId, selectedRow, selectedCol);
      }
    } else {
      // Parse range - simplified
      const startMatch = rangeStart.match(/(\d+),(\d+)/);
      const endMatch = rangeEnd.match(/(\d+),(\d+)/);
      if (startMatch && endMatch) {
        applyToRange(
          selectedRuleId,
          sheetId,
          parseInt(startMatch[1]),
          parseInt(startMatch[2]),
          parseInt(endMatch[1]),
          parseInt(endMatch[2])
        );
      }
    }
  };

  const handleClearValidation = () => {
    if (selectedRow !== undefined && selectedCol !== undefined) {
      clearCellValidation(sheetId, selectedRow, selectedCol);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Data Validation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm ${activeTab === 'settings' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 text-sm ${activeTab === 'input' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
          >
            Input Message
          </button>
          <button
            onClick={() => setActiveTab('error')}
            className={`px-4 py-2 text-sm ${activeTab === 'error' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
          >
            Error Alert
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Current cell info */}
              {selectedRow !== undefined && selectedCol !== undefined && (
                <div className="text-sm text-gray-600 mb-4">
                  Selected cell: Row {selectedRow + 1}, Col {selectedCol + 1}
                  {currentRule && (
                    <span className="ml-2 text-blue-600">(Has validation)</span>
                  )}
                </div>
              )}

              {/* Validation Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Allow</label>
                <select
                  value={validationType}
                  onChange={(e) => setValidationType(e.target.value as ValidationTypeOption)}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="any">Any value</option>
                  <option value="wholeNumber">Whole number</option>
                  <option value="decimal">Decimal</option>
                  <option value="list">List</option>
                  <option value="textLength">Text length</option>
                  <option value="date">Date</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Type-specific fields */}
              {(validationType === 'wholeNumber' || validationType === 'decimal') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum</label>
                    <input
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum</label>
                    <input
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              )}

              {validationType === 'list' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Source (comma-separated)</label>
                  <input
                    type="text"
                    value={listValues}
                    onChange={(e) => setListValues(e.target.value)}
                    placeholder="Option1, Option2, Option3"
                    className="w-full px-2 py-1 border rounded"
                  />
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={showDropdown}
                      onChange={(e) => setShowDropdown(e.target.checked)}
                    />
                    <span className="text-sm">Show in-cell dropdown</span>
                  </label>
                </div>
              )}

              {validationType === 'textLength' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum length</label>
                  <input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              )}

              {validationType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Formula (must return TRUE)</label>
                  <input
                    type="text"
                    value={customFormula}
                    onChange={(e) => setCustomFormula(e.target.value)}
                    placeholder="=A1>0"
                    className="w-full px-2 py-1 border rounded font-mono"
                  />
                </div>
              )}

              {/* Allow blank */}
              {validationType !== 'any' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allowBlank}
                    onChange={(e) => setAllowBlank(e.target.checked)}
                  />
                  <span className="text-sm">Ignore blank</span>
                </label>
              )}
            </div>
          )}

          {activeTab === 'input' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInputMessage}
                  onChange={(e) => setShowInputMessage(e.target.checked)}
                />
                <span className="text-sm font-medium">Show input message when cell is selected</span>
              </label>

              {showInputMessage && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'error' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showErrorAlert}
                  onChange={(e) => setShowErrorAlert(e.target.checked)}
                />
                <span className="text-sm font-medium">Show error alert after invalid data is entered</span>
              </label>

              {showErrorAlert && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Style</label>
                    <select
                      value={errorStyle}
                      onChange={(e) => setErrorStyle(e.target.value as ErrorStyle)}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="stop">Stop</option>
                      <option value="warning">Warning</option>
                      <option value="information">Information</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={errorTitle}
                      onChange={(e) => setErrorTitle(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Error message</label>
                    <textarea
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleClearValidation}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => { handleCreateRule(); handleApplyRule(); }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
