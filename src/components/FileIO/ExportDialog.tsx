import React, { useState } from 'react';

type ExportFormat = 'xlsx' | 'csv' | 'tsv' | 'pdf';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  sheetNames: string[];
}

interface ExportOptions {
  format: ExportFormat;
  filename: string;
  selectedSheets: string[];
  includeFormulas: boolean;
  // CSV options
  delimiter: ',' | '\t' | ';';
  includeHeader: boolean;
  // PDF options
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  includeGridLines: boolean;
}

const FORMAT_INFO: Record<ExportFormat, { label: string; extension: string; description: string }> = {
  xlsx: {
    label: 'Excel (.xlsx)',
    extension: 'xlsx',
    description: 'Full Excel format with formulas and formatting',
  },
  csv: {
    label: 'CSV (.csv)',
    extension: 'csv',
    description: 'Comma-separated values, compatible with all spreadsheet apps',
  },
  tsv: {
    label: 'TSV (.tsv)',
    extension: 'tsv',
    description: 'Tab-separated values, good for data with commas',
  },
  pdf: {
    label: 'PDF (.pdf)',
    extension: 'pdf',
    description: 'Portable document format, ideal for sharing and printing',
  },
};

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  sheetNames,
}) => {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [filename, setFilename] = useState('export');
  const [selectedSheets, setSelectedSheets] = useState<string[]>(sheetNames);
  const [includeFormulas, setIncludeFormulas] = useState(true);
  const [delimiter, setDelimiter] = useState<',' | '\t' | ';'>(',');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeGridLines, setIncludeGridLines] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((s) => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      await onExport(format, {
        format,
        filename: `${filename}.${FORMAT_INFO[format].extension}`,
        selectedSheets,
        includeFormulas,
        delimiter,
        includeHeader,
        pageSize,
        orientation,
        includeGridLines,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Export Workbook</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FORMAT_INFO) as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`p-3 rounded-lg border text-left ${
                    format === fmt
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{FORMAT_INFO[fmt].label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {FORMAT_INFO[fmt].description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <div className="flex">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="flex-1 px-3 py-2 border border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="px-3 py-2 bg-gray-100 border rounded-r-lg text-gray-600">
                .{FORMAT_INFO[format].extension}
              </span>
            </div>
          </div>

          {sheetNames.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sheets to export
              </label>
              <div className="flex flex-wrap gap-2">
                {sheetNames.map((name) => (
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

          {format === 'xlsx' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeFormulas}
                  onChange={(e) => setIncludeFormulas(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include formulas</span>
              </label>
            </div>
          )}

          {(format === 'csv' || format === 'tsv') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value as ',' | '\t' | ';')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value=",">Comma (,)</option>
                  <option value="	">Tab</option>
                  <option value=";">Semicolon (;)</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include header row</span>
              </label>
            </div>
          )}

          {format === 'pdf' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeGridLines}
                  onChange={(e) => setIncludeGridLines(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include grid lines</span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedSheets.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
