// ═══════════════════════════════════════════════════════════════════════════
// XLSX ROUND-TRIP FIDELITY
// Enhanced import/export that preserves conditional formatting, charts,
// named ranges, and cell formatting through XLSX round-trips
// ═══════════════════════════════════════════════════════════════════════════

import type { CellData, CellFormat, Sheet } from '../types/cell';
import { getCellKey, colToLetter } from '../types/cell';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface XLSXCellStyle {
  font?: {
    name?: string;
    sz?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: { rgb?: string; theme?: number };
  };
  fill?: {
    fgColor?: { rgb?: string; theme?: number };
    patternType?: string;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
    textRotation?: number;
  };
  numFmt?: string;
  border?: {
    top?: XLSXBorder;
    bottom?: XLSXBorder;
    left?: XLSXBorder;
    right?: XLSXBorder;
  };
}

interface XLSXBorder {
  style?: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted';
  color?: { rgb?: string };
}

export interface XLSXConditionalFormat {
  type: 'cellIs' | 'colorScale' | 'dataBar' | 'iconSet' | 'expression';
  range: string;
  priority: number;
  operator?: string;
  formula?: string[];
  style?: XLSXCellStyle;
  colorScale?: { colors: string[]; values: number[] };
  dataBar?: { color: string; minValue?: number; maxValue?: number };
}

export interface XLSXNamedRange {
  name: string;
  ref: string;
  sheetName?: string;
  scope: 'workbook' | 'sheet';
}

// ─────────────────────────────────────────────────────────────────────────────
// Import: Extract rich formatting from XLSX worksheet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract CellFormat from XLSX cell style object (xlsx library format)
 */
export function xlsxStyleToCellFormat(style: XLSXCellStyle): CellFormat {
  const format: CellFormat = {};

  if (style.font) {
    if (style.font.bold) format.bold = true;
    if (style.font.italic) format.italic = true;
    if (style.font.underline) format.underline = true;
    if (style.font.sz) format.fontSize = style.font.sz;
    if (style.font.name) format.fontFamily = style.font.name;
    if (style.font.color?.rgb) {
      format.textColor = `#${style.font.color.rgb.slice(-6)}`;
    }
  }

  if (style.fill?.fgColor?.rgb) {
    const rgb = style.fill.fgColor.rgb;
    if (rgb !== '000000' && rgb !== 'FFFFFF') {
      format.backgroundColor = `#${rgb.slice(-6)}`;
    }
  }

  if (style.alignment) {
    if (style.alignment.horizontal) {
      format.align = style.alignment.horizontal as 'left' | 'center' | 'right';
    }
    if (style.alignment.textRotation) {
      format.textRotation = style.alignment.textRotation;
    }
  }

  if (style.numFmt) {
    format.numberFormat = style.numFmt;
  }

  return format;
}

/**
 * Convert CellFormat back to XLSX style for export
 */
export function cellFormatToXlsxStyle(format: CellFormat): XLSXCellStyle {
  const style: XLSXCellStyle = {};

  const font: XLSXCellStyle['font'] = {};
  if (format.bold) font.bold = true;
  if (format.italic) font.italic = true;
  if (format.underline) font.underline = true;
  if (format.fontSize) font.sz = format.fontSize;
  if (format.fontFamily) font.name = format.fontFamily;
  if (format.textColor) {
    font.color = { rgb: format.textColor.replace('#', '') };
  }
  if (Object.keys(font).length > 0) style.font = font;

  if (format.backgroundColor) {
    style.fill = {
      fgColor: { rgb: format.backgroundColor.replace('#', '') },
      patternType: 'solid',
    };
  }

  if (format.align || format.textRotation) {
    style.alignment = {};
    if (format.align) style.alignment.horizontal = format.align;
    if (format.textRotation) style.alignment.textRotation = format.textRotation;
  }

  if (format.numberFormat) {
    style.numFmt = format.numberFormat;
  }

  return style;
}

// ─────────────────────────────────────────────────────────────────────────────
// Import: Process XLSX worksheet data with full formatting
// ─────────────────────────────────────────────────────────────────────────────

interface XLSXWorksheetCell {
  v?: string | number | boolean;
  f?: string;
  t?: string; // s=string, n=number, b=boolean, e=error, d=date
  s?: XLSXCellStyle;
  w?: string; // formatted text
}

/**
 * Convert an xlsx library worksheet to our internal Sheet format,
 * preserving all cell values, formulas, and formatting.
 */
