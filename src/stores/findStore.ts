import { create } from 'zustand';
import { useWorkbookStore } from './workbookStore';
import { getCellKey } from '../types/cell';
import { loggers } from '@/utils/logger';

export interface FindMatch {
  sheetId: string;
  row: number;
  col: number;
  value: string;
  matchStart: number;
  matchLength: number;
}

export interface FindOptions {
  matchCase: boolean;
  matchWholeCell: boolean;
  useRegex: boolean;
  searchIn: 'values' | 'formulas' | 'both';
  searchScope: 'sheet' | 'workbook';
}

interface FindState {
  isOpen: boolean;
  isReplaceMode: boolean;
  searchText: string;
  replaceText: string;
  options: FindOptions;
  matches: FindMatch[];
  currentMatchIndex: number;
  isSearching: boolean;

  open: (replaceMode?: boolean) => void;
  close: () => void;
  setSearchText: (text: string) => void;
  setReplaceText: (text: string) => void;
  setOptions: (options: Partial<FindOptions>) => void;
  search: () => Promise<void>;
  findNext: () => void;
  findPrevious: () => void;
  replaceCurrent: () => void;
  replaceAll: () => void;
  clearMatches: () => void;
}

export const useFindStore = create<FindState>((set, get) => ({
  isOpen: false,
  isReplaceMode: false,
  searchText: '',
  replaceText: '',
  options: {
    matchCase: false,
    matchWholeCell: false,
    useRegex: false,
    searchIn: 'values',
    searchScope: 'sheet',
  },
  matches: [],
  currentMatchIndex: -1,
  isSearching: false,

  open: (replaceMode = false) => set({ isOpen: true, isReplaceMode: replaceMode }),

  close: () => set({ isOpen: false }),

  setSearchText: (text) => set({ searchText: text, matches: [], currentMatchIndex: -1 }),

  setReplaceText: (text) => set({ replaceText: text }),

  setOptions: (options) =>
    set((state) => ({
      options: { ...state.options, ...options },
      matches: [],
      currentMatchIndex: -1,
    })),

  search: async () => {
    const { searchText, options } = get();
    if (!searchText.trim()) {
      set({ matches: [], currentMatchIndex: -1 });
      return;
    }

    set({ isSearching: true });

    try {
      let pattern: RegExp;
      if (options.useRegex) {
        pattern = new RegExp(searchText, options.matchCase ? 'g' : 'gi');
      } else {
        const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patternStr = options.matchWholeCell ? `^${escaped}$` : escaped;
        pattern = new RegExp(patternStr, options.matchCase ? 'g' : 'gi');
      }

      const matches = await searchCells(pattern, options);

      set({
        matches,
        currentMatchIndex: matches.length > 0 ? 0 : -1,
        isSearching: false,
      });

      if (matches.length > 0) {
        navigateToCell(matches[0].sheetId, matches[0].row, matches[0].col);
      }
    } catch (error) {
      loggers.store.error('Search failed:', error);
      set({ isSearching: false });
    }
  },

  findNext: () => {
    const { matches, currentMatchIndex } = get();
    if (matches.length === 0) return;

    const nextIndex = (currentMatchIndex + 1) % matches.length;
    set({ currentMatchIndex: nextIndex });

    const match = matches[nextIndex];
    navigateToCell(match.sheetId, match.row, match.col);
  },

  findPrevious: () => {
    const { matches, currentMatchIndex } = get();
    if (matches.length === 0) return;

    const prevIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    set({ currentMatchIndex: prevIndex });

    const match = matches[prevIndex];
    navigateToCell(match.sheetId, match.row, match.col);
  },

  replaceCurrent: () => {
    const { matches, currentMatchIndex, replaceText, searchText, options } = get();
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const match = matches[currentMatchIndex];
    replaceCell(match.sheetId, match.row, match.col, searchText, replaceText, options);

    const newMatches = matches.filter((_, i) => i !== currentMatchIndex);
    const newIndex = Math.min(currentMatchIndex, newMatches.length - 1);

    set({ matches: newMatches, currentMatchIndex: newIndex });

    if (newMatches.length > 0 && newIndex >= 0) {
      navigateToCell(newMatches[newIndex].sheetId, newMatches[newIndex].row, newMatches[newIndex].col);
    }
  },

  replaceAll: () => {
    const { matches, replaceText, searchText, options } = get();

    const sortedMatches = [...matches].sort((a, b) => {
      if (a.sheetId !== b.sheetId) return a.sheetId.localeCompare(b.sheetId);
      if (a.row !== b.row) return b.row - a.row;
      return b.col - a.col;
    });

    for (const match of sortedMatches) {
      replaceCell(match.sheetId, match.row, match.col, searchText, replaceText, options);
    }

    set({ matches: [], currentMatchIndex: -1 });
  },

  clearMatches: () => set({ matches: [], currentMatchIndex: -1 }),
}));

async function searchCells(pattern: RegExp, options: FindOptions): Promise<FindMatch[]> {
  const workbookStore = useWorkbookStore.getState();
  const { sheets, activeSheetId } = workbookStore;
  const matches: FindMatch[] = [];

  const sheetsToSearch = options.searchScope === 'workbook'
    ? Object.entries(sheets)
    : Object.entries(sheets).filter(([id]) => id === activeSheetId);

  for (const [sheetId, sheet] of sheetsToSearch) {
    for (const [key, cell] of Object.entries(sheet.cells)) {
      const [row, col] = key.split(':').map(Number);

      let searchValue = '';
      if (options.searchIn === 'values' || options.searchIn === 'both') {
        searchValue = cell.displayValue || String(cell.value ?? '');
      }
      if (options.searchIn === 'formulas' || options.searchIn === 'both') {
        if (cell.formula) {
          searchValue += ' ' + cell.formula;
        }
      }

      pattern.lastIndex = 0;
      const match = pattern.exec(searchValue);
      if (match) {
        matches.push({
          sheetId,
          row,
          col,
          value: searchValue,
          matchStart: match.index,
          matchLength: match[0].length,
        });
      }
    }
  }

  return matches.sort((a, b) => {
    if (a.sheetId !== b.sheetId) return a.sheetId.localeCompare(b.sheetId);
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
}

function navigateToCell(sheetId: string, row: number, col: number) {
  const workbookStore = useWorkbookStore.getState();

  if (workbookStore.activeSheetId !== sheetId) {
    workbookStore.setActiveSheet(sheetId);
  }

  workbookStore.setSelectedCell({ row, col });
}

function replaceCell(
  sheetId: string,
  row: number,
  col: number,
  searchText: string,
  replaceText: string,
  options: FindOptions
) {
  const workbookStore = useWorkbookStore.getState();
  const sheet = workbookStore.sheets[sheetId];
  if (!sheet) return;

  const cell = sheet.cells[getCellKey(row, col)];
  if (!cell) return;

  const currentValue = String(cell.value ?? '');

  let pattern: RegExp;
  if (options.useRegex) {
    pattern = new RegExp(searchText, options.matchCase ? 'g' : 'gi');
  } else {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = options.matchWholeCell ? `^${escaped}$` : escaped;
    pattern = new RegExp(patternStr, options.matchCase ? 'g' : 'gi');
  }

  const newValue = currentValue.replace(pattern, replaceText);
  workbookStore.setCellValue(sheetId, row, col, newValue);
}
