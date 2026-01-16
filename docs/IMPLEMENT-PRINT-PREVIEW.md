# 🖨️ IMPLEMENTATION GUIDE: Print Preview
## ExcelAI — Print & Page Setup Feature

---

## 🎯 Overview

| Feature | Est. Time | Files | Impact |
|---------|-----------|-------|--------|
| Print Preview | 2 days | 8 | +0.5% |

**Features:**
- Print Preview Dialog
- Page Setup (margins, orientation, size)
- Print Area Selection
- Headers & Footers
- Page Breaks
- Scaling Options
- Export to PDF

---

## 📁 Files to Create

```
src/
├── types/
│   └── print.ts                 # Print type definitions
├── stores/
│   └── printStore.ts            # Zustand store for print settings
├── components/
│   └── Print/
│       ├── index.ts
│       ├── PrintPreviewDialog.tsx
│       ├── PageSetupDialog.tsx
│       ├── PrintPreviewCanvas.tsx
│       ├── HeaderFooterDialog.tsx
│       └── Print.css
```

---

## 📄 File 1: `src/types/print.ts`

```typescript
// ============================================================
// PRINT TYPE DEFINITIONS
// ============================================================

export type PageOrientation = 'portrait' | 'landscape';

export type PaperSize = 
  | 'letter'    // 8.5 x 11 in
  | 'legal'     // 8.5 x 14 in
  | 'a4'        // 210 x 297 mm
  | 'a3'        // 297 x 420 mm
  | 'tabloid';  // 11 x 17 in

export interface PaperDimensions {
  width: number;   // in pixels at 96 DPI
  height: number;
  label: string;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  letter: { width: 816, height: 1056, label: 'Letter (8.5" × 11")' },
  legal: { width: 816, height: 1344, label: 'Legal (8.5" × 14")' },
  a4: { width: 794, height: 1123, label: 'A4 (210mm × 297mm)' },
  a3: { width: 1123, height: 1587, label: 'A3 (297mm × 420mm)' },
  tabloid: { width: 1056, height: 1632, label: 'Tabloid (11" × 17")' },
};

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  header: number;
  footer: number;
}

export const MARGIN_PRESETS: Record<string, PageMargins> = {
  normal: { top: 75, bottom: 75, left: 70, right: 70, header: 30, footer: 30 },
  wide: { top: 100, bottom: 100, left: 100, right: 100, header: 50, footer: 50 },
  narrow: { top: 50, bottom: 50, left: 50, right: 50, header: 20, footer: 20 },
  custom: { top: 75, bottom: 75, left: 70, right: 70, header: 30, footer: 30 },
};

export interface HeaderFooterContent {
  left: string;
  center: string;
  right: string;
}

export interface PrintSettings {
  // Page Setup
  orientation: PageOrientation;
  paperSize: PaperSize;
  margins: PageMargins;
  
  // Scaling
  scalingMode: 'actual' | 'fitToPage' | 'fitToWidth' | 'custom';
  customScale: number;  // 10-400%
  fitToPagesWide: number;
  fitToPagesTall: number;
  
  // Print Area
  printArea: string | null;  // e.g., "A1:H20" or null for all
  
  // Headers & Footers
  header: HeaderFooterContent;
  footer: HeaderFooterContent;
  differentFirstPage: boolean;
  differentOddEven: boolean;
  
  // Options
  printGridlines: boolean;
  printRowColHeaders: boolean;
  blackAndWhite: boolean;
  draftQuality: boolean;
  centerHorizontally: boolean;
  centerVertically: boolean;
  
  // Page Order
  pageOrder: 'downThenOver' | 'overThenDown';
}

export interface PageBreak {
  type: 'row' | 'column';
  index: number;
  isManual: boolean;
}

export interface PrintPage {
  pageNumber: number;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  orientation: 'portrait',
  paperSize: 'letter',
  margins: MARGIN_PRESETS.normal,
  scalingMode: 'actual',
  customScale: 100,
  fitToPagesWide: 1,
  fitToPagesTall: 1,
  printArea: null,
  header: { left: '', center: '', right: '' },
  footer: { left: '', center: '&[Page]', right: '' },
  differentFirstPage: false,
  differentOddEven: false,
  printGridlines: false,
  printRowColHeaders: false,
  blackAndWhite: false,
  draftQuality: false,
  centerHorizontally: false,
  centerVertically: false,
  pageOrder: 'downThenOver',
};

// Header/Footer codes
export const HEADER_FOOTER_CODES = {
  '&[Page]': 'Page Number',
  '&[Pages]': 'Total Pages',
  '&[Date]': 'Current Date',
  '&[Time]': 'Current Time',
  '&[File]': 'File Name',
  '&[Sheet]': 'Sheet Name',
};
```

