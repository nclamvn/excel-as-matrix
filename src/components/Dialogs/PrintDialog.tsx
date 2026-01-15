import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';

interface PrintDialogProps {
  onClose: () => void;
}

export const PrintDialog: React.FC<PrintDialogProps> = ({ onClose }) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [paperSize, setPaperSize] = useState('a4');
  const [printArea, setPrintArea] = useState<'all' | 'selection'>('all');
  const [showGridlines, setShowGridlines] = useState(true);
  const [showHeadings, setShowHeadings] = useState(false);
  const [scale, setScale] = useState(100);

  const handlePrint = () => {
    // Add print styles dynamically
    const printStyleId = 'excel-print-styles';
    let printStyle = document.getElementById(printStyleId) as HTMLStyleElement;

    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = printStyleId;
      document.head.appendChild(printStyle);
    }

    printStyle.textContent = `
      @page {
        size: ${paperSize} ${orientation};
        margin: 1cm;
      }

      @media print {
        body * {
          visibility: hidden;
        }

        .grid-container,
        .grid-container * {
          visibility: visible !important;
        }

        .grid-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          transform: scale(${scale / 100});
          transform-origin: top left;
        }

        /* Hide UI elements */
        .toolbar-2026,
        .header-2026,
        .sidebar,
        .status-bar,
        .sheet-tabs,
        .ribbon-container,
        .formula-bar,
        .quick-access-bar,
        .toast-container,
        .dialog-overlay {
          display: none !important;
        }

        /* Cell styling */
        .grid-cell {
          border: ${showGridlines ? '1px solid #ccc' : 'none'} !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }

        /* Row/Column headers */
        .grid-header {
          display: ${showHeadings ? 'block' : 'none'} !important;
        }

        .row-header,
        .column-header {
          display: ${showHeadings ? 'flex' : 'none'} !important;
        }
      }
    `;

    // Trigger print
    window.print();

    // Clean up after print
    setTimeout(() => {
      printStyle.remove();
    }, 1000);

    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog print-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 400 }}>
        <div className="dialog-header">
          <h2>Print</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Print Area */}
          <div className="dialog-section">
            <h3 className="dialog-section-title">
              <FileText size={16} />
              Print Area
            </h3>

            <div className="dialog-radio-group">
              <label className="dialog-radio">
                <input
                  type="radio"
                  name="printArea"
                  checked={printArea === 'all'}
                  onChange={() => setPrintArea('all')}
                />
                Entire sheet
              </label>
              <label className="dialog-radio">
                <input
                  type="radio"
                  name="printArea"
                  checked={printArea === 'selection'}
                  onChange={() => setPrintArea('selection')}
                />
                Selection only
              </label>
            </div>
          </div>

          {/* Page Setup */}
          <div className="dialog-section">
            <h3 className="dialog-section-title">
              <Printer size={16} />
              Page Setup
            </h3>

            <div className="dialog-field">
              <label>Orientation:</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="dialog-input"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="dialog-field">
              <label>Paper Size:</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="dialog-input"
              >
                <option value="a4">A4 (210 x 297 mm)</option>
                <option value="letter">Letter (8.5 x 11 in)</option>
                <option value="legal">Legal (8.5 x 14 in)</option>
                <option value="a3">A3 (297 x 420 mm)</option>
              </select>
            </div>

            <div className="dialog-field">
              <label>Scale: {scale}%</label>
              <input
                type="range"
                min="50"
                max="200"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="dialog-range"
              />
            </div>
          </div>

          {/* Options */}
          <div className="dialog-section">
            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={showGridlines}
                onChange={(e) => setShowGridlines(e.target.checked)}
              />
              Print gridlines
            </label>

            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={showHeadings}
                onChange={(e) => setShowHeadings(e.target.checked)}
              />
              Print row and column headings
            </label>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handlePrint}>
            <Printer size={14} style={{ marginRight: 6 }} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};
