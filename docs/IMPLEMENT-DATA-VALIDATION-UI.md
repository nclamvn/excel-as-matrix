# ✓ IMPLEMENTATION GUIDE: Data Validation UI
## ExcelAI — Cell Input Validation System

---

## 🎯 Overview

| Feature | Est. Time | Files | Impact |
|---------|-----------|-------|--------|
| Data Validation UI | 1.5 days | 7 | +0.5% |

**Validation Types:**
- Whole Number (min, max, between)
- Decimal (min, max, between)
- List (dropdown options)
- Date (before, after, between)
- Time (before, after, between)
- Text Length (min, max, between)
- Custom (formula)

---

## 📁 Files to Create

```
src/
├── types/
│   └── validation.ts            # Validation type definitions
├── stores/
│   └── validationStore.ts       # Zustand store for validations
├── components/
│   └── DataValidation/
│       ├── index.ts
│       ├── DataValidationDialog.tsx
│       ├── ValidationDropdown.tsx
│       ├── ValidationIndicator.tsx
│       ├── CircleInvalidCells.tsx
│       └── DataValidation.css
```

---

## 📄 File 1: `src/types/validation.ts`

```typescript
// ============================================================
// DATA VALIDATION TYPE DEFINITIONS
// ============================================================

export type ValidationType = 
  | 'any'
  | 'wholeNumber'
  | 'decimal'
  | 'list'
  | 'date'
  | 'time'
  | 'textLength'
  | 'custom';

export type ValidationOperator =
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export interface ValidationRule {
  id: string;
  type: ValidationType;
  operator?: ValidationOperator;
  
  // Values (depending on type and operator)
  value1?: string | number;
  value2?: string | number;  // For 'between' operators
  
  // List options
  listSource?: string;       // Comma-separated or range reference
  listItems?: string[];      // Parsed list items
  
  // Custom formula
  formula?: string;
  
  // Options
  ignoreBlank: boolean;
  showDropdown: boolean;     // For list type
  
  // Input message
  showInputMessage: boolean;
  inputTitle?: string;
  inputMessage?: string;
  
  // Error alert
  showErrorAlert: boolean;
  errorStyle: 'stop' | 'warning' | 'information';
  errorTitle?: string;
  errorMessage?: string;
  
  // Applied range
  range: string;             // e.g., "A1:A100"
}

export interface CellValidation {
  ruleId: string;
  isValid: boolean;
  errorMessage?: string;
}

export const VALIDATION_TYPE_LABELS: Record<ValidationType, string> = {
  any: 'Any value',
  wholeNumber: 'Whole number',
  decimal: 'Decimal',
  list: 'List',
  date: 'Date',
  time: 'Time',
  textLength: 'Text length',
  custom: 'Custom',
};

export const VALIDATION_OPERATOR_LABELS: Record<ValidationOperator, string> = {
  between: 'between',
  notBetween: 'not between',
  equal: 'equal to',
  notEqual: 'not equal to',
  greaterThan: 'greater than',
  lessThan: 'less than',
  greaterThanOrEqual: 'greater than or equal to',
  lessThanOrEqual: 'less than or equal to',
};

export const DEFAULT_VALIDATION_RULE: Partial<ValidationRule> = {
  type: 'any',
  operator: 'between',
  ignoreBlank: true,
  showDropdown: true,
  showInputMessage: false,
  showErrorAlert: true,
  errorStyle: 'stop',
};

export const ERROR_STYLE_CONFIG = {
  stop: {
    icon: '🛑',
    title: 'Invalid Entry',
    allowRetry: false,
  },
  warning: {
    icon: '⚠️',
    title: 'Warning',
    allowRetry: true,
  },
  information: {
    icon: 'ℹ️',
    title: 'Information',
    allowRetry: true,
  },
};
```

---

## 📄 File 2: `src/stores/validationStore.ts`

