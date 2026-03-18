// ═══════════════════════════════════════════════════════════════════════════
// CANVAS GRID - High Performance Spreadsheet Rendering
// Uses HTML5 Canvas for instant feedback like Excel/WPS
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { useProtectionStore } from '../../stores/protectionStore';
import { loggers } from '@/utils/logger';
import { useValidationStore } from '../../stores/validationStore';
import { CellEditor } from './CellEditor';
import { getCellKey } from '../../types/cell';
import { FloatingAIButton } from '../AI/FloatingAIButton';
import { UserCursors } from '../Collab/UserCursors';
import { useScreenReaderAnnounce } from '../../hooks/useScreenReaderAnnounce';
import { MAX_COLS, MAX_ROWS } from '../../constants/grid';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { evaluateRule, calculateRangeStats, calculateDataBarWidth, calculateColorScaleColor, calculateIconSetIcon } from '../../utils/conditionalFormatting/evaluator';
import { ICON_SET_DEFINITIONS } from '../../types/conditionalFormatting';

// Theme colors
const THEME_COLORS = {
  light: {
    background: '#ffffff',
    headerBg: '#f5f5f5',
    gridLine: '#e5e5e5',
    headerBorder: '#d4d4d4',
    text: '#171717',
    headerText: '#525252',
    selectedHeader: '#059669',
    selectedHeaderText: '#ffffff',
    rangeHeader: '#d1fae5',
    rangeHeaderText: '#059669',
    selection: '#059669',
    rangeSelection: 'rgba(5, 150, 105, 0.15)',
  },
  dark: {
    background: '#1a1a1a',
    headerBg: '#262626',
    gridLine: '#404040',
    headerBorder: '#525252',
    text: '#e5e5e5',
    headerText: '#a3a3a3',
    selectedHeader: '#059669',
    selectedHeaderText: '#ffffff',
    rangeHeader: '#064e3b',
    rangeHeaderText: '#6ee7b7',
    selection: '#10b981',
    rangeSelection: 'rgba(16, 185, 129, 0.2)',
  },
};

interface CanvasGridProps {
  workbookId: string;
  sheetId: string;
}

// Base dimensions (at 100% zoom)
const BASE_CELL_WIDTH = 100;
const BASE_CELL_HEIGHT = 24;
const BASE_HEADER_WIDTH = 50;
const BASE_HEADER_HEIGHT = 24;
// MAX_ROWS and MAX_COLS imported from constants/grid.ts

