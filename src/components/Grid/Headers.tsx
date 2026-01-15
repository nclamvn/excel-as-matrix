import React, { memo } from 'react';
import { colToLetter } from '../../types/cell';

interface HeadersProps {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  scrollLeft: number;
  scrollTop: number;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  selectedRow?: number;
  selectedCol?: number;
}

export const Headers: React.FC<HeadersProps> = memo(
  ({
    startRow,
    endRow,
    startCol,
    endCol,
    scrollLeft,
    scrollTop,
    cellWidth,
    cellHeight,
    headerWidth,
    headerHeight,
    selectedRow,
    selectedCol,
  }) => {
    // Column headers
    const columnHeaders = [];
    for (let col = startCol; col < endCol; col++) {
      const isSelected = selectedCol === col;
      columnHeaders.push(
        <div
          key={`col-${col}`}
          className={`header-cell ${isSelected ? 'header-cell--selected' : ''}`}
          style={{
            position: 'absolute',
            left: col * cellWidth,
            top: 0,
            width: cellWidth,
            height: headerHeight,
            fontWeight: isSelected ? 600 : undefined,
          }}
        >
          {colToLetter(col)}
        </div>
      );
    }

    // Row headers
    const rowHeaders = [];
    for (let row = startRow; row < endRow; row++) {
      const isSelected = selectedRow === row;
      rowHeaders.push(
        <div
          key={`row-${row}`}
          className={`header-cell ${isSelected ? 'header-cell--selected' : ''}`}
          style={{
            position: 'absolute',
            left: 0,
            top: row * cellHeight,
            width: headerWidth,
            height: cellHeight,
            fontWeight: isSelected ? 600 : undefined,
          }}
        >
          {row + 1}
        </div>
      );
    }

    return (
      <>
        {/* Corner cell */}
        <div
          className="header-cell header-corner absolute z-30"
          style={{
            left: 0,
            top: 0,
            width: headerWidth,
            height: headerHeight,
          }}
        />

        {/* Column headers container */}
        <div
          className="header-container absolute z-20 overflow-hidden"
          style={{
            left: headerWidth,
            top: 0,
            right: 0,
            height: headerHeight,
          }}
        >
          <div
            style={{
              position: 'relative',
              transform: `translateX(-${scrollLeft}px)`,
            }}
          >
            {columnHeaders}
          </div>
        </div>

        {/* Row headers container */}
        <div
          className="header-container absolute z-20 overflow-hidden"
          style={{
            left: 0,
            top: headerHeight,
            width: headerWidth,
            bottom: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              transform: `translateY(-${scrollTop}px)`,
            }}
          >
            {rowHeaders}
          </div>
        </div>
      </>
    );
  }
);

Headers.displayName = 'Headers';
