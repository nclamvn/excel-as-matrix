import { useState, useCallback } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';
import { apiClient } from '../api/client';

// Typed cell value for import - matches Excel/CSV value types
type ImportedCellPrimitive = string | number | boolean | null | undefined;

interface ImportedCellValue {
  type: 'Empty' | 'String' | 'Number' | 'Bool' | 'DateTime' | 'Error';
  value?: ImportedCellPrimitive;
}

interface ImportedCell {
  row: number;
  col: number;
  value: ImportedCellValue;
  formula?: string;
}

interface ImportedSheet {
  name: string;
  cells: ImportedCell[];
  row_count: number;
  col_count: number;
}

interface ImportedWorkbook {
  sheets: ImportedSheet[];
  sheet_names: string[];
}

interface CsvData {
  rows: Array<{ index: number; cells: string[] }>;
  column_count: number;
  row_count: number;
  headers?: string[];
}

interface ImportOptions {
  selectedSheets?: string[];
  hasHeader: boolean;
  skipRows: number;
}

interface UseFileImportReturn {
  importFile: (file: File) => Promise<void>;
  importFromPreview: (
    data: ImportedWorkbook | CsvData,
    options: ImportOptions
  ) => Promise<void>;
  isImporting: boolean;
  error: string | null;
  progress: number;
}

// Helper to process in batches without blocking UI
const processInBatches = async <T>(
  items: T[],
  batchSize: number,
  processFn: (item: T, index: number) => void,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const total = items.length;
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, total));

    // Process batch
    batch.forEach((item, batchIndex) => {
      processFn(item, i + batchIndex);
    });

    // Update progress and yield to browser
    if (onProgress) {
      onProgress(Math.round(((i + batch.length) / total) * 100));
    }

    // Yield to browser every batch to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