---

## 📄 File 2: `src/stores/printStore.ts`

```typescript
// ============================================================
// PRINT STORE — Zustand Store for Print Settings
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PrintSettings,
  PageBreak,
  PrintPage,
  PageMargins,
  PageOrientation,
  PaperSize,
  HeaderFooterContent,
  DEFAULT_PRINT_SETTINGS,
  PAPER_SIZES,
} from '../types/print';

interface PrintStore {
  // Settings per sheet
  settings: Record<string, PrintSettings>;
  
  // Page breaks per sheet
  pageBreaks: Record<string, PageBreak[]>;
  
  // Calculated pages
  pages: PrintPage[];
  currentPage: number;
  
  // Get settings for sheet
  getSettings: (sheetId: string) => PrintSettings;
  
  // Update settings
  updateSettings: (sheetId: string, updates: Partial<PrintSettings>) => void;
  setOrientation: (sheetId: string, orientation: PageOrientation) => void;
  setPaperSize: (sheetId: string, paperSize: PaperSize) => void;
  setMargins: (sheetId: string, margins: PageMargins) => void;
  setScaling: (sheetId: string, mode: PrintSettings['scalingMode'], value?: number) => void;
  setPrintArea: (sheetId: string, area: string | null) => void;
  setHeader: (sheetId: string, header: HeaderFooterContent) => void;
  setFooter: (sheetId: string, footer: HeaderFooterContent) => void;
  
  // Page breaks
  addPageBreak: (sheetId: string, type: 'row' | 'column', index: number) => void;
  removePageBreak: (sheetId: string, type: 'row' | 'column', index: number) => void;
  clearPageBreaks: (sheetId: string) => void;
  getPageBreaks: (sheetId: string) => PageBreak[];
  
  // Page calculation
  calculatePages: (sheetId: string, totalRows: number, totalCols: number, rowHeights: number[], colWidths: number[]) => void;
  setCurrentPage: (page: number) => void;
  
  // Reset
  resetSettings: (sheetId: string) => void;
}

export const usePrintStore = create<PrintStore>()(
  persist(
    (set, get) => ({
      settings: {},
      pageBreaks: {},
      pages: [],
      currentPage: 1,

      getSettings: (sheetId) => {
        return get().settings[sheetId] || { ...DEFAULT_PRINT_SETTINGS };
      },

      updateSettings: (sheetId, updates) => {
        set(state => ({
          settings: {
            ...state.settings,
            [sheetId]: {
              ...get().getSettings(sheetId),
              ...updates,
            },
          },
        }));
      },

      setOrientation: (sheetId, orientation) => {
        get().updateSettings(sheetId, { orientation });
      },

      setPaperSize: (sheetId, paperSize) => {
        get().updateSettings(sheetId, { paperSize });
      },

      setMargins: (sheetId, margins) => {
        get().updateSettings(sheetId, { margins });
      },

      setScaling: (sheetId, mode, value) => {
        const updates: Partial<PrintSettings> = { scalingMode: mode };
        if (mode === 'custom' && value !== undefined) {
          updates.customScale = Math.max(10, Math.min(400, value));
        }
        get().updateSettings(sheetId, updates);
      },

      setPrintArea: (sheetId, area) => {
        get().updateSettings(sheetId, { printArea: area });
      },

      setHeader: (sheetId, header) => {
        get().updateSettings(sheetId, { header });
      },

      setFooter: (sheetId, footer) => {
        get().updateSettings(sheetId, { footer });
      },

      // Page Breaks
      addPageBreak: (sheetId, type, index) => {
        set(state => {
          const existing = state.pageBreaks[sheetId] || [];
          // Don't add duplicate
          if (existing.some(pb => pb.type === type && pb.index === index)) {
            return state;
          }
          return {
            pageBreaks: {
              ...state.pageBreaks,
              [sheetId]: [...existing, { type, index, isManual: true }],
            },
          };
        });
      },

      removePageBreak: (sheetId, type, index) => {
        set(state => ({
          pageBreaks: {
            ...state.pageBreaks,
            [sheetId]: (state.pageBreaks[sheetId] || []).filter(
              pb => !(pb.type === type && pb.index === index && pb.isManual)
            ),
          },
        }));
      },

      clearPageBreaks: (sheetId) => {
        set(state => ({
          pageBreaks: {
            ...state.pageBreaks,
            [sheetId]: [],
          },
        }));
      },

      getPageBreaks: (sheetId) => {
        return get().pageBreaks[sheetId] || [];
      },

      // Calculate pages based on content and settings
      calculatePages: (sheetId, totalRows, totalCols, rowHeights, colWidths) => {
        const settings = get().getSettings(sheetId);
        const pageBreaks = get().getPageBreaks(sheetId);
        const paper = PAPER_SIZES[settings.paperSize];
        
        // Get printable area
        let pageWidth = settings.orientation === 'portrait' ? paper.width : paper.height;
        let pageHeight = settings.orientation === 'portrait' ? paper.height : paper.width;
        
        // Subtract margins
        const printableWidth = pageWidth - settings.margins.left - settings.margins.right;
        const printableHeight = pageHeight - settings.margins.top - settings.margins.bottom - 
                               settings.margins.header - settings.margins.footer;
        
        // Apply scaling
        let scale = 1;
        if (settings.scalingMode === 'custom') {
          scale = settings.customScale / 100;
        }
        
        const scaledPrintableWidth = printableWidth / scale;
        const scaledPrintableHeight = printableHeight / scale;
        
        // Calculate pages
        const pages: PrintPage[] = [];
        let currentRow = 0;
        let currentCol = 0;
        let pageNum = 1;
        
        // Get manual row breaks
        const rowBreaks = pageBreaks
          .filter(pb => pb.type === 'row')
          .map(pb => pb.index)
          .sort((a, b) => a - b);
        
        // Get manual column breaks
        const colBreaks = pageBreaks
          .filter(pb => pb.type === 'column')
          .map(pb => pb.index)
          .sort((a, b) => a - b);

        while (currentRow < totalRows) {
          currentCol = 0;
          
          while (currentCol < totalCols) {
            // Find end row for this page
            let endRow = currentRow;
            let heightSum = 0;
            
            while (endRow < totalRows && heightSum + (rowHeights[endRow] || 25) <= scaledPrintableHeight) {
              // Check for manual break
              if (rowBreaks.includes(endRow) && endRow > currentRow) break;
              heightSum += rowHeights[endRow] || 25;
              endRow++;
            }
            
            // Find end column for this page
            let endCol = currentCol;
            let widthSum = 0;
            
            while (endCol < totalCols && widthSum + (colWidths[endCol] || 100) <= scaledPrintableWidth) {
              // Check for manual break
              if (colBreaks.includes(endCol) && endCol > currentCol) break;
              widthSum += colWidths[endCol] || 100;
              endCol++;
            }
            
            pages.push({
              pageNumber: pageNum++,
              startRow: currentRow,
              endRow: endRow - 1,
              startCol: currentCol,
              endCol: endCol - 1,
            });
            
            currentCol = endCol;
          }
          
          // Move to next row section
          let nextRow = currentRow;
          let heightSum = 0;
          while (nextRow < totalRows && heightSum + (rowHeights[nextRow] || 25) <= scaledPrintableHeight) {
            if (rowBreaks.includes(nextRow) && nextRow > currentRow) break;
            heightSum += rowHeights[nextRow] || 25;
            nextRow++;
          }
          currentRow = nextRow;
        }
        
        set({ pages, currentPage: 1 });
      },

      setCurrentPage: (page) => {
        const { pages } = get();
        if (page >= 1 && page <= pages.length) {
          set({ currentPage: page });
        }
      },

      resetSettings: (sheetId) => {
        set(state => ({
          settings: {
            ...state.settings,
            [sheetId]: { ...DEFAULT_PRINT_SETTINGS },
          },
          pageBreaks: {
            ...state.pageBreaks,
            [sheetId]: [],
          },
        }));
      },
    }),
    {
      name: 'excelai-print',
      partialize: (state) => ({
        settings: state.settings,
        pageBreaks: state.pageBreaks,
      }),
    }
  )
);

export default usePrintStore;
```

