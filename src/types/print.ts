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

  // Print Titles
  printTitles?: PrintTitles;

  // Background
  background?: string;  // URL or data URL for background image

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
export const HEADER_FOOTER_CODES: Record<string, string> = {
  '&[Page]': 'Page Number',
  '&[Pages]': 'Total Pages',
  '&[Date]': 'Current Date',
  '&[Time]': 'Current Time',
  '&[File]': 'File Name',
  '&[Sheet]': 'Sheet Name',
};

// Page Size (for SizeDropdown compatibility)
export interface PageSize {
  id: PaperSize;
  name: string;
  width: number;
  height: number;
}

export const PAGE_SIZES: PageSize[] = [
  { id: 'letter', name: 'Letter', width: 8.5, height: 11 },
  { id: 'legal', name: 'Legal', width: 8.5, height: 14 },
  { id: 'a4', name: 'A4', width: 8.27, height: 11.69 },
  { id: 'a3', name: 'A3', width: 11.69, height: 16.54 },
  { id: 'tabloid', name: 'Tabloid', width: 11, height: 17 },
];

// Print titles
export interface PrintTitles {
  repeatRows?: string;
  repeatCols?: string;
}