```typescript
// ============================================================
// VALIDATION STORE — Zustand Store for Data Validation
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  ValidationRule,
  ValidationType,
  ValidationOperator,
  CellValidation,
  DEFAULT_VALIDATION_RULE,
} from '../types/validation';

interface ValidationStore {
  // Rules per sheet
  rules: Record<string, ValidationRule[]>;  // sheetId -> rules
  
  // Validation results cache
  validationCache: Record<string, Record<string, CellValidation>>;  // sheetId -> cellKey -> validation
  
  // Circle invalid cells mode
  showInvalidCircles: boolean;
  
  // CRUD
  addRule: (sheetId: string, rule: Partial<ValidationRule>) => string;
  updateRule: (sheetId: string, ruleId: string, updates: Partial<ValidationRule>) => void;
  deleteRule: (sheetId: string, ruleId: string) => void;
  
  // Get rules
  getRulesForSheet: (sheetId: string) => ValidationRule[];
  getRuleForCell: (sheetId: string, row: number, col: number) => ValidationRule | undefined;
  getRuleById: (sheetId: string, ruleId: string) => ValidationRule | undefined;
  
  // Validation
  validateCell: (sheetId: string, row: number, col: number, value: any) => CellValidation | null;
  validateRange: (sheetId: string, range: string) => void;
  clearValidationCache: (sheetId: string) => void;
  
  // Invalid circles
  toggleInvalidCircles: () => void;
  getInvalidCells: (sheetId: string) => { row: number; col: number }[];
  
  // Clear
  clearRulesForRange: (sheetId: string, range: string) => void;
  clearAllRules: (sheetId: string) => void;
}

// Helper: Parse range string to cells
const parseRange = (range: string): { startRow: number; endRow: number; startCol: number; endCol: number } | null => {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
  const startRow = parseInt(match[2]) - 1;
  const endCol = match[3].toUpperCase().charCodeAt(0) - 65;
  const endRow = parseInt(match[4]) - 1;
  
  return { startRow, endRow, startCol, endCol };
};

// Helper: Check if cell is in range
const isCellInRange = (row: number, col: number, range: string): boolean => {
  const parsed = parseRange(range);
  if (!parsed) return false;
  
  return (
    row >= parsed.startRow && row <= parsed.endRow &&
    col >= parsed.startCol && col <= parsed.endCol
  );
};

// Helper: Validate value against rule
const validateValue = (value: any, rule: ValidationRule): { isValid: boolean; errorMessage?: string } => {
  // Ignore blank if configured
  if (rule.ignoreBlank && (value === '' || value === null || value === undefined)) {
    return { isValid: true };
  }
  
  const numValue = parseFloat(String(value));
  const strValue = String(value);
  
  switch (rule.type) {
    case 'any':
      return { isValid: true };
      
    case 'wholeNumber':
      if (!Number.isInteger(numValue)) {
        return { isValid: false, errorMessage: 'Value must be a whole number' };
      }
      return validateNumeric(numValue, rule);
      
    case 'decimal':
      if (isNaN(numValue)) {
        return { isValid: false, errorMessage: 'Value must be a number' };
      }
      return validateNumeric(numValue, rule);
      
    case 'list':
      const items = rule.listItems || rule.listSource?.split(',').map(s => s.trim()) || [];
      if (!items.includes(strValue)) {
        return { isValid: false, errorMessage: 'Value must be from the list' };
      }
      return { isValid: true };
      
    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, errorMessage: 'Value must be a valid date' };
      }
      return validateDate(dateValue, rule);
      
    case 'time':
      // Simplified time validation
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(strValue)) {
        return { isValid: false, errorMessage: 'Value must be a valid time' };
      }
      return { isValid: true };
      
    case 'textLength':
      return validateTextLength(strValue.length, rule);
      
    case 'custom':
      // Custom formula would need formula evaluation
      return { isValid: true };
      
    default:
      return { isValid: true };
  }
};

const validateNumeric = (value: number, rule: ValidationRule): { isValid: boolean; errorMessage?: string } => {
  const v1 = parseFloat(String(rule.value1));
  const v2 = parseFloat(String(rule.value2));
  
  switch (rule.operator) {
    case 'between':
      if (value < v1 || value > v2) {
        return { isValid: false, errorMessage: `Value must be between ${v1} and ${v2}` };
      }
      break;
    case 'notBetween':
      if (value >= v1 && value <= v2) {
        return { isValid: false, errorMessage: `Value must not be between ${v1} and ${v2}` };
      }
      break;
    case 'equal':
      if (value !== v1) {
        return { isValid: false, errorMessage: `Value must equal ${v1}` };
      }
      break;
    case 'notEqual':
      if (value === v1) {
        return { isValid: false, errorMessage: `Value must not equal ${v1}` };
      }
      break;
    case 'greaterThan':
      if (value <= v1) {
        return { isValid: false, errorMessage: `Value must be greater than ${v1}` };
      }
      break;
    case 'lessThan':
      if (value >= v1) {
        return { isValid: false, errorMessage: `Value must be less than ${v1}` };
      }
      break;
    case 'greaterThanOrEqual':
      if (value < v1) {
        return { isValid: false, errorMessage: `Value must be greater than or equal to ${v1}` };
      }
      break;
    case 'lessThanOrEqual':
      if (value > v1) {
        return { isValid: false, errorMessage: `Value must be less than or equal to ${v1}` };
      }
      break;
  }
  
  return { isValid: true };
};

const validateDate = (value: Date, rule: ValidationRule): { isValid: boolean; errorMessage?: string } => {
  const d1 = rule.value1 ? new Date(rule.value1) : null;
  const d2 = rule.value2 ? new Date(rule.value2) : null;
  
  switch (rule.operator) {
    case 'between':
      if (d1 && d2 && (value < d1 || value > d2)) {
        return { isValid: false, errorMessage: `Date must be between ${d1.toLocaleDateString()} and ${d2.toLocaleDateString()}` };
      }
      break;
    case 'greaterThan':
      if (d1 && value <= d1) {
        return { isValid: false, errorMessage: `Date must be after ${d1.toLocaleDateString()}` };
      }
      break;
    case 'lessThan':
      if (d1 && value >= d1) {
        return { isValid: false, errorMessage: `Date must be before ${d1.toLocaleDateString()}` };
      }
      break;
  }
  
  return { isValid: true };
};

const validateTextLength = (length: number, rule: ValidationRule): { isValid: boolean; errorMessage?: string } => {
  const v1 = parseInt(String(rule.value1));
  const v2 = parseInt(String(rule.value2));
  
  switch (rule.operator) {
    case 'between':
      if (length < v1 || length > v2) {
        return { isValid: false, errorMessage: `Text length must be between ${v1} and ${v2}` };
      }
      break;
    case 'equal':
      if (length !== v1) {
        return { isValid: false, errorMessage: `Text length must be ${v1}` };
      }
      break;
    case 'greaterThan':
      if (length <= v1) {
        return { isValid: false, errorMessage: `Text length must be greater than ${v1}` };
      }
      break;
    case 'lessThan':
      if (length >= v1) {
        return { isValid: false, errorMessage: `Text length must be less than ${v1}` };
      }
      break;
  }
  
  return { isValid: true };
};

export const useValidationStore = create<ValidationStore>()(
  persist(
    (set, get) => ({
      rules: {},
      validationCache: {},
      showInvalidCircles: false,

      addRule: (sheetId, rule) => {
        const id = nanoid(8);
        const newRule: ValidationRule = {
          ...DEFAULT_VALIDATION_RULE,
          ...rule,
          id,
        } as ValidationRule;

        set(state => ({
          rules: {
            ...state.rules,
            [sheetId]: [...(state.rules[sheetId] || []), newRule],
          },
        }));

        return id;
      },

      updateRule: (sheetId, ruleId, updates) => {
        set(state => ({
          rules: {
            ...state.rules,
            [sheetId]: (state.rules[sheetId] || []).map(rule =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            ),
          },
        }));
        
        // Clear cache for affected range
        get().clearValidationCache(sheetId);
      },

      deleteRule: (sheetId, ruleId) => {
        set(state => ({
          rules: {
            ...state.rules,
            [sheetId]: (state.rules[sheetId] || []).filter(r => r.id !== ruleId),
          },
        }));
        
        get().clearValidationCache(sheetId);
      },

      getRulesForSheet: (sheetId) => {
        return get().rules[sheetId] || [];
      },

      getRuleForCell: (sheetId, row, col) => {
        const rules = get().rules[sheetId] || [];
        return rules.find(rule => isCellInRange(row, col, rule.range));
      },

      getRuleById: (sheetId, ruleId) => {
        return (get().rules[sheetId] || []).find(r => r.id === ruleId);
      },

      validateCell: (sheetId, row, col, value) => {
        const rule = get().getRuleForCell(sheetId, row, col);
        if (!rule) return null;
        
        const result = validateValue(value, rule);
        const cellKey = `${row}-${col}`;
        
        // Cache result
        set(state => ({
          validationCache: {
            ...state.validationCache,
            [sheetId]: {
              ...(state.validationCache[sheetId] || {}),
              [cellKey]: {
                ruleId: rule.id,
                isValid: result.isValid,
                errorMessage: result.errorMessage,
              },
            },
          },
        }));
        
        return {
          ruleId: rule.id,
          isValid: result.isValid,
          errorMessage: result.errorMessage,
        };
      },

      validateRange: (sheetId, range) => {
        // Would need to iterate through cells in range
        // This is a placeholder for batch validation
      },

      clearValidationCache: (sheetId) => {
        set(state => ({
          validationCache: {
            ...state.validationCache,
            [sheetId]: {},
          },
        }));
      },

      toggleInvalidCircles: () => {
        set(state => ({ showInvalidCircles: !state.showInvalidCircles }));
      },

      getInvalidCells: (sheetId) => {
        const cache = get().validationCache[sheetId] || {};
        const invalidCells: { row: number; col: number }[] = [];
        
        Object.entries(cache).forEach(([key, validation]) => {
          if (!validation.isValid) {
            const [row, col] = key.split('-').map(Number);
            invalidCells.push({ row, col });
          }
        });
        
        return invalidCells;
      },

      clearRulesForRange: (sheetId, range) => {
        const parsed = parseRange(range);
        if (!parsed) return;
        
        set(state => ({
          rules: {
            ...state.rules,
            [sheetId]: (state.rules[sheetId] || []).filter(rule => {
              const ruleRange = parseRange(rule.range);
              if (!ruleRange) return true;
              
              // Check if ranges overlap
              const overlaps = !(
                ruleRange.endCol < parsed.startCol ||
                ruleRange.startCol > parsed.endCol ||
                ruleRange.endRow < parsed.startRow ||
                ruleRange.startRow > parsed.endRow
              );
              
              return !overlaps;
            }),
          },
        }));
      },

      clearAllRules: (sheetId) => {
        set(state => ({
          rules: {
            ...state.rules,
            [sheetId]: [],
          },
          validationCache: {
            ...state.validationCache,
            [sheetId]: {},
          },
        }));
      },
    }),
    {
      name: 'excelai-validation',
      partialize: (state) => ({
        rules: state.rules,
      }),
    }
  )
);

export default useValidationStore;
```

