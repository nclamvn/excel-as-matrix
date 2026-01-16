// =============================================================================
// DATA VALIDATOR — Validate data against rules
// =============================================================================

import type {
  CleanerSheetData,
  ValidationRule,
  ValidationResult,
  ValidationViolation,
  ValidationType,
  ValidationParams,
} from './types';

/**
 * Validates data against custom rules
 */
export class DataValidator {
  private rules: ValidationRule[] = [];

  /**
   * Add a validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Add multiple rules
   */
  addRules(rules: ValidationRule[]): void {
    this.rules.push(...rules);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Validate data against all rules
   */
  validate(data: CleanerSheetData): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      const result = this.validateRule(data, rule);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate a single rule
   */
  private validateRule(data: CleanerSheetData, rule: ValidationRule): ValidationResult {
    const violations: ValidationViolation[] = [];
    const columns = rule.column === 'all'
      ? Array.from({ length: data.colCount }, (_, i) => i)
      : [rule.column];

    for (const col of columns) {
      for (let row = 0; row < data.rowCount; row++) {
        const cell = data.cells[row]?.[col];
        const value = cell?.value;

        const isValid = this.checkValue(value, rule.type, rule.params, data, col, row);

        if (!isValid) {
          violations.push({
            row,
            col,
            ref: `${this.colToLetter(col)}${row + 1}`,
            value,
            message: this.formatErrorMessage(rule, value),
          });
        }
      }
    }

    return {
      rule,
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Check a value against validation type
   */
  private checkValue(
    value: unknown,
    type: ValidationType,
    params: ValidationParams,
    data: CleanerSheetData,
    col: number,
    row: number
  ): boolean {
    switch (type) {
      case 'required':
        return this.checkRequired(value);
      case 'unique':
        return this.checkUnique(value, data, col, row);
      case 'range':
        return this.checkRange(value, params);
      case 'regex':
        return this.checkRegex(value, params);
      case 'enum':
        return this.checkEnum(value, params);
      case 'type':
        return this.checkType(value, params);
      case 'custom':
        return this.checkCustom(value, params);
      default:
        return true;
    }
  }

  /**
   * Check required value
   */
  private checkRequired(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }

  /**
   * Check unique value
   */
  private checkUnique(
    value: unknown,
    data: CleanerSheetData,
    col: number,
    currentRow: number
  ): boolean {
    if (value === null || value === undefined || value === '') return true;

    const strValue = String(value).toLowerCase().trim();

    for (let row = 0; row < data.rowCount; row++) {
      if (row === currentRow) continue;

      const otherCell = data.cells[row]?.[col];
      if (!otherCell || otherCell.isEmpty) continue;

      const otherValue = String(otherCell.value).toLowerCase().trim();
      if (strValue === otherValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check range value
   */
  private checkRange(value: unknown, params: ValidationParams): boolean {
    if (value === null || value === undefined || value === '') return true;

    const num = parseFloat(String(value).replace(/[$,]/g, ''));
    if (isNaN(num)) return false;

    if (params.min !== undefined && num < params.min) return false;
    if (params.max !== undefined && num > params.max) return false;

    return true;
  }

  /**
   * Check regex pattern
   */
  private checkRegex(value: unknown, params: ValidationParams): boolean {
    if (value === null || value === undefined || value === '') return true;
    if (!params.pattern) return true;

    const regex = new RegExp(params.pattern);
    return regex.test(String(value));
  }

  /**
   * Check enum (allowed values)
   */
  private checkEnum(value: unknown, params: ValidationParams): boolean {
    if (value === null || value === undefined || value === '') return true;
    if (!params.allowedValues || params.allowedValues.length === 0) return true;

    const strValue = String(value).toLowerCase().trim();
    return params.allowedValues.some(v =>
      String(v).toLowerCase().trim() === strValue
    );
  }

  /**
   * Check expected type
   */
  private checkType(value: unknown, params: ValidationParams): boolean {
    if (value === null || value === undefined || value === '') return true;

    const expectedType = params.expectedType;
    if (!expectedType) return true;

    switch (expectedType) {
      case 'number':
        return !isNaN(parseFloat(String(value).replace(/[$,]/g, '')));
      case 'integer':
        return Number.isInteger(parseFloat(String(value)));
      case 'date':
        return !isNaN(Date.parse(String(value)));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'url':
        return /^https?:\/\//.test(String(value));
      case 'phone':
        return /^[\d\s\-\(\)\+]+$/.test(String(value));
      case 'boolean':
        return ['true', 'false', '1', '0', 'yes', 'no'].includes(
          String(value).toLowerCase()
        );
      default:
        return true;
    }
  }

  /**
   * Check custom validator
   */
  private checkCustom(value: unknown, params: ValidationParams): boolean {
    if (!params.customValidator) return true;
    return params.customValidator(value);
  }

  /**
   * Format error message
   */
  private formatErrorMessage(rule: ValidationRule, value: unknown): string {
    if (rule.errorMessage) {
      return rule.errorMessage.replace('{value}', String(value));
    }

    switch (rule.type) {
      case 'required':
        return 'Value is required';
      case 'unique':
        return `Duplicate value: ${value}`;
      case 'range':
        return `Value ${value} is out of range`;
      case 'regex':
        return `Value ${value} does not match required pattern`;
      case 'enum':
        return `Value ${value} is not in allowed values`;
      case 'type':
        return `Value ${value} is not of expected type`;
      default:
        return `Validation failed for value: ${value}`;
    }
  }

  /**
   * Create common validation rules
   */
  static createCommonRules(): ValidationRule[] {
    return [
      {
        id: 'email-format',
        name: 'Email Format',
        column: 'all',
        type: 'regex',
        params: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
        errorMessage: 'Invalid email format',
      },
      {
        id: 'positive-numbers',
        name: 'Positive Numbers',
        column: 'all',
        type: 'range',
        params: { min: 0 },
        errorMessage: 'Value must be positive',
      },
    ];
  }

  /**
   * Get summary of validation results
   */
  getSummary(results: ValidationResult[]): {
    totalRules: number;
    passed: number;
    failed: number;
    totalViolations: number;
  } {
    const passed = results.filter(r => r.passed).length;
    const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);

    return {
      totalRules: results.length,
      passed,
      failed: results.length - passed,
      totalViolations,
    };
  }

  /**
   * Convert column index to letter
   */
  private colToLetter(col: number): string {
    let letter = '';
    let temp = col;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  }
}