// Format number for display with thousand separators
// TIP-010: Also supports VND format when numberFormat indicates currency
const formatNumberDisplay = (value: number, displayValue: string, numberFormat?: string): string => {
  // If displayValue already looks formatted (has separators or special chars), use it
  if (displayValue && (displayValue.includes(',') || displayValue.includes('₫') || displayValue.includes('%') || displayValue.includes('$'))) {
    return displayValue;
  }

  // TIP-010: VND currency format
  if (numberFormat && (numberFormat.includes('₫') || numberFormat.toLowerCase().includes('vnd'))) {
    const formatted = Math.round(value).toLocaleString('vi-VN');
    return `${formatted} ₫`;
  }

  // For integers and decimals, add thousand separators
  if (Number.isFinite(value)) {
    // Avoid formatting very small numbers or scientific notation
    if (Math.abs(value) >= 1000) {
      const parts = value.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    // For decimals, limit to reasonable precision
    if (!Number.isInteger(value) && displayValue === String(value)) {
      const str = String(value);
      if (str.length > 10) {
        return Number(value.toPrecision(10)).toString();
      }
    }
  }
  return displayValue;
};

// Column letter helper
const getColLetter = (col: number): string => {
  let letter = '';
  let temp = col;
  while (temp >= 0) {
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

export const CanvasGrid: React.FC<CanvasGridProps> = ({ sheetId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerCanvasRef = useRef<HTMLCanvasElement>(null);
  const rowHeaderCanvasRef = useRef<HTMLCanvasElement>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGoToCell, setShowGoToCell] = useState(false);
  const [goToCellValue, setGoToCellValue] = useState('');
  const [hoverTooltip, setHoverTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownState, setDropdownState] = useState<{
    row: number; col: number; options: string[]; x: number; y: number; w: number;
  } | null>(null);

  // Drag state - local for performance
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ row: number; col: number } | null>(null);
  const dragEndRef = useRef<{ row: number; col: number } | null>(null);
  // Force render not needed - canvas updates directly

  // Store selectors
  const sheet = useWorkbookStore(useCallback((state) => state.sheets[sheetId], [sheetId]));
  const zoom = useWorkbookStore((state) => state.zoom);
  const getCellFormula = useWorkbookStore((state) => state.getCellFormula);
  const getCellDisplayValue = useWorkbookStore((state) => state.getCellDisplayValue);
  const updateCell = useWorkbookStore((state) => state.updateCell);
  const setWorkbook = useWorkbookStore((state) => state.setWorkbook);
  const addSheet = useWorkbookStore((state) => state.addSheet);
  const batchUpdateCells = useWorkbookStore((state) => state.batchUpdateCells);
  const sortStore = useWorkbookStore((state) => state.sort);
  const sortConfig = useWorkbookStore((state) => state.sortConfig);

  // Theme
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const colors = THEME_COLORS[resolvedTheme];
  const showToast = useUIStore((state) => state.showToast);

  // Protection & Validation
  const canPerformAction = useProtectionStore((state) => state.canPerformAction);
  const validateCell = useValidationStore((state) => state.validateCell);
  const getRuleForCell = useValidationStore((state) => state.getRuleForCell);
  const getInputMessage = useValidationStore((state) => state.getInputMessage);

  // Calculate scaled dimensions based on zoom
  const zoomFactor = zoom / 100;
  const DEFAULT_CELL_WIDTH = Math.round(BASE_CELL_WIDTH * zoomFactor);
  const CELL_HEIGHT = Math.round(BASE_CELL_HEIGHT * zoomFactor);
  const HEADER_WIDTH = Math.round(BASE_HEADER_WIDTH * zoomFactor);
  const HEADER_HEIGHT = Math.round(BASE_HEADER_HEIGHT * zoomFactor);
  const FONT_SIZE = Math.round(13 * zoomFactor);
  const HEADER_FONT_SIZE = Math.round(12 * zoomFactor);

  // Determine how many columns to actively track widths for.
  // We only need widths up to the furthest column with data or custom width,
  // plus a buffer — capped at MAX_COLS.
  const activeColCount = useMemo(() => {
    let maxDataCol = 26; // minimum 26 (A-Z) even if empty
    if (sheet?.cells) {
      for (const key of Object.keys(sheet.cells)) {
        const c = parseInt(key.split(':')[1]);
        if (c > maxDataCol) maxDataCol = c;
      }
    }
    if (sheet?.columnWidths) {
      for (const c of Object.keys(sheet.columnWidths)) {
        const ci = parseInt(c);
        if (ci > maxDataCol) maxDataCol = ci;
      }
    }
    // Add buffer of 20 columns beyond data, cap at MAX_COLS
    return Math.min(MAX_COLS, maxDataCol + 20);
  }, [sheet?.cells, sheet?.columnWidths]);

  // Compute per-column widths (from sheet.columnWidths or default)
  const colWidths = useMemo(() => {
    const widths: number[] = [];
    for (let c = 0; c < activeColCount; c++) {
      const customWidth = sheet?.columnWidths?.[c];
      widths.push(customWidth ? Math.round(customWidth * zoomFactor) : DEFAULT_CELL_WIDTH);
    }
    return widths;
  }, [sheet?.columnWidths, DEFAULT_CELL_WIDTH, zoomFactor, activeColCount]);

  // Get width for a column (falls back to default for columns beyond activeColCount)
  const getColWidth = useCallback((col: number): number => {
    if (col < colWidths.length) return colWidths[col];
    const customWidth = sheet?.columnWidths?.[col];
    return customWidth ? Math.round(customWidth * zoomFactor) : DEFAULT_CELL_WIDTH;
  }, [colWidths, sheet?.columnWidths, zoomFactor, DEFAULT_CELL_WIDTH]);

  // Prefix-sum offsets for fast column position lookup
  const colOffsets = useMemo(() => {
    const offsets: number[] = [0];
    for (let c = 0; c < activeColCount; c++) {
      offsets.push(offsets[c] + colWidths[c]);
    }
    return offsets;
  }, [colWidths, activeColCount]);

  // Get offset for a column (computes on-the-fly for columns beyond activeColCount)
  const getColOffset = useCallback((col: number): number => {
    if (col < colOffsets.length) return colOffsets[col];
    // Compute from the last known offset
    let offset = colOffsets[colOffsets.length - 1];
    for (let c = colOffsets.length - 1; c < col; c++) {
      offset += getColWidth(c);
    }
    return offset;
  }, [colOffsets, getColWidth]);

  const totalWidth = useMemo(() => {
    // Total width = offset of last active column + remaining columns at default width
    const activeWidth = colOffsets[activeColCount] || 0;
    const remainingCols = MAX_COLS - activeColCount;
    return activeWidth + remainingCols * DEFAULT_CELL_WIDTH;
  }, [colOffsets, activeColCount, DEFAULT_CELL_WIDTH]);

  // Find column index from x position (pixel coordinate in scrollable area)
  const getColFromX = useCallback((x: number): number => {
    // Binary search through known offsets first
    if (x < 0) return 0;
    const knownCount = colOffsets.length - 1; // activeColCount
    // Check within pre-computed offsets
    for (let c = 0; c < knownCount; c++) {
      if (x < colOffsets[c + 1]) return c;
    }
    // Beyond pre-computed: compute from last known offset
    let offset = colOffsets[knownCount];
    for (let c = knownCount; c < MAX_COLS; c++) {
      offset += getColWidth(c);
      if (x < offset) return c;
    }
    return MAX_COLS - 1;
  }, [colOffsets, getColWidth]);

  // Find first visible column from scroll position
  const getFirstVisibleCol = useCallback((scrollX: number): number => {
    return getColFromX(scrollX);
  }, [getColFromX]);

  const selectedCell = useSelectionStore((state) => state.selectedCell);
  const { announceCell } = useScreenReaderAnnounce();
  const selectionRange = useSelectionStore((state) => state.selectionRange);
  const isEditing = useSelectionStore((state) => state.isEditing);
  const setSelectedCell = useSelectionStore((state) => state.setSelectedCell);
  const setSelectionRange = useSelectionStore((state) => state.setSelectionRange);
  const setIsEditing = useSelectionStore((state) => state.setIsEditing);
  const moveSelection = useSelectionStore((state) => state.moveSelection);
  const expandSelection = useSelectionStore((state) => state.expandSelection);
  const selectRange = useSelectionStore((state) => state.selectRange);

  // Get cell position from mouse coordinates
  const getCellFromMouse = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left + scrollLeft;
    const y = clientY - rect.top + scrollTop;
    const col = getColFromX(x);
    const row = Math.floor(y / CELL_HEIGHT);
    if (row < 0 || col < 0 || row >= MAX_ROWS || col >= MAX_COLS) return null;
    return { row, col };
  }, [scrollLeft, scrollTop, getColFromX, CELL_HEIGHT]);

  // Announce selected cell to screen readers
  useEffect(() => {
    if (!selectedCell || !sheet?.cells) return;
    const key = getCellKey(selectedCell.row, selectedCell.col);
    const cellData = sheet.cells[key];
    const value = cellData?.displayValue || String(cellData?.value ?? '');
    announceCell(selectedCell.col, selectedCell.row, value, cellData?.formula);
  }, [selectedCell?.row, selectedCell?.col]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get cell pixel position for overlays (UserCursors, etc.)
  const getCellPosition = useCallback((row: number, col: number) => {
    const x = getColOffset(col) - scrollLeft;
    const y = row * CELL_HEIGHT - scrollTop;
    const w = getColWidth(col);
    if (x + w < 0 || x > containerSize.width || y + CELL_HEIGHT < 0 || y > containerSize.height) return null;
    return { x, y, width: w, height: CELL_HEIGHT };
  }, [getColOffset, getColWidth, scrollLeft, scrollTop, CELL_HEIGHT, containerSize]);

  // Visible range for UserCursors
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / CELL_HEIGHT);
    const endRow = startRow + Math.ceil(containerSize.height / CELL_HEIGHT) + 1;
    const startCol = getFirstVisibleCol(scrollLeft);
    let endCol = startCol;
    let acc = getColOffset(startCol) - scrollLeft;
    while (endCol < MAX_COLS && acc < containerSize.width) {
      acc += getColWidth(endCol);
      endCol++;
    }
    return {
      rows: { start: startRow, end: endRow },
      cols: { start: startCol, end: endCol },
    };
  }, [scrollTop, scrollLeft, containerSize, CELL_HEIGHT, getFirstVisibleCol, getColOffset, getColWidth]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CANVAS RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  const renderGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerSize.width;
    const height = containerSize.height;

    // Set canvas size with DPR for sharp rendering
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible range
    const startRow = Math.floor(scrollTop / CELL_HEIGHT);
    const startCol = getFirstVisibleCol(scrollLeft);
    const endRow = Math.min(MAX_ROWS, startRow + Math.ceil(height / CELL_HEIGHT) + 1);
    // Find endCol by accumulating widths
    let endCol = startCol;
    let accWidth = getColOffset(startCol) - scrollLeft;
    while (endCol < MAX_COLS && accWidth < width) {
      accWidth += getColWidth(endCol);
      endCol++;
    }
    endCol = Math.min(MAX_COLS, endCol + 1);

    const offsetY = -(scrollTop % CELL_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let col = startCol; col <= endCol && col <= MAX_COLS; col++) {
      const x = getColOffset(col) - scrollLeft + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let row = startRow; row <= endRow; row++) {
      const y = offsetY + (row - startRow) * CELL_HEIGHT + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // ── Conditional Formatting: pre-compute range stats per rule ──
    const cfStore = useConditionalFormattingStore.getState();
    const allCFRules = cfStore.getAllRules(sheetId);
    const cfRangeStats = new Map<string, ReturnType<typeof calculateRangeStats>>();
    if (allCFRules.length > 0 && sheet?.cells) {
      for (const rule of allCFRules) {
        if (!rule.enabled) continue;
        // Parse the rule range to collect cells for stats
        const rangeMatch = rule.range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (!rangeMatch) continue;
        const colToNum = (c: string) => c.split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1;
        const rStartCol = colToNum(rangeMatch[1]);
        const rStartRow = parseInt(rangeMatch[2]) - 1;
        const rEndCol = colToNum(rangeMatch[3]);
        const rEndRow = parseInt(rangeMatch[4]) - 1;
        const rangeCells: { value: unknown; row: number; col: number }[] = [];
        for (let r = rStartRow; r <= rEndRow; r++) {
          for (let c = rStartCol; c <= rEndCol; c++) {
            const cd = sheet.cells[getCellKey(r, c)];
            if (cd) rangeCells.push({ value: cd.value, row: r, col: c });
          }
        }
        cfRangeStats.set(rule.id, calculateRangeStats(rangeCells));
      }
    }

    // ── Validation store for dropdown indicators ──
    const valStore = useValidationStore.getState();

    // Draw cells
    ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = 'middle';

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = getCellKey(row, col);
        const cellData = sheet?.cells[key];
        if (!cellData) {
          // Even empty cells may have validation dropdown indicators
          const valRule = valStore.getRuleForCell(sheetId, row, col);
          if (valRule?.validationType.type === 'list' && valRule.validationType.dropdown) {
            const cw = getColWidth(col);
            const cx = getColOffset(col) - scrollLeft;
            const cy = offsetY + (row - startRow) * CELL_HEIGHT;
            // Draw dropdown arrow
            ctx.save();
            ctx.fillStyle = colors.headerText;
            const ax = cx + cw - 10;
            const ay = cy + CELL_HEIGHT / 2 - 2;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + 6, ay);
            ctx.lineTo(ax + 3, ay + 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          continue;
        }

        const cw = getColWidth(col);
        const x = getColOffset(col) - scrollLeft;
        const y = offsetY + (row - startRow) * CELL_HEIGHT;

        // ── Conditional Formatting: evaluate rules for this cell ──
        let cfBgColor: string | undefined;
        let cfTextColor: string | undefined;
        let cfBold = false;
        let cfItalic = false;
        let cfDataBar: { width: number; isNegative: boolean; color: string } | undefined;
        let cfColorScaleColor: string | undefined;
        let cfIcon: string | undefined;

        if (allCFRules.length > 0) {
          const rules = cfStore.getRulesForCell(row, col, sheetId);
          for (const rule of rules) {
            const stats = cfRangeStats.get(rule.id);
            if (!stats) continue;
            const cellForCF = { value: cellData.value, row, col };
            if (!evaluateRule(rule, cellForCF, stats)) continue;

            // Apply style-based formatting
            if (rule.style) {
              if (rule.style.backgroundColor) cfBgColor = rule.style.backgroundColor;
              if (rule.style.textColor) cfTextColor = rule.style.textColor;
              if (rule.style.fontWeight === 'bold') cfBold = true;
              if (rule.style.fontStyle === 'italic') cfItalic = true;
            }

            // Data bar
            if (rule.type === 'dataBar' && rule.dataBar) {
              const numVal = parseFloat(String(cellData.value));
              if (!isNaN(numVal)) {
                const bar = calculateDataBarWidth(numVal, rule.dataBar, stats);
                cfDataBar = { ...bar, color: bar.isNegative ? rule.dataBar.negativeColor : rule.dataBar.positiveColor };
              }
            }

            // Color scale
            if (rule.type === 'colorScale' && rule.colorScale) {
              const numVal = parseFloat(String(cellData.value));
              if (!isNaN(numVal)) {
                cfColorScaleColor = calculateColorScaleColor(numVal, rule.colorScale, stats);
              }
            }

            // Icon set
            if (rule.type === 'iconSet' && rule.iconSet) {
              const numVal = parseFloat(String(cellData.value));
              if (!isNaN(numVal)) {
                const iconDef = ICON_SET_DEFINITIONS.find(d => d.id === rule.iconSet!.iconStyle);
                if (iconDef) {
                  cfIcon = calculateIconSetIcon(numVal, rule.iconSet, stats, iconDef);
                }
              }
            }

            if (rule.stopIfTrue) break;
          }
        }

        // Cell background: color scale > CF bg > cell format bg
        if (cfColorScaleColor) {
          ctx.fillStyle = cfColorScaleColor;
          ctx.fillRect(x + 1, y + 1, cw - 2, CELL_HEIGHT - 2);
        } else if (cfBgColor) {
          ctx.fillStyle = cfBgColor;
          ctx.fillRect(x + 1, y + 1, cw - 2, CELL_HEIGHT - 2);
        } else if (cellData.format?.backgroundColor) {
          ctx.fillStyle = cellData.format.backgroundColor;
          ctx.fillRect(x + 1, y + 1, cw - 2, CELL_HEIGHT - 2);
        }

        // Data bar rendering (behind text)
        if (cfDataBar && cfDataBar.width > 0) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = cfDataBar.color;
          const barWidth = Math.round((cw - 4) * cfDataBar.width / 100);
          ctx.fillRect(x + 2, y + 2, barWidth, CELL_HEIGHT - 4);
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // Cell text — apply number formatting for readability
        let displayValue = cellData.displayValue || String(cellData.value || '');
        if (typeof cellData.value === 'number') {
          displayValue = formatNumberDisplay(cellData.value, displayValue, cellData.format?.numberFormat);
        }
        if (displayValue) {
          ctx.fillStyle = cfTextColor || cellData.format?.textColor || colors.text;

          // Text alignment
          let textX = x + 4;
          const textY = y + CELL_HEIGHT / 2;

          // If icon set, reserve space for icon on the left
          if (cfIcon) textX += 16;

          if (cellData.format?.align === 'center') {
            ctx.textAlign = 'center';
            textX = x + cw / 2 + (cfIcon ? 8 : 0);
          } else if (cellData.format?.align === 'right' || (typeof cellData.value === 'number' && !cellData.format?.align)) {
            ctx.textAlign = 'right';
            textX = x + cw - 4;
          } else {
            ctx.textAlign = 'left';
          }

          // Bold/Italic (CF overrides format)
          let fontStyle = '';
          if (cfBold || cellData.format?.bold) fontStyle += 'bold ';
          if (cfItalic || cellData.format?.italic) fontStyle += 'italic ';
          ctx.font = `${fontStyle}${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

          // Clip text to cell
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 1, y + 1, cw - 2, CELL_HEIGHT - 2);
          ctx.clip();
          ctx.fillText(displayValue, textX, textY);
          ctx.restore();

          // Reset font
          ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        }

        // Icon set rendering (after text, left side of cell)
        if (cfIcon) {
          ctx.save();
          ctx.font = `${Math.round(FONT_SIZE * 0.85)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colors.text;
          ctx.fillText(cfIcon, x + 3, y + CELL_HEIGHT / 2);
          ctx.restore();
          ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textBaseline = 'middle';
        }

        // Validation dropdown indicator
        const valRule = valStore.getRuleForCell(sheetId, row, col);
        if (valRule?.validationType.type === 'list' && valRule.validationType.dropdown) {
          ctx.save();
          ctx.fillStyle = colors.headerText;
          const ax = x + cw - 10;
          const ay = y + CELL_HEIGHT / 2 - 2;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + 6, ay);
          ctx.lineTo(ax + 3, ay + 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Spill cell indicator: dashed blue border
        if (cellData.spillOrigin) {
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 2]);
          ctx.strokeRect(x + 1, y + 1, cw - 2, CELL_HEIGHT - 2);
          ctx.restore();
        }
      }
    }

    // Helper: compute selection rect from row/col ranges using variable widths
    const getSelectionRect = (minRow: number, maxRow: number, minCol: number, maxCol: number) => {
      const selX = getColOffset(minCol) - scrollLeft;
      const selY = offsetY + (minRow - startRow) * CELL_HEIGHT;
      const selW = getColOffset(maxCol + 1) - getColOffset(minCol);
      const selH = (maxRow - minRow + 1) * CELL_HEIGHT;
      return { selX, selY, selW, selH };
    };

    // Draw drag selection (live)
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      const { selX, selY, selW, selH } = getSelectionRect(
        Math.min(ds.row, de.row), Math.max(ds.row, de.row),
        Math.min(ds.col, de.col), Math.max(ds.col, de.col)
      );

      ctx.fillStyle = colors.rangeSelection;
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(selX, selY, selW, selH);
    }
    // Draw committed selection range
    else if (selectionRange) {
      const { selX, selY, selW, selH } = getSelectionRect(
        Math.min(selectionRange.start.row, selectionRange.end.row),
        Math.max(selectionRange.start.row, selectionRange.end.row),
        Math.min(selectionRange.start.col, selectionRange.end.col),
        Math.max(selectionRange.start.col, selectionRange.end.col)
      );

      ctx.fillStyle = colors.rangeSelection;
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(selX, selY, selW, selH);
    }

    // Draw selected cell highlight
    if (selectedCell && !isEditing) {
      const x = getColOffset(selectedCell.col) - scrollLeft;
      const y = offsetY + (selectedCell.row - startRow) * CELL_HEIGHT;
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, getColWidth(selectedCell.col), CELL_HEIGHT);
    }

    // TIP-002: Draw freeze pane separator lines
    if (sheet?.freezePane) {
      ctx.save();
      ctx.strokeStyle = resolvedTheme === 'dark' ? '#6b7280' : '#374151';
      ctx.lineWidth = 2;
      // Horizontal freeze line (below frozen rows)
      if (sheet.freezePane.row > 0) {
        const freezeY = sheet.freezePane.row * CELL_HEIGHT - scrollTop;
        if (freezeY > 0 && freezeY < height) {
          ctx.beginPath();
          ctx.moveTo(0, freezeY + 0.5);
          ctx.lineTo(width, freezeY + 0.5);
          ctx.stroke();
        }
      }
      // Vertical freeze line (right of frozen cols)
      if (sheet.freezePane.col > 0) {
        const freezeX = getColOffset(sheet.freezePane.col) - scrollLeft;
        if (freezeX > 0 && freezeX < width) {
          ctx.beginPath();
          ctx.moveTo(freezeX + 0.5, 0);
          ctx.lineTo(freezeX + 0.5, height);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }, [containerSize, scrollTop, scrollLeft, sheet?.cells, sheet?.freezePane, selectedCell, selectionRange, isEditing, getColWidth, getColOffset, getFirstVisibleCol, CELL_HEIGHT, FONT_SIZE, colors, resolvedTheme, sheetId]);

  // Check if column is in selection range
  const isColInRange = useCallback((col: number) => {
    // Check live drag selection
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const minCol = Math.min(dragStartRef.current.col, dragEndRef.current.col);
      const maxCol = Math.max(dragStartRef.current.col, dragEndRef.current.col);
      return col >= minCol && col <= maxCol;
    }
    // Check committed selection range
    if (selectionRange) {
      const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
      return col >= minCol && col <= maxCol;
    }
    return false;
  }, [selectionRange]);

  // Check if row is in selection range
  const isRowInRange = useCallback((row: number) => {
    // Check live drag selection
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const minRow = Math.min(dragStartRef.current.row, dragEndRef.current.row);
      const maxRow = Math.max(dragStartRef.current.row, dragEndRef.current.row);
      return row >= minRow && row <= maxRow;
    }
    // Check committed selection range
    if (selectionRange) {
      const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      return row >= minRow && row <= maxRow;
    }
    return false;
  }, [selectionRange]);

  // Render column headers
  const renderColumnHeaders = useCallback(() => {
    const canvas = headerCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerSize.width;
    const height = HEADER_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = colors.headerBg;
    ctx.fillRect(0, 0, width, height);

    const startCol = getFirstVisibleCol(scrollLeft);
    let endCol = startCol;
    let acc = getColOffset(startCol) - scrollLeft;
    while (endCol < MAX_COLS && acc < width) {
      acc += getColWidth(endCol);
      endCol++;
    }
    endCol = Math.min(MAX_COLS, endCol + 1);

    ctx.font = `${HEADER_FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = startCol; col < endCol; col++) {
      const cw = getColWidth(col);
      const x = getColOffset(col) - scrollLeft;
      const inRange = isColInRange(col);

      // Highlight selected column (dark green) or in-range column (light green)
      if (selectedCell?.col === col) {
        ctx.fillStyle = colors.selectedHeader;
        ctx.fillRect(x, 0, cw, height);
        ctx.fillStyle = colors.selectedHeaderText;
      } else if (inRange) {
        ctx.fillStyle = colors.rangeHeader;
        ctx.fillRect(x, 0, cw, height);
        ctx.fillStyle = colors.rangeHeaderText;
      } else {
        ctx.fillStyle = colors.headerText;
      }

      ctx.fillText(getColLetter(col), x + cw / 2, height / 2);

      // Border
      ctx.strokeStyle = colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(x + cw + 0.5, 0);
      ctx.lineTo(x + cw + 0.5, height);
      ctx.stroke();
    }

    // Bottom border
    ctx.strokeStyle = colors.headerBorder;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();
  }, [containerSize.width, scrollLeft, selectedCell?.col, isColInRange, getColWidth, getColOffset, getFirstVisibleCol, HEADER_HEIGHT, HEADER_FONT_SIZE, colors]);

  // Render row headers
  const renderRowHeaders = useCallback(() => {
    const canvas = rowHeaderCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = HEADER_WIDTH;
    const height = containerSize.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = colors.headerBg;
    ctx.fillRect(0, 0, width, height);

    const startRow = Math.floor(scrollTop / CELL_HEIGHT);
    const endRow = Math.min(MAX_ROWS, startRow + Math.ceil(height / CELL_HEIGHT) + 1);
    const offsetY = -(scrollTop % CELL_HEIGHT);

    ctx.font = `${HEADER_FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = startRow; row < endRow; row++) {
      const y = offsetY + (row - startRow) * CELL_HEIGHT;
      const inRange = isRowInRange(row);

      // Highlight selected row (dark green) or in-range row (light green)
      if (selectedCell?.row === row) {
        ctx.fillStyle = colors.selectedHeader;
        ctx.fillRect(0, y, width, CELL_HEIGHT);
        ctx.fillStyle = colors.selectedHeaderText;
      } else if (inRange) {
        ctx.fillStyle = colors.rangeHeader;
        ctx.fillRect(0, y, width, CELL_HEIGHT);
        ctx.fillStyle = colors.rangeHeaderText;
      } else {
        ctx.fillStyle = colors.headerText;
      }

      ctx.fillText(String(row + 1), width / 2, y + CELL_HEIGHT / 2);

      // Border
      ctx.strokeStyle = colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(0, y + CELL_HEIGHT + 0.5);
      ctx.lineTo(width, y + CELL_HEIGHT + 0.5);
      ctx.stroke();
    }

    // Right border
    ctx.strokeStyle = colors.headerBorder;
    ctx.beginPath();
    ctx.moveTo(width - 0.5, 0);
    ctx.lineTo(width - 0.5, height);
    ctx.stroke();
  }, [containerSize.height, scrollTop, selectedCell?.row, isRowInRange, CELL_HEIGHT, HEADER_WIDTH, HEADER_FONT_SIZE, colors]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromMouse(e.clientX, e.clientY);
    if (!cell) return;

    // Check for validation dropdown
    const valStoreState = useValidationStore.getState();
    const dropdownOptions = valStoreState.getDropdownOptions(sheetId, cell.row, cell.col);
    if (dropdownOptions && dropdownOptions.length > 0) {
      // Check if click is near the dropdown arrow area (right edge of cell)
      const cellX = getColOffset(cell.col);
      const cellW = getColWidth(cell.col);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const localX = e.clientX - rect.left + scrollLeft;
        const arrowX = cellX + cellW - 14;
        if (localX >= arrowX) {
          // Open dropdown
          const screenX = cellX - scrollLeft;
          const screenY = (cell.row + 1) * CELL_HEIGHT - scrollTop;
          setDropdownState({
            row: cell.row, col: cell.col,
            options: dropdownOptions,
            x: screenX, y: screenY, w: cellW,
          });
          return;
        }
      }
    }
    setDropdownState(null);

    if (e.shiftKey && selectedCell) {
      selectRange(selectedCell, cell);
    } else {
      setSelectedCell(cell);
      setSelectionRange(null);
      isDraggingRef.current = true;
      dragStartRef.current = cell;
      dragEndRef.current = cell;
    }
  }, [getCellFromMouse, selectedCell, selectRange, setSelectedCell, setSelectionRange, sheetId, getColOffset, getColWidth, scrollLeft, scrollTop, CELL_HEIGHT]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || e.buttons !== 1) return;

    const cell = getCellFromMouse(e.clientX, e.clientY);
    if (cell && dragEndRef.current &&
        (cell.row !== dragEndRef.current.row || cell.col !== dragEndRef.current.col)) {
      dragEndRef.current = cell;
      // Re-render all canvases for instant feedback
      renderGrid();
      renderColumnHeaders();
      renderRowHeaders();
    }
  }, [getCellFromMouse, renderGrid, renderColumnHeaders, renderRowHeaders]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      if (ds.row !== de.row || ds.col !== de.col) {
        selectRange(ds, de);
      }
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    renderGrid();
    renderColumnHeaders();
    renderRowHeaders();
  }, [selectRange, renderGrid, renderColumnHeaders, renderRowHeaders]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromMouse(e.clientX, e.clientY);
    if (cell) {
      // Protection check: prevent editing on protected sheets
      if (!canPerformAction(sheetId, 'formatCells')) {
        showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
        return;
      }
      // Spill cell check: cannot edit spill cells directly
      const cellKey = getCellKey(cell.row, cell.col);
      const cellData = sheet?.cells[cellKey];
      if (cellData?.spillOrigin) {
        showToast('This cell contains a spilled value. Edit the formula in the origin cell.', 'info');
        return;
      }
      setSelectedCell(cell);
      setIsEditing(true);
    }
  }, [getCellFromMouse, setSelectedCell, setIsEditing, canPerformAction, sheetId, showToast, sheet?.cells]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOUCH EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const cell = getCellFromMouse(touch.clientX, touch.clientY);
    if (!cell) return;

    setSelectedCell(cell);
    setSelectionRange(null);
    isDraggingRef.current = true;
    dragStartRef.current = cell;
    dragEndRef.current = cell;
  }, [getCellFromMouse, setSelectedCell, setSelectionRange]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const cell = getCellFromMouse(touch.clientX, touch.clientY);
    if (cell && dragEndRef.current &&
        (cell.row !== dragEndRef.current.row || cell.col !== dragEndRef.current.col)) {
      dragEndRef.current = cell;
      renderGrid();
      renderColumnHeaders();
      renderRowHeaders();
    }
  }, [getCellFromMouse, renderGrid, renderColumnHeaders, renderRowHeaders]);

  const handleTouchEnd = useCallback(() => {
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      if (ds.row !== de.row || ds.col !== de.col) {
        selectRange(ds, de);
      }
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragEndRef.current = null;
    renderGrid();
    renderColumnHeaders();
    renderRowHeaders();
  }, [selectRange, renderGrid, renderColumnHeaders, renderRowHeaders]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE DROP HANDLER — TIP-005: Drag-drop file directly onto grid
  // ═══════════════════════════════════════════════════════════════════════════

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      showToast('Unsupported file format. Please drop .xlsx, .xls, or .csv files.', 'warning');
      return;
    }

    try {
      showToast(`Importing ${file.name}...`, 'info');

      if (name.endsWith('.csv')) {
        const { importCSVFile } = await import('../../utils/excelIO');
        const result = await importCSVFile(file);
        const workbookId = `local-${Date.now()}`;
        setWorkbook(workbookId, file.name.replace(/\.[^/.]+$/, ''));
        const sid = `sheet-${Date.now()}-0`;
        addSheet({ id: sid, name: result.sheets[0].name, index: 0, cells: {} });
        const updates = Object.entries(result.sheets[0].cells).map(([key, cell]) => {
          const [r, c] = key.split(':').map(Number);
          return { row: r, col: c, data: { value: cell.value as string | number | boolean, displayValue: cell.displayValue } };
        });
        if (updates.length > 0) batchUpdateCells(sid, updates);
      } else {
        const { importExcelFile } = await import('../../utils/excelIO');
        const result = await importExcelFile(file);
        const workbookId = `local-${Date.now()}`;
        setWorkbook(workbookId, file.name.replace(/\.[^/.]+$/, ''));
        const sheetIds: string[] = [];
        for (let i = 0; i < result.sheets.length; i++) {
          const sd = result.sheets[i];
          const sid = `sheet-${Date.now()}-${i}`;
          sheetIds.push(sid);
          addSheet({ id: sid, name: sd.name || `Sheet${i + 1}`, index: i, cells: {},
            columnWidths: sd.columnWidths, rowHeights: sd.rowHeights, freezePane: sd.freezePane });
          const updates = Object.entries(sd.cells).map(([key, cell]) => {
            const [r, c] = key.split(':').map(Number);
            return { row: r, col: c, data: {
              value: cell.value as string | number | boolean,
              displayValue: cell.displayValue || String(cell.value ?? ''),
              formula: cell.formula || null,
              ...(cell.format ? { format: cell.format } : {}),
            }};
          });
          if (updates.length > 0) batchUpdateCells(sid, updates);
        }
        // Wire imported charts to chart store with data population
        if (result.charts && result.charts.length > 0) {
          const { useChartStore } = await import('../../stores/chartStore');
          const { populateChartDataFromCells } = await import('../../utils/excelIO');
          const chartStoreState = useChartStore.getState();
          const typeMap: Record<string, string> = {
            bar: 'Bar', column: 'ColumnClustered', line: 'Line',
            pie: 'Pie', area: 'Area', scatter: 'Scatter', doughnut: 'Doughnut',
          };
          const defaultColors = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948'];
          for (const ic of result.charts) {
            const chartSheetId = sheetIds[ic.sheetIndex] || sheetIds[0];
            const chartType = (typeMap[ic.type.toLowerCase()] || 'ColumnClustered') as import('../../types/visualization').ChartType;
            const chart = chartStoreState.createChart(workbookId, chartSheetId, ic.name, chartType);
            if (ic.position) {
              chartStoreState.updatePosition(chart.id, ic.position);
            }
            // Populate chart data from cells
            const sheetCells = result.sheets[ic.sheetIndex]?.cells;
            if (sheetCells) {
              const chartData = populateChartDataFromCells(ic, sheetCells);
              if (chartData && chartData.categories.length > 0 && chartData.series.length > 0) {
                const seriesData = chartData.series.map((s, idx) => {
                  const vals = s.values;
                  return {
                    id: `series-${idx}`,
                    name: s.name,
                    values: vals,
                    color: defaultColors[idx % defaultColors.length],
                    statistics: {
                      min: Math.min(...vals),
                      max: Math.max(...vals),
                      sum: vals.reduce((a, b) => a + b, 0),
                      avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
                      count: vals.length,
                    },
                  };
                });
                const allValues = seriesData.flatMap(s => s.values);
                const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
                const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
                chartStoreState.setChartData(chart.id, {
                  chartId: chart.id,
                  chartType,
                  categories: chartData.categories,
                  series: seriesData,
                  bounds: {
                    minValue: minVal,
                    maxValue: maxVal,
                    suggestedMin: minVal >= 0 ? 0 : minVal * 1.1,
                    suggestedMax: maxVal * 1.1,
                  },
                });
              }
            }
          }
        }
      }
      showToast(`${file.name} imported successfully`, 'info');
    } catch (err) {
      loggers.ui.error('Drop import error:', err);
      showToast('Failed to import file. Please check the format.', 'warning');
    }
  }, [setWorkbook, addSheet, batchUpdateCells, showToast]);

  // TIP-009: Navigate to cell reference
  const goToCell = useCallback((ref: string) => {
    const match = ref.toUpperCase().trim().match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      showToast('Invalid cell reference. Use format like A1, B25, AA100.', 'warning');
      return;
    }
    let col = 0;
    for (let i = 0; i < match[1].length; i++) {
      col = col * 26 + (match[1].charCodeAt(i) - 64);
    }
    col -= 1;
    const row = parseInt(match[2]) - 1;
    if (row < 0 || col < 0 || row >= MAX_ROWS || col >= MAX_COLS) {
      showToast('Cell reference out of range.', 'warning');
      return;
    }
    setSelectedCell({ row, col });
    // Scroll to make cell visible
    if (containerRef.current) {
      const targetY = row * CELL_HEIGHT;
      const targetX = getColOffset(col);
      containerRef.current.scrollTop = Math.max(0, targetY - containerSize.height / 3);
      containerRef.current.scrollLeft = Math.max(0, targetX - containerSize.width / 3);
    }
    setShowGoToCell(false);
    setGoToCellValue('');
  }, [setSelectedCell, CELL_HEIGHT, getColOffset, containerSize, showToast]);

  // TIP-004: Hover tooltip for truncated cells
  const handleMouseMoveTooltip = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) return;
    const cell = getCellFromMouse(e.clientX, e.clientY);
    if (!cell || !sheet?.cells) {
      if (hoverTooltip) setHoverTooltip(null);
      return;
    }
    const key = getCellKey(cell.row, cell.col);
    const cellData = sheet.cells[key];
    if (!cellData) {
      if (hoverTooltip) setHoverTooltip(null);
      return;
    }
    const text = cellData.displayValue || String(cellData.value || '');
    if (!text) {
      if (hoverTooltip) setHoverTooltip(null);
      return;
    }
    // Estimate if text is truncated (rough: 7px per char)
    const cw = getColWidth(cell.col);
    const estimatedWidth = text.length * 7;
    if (estimatedWidth > cw - 8) {
      // Clear existing timeout
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoverTooltip({
            text,
            x: e.clientX - rect.left + HEADER_WIDTH,
            y: e.clientY - rect.top + HEADER_HEIGHT - 30,
          });
        }
      }, 500); // 500ms delay before showing tooltip
    } else {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (hoverTooltip) setHoverTooltip(null);
    }
  }, [getCellFromMouse, sheet?.cells, getColWidth, hoverTooltip, HEADER_WIDTH, HEADER_HEIGHT]);

  // TIP-008: Column header click to sort
  const handleColumnHeaderClick = useCallback((e: React.MouseEvent) => {
    if (!headerCanvasRef.current || !sheet?.cells) return;
    const rect = headerCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const col = getColFromX(x);

    // Find data range: first row to last row with data in this column
    let minRow = Infinity, maxRow = -1;
    for (const key of Object.keys(sheet.cells)) {
      const [rStr, cStr] = key.split(':');
      if (parseInt(cStr) === col || true) { // need all cols in range
        const r = parseInt(rStr);
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
      }
    }
    if (maxRow < 0) return;

    // Find min/max col with data
    let minCol = Infinity, maxCol = -1;
    for (const key of Object.keys(sheet.cells)) {
      const c = parseInt(key.split(':')[1]);
      if (c < minCol) minCol = c;
      if (c > maxCol) maxCol = c;
    }

    // Set selection range to cover all data, then sort
    const range = { start: { row: minRow, col: minCol }, end: { row: maxRow, col: maxCol } };
    setSelectionRange(range);

    // Toggle sort direction
    const newDir = (sortConfig?.column === col && sortConfig?.direction === 'asc') ? 'desc' : 'asc';

    // Use setTimeout to let selection range update in store first
    setTimeout(() => {
      sortStore({ column: col, direction: newDir });
      showToast(`Sorted by column ${getColLetter(col)} (${newDir === 'asc' ? 'A→Z' : 'Z→A'})`, 'info');
    }, 0);
  }, [sheet?.cells, scrollLeft, getColFromX, setSelectionRange, sortStore, sortConfig, showToast]);

  // Check if grid is empty for empty state overlay
  const isEmpty = !sheet?.cells || Object.keys(sheet.cells).length === 0;

  // Cell edit handlers
  const handleCellSubmit = useCallback((value: string) => {
    if (!selectedCell || !sheetId) return;

    // Protection check
    if (!canPerformAction(sheetId, 'formatCells')) {
      showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
      setIsEditing(false);
      return;
    }

    // Validation check
    const result = validateCell(sheetId, selectedCell.row, selectedCell.col, value);
    if (!result.isValid) {
      const rule = getRuleForCell(sheetId, selectedCell.row, selectedCell.col);
      const errorStyle = rule?.errorAlert?.style ?? 'stop';

      if (errorStyle === 'stop') {
        // Stop: reject the value, keep editor open
        setValidationError(result.message || 'Invalid value');
        return;
      }
      // Warning/Information: show toast but allow the value through
      showToast(result.message || 'Invalid value', errorStyle === 'warning' ? 'warning' : 'info');
    }

    setValidationError(null);
    setIsEditing(false);
    const isFormula = typeof value === 'string' && value.startsWith('=');
    updateCell(sheetId, selectedCell.row, selectedCell.col, {
      value,
      formula: isFormula ? value : null,
    });
    moveSelection('down');
  }, [selectedCell, sheetId, setIsEditing, updateCell, moveSelection, canPerformAction, validateCell, getRuleForCell, showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isEditing) return;

      // Helper to check edit permission
      const canEdit = () => canPerformAction(sheetId, 'formatCells');

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          e.shiftKey ? expandSelection('up') : moveSelection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          e.shiftKey ? expandSelection('down') : moveSelection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.shiftKey ? expandSelection('left') : moveSelection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.shiftKey ? expandSelection('right') : moveSelection('right');
          break;
        case 'Tab':
          e.preventDefault();
          e.shiftKey ? moveSelection('left') : moveSelection('right');
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            moveSelection('up');
          } else if (canEdit()) {
            setIsEditing(true);
          } else {
            showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
          }
          break;
        case 'F2':
          e.preventDefault();
          if (canEdit()) {
            setIsEditing(true);
          } else {
            showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (canEdit()) {
            handleCellSubmit('');
          } else {
            showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setDropdownState(null);
          setSelectionRange(null);
          break;
        default:
          // TIP-009: Ctrl+G / Cmd+G → Go to cell
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            setShowGoToCell(true);
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (canEdit()) {
              setIsEditing(true);
            } else {
              showToast('This sheet is protected. Unprotect it to make changes.', 'warning');
            }
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isEditing, moveSelection, expandSelection, setIsEditing, setSelectionRange, handleCellSubmit, canPerformAction, sheetId, showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Global mouseup handler
  useEffect(() => {
    const globalMouseUp = () => {
      if (isDraggingRef.current) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', globalMouseUp);
    return () => window.removeEventListener('mouseup', globalMouseUp);
  }, [handleMouseUp]);

  // Render on state changes
  useEffect(() => {
    renderGrid();
    renderColumnHeaders();
    renderRowHeaders();
  }, [renderGrid, renderColumnHeaders, renderRowHeaders]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: colors.headerBg }}
      onDragOver={handleFileDragOver}
      onDragLeave={handleFileDragLeave}
      onDrop={handleFileDrop}
    >
      {/* Corner */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: HEADER_WIDTH,
          height: HEADER_HEIGHT,
          background: colors.headerBg,
          borderRight: `1px solid ${colors.headerBorder}`,
          borderBottom: `1px solid ${colors.headerBorder}`,
          zIndex: 3,
        }}
      />

      {/* Column headers — TIP-008: click to sort */}
      <canvas
        ref={headerCanvasRef}
        onClick={handleColumnHeaderClick}
        style={{
          position: 'absolute',
          left: HEADER_WIDTH,
          top: 0,
          zIndex: 2,
          cursor: 'pointer',
        }}
      />

      {/* Row headers */}
      <canvas
        ref={rowHeaderCanvasRef}
        style={{
          position: 'absolute',
          left: 0,
          top: HEADER_HEIGHT,
          zIndex: 2,
        }}
      />

      {/* Main grid */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: HEADER_WIDTH,
          top: HEADER_HEIGHT,
          right: 0,
          bottom: 0,
          overflow: 'auto',
        }}
        onScroll={handleScroll}
        onMouseDown={(e) => { setHoverTooltip(null); handleMouseDown(e); }}
        onMouseMove={(e) => { handleMouseMove(e); handleMouseMoveTooltip(e); }}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={() => { setHoverTooltip(null); if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Scrollable area */}
        <div style={{ width: totalWidth, height: MAX_ROWS * CELL_HEIGHT, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              left: scrollLeft,
              top: scrollTop,
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Remote user cursors overlay */}
        <UserCursors
          sheetId={sheetId}
          visibleRows={visibleRange.rows}
          visibleCols={visibleRange.cols}
          getCellPosition={getCellPosition}
        />

        {/* Cell editor overlay */}
        {isEditing && selectedCell && (
          <CellEditor
            row={selectedCell.row}
            col={selectedCell.col}
            initialValue={
              getCellFormula(sheetId, selectedCell.row, selectedCell.col) ||
              getCellDisplayValue(sheetId, selectedCell.row, selectedCell.col) ||
              ''
            }
            cellWidth={getColWidth(selectedCell.col)}
            cellHeight={CELL_HEIGHT}
            headerWidth={-scrollLeft}
            headerHeight={-scrollTop}
            colOffset={getColOffset(selectedCell.col)}
            onSubmit={handleCellSubmit}
            onCancel={() => { setValidationError(null); setIsEditing(false); }}
            validationError={validationError}
            inputMessage={getInputMessage(sheetId, selectedCell.row, selectedCell.col)}
          />
        )}

        {/* Validation dropdown */}
        {dropdownState && (
          <div
            style={{
              position: 'absolute',
              left: dropdownState.x,
              top: dropdownState.y,
              width: Math.max(dropdownState.w, 120),
              maxHeight: 200,
              overflowY: 'auto',
              background: resolvedTheme === 'dark' ? '#262626' : 'white',
              border: `1px solid ${resolvedTheme === 'dark' ? '#525252' : '#d4d4d4'}`,
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 50,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {dropdownState.options.map((opt, i) => (
              <div
                key={i}
                onClick={() => {
                  updateCell(sheetId, dropdownState.row, dropdownState.col, {
                    value: opt,
                    displayValue: opt,
                  });
                  setDropdownState(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCell(sheetId, dropdownState.row, dropdownState.col, {
                      value: opt,
                      displayValue: opt,
                    });
                    setDropdownState(null);
                  } else if (e.key === 'Escape') {
                    setDropdownState(null);
                  }
                }}
                tabIndex={0}
                style={{
                  padding: '4px 8px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: resolvedTheme === 'dark' ? '#e5e5e5' : '#171717',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = resolvedTheme === 'dark' ? '#404040' : '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}

        {/* Floating AI button - context-aware quick access */}
        {!isEditing && (
          <FloatingAIButton
            gridRef={containerRef}
            cellWidth={DEFAULT_CELL_WIDTH}
            cellHeight={CELL_HEIGHT}
          />
        )}
      </div>

      {/* TIP-003: Empty state overlay — shown when grid has no data */}
      {isEmpty && !isEditing && (
        <div
          style={{
            position: 'absolute',
            left: HEADER_WIDTH,
            top: HEADER_HEIGHT,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '40px 32px',
            borderRadius: 12,
            background: resolvedTheme === 'dark' ? 'rgba(38,38,38,0.9)' : 'rgba(255,255,255,0.9)',
            border: `2px dashed ${resolvedTheme === 'dark' ? '#525252' : '#d4d4d4'}`,
            pointerEvents: 'auto',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={resolvedTheme === 'dark' ? '#6ee7b7' : '#059669'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: resolvedTheme === 'dark' ? '#e5e5e5' : '#171717',
            }}>
              Drop XLSX, XLS, or CSV file here
            </div>
            <div style={{
              fontSize: 13,
              color: resolvedTheme === 'dark' ? '#a3a3a3' : '#737373',
            }}>
              or use File &gt; Open to browse
            </div>
            <button
              onClick={() => document.getElementById('file-input-open')?.click()}
              style={{
                marginTop: 4,
                padding: '8px 20px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Open File
            </button>
          </div>
        </div>
      )}

      {/* TIP-004: Hover tooltip for truncated cells */}
      {hoverTooltip && (
        <div
          style={{
            position: 'absolute',
            left: hoverTooltip.x,
            top: hoverTooltip.y,
            maxWidth: 350,
            padding: '4px 8px',
            background: resolvedTheme === 'dark' ? '#404040' : '#1a1a1a',
            color: 'white',
            fontSize: 12,
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 60,
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {hoverTooltip.text}
        </div>
      )}

      {/* TIP-009: Go-to-cell dialog (Ctrl+G) */}
      {showGoToCell && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 60,
            display: 'flex',
            gap: 4,
            background: resolvedTheme === 'dark' ? '#262626' : 'white',
            border: `1px solid ${resolvedTheme === 'dark' ? '#525252' : '#d4d4d4'}`,
            borderRadius: 6,
            padding: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Go to cell (e.g. A1)"
            value={goToCellValue}
            onChange={(e) => setGoToCellValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goToCell(goToCellValue);
              if (e.key === 'Escape') { setShowGoToCell(false); setGoToCellValue(''); }
            }}
            style={{
              width: 140,
              padding: '4px 8px',
              border: `1px solid ${resolvedTheme === 'dark' ? '#525252' : '#d4d4d4'}`,
              borderRadius: 4,
              fontSize: 13,
              background: resolvedTheme === 'dark' ? '#1a1a1a' : 'white',
              color: resolvedTheme === 'dark' ? '#e5e5e5' : '#171717',
              outline: 'none',
            }}
          />
          <button
            onClick={() => goToCell(goToCellValue)}
            style={{
              padding: '4px 10px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Go
          </button>
          <button
            onClick={() => { setShowGoToCell(false); setGoToCellValue(''); }}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              color: resolvedTheme === 'dark' ? '#a3a3a3' : '#737373',
              border: 'none',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            x
          </button>
        </div>
      )}

      {/* TIP-005: Drag overlay — shown when file is being dragged over grid */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 150, 105, 0.12)',
            border: '3px dashed #059669',
            borderRadius: 8,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <div style={{
            padding: '24px 40px',
            background: resolvedTheme === 'dark' ? '#1a1a1a' : 'white',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#059669' }}>
              Drop to import
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasGrid;
