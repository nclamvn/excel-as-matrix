import React, { memo, useMemo } from 'react';
import type { CellValue, CellFormat } from '../../types/cell';

export interface CellData {
  value: CellValue;
  formula?: string | null;
  displayValue: string;
  format?: CellFormat;
  error?: string | null;
  isLoading?: boolean;
}

export interface CellRendererProps {
  row: number;
  col: number;
  data: CellData | null;
  width: number;
  height: number;
  isSelected: boolean;
  isInRange: boolean;
  isEditing: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  style?: React.CSSProperties;
}

// Memoized cell component for performance
export const CellRenderer = memo<CellRendererProps>(
  ({
    row,
    col,
    data,
    width,
    height,
    isSelected,
    isInRange,
    isEditing,
    onClick,
    onDoubleClick,
    style,
  }) => {
    // Compute cell style based on format
    const cellStyle = useMemo<React.CSSProperties>(() => {
      const format = data?.format;
      const baseStyle: React.CSSProperties = {
        ...style,
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        borderRight: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: 'cell',
        userSelect: 'none',
        boxSizing: 'border-box',
      };

      // Apply formatting
      if (format) {
        if (format.backgroundColor) {
          baseStyle.backgroundColor = format.backgroundColor;
        }
        if (format.textColor) {
          baseStyle.color = format.textColor;
        }
        if (format.bold) {
          baseStyle.fontWeight = 'bold';
        }
        if (format.italic) {
          baseStyle.fontStyle = 'italic';
        }
        if (format.underline) {
          baseStyle.textDecoration = 'underline';
        }
        if (format.fontSize) {
          baseStyle.fontSize = `${format.fontSize}px`;
        }
        if (format.fontFamily) {
          baseStyle.fontFamily = format.fontFamily;
        }
        if (format.align) {
          switch (format.align) {
            case 'left':
              baseStyle.justifyContent = 'flex-start';
              break;
            case 'center':
              baseStyle.justifyContent = 'center';
              break;
            case 'right':
              baseStyle.justifyContent = 'flex-end';
              break;
          }
        }
      }

      // Apply selection/range styles
      if (isSelected && !isEditing) {
        baseStyle.outline = '2px solid #2563eb';
        baseStyle.outlineOffset = '-1px';
        baseStyle.zIndex = 10;
      } else if (isInRange) {
        baseStyle.backgroundColor = format?.backgroundColor
          ? format.backgroundColor
          : 'rgba(37, 99, 235, 0.1)';
      }

      // Error styling
      if (data?.error) {
        baseStyle.color = '#dc2626';
        baseStyle.backgroundColor = '#fef2f2';
      }

      // Loading styling
      if (data?.isLoading) {
        baseStyle.backgroundColor = '#f9fafb';
        baseStyle.color = '#9ca3af';
      }

      return baseStyle;
    }, [data, width, height, isSelected, isInRange, isEditing, style]);

    // Compute display value
    const displayContent = useMemo(() => {
      if (data?.isLoading) {
        return '...';
      }

      if (data?.error) {
        return data.error;
      }

      return data?.displayValue || '';
    }, [data]);

    // Determine text alignment based on value type
    const getTextAlign = useMemo((): React.CSSProperties['justifyContent'] => {
      if (data?.format?.align) {
        switch (data.format.align) {
          case 'left':
            return 'flex-start';
          case 'center':
            return 'center';
          case 'right':
            return 'flex-end';
        }
      }

      // Auto-align: numbers right, text left
      if (data?.value !== null && data?.value !== undefined) {
        if (typeof data.value === 'number') {
          return 'flex-end';
        }
      }

      return 'flex-start';
    }, [data]);

    // Get cell title (for tooltip)
    const title = useMemo(() => {
      const parts: string[] = [];

      if (data?.formula) {
        parts.push(`Formula: ${data.formula}`);
      }

      if (data?.error) {
        parts.push(`Error: ${data.error}`);
      }

      if (displayContent && displayContent.length > 10) {
        parts.push(displayContent);
      }

      return parts.join('\n');
    }, [data, displayContent]);

    return (
      <div
        className="virtual-cell"
        data-row={row}
        data-col={col}
        style={{ ...cellStyle, justifyContent: getTextAlign }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        title={title}
        role="gridcell"
        aria-selected={isSelected}
        aria-rowindex={row + 1}
        aria-colindex={col + 1}
        tabIndex={isSelected ? 0 : -1}
      >
        {displayContent}
      </div>
    );
  },
  // Custom comparison for memo
  (prevProps, nextProps) => {
    // Always re-render if selection state changes
    if (
      prevProps.isSelected !== nextProps.isSelected ||
      prevProps.isInRange !== nextProps.isInRange ||
      prevProps.isEditing !== nextProps.isEditing
    ) {
      return false;
    }

    // Re-render if dimensions change
    if (prevProps.width !== nextProps.width || prevProps.height !== nextProps.height) {
      return false;
    }

    // Re-render if position changes
    if (prevProps.row !== nextProps.row || prevProps.col !== nextProps.col) {
      return false;
    }

    // Deep compare data
    const prevData = prevProps.data;
    const nextData = nextProps.data;

    if (prevData === nextData) return true;
    if (!prevData || !nextData) return false;

    return (
      prevData.displayValue === nextData.displayValue &&
      prevData.formula === nextData.formula &&
      prevData.error === nextData.error &&
      prevData.isLoading === nextData.isLoading &&
      JSON.stringify(prevData.format) === JSON.stringify(nextData.format)
    );
  }
);

CellRenderer.displayName = 'CellRenderer';

// Skeleton cell for loading states
export const CellSkeleton = memo<{
  width: number;
  height: number;
  style?: React.CSSProperties;
}>(({ width, height, style }) => (
  <div
    className="virtual-cell-skeleton"
    style={{
      ...style,
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      borderRight: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
    }}
  >
    <div
      style={{
        width: '60%',
        height: '40%',
        backgroundColor: '#e5e7eb',
        borderRadius: '2px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  </div>
));

CellSkeleton.displayName = 'CellSkeleton';

// Empty cell placeholder
export const EmptyCell = memo<{
  width: number;
  height: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}>(({ width, height, style, onClick }) => (
  <div
    className="virtual-cell-empty"
    style={{
      ...style,
      width,
      height,
      borderRight: '1px solid #e5e7eb',
      borderBottom: '1px solid #e5e7eb',
      cursor: 'cell',
    }}
    onClick={onClick}
  />
));

EmptyCell.displayName = 'EmptyCell';
