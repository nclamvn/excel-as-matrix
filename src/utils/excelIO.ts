// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as XLSX from 'xlsx';
import { CellData, Sheet, getCellKey } from '../types/cell';

// Type augmentation for xlsx
const XLSXUtils = XLSX.utils as typeof XLSX.utils & {
  aoa_to_sheet: (data: unknown[][]) => XLSX.WorkSheet;
};
const XLSXWriteFile = (XLSX as unknown as { writeFile: (workbook: XLSX.WorkBook, filename: string) => void }).writeFile;

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT EXCEL
// ═══════════════════════════════════════════════════════════════════════════

export interface ImportResult {
  sheets: Array<{
    name: string;
    cells: Record<string, CellData>;
  }>;
}

export const importExcelFile = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });

        const sheets: ImportResult['sheets'] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          }) as unknown[][];

          const cells: Record<string, CellData> = {};

          jsonData.forEach((row, rowIndex) => {
            if (Array.isArray(row)) {
              row.forEach((cellValue, colIndex) => {
                if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                  const key = getCellKey(rowIndex, colIndex);
                  const value = typeof cellValue === 'number' ? cellValue :
                               typeof cellValue === 'boolean' ? cellValue :
                               String(cellValue);

                  cells[key] = {
                    value,
                    formula: null,
                    displayValue: String(value),
                  };
                }
              });
            }
          });

          sheets.push({ name: sheetName, cells });
        });

        resolve({ sheets });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
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
// EXPORT EXCEL
// ═══════════════════════════════════════════════════════════════════════════

export const exportToExcel = (
  sheets: Record<string, Sheet>,
  sheetOrder: string[],
  fileName: string = 'spreadsheet.xlsx'
): void => {
  const workbook = XLSX.utils.book_new();

  sheetOrder.forEach((sheetId) => {
    const sheet = sheets[sheetId];
    if (!sheet) return;

    // Find bounds
    let maxRow = 0;
    let maxCol = 0;

    Object.keys(sheet.cells).forEach((key) => {
      const [rowStr, colStr] = key.split(':');
      maxRow = Math.max(maxRow, parseInt(rowStr));
      maxCol = Math.max(maxCol, parseInt(colStr));
    });

    // Build 2D array
    const data: (string | number | boolean | null)[][] = [];

    for (let r = 0; r <= maxRow; r++) {
      data[r] = [];
      for (let c = 0; c <= maxCol; c++) {
        const key = getCellKey(r, c);
        const cell = sheet.cells[key];
        data[r][c] = cell?.value ?? '';
      }
    }

    const worksheet = XLSXUtils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  XLSXWriteFile(workbook, fileName);
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
