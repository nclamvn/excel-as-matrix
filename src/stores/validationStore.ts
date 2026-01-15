import { create } from 'zustand';
import {
  ValidationRule,
  InputMessage,
  ComparisonOperator,
} from '../types/cell';

// Validation result
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface ValidationState {
  // Rule registry
  rules: Record<string, ValidationRule>;
  // Cell to rule mapping
  cellRules: Record<string, string>; // "sheetId:row:col" -> ruleId
  // Range rules: [sheetId, startRow, startCol, endRow, endCol, ruleId]
  rangeRules: Array<[string, number, number, number, number, string]>;

  // Actions
  addRule: (rule: ValidationRule) => void;
  updateRule: (ruleId: string, updates: Partial<ValidationRule>) => void;
  removeRule: (ruleId: string) => void;
  applyToCell: (ruleId: string, sheetId: string, row: number, col: number) => void;
  applyToRange: (ruleId: string, sheetId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  clearCellValidation: (sheetId: string, row: number, col: number) => void;

  // Validation
  validateCell: (sheetId: string, row: number, col: number, value: string) => ValidationResult;
  getRuleForCell: (sheetId: string, row: number, col: number) => ValidationRule | undefined;

  // Getters
  getRule: (ruleId: string) => ValidationRule | undefined;
  listRules: () => ValidationRule[];
  getInputMessage: (sheetId: string, row: number, col: number) => InputMessage | undefined;
  getDropdownOptions: (sheetId: string, row: number, col: number) => string[] | undefined;

  // Reset
  reset: () => void;
}

const initialState = {
  rules: {} as Record<string, ValidationRule>,
  cellRules: {} as Record<string, string>,
  rangeRules: [] as Array<[string, number, number, number, number, string]>,
};

// Helper function to create cell key with sheet
const cellKey = (sheetId: string, row: number, col: number): string => `${sheetId}:${row}:${col}`;

// Helper to check comparison
const checkComparison = (value: number, operator: ComparisonOperator, v1: number, v2?: number): boolean => {
  switch (operator) {
    case 'between':
      return v2 !== undefined && value >= v1 && value <= v2;
    case 'notBetween':
      return v2 !== undefined && (value < v1 || value > v2);
    case 'equal':
      return value === v1;
    case 'notEqual':
      return value !== v1;
    case 'greaterThan':
      return value > v1;
    case 'lessThan':
      return value < v1;
    case 'greaterThanOrEqual':
      return value >= v1;
    case 'lessThanOrEqual':
      return value <= v1;
    default:
      return false;
  }
};

// Validate value against a rule
const validateValue = (value: string, rule: ValidationRule): ValidationResult => {
  // Handle blank values
  if (value === '' || value === null || value === undefined) {
    if (rule.allowBlank) {
      return { isValid: true };
    }
    return { isValid: false, message: 'This field cannot be blank' };
  }

  const { validationType } = rule;

  switch (validationType.type) {
    case 'any':
      return { isValid: true };

    case 'wholeNumber': {
      const num = parseInt(value, 10);
      if (isNaN(num) || num.toString() !== value) {
        return { isValid: false, message: 'Value must be a whole number' };
      }
      if (!checkComparison(num, validationType.operator, validationType.value1, validationType.value2)) {
        return {
          isValid: false,
          message: `Value must be ${validationType.operator} ${validationType.value1}${validationType.value2 !== undefined ? ` and ${validationType.value2}` : ''}`,
        };
      }
      return { isValid: true };
    }

    case 'decimal': {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return { isValid: false, message: 'Value must be a number' };
      }
      if (!checkComparison(num, validationType.operator, validationType.value1, validationType.value2)) {
        return {
          isValid: false,
          message: `Value must be ${validationType.operator} ${validationType.value1}${validationType.value2 !== undefined ? ` and ${validationType.value2}` : ''}`,
        };
      }
      return { isValid: true };
    }

    case 'list': {
      if (validationType.source.type === 'values') {
        if (!validationType.source.values.includes(value)) {
          return {
            isValid: false,
            message: `Value must be one of: ${validationType.source.values.join(', ')}`,
          };
        }
      }
      // Range and namedRange sources need to be resolved by the calling code
      return { isValid: true };
    }

    case 'textLength': {
      const len = value.length;
      if (!checkComparison(len, validationType.operator, validationType.value1, validationType.value2)) {
        return {
          isValid: false,
          message: `Text length must be ${validationType.operator} ${validationType.value1}${validationType.value2 !== undefined ? ` and ${validationType.value2}` : ''}`,
        };
      }
      return { isValid: true };
    }

    case 'date': {
      // Basic date validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return { isValid: false, message: 'Value must be a valid date (YYYY-MM-DD)' };
      }
      return { isValid: true };
    }

    case 'custom':
      // Custom formulas need to be evaluated by the calc engine
      return { isValid: true };

    default:
      return { isValid: true };
  }
};

