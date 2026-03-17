import React, { useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { importExcelFile, importCSVFile } from '../../utils/excelIO';

// Typed cell value for import
type ImportedCellPrimitive = string | number | boolean | null | undefined;

interface ImportedCellValue {
  type: 'Empty' | 'String' | 'Number' | 'Bool' | 'DateTime' | 'Error';
  value?: ImportedCellPrimitive;
}

interface ImportedSheet {
  name: string;
  cells: Array<{
    row: number;
    col: number;
    value: ImportedCellValue;
  }>;
  row_count: number;
  col_count: number;
}

interface ImportPreviewData {
  sheets: ImportedSheet[];
  sheet_names: string[];
  detected_format: string;
}

interface CsvPreviewData {
  rows: Array<{ index: number; cells: string[] }>;
  column_count: number;
  row_count: number;
  detected_delimiter: string;
  detected_encoding: string;
  headers?: string[];
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportPreviewData | CsvPreviewData, options: ImportOptions) => void;
}

interface ImportOptions {
  selectedSheets?: string[];
  hasHeader: boolean;
  skipRows: number;
  maxRows?: number;
}

const MAX_RECOMMENDED_ROWS = 50000;
const DEFAULT_MAX_ROWS = 50000;

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'options'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<CsvPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [skipRows] = useState(0);
  const [maxRows, setMaxRows] = useState(DEFAULT_MAX_ROWS);
  const [totalRowCount, setTotalRowCount] = useState(0);

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    setError(null);
    setLoading(true);

    try {
      const isCSV = /\.(csv|tsv)$/i.test(droppedFile.name);

      if (isCSV) {
        // Client-side CSV parsing
        const result = await importCSVFile(droppedFile);
        const csvRows: Array<{ index: number; cells: string[] }> = [];
        let maxCol = 0;
        let maxRow = 0;

        for (const key of Object.keys(result.sheets[0].cells)) {
          const [rowStr, colStr] = key.split(':');
          maxRow = Math.max(maxRow, parseInt(rowStr));
          maxCol = Math.max(maxCol, parseInt(colStr));
        }

        for (let r = 0; r <= Math.min(maxRow, 99); r++) {
          const cells: string[] = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellData = result.sheets[0].cells[`${r}:${c}`];
            cells.push(cellData ? String(cellData.value ?? '') : '');
          }
          csvRows.push({ index: r, cells });
        }

        setCsvPreviewData({
          rows: csvRows,
          column_count: maxCol + 1,
          row_count: maxRow + 1,
          detected_delimiter: ',',
          detected_encoding: 'utf-8',
        });
        setPreviewData(null);
        setTotalRowCount(maxRow + 1);
      } else {
        // Client-side XLSX parsing via SheetJS
        const result = await importExcelFile(droppedFile);
        const sheets: ImportedSheet[] = result.sheets.map((sheet) => {
          const cells: ImportedSheet['cells'] = [];
          let rowCount = 0;
          let colCount = 0;

          for (const [key, cell] of Object.entries(sheet.cells)) {
            const [rowStr, colStr] = key.split(':');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            rowCount = Math.max(rowCount, row + 1);
            colCount = Math.max(colCount, col + 1);

            // Only preview first 100 rows
            if (row < 100) {
              const cellValue = cell.value;
              let typedValue: ImportedCellValue;
              if (cellValue === null || cellValue === undefined || cellValue === '') {
                typedValue = { type: 'Empty' };
              } else if (typeof cellValue === 'number') {
                typedValue = { type: 'Number', value: cellValue };
              } else if (typeof cellValue === 'boolean') {
                typedValue = { type: 'Bool', value: cellValue };
              } else {
                typedValue = { type: 'String', value: String(cellValue) };
              }
              cells.push({ row, col, value: typedValue });
            }
          }

          return { name: sheet.name, cells, row_count: rowCount, col_count: colCount };
        });

        const sheetNames = result.sheets.map((s) => s.name);
        setPreviewData({ sheets, sheet_names: sheetNames, detected_format: 'XLSX' });
        setSelectedSheets(sheetNames);
        setCsvPreviewData(null);
        setTotalRowCount(sheets.reduce((sum, s) => sum + s.row_count, 0));
      }

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const isCSV = /\.(csv|tsv)$/i.test(file.name);

      if (isCSV) {
        const result = await importCSVFile(file);
        // Convert to CsvPreviewData format for onImport
        const csvRows: Array<{ index: number; cells: string[] }> = [];
        let maxCol = 0;
        let maxRow = 0;

        for (const key of Object.keys(result.sheets[0].cells)) {
          const [rowStr, colStr] = key.split(':');
          maxRow = Math.max(maxRow, parseInt(rowStr));
          maxCol = Math.max(maxCol, parseInt(colStr));
        }

        for (let r = 0; r <= Math.min(maxRow, maxRows - 1); r++) {
          const cells: string[] = [];
          for (let c = 0; c <= maxCol; c++) {
            const cellData = result.sheets[0].cells[`${r}:${c}`];
            cells.push(cellData ? String(cellData.value ?? '') : '');
          }
          csvRows.push({ index: r, cells });
        }

        onImport({
          rows: csvRows,
          column_count: maxCol + 1,
          row_count: Math.min(maxRow + 1, maxRows),
          detected_delimiter: ',',
          detected_encoding: 'utf-8',
        }, { hasHeader, skipRows, maxRows });
      } else {
        const result = await importExcelFile(file);
        const sheets: ImportedSheet[] = result.sheets.map((sheet) => {
          const cells: ImportedSheet['cells'] = [];
          let rowCount = 0;
          let colCount = 0;

          for (const [key, cell] of Object.entries(sheet.cells)) {
            const [rowStr, colStr] = key.split(':');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            if (row >= maxRows) continue;
            rowCount = Math.max(rowCount, row + 1);
            colCount = Math.max(colCount, col + 1);

            const cellValue = cell.value;
            let typedValue: ImportedCellValue;
            if (cellValue === null || cellValue === undefined || cellValue === '') {
              typedValue = { type: 'Empty' };
            } else if (typeof cellValue === 'number') {
              typedValue = { type: 'Number', value: cellValue };
            } else if (typeof cellValue === 'boolean') {
              typedValue = { type: 'Bool', value: cellValue };
            } else {
              typedValue = { type: 'String', value: String(cellValue) };
            }
            cells.push({ row, col, value: typedValue });
          }

          return { name: sheet.name, cells, row_count: rowCount, col_count: colCount };
        });

        const sheetNames = result.sheets.map((s) => s.name);
        onImport({
          sheets,
          sheet_names: sheetNames,
          detected_format: 'XLSX',
        }, { selectedSheets, hasHeader, skipRows, maxRows });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((s) => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const renderCellValue = (value: ImportedCellValue): string => {
    if (value.type === 'Empty') return '';
    if (value.type === 'String') return String(value.value ?? '');
    if (value.type === 'Number') return String(value.value ?? '');
    if (value.type === 'Bool') return value.value ? 'TRUE' : 'FALSE';
    return String(value.value ?? '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Import File</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {step === 'upload' && (
            <FileDropZone
              onFileDrop={handleFileDrop}
              disabled={loading}
            />
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-3 text-gray-600">Processing file...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setStep('upload');
                }}
                className="mt-2 text-sm text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>File:</span>
                <span className="font-medium">{file?.name}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase">
                  {previewData.detected_format}
                </span>
              </div>

              {previewData.sheet_names.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select sheets to import:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {previewData.sheet_names.map((name) => (
                      <button
                        key={name}
                        onClick={() => toggleSheet(name)}
                        className={`px-3 py-1.5 rounded text-sm ${
                          selectedSheets.includes(name)
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview:</label>
                <div className="border rounded overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <tbody>
                      {previewData.sheets[0]?.cells.slice(0, 10).map((cell, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="px-3 py-1 bg-gray-50 text-gray-500 text-xs w-10">
                            {cell.row + 1}
                          </td>
                          <td className="px-3 py-1">
                            {renderCellValue(cell.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && csvPreviewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>File:</span>
                <span className="font-medium">{file?.name}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  Delimiter: {csvPreviewData.detected_delimiter === ',' ? 'Comma' :
                    csvPreviewData.detected_delimiter === '\t' ? 'Tab' : csvPreviewData.detected_delimiter}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {csvPreviewData.detected_encoding}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">First row is header</span>
                </label>
              </div>

              {/* Row count warning and limit selector */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total rows: <strong>{totalRowCount.toLocaleString()}</strong>
                  </span>
                  {totalRowCount > MAX_RECOMMENDED_ROWS && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Large file - may be slow
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Import limit:</label>
                  <select
                    value={maxRows}
                    onChange={(e) => setMaxRows(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={10000}>10,000 rows</option>
                    <option value={25000}>25,000 rows</option>
                    <option value={50000}>50,000 rows (recommended)</option>
                    <option value={100000}>100,000 rows</option>
                    <option value={500000}>All rows (slow)</option>
                  </select>
                </div>
                {maxRows < totalRowCount && (
                  <p className="text-xs text-gray-500">
                    Will import first {maxRows.toLocaleString()} of {totalRowCount.toLocaleString()} rows
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview:</label>
                <div className="border rounded overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    {csvPreviewData.headers && hasHeader && (
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-1 text-left text-gray-500 text-xs w-10">#</th>
                          {csvPreviewData.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-1 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {csvPreviewData.rows.slice(0, 10).map((row) => (
                        <tr key={row.index} className="border-b">
                          <td className="px-3 py-1 bg-gray-50 text-gray-500 text-xs">
                            {row.index + 1}
                          </td>
                          {row.cells.map((cell, idx) => (
                            <td key={idx} className="px-3 py-1">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          {step === 'preview' && (
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={selectedSheets.length === 0 && previewData !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