---

## 📄 File 3: `src/components/Print/PrintPreviewDialog.tsx`

```tsx
// ============================================================
// PRINT PREVIEW DIALOG
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2,
} from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { PrintPreviewCanvas } from './PrintPreviewCanvas';
import { PageSetupDialog } from './PageSetupDialog';
import { PAPER_SIZES } from '../../types/print';
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
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const { 
    getSettings, 
    pages, 
    currentPage, 
    setCurrentPage,
    calculatePages,
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
                    onClick={() => usePrintStore.getState().setOrientation(sheetId, 'portrait')}
                  >
                    <FileText size={20} />
                    Portrait
                  </button>
                  <button 
                    className={settings.orientation === 'landscape' ? 'active' : ''}
                    onClick={() => usePrintStore.getState().setOrientation(sheetId, 'landscape')}
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
                  onChange={(e) => usePrintStore.getState().setPaperSize(sheetId, e.target.value as any)}
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
                  onChange={(e) => usePrintStore.getState().setScaling(sheetId, e.target.value as any)}
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
                      onChange={(e) => usePrintStore.getState().setScaling(sheetId, 'custom', parseInt(e.target.value))}
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
                    onChange={(e) => usePrintStore.getState().updateSettings(sheetId, { printGridlines: e.target.checked })}
                  />
                  Print Gridlines
                </label>
              </div>

              <div className="setting-item checkbox-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.printRowColHeaders}
                    onChange={(e) => usePrintStore.getState().updateSettings(sheetId, { printRowColHeaders: e.target.checked })}
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
```

