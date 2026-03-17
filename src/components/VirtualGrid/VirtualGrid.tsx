import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useHistoryStore } from '../../stores/historyStore';
import { apiClient } from '../../api/client';
import { CellRenderer, CellData } from './CellRenderer';
import { VirtualHeaders } from './VirtualHeaders';
import { VirtualCellEditor } from './VirtualCellEditor';
import { getCellKey } from '../../types/cell';
import { loggers } from '@/utils/logger';

export interface VirtualGridProps {
  workbookId: string;
  sheetId: string;
  maxRows?: number;
  maxCols?: number;
}

// Default configuration for 1M+ cells
const DEFAULT_MAX_ROWS = 1_000_000;
const DEFAULT_MAX_COLS = 16384; // 2^14, like Excel
const DEFAULT_CELL_WIDTH = 100;
const DEFAULT_CELL_HEIGHT = 24;
const DEFAULT_HEADER_WIDTH = 50;
const DEFAULT_HEADER_HEIGHT = 24;
const DEFAULT_OVERSCAN = 5;

// Column label generator (A, B, ..., Z, AA, AB, ...)
export function getColumnLabel(index: number): string {
  let label = '';
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

// Variable column width support
const columnWidths = new Map<number, number>();

export function getColumnWidth(index: number): number {
  return columnWidths.get(index) ?? DEFAULT_CELL_WIDTH;
}

export function setColumnWidth(index: number, width: number): void {
  columnWidths.set(index, Math.max(20, Math.min(500, width)));
}

export const VirtualGrid: React.FC<VirtualGridProps> = memo(({
  workbookId,
  sheetId,
  maxRows = DEFAULT_MAX_ROWS,
  maxCols = DEFAULT_MAX_COLS,
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local state
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });

  // Stores
  const { sheets, getCellDisplayValue, getCellFormula, updateCell } = useWorkbookStore();
  const {
    selectedCell,
    selectionRange,
    isEditing,
    setSelectedCell,
    setSelectionRange,
    setIsEditing,
    moveSelection,
  } = useSelectionStore();
  const { addEntry } = useHistoryStore();

  const sheet = sheets[sheetId];

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: maxRows,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => DEFAULT_CELL_HEIGHT,
    overscan: DEFAULT_OVERSCAN,
  });

  // Column virtualizer
  const colVirtualizer = useVirtualizer({
    count: maxCols,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: getColumnWidth,
    horizontal: true,
    overscan: DEFAULT_OVERSCAN,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();

  // Container resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Track scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setScrollPosition({
        top: scrollContainer.scrollTop,
        left: scrollContainer.scrollLeft,
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Get cell data
  const getCellData = useCallback(
    (row: number, col: number): CellData | null => {
      const key = getCellKey(row, col);
      const cellData = sheet?.cells[key];
      const isLoading = loadingCells.has(key);

      if (!cellData && !isLoading) {
        return null;
      }

      return {
        value: cellData?.value ?? null,
        formula: cellData?.formula ?? null,
        displayValue: cellData?.displayValue ?? '',
        format: cellData?.format,
        isLoading,
      };
    },
    [sheet, loadingCells]
  );

  // Check if cell is in selection range
  const isInRange = useCallback(
    (row: number, col: number): boolean => {
      if (!selectionRange) return false;
      const { start, end } = selectionRange;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    },
    [selectionRange]
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      setSelectionRange(null);
    },
    [setSelectedCell, setSelectionRange]
  );

  // Handle cell double-click
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      setSelectionRange(null); // Clear any existing range selection
      setIsEditing(true);
    },
    [setSelectedCell, setSelectionRange, setIsEditing]
  );

  // Handle cell edit submit
  const handleCellSubmit = useCallback(
    async (value: string) => {
      if (!selectedCell || !workbookId || !sheetId) return;

      const { row, col } = selectedCell;
      const key = getCellKey(row, col);

      setIsEditing(false);
      setLoadingCells((prev) => new Set(prev).add(key));

      try {
        const isFormula = value.startsWith('=');
        const response = isFormula
          ? await apiClient.setCellFormula(workbookId, sheetId, row, col, value)
          : await apiClient.setCellValue(workbookId, sheetId, row, col, value);

        if (response.success) {
          const cellData = await apiClient.getCell(workbookId, sheetId, row, col);
          updateCell(sheetId, row, col, {
            value: cellData.value,
            formula: cellData.formula,
            displayValue: cellData.display_value,
          });

          addEntry({
            eventId: response.event_ids[0] || '',
            description: `Set ${isFormula ? 'formula' : 'value'} at ${getColumnLabel(col)}${row + 1}`,
            canUndo: true,
          });

          moveSelection('down');
        }
      } catch (error) {
        loggers.ui.error('Failed to update cell:', error);
      } finally {
        setLoadingCells((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [selectedCell, workbookId, sheetId, setIsEditing, updateCell, addEntry, moveSelection]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      if (isEditing) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection('right');
          break;
        case 'Enter':
          e.preventDefault();
          setIsEditing(true);
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
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            setSelectedCell({ row: 0, col: 0 });
            rowVirtualizer.scrollToIndex(0);
            colVirtualizer.scrollToIndex(0);
          } else {
            setSelectedCell({ row: selectedCell.row, col: 0 });
            colVirtualizer.scrollToIndex(0);
          }
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            // Go to last used cell
            const lastRow = Math.min(maxRows - 1, 999);
            const lastCol = Math.min(maxCols - 1, 25);
            setSelectedCell({ row: lastRow, col: lastCol });
            rowVirtualizer.scrollToIndex(lastRow);
            colVirtualizer.scrollToIndex(lastCol);
          }
          break;
        case 'PageUp':
          e.preventDefault();
          {
            const visibleRows = Math.floor(containerSize.height / DEFAULT_CELL_HEIGHT);
            const newRow = Math.max(0, selectedCell.row - visibleRows);
            setSelectedCell({ row: newRow, col: selectedCell.col });
            rowVirtualizer.scrollToIndex(newRow);
          }
          break;
        case 'PageDown':
          e.preventDefault();
          {
            const visibleRows = Math.floor(containerSize.height / DEFAULT_CELL_HEIGHT);
            const newRow = Math.min(maxRows - 1, selectedCell.row + visibleRows);
            setSelectedCell({ row: newRow, col: selectedCell.col });
            rowVirtualizer.scrollToIndex(newRow);
          }
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
  }, [
    selectedCell,
    isEditing,
    moveSelection,
    setIsEditing,
    setSelectedCell,
    handleCellSubmit,
    rowVirtualizer,
    colVirtualizer,
    containerSize,
    maxRows,
    maxCols,
  ]);

  // Scroll selected cell into view
  useEffect(() => {
    if (selectedCell && !isEditing) {
      const { row, col } = selectedCell;

      // Check if cell is visible
      const rowStart = virtualRows[0]?.index ?? 0;
      const rowEnd = virtualRows[virtualRows.length - 1]?.index ?? 0;
      const colStart = virtualCols[0]?.index ?? 0;
      const colEnd = virtualCols[virtualCols.length - 1]?.index ?? 0;

      if (row < rowStart || row > rowEnd) {
        rowVirtualizer.scrollToIndex(row, { align: 'center' });
      }
      if (col < colStart || col > colEnd) {
        colVirtualizer.scrollToIndex(col, { align: 'center' });
      }
    }
  }, [selectedCell, isEditing, virtualRows, virtualCols, rowVirtualizer, colVirtualizer]);

  // Compute total sizes
  const totalWidth = colVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Render virtual cells
  const virtualCells = useMemo(() => {
    const cells: React.ReactNode[] = [];

    for (const virtualRow of virtualRows) {
      for (const virtualCol of virtualCols) {
        const row = virtualRow.index;
        const col = virtualCol.index;
        const data = getCellData(row, col);
        const isSelected = selectedCell?.row === row && selectedCell?.col === col;
        const cellIsInRange = isInRange(row, col);

        cells.push(
          <CellRenderer
            key={`${row}-${col}`}
            row={row}
            col={col}
            data={data}
            width={virtualCol.size}
            height={virtualRow.size}
            isSelected={isSelected}
            isInRange={cellIsInRange}
            isEditing={isSelected && isEditing}
            onClick={() => handleCellClick(row, col)}
            onDoubleClick={() => handleCellDoubleClick(row, col)}
            style={{
              position: 'absolute',
              left: virtualCol.start,
              top: virtualRow.start,
            }}
          />
        );
      }
    }

    return cells;
  }, [
    virtualRows,
    virtualCols,
    getCellData,
    selectedCell,
    isEditing,
    isInRange,
    handleCellClick,
    handleCellDoubleClick,
  ]);

  // Selection overlay position
  const selectionStyle = useMemo<React.CSSProperties | null>(() => {
    if (!selectedCell || isEditing) return null;

    const { row, col } = selectedCell;

    // Find the virtual items for this cell
    const virtualRow = virtualRows.find((vr) => vr.index === row);
    const virtualCol = virtualCols.find((vc) => vc.index === col);

    if (!virtualRow || !virtualCol) return null;

    return {
      position: 'absolute',
      left: virtualCol.start,
      top: virtualRow.start,
      width: virtualCol.size,
      height: virtualRow.size,
      border: '2px solid #2563eb',
      pointerEvents: 'none',
      zIndex: 20,
    };
  }, [selectedCell, isEditing, virtualRows, virtualCols]);

  // Range selection overlay
  const rangeSelectionStyle = useMemo<React.CSSProperties | null>(() => {
    if (!selectionRange) return null;

    const { start, end } = selectionRange;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    const startVirtualRow = virtualRows.find((vr) => vr.index === minRow);
    const endVirtualRow = virtualRows.find((vr) => vr.index === maxRow);
    const startVirtualCol = virtualCols.find((vc) => vc.index === minCol);
    const endVirtualCol = virtualCols.find((vc) => vc.index === maxCol);

    if (!startVirtualRow || !endVirtualRow || !startVirtualCol || !endVirtualCol) {
      return null;
    }

    return {
      position: 'absolute',
      left: startVirtualCol.start,
      top: startVirtualRow.start,
      width: endVirtualCol.start + endVirtualCol.size - startVirtualCol.start,
      height: endVirtualRow.start + endVirtualRow.size - startVirtualRow.start,
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      border: '1px solid #2563eb',
      pointerEvents: 'none',
      zIndex: 15,
    };
  }, [selectionRange, virtualRows, virtualCols]);

  // Cell editor position
  const editorPosition = useMemo(() => {
    if (!selectedCell || !isEditing) return null;

    const { row, col } = selectedCell;
    const virtualRow = virtualRows.find((vr) => vr.index === row);
    const virtualCol = virtualCols.find((vc) => vc.index === col);

    if (!virtualRow || !virtualCol) return null;

    return {
      left: virtualCol.start,
      top: virtualRow.start,
      width: virtualCol.size,
      height: virtualRow.size,
    };
  }, [selectedCell, isEditing, virtualRows, virtualCols]);

  return (
    <div
      ref={containerRef}
      className="virtual-grid relative flex-1 overflow-hidden bg-white"
      role="grid"
      aria-rowcount={maxRows}
      aria-colcount={maxCols}
    >
      {/* Row and Column Headers */}
      <VirtualHeaders
        virtualRows={virtualRows}
        virtualCols={virtualCols}
        scrollTop={scrollPosition.top}
        scrollLeft={scrollPosition.left}
        headerWidth={DEFAULT_HEADER_WIDTH}
        headerHeight={DEFAULT_HEADER_HEIGHT}
        selectedRow={selectedCell?.row}
        selectedCol={selectedCell?.col}
      />

      {/* Main scrollable grid area */}
      <div
        ref={scrollContainerRef}
        className="absolute overflow-auto"
        style={{
          left: DEFAULT_HEADER_WIDTH,
          top: DEFAULT_HEADER_HEIGHT,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Virtual content container */}
        <div
          style={{
            width: totalWidth,
            height: totalHeight,
            position: 'relative',
          }}
        >
          {/* Virtual cells */}
          {virtualCells}

          {/* Range selection overlay */}
          {rangeSelectionStyle && <div style={rangeSelectionStyle} />}

          {/* Selection overlay */}
          {selectionStyle && <div style={selectionStyle} />}

          {/* Cell editor */}
          {isEditing && selectedCell && editorPosition && (
            <VirtualCellEditor
              row={selectedCell.row}
              col={selectedCell.col}
              initialValue={
                getCellFormula(sheetId, selectedCell.row, selectedCell.col) ||
                getCellDisplayValue(sheetId, selectedCell.row, selectedCell.col) ||
                ''
              }
              position={editorPosition}
              onSubmit={handleCellSubmit}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      </div>

      {/* Performance indicator (dev mode) */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/90 px-2 py-1 rounded shadow">
          Rows: {virtualRows.length} | Cols: {virtualCols.length} |
          Cells: {virtualRows.length * virtualCols.length}
        </div>
      )}
    </div>
  );
});

VirtualGrid.displayName = 'VirtualGrid';
