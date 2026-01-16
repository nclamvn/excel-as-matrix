// =============================================================================
// VALIDATION ENGINE — Type-based validation (Blueprint §3.3)
// =============================================================================

import type { SemanticType, ValidatorSpec } from '../semantic/types';

// -----------------------------------------------------------------------------
// Validation Types
// -----------------------------------------------------------------------------

export interface ValidationError {
  type: string;
  message: string;
  severity: 'error' | 'warning';
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// -----------------------------------------------------------------------------
// Built-in Validators
// -----------------------------------------------------------------------------

type ValidatorFn = (value: unknown, spec: ValidatorSpec) => ValidationError | null;

const VALIDATORS: Record<string, ValidatorFn> = {
  // ═══════════════════════════════════════════════════════════════
  // Type Validators
  // ═══════════════════════════════════════════════════════════════
  isNumber: (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return { type: 'isNumber', message: 'Must be a number', severity: 'error' };
    }
    return null;
  },

  isInteger: (value) => {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return { type: 'isInteger', message: 'Must be an integer', severity: 'error' };
    }
    return null;
  },

  isString: (value) => {
    if (typeof value !== 'string') {
      return { type: 'isString', message: 'Must be a string', severity: 'error' };
    }
    return null;
  },

  isBoolean: (value) => {
    if (typeof value !== 'boolean') {
      // Also accept string representations
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(lower)) {
          return null;
        }
      }
      return { type: 'isBoolean', message: 'Must be a boolean', severity: 'error' };
    }
    return null;
  },

  isDate: (value) => {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return { type: 'isDate', message: 'Invalid date', severity: 'error' };
      }
      return null;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        return { type: 'isDate', message: 'Invalid date format', severity: 'error' };
      }
      return null;
    }
    return { type: 'isDate', message: 'Must be a date', severity: 'error' };
  },

  isTime: (value) => {
    if (typeof value !== 'string') {
      return { type: 'isTime', message: 'Must be a time string', severity: 'error' };
    }
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
      return { type: 'isTime', message: 'Invalid time format (HH:MM or HH:MM:SS)', severity: 'error' };
    }
    return null;
  },

  // ═══════════════════════════════════════════════════════════════
  // Range Validators
  // ═══════════════════════════════════════════════════════════════
  min: (value, spec) => {
    if (typeof value === 'number' && spec.value !== undefined && value < (spec.value as number)) {
      return {
        type: 'min',
        message: spec.message || `Must be at least ${spec.value}`,
        severity: 'error',
        value,
      };
    }
    return null;
  },

  max: (value, spec) => {
    if (typeof value === 'number' && spec.value !== undefined && value > (spec.value as number)) {
      return {
        type: 'max',
        message: spec.message || `Must be at most ${spec.value}`,
        severity: 'error',
        value,
      };
    }
    return null;
  },

  range: (value, spec) => {
    if (typeof value === 'number') {
      if (spec.min !== undefined && value < spec.min) {
        return {
          type: 'range',
          message: spec.message || `Must be at least ${spec.min}`,
          severity: 'error',
          value,
        };
      }
      if (spec.max !== undefined && value > spec.max) {
        return {
          type: 'range',
          message: spec.message || `Must be at most ${spec.max}`,
          severity: 'error',
          value,
        };
      }
    }
    return null;
  },

  // ═══════════════════════════════════════════════════════════════
  // String Validators
  // ═══════════════════════════════════════════════════════════════
  minLength: (value, spec) => {
    if (typeof value === 'string' && spec.value !== undefined && value.length < (spec.value as number)) {
      return {
        type: 'minLength',
        message: spec.message || `Must be at least ${spec.value} characters`,
        severity: 'error',
      };
    }
    return null;
  },

  maxLength: (value, spec) => {
    if (typeof value === 'string' && spec.value !== undefined && value.length > (spec.value as number)) {
      return {
        type: 'maxLength',
        message: spec.message || `Must be at most ${spec.value} characters`,
        severity: 'error',
      };
    }
    return null;
  },

  pattern: (value, spec) => {
    if (typeof value === 'string' && spec.pattern) {
      const regex = new RegExp(spec.pattern);
      if (!regex.test(value)) {
        return {
          type: 'pattern',
          message: spec.message || 'Invalid format',
          severity: 'error',
        };
      }
    }
    return null;
  },

  // ═══════════════════════════════════════════════════════════════
  // Format Validators
  // ═══════════════════════════════════════════════════════════════
  email: (value) => {
    if (typeof value !== 'string') {
      return { type: 'email', message: 'Must be a string', severity: 'error' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { type: 'email', message: 'Invalid email address', severity: 'error' };
    }
    return null;
  },

  phone: (value) => {
    if (typeof value !== 'string') {
      return { type: 'phone', message: 'Must be a string', severity: 'error' };
    }
    // Basic phone validation - accepts various formats
    if (!/^\+?[\d\s\-()]{7,}$/.test(value)) {
      return { type: 'phone', message: 'Invalid phone number', severity: 'error' };
    }
    return null;
  },

  url: (value) => {
    if (typeof value !== 'string') {
      return { type: 'url', message: 'Must be a string', severity: 'error' };
    }
    try {
      new URL(value);
      return null;
    } catch {
      return { type: 'url', message: 'Invalid URL', severity: 'error' };
    }
  },

  uuid: (value) => {
    if (typeof value !== 'string') {
      return { type: 'uuid', message: 'Must be a string', severity: 'error' };
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return { type: 'uuid', message: 'Invalid UUID format', severity: 'error' };
    }
    return null;
  },

  // ═══════════════════════════════════════════════════════════════
  // Special Validators
  // ═══════════════════════════════════════════════════════════════
  coordinates: (value) => {
    if (typeof value === 'string') {
      const parts = value.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length !== 2 || parts.some(isNaN)) {
        return { type: 'coordinates', message: 'Invalid coordinates', severity: 'error' };
      }
      const [lat, lng] = parts;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return { type: 'coordinates', message: 'Coordinates out of range', severity: 'error' };
      }
      return null;
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.lat !== 'number' || typeof obj.lng !== 'number') {
        return { type: 'coordinates', message: 'Invalid coordinate object', severity: 'error' };
      }
      if (obj.lat < -90 || obj.lat > 90 || obj.lng < -180 || obj.lng > 180) {
        return { type: 'coordinates', message: 'Coordinates out of range', severity: 'error' };
      }
      return null;
    }
    return { type: 'coordinates', message: 'Invalid coordinates format', severity: 'error' };
  },

  country: (value) => {
    if (typeof value !== 'string') {
      return { type: 'country', message: 'Must be a string', severity: 'error' };
    }
    // Basic check - 2-3 letter country code or longer name
    if (value.length < 2) {
      return { type: 'country', message: 'Invalid country', severity: 'error' };
    }
    return null;
  },

  enum: (value, spec) => {
    if (spec.values && !spec.values.includes(value)) {
      return {
        type: 'enum',
        message: spec.message || `Must be one of: ${spec.values.join(', ')}`,
        severity: 'error',
      };
    }
    return null;
  },
};

