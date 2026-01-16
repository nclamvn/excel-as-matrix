// ============================================================
// PRINT PREVIEW DIALOG
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings,
  Download,
  FileText,
} from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { PrintPreviewCanvas } from './PrintPreviewCanvas';
import { PageSetupDialog } from './PageSetupDialog';
import { PAPER_SIZES, PaperSize } from '../../types/print';
import './Print.css';

interface PrintPreviewDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintPreviewDialog: React.FC<PrintPreviewDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(75);
  const [showPageSetup, setShowPageSetup] = useState(false);

  const {
    getSettings,
    pages,
    currentPage,
    setCurrentPage,
    calculatePages,
    setOrientation,
    setPaperSize,
    setScaling,
    updateSettings,
  } = usePrintStore();

  const { sheets } = useWorkbookStore();
  const settings = getSettings(sheetId);
  const sheet = sheets[sheetId];

  // Calculate pages on mount/settings change
  useEffect(() => {
    if (!isOpen || !sheet) return;

    // Get row heights and column widths from sheet data
    const rowHeights = Array(100).fill(25);  // Default row height
    const colWidths = Array(26).fill(100);   // Default column width

    calculatePages(sheetId, 100, 26, rowHeights, colWidths);
  }, [isOpen, sheetId, settings, sheet, calculatePages]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Trigger browser print dialog with PDF option
    window.print();
  };

  const handleZoomIn = () => setZoom(z => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom(z => Math.max(25, z - 25));

  const handlePrevPage = () => setCurrentPage(currentPage - 1);
  const handleNextPage = () => setCurrentPage(currentPage + 1);

  if (!isOpen) return null;

  const paper = PAPER_SIZES[settings.paperSize];
  const pageWidth = settings.orientation === 'portrait' ? paper.width : paper.height;
  const pageHeight = settings.orientation === 'portrait' ? paper.height : paper.width;

  return (
    <div className="print-preview-overlay">
      <div className="print-preview-dialog">
        {/* Header */}
        <div className="print-header">
          <div className="print-header-left">
            <Printer size={20} />
            <h2>Print Preview</h2>
          </div>

          <div className="print-header-center">
            {/* Page Navigation */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="nav-btn"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="page-info">
              Page {currentPage} of {pages.length || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= pages.length}
              className="nav-btn"
            >
              <ChevronRight size={20} />
            </button>

            <div className="header-divider" />

            {/* Zoom */}
            <button onClick={handleZoomOut} className="nav-btn" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button onClick={handleZoomIn} className="nav-btn" title="Zoom In">
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="print-header-right">
            <button
              className="setup-btn"
              onClick={() => setShowPageSetup(true)}
            >
              <Settings size={16} />
              Page Setup
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="print-content">
          {/* Sidebar */}
          <div className="print-sidebar">
            <div className="sidebar-section">
              <h3>Settings</h3>

              <div className="setting-item">
                <label>Orientation</label>
                <div className="orientation-btns">
                  <button
                    className={settings.orientation === 'portrait' ? 'active' : ''}
                    onClick={() => setOrientation(sheetId, 'portrait')}
                  >
                    <FileText size={20} />
                    Portrait
                  </button>
                  <button
                    className={settings.orientation === 'landscape' ? 'active' : ''}
                    onClick={() => setOrientation(sheetId, 'landscape')}
                  >
                    <FileText size={20} className="rotate-90" />
                    Landscape
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <label>Paper Size</label>
                <select
                  value={settings.paperSize}
                  onChange={(e) => setPaperSize(sheetId, e.target.value as PaperSize)}
                >
                  {Object.entries(PAPER_SIZES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="setting-item">
                <label>Scaling</label>
                <select
                  value={settings.scalingMode}
                  onChange={(e) => setScaling(sheetId, e.target.value as 'actual' | 'fitToPage' | 'fitToWidth' | 'custom')}
                >
                  <option value="actual">Actual Size (100%)</option>
                  <option value="fitToPage">Fit to Page</option>
                  <option value="fitToWidth">Fit to Width</option>
                  <option value="custom">Custom Scale</option>
                </select>
                {settings.scalingMode === 'custom' && (
                  <div className="scale-input">
                    <input
                      type="number"
                      min="10"
                      max="400"
                      value={settings.customScale}
                      onChange={(e) => setScaling(sheetId, 'custom', parseInt(e.target.value))}
                    />
                    <span>%</span>
                  </div>
                )}
              </div>

              <div className="setting-item checkbox-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.printGridlines}
                    onChange={(e) => updateSettings(sheetId, { printGridlines: e.target.checked })}
                  />
                  Print Gridlines
                </label>
              </div>

              <div className="setting-item checkbox-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.printRowColHeaders}
                    onChange={(e) => updateSettings(sheetId, { printRowColHeaders: e.target.checked })}
                  />
                  Print Row & Column Headers
                </label>
              </div>
            </div>

            {/* Print Button */}
            <div className="print-actions">
              <button className="print-btn primary" onClick={handlePrint}>
                <Printer size={18} />
                Print
              </button>
              <button className="print-btn secondary" onClick={handleExportPDF}>
                <Download size={18} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="preview-area">
            <div
              className="preview-container"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <div
                className="preview-page"
                style={{
                  width: pageWidth,
                  height: pageHeight,
                }}
              >
                <PrintPreviewCanvas
                  sheetId={sheetId}
                  pageIndex={currentPage - 1}
                  settings={settings}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Page Setup Dialog */}
        {showPageSetup && (
          <PageSetupDialog
            sheetId={sheetId}
            onClose={() => setShowPageSetup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PrintPreviewDialog;
