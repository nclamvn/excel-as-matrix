import { describe, it, expect } from 'vitest';
import { formatToStyle, formatNumber, formatDisplayValue, isNumericValue } from '../cellFormatting';

describe('cellFormatting', () => {
  describe('formatToStyle', () => {
    it('should return empty object for undefined format', () => {
      expect(formatToStyle(undefined)).toEqual({});
    });

    it('should apply bold style', () => {
      const style = formatToStyle({ bold: true });
      expect(style.fontWeight).toBe('bold');
    });

    it('should apply italic style', () => {
      const style = formatToStyle({ italic: true });
      expect(style.fontStyle).toBe('italic');
    });

    it('should apply underline style', () => {
      const style = formatToStyle({ underline: true });
      expect(style.textDecoration).toBe('underline');
    });

    it('should apply font family', () => {
      const style = formatToStyle({ fontFamily: 'Arial' });
      expect(style.fontFamily).toBe('Arial');
    });

    it('should apply font size', () => {
      const style = formatToStyle({ fontSize: 14 });
      expect(style.fontSize).toBe('14px');
    });

    it('should apply text color', () => {
      const style = formatToStyle({ textColor: '#ff0000' });
      expect(style.color).toBe('#ff0000');
    });

    it('should apply background color', () => {
      const style = formatToStyle({ backgroundColor: '#00ff00' });
      expect(style.backgroundColor).toBe('#00ff00');
    });

    it('should apply left alignment', () => {
      const style = formatToStyle({ align: 'left' });
      expect(style.textAlign).toBe('left');
      expect(style.justifyContent).toBe('flex-start');
    });

    it('should apply center alignment', () => {
      const style = formatToStyle({ align: 'center' });
      expect(style.textAlign).toBe('center');
      expect(style.justifyContent).toBe('center');
    });

    it('should apply right alignment', () => {
      const style = formatToStyle({ align: 'right' });
      expect(style.textAlign).toBe('right');
      expect(style.justifyContent).toBe('flex-end');
    });

    it('should apply multiple styles', () => {
      const style = formatToStyle({
        bold: true,
        italic: true,
        textColor: '#000000',
        align: 'center',
      });
      expect(style.fontWeight).toBe('bold');
      expect(style.fontStyle).toBe('italic');
      expect(style.color).toBe('#000000');
      expect(style.textAlign).toBe('center');
    });
  });

  describe('formatNumber', () => {
    it('should return string for no format', () => {
      expect(formatNumber(1234.56)).toBe('1234.56');
    });

    it('should return string for general format', () => {
      expect(formatNumber(1234.56, 'general')).toBe('1234.56');
    });

    it('should format currency', () => {
      const result = formatNumber(1234.56, '$#,##0.00');
      expect(result).toBe('$1,234.56');
    });

    it('should format percentage', () => {
      const result = formatNumber(0.1234, '0.00%');
      expect(result).toBe('12.34%');
    });

    it('should format with comma separator', () => {
      const result = formatNumber(1234567.89, '#,##0.00');
      expect(result).toBe('1,234,567.89');
    });

    it('should format with decimal places', () => {
      const result = formatNumber(1234.56789, '.00');
      expect(result).toBe('1234.57');
    });

    it('should handle zero', () => {
      expect(formatNumber(0, '$#,##0.00')).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      const result = formatNumber(-1234.56, '$#,##0.00');
      expect(result).toBe('-$1,234.56');
    });
  });

  describe('formatDisplayValue', () => {
    it('should return empty string for null', () => {
      expect(formatDisplayValue(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDisplayValue(undefined as any)).toBe('');
    });

    it('should format boolean TRUE', () => {
      expect(formatDisplayValue(true)).toBe('TRUE');
    });

    it('should format boolean FALSE', () => {
      expect(formatDisplayValue(false)).toBe('FALSE');
    });

    it('should format number with format', () => {
      const result = formatDisplayValue(1234.56, { numberFormat: '$#,##0.00' });
      expect(result).toBe('$1,234.56');
    });

    it('should return string as-is', () => {
      expect(formatDisplayValue('Hello')).toBe('Hello');
    });

    it('should convert number to string without format', () => {
      expect(formatDisplayValue(1234.56)).toBe('1234.56');
    });
  });

  describe('isNumericValue', () => {
    it('should return true for integer', () => {
      expect(isNumericValue(42)).toBe(true);
    });

    it('should return true for float', () => {
      expect(isNumericValue(3.14)).toBe(true);
    });

    it('should return true for negative number', () => {
      expect(isNumericValue(-100)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isNumericValue(0)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumericValue(NaN)).toBe(false);
    });

    it('should return true for numeric string', () => {
      expect(isNumericValue('42')).toBe(true);
    });

    it('should return true for float string', () => {
      expect(isNumericValue('3.14')).toBe(true);
    });

    it('should return false for non-numeric string', () => {
      expect(isNumericValue('hello')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNumericValue(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNumericValue(undefined)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isNumericValue({})).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isNumericValue(Infinity)).toBe(true); // Infinity is a valid number
    });
  });
});
