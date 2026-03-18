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
  PrintTitles,
  PageSize,
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
  setPageSize: (sheetId: string, pageSize: PageSize) => void;
  setGridlines: (sheetId: string, enabled: boolean) => void;
  setHeadings: (sheetId: string, enabled: boolean) => void;
  setPrintTitles: (sheetId: string, titles: PrintTitles) => void;
  setBackground: (sheetId: string, background: string | undefined) => void;

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

      setPageSize: (sheetId, pageSize) => {
        get().updateSettings(sheetId, { paperSize: pageSize.id });
      },

      setGridlines: (sheetId, enabled) => {
        get().updateSettings(sheetId, { printGridlines: enabled });
      },

      setHeadings: (sheetId, enabled) => {
        get().updateSettings(sheetId, { printRowColHeaders: enabled });
      },

      setPrintTitles: (sheetId, titles) => {
        get().updateSettings(sheetId, { printTitles: titles });
      },

      setBackground: (sheetId, background) => {
        get().updateSettings(sheetId, { background });
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

        // Ensure at least one page
        if (pages.length === 0) {
          pages.push({
            pageNumber: 1,
            startRow: 0,
            endRow: Math.min(totalRows - 1, 49),
            startCol: 0,
            endCol: totalCols - 1,
          });
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