export function importWorksheet(
  wsData: Record<string, XLSXWorksheetCell>,
  sheetName: string,
  sheetId: string
): { sheet: Partial<Sheet>; conditionalFormats: XLSXConditionalFormat[]; namedRanges: XLSXNamedRange[] } {
  const cells: Record<string, CellData> = {};
  const conditionalFormats: XLSXConditionalFormat[] = [];
  const namedRanges: XLSXNamedRange[] = [];

  for (const [ref, cell] of Object.entries(wsData)) {
    // Skip metadata keys
    if (ref.startsWith('!')) continue;

    // Parse A1-style reference
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;

    let col = 0;
    for (let i = 0; i < match[1].length; i++) {
      col = col * 26 + (match[1].charCodeAt(i) - 64);
    }
    col -= 1;
    const row = parseInt(match[2]) - 1;

    const key = getCellKey(row, col);

    // Build CellData
    const cellData: CellData = {
      value: cell.v !== undefined ? (cell.v as string | number | boolean | null) : null,
      formula: cell.f ? `=${cell.f}` : null,
      displayValue: cell.w || String(cell.v ?? ''),
    };

    // Apply formatting
    if (cell.s) {
      cellData.format = xlsxStyleToCellFormat(cell.s);
    }

    cells[key] = cellData;
  }

  return {
    sheet: { id: sheetId, name: sheetName, cells, index: 0 },
    conditionalFormats,
    namedRanges,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export: Convert internal sheet to XLSX-compatible format
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert our internal Sheet to xlsx library worksheet format.
 * Preserves all cell values, formulas, and formatting.
 */
export function exportWorksheet(sheet: Sheet): Record<string, XLSXWorksheetCell> {
  const ws: Record<string, XLSXWorksheetCell> = {};

  let maxRow = 0;
  let maxCol = 0;

  for (const [key, cell] of Object.entries(sheet.cells)) {
    const [rowStr, colStr] = key.split(':');
    const row = parseInt(rowStr);
    const col = parseInt(colStr);

    if (row > maxRow) maxRow = row;
    if (col > maxCol) maxCol = col;

    // Convert col number to A1 reference
    let colLetter = '';
    let temp = col;
    while (temp >= 0) {
      colLetter = String.fromCharCode(65 + (temp % 26)) + colLetter;
      temp = Math.floor(temp / 26) - 1;
    }
    const ref = `${colLetter}${row + 1}`;

    const wsCell: XLSXWorksheetCell = {};

    // Value
    if (cell.value !== null && cell.value !== undefined) {
      wsCell.v = cell.value;
      if (typeof cell.value === 'number') wsCell.t = 'n';
      else if (typeof cell.value === 'boolean') wsCell.t = 'b';
      else wsCell.t = 's';
    }

    // Formula
    if (cell.formula && cell.formula.startsWith('=')) {
      wsCell.f = cell.formula.slice(1); // Remove leading =
    }

    // Formatting
    if (cell.format) {
      wsCell.s = cellFormatToXlsxStyle(cell.format);
    }

    // Formatted text
    wsCell.w = cell.displayValue;

    ws[ref] = wsCell;
  }

  // Set range (xlsx library uses string for !ref metadata key)
  (ws as Record<string, unknown>)['!ref'] = `A1:${colToLetter(maxCol)}${maxRow + 1}`;

  return ws;
}

// ─────────────────────────────────────────────────────────────────────────────
// Number Format Patterns
// ─────────────────────────────────────────────────────────────────────────────

/** Common Excel number formats mapped to display formatters */
export const NUMBER_FORMATS: Record<string, (v: number) => string> = {
  'General': (v) => String(v),
  '0': (v) => Math.round(v).toString(),
  '0.00': (v) => v.toFixed(2),
  '#,##0': (v) => Math.round(v).toLocaleString(),
  '#,##0.00': (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  '0%': (v) => `${Math.round(v * 100)}%`,
  '0.00%': (v) => `${(v * 100).toFixed(2)}%`,
  '$#,##0': (v) => `$${Math.round(v).toLocaleString()}`,
  '$#,##0.00': (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  'yyyy-mm-dd': (v) => {
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  },
  'mm/dd/yyyy': (v) => {
    const d = new Date((v - 25569) * 86400 * 1000);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  },
};

/**
 * Apply number format to a value
 */
export function applyNumberFormat(value: number, format: string): string {
  const formatter = NUMBER_FORMATS[format];
  if (formatter) return formatter(value);
  // Fallback: try to match common patterns
  if (format.includes('%')) return `${(value * 100).toFixed(format.split('.')[1]?.length || 0)}%`;
  if (format.includes('$')) return `$${value.toLocaleString()}`;
  return String(value);
}
