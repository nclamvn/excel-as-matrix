import React, { memo, useMemo } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';
import { getColumnLabel } from './VirtualGrid';

export interface VirtualHeadersProps {
  virtualRows: VirtualItem[];
  virtualCols: VirtualItem[];
  scrollTop: number;
  scrollLeft: number;
  headerWidth: number;
  headerHeight: number;
  selectedRow?: number;
  selectedCol?: number;
}

export const VirtualHeaders = memo<VirtualHeadersProps>(({
  virtualRows,
  virtualCols,
  scrollTop,
  scrollLeft,
  headerWidth,
  headerHeight,
  selectedRow,
  selectedCol,
}) => {
  // Render column headers
  const columnHeaders = useMemo(() => {
    return virtualCols.map((virtualCol) => {
      const isSelected = selectedCol === virtualCol.index;
      return (
        <div
          key={`col-header-${virtualCol.index}`}
          className={`
            absolute flex items-center justify-center text-xs font-medium
            border-r border-b border-gray-300 bg-gray-100
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}
          `}
          style={{
            left: virtualCol.start,
            top: 0,
            width: virtualCol.size,
            height: headerHeight,
          }}
        >
          {getColumnLabel(virtualCol.index)}
        </div>
      );
    });
  }, [virtualCols, headerHeight, selectedCol]);

  // Render row headers
  const rowHeaders = useMemo(() => {
    return virtualRows.map((virtualRow) => {
      const isSelected = selectedRow === virtualRow.index;
      return (
        <div
          key={`row-header-${virtualRow.index}`}
          className={`
            absolute flex items-center justify-center text-xs font-medium
            border-r border-b border-gray-300 bg-gray-100
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}
          `}
          style={{
            left: 0,
            top: virtualRow.start,
            width: headerWidth,
            height: virtualRow.size,
          }}
        >
          {virtualRow.index + 1}
        </div>
      );
    });
  }, [virtualRows, headerWidth, selectedRow]);

  // Total sizes for positioning
  const lastCol = virtualCols[virtualCols.length - 1];
  const lastRow = virtualRows[virtualRows.length - 1];
  const totalColWidth = lastCol ? lastCol.start + lastCol.size : 0;
  const totalRowHeight = lastRow ? lastRow.start + lastRow.size : 0;

  return (
    <>
      {/* Corner cell (top-left) */}
      <div
        className="absolute bg-gray-200 border-r border-b border-gray-300 z-30"
        style={{
          left: 0,
          top: 0,
          width: headerWidth,
          height: headerHeight,
        }}
      />

      {/* Column headers (fixed at top) */}
      <div
        className="absolute overflow-hidden z-20"
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
            width: totalColWidth,
            height: headerHeight,
            transform: `translateX(-${scrollLeft}px)`,
          }}
        >
          {columnHeaders}
        </div>
      </div>

      {/* Row headers (fixed at left) */}
      <div
        className="absolute overflow-hidden z-20"
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
            width: headerWidth,
            height: totalRowHeight,
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {rowHeaders}
        </div>
      </div>
    </>
  );
});

VirtualHeaders.displayName = 'VirtualHeaders';

// Resizable column header (for column width adjustment)
export const ResizableColumnHeader = memo<{
  index: number;
  width: number;
  isSelected: boolean;
  onResize: (index: number, width: number) => void;
  style: React.CSSProperties;
}>(({ index, width, isSelected, onResize, style }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(30, startWidth + delta);
      onResize(index, newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`
        absolute flex items-center justify-center text-xs font-medium
        border-r border-b border-gray-300 bg-gray-100 group
        ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}
      `}
      style={style}
    >
      <span>{getColumnLabel(index)}</span>
      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
});

ResizableColumnHeader.displayName = 'ResizableColumnHeader';

// Resizable row header (for row height adjustment)
export const ResizableRowHeader = memo<{
  index: number;
  height: number;
  isSelected: boolean;
  onResize: (index: number, height: number) => void;
  style: React.CSSProperties;
}>(({ index, height, isSelected, onResize, style }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(16, startHeight + delta);
      onResize(index, newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`
        absolute flex items-center justify-center text-xs font-medium
        border-r border-b border-gray-300 bg-gray-100 group
        ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}
      `}
      style={style}
    >
      <span>{index + 1}</span>
      {/* Resize handle */}
      <div
        className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
});

ResizableRowHeader.displayName = 'ResizableRowHeader';
