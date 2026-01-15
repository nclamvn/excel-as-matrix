import { CellFormat } from '../types/cell';

/**
 * Convert CellFormat to inline CSS styles
 */
export function formatToStyle(format?: CellFormat): React.CSSProperties {
  if (!format) return {};

  const style: React.CSSProperties = {};

  // Font styling
  if (format.bold) {
    style.fontWeight = 'bold';
  }
  if (format.italic) {
    style.fontStyle = 'italic';
  }
  if (format.underline) {
    style.textDecoration = 'underline';
  }
  if (format.fontFamily) {
    style.fontFamily = format.fontFamily;
  }
  if (format.fontSize) {
    style.fontSize = `${format.fontSize}px`;
  }

  // Colors
  if (format.textColor) {
    style.color = format.textColor;
  }
  if (format.backgroundColor) {
    style.backgroundColor = format.backgroundColor;
  }

  // Alignment
  if (format.align) {
    switch (format.align) {
      case 'left':
        style.justifyContent = 'flex-start';
        style.textAlign = 'left';
        break;
      case 'center':
        style.justifyContent = 'center';
        style.textAlign = 'center';
        break;
      case 'right':
        style.justifyContent = 'flex-end';
        style.textAlign = 'right';
        break;
    }
  }

  return style;
}

/**
 * Format a number value using a number format string
 */
export function formatNumber(value: number, format?: string): string {
  if (!format || format === 'general') {
    return value.toString();
  }

  try {
    // Currency format ($#,##0.00)
    if (format.includes('$')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    // Percentage format (0.00%)
    if (format.includes('%')) {
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    // Comma format (#,##0.00)
    if (format.includes(',')) {
      const decimals = (format.match(/0+$/) || [''])[0].length || 0;
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    }

    // Plain number format with decimals
    const decimalMatch = format.match(/\.0+/);
    if (decimalMatch) {
      const decimals = decimalMatch[0].length - 1;
      return value.toFixed(decimals);
    }

    return value.toString();
  } catch {
    return value.toString();
  }
}

/**
 * Auto-format a display value based on its type and format
 */
export function formatDisplayValue(
  value: string | number | boolean | null,
  format?: CellFormat
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number' && format?.numberFormat) {
    return formatNumber(value, format.numberFormat);
  }

  return String(value);
}

/**
 * Check if a value looks like a number
 */
export function isNumericValue(value: unknown): value is number {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed);
  }
  return false;
}
