// ============================================================
// PRINT PREVIEW CANVAS
// ============================================================

import React from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';
import { usePrintStore } from '../../stores/printStore';
import { PrintSettings } from '../../types/print';
import './Print.css';

interface PrintPreviewCanvasProps {
  sheetId: string;
  pageIndex: number;
  settings: PrintSettings;
}

export const PrintPreviewCanvas: React.FC<PrintPreviewCanvasProps> = ({
  sheetId,
  pageIndex,
  settings,
}) => {
  const { sheets } = useWorkbookStore();
  const { pages } = usePrintStore();

  const sheet = sheets[sheetId];
  const page = pages[pageIndex];

  if (!sheet || !page) {
    return <div className="preview-empty">No content to display</div>;
  }

  // Process header/footer text
  const processHeaderFooter = (text: string): string => {
    let result = text;
    result = result.replace('&[Page]', String(page.pageNumber));
    result = result.replace('&[Pages]', String(pages.length));
    result = result.replace('&[Date]', new Date().toLocaleDateString());
    result = result.replace('&[Time]', new Date().toLocaleTimeString());
    result = result.replace('&[File]', 'Untitled Workbook');
    result = result.replace('&[Sheet]', sheet.name || 'Sheet1');
    return result;
  };

  // Generate column letters
  const getColLetter = (col: number): string => {
    let letter = '';
    let temp = col;
    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Get cell value
  const getCellValue = (row: number, col: number): string => {
    const cellKey = getCellKey(row, col);
    const cell = sheet.cells?.[cellKey];
    if (!cell) return '';
    return cell.displayValue ?? cell.value ?? '';
  };

  // Get cell format
  const getCellFormat = (row: number, col: number) => {
    const cellKey = getCellKey(row, col);
    const cell = sheet.cells?.[cellKey];
    return cell?.format || {};
  };

  // Render cells
  const renderCells = () => {
    const rows = [];

    for (let row = page.startRow; row <= page.endRow; row++) {
      const cells = [];

      for (let col = page.startCol; col <= page.endCol; col++) {
        const value = getCellValue(row, col);
        const format = getCellFormat(row, col);

        cells.push(
          <td
            key={`${row}-${col}`}
            style={{
              fontWeight: format?.bold ? 'bold' : 'normal',
              fontStyle: format?.italic ? 'italic' : 'normal',
              textAlign: (format?.align as 'left' | 'center' | 'right') || 'left',
              backgroundColor: format?.backgroundColor || 'transparent',
              color: settings.blackAndWhite ? '#000' : (format?.textColor || '#000'),
              borderRight: settings.printGridlines ? '1px solid #ccc' : 'none',
              borderBottom: settings.printGridlines ? '1px solid #ccc' : 'none',
            }}
          >
            {value}
          </td>
        );
      }

      rows.push(
        <tr key={row}>
          {settings.printRowColHeaders && (
            <th className="row-header">{row + 1}</th>
          )}
          {cells}
        </tr>
      );
    }

    return rows;
  };

  // Render column headers
  const renderColHeaders = () => {
    if (!settings.printRowColHeaders) return null;

    const headers = [];
    if (settings.printRowColHeaders) {
      headers.push(<th key="corner" className="corner-header"></th>);
    }

    for (let col = page.startCol; col <= page.endCol; col++) {
      headers.push(
        <th key={col} className="col-header">
          {getColLetter(col)}
        </th>
      );
    }

    return <tr>{headers}</tr>;
  };

  return (
    <div className="print-preview-canvas">
      {/* Header */}
      {(settings.header.left || settings.header.center || settings.header.right) && (
        <div className="page-header" style={{ height: settings.margins.header }}>
          <span className="header-left">{processHeaderFooter(settings.header.left)}</span>
          <span className="header-center">{processHeaderFooter(settings.header.center)}</span>
          <span className="header-right">{processHeaderFooter(settings.header.right)}</span>
        </div>
      )}

      {/* Content */}
      <div
        className="page-content"
        style={{
          padding: `${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px`,
        }}
      >
        <table className="print-table">
          <thead>
            {renderColHeaders()}
          </thead>
          <tbody>
            {renderCells()}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {(settings.footer.left || settings.footer.center || settings.footer.right) && (
        <div className="page-footer" style={{ height: settings.margins.footer }}>
          <span className="footer-left">{processHeaderFooter(settings.footer.left)}</span>
          <span className="footer-center">{processHeaderFooter(settings.footer.center)}</span>
          <span className="footer-right">{processHeaderFooter(settings.footer.right)}</span>
        </div>
      )}
    </div>
  );
};

export default PrintPreviewCanvas;
