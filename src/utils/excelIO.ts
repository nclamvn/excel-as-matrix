import ExcelJS from 'exceljs';
import { CellData, CellFormat, Sheet, getCellKey } from '../types/cell';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT EXCEL (using ExcelJS for full style support)
// ═══════════════════════════════════════════════════════════════════════════

export interface ImportResult {
  sheets: Array<{
    name: string;
    cells: Record<string, CellData>;
    columnWidths?: Record<number, number>;
    rowHeights?: Record<number, number>;
    freezePane?: { row: number; col: number };
    merges?: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>;
  }>;
}

// Convert ExcelJS ARGB color (e.g. 'FF00FF00') to CSS hex color
function argbToHex(argb: string | undefined): string | undefined {
  if (!argb || argb.length < 6) return undefined;
  // ExcelJS uses ARGB format: first 2 chars are alpha, rest is RGB
  const rgb = argb.length === 8 ? argb.slice(2) : argb;
  // Skip black/white defaults that are usually just "no color set"
  if (rgb === '000000') return undefined;
  return `#${rgb}`;
}

// Standard Excel theme colors (Office 2007+ default theme)
// Theme index → base hex color
const THEME_COLORS: Record<number, string> = {
  0: 'FFFFFF', // lt1 (background 1 / white)
  1: '000000', // dk1 (text 1 / black)
  2: 'E7E6E6', // lt2 (background 2)
  3: '44546A', // dk2 (text 2)
  4: '4472C4', // accent1 (blue)
  5: 'ED7D31', // accent2 (orange)
  6: 'A5A5A5', // accent3 (gray)
  7: 'FFC000', // accent4 (gold/yellow)
  8: '5B9BD5', // accent5 (light blue)
  9: '70AD47', // accent6 (green)
};

// Apply tint to a hex color (Excel tint: -1..0 = darken, 0..1 = lighten)
function applyTint(hex: string, tint: number): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const apply = (c: number) => {
    if (tint < 0) {
      return Math.round(c * (1 + tint));
    }
    return Math.round(c + (255 - c) * tint);
  };

  const nr = Math.min(255, Math.max(0, apply(r)));
  const ng = Math.min(255, Math.max(0, apply(g)));
  const nb = Math.min(255, Math.max(0, apply(b)));

  return nr.toString(16).padStart(2, '0') +
         ng.toString(16).padStart(2, '0') +
         nb.toString(16).padStart(2, '0');
}

// Resolve ExcelJS color object to CSS hex (handles argb, theme+tint, indexed)
function resolveColor(color: { argb?: string; theme?: number; tint?: number } | undefined): string | undefined {
  if (!color) return undefined;

  // Direct ARGB
  if (color.argb) {
    return argbToHex(color.argb);
  }

  // Theme color
  if (color.theme !== undefined && THEME_COLORS[color.theme] !== undefined) {
    let hex = THEME_COLORS[color.theme];
    if (color.tint) {
      hex = applyTint(hex, color.tint);
    }
    // Skip pure black/white defaults
    if (hex === '000000') return undefined;
    if (hex === 'FFFFFF' || hex === 'ffffff') return undefined;
    return `#${hex}`;
  }

  return undefined;
}

// Extract CellFormat from ExcelJS cell
function excelJSCellToFormat(cell: ExcelJS.Cell): CellFormat | undefined {
  const format: CellFormat = {};

  // Font properties
  const font = cell.font;
  if (font) {
    if (font.bold) format.bold = true;
    if (font.italic) format.italic = true;
    if (font.underline) format.underline = true;
    if (font.size) format.fontSize = font.size;
    if (font.name) format.fontFamily = font.name;
    const textColor = resolveColor(font.color as { argb?: string; theme?: number; tint?: number });
    if (textColor) format.textColor = textColor;
  }

  // Fill (background color)
  const fill = cell.fill;
  if (fill && fill.type === 'pattern' && fill.pattern === 'solid') {
    const fgColor = fill.fgColor as { argb?: string; theme?: number; tint?: number } | undefined;
    const bg = resolveColor(fgColor);
    if (bg) format.backgroundColor = bg;
  }

  // Alignment
  const alignment = cell.alignment;
  if (alignment) {
    if (alignment.horizontal === 'left' || alignment.horizontal === 'center' || alignment.horizontal === 'right') {
      format.align = alignment.horizontal;
    }
    if (alignment.textRotation && typeof alignment.textRotation === 'number') {
      format.textRotation = alignment.textRotation;
    }
  }

  // Number format
  if (cell.numFmt && cell.numFmt !== 'General') {
    format.numberFormat = cell.numFmt;
  }

  return Object.keys(format).length > 0 ? format : undefined;
}

