import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useWorkbookStore } from './workbookStore';
import { CellFormat, getCellKey } from '../types/cell';

interface FormatState {
  // Current format (reflects selected cell or format to apply)
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textColor: string;
  backgroundColor: string;
  align: 'left' | 'center' | 'right';
  numberFormat: string;
  textRotation: number;
  verticalText: boolean;

  // Actions to set individual format properties
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setAlign: (align: 'left' | 'center' | 'right') => void;
  setNumberFormat: (format: string) => void;
  setTextRotation: (angle: number, vertical?: boolean) => void;

  // Bulk operations
  applyCurrentFormat: () => void;
  clearFormat: () => void;
  syncFromCell: () => void;

  // Direct format application
  applyFormat: (format: Partial<CellFormat>) => void;
}

// Default format values
const defaultFormat = {
  fontFamily: 'Calibri',
  fontSize: 11,
  bold: false,
  italic: false,
  underline: false,
  textColor: '#000000',
  backgroundColor: '#FFFFFF',
  align: 'left' as const,
  numberFormat: 'general',
  textRotation: 0,
  verticalText: false,
};

export const useFormatStore = create<FormatState>()(
  subscribeWithSelector((set, get) => ({
    ...defaultFormat,

    // Set font family and apply to selection
    setFontFamily: (fontFamily) => {
      set({ fontFamily });
      get().applyFormat({ fontFamily });
    },

    // Set font size and apply to selection
    setFontSize: (fontSize) => {
      set({ fontSize });
      get().applyFormat({ fontSize });
    },

    // Toggle bold and apply to selection
    toggleBold: () => {
      const newBold = !get().bold;
      set({ bold: newBold });
      get().applyFormat({ bold: newBold });
    },

    // Toggle italic and apply to selection
    toggleItalic: () => {
      const newItalic = !get().italic;
      set({ italic: newItalic });
      get().applyFormat({ italic: newItalic });
    },

    // Toggle underline and apply to selection
    toggleUnderline: () => {
      const newUnderline = !get().underline;
      set({ underline: newUnderline });
      get().applyFormat({ underline: newUnderline });
    },

    // Set text color and apply to selection
    setTextColor: (textColor) => {
      set({ textColor });
      get().applyFormat({ textColor });
    },

    // Set background color and apply to selection
    setBackgroundColor: (backgroundColor) => {
      set({ backgroundColor });
      get().applyFormat({ backgroundColor });
    },

    // Set alignment and apply to selection
    setAlign: (align) => {
      set({ align });
      get().applyFormat({ align });
    },

    // Set number format and apply to selection
    setNumberFormat: (numberFormat) => {
      set({ numberFormat });
      get().applyFormat({ numberFormat });
    },

    // Set text rotation and apply to selection
    setTextRotation: (textRotation, verticalText = false) => {
      set({ textRotation, verticalText });
      get().applyFormat({ textRotation, verticalText });
    },

    // Apply current format state to the selected cell(s)
    applyCurrentFormat: () => {
      const state = get();
      get().applyFormat({
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        bold: state.bold,
        italic: state.italic,
        underline: state.underline,
        textColor: state.textColor,
        backgroundColor: state.backgroundColor,
        align: state.align,
        numberFormat: state.numberFormat,
        textRotation: state.textRotation,
        verticalText: state.verticalText,
      });
    },

    // Clear format from the selected cell(s)
    clearFormat: () => {
      const workbook = useWorkbookStore.getState();
      workbook.clearFormat();
      set({ ...defaultFormat });
    },

    // Sync format state from the currently selected cell
    syncFromCell: () => {
      const workbook = useWorkbookStore.getState();
      const { selectedCell, activeSheetId, sheets } = workbook;

      if (!selectedCell || !activeSheetId) {
        set({ ...defaultFormat });
        return;
      }

      const sheet = sheets[activeSheetId];
      if (!sheet) {
        set({ ...defaultFormat });
        return;
      }

      const cellKey = getCellKey(selectedCell.row, selectedCell.col);
      const cell = sheet.cells[cellKey];
      const format = cell?.format;

      if (format) {
        set({
          fontFamily: format.fontFamily ?? defaultFormat.fontFamily,
          fontSize: format.fontSize ?? defaultFormat.fontSize,
          bold: format.bold ?? defaultFormat.bold,
          italic: format.italic ?? defaultFormat.italic,
          underline: format.underline ?? defaultFormat.underline,
          textColor: format.textColor ?? defaultFormat.textColor,
          backgroundColor: format.backgroundColor ?? defaultFormat.backgroundColor,
          align: format.align ?? defaultFormat.align,
          numberFormat: format.numberFormat ?? defaultFormat.numberFormat,
          textRotation: format.textRotation ?? defaultFormat.textRotation,
          verticalText: format.verticalText ?? defaultFormat.verticalText,
        });
      } else {
        set({ ...defaultFormat });
      }
    },

    // Apply format to selected cell(s) in workbook
    applyFormat: (format) => {
      const workbook = useWorkbookStore.getState();
      workbook.applyFormat(format);
    },
  }))
);

// Subscribe to cell selection changes to sync format state
useWorkbookStore.subscribe(
  (state) => state.selectedCell,
  () => {
    useFormatStore.getState().syncFromCell();
  }
);

// Subscribe to active sheet changes
useWorkbookStore.subscribe(
  (state) => state.activeSheetId,
  () => {
    useFormatStore.getState().syncFromCell();
  }
);

// Selector hooks for common use cases
export const useFontFormat = () => useFormatStore((state) => ({
  fontFamily: state.fontFamily,
  fontSize: state.fontSize,
  bold: state.bold,
  italic: state.italic,
  underline: state.underline,
  setFontFamily: state.setFontFamily,
  setFontSize: state.setFontSize,
  toggleBold: state.toggleBold,
  toggleItalic: state.toggleItalic,
  toggleUnderline: state.toggleUnderline,
}));

export const useColorFormat = () => useFormatStore((state) => ({
  textColor: state.textColor,
  backgroundColor: state.backgroundColor,
  setTextColor: state.setTextColor,
  setBackgroundColor: state.setBackgroundColor,
}));

export const useAlignFormat = () => useFormatStore((state) => ({
  align: state.align,
  setAlign: state.setAlign,
}));