export const useValidationStore = create<ValidationState>()((set, get) => ({
  ...initialState,

  addRule: (rule) => {
    set((state) => ({
      rules: { ...state.rules, [rule.id]: rule },
    }));
  },

  updateRule: (ruleId, updates) => {
    set((state) => {
      const existing = state.rules[ruleId];
      if (!existing) return state;

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return { rules: { ...state.rules, [ruleId]: updated } };
    });
  },

  removeRule: (ruleId) => {
    set((state) => {
      const { [ruleId]: _, ...rules } = state.rules;

      // Remove cell rule associations
      const cellRules = { ...state.cellRules };
      for (const key of Object.keys(cellRules)) {
        if (cellRules[key] === ruleId) {
          delete cellRules[key];
        }
      }

      // Remove range rule associations
      const rangeRules = state.rangeRules.filter(([, , , , , rid]) => rid !== ruleId);

      return { rules, cellRules, rangeRules };
    });
  },

  applyToCell: (ruleId, sheetId, row, col) => {
    set((state) => ({
      cellRules: {
        ...state.cellRules,
        [cellKey(sheetId, row, col)]: ruleId,
      },
    }));
  },

  applyToRange: (ruleId, sheetId, startRow, startCol, endRow, endCol) => {
    set((state) => ({
      rangeRules: [...state.rangeRules, [sheetId, startRow, startCol, endRow, endCol, ruleId]],
    }));
  },

  clearCellValidation: (sheetId, row, col) => {
    set((state) => {
      const key = cellKey(sheetId, row, col);
      const { [key]: _, ...cellRules } = state.cellRules;
      return { cellRules };
    });
  },

  validateCell: (sheetId, row, col, value) => {
    const rule = get().getRuleForCell(sheetId, row, col);
    if (!rule) {
      return { isValid: true };
    }
    return validateValue(value, rule);
  },

  getRuleForCell: (sheetId, row, col) => {
    const state = get();

    // Check direct cell assignment first
    const key = cellKey(sheetId, row, col);
    if (state.cellRules[key]) {
      return state.rules[state.cellRules[key]];
    }

    // Check range rules
    for (const [rSheetId, startRow, startCol, endRow, endCol, ruleId] of state.rangeRules) {
      if (
        rSheetId === sheetId &&
        row >= startRow &&
        row <= endRow &&
        col >= startCol &&
        col <= endCol
      ) {
        return state.rules[ruleId];
      }
    }

    return undefined;
  },

  getRule: (ruleId) => {
    return get().rules[ruleId];
  },

  listRules: () => {
    return Object.values(get().rules);
  },

  getInputMessage: (sheetId, row, col) => {
    const rule = get().getRuleForCell(sheetId, row, col);
    return rule?.inputMessage?.show ? rule.inputMessage : undefined;
  },

  getDropdownOptions: (sheetId, row, col) => {
    const rule = get().getRuleForCell(sheetId, row, col);
    if (!rule) return undefined;

    const { validationType } = rule;
    if (validationType.type === 'list' && validationType.dropdown) {
      if (validationType.source.type === 'values') {
        return validationType.source.values;
      }
    }
    return undefined;
  },

  reset: () => {
    set(initialState);
  },
}));

// Helper to create common validation rules
export const createListValidation = (
  id: string,
  values: string[],
  options?: Partial<ValidationRule>
): ValidationRule => ({
  id,
  validationType: { type: 'list', source: { type: 'values', values }, dropdown: true },
  allowBlank: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...options,
});

export const createNumberRangeValidation = (
  id: string,
  min: number,
  max: number,
  options?: Partial<ValidationRule>
): ValidationRule => ({
  id,
  validationType: { type: 'decimal', operator: 'between', value1: min, value2: max },
  allowBlank: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...options,
});

export const createTextLengthValidation = (
  id: string,
  maxLength: number,
  options?: Partial<ValidationRule>
): ValidationRule => ({
  id,
  validationType: { type: 'textLength', operator: 'lessThanOrEqual', value1: maxLength },
  allowBlank: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...options,
});
