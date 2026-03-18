import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { Cell } from './Cell';
import { CellEditor } from './CellEditor';
import { Headers } from './Headers';
import { Selection, RangeSelection } from './Selection';
import { getCellKey } from '../../types/cell';
import { MAX_COLS, MAX_ROWS } from '../../constants/grid';

interface GridProps {
  workbookId: string;
  sheetId: string;
}

const CELL_WIDTH = 100;
const CELL_HEIGHT = 24;
const HEADER_WIDTH = 50;
const HEADER_HEIGHT = 24;
const BUFFER_ROWS = 5;
const BUFFER_COLS = 3;

export const Grid: React.FC<GridProps> = ({ sheetId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Local drag state for performance - only update store on mouse up
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);

  // Optimized selectors - only subscribe to what we need
  const sheet = useWorkbookStore(useCallback((state) => state.sheets[sheetId], [sheetId]));
  const getCellDisplayValue = useWorkbookStore((state) => state.getCellDisplayValue);
  const getCellFormula = useWorkbookStore((state) => state.getCellFormula);
  const updateCell = useWorkbookStore((state) => state.updateCell);

  const selectedCell = useSelectionStore((state) => state.selectedCell);
  const selectionRange = useSelectionStore((state) => state.selectionRange);
  const isEditing = useSelectionStore((state) => state.isEditing);
  const setSelectedCell = useSelectionStore((state) => state.setSelectedCell);
  const setSelectionRange = useSelectionStore((state) => state.setSelectionRange);
  const setIsEditing = useSelectionStore((state) => state.setIsEditing);
  const moveSelection = useSelectionStore((state) => state.moveSelection);
  const expandSelection = useSelectionStore((state) => state.expandSelection);
  const selectRange = useSelectionStore((state) => state.selectRange);

  // Calculate visible range
  const visibleRows = Math.ceil(containerSize.height / CELL_HEIGHT) + BUFFER_ROWS * 2;
  const visibleCols = Math.ceil(containerSize.width / CELL_WIDTH) + BUFFER_COLS * 2;

  const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - BUFFER_ROWS);
  const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - BUFFER_COLS);
  const endRow = Math.min(MAX_ROWS, startRow + visibleRows);
  const endCol = Math.min(MAX_COLS, startCol + visibleCols);

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

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Handle cell mouse down (start selection)
  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (e.shiftKey && selectedCell) {
        // Shift+click extends selection
        selectRange(selectedCell, { row, col });
      } else {
        setSelectedCell({ row, col });
        setSelectionRange(null);
        setDragStart({ row, col });
        setDragEnd({ row, col });
        setIsDragging(true);
      }
    },
    [setSelectedCell, setSelectionRange, selectRange, selectedCell]
  );

  // Handle cell mouse enter (during drag) - use local state for performance
  const handleCellMouseEnter = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      // Only extend selection if mouse button is actually pressed
      if (isDragging && dragStart && e.buttons === 1) {
        // Update local state only - much faster than updating store
        setDragEnd({ row, col });
      } else if (isDragging && e.buttons !== 1) {
        // Mouse button was released but we didn't catch the event
        setIsDragging(false);
        if (dragStart && dragEnd) {
          selectRange(dragStart, dragEnd);
        }
        setDragStart(null);
        setDragEnd(null);
      }
    },
    [isDragging, dragStart, dragEnd, selectRange]
  );

  // Handle mouse up (end drag) - commit selection to store
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragStart && dragEnd) {
        // Commit the selection to store only on mouse up
        if (dragStart.row !== dragEnd.row || dragStart.col !== dragEnd.col) {
          selectRange(dragStart, dragEnd);
        }
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleMouseUp);
    };
  }, [isDragging, dragStart, dragEnd, selectRange]);

  // Direct mouseup handler on container
  const handleContainerMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      if (dragStart.row !== dragEnd.row || dragStart.col !== dragEnd.col) {
        selectRange(dragStart, dragEnd);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, selectRange]);

  const handleMouseLeave = useCallback(() => {
    // Allow dragging outside - mouseup will handle final commit
  }, []);

  // Handle cell double-click (enter edit mode)
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      setIsEditing(true);
    },
    [setSelectedCell, setIsEditing]
  );

  // Handle cell edit submit
  const handleCellSubmit = useCallback(
    (value: string) => {
      if (!selectedCell || !sheetId) return;

      const { row, col } = selectedCell;
      setIsEditing(false);

      // Update cell locally — route through updateCell so formulas get evaluated
      const isFormula = typeof value === 'string' && value.startsWith('=');
      updateCell(sheetId, row, col, {
        value,
        formula: isFormula ? value : null,
      });

      // Move to next row
      moveSelection('down');
    },
    [selectedCell, sheetId, setIsEditing, updateCell, moveSelection]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;

      if (isEditing) {
        // Let CellEditor handle these
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            expandSelection('up');
          } else {
            moveSelection('up');
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            expandSelection('down');
          } else {
            moveSelection('down');
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            expandSelection('left');
          } else {
            moveSelection('left');
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            expandSelection('right');
          } else {
            moveSelection('right');
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            moveSelection('left');
          } else {
            moveSelection('right');
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (e.shiftKey) {
            moveSelection('up');
          } else {
            setIsEditing(true);
          }
          break;
        case 'F2':
          e.preventDefault();
          setIsEditing(true);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          // Clear cell
          handleCellSubmit('');
          break;
        case 'Escape':
          e.preventDefault();
          setSelectionRange(null);
          break;
        default:
          // Start typing (any printable character)
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setIsEditing(true);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isEditing, moveSelection, expandSelection, setIsEditing, setSelectionRange, handleCellSubmit]);

  // Memoized visible cells - optimized: no per-cell range check, use overlay instead
  const visibleCells = useMemo(() => {
    const cells = [];
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = getCellKey(row, col);
        const cellData = sheet?.cells[key];
        const displayValue = cellData?.displayValue || '';
        const formula = cellData?.formula || null;
        const value = cellData?.value || null;
        const format = cellData?.format;

        cells.push(
          <Cell
            key={`${sheetId}:${row}:${col}`}
            row={row}
            col={col}
            value={value}
            formula={formula}
            displayValue={displayValue}
            format={format}
            isSelected={selectedCell?.row === row && selectedCell?.col === col}
            isInRange={false}
            onMouseDown={(e) => handleCellMouseDown(row, col, e)}
            onMouseEnter={(e) => handleCellMouseEnter(row, col, e)}
            onDoubleClick={() => handleCellDoubleClick(row, col)}
            style={{
              position: 'absolute',
              left: col * CELL_WIDTH,
              top: row * CELL_HEIGHT,
              width: CELL_WIDTH,
              height: CELL_HEIGHT,
            }}
          />
        );
      }
    }
    return cells;
  }, [startRow, endRow, startCol, endCol, sheet?.cells, sheetId, selectedCell, handleCellMouseDown, handleCellMouseEnter, handleCellDoubleClick]);

  return (
    <div className="relative h-full overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Headers */}
      <Headers
        startRow={startRow}
        endRow={endRow}
        startCol={startCol}
        endCol={endCol}
        scrollLeft={scrollLeft}
        scrollTop={scrollTop}
        cellWidth={CELL_WIDTH}
        cellHeight={CELL_HEIGHT}
        headerWidth={HEADER_WIDTH}
        headerHeight={HEADER_HEIGHT}
        selectedRow={selectedCell?.row}
        selectedCol={selectedCell?.col}
      />

      {/* Grid content */}
      <div
        ref={containerRef}
        className="absolute overflow-auto"
        style={{
          left: HEADER_WIDTH,
          top: HEADER_HEIGHT,
          right: 0,
          bottom: 0,
        }}
        onScroll={handleScroll}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Virtual content size */}
        <div
          style={{
            width: MAX_COLS * CELL_WIDTH,
            height: MAX_ROWS * CELL_HEIGHT,
            position: 'relative',
          }}
        >
          {visibleCells}

          {/* Live drag selection overlay - uses local state for instant feedback */}
          {isDragging && dragStart && dragEnd && (
            <RangeSelection
              startRow={dragStart.row}
              startCol={dragStart.col}
              endRow={dragEnd.row}
              endCol={dragEnd.col}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              headerWidth={0}
              headerHeight={0}
            />
          )}

          {/* Committed range selection overlay - from store */}
          {!isDragging && selectionRange && (
            <RangeSelection
              startRow={selectionRange.start.row}
              startCol={selectionRange.start.col}
              endRow={selectionRange.end.row}
              endCol={selectionRange.end.col}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              headerWidth={0}
              headerHeight={0}
            />
          )}

          {/* Selection overlay */}
          {selectedCell && !isEditing && !isDragging && (
            <Selection
              row={selectedCell.row}
              col={selectedCell.col}
              cellWidth={CELL_WIDTH}
              cellHeight={CELL_HEIGHT}
              headerWidth={0}
              headerHeight={0}
            />
          )}

          {/* Cell editor */}
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
              headerWidth={0}
              headerHeight={0}
              onSubmit={handleCellSubmit}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
