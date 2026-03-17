// ═══════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE PDF EXPORT
// Uses browser print API with a formatted HTML table for high-quality output
// ═══════════════════════════════════════════════════════════════════════════

import type { Sheet } from '../types/cell';
import { getCellKey } from '../types/cell';

export interface PdfExportOptions {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  includeGridLines: boolean;
  includeSheetName: boolean;
  includePageNumbers: boolean;
  title?: string;
  headerRows?: number;
  printArea?: { startRow: number; startCol: number; endRow: number; endCol: number };
}

const PAGE_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
  legal: { width: 216, height: 356 },
};

function getColLetter(col: number): string {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function findDataBounds(sheet: Sheet): { maxRow: number; maxCol: number } {
  let maxRow = 0;
  let maxCol = 0;
  for (const key of Object.keys(sheet.cells)) {
    const [rowStr, colStr] = key.split(':');
    const row = parseInt(rowStr);
    const col = parseInt(colStr);
    if (row > maxRow) maxRow = row;
    if (col > maxCol) maxCol = col;
  }
  return { maxRow, maxCol };
}

/**
 * Export sheet(s) to PDF using browser print dialog.
 * Creates a hidden iframe with formatted HTML table and triggers print.
 */
export function exportToPdf(
  sheets: Sheet[],
  options: PdfExportOptions
): void {
  const { orientation, includeGridLines, includeSheetName, includePageNumbers, title } = options;
  const pageSize = PAGE_SIZES[options.pageSize];

  // Build HTML content
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title || 'ExcelAI Export'}</title>
<style>
@page {
  size: ${pageSize.width}mm ${pageSize.height}mm ${orientation === 'landscape' ? 'landscape' : 'portrait'};
  margin: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
}
@media print {
  body { margin: 0; padding: 0; }
  .page-break { page-break-before: always; }
  .sheet-name { display: ${includeSheetName ? 'block' : 'none'}; }
  .page-footer { display: ${includePageNumbers ? 'block' : 'none'}; position: fixed; bottom: 5mm; right: 10mm; font-size: 9pt; color: #666; }
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 10pt;
  color: #000;
}
.sheet-name {
  font-size: 14pt;
  font-weight: bold;
  margin-bottom: 8pt;
  color: #333;
}
table {
  border-collapse: collapse;
  width: 100%;
  table-layout: auto;
}
td, th {
  padding: 2pt 4pt;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  max-width: 150pt;
  ${includeGridLines ? 'border: 0.5pt solid #ccc;' : ''}
}
th {
  background: #f5f5f5;
  font-weight: bold;
  font-size: 9pt;
  color: #555;
}
.num { text-align: right; }
.bold { font-weight: bold; }
.italic { font-style: italic; }
.title-row {
  text-align: center;
  font-size: 16pt;
  font-weight: bold;
  padding: 8pt;
  margin-bottom: 8pt;
}
</style>
</head>
<body>`;

  if (title) {
    html += `<div class="title-row">${escapeHtml(title)}</div>`;
  }

  for (let si = 0; si < sheets.length; si++) {
    const sheet = sheets[si];
    if (si > 0) html += '<div class="page-break"></div>';

    if (includeSheetName) {
      html += `<div class="sheet-name">${escapeHtml(sheet.name)}</div>`;
    }

    const bounds = findDataBounds(sheet);
    const startRow = options.printArea?.startRow ?? 0;
    const endRow = options.printArea?.endRow ?? bounds.maxRow;
    const startCol = options.printArea?.startCol ?? 0;
    const endCol = options.printArea?.endCol ?? bounds.maxCol;

    html += '<table>';

    // Column headers
    html += '<tr><th></th>';
    for (let col = startCol; col <= endCol; col++) {
      html += `<th>${getColLetter(col)}</th>`;
    }
    html += '</tr>';

    // Data rows
    for (let row = startRow; row <= endRow; row++) {
      html += `<tr><th>${row + 1}</th>`;
      for (let col = startCol; col <= endCol; col++) {
        const key = getCellKey(row, col);
        const cell = sheet.cells[key];
        const value = cell?.displayValue || String(cell?.value ?? '');
        const isNum = typeof cell?.value === 'number';
        const classes: string[] = [];
        if (isNum) classes.push('num');
        if (cell?.format?.bold) classes.push('bold');
        if (cell?.format?.italic) classes.push('italic');

        let style = '';
        if (cell?.format?.backgroundColor) style += `background:${cell.format.backgroundColor};`;
        if (cell?.format?.textColor) style += `color:${cell.format.textColor};`;
        if (cell?.format?.fontSize) style += `font-size:${cell.format.fontSize}pt;`;

        html += `<td class="${classes.join(' ')}" ${style ? `style="${style}"` : ''}>${escapeHtml(value)}</td>`;
      }
      html += '</tr>';
    }

    html += '</table>';
  }

  if (includePageNumbers) {
    html += '<div class="page-footer">Page <span class="pageNumber"></span></div>';
  }

  html += '</body></html>';

  // Create hidden iframe and trigger print
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content to render, then print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
