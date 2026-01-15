import React from 'react';

interface SelectionProps {
  row: number;
  col: number;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
}

export const Selection: React.FC<SelectionProps> = ({
  row,
  col,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
}) => {
  return (
    <div
      className="grid-selection"
      style={{
        left: headerWidth + col * cellWidth - 1,
        top: headerHeight + row * cellHeight - 1,
        width: cellWidth + 2,
        height: cellHeight + 2,
      }}
    />
  );
};

interface RangeSelectionProps {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
}

export const RangeSelection: React.FC<RangeSelectionProps> = ({
  startRow,
  startCol,
  endRow,
  endCol,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
}) => {
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  const width = (maxCol - minCol + 1) * cellWidth;
  const height = (maxRow - minRow + 1) * cellHeight;

  return (
    <div
      className="grid-range-selection"
      style={{
        left: headerWidth + minCol * cellWidth,
        top: headerHeight + minRow * cellHeight,
        width,
        height,
      }}
    />
  );
};