---

## 📄 File 4: `src/components/Print/PageSetupDialog.tsx`

```tsx
// ============================================================
// PAGE SETUP DIALOG
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import { 
  PAPER_SIZES, 
  MARGIN_PRESETS,
  PageMargins,
  HEADER_FOOTER_CODES,
} from '../../types/print';
import './Print.css';

interface PageSetupDialogProps {
  sheetId: string;
  onClose: () => void;
}

type TabType = 'page' | 'margins' | 'headerFooter';

export const PageSetupDialog: React.FC<PageSetupDialogProps> = ({
  sheetId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('page');
  const { getSettings, updateSettings, setMargins } = usePrintStore();
  const settings = getSettings(sheetId);

  const [localMargins, setLocalMargins] = useState<PageMargins>(settings.margins);
  const [marginPreset, setMarginPreset] = useState('normal');

  const handleMarginPresetChange = (preset: string) => {
    setMarginPreset(preset);
    if (preset !== 'custom') {
      const presetMargins = MARGIN_PRESETS[preset];
      setLocalMargins(presetMargins);
      setMargins(sheetId, presetMargins);
    }
  };

  const handleMarginChange = (key: keyof PageMargins, value: number) => {
    const newMargins = { ...localMargins, [key]: value };
    setLocalMargins(newMargins);
    setMarginPreset('custom');
    setMargins(sheetId, newMargins);
  };

  const handleHeaderChange = (position: 'left' | 'center' | 'right', value: string) => {
    updateSettings(sheetId, {
      header: { ...settings.header, [position]: value },
    });
  };

  const handleFooterChange = (position: 'left' | 'center' | 'right', value: string) => {
    updateSettings(sheetId, {
      footer: { ...settings.footer, [position]: value },
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog page-setup-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Page Setup</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="page-setup-tabs">
          <button 
            className={activeTab === 'page' ? 'active' : ''}
            onClick={() => setActiveTab('page')}
          >
            Page
          </button>
          <button 
            className={activeTab === 'margins' ? 'active' : ''}
            onClick={() => setActiveTab('margins')}
          >
            Margins
          </button>
          <button 
            className={activeTab === 'headerFooter' ? 'active' : ''}
            onClick={() => setActiveTab('headerFooter')}
          >
            Header/Footer
          </button>
        </div>

        <div className="dialog-content">
          {/* Page Tab */}
          {activeTab === 'page' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Orientation</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      checked={settings.orientation === 'portrait'}
                      onChange={() => updateSettings(sheetId, { orientation: 'portrait' })}
                    />
                    Portrait
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      checked={settings.orientation === 'landscape'}
                      onChange={() => updateSettings(sheetId, { orientation: 'landscape' })}
                    />
                    Landscape
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Paper Size</label>
                <select 
                  value={settings.paperSize}
                  onChange={(e) => updateSettings(sheetId, { paperSize: e.target.value as any })}
                >
                  {Object.entries(PAPER_SIZES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Scaling</label>
                <div className="scaling-options">
                  <label>
                    <input 
                      type="radio" 
                      checked={settings.scalingMode === 'actual'}
                      onChange={() => updateSettings(sheetId, { scalingMode: 'actual' })}
                    />
                    Adjust to: 
                    <input 
                      type="number" 
                      min="10" 
                      max="400"
                      value={settings.customScale}
                      onChange={(e) => updateSettings(sheetId, { scalingMode: 'custom', customScale: parseInt(e.target.value) })}
                      disabled={settings.scalingMode !== 'custom'}
                    />
                    % normal size
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      checked={settings.scalingMode === 'fitToPage'}
                      onChange={() => updateSettings(sheetId, { scalingMode: 'fitToPage' })}
                    />
                    Fit to page
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Print Options</label>
                <div className="checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.printGridlines}
                      onChange={(e) => updateSettings(sheetId, { printGridlines: e.target.checked })}
                    />
                    Gridlines
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.printRowColHeaders}
                      onChange={(e) => updateSettings(sheetId, { printRowColHeaders: e.target.checked })}
                    />
                    Row and column headings
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={settings.blackAndWhite}
                      onChange={(e) => updateSettings(sheetId, { blackAndWhite: e.target.checked })}
                    />
                    Black and white
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Margins Tab */}
          {activeTab === 'margins' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Preset</label>
                <select 
                  value={marginPreset}
                  onChange={(e) => handleMarginPresetChange(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                  <option value="narrow">Narrow</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="margins-grid">
                <div className="margin-input">
                  <label>Top</label>
                  <input 
                    type="number" 
                    value={localMargins.top}
                    onChange={(e) => handleMarginChange('top', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Bottom</label>
                  <input 
                    type="number" 
                    value={localMargins.bottom}
                    onChange={(e) => handleMarginChange('bottom', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Left</label>
                  <input 
                    type="number" 
                    value={localMargins.left}
                    onChange={(e) => handleMarginChange('left', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Right</label>
                  <input 
                    type="number" 
                    value={localMargins.right}
                    onChange={(e) => handleMarginChange('right', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Header</label>
                  <input 
                    type="number" 
                    value={localMargins.header}
                    onChange={(e) => handleMarginChange('header', parseInt(e.target.value))}
                  />
                </div>
                <div className="margin-input">
                  <label>Footer</label>
                  <input 
                    type="number" 
                    value={localMargins.footer}
                    onChange={(e) => handleMarginChange('footer', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="center-options">
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.centerHorizontally}
                    onChange={(e) => updateSettings(sheetId, { centerHorizontally: e.target.checked })}
                  />
                  Center on page horizontally
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={settings.centerVertically}
                    onChange={(e) => updateSettings(sheetId, { centerVertically: e.target.checked })}
                  />
                  Center on page vertically
                </label>
              </div>
            </div>
          )}

          {/* Header/Footer Tab */}
          {activeTab === 'headerFooter' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Header</label>
                <div className="header-footer-inputs">
                  <input 
                    type="text" 
                    placeholder="Left section"
                    value={settings.header.left}
                    onChange={(e) => handleHeaderChange('left', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Center section"
                    value={settings.header.center}
                    onChange={(e) => handleHeaderChange('center', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Right section"
                    value={settings.header.right}
                    onChange={(e) => handleHeaderChange('right', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Footer</label>
                <div className="header-footer-inputs">
                  <input 
                    type="text" 
                    placeholder="Left section"
                    value={settings.footer.left}
                    onChange={(e) => handleFooterChange('left', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Center section"
                    value={settings.footer.center}
                    onChange={(e) => handleFooterChange('center', e.target.value)}
                  />
                  <input 
                    type="text" 
                    placeholder="Right section"
                    value={settings.footer.right}
                    onChange={(e) => handleFooterChange('right', e.target.value)}
                  />
                </div>
              </div>

              <div className="insert-codes">
                <label>Insert codes:</label>
                <div className="code-buttons">
                  {Object.entries(HEADER_FOOTER_CODES).map(([code, label]) => (
                    <button 
                      key={code}
                      className="code-btn"
                      title={`Insert ${label}`}
                      onClick={() => {
                        // Copy code to clipboard
                        navigator.clipboard.writeText(code);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageSetupDialog;
```