export const importExcelFile = async (file: File): Promise<ImportResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheets: ImportResult['sheets'] = [];

  workbook.eachSheet((worksheet) => {
    const cells: Record<string, CellData> = {};

    // Iterate all rows and cells (ExcelJS uses 1-based indexing)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const r = rowNumber - 1; // Convert to 0-based
        const c = colNumber - 1;
        const key = getCellKey(r, c);

        // Extract value
        let value: string | number | boolean | null = null;
        let formula: string | null = null;
        let displayValue = '';

        const cellValue = cell.value;

        if (cellValue !== null && cellValue !== undefined) {
          if (typeof cellValue === 'object' && cellValue !== null) {
            // Formula cell: { formula, result, ... }
            if ('formula' in cellValue) {
              const fv = cellValue as ExcelJS.CellFormulaValue;
              formula = `=${fv.formula}`;
              const result = fv.result;
              if (typeof result === 'number') {
                value = result;
              } else if (typeof result === 'boolean') {
                value = result;
              } else if (result !== undefined && result !== null) {
                value = String(result);
              }
            }
            // Shared formula
            else if ('sharedFormula' in cellValue) {
              const sv = cellValue as ExcelJS.CellSharedFormulaValue;
              formula = `=${sv.sharedFormula}`;
              const result = sv.result;
              if (typeof result === 'number') {
                value = result;
              } else if (typeof result === 'boolean') {
                value = result;
              } else if (result !== undefined && result !== null) {
                value = String(result);
              }
            }
            // Rich text
            else if ('richText' in cellValue) {
              const rt = cellValue as ExcelJS.CellRichTextValue;
              value = rt.richText.map((r) => r.text).join('');
            }
            // Date
            else if (cellValue instanceof Date) {
              value = cellValue.toLocaleDateString();
            }
            // Error
            else if ('error' in cellValue) {
              value = String((cellValue as ExcelJS.CellErrorValue).error);
            }
            else {
              value = String(cellValue);
            }
          } else if (typeof cellValue === 'number') {
            value = cellValue;
          } else if (typeof cellValue === 'boolean') {
            value = cellValue;
          } else {
            value = String(cellValue);
          }
        }

        // Use cell.text for formatted display value (ExcelJS formats it)
        displayValue = cell.text || String(value ?? '');

        if (value === null && !formula) return; // Skip truly empty cells

        const cellData: CellData = {
          value: value ?? '',
          formula,
          displayValue,
        };

        // Extract formatting
        const cellFormat = excelJSCellToFormat(cell);
        if (cellFormat) {
          cellData.format = cellFormat;
        }

        cells[key] = cellData;
      });
    });

    // Extract column widths (ExcelJS column width is in characters)
    let columnWidths: Record<number, number> | undefined;
    const colCount = worksheet.columnCount;
    if (colCount > 0) {
      columnWidths = {};
      for (let i = 1; i <= colCount; i++) {
        const col = worksheet.getColumn(i);
        if (col.width && col.width > 0) {
          // Convert character width to pixels: ~7.5px per character + padding
          columnWidths[i - 1] = Math.round(col.width * 7.5 + 5);
        }
      }
      if (Object.keys(columnWidths).length === 0) columnWidths = undefined;
    }

    // Extract row heights
    let rowHeights: Record<number, number> | undefined;
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (row.height && row.height > 0) {
        if (!rowHeights) rowHeights = {};
        // ExcelJS row height is in points, convert to pixels (1pt ≈ 1.33px)
        rowHeights[rowNumber - 1] = Math.round(row.height * 1.33);
      }
    });

    // Extract freeze pane from worksheet views
    let freezePane: { row: number; col: number } | undefined;
    const views = worksheet.views;
    if (views && views.length > 0) {
      const view = views[0];
      if (view.state === 'frozen') {
        freezePane = {
          row: view.ySplit || 0,
          col: view.xSplit || 0,
        };
      }
    }

    // Extract merge ranges
    let merges: ImportResult['sheets'][0]['merges'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergeRanges = (worksheet as any)._merges;
    if (mergeRanges && typeof mergeRanges === 'object') {
      merges = [];
      for (const key of Object.keys(mergeRanges)) {
        // Parse merge range like "A1:B3"
        const match = key.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (match) {
          let startCol = 0;
          for (let i = 0; i < match[1].length; i++) startCol = startCol * 26 + (match[1].charCodeAt(i) - 64);
          startCol -= 1;
          let endCol = 0;
          for (let i = 0; i < match[3].length; i++) endCol = endCol * 26 + (match[3].charCodeAt(i) - 64);
          endCol -= 1;
          merges.push({
            startRow: parseInt(match[2]) - 1,
            startCol,
            endRow: parseInt(match[4]) - 1,
            endCol,
          });
        }
      }
      if (merges.length === 0) merges = undefined;
    }

    sheets.push({
      name: worksheet.name,
      cells,
      columnWidths,
      rowHeights,
      freezePane,
      merges,
    });
  });

  return { sheets };
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT CSV
// ═══════════════════════════════════════════════════════════════════════════

