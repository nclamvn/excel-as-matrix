// ═══════════════════════════════════════════════════════════════════════════
// CANVAS GRID - High Performance Spreadsheet Rendering
// Uses HTML5 Canvas for instant feedback like Excel/WPS
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { CellEditor } from './CellEditor';
import { getCellKey } from '../../types/cell';
import { FloatingAIButton } from '../AI/FloatingAIButton';

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
const MAX_ROWS = 100000;
const MAX_COLS = 26;

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
  const setCellValue = useWorkbookStore((state) => state.setCellValue);

  // Theme
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const colors = THEME_COLORS[resolvedTheme];

  // Calculate scaled dimensions based on zoom
  const zoomFactor = zoom / 100;
  const CELL_WIDTH = Math.round(BASE_CELL_WIDTH * zoomFactor);
  const CELL_HEIGHT = Math.round(BASE_CELL_HEIGHT * zoomFactor);
  const HEADER_WIDTH = Math.round(BASE_HEADER_WIDTH * zoomFactor);
  const HEADER_HEIGHT = Math.round(BASE_HEADER_HEIGHT * zoomFactor);
  const FONT_SIZE = Math.round(13 * zoomFactor);
  const HEADER_FONT_SIZE = Math.round(12 * zoomFactor);

  const selectedCell = useSelectionStore((state) => state.selectedCell);
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
    const col = Math.floor(x / CELL_WIDTH);
    const row = Math.floor(y / CELL_HEIGHT);
    if (row < 0 || col < 0 || row >= MAX_ROWS || col >= MAX_COLS) return null;
    return { row, col };
  }, [scrollLeft, scrollTop, CELL_WIDTH, CELL_HEIGHT]);

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
    const startCol = Math.floor(scrollLeft / CELL_WIDTH);
    const endRow = Math.min(MAX_ROWS, startRow + Math.ceil(height / CELL_HEIGHT) + 1);
    const endCol = Math.min(MAX_COLS, startCol + Math.ceil(width / CELL_WIDTH) + 1);

    const offsetX = -(scrollLeft % CELL_WIDTH);
    const offsetY = -(scrollTop % CELL_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let col = startCol; col <= endCol; col++) {
      const x = offsetX + (col - startCol) * CELL_WIDTH + 0.5;
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

    // Draw cells
    ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = 'middle';

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = getCellKey(row, col);
        const cellData = sheet?.cells[key];
        if (!cellData) continue;

        const x = offsetX + (col - startCol) * CELL_WIDTH;
        const y = offsetY + (row - startRow) * CELL_HEIGHT;

        // Cell background if formatted
        if (cellData.format?.backgroundColor) {
          ctx.fillStyle = cellData.format.backgroundColor;
          ctx.fillRect(x + 1, y + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);
        }

        // Cell text
        const displayValue = cellData.displayValue || String(cellData.value || '');
        if (displayValue) {
          ctx.fillStyle = cellData.format?.textColor || colors.text;

          // Text alignment
          let textX = x + 4;
          const textY = y + CELL_HEIGHT / 2;

          if (cellData.format?.align === 'center') {
            ctx.textAlign = 'center';
            textX = x + CELL_WIDTH / 2;
          } else if (cellData.format?.align === 'right') {
            ctx.textAlign = 'right';
            textX = x + CELL_WIDTH - 4;
          } else {
            ctx.textAlign = 'left';
          }

          // Bold/Italic
          let fontStyle = '';
          if (cellData.format?.bold) fontStyle += 'bold ';
          if (cellData.format?.italic) fontStyle += 'italic ';
          ctx.font = `${fontStyle}${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

          // Clip text to cell
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 1, y + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);
          ctx.clip();
          ctx.fillText(displayValue, textX, textY);
          ctx.restore();

          // Reset font
          ctx.font = `${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        }
      }
    }

    // Draw drag selection (live)
    if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
      const ds = dragStartRef.current;
      const de = dragEndRef.current;
      const minRow = Math.min(ds.row, de.row);
      const maxRow = Math.max(ds.row, de.row);
      const minCol = Math.min(ds.col, de.col);
      const maxCol = Math.max(ds.col, de.col);

      const selX = offsetX + (minCol - startCol) * CELL_WIDTH;
      const selY = offsetY + (minRow - startRow) * CELL_HEIGHT;
      const selW = (maxCol - minCol + 1) * CELL_WIDTH;
      const selH = (maxRow - minRow + 1) * CELL_HEIGHT;

      ctx.fillStyle = colors.rangeSelection;
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(selX, selY, selW, selH);
    }
    // Draw committed selection range
    else if (selectionRange) {
      const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);

      const selX = offsetX + (minCol - startCol) * CELL_WIDTH;
      const selY = offsetY + (minRow - startRow) * CELL_HEIGHT;
      const selW = (maxCol - minCol + 1) * CELL_WIDTH;
      const selH = (maxRow - minRow + 1) * CELL_HEIGHT;

      ctx.fillStyle = colors.rangeSelection;
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(selX, selY, selW, selH);
    }

    // Draw selected cell highlight
    if (selectedCell && !isEditing) {
      const x = offsetX + (selectedCell.col - startCol) * CELL_WIDTH;
      const y = offsetY + (selectedCell.row - startRow) * CELL_HEIGHT;
      ctx.strokeStyle = colors.selection;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
    }
  }, [containerSize, scrollTop, scrollLeft, sheet?.cells, selectedCell, selectionRange, isEditing, CELL_WIDTH, CELL_HEIGHT, FONT_SIZE, colors]);

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

    const startCol = Math.floor(scrollLeft / CELL_WIDTH);
    const endCol = Math.min(MAX_COLS, startCol + Math.ceil(width / CELL_WIDTH) + 1);
    const offsetX = -(scrollLeft % CELL_WIDTH);

    ctx.font = `${HEADER_FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let col = startCol; col < endCol; col++) {
      const x = offsetX + (col - startCol) * CELL_WIDTH;
      const inRange = isColInRange(col);

      // Highlight selected column (dark green) or in-range column (light green)
      if (selectedCell?.col === col) {
        ctx.fillStyle = colors.selectedHeader;
        ctx.fillRect(x, 0, CELL_WIDTH, height);
        ctx.fillStyle = colors.selectedHeaderText;
      } else if (inRange) {
        ctx.fillStyle = colors.rangeHeader;
        ctx.fillRect(x, 0, CELL_WIDTH, height);
        ctx.fillStyle = colors.rangeHeaderText;
      } else {
        ctx.fillStyle = colors.headerText;
      }

      ctx.fillText(getColLetter(col), x + CELL_WIDTH / 2, height / 2);

      // Border
      ctx.strokeStyle = colors.gridLine;
      ctx.beginPath();
      ctx.moveTo(x + CELL_WIDTH + 0.5, 0);
      ctx.lineTo(x + CELL_WIDTH + 0.5, height);
      ctx.stroke();
    }

    // Bottom border
    ctx.strokeStyle = colors.headerBorder;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();
  }, [containerSize.width, scrollLeft, selectedCell?.col, isColInRange, CELL_WIDTH, HEADER_HEIGHT, HEADER_FONT_SIZE, colors]);

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

    if (e.shiftKey && selectedCell) {
      selectRange(selectedCell, cell);
    } else {
      setSelectedCell(cell);
      setSelectionRange(null);
      isDraggingRef.current = true;
      dragStartRef.current = cell;
      dragEndRef.current = cell;
    }
  }, [getCellFromMouse, selectedCell, selectRange, setSelectedCell, setSelectionRange]);

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
      setSelectedCell(cell);
      setIsEditing(true);
    }
  }, [getCellFromMouse, setSelectedCell, setIsEditing]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Cell edit handlers
  const handleCellSubmit = useCallback((value: string) => {
    if (!selectedCell || !sheetId) return;
    setIsEditing(false);
    setCellValue(sheetId, selectedCell.row, selectedCell.col, value);
    moveSelection('down');
  }, [selectedCell, sheetId, setIsEditing, setCellValue, moveSelection]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isEditing) return;

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
          e.shiftKey ? moveSelection('up') : setIsEditing(true);
          break;
        case 'F2':
          e.preventDefault();
          setIsEditing(true);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleCellSubmit('');
          break;
        case 'Escape':
          e.preventDefault();
          setSelectionRange(null);
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setIsEditing(true);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isEditing, moveSelection, expandSelection, setIsEditing, setSelectionRange, handleCellSubmit]);

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
    <div className="relative h-full overflow-hidden" style={{ background: colors.headerBg }}>
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

      {/* Column headers */}
      <canvas
        ref={headerCanvasRef}
        style={{
          position: 'absolute',
          left: HEADER_WIDTH,
          top: 0,
          zIndex: 2,
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Scrollable area */}
        <div style={{ width: MAX_COLS * CELL_WIDTH, height: MAX_ROWS * CELL_HEIGHT, position: 'relative' }}>
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
            cellWidth={CELL_WIDTH}
            cellHeight={CELL_HEIGHT}
            headerWidth={-scrollLeft}
            headerHeight={-scrollTop}
            onSubmit={handleCellSubmit}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {/* Floating AI button - context-aware quick access */}
        {!isEditing && (
          <FloatingAIButton
            gridRef={containerRef}
            cellWidth={CELL_WIDTH}
            cellHeight={CELL_HEIGHT}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasGrid;