---

## 📄 File 5: `src/components/Print/PrintPreviewCanvas.tsx`

```tsx
// ============================================================
// PRINT PREVIEW CANVAS
// ============================================================

import React from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { usePrintStore } from '../../stores/printStore';
import { PrintSettings, HEADER_FOOTER_CODES } from '../../types/print';
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
  const { sheets, getCellValue, getCellFormat } = useWorkbookStore();
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

  // Render cells
  const renderCells = () => {
    const rows = [];
    
    for (let row = page.startRow; row <= page.endRow; row++) {
      const cells = [];
      
      for (let col = page.startCol; col <= page.endCol; col++) {
        const value = getCellValue(sheetId, row, col);
        const format = getCellFormat(sheetId, row, col);
        
        cells.push(
          <td 
            key={`${row}-${col}`}
            style={{
              fontWeight: format?.bold ? 'bold' : 'normal',
              fontStyle: format?.italic ? 'italic' : 'normal',
              textAlign: format?.align || 'left',
              backgroundColor: format?.backgroundColor || 'transparent',
              color: format?.color || '#000',
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
```

---

## 📄 File 6: `src/components/Print/Print.css`

```css
/* ============================================================
   PRINT STYLES
   ============================================================ */

/* Print Preview Overlay */
.print-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.print-preview-dialog {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #f5f5f5);
}

/* Header */
.print-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-primary, #fff);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.print-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.print-header-left h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.print-header-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f5f5f5);
  border-color: var(--accent-color, #217346);
  color: var(--accent-color, #217346);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-secondary, #666);
  min-width: 100px;
  text-align: center;
}

.zoom-level {
  font-size: 13px;
  color: var(--text-secondary, #666);
  min-width: 50px;
  text-align: center;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color, #e0e0e0);
  margin: 0 8px;
}

.print-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setup-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: none;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.setup-btn:hover {
  background: var(--bg-hover, #f5f5f5);
  border-color: var(--accent-color, #217346);
  color: var(--accent-color, #217346);
}

/* Content Area */
.print-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Sidebar */
.print-sidebar {
  width: 280px;
  background: var(--bg-primary, #fff);
  border-right: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e8e8e8);
}

.sidebar-section h3 {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item > label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 8px;
}

.setting-item select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.setting-item select:focus {
  border-color: var(--accent-color, #217346);
}

.orientation-btns {
  display: flex;
  gap: 8px;
}

.orientation-btns button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.orientation-btns button:hover {
  border-color: var(--accent-color, #217346);
}

.orientation-btns button.active {
  background: var(--accent-light, #e8f5e9);
  border-color: var(--accent-color, #217346);
  color: var(--accent-color, #217346);
}

.rotate-90 {
  transform: rotate(90deg);
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-color, #217346);
}

.scale-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.scale-input input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  text-align: center;
}

/* Print Actions */
.print-actions {
  padding: 16px;
  margin-top: auto;
  border-top: 1px solid var(--border-color, #e8e8e8);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.print-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.print-btn.primary {
  background: var(--accent-color, #217346);
  border: none;
  color: white;
}

.print-btn.primary:hover {
  background: var(--accent-hover, #185a37);
}

.print-btn.secondary {
  background: none;
  border: 1px solid var(--border-color, #ddd);
  color: var(--text-secondary, #666);
}

.print-btn.secondary:hover {
  border-color: var(--accent-color, #217346);
  color: var(--accent-color, #217346);
}

/* Preview Area */
.preview-area {
  flex: 1;
  overflow: auto;
  padding: 40px;
  display: flex;
  justify-content: center;
  background: var(--bg-secondary, #e8e8e8);
}

.preview-container {
  transition: transform 0.2s;
}

.preview-page {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
}

/* Preview Canvas */
.print-preview-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  font-size: 12px;
}

.page-header,
.page-footer {
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 10px;
  color: var(--text-muted, #888);
}

.header-left, .footer-left { text-align: left; flex: 1; }
.header-center, .footer-center { text-align: center; flex: 1; }
.header-right, .footer-right { text-align: right; flex: 1; }

.page-content {
  flex: 1;
  overflow: hidden;
}

.print-table {
  border-collapse: collapse;
  font-size: 11px;
}

.print-table th,
.print-table td {
  padding: 4px 8px;
  min-width: 60px;
}

.row-header,
.col-header {
  background: #f5f5f5;
  font-weight: 500;
  color: #666;
  font-size: 10px;
}

.corner-header {
  background: #f5f5f5;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted, #888);
}

/* Page Setup Dialog */
.page-setup-dialog {
  width: 500px;
}

.page-setup-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.page-setup-tabs button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary, #666);
  transition: all 0.15s;
}

.page-setup-tabs button:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.03));
}

.page-setup-tabs button.active {
  color: var(--accent-color, #217346);
  border-bottom-color: var(--accent-color, #217346);
}

.tab-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group > label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-bottom: 8px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
}

.margins-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.margin-input label {
  display: block;
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-bottom: 4px;
}

.margin-input input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  text-align: center;
}

.center-options {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-footer-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.header-footer-inputs input {
  padding: 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 12px;
}

.insert-codes {
  margin-top: 16px;
}

.insert-codes > label {
  display: block;
  font-size: 12px;
  color: var(--text-muted, #888);
  margin-bottom: 8px;
}

.code-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.code-btn {
  padding: 4px 8px;
  background: var(--bg-secondary, #f5f5f5);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.code-btn:hover {
  background: var(--accent-light, #e8f5e9);
  border-color: var(--accent-color, #217346);
}

/* Dark Mode */
[data-theme="dark"] .print-preview-dialog,
[data-theme="dark"] .print-sidebar,
[data-theme="dark"] .print-header {
  background: var(--bg-primary-dark, #1e1e1e);
}

[data-theme="dark"] .preview-area {
  background: var(--bg-secondary-dark, #2a2a2a);
}

[data-theme="dark"] .preview-page {
  background: #fff;
}

/* Print Media Query */
@media print {
  .print-preview-overlay {
    display: none;
  }
  
  body * {
    visibility: hidden;
  }
  
  .print-preview-canvas,
  .print-preview-canvas * {
    visibility: visible;
  }
  
  .print-preview-canvas {
    position: absolute;
    left: 0;
    top: 0;
  }
}
```

---

## 📄 File 7: `src/components/Print/index.ts`

```typescript
export { PrintPreviewDialog } from './PrintPreviewDialog';
export { PageSetupDialog } from './PageSetupDialog';
export { PrintPreviewCanvas } from './PrintPreviewCanvas';
```

---

## 🔗 Integration

### Add Print Button to Toolbar

```tsx
// In toolbar or File menu
<button onClick={() => setShowPrintPreview(true)}>
  <Printer size={16} />
  Print
</button>

// Keyboard shortcut
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      setShowPrintPreview(true);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## ✅ Implementation Checklist

### Day 1
- [ ] `src/types/print.ts`
- [ ] `src/stores/printStore.ts`
- [ ] `src/components/Print/PrintPreviewDialog.tsx`
- [ ] `src/components/Print/PageSetupDialog.tsx`

### Day 2
- [ ] `src/components/Print/PrintPreviewCanvas.tsx`
- [ ] `src/components/Print/Print.css`
- [ ] `src/components/Print/index.ts`
- [ ] Keyboard shortcut (Ctrl+P)
- [ ] Integration with toolbar
- [ ] Dark mode testing

---

**Estimated Time:** 2 days  
**Score Impact:** +0.5%