---

## 📄 File 3: `src/components/DataValidation/DataValidationDialog.tsx`

```tsx
// ============================================================
// DATA VALIDATION DIALOG
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useValidationStore } from '../../stores/validationStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import {
  ValidationType,
  ValidationOperator,
  ValidationRule,
  VALIDATION_TYPE_LABELS,
  VALIDATION_OPERATOR_LABELS,
  DEFAULT_VALIDATION_RULE,
} from '../../types/validation';
import './DataValidation.css';

interface DataValidationDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
  editRuleId?: string;
}

type TabType = 'settings' | 'inputMessage' | 'errorAlert';

export const DataValidationDialog: React.FC<DataValidationDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
  editRuleId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  
  // Form state
  const [validationType, setValidationType] = useState<ValidationType>('any');
  const [operator, setOperator] = useState<ValidationOperator>('between');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [listSource, setListSource] = useState('');
  const [formula, setFormula] = useState('');
  const [ignoreBlank, setIgnoreBlank] = useState(true);
  const [showDropdown, setShowDropdown] = useState(true);
  
  // Input message
  const [showInputMessage, setShowInputMessage] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  
  // Error alert
  const [showErrorAlert, setShowErrorAlert] = useState(true);
  const [errorStyle, setErrorStyle] = useState<'stop' | 'warning' | 'information'>('stop');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { selection } = useWorkbookStore();
  const { addRule, updateRule, getRuleById, clearRulesForRange } = useValidationStore();

  // Load existing rule if editing
  useEffect(() => {
    if (editRuleId) {
      const rule = getRuleById(sheetId, editRuleId);
      if (rule) {
        setValidationType(rule.type);
        setOperator(rule.operator || 'between');
        setValue1(String(rule.value1 || ''));
        setValue2(String(rule.value2 || ''));
        setListSource(rule.listSource || '');
        setFormula(rule.formula || '');
        setIgnoreBlank(rule.ignoreBlank);
        setShowDropdown(rule.showDropdown);
        setShowInputMessage(rule.showInputMessage);
        setInputTitle(rule.inputTitle || '');
        setInputMessage(rule.inputMessage || '');
        setShowErrorAlert(rule.showErrorAlert);
        setErrorStyle(rule.errorStyle);
        setErrorTitle(rule.errorTitle || '');
        setErrorMessage(rule.errorMessage || '');
      }
    }
  }, [editRuleId, sheetId, getRuleById]);

  // Get range string from selection
  const getRangeString = (): string => {
    if (!selection) return '';
    const startCol = String.fromCharCode(65 + selection.start.col);
    const endCol = String.fromCharCode(65 + selection.end.col);
    return `${startCol}${selection.start.row + 1}:${endCol}${selection.end.row + 1}`;
  };

  // Check if operator needs two values
  const needsTwoValues = operator === 'between' || operator === 'notBetween';

  // Get operators based on validation type
  const getOperators = (): ValidationOperator[] => {
    if (validationType === 'list' || validationType === 'custom') {
      return [];
    }
    return [
      'between', 'notBetween', 'equal', 'notEqual',
      'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual',
    ];
  };

  const handleApply = () => {
    const range = getRangeString();
    if (!range) return;

    const rule: Partial<ValidationRule> = {
      type: validationType,
      operator,
      value1: value1 || undefined,
      value2: value2 || undefined,
      listSource: listSource || undefined,
      formula: formula || undefined,
      ignoreBlank,
      showDropdown,
      showInputMessage,
      inputTitle: inputTitle || undefined,
      inputMessage: inputMessage || undefined,
      showErrorAlert,
      errorStyle,
      errorTitle: errorTitle || undefined,
      errorMessage: errorMessage || undefined,
      range,
    };

    if (editRuleId) {
      updateRule(sheetId, editRuleId, rule);
    } else {
      // Clear any existing rules for this range first
      clearRulesForRange(sheetId, range);
      addRule(sheetId, rule);
    }

    onClose();
  };

  const handleClearAll = () => {
    const range = getRangeString();
    if (range) {
      clearRulesForRange(sheetId, range);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog validation-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Data Validation</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="validation-tabs">
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={activeTab === 'inputMessage' ? 'active' : ''}
            onClick={() => setActiveTab('inputMessage')}
          >
            Input Message
          </button>
          <button 
            className={activeTab === 'errorAlert' ? 'active' : ''}
            onClick={() => setActiveTab('errorAlert')}
          >
            Error Alert
          </button>
        </div>

        <div className="dialog-content">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Allow:</label>
                <select 
                  value={validationType}
                  onChange={(e) => setValidationType(e.target.value as ValidationType)}
                >
                  {Object.entries(VALIDATION_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {validationType !== 'any' && validationType !== 'list' && validationType !== 'custom' && (
                <div className="form-group">
                  <label>Data:</label>
                  <select 
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as ValidationOperator)}
                  >
                    {getOperators().map(op => (
                      <option key={op} value={op}>{VALIDATION_OPERATOR_LABELS[op]}</option>
                    ))}
                  </select>
                </div>
              )}

              {validationType === 'list' && (
                <div className="form-group">
                  <label>Source:</label>
                  <input
                    type="text"
                    value={listSource}
                    onChange={(e) => setListSource(e.target.value)}
                    placeholder="Option1, Option2, Option3"
                    className="text-input"
                  />
                  <span className="input-hint">Enter comma-separated values or a range reference</span>
                </div>
              )}

              {validationType === 'custom' && (
                <div className="form-group">
                  <label>Formula:</label>
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="=A1>0"
                    className="text-input formula-input"
                  />
                </div>
              )}

              {validationType !== 'any' && validationType !== 'list' && validationType !== 'custom' && (
                <>
                  <div className="form-group">
                    <label>{needsTwoValues ? 'Minimum:' : 'Value:'}</label>
                    <input
                      type={validationType === 'date' ? 'date' : validationType === 'time' ? 'time' : 'text'}
                      value={value1}
                      onChange={(e) => setValue1(e.target.value)}
                      className="text-input"
                    />
                  </div>

                  {needsTwoValues && (
                    <div className="form-group">
                      <label>Maximum:</label>
                      <input
                        type={validationType === 'date' ? 'date' : validationType === 'time' ? 'time' : 'text'}
                        value={value2}
                        onChange={(e) => setValue2(e.target.value)}
                        className="text-input"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={ignoreBlank}
                    onChange={(e) => setIgnoreBlank(e.target.checked)}
                  />
                  Ignore blank
                </label>
                {validationType === 'list' && (
                  <label>
                    <input 
                      type="checkbox" 
                      checked={showDropdown}
                      onChange={(e) => setShowDropdown(e.target.checked)}
                    />
                    In-cell dropdown
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Input Message Tab */}
          {activeTab === 'inputMessage' && (
            <div className="tab-content">
              <label className="checkbox-standalone">
                <input 
                  type="checkbox" 
                  checked={showInputMessage}
                  onChange={(e) => setShowInputMessage(e.target.checked)}
                />
                Show input message when cell is selected
              </label>

              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  className="text-input"
                  disabled={!showInputMessage}
                  maxLength={32}
                />
              </div>

              <div className="form-group">
                <label>Input message:</label>
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="text-area"
                  disabled={!showInputMessage}
                  maxLength={255}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Error Alert Tab */}
          {activeTab === 'errorAlert' && (
            <div className="tab-content">
              <label className="checkbox-standalone">
                <input 
                  type="checkbox" 
                  checked={showErrorAlert}
                  onChange={(e) => setShowErrorAlert(e.target.checked)}
                />
                Show error alert after invalid data is entered
              </label>

              <div className="form-group">
                <label>Style:</label>
                <div className="style-options">
                  <button
                    className={`style-btn ${errorStyle === 'stop' ? 'active' : ''}`}
                    onClick={() => setErrorStyle('stop')}
                    disabled={!showErrorAlert}
                  >
                    <AlertCircle size={20} className="error-icon" />
                    <span>Stop</span>
                  </button>
                  <button
                    className={`style-btn ${errorStyle === 'warning' ? 'active' : ''}`}
                    onClick={() => setErrorStyle('warning')}
                    disabled={!showErrorAlert}
                  >
                    <AlertTriangle size={20} className="warning-icon" />
                    <span>Warning</span>
                  </button>
                  <button
                    className={`style-btn ${errorStyle === 'information' ? 'active' : ''}`}
                    onClick={() => setErrorStyle('information')}
                    disabled={!showErrorAlert}
                  >
                    <Info size={20} className="info-icon" />
                    <span>Information</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={errorTitle}
                  onChange={(e) => setErrorTitle(e.target.value)}
                  className="text-input"
                  disabled={!showErrorAlert}
                  maxLength={32}
                />
              </div>

              <div className="form-group">
                <label>Error message:</label>
                <textarea
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  className="text-area"
                  disabled={!showErrorAlert}
                  maxLength={255}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={handleClearAll}>
            Clear All
          </button>
          <div className="footer-right">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleApply}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataValidationDialog;
```