export function useFileImport(): UseFileImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { addSheet, setWorkbook, batchUpdateCells } = useWorkbookStore();

  const parseCellValue = (value: ImportedCellValue): string => {
    switch (value.type) {
      case 'Empty':
        return '';
      case 'String':
        return String(value.value ?? '');
      case 'Number':
        return String(value.value ?? '');
      case 'Bool':
        return value.value ? 'TRUE' : 'FALSE';
      case 'DateTime':
        return String(value.value ?? '');
      case 'Error':
        return '#ERROR!';
      default:
        return String(value.value ?? '');
    }
  };

  const importWorkbook = useCallback(
    async (workbook: ImportedWorkbook, options: ImportOptions) => {
      const sheetsToImport = options.selectedSheets || workbook.sheet_names;

      // Create workbook via backend API to get proper UUID
      const backendWorkbook = await apiClient.createWorkbook('Imported Workbook');
      setWorkbook(backendWorkbook.id, backendWorkbook.name);

      let totalCells = 0;
      let processedCells = 0;

      // Count total cells
      for (const sheet of workbook.sheets) {
        if (sheetsToImport.includes(sheet.name)) {
          totalCells += sheet.cells.length;
        }
      }

      // Import each sheet
      for (let i = 0; i < workbook.sheets.length; i++) {
        const sheet = workbook.sheets[i];
        if (!sheetsToImport.includes(sheet.name)) continue;

        // First sheet already exists from createWorkbook, use it
        let sheetId: string;
        if (i === 0 && backendWorkbook.sheets.length > 0) {
          sheetId = backendWorkbook.sheets[0].id;
          // Update sheet name if needed
          addSheet({
            id: sheetId,
            name: sheet.name,
            index: 0,
            cells: {},
          });
        } else {
          // Create additional sheets via backend
          const backendSheet = await apiClient.createSheet(backendWorkbook.id, sheet.name);
          sheetId = backendSheet.id;
          addSheet({
            id: sheetId,
            name: sheet.name,
            index: i,
            cells: {},
          });
        }

        // Import cells in batches for performance
        const BATCH_SIZE = 500;
        const cellUpdates = sheet.cells.map(cell => ({
          row: cell.row + options.skipRows,
          col: cell.col,
          data: {
            value: parseCellValue(cell.value),
            formula: cell.formula || undefined,
            displayValue: parseCellValue(cell.value),
          }
        }));

        // Process in batches to avoid blocking UI
        await processInBatches(
          cellUpdates,
          BATCH_SIZE,
          (_update) => {
            // Individual updates are collected and batched
          },
          (percent) => {
            const sheetProgress = (processedCells / totalCells) * 100;
            setProgress(Math.round(sheetProgress + (percent * sheet.cells.length / totalCells)));
          }
        );

        // Apply all updates in one batch per sheet
        batchUpdateCells(sheetId, cellUpdates);
        processedCells += sheet.cells.length;
      }
    },
    [addSheet, batchUpdateCells, setWorkbook]
  );

  const importCsv = useCallback(
    async (csvData: CsvData, options: ImportOptions) => {
      // Create workbook via backend API to get proper UUID
      const backendWorkbook = await apiClient.createWorkbook('Imported CSV');
      setWorkbook(backendWorkbook.id, backendWorkbook.name);

      // Use the default sheet created with the workbook
      const sheetId = backendWorkbook.sheets[0]?.id || backendWorkbook.id;
      addSheet({
        id: sheetId,
        name: 'Sheet1',
        index: 0,
        cells: {},
      });

      let startRow = options.hasHeader ? 0 : 0;

      // Build all cell updates
      const cellUpdates: Array<{ row: number; col: number; data: { value: string; displayValue: string } }> = [];

      // Import header if present
      if (options.hasHeader && csvData.headers) {
        for (let col = 0; col < csvData.headers.length; col++) {
          cellUpdates.push({
            row: 0,
            col,
            data: {
              value: csvData.headers[col],
              displayValue: csvData.headers[col],
            }
          });
        }
        startRow = 1;
      }

      // Prepare all row updates
      for (let i = 0; i < csvData.rows.length; i++) {
        const row = csvData.rows[i];
        const targetRow = i + startRow + options.skipRows;

        for (let col = 0; col < row.cells.length; col++) {
          const value = row.cells[col];
          cellUpdates.push({
            row: targetRow,
            col,
            data: {
              value,
              displayValue: value,
            }
          });
        }
      }

      // Process in batches for progress updates, then apply all at once
      const BATCH_SIZE = 1000;
      for (let i = 0; i < cellUpdates.length; i += BATCH_SIZE) {
        setProgress(Math.round((i / cellUpdates.length) * 90));
        // Yield to browser
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Apply all updates in one batch
      batchUpdateCells(sheetId, cellUpdates);
      setProgress(100);
    },
    [addSheet, batchUpdateCells, setWorkbook]
  );

  const importFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setError(null);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files/import', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Import failed');
        }

        const result = await response.json();

        if (result.workbook) {
          await importWorkbook(result.workbook, {
            hasHeader: true,
            skipRows: 0,
          });
        } else if (result.csv_data) {
          await importCsv(result.csv_data, {
            hasHeader: true,
            skipRows: 0,
          });
        }

        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
        throw err;
      } finally {
        setIsImporting(false);
      }
    },
    [importWorkbook, importCsv]
  );

  const importFromPreview = useCallback(
    async (
      data: ImportedWorkbook | CsvData,
      options: ImportOptions
    ) => {
      setIsImporting(true);
      setError(null);
      setProgress(0);

      try {
        if ('sheets' in data) {
          await importWorkbook(data, options);
        } else {
          await importCsv(data, options);
        }
        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
        throw err;
      } finally {
        setIsImporting(false);
      }
    },
    [importWorkbook, importCsv]
  );

  return {
    importFile,
    importFromPreview,
    isImporting,
    error,
    progress,
  };
}

export default useFileImport;
