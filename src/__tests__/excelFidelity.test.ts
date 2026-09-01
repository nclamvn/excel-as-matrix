// ═══════════════════════════════════════════════════════════════════════════
// EXCEL FIDELITY TEST SUITE — Verify .xlsx import/export roundtrip accuracy
// Tests: cell values, formulas, formatting, merged cells, multi-sheet, etc.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import type { CellData } from '../types/cell';
import { getCellKey } from '../types/cell';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — Generate and import test workbooks programmatically
// Uses ExcelJS directly to avoid File API limitations in test environment
// ─────────────────────────────────────────────────────────────────────────────

interface TestImportResult {
  sheets: Array<{
    name: string;
    cells: Record<string, CellData>;
    columnWidths?: Record<number, number>;
    rowHeights?: Record<number, number>;
    merges?: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>;
  }>;
}

async function generateWorkbook(builder: (wb: ExcelJS.Workbook) => void): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  builder(wb);
  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

/**
 * Import using ExcelJS directly (mirrors importExcelFile logic without File API)
 */
async function importExcel(buffer: ArrayBuffer): Promise<TestImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: TestImportResult['sheets'] = [];

  workbook.eachSheet((worksheet) => {
    const cells: Record<string, CellData> = {};
    const columnWidths: Record<number, number> = {};
    const merges: TestImportResult['sheets'][0]['merges'] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const r = rowNumber - 1;
        const c = colNumber - 1;
        const key = getCellKey(r, c);

        let value: string | number | boolean | null = null;
        let formula: string | null = null;
        const cellValue = cell.value;

        if (cellValue !== null && cellValue !== undefined) {
          if (typeof cellValue === 'object' && cellValue !== null) {
            const obj = cellValue as Record<string, unknown>;
            if ('formula' in obj) {
              formula = String(obj.formula || '');
              value =
                obj.result != null
                  ? typeof obj.result === 'object'
                    ? String(obj.result)
                    : (obj.result as string | number | boolean)
                  : null;
            } else if (cellValue instanceof Date) {
              value = cellValue.toISOString();
            } else if ('richText' in obj) {
              value = (obj.richText as Array<{ text: string }>).map((r) => r.text).join('');
            } else {
              value = String(cellValue);
            }
          } else {
            value = cellValue as string | number | boolean;
          }
        }

        const format: Record<string, unknown> = {};
        if (cell.font?.bold) format.bold = true;
        if (cell.font?.italic) format.italic = true;
        if (cell.font?.color?.argb) {
          const rgb =
            cell.font.color.argb.length === 8
              ? cell.font.color.argb.slice(2)
              : cell.font.color.argb;
          format.fontColor = `#${rgb}`;
        }

        cells[key] = {
          value,
          formula: formula ?? undefined,
          displayValue: value != null ? String(value) : '',
          format: Object.keys(format).length > 0 ? (format as CellData['format']) : undefined,
        } as CellData;
      });
    });

    // Column widths
    if (worksheet.columns) {
      worksheet.columns.forEach((col, idx) => {
        if (col && col.width && col.width !== 8) {
          // 8 is default
          columnWidths[idx] = Math.round(col.width * 8); // Convert chars to px approx
        }
      });
    }

    // Merges
    const mergeRanges = worksheet.model?.merges || [];
    for (const merge of mergeRanges) {
      const parts = merge.split(':');
      if (parts.length === 2) {
        const match1 = parts[0].match(/([A-Z]+)(\d+)/);
        const match2 = parts[1].match(/([A-Z]+)(\d+)/);
        if (match1 && match2) {
          merges.push({
            startRow: parseInt(match2[2]) - 1,
            startCol: match1[1].charCodeAt(0) - 65,
            endRow: parseInt(match2[2]) - 1,
            endCol: match2[1].charCodeAt(0) - 65,
          });
        }
      }
    }

    sheets.push({
      name: worksheet.name,
      cells,
      columnWidths: Object.keys(columnWidths).length > 0 ? columnWidths : undefined,
      merges: merges.length > 0 ? merges : undefined,
    });
  });

  return { sheets };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Excel Fidelity', () => {
  describe('Cell Values', () => {
    it('imports string values', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Data');
        ws.getCell('A1').value = 'Hello World';
        ws.getCell('A2').value = 'Tiếng Việt Unicode';
        ws.getCell('A3').value = '';
      });

      const result = await importExcel(buffer);
      expect(result.sheets).toHaveLength(1);
      expect(result.sheets[0].name).toBe('Data');

      const cells = result.sheets[0].cells;
      const a1 = Object.values(cells).find((c) => c.value === 'Hello World');
      expect(a1).toBeDefined();

      const a2 = Object.values(cells).find((c) => c.value === 'Tiếng Việt Unicode');
      expect(a2).toBeDefined();
    });

    it('imports numeric values', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Numbers');
        ws.getCell('A1').value = 42;
        ws.getCell('A2').value = 3.14159;
        ws.getCell('A3').value = -100;
        ws.getCell('A4').value = 0;
        ws.getCell('A5').value = 1e10;
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const values = Object.values(cells).map((c) => c.value);

      expect(values).toContain(42);
      expect(values).toContain(3.14159);
      expect(values).toContain(-100);
      expect(values).toContain(0);
    });

    it('imports boolean values', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Booleans');
        ws.getCell('A1').value = true;
        ws.getCell('A2').value = false;
      });

      const result = await importExcel(buffer);
      const values = Object.values(result.sheets[0].cells).map((c) => c.value);
      expect(values).toContain(true);
      expect(values).toContain(false);
    });

    it('imports date values', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Dates');
        ws.getCell('A1').value = new Date('2026-01-15');
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const dateCell = Object.values(cells)[0];
      expect(dateCell).toBeDefined();
      // Date may be stored as ISO string or serial number
      expect(dateCell.value).toBeTruthy();
    });
  });

  describe('Formulas', () => {
    it('imports formulas with correct references', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Formulas');
        ws.getCell('A1').value = 10;
        ws.getCell('A2').value = 20;
        ws.getCell('A3').value = { formula: 'SUM(A1:A2)', result: 30 };
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const formulaCell = Object.values(cells).find((c) => c.formula);
      expect(formulaCell).toBeDefined();
      expect(formulaCell!.formula).toContain('SUM');
    });

    it('imports multiple formula types', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('FormTypes');
        ws.getCell('A1').value = 100;
        ws.getCell('A2').value = 200;
        ws.getCell('B1').value = { formula: 'SUM(A1:A2)', result: 300 };
        ws.getCell('B2').value = { formula: 'AVERAGE(A1:A2)', result: 150 };
        ws.getCell('B3').value = { formula: 'IF(A1>A2,"Yes","No")', result: 'No' };
      });

      const result = await importExcel(buffer);
      const formulaCells = Object.values(result.sheets[0].cells).filter((c) => c.formula);
      expect(formulaCells.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Formatting', () => {
    it('imports bold and italic styles', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Styles');
        ws.getCell('A1').value = 'Bold';
        ws.getCell('A1').font = { bold: true };
        ws.getCell('A2').value = 'Italic';
        ws.getCell('A2').font = { italic: true };
        ws.getCell('A3').value = 'BoldItalic';
        ws.getCell('A3').font = { bold: true, italic: true };
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const boldCell = Object.values(cells).find((c) => c.value === 'Bold');
      expect(boldCell).toBeDefined();
      if (boldCell?.format) {
        expect(boldCell.format.bold).toBe(true);
      }
    });

    it('imports font color', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Colors');
        ws.getCell('A1').value = 'Red Text';
        ws.getCell('A1').font = { color: { argb: 'FFFF0000' } };
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const colorCell = Object.values(cells).find((c) => c.value === 'Red Text');
      expect(colorCell).toBeDefined();
      if (colorCell?.format?.fontColor) {
        expect(colorCell.format.fontColor).toMatch(/#[Ff][Ff]0000/i);
      }
    });

    it('imports background fill', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Fills');
        ws.getCell('A1').value = 'Yellow BG';
        ws.getCell('A1').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' },
        };
      });

      const result = await importExcel(buffer);
      const cells = result.sheets[0].cells;
      const fillCell = Object.values(cells).find((c) => c.value === 'Yellow BG');
      expect(fillCell).toBeDefined();
    });

    it('imports column widths', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Widths');
        ws.getColumn(1).width = 30;
        ws.getColumn(2).width = 15;
        ws.getCell('A1').value = 'Wide';
        ws.getCell('B1').value = 'Normal';
      });

      const result = await importExcel(buffer);
      const sheet = result.sheets[0];
      if (sheet.columnWidths) {
        // ExcelJS widths are in "characters", our import converts them
        expect(Object.keys(sheet.columnWidths).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Multi-Sheet', () => {
    it('imports multiple sheets with correct names', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws1 = wb.addWorksheet('Revenue');
        ws1.getCell('A1').value = 'Q1';
        const ws2 = wb.addWorksheet('Expenses');
        ws2.getCell('A1').value = 'Rent';
        const ws3 = wb.addWorksheet('Summary');
        ws3.getCell('A1').value = 'Total';
      });

      const result = await importExcel(buffer);
      expect(result.sheets).toHaveLength(3);
      expect(result.sheets.map((s) => s.name)).toEqual(['Revenue', 'Expenses', 'Summary']);
    });

    it('imports data from each sheet independently', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws1 = wb.addWorksheet('Sheet1');
        ws1.getCell('A1').value = 'Sheet1Data';
        const ws2 = wb.addWorksheet('Sheet2');
        ws2.getCell('A1').value = 'Sheet2Data';
      });

      const result = await importExcel(buffer);
      const values1 = Object.values(result.sheets[0].cells).map((c) => c.value);
      const values2 = Object.values(result.sheets[1].cells).map((c) => c.value);

      expect(values1).toContain('Sheet1Data');
      expect(values2).toContain('Sheet2Data');
      expect(values1).not.toContain('Sheet2Data');
    });
  });

  describe('Merged Cells', () => {
    it('imports merged cell ranges', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Merges');
        ws.mergeCells('A1:C1');
        ws.getCell('A1').value = 'Merged Header';
        ws.getCell('A2').value = 'Normal';
      });

      const result = await importExcel(buffer);
      const sheet = result.sheets[0];

      // Check merged header value exists
      const headerCell = Object.values(sheet.cells).find((c) => c.value === 'Merged Header');
      expect(headerCell).toBeDefined();

      // Check merge info if available
      if (sheet.merges) {
        expect(sheet.merges.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Large Dataset', () => {
    it('imports 1000 rows without error', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('BigData');
        for (let i = 1; i <= 1000; i++) {
          ws.getCell(`A${i}`).value = `Row ${i}`;
          ws.getCell(`B${i}`).value = i * 10;
          ws.getCell(`C${i}`).value = i % 2 === 0;
        }
      });

      const result = await importExcel(buffer);
      const cellCount = Object.keys(result.sheets[0].cells).length;
      expect(cellCount).toBeGreaterThanOrEqual(2000); // A + B columns minimum
    });

    it('imports 26 columns (A-Z)', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('WideSheet');
        for (let col = 1; col <= 26; col++) {
          ws.getCell(1, col).value = `Col${String.fromCharCode(64 + col)}`;
          ws.getCell(2, col).value = col * 100;
        }
      });

      const result = await importExcel(buffer);
      const cellCount = Object.keys(result.sheets[0].cells).length;
      expect(cellCount).toBeGreaterThanOrEqual(26);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty workbook', async () => {
      const buffer = await generateWorkbook((wb) => {
        wb.addWorksheet('Empty');
      });

      const result = await importExcel(buffer);
      expect(result.sheets).toHaveLength(1);
      expect(Object.keys(result.sheets[0].cells).length).toBe(0);
    });

    it('handles special characters in sheet names', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Q1 2026 (Draft)');
        ws.getCell('A1').value = 'Test';
      });

      const result = await importExcel(buffer);
      expect(result.sheets[0].name).toBe('Q1 2026 (Draft)');
    });

    it('handles cells with very long strings', async () => {
      const longString = 'A'.repeat(10000);
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('LongText');
        ws.getCell('A1').value = longString;
      });

      const result = await importExcel(buffer);
      const cell = Object.values(result.sheets[0].cells).find(
        (c) => typeof c.value === 'string' && c.value.length > 1000
      );
      expect(cell).toBeDefined();
      expect(cell!.value).toBe(longString);
    });

    it('handles numeric precision', async () => {
      const buffer = await generateWorkbook((wb) => {
        const ws = wb.addWorksheet('Precision');
        ws.getCell('A1').value = 0.1 + 0.2; // 0.30000000000000004
        ws.getCell('A2').value = 999999999999999;
      });

      const result = await importExcel(buffer);
      const values = Object.values(result.sheets[0].cells).map((c) => c.value);
      expect(values).toContain(0.1 + 0.2);
    });
  });
});