export const importCSVFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const cells: Record<string, CellData> = {};

        lines.forEach((line, rowIndex) => {
          // Handle CSV parsing with quotes
          const values = parseCSVLine(line);

          values.forEach((value, colIndex) => {
            if (value !== '') {
              const key = getCellKey(rowIndex, colIndex);
              const numValue = Number(value);
              const finalValue = !isNaN(numValue) && value.trim() !== '' ? numValue : value;

              cells[key] = {
                value: finalValue,
                formula: null,
                displayValue: String(finalValue),
              };
            }
          });
        });

        resolve({
          sheets: [{ name: file.name.replace(/\.csv$/i, ''), cells }],
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT EXCEL (using ExcelJS for formatting preservation)
// ═══════════════════════════════════════════════════════════════════════════

// Convert CellFormat back to ExcelJS style properties
function cellFormatToExcelJS(format: CellFormat): {
  font?: Partial<ExcelJS.Font>;
  fill?: ExcelJS.Fill;
  alignment?: Partial<ExcelJS.Alignment>;
  numFmt?: string;
} {
  const result: ReturnType<typeof cellFormatToExcelJS> = {};

  // Font
  const font: Partial<ExcelJS.Font> = {};
  if (format.bold) font.bold = true;
  if (format.italic) font.italic = true;
  if (format.underline) font.underline = true;
  if (format.fontSize) font.size = format.fontSize;
  if (format.fontFamily) font.name = format.fontFamily;
  if (format.textColor) font.color = { argb: 'FF' + format.textColor.replace('#', '') };
  if (Object.keys(font).length > 0) result.font = font;

  // Fill
  if (format.backgroundColor) {
    result.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + format.backgroundColor.replace('#', '') },
    };
  }

  // Alignment
  if (format.align || format.textRotation) {
    const alignment: Partial<ExcelJS.Alignment> = {};
    if (format.align) alignment.horizontal = format.align;
    if (format.textRotation) alignment.textRotation = format.textRotation;
    result.alignment = alignment;
  }

  // Number format
  if (format.numberFormat) result.numFmt = format.numberFormat;

  return result;
}

export const exportToExcel = async (
  sheets: Record<string, Sheet>,
  sheetOrder: string[],
  fileName: string = 'spreadsheet.xlsx'
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  sheetOrder.forEach((sheetId) => {
    const sheet = sheets[sheetId];
    if (!sheet) return;

    const ws = workbook.addWorksheet(sheet.name);

    // Set column widths
    if (sheet.columnWidths) {
      for (const [colStr, px] of Object.entries(sheet.columnWidths)) {
        const colIdx = parseInt(colStr) + 1; // ExcelJS 1-based
        ws.getColumn(colIdx).width = Math.round((px - 5) / 7.5); // px → chars
      }
    }

    // Set freeze pane
    if (sheet.freezePane) {
      ws.views = [{
        state: 'frozen',
        xSplit: sheet.freezePane.col,
        ySplit: sheet.freezePane.row,
      }];
    }

    // Write cells with formatting
    for (const [key, cellData] of Object.entries(sheet.cells)) {
      const [rowStr, colStr] = key.split(':');
      const row = parseInt(rowStr) + 1; // ExcelJS 1-based
      const col = parseInt(colStr) + 1;

      const cell = ws.getCell(row, col);

      // Value
      if (cellData.formula) {
        cell.value = { formula: cellData.formula.replace(/^=/, ''), result: cellData.value } as ExcelJS.CellFormulaValue;
      } else {
        cell.value = cellData.value;
      }

      // Formatting
      if (cellData.format) {
        const style = cellFormatToExcelJS(cellData.format);
        if (style.font) cell.font = style.font;
        if (style.fill) cell.fill = style.fill;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.numFmt) cell.numFmt = style.numFmt;
      }
    }

    // Set row heights
    if (sheet.rowHeights) {
      for (const [rowStr, px] of Object.entries(sheet.rowHeights)) {
        const rowIdx = parseInt(rowStr) + 1;
        ws.getRow(rowIdx).height = Math.round(px / 1.33); // px → points
      }
    }
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════════════════════════

export const exportToCSV = (
  sheet: Sheet,
  fileName: string = 'spreadsheet.csv'
): void => {
  // Find bounds
  let maxRow = 0;
  let maxCol = 0;

  Object.keys(sheet.cells).forEach((key) => {
    const [rowStr, colStr] = key.split(':');
    maxRow = Math.max(maxRow, parseInt(rowStr));
    maxCol = Math.max(maxCol, parseInt(colStr));
  });

  // Build CSV
  const lines: string[] = [];

  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const key = getCellKey(r, c);
      const cell = sheet.cells[key];
      let value = String(cell?.value ?? '');

      // Escape quotes and wrap if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      row.push(value);
    }
    lines.push(row.join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};
