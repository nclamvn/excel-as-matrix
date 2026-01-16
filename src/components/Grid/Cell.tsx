import React, { memo } from 'react';
import type { CellValue, CellFormat } from '../../types/cell';
import { formatToStyle } from '../../utils/cellFormatting';

interface CellProps {
  row: number;
  col: number;
  value: CellValue;
  formula: string | null;
  displayValue: string;
  format?: CellFormat;
  isSelected: boolean;
  isInRange: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  style: React.CSSProperties;
}

export const Cell: React.FC<CellProps> = memo(
  ({
    displayValue,
    format,
    isSelected,
    isInRange,
    onMouseDown,
    onMouseEnter,
    onDoubleClick,
    style,
  }) => {
    const className = [
      'cell',
      isSelected && 'selected',
      isInRange && 'in-range',
    ]
      .filter(Boolean)
      .join(' ');

    // Get format styles
    const formatStyles = formatToStyle(format);

    // Merge styles
    const cellStyle: React.CSSProperties = {
      ...style,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      ...formatStyles,
    };

    // Handle selection/range background (format background takes precedence if set)
    if (isInRange && !isSelected && !format?.backgroundColor) {
      cellStyle.backgroundColor = '#e3f2fd';
    }

    return (
      <div
        className={className}
        style={cellStyle}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onDoubleClick={onDoubleClick}
      >
        {displayValue}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Check if format changed
    const prevFormat = prevProps.format;
    const nextFormat = nextProps.format;
    const formatChanged =
      prevFormat?.bold !== nextFormat?.bold ||
      prevFormat?.italic !== nextFormat?.italic ||
      prevFormat?.underline !== nextFormat?.underline ||
      prevFormat?.textColor !== nextFormat?.textColor ||
      prevFormat?.backgroundColor !== nextFormat?.backgroundColor ||
      prevFormat?.fontSize !== nextFormat?.fontSize ||
      prevFormat?.fontFamily !== nextFormat?.fontFamily ||
      prevFormat?.align !== nextFormat?.align ||
      prevFormat?.numberFormat !== nextFormat?.numberFormat;

    return (
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.displayValue === nextProps.displayValue &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isInRange === nextProps.isInRange &&
      prevProps.style.left === nextProps.style.left &&
      prevProps.style.top === nextProps.style.top &&
      !formatChanged
    );
  }
);

Cell.displayName = 'Cell';
