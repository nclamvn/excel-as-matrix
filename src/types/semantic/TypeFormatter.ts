// =============================================================================
// TYPE FORMATTER — Smart formatting based on type (Blueprint §3.5)
// =============================================================================

import type { SemanticType, FormatSpec, TypedValue } from './types';
import { BUILT_IN_TYPES } from './types';
import { findUnit } from '../units/UnitSystem';

// -----------------------------------------------------------------------------
// Currency Symbols
// -----------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  VND: '₫',
  KRW: '₩',
  INR: '₹',
  BRL: 'R$',
  AUD: 'A$',
  CAD: 'C$',
};

// -----------------------------------------------------------------------------
// Type Formatter Class
// -----------------------------------------------------------------------------

export class TypeFormatter {
  private locale: string;

  constructor(locale: string = 'en-US') {
    this.locale = locale;
  }

  /**
   * Format a value according to its type
   */
  format(value: unknown, type: SemanticType | string, overrides?: Partial<FormatSpec>): string {
    const semanticType = typeof type === 'string' ? BUILT_IN_TYPES[type] : type;
    if (!semanticType) {
      return String(value ?? '');
    }

    const format = { ...semanticType.defaultFormat, ...overrides };

    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      return '';
    }

    switch (format.type) {
      case 'number':
        return this.formatNumber(value, format);
      case 'percent':
        return this.formatPercent(value, format);
      case 'currency':
        return this.formatCurrency(value, format);
      case 'accounting':
        return this.formatAccounting(value, format);
      case 'date':
        return this.formatDate(value, format);
      case 'datetime':
        return this.formatDateTime(value, format);
      case 'time':
        return this.formatTime(value, format);
      case 'duration':
        return this.formatDuration(value, format);
      case 'boolean':
        return this.formatBoolean(value, format);
      case 'checkbox':
        return this.formatCheckbox(value);
      case 'email':
      case 'phone':
      case 'url':
      case 'text':
        return String(value);
      case 'unit':
        return this.formatUnit(value, format);
      case 'coordinates':
        return this.formatCoordinates(value);
      case 'country':
        return String(value);
      case 'code':
        return String(value);
      default:
        return String(value);
    }
  }

  /**
   * Format a number
   */
  private formatNumber(value: unknown, format: FormatSpec): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);

    const decimals = format.decimals ?? 2;
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: format.thousandsSeparator !== false,
    };

    let result = num.toLocaleString(format.locale || this.locale, options);

    if (format.prefix) result = format.prefix + result;
    if (format.suffix) result = result + format.suffix;

    return result;
  }

  /**
   * Format a percentage
   */
  private formatPercent(value: unknown, format: FormatSpec): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);

    const decimals = format.decimals ?? 1;
    return `${num.toFixed(decimals)}%`;
  }

  /**
   * Format currency
   */
  private formatCurrency(value: unknown, format: FormatSpec): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);

    const currency = format.currency || 'USD';
    const decimals = format.decimals ?? 2;

    try {
      return num.toLocaleString(format.locale || this.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      // Fallback for unsupported currencies
      const symbol = CURRENCY_SYMBOLS[currency] || currency;
      return `${symbol}${num.toFixed(decimals)}`;
    }
  }

  /**
   * Format accounting style (negative in parentheses)
   */
  private formatAccounting(value: unknown, format: FormatSpec): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);

    const currency = format.currency || 'USD';
    const decimals = format.decimals ?? 2;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const absNum = Math.abs(num);

    const formatted = absNum.toLocaleString(format.locale || this.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (num < 0) {
      return `(${symbol}${formatted})`;
    }
    return `${symbol}${formatted}`;
  }

  /**
   * Format date
   */
  private formatDate(value: unknown, format: FormatSpec): string {
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return String(value);
    }

    if (isNaN(date.getTime())) return String(value);

    // Use pattern if provided
    if (format.pattern) {
      return this.formatDatePattern(date, format.pattern);
    }

    return date.toLocaleDateString(format.locale || this.locale);
  }

  /**
   * Format datetime
   */
  private formatDateTime(value: unknown, format: FormatSpec): string {
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      return String(value);
    }

    if (isNaN(date.getTime())) return String(value);

    if (format.pattern) {
      return this.formatDatePattern(date, format.pattern);
    }

    return date.toLocaleString(format.locale || this.locale);
  }

  /**
   * Format time
   */
  private formatTime(value: unknown, format: FormatSpec): string {
    if (typeof value === 'string') {
      // Already a time string
      return value;
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else {
      return String(value);
    }

    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString(format.locale || this.locale);
  }

  /**
   * Format duration (seconds to human-readable)
   */
  private formatDuration(value: unknown, _format: FormatSpec): string {
    const seconds = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(seconds)) return String(value);

    if (seconds < 60) {
      return `${seconds.toFixed(0)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.round((seconds % 86400) / 3600);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
  }

  /**
   * Format boolean
   */
  private formatBoolean(value: unknown, format: FormatSpec): string {
    const trueLabel = format.trueLabel || 'Yes';
    const falseLabel = format.falseLabel || 'No';

    if (typeof value === 'boolean') {
      return value ? trueLabel : falseLabel;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(lower)) return trueLabel;
      if (['false', 'no', 'n', '0'].includes(lower)) return falseLabel;
    }

    if (typeof value === 'number') {
      return value !== 0 ? trueLabel : falseLabel;
    }

    return String(value);
  }

  /**
   * Format checkbox
   */
  private formatCheckbox(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? '☑' : '☐';
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['true', 'yes', 'y', '1'].includes(lower)) return '☑';
      if (['false', 'no', 'n', '0'].includes(lower)) return '☐';
    }

    return value ? '☑' : '☐';
  }

  /**
   * Format value with unit
   */
  private formatUnit(value: unknown, format: FormatSpec): string {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return String(value);

    const decimals = format.decimals ?? 2;
    const unit = format.unit ? findUnit(format.unit) : null;
    const symbol = unit?.symbol || format.unit || '';

    return `${num.toFixed(decimals)} ${symbol}`.trim();
  }

  /**
   * Format coordinates
   */
  private formatCoordinates(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.lat === 'number' && typeof obj.lng === 'number') {
        return `${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
      }
    }

    return String(value);
  }

  /**
   * Format date using pattern
   */
  private formatDatePattern(date: Date, pattern: string): string {
    const pad = (n: number): string => n.toString().padStart(2, '0');

    return pattern
      .replace('yyyy', date.getFullYear().toString())
      .replace('yy', date.getFullYear().toString().slice(-2))
      .replace('MM', pad(date.getMonth() + 1))
      .replace('M', (date.getMonth() + 1).toString())
      .replace('dd', pad(date.getDate()))
      .replace('d', date.getDate().toString())
      .replace('HH', pad(date.getHours()))
      .replace('H', date.getHours().toString())
      .replace('hh', pad(date.getHours() % 12 || 12))
      .replace('h', (date.getHours() % 12 || 12).toString())
      .replace('mm', pad(date.getMinutes()))
      .replace('m', date.getMinutes().toString())
      .replace('ss', pad(date.getSeconds()))
      .replace('s', date.getSeconds().toString())
      .replace('a', date.getHours() >= 12 ? 'PM' : 'AM');
  }

  /**
   * Create a typed value with formatting
   */
  createTypedValue(raw: unknown, type: SemanticType | string): TypedValue {
    const semanticType = typeof type === 'string' ? BUILT_IN_TYPES[type] : type;
    if (!semanticType) {
      return {
        raw,
        type: 'text',
        formatted: String(raw ?? ''),
        valid: true,
      };
    }

    return {
      raw,
      type: semanticType.id,
      unit: semanticType.defaultUnit,
      formatted: this.format(raw, semanticType),
      valid: true, // Validation should be done separately
    };
  }

  /**
   * Set locale for formatting
   */
  setLocale(locale: string): void {
    this.locale = locale;
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.locale;
  }
}

// Export singleton instance
export const typeFormatter = new TypeFormatter();
