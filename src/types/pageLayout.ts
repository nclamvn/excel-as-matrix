// ============================================================
// PAGE LAYOUT TYPES
// ============================================================

export interface PageMargins {
  top: number;      // inches
  bottom: number;
  left: number;
  right: number;
  header: number;
  footer: number;
}

export interface PageSize {
  name: string;
  width: number;    // inches
  height: number;
  label: string;
}

export type PageOrientation = 'portrait' | 'landscape';

export interface PrintArea {
  sheetId: string;
  range: string;    // e.g., "A1:H50"
}

export interface PrintTitles {
  sheetId: string;
  repeatRows?: string;  // e.g., "1:2" (rows 1-2)
  repeatCols?: string;  // e.g., "A:B" (columns A-B)
}

export interface PageBreak {
  type: 'row' | 'column';
  position: number;
  sheetId: string;
}

export interface SheetBackground {
  type: 'none' | 'color' | 'image';
  color?: string;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'tile';
}

export interface PageLayoutSettings {
  margins: PageMargins;
  orientation: PageOrientation;
  size: PageSize;
  printArea: PrintArea | null;
  printTitles: PrintTitles | null;
  pageBreaks: PageBreak[];
  background: SheetBackground;
  scaling: {
    type: 'none' | 'fitToPage' | 'percentage';
    value: number;
    fitWidth?: number;
    fitHeight?: number;
  };
  gridlines: boolean;
  headings: boolean;
  blackAndWhite: boolean;
  draftQuality: boolean;
  pageOrder: 'downThenOver' | 'overThenDown';
  centerOnPage: {
    horizontally: boolean;
    vertically: boolean;
  };
}

// Preset margins
export const MARGIN_PRESETS: { name: string; margins: PageMargins }[] = [
  {
    name: 'Normal',
    margins: { top: 0.75, bottom: 0.75, left: 0.7, right: 0.7, header: 0.3, footer: 0.3 }
  },
  {
    name: 'Wide',
    margins: { top: 1, bottom: 1, left: 1, right: 1, header: 0.5, footer: 0.5 }
  },
  {
    name: 'Narrow',
    margins: { top: 0.75, bottom: 0.75, left: 0.25, right: 0.25, header: 0.3, footer: 0.3 }
  },
];

// Paper sizes
export const PAGE_SIZES: PageSize[] = [
  { name: 'letter', width: 8.5, height: 11, label: 'Letter (8.5" × 11")' },
  { name: 'legal', width: 8.5, height: 14, label: 'Legal (8.5" × 14")' },
  { name: 'a4', width: 8.27, height: 11.69, label: 'A4 (210mm × 297mm)' },
  { name: 'a3', width: 11.69, height: 16.54, label: 'A3 (297mm × 420mm)' },
  { name: 'a5', width: 5.83, height: 8.27, label: 'A5 (148mm × 210mm)' },
  { name: 'b4', width: 9.84, height: 13.9, label: 'B4 (250mm × 353mm)' },
  { name: 'b5', width: 6.93, height: 9.84, label: 'B5 (176mm × 250mm)' },
  { name: 'executive', width: 7.25, height: 10.5, label: 'Executive (7.25" × 10.5")' },
  { name: 'tabloid', width: 11, height: 17, label: 'Tabloid (11" × 17")' },
];