---

## 📄 File 4: `src/components/DataValidation/ValidationDropdown.tsx`

```tsx
// ============================================================
// VALIDATION DROPDOWN — In-cell dropdown for list validation
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useValidationStore } from '../../stores/validationStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import './DataValidation.css';

interface ValidationDropdownProps {
  sheetId: string;
  row: number;
  col: number;
  value: string;
  onChange: (value: string) => void;
  cellRect: DOMRect;
}

export const ValidationDropdown: React.FC<ValidationDropdownProps> = ({
  sheetId,
  row,
  col,
  value,
  onChange,
  cellRect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getRuleForCell } = useValidationStore();
  const rule = getRuleForCell(sheetId, row, col);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  // Only show for list validation with dropdown enabled
  if (!rule || rule.type !== 'list' || !rule.showDropdown) {
    return null;
  }

  const items = rule.listItems || rule.listSource?.split(',').map(s => s.trim()) || [];

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div className="validation-dropdown-wrapper" ref={dropdownRef}>
      <button 
        className="validation-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          right: 2,
          top: 2,
          height: cellRect.height - 4,
        }}
      >
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div 
          className="validation-dropdown-menu"
          style={{
            top: cellRect.height,
            minWidth: cellRect.width,
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              className={`dropdown-item ${item === value ? 'active' : ''}`}
              onClick={() => handleSelect(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidationDropdown;
```

