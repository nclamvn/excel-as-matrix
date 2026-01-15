import React, { useMemo } from 'react';

interface FreezeIndicatorProps {
  frozenRows: number;
  frozenCols: number;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  getColWidth?: (col: number) => number | undefined;
  getRowHeight?: (row: number) => number | undefined;
}

export const FreezeIndicator: React.FC<FreezeIndicatorProps> = ({
  frozenRows,
  frozenCols,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  getColWidth,
  getRowHeight,
}) => {
  const frozenWidth = useMemo(() => {
    let width = 0;
    for (let i = 0; i < frozenCols; i++) {
      width += getColWidth?.(i) ?? cellWidth;
    }
    return width;
  }, [frozenCols, getColWidth, cellWidth]);

  const frozenHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < frozenRows; i++) {
      height += getRowHeight?.(i) ?? cellHeight;
    }
    return height;
  }, [frozenRows, getRowHeight, cellHeight]);

  if (frozenRows === 0 && frozenCols === 0) return null;

  return (
    <>
      {frozenRows > 0 && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: 0,
            top: headerHeight + frozenHeight,
            width: '100%',
            height: 2,
            background:
              'linear-gradient(to right, #6B7280 0%, #6B7280 50%, transparent 50%)',
            backgroundSize: '8px 2px',
          }}
        />
      )}

      {frozenCols > 0 && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: headerWidth + frozenWidth,
            top: 0,
            width: 2,
            height: '100%',
            background:
              'linear-gradient(to bottom, #6B7280 0%, #6B7280 50%, transparent 50%)',
            backgroundSize: '2px 8px',
          }}
        />
      )}

      {frozenRows > 0 && frozenCols > 0 && (
        <div
          className="absolute z-30 w-2 h-2 bg-gray-500 rounded-full pointer-events-none"
          style={{
            left: headerWidth + frozenWidth - 3,
            top: headerHeight + frozenHeight - 3,
          }}
        />
      )}
    </>
  );
};

export default FreezeIndicator;