// -----------------------------------------------------------------------------
// Validation Engine Class
// -----------------------------------------------------------------------------

export class ValidationEngine {
  /**
   * Validate a value against a semantic type
   */
  validate(value: unknown, type: SemanticType): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check required (nullable = false means required)
    if ((value === null || value === undefined || value === '') && !type.nullable) {
      errors.push({
        type: 'required',
        message: 'Value is required',
        severity: 'error',
      });
      return { valid: false, errors, warnings };
    }

    // Skip validation for empty nullable values
    if (value === null || value === undefined || value === '') {
      return { valid: true, errors: [], warnings: [] };
    }

    // Run each validator
    for (const spec of type.validators) {
      const validator = VALIDATORS[spec.type];
      if (validator) {
        const error = validator(value, spec);
        if (error) {
          if (error.severity === 'warning') {
            warnings.push(error);
          } else {
            errors.push(error);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate with custom validators
   */
  validateCustom(value: unknown, validators: ValidatorSpec[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const spec of validators) {
      const validator = VALIDATORS[spec.type];
      if (validator) {
        const error = validator(value, spec);
        if (error) {
          if (error.severity === 'warning') {
            warnings.push(error);
          } else {
            errors.push(error);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a value is valid for a type (quick boolean check)
   */
  isValid(value: unknown, type: SemanticType): boolean {
    return this.validate(value, type).valid;
  }

  /**
   * Get validation message for a value
   */
  getMessage(value: unknown, type: SemanticType): string | null {
    const result = this.validate(value, type);
    if (result.valid) return null;
    return result.errors[0]?.message || 'Invalid value';
  }

  /**
   * Register a custom validator
   */
  registerValidator(name: string, fn: ValidatorFn): void {
    VALIDATORS[name] = fn;
  }

  /**
   * Check if a validator exists
   */
  hasValidator(name: string): boolean {
    return name in VALIDATORS;
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();