---

## 📄 File 5: `src/components/DataValidation/ValidationIndicator.tsx`

```tsx
// ============================================================
// VALIDATION INDICATOR — Shows validation errors on cells
// ============================================================

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useValidationStore } from '../../stores/validationStore';
import './DataValidation.css';

interface ValidationIndicatorProps {
  sheetId: string;
  row: number;
  col: number;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  sheetId,
  row,
  col,
}) => {
  const { validationCache, showInvalidCircles } = useValidationStore();
  
  const cellKey = `${row}-${col}`;
  const validation = validationCache[sheetId]?.[cellKey];

  // Show circle for invalid cells if enabled
  if (showInvalidCircles && validation && !validation.isValid) {
    return (
      <div className="validation-circle" title={validation.errorMessage}>
        <svg viewBox="0 0 100 100">
          <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="45"
            fill="none"
            stroke="#dc2626"
            strokeWidth="4"
          />
        </svg>
      </div>
    );
  }

  // Show small error indicator in corner
  if (validation && !validation.isValid) {
    return (
      <div className="validation-error-indicator" title={validation.errorMessage}>
        <div className="error-triangle" />
      </div>
    );
  }

  return null;
};

export default ValidationIndicator;
```

---

## 📄 File 6: `src/components/DataValidation/DataValidation.css`

