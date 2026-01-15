// Phase 5: Chart Container Component
// Wrapper for all chart types with common controls

import React, { useCallback, useRef, useState } from 'react';
import { useChartStore } from '../../stores/chartStore';
import { Chart } from '../../types/visualization';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { AreaChart } from './AreaChart';

interface ChartContainerProps {
  chart: Chart;
  data?: {
    categories: string[];
    series: { name: string; values: number[]; color: string }[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  chart,
  data,
  onEdit,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const { selectChart, updatePosition, selectedChartId } = useChartStore();

  const isSelected = selectedChartId === chart.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectChart(chart.id);
  }, [chart.id, selectChart]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX - chart.position.x;
    const startY = e.clientY - chart.position.y;

    const handleMove = (moveEvent: MouseEvent) => {
      updatePosition(chart.id, {
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [chart.id, chart.position.x, chart.position.y, updatePosition]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startWidth = chart.position.width;
    const startHeight = chart.position.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(150, startHeight + (moveEvent.clientY - startY));
      updatePosition(chart.id, { width: newWidth, height: newHeight });
    };

    const handleUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [chart.id, chart.position.width, chart.position.height, updatePosition]);

  const renderChart = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          No data available
        </div>
      );
    }

    const chartProps = {
      width: chart.position.width - 40,
      height: chart.position.height - (chart.title ? 80 : 40),
      categories: data.categories,
      series: data.series,
      style: chart.style,
      legend: chart.legend,
      axes: chart.axes,
    };

    switch (chart.chartType) {
      case 'Line':
        return <LineChart {...chartProps} />;
      case 'Bar':
      case 'ColumnStacked':
      case 'ColumnClustered':
        return <BarChart {...chartProps} stacked={chart.chartType === 'ColumnStacked'} />;
      case 'Pie':
      case 'Doughnut':
        return <PieChart {...chartProps} isDoughnut={chart.chartType === 'Doughnut'} />;
      case 'Area':
      case 'AreaStacked':
        return <AreaChart {...chartProps} stacked={chart.chartType === 'AreaStacked'} />;
      default:
        return <LineChart {...chartProps} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`absolute rounded-lg shadow-sm transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        left: chart.position.x,
        top: chart.position.y,
        width: chart.position.width,
        height: chart.position.height,
        backgroundColor: chart.style.backgroundColor,
        border: chart.style.borderColor ? `${chart.style.borderWidth}px solid ${chart.style.borderColor}` : 'none',
        borderRadius: chart.style.roundedCorners ? '8px' : '0',
        zIndex: chart.position.zIndex + (isSelected ? 100 : 0),
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-grab border-b border-gray-100"
        onMouseDown={handleDragStart}
      >
        <span className="font-medium text-gray-700 truncate">
          {chart.title?.text || chart.name}
        </span>

        {isSelected && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-4 h-[calc(100%-44px)]">
        {renderChart()}
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
