import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAutofill, FillDirection } from '../../hooks/useAutofill';

interface AutofillHandleProps {
  sheetId: string;
  selection: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  getColWidth?: (col: number) => number | undefined;
  getRowHeight?: (row: number) => number | undefined;
}

export const AutofillHandle: React.FC<AutofillHandleProps> = ({
  sheetId,
  selection,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  getColWidth,
  getRowHeight,
}) => {
  const { autofill } = useAutofill();

  const [isDragging, setIsDragging] = useState(false);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleX = useMemo(() => {
    let x = headerWidth;
    for (let i = 0; i <= selection.endCol; i++) {
      x += getColWidth?.(i) ?? cellWidth;
    }
    return x - 4;
  }, [selection.endCol, getColWidth, cellWidth, headerWidth]);

  const handleY = useMemo(() => {
    let y = headerHeight;
    for (let i = 0; i <= selection.endRow; i++) {
      y += getRowHeight?.(i) ?? cellHeight;
    }
    return y - 4;
  }, [selection.endRow, getRowHeight, cellHeight, headerHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      let targetRow = selection.endRow;
      let targetCol = selection.endCol;

      if (Math.abs(dy) > Math.abs(dx)) {
        const rowDelta = Math.floor(dy / cellHeight);
        targetRow = selection.endRow + rowDelta;
      } else {
        const colDelta = Math.floor(dx / cellWidth);
        targetCol = selection.endCol + colDelta;
      }

      targetRow = Math.max(0, targetRow);
      targetCol = Math.max(0, targetCol);

      setDragEnd({ row: targetRow, col: targetCol });
    },
    [isDragging, selection, cellWidth, cellHeight]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragEnd) {
      setIsDragging(false);
      return;
    }

    let direction: FillDirection;
    const targetRange = { ...selection };

    if (dragEnd.row > selection.endRow) {
      direction = 'down';
      targetRange.endRow = dragEnd.row;
    } else if (dragEnd.row < selection.startRow) {
      direction = 'up';
      targetRange.startRow = dragEnd.row;
    } else if (dragEnd.col > selection.endCol) {
      direction = 'right';
      targetRange.endCol = dragEnd.col;
    } else {
      direction = 'left';
      targetRange.startCol = dragEnd.col;
    }

    autofill(sheetId, selection, targetRange, direction);

    setIsDragging(false);
    setDragEnd(null);
    dragStartRef.current = null;
  }, [isDragging, dragEnd, selection, sheetId, autofill]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <>
      <div
        className="absolute w-2 h-2 bg-blue-600 border border-white cursor-crosshair z-20"
        style={{
          left: handleX,
          top: handleY,
        }}
        onMouseDown={handleMouseDown}
      />

      {isDragging && dragEnd && (
        <AutofillPreview
          selection={selection}
          dragEnd={dragEnd}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          headerWidth={headerWidth}
          headerHeight={headerHeight}
        />
      )}
    </>
  );
};

interface AutofillPreviewProps {
  selection: { startRow: number; startCol: number; endRow: number; endCol: number };
  dragEnd: { row: number; col: number };
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
}

const AutofillPreview: React.FC<AutofillPreviewProps> = ({
  selection,
  dragEnd,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
}) => {
  const minRow = Math.min(selection.startRow, dragEnd.row);
  const maxRow = Math.max(selection.endRow, dragEnd.row);
  const minCol = Math.min(selection.startCol, dragEnd.col);
  const maxCol = Math.max(selection.endCol, dragEnd.col);

  const x = headerWidth + minCol * cellWidth;
  const y = headerHeight + minRow * cellHeight;
  const width = (maxCol - minCol + 1) * cellWidth;
  const height = (maxRow - minRow + 1) * cellHeight;

  return (
    <div
      className="absolute border-2 border-blue-600 border-dashed bg-blue-100/30 pointer-events-none z-10"
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
    />
  );
};

export default AutofillHandle;