```css
/* ============================================================
   DATA VALIDATION STYLES
   ============================================================ */

/* Validation Dialog */
.validation-dialog {
  width: 420px;
}

.validation-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.validation-tabs button {
  flex: 1;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.validation-tabs button:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.03));
}

.validation-tabs button.active {
  color: var(--accent-color, #217346);
  border-bottom-color: var(--accent-color, #217346);
}

.tab-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group > label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 6px;
}

.form-group select,
.form-group .text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.form-group select:focus,
.form-group .text-input:focus {
  border-color: var(--accent-color, #217346);
  box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
}

.formula-input {
  font-family: monospace;
}

.text-area {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  outline: none;
}

.text-area:focus {
  border-color: var(--accent-color, #217346);
  box-shadow: 0 0 0 3px rgba(33, 115, 70, 0.1);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.checkbox-group label,
.checkbox-standalone {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-standalone {
  margin-bottom: 16px;
}

.checkbox-group input,
.checkbox-standalone input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color, #217346);
}

/* Error Style Options */
.style-options {
  display: flex;
  gap: 8px;
}

.style-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 2px solid var(--border-color, #ddd);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  transition: all 0.15s;
}

.style-btn:hover:not(:disabled) {
  border-color: var(--accent-color, #217346);
}

.style-btn.active {
  border-color: var(--accent-color, #217346);
  background: var(--accent-light, #e8f5e9);
}

.style-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.style-btn .error-icon { color: #dc2626; }
.style-btn .warning-icon { color: #f59e0b; }
.style-btn .info-icon { color: #3b82f6; }

.style-btn span {
  font-size: 12px;
  font-weight: 500;
}

/* Dialog Footer */
.validation-dialog .dialog-footer {
  display: flex;
  justify-content: space-between;
}

.footer-right {
  display: flex;
  gap: 8px;
}

/* In-Cell Dropdown */
.validation-dropdown-wrapper {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.validation-dropdown-btn {
  position: absolute;
  width: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 2px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.1s;
}

.validation-dropdown-btn:hover {
  background: var(--bg-hover, #e8e8e8);
}

.validation-dropdown-menu {
  position: absolute;
  right: 0;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.dropdown-item.active {
  background: var(--accent-light, #e8f5e9);
  color: var(--accent-color, #217346);
}

/* Validation Indicators */
.validation-error-indicator {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}

.error-triangle {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-top: 8px solid #dc2626;
}

.validation-circle {
  position: absolute;
  inset: -3px;
  pointer-events: none;
}

.validation-circle svg {
  width: 100%;
  height: 100%;
}

/* Input Message Tooltip */
.validation-input-message {
  position: absolute;
  z-index: 1000;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 250px;
}

.validation-input-message .title {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}

.validation-input-message .message {
  font-size: 12px;
  color: var(--text-secondary, #666);
}

/* Dark Mode */
[data-theme="dark"] .validation-dialog {
  background: var(--bg-primary-dark, #1e1e1e);
}

[data-theme="dark"] .form-group select,
[data-theme="dark"] .form-group .text-input,
[data-theme="dark"] .text-area {
  background: var(--bg-secondary-dark, #2a2a2a);
  border-color: var(--border-color-dark, #404040);
  color: var(--text-primary-dark, #fff);
}

[data-theme="dark"] .validation-dropdown-menu {
  background: var(--bg-primary-dark, #1e1e1e);
  border-color: var(--border-color-dark, #404040);
}

[data-theme="dark"] .validation-input-message {
  background: #422006;
  border-color: #92400e;
}
```

