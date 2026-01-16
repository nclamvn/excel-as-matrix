// ============================================================
// PAGE LAYOUT STORE - Zustand State Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PageLayoutSettings,
  PageMargins,
  PageOrientation,
  PageSize,
  PrintTitles,
  PageBreak,
  SheetBackground,
  MARGIN_PRESETS,
  PAGE_SIZES,
} from '../types/pageLayout';

interface PageLayoutStore {
  sheetSettings: Record<string, PageLayoutSettings>;
  activeSheetId: string;

  getSettings: (sheetId?: string) => PageLayoutSettings;
  setMargins: (margins: PageMargins, sheetId?: string) => void;
  applyMarginPreset: (presetName: string, sheetId?: string) => void;
  setOrientation: (orientation: PageOrientation, sheetId?: string) => void;
  setPageSize: (size: PageSize, sheetId?: string) => void;
  setCustomSize: (width: number, height: number, sheetId?: string) => void;
  setPrintArea: (range: string, sheetId?: string) => void;
  clearPrintArea: (sheetId?: string) => void;
  setPrintTitles: (titles: Partial<PrintTitles>, sheetId?: string) => void;
  clearPrintTitles: (sheetId?: string) => void;
  insertPageBreak: (type: 'row' | 'column', position: number, sheetId?: string) => void;
  removePageBreak: (type: 'row' | 'column', position: number, sheetId?: string) => void;
  removeAllPageBreaks: (sheetId?: string) => void;
  setBackground: (background: SheetBackground, sheetId?: string) => void;
  clearBackground: (sheetId?: string) => void;
  setScaling: (type: 'none' | 'fitToPage' | 'percentage', value: number, sheetId?: string) => void;
  setGridlines: (show: boolean, sheetId?: string) => void;
  setHeadings: (show: boolean, sheetId?: string) => void;
  setCenterOnPage: (horizontally: boolean, vertically: boolean, sheetId?: string) => void;
  setActiveSheet: (sheetId: string) => void;
  initializeSheet: (sheetId: string) => void;
  copySettings: (fromSheetId: string, toSheetId: string) => void;
}

const DEFAULT_SETTINGS: PageLayoutSettings = {
  margins: MARGIN_PRESETS[0].margins,
  orientation: 'portrait',
  size: PAGE_SIZES[0],
  printArea: null,
  printTitles: null,
  pageBreaks: [],
  background: { type: 'none' },
  scaling: { type: 'none', value: 100 },
  gridlines: true,
  headings: true,
  blackAndWhite: false,
  draftQuality: false,
  pageOrder: 'downThenOver',
  centerOnPage: { horizontally: false, vertically: false },
};

export const usePageLayoutStore = create<PageLayoutStore>()(
  persist(
    (set, get) => ({
      sheetSettings: {},
      activeSheetId: 'sheet1',

      getSettings: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        return get().sheetSettings[id] || { ...DEFAULT_SETTINGS };
      },

      setMargins: (margins, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              margins,
            },
          },
        }));
      },

      applyMarginPreset: (presetName, sheetId) => {
        const preset = MARGIN_PRESETS.find((p) => p.name === presetName);
        if (preset) {
          get().setMargins(preset.margins, sheetId);
        }
      },

      setOrientation: (orientation, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              orientation,
            },
          },
        }));
      },

      setPageSize: (size, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              size,
            },
          },
        }));
      },

      setCustomSize: (width, height, sheetId) => {
        const customSize: PageSize = {
          name: 'custom',
          width,
          height,
          label: `Custom (${width}" × ${height}")`,
        };
        get().setPageSize(customSize, sheetId);
      },

      setPrintArea: (range, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              printArea: { sheetId: id, range },
            },
          },
        }));
      },

      clearPrintArea: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              printArea: null,
            },
          },
        }));
      },

      setPrintTitles: (titles, sheetId) => {
        const id = sheetId || get().activeSheetId;
        const current = get().getSettings(id).printTitles;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              printTitles: {
                sheetId: id,
                repeatRows: titles.repeatRows ?? current?.repeatRows,
                repeatCols: titles.repeatCols ?? current?.repeatCols,
              },
            },
          },
        }));
      },

      clearPrintTitles: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              printTitles: null,
            },
          },
        }));
      },

      insertPageBreak: (type, position, sheetId) => {
        const id = sheetId || get().activeSheetId;
        const newBreak: PageBreak = { type, position, sheetId: id };
        set((state) => {
          const current = state.sheetSettings[id] || DEFAULT_SETTINGS;
          const exists = current.pageBreaks.some(
            (b) => b.type === type && b.position === position
          );
          if (exists) return state;

          return {
            sheetSettings: {
              ...state.sheetSettings,
              [id]: {
                ...current,
                pageBreaks: [...current.pageBreaks, newBreak],
              },
            },
          };
        });
      },

      removePageBreak: (type, position, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => {
          const current = state.sheetSettings[id] || DEFAULT_SETTINGS;
          return {
            sheetSettings: {
              ...state.sheetSettings,
              [id]: {
                ...current,
                pageBreaks: current.pageBreaks.filter(
                  (b) => !(b.type === type && b.position === position)
                ),
              },
            },
          };
        });
      },

      removeAllPageBreaks: (sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              pageBreaks: [],
            },
          },
        }));
      },

      setBackground: (background, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              background,
            },
          },
        }));
      },

      clearBackground: (sheetId) => {
        get().setBackground({ type: 'none' }, sheetId);
      },

      setScaling: (type, value, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              scaling: { type, value },
            },
          },
        }));
      },

      setGridlines: (show, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              gridlines: show,
            },
          },
        }));
      },

      setHeadings: (show, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              headings: show,
            },
          },
        }));
      },

      setCenterOnPage: (horizontally, vertically, sheetId) => {
        const id = sheetId || get().activeSheetId;
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [id]: {
              ...(state.sheetSettings[id] || DEFAULT_SETTINGS),
              centerOnPage: { horizontally, vertically },
            },
          },
        }));
      },

      setActiveSheet: (sheetId) => {
        set({ activeSheetId: sheetId });
        get().initializeSheet(sheetId);
      },

      initializeSheet: (sheetId) => {
        set((state) => {
          if (state.sheetSettings[sheetId]) return state;
          return {
            sheetSettings: {
              ...state.sheetSettings,
              [sheetId]: { ...DEFAULT_SETTINGS },
            },
          };
        });
      },

      copySettings: (fromSheetId, toSheetId) => {
        const fromSettings = get().getSettings(fromSheetId);
        set((state) => ({
          sheetSettings: {
            ...state.sheetSettings,
            [toSheetId]: { ...fromSettings },
          },
        }));
      },
    }),
    {
      name: 'excelai-page-layout',
    }
  )
);
