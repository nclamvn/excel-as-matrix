import { useState, useCallback } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import { getCellKey } from '../types/cell';

// Native browser download helper
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type ExportFormat = 'xlsx' | 'csv' | 'tsv' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  filename: string;
  selectedSheets: string[];
  includeFormulas: boolean;
  delimiter: ',' | '\t' | ';';
  includeHeader: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  includeGridLines: boolean;
}

interface UseFileExportReturn {
  exportWorkbook: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
  error: string | null;
  progress: number;
}

// Export request body types
interface XlsxExportRequest {
  format: 'xlsx';
  workbook: ReturnType<typeof Object>;
  filename: string;
  options: {
    include_formulas: boolean;
    include_formatting: boolean;
    default_column_width: number;
    default_row_height: number;
  };
}

interface CsvExportRequest {
  format: 'csv' | 'tsv';
  csv_data: {
    rows: { index: number; cells: string[] }[];
    column_count: number;
  };
  filename: string;
  options: {
    delimiter: 'comma' | 'semicolon' | 'tab';
    include_header: boolean;
    line_ending: 'crlf' | 'lf';
    quote_style: 'necessary' | 'all';
  };
}

interface PdfExportRequest {
  format: 'pdf';
  sheets: { name: string; cells: { row: number; col: number; value: string }[] }[];
  filename: string;
  options: {
    page_size: 'a4' | 'letter' | 'legal';
    orientation: 'portrait' | 'landscape';
    margin: number;
    font_size: number;
    header_font_size: number;
    include_grid_lines: boolean;
    include_sheet_name: boolean;
    include_page_numbers: boolean;
    title: string | null;
  };
}

type ExportRequestBody = XlsxExportRequest | CsvExportRequest | PdfExportRequest;

export function useFileExport(): UseFileExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { sheets } = useWorkbookStore();

  const buildExportData = useCallback(
    (selectedSheets: string[], includeFormulas: boolean) => {
      const exportSheets = [];

      for (const [, sheet] of Object.entries(sheets)) {
        if (!selectedSheets.includes(sheet.name)) continue;

        const cells = [];
        for (const [key, cell] of Object.entries(sheet.cells)) {
          const [row, col] = key.split(':').map(Number);

          let value;
          const cellValue = cell.value;
          if (cellValue === undefined || cellValue === null || cellValue === '') {
            value = { type: 'Empty' };
          } else if (typeof cellValue === 'number') {
            value = { type: 'Number', value: cellValue };
          } else if (typeof cellValue === 'boolean') {
            value = { type: 'Bool', value: cellValue };
          } else {
            value = { type: 'String', value: String(cellValue) };
          }

          cells.push({
            row,
            col,
            value,
            formula: includeFormulas ? cell.formula : undefined,
            format: null,
          });
        }

        exportSheets.push({
          name: sheet.name,
          cells,
          column_widths: null,
          row_heights: null,
          frozen_rows: null,
          frozen_cols: null,
        });
      }

      return {
        sheets: exportSheets,
        author: 'Excel - Claude Code',
        company: null,
      };
    },
    [sheets]
  );

  const buildCsvData = useCallback(
    (selectedSheets: string[], includeHeader: boolean) => {
      // Export first selected sheet as CSV
      const sheetEntry = Object.entries(sheets).find(
        ([_, sheet]) => selectedSheets.includes(sheet.name)
      );

      if (!sheetEntry) {
        return null;
      }

      const [, sheet] = sheetEntry;
      const rows: { index: number; cells: string[] }[] = [];
      let maxCol = 0;
      let maxRow = 0;

      // Find dimensions
      for (const key of Object.keys(sheet.cells)) {
        const [row, col] = key.split(':').map(Number);
        maxCol = Math.max(maxCol, col);
        maxRow = Math.max(maxRow, row);
      }

      // Build rows
      for (let row = 0; row <= maxRow; row++) {
        const cells: string[] = [];
        for (let col = 0; col <= maxCol; col++) {
          const cell = sheet.cells[getCellKey(row, col)];
          cells.push(cell?.value?.toString() || '');
        }
        rows.push({ index: row, cells });
      }

      return {
        rows,
        column_count: maxCol + 1,
        row_count: maxRow + 1,
        detected_delimiter: ',',
        detected_encoding: 'UTF-8',
        has_header: includeHeader,
        headers: includeHeader && rows.length > 0 ? rows[0].cells : null,
      };
    },
    [sheets]
  );

  const buildPdfSheets = useCallback(
    (selectedSheets: string[]) => {
      const pdfSheets = [];

      for (const [, sheet] of Object.entries(sheets)) {
        if (!selectedSheets.includes(sheet.name)) continue;

        const cells = [];
        let maxCol = 0;
        let maxRow = 0;

        // Find dimensions
        for (const key of Object.keys(sheet.cells)) {
          const [r, c] = key.split(':').map(Number);
          maxCol = Math.max(maxCol, c);
          maxRow = Math.max(maxRow, r);
        }

        // Build cells
        for (const [key, cell] of Object.entries(sheet.cells)) {
          const [row, col] = key.split(':').map(Number);
          cells.push({
            row,
            col,
            value: cell.displayValue || cell.value?.toString() || '',
            is_header: row === 0,
          });
        }

        pdfSheets.push({
          name: sheet.name,
          cells,
          column_widths: Array(maxCol + 1).fill(80),
          row_count: maxRow + 1,
          col_count: maxCol + 1,
        });
      }

      return pdfSheets;
    },
    [sheets]
  );

  const exportWorkbook = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      setError(null);
      setProgress(0);

      try {
        let requestBody: ExportRequestBody | undefined;

        setProgress(20);

        if (options.format === 'xlsx') {
          requestBody = {
            format: 'xlsx' as const,
            workbook: buildExportData(options.selectedSheets, options.includeFormulas),
            filename: options.filename,
            options: {
              include_formulas: options.includeFormulas,
              include_formatting: true,
              default_column_width: 10.0,
              default_row_height: 15.0,
            },
          };
        } else if (options.format === 'csv' || options.format === 'tsv') {
          const csvData = buildCsvData(options.selectedSheets, options.includeHeader);
          if (!csvData) {
            throw new Error('No data to export');
          }

          requestBody = {
            format: options.format as 'csv' | 'tsv',
            csv_data: csvData,
            filename: options.filename,
            options: {
              delimiter: options.format === 'tsv' ? 'tab' as const :
                options.delimiter === '\t' ? 'tab' as const :
                options.delimiter === ';' ? 'semicolon' as const : 'comma' as const,
              include_header: options.includeHeader,
              line_ending: 'crlf' as const,
              quote_style: 'necessary' as const,
            },
          };
        } else if (options.format === 'pdf') {
          const pdfSheets = buildPdfSheets(options.selectedSheets);
          if (pdfSheets.length === 0) {
            throw new Error('No data to export');
          }

          requestBody = {
            format: 'pdf' as const,
            sheets: pdfSheets,
            filename: options.filename,
            options: {
              page_size: options.pageSize,
              orientation: options.orientation,
              margin: 15.0,
              font_size: 10.0,
              header_font_size: 12.0,
              include_grid_lines: options.includeGridLines,
              include_sheet_name: true,
              include_page_numbers: true,
              title: null,
            },
          };
        }

        setProgress(50);

        const response = await fetch('/api/files/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        setProgress(80);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        // Download the file
        const blob = await response.blob();
        downloadBlob(blob, options.filename);

        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed');
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [buildExportData, buildCsvData, buildPdfSheets]
  );

  return {
    exportWorkbook,
    isExporting,
    error,
    progress,
  };
}

export default useFileExport;