---

## 📄 File 7: `src/components/DataValidation/index.ts`

```typescript
export { DataValidationDialog } from './DataValidationDialog';
export { ValidationDropdown } from './ValidationDropdown';
export { ValidationIndicator } from './ValidationIndicator';
```

---

## 🔗 Integration

### Add to Data Tab/Menu

```tsx
// In Data toolbar or menu
<button onClick={() => setShowValidationDialog(true)}>
  Data Validation
</button>

<DataValidationDialog
  sheetId={activeSheetId}
  isOpen={showValidationDialog}
  onClose={() => setShowValidationDialog(false)}
/>
```

### Add Indicator to Cell Rendering

```tsx
// In Cell.tsx
import { ValidationIndicator, ValidationDropdown } from '../DataValidation';

// In cell render
<div className="cell">
  {/* Cell content */}
  <ValidationIndicator sheetId={sheetId} row={row} col={col} />
  <ValidationDropdown 
    sheetId={sheetId} 
    row={row} 
    col={col}
    value={value}
    onChange={handleChange}
    cellRect={cellRect}
  />
</div>
```

### Validate on Cell Edit

```tsx
// In cell edit handler
const handleCellChange = (row: number, col: number, value: any) => {
  setCellValue(sheetId, row, col, value);
  
  // Validate
  const result = validateCell(sheetId, row, col, value);
  if (result && !result.isValid && result.errorMessage) {
    // Show error alert based on rule settings
    showValidationError(result);
  }
};
```

---

## ✅ Implementation Checklist

- [ ] `src/types/validation.ts`
- [ ] `src/stores/validationStore.ts`
- [ ] `src/components/DataValidation/DataValidationDialog.tsx`
- [ ] `src/components/DataValidation/ValidationDropdown.tsx`
- [ ] `src/components/DataValidation/ValidationIndicator.tsx`
- [ ] `src/components/DataValidation/DataValidation.css`
- [ ] `src/components/DataValidation/index.ts`
- [ ] Integration with Data tab
- [ ] Integration with cell rendering
- [ ] Validation on cell edit

---

**Estimated Time:** 1.5 days  
**Score Impact:** +0.5%
