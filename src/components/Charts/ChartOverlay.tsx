// ═══════════════════════════════════════════════════════════════════════════
// CHART OVERLAY - Displays charts on top of the grid
// Supports dragging, resizing, and selection
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useRef, useState } from 'react';
import { X, Move, Maximize2 } from 'lucide-react';
import { useChartStore } from '../../stores/chartStore';
import { ChartRenderer, ChartConfig, ChartData } from './ChartRenderer';
import { Chart as ChartType } from '../../types/visualization';

interface ChartOverlayProps {
  sheetId: string;
}

export const ChartOverlay: React.FC<ChartOverlayProps> = ({ sheetId }) => {
  const charts = useChartStore((state) => state.getChartsBySheet(sheetId));
  const chartData = useChartStore((state) => state.chartData);
  const selectedChartId = useChartStore((state) => state.selectedChartId);
  const selectChart = useChartStore((state) => state.selectChart);
  const updatePosition = useChartStore((state) => state.updatePosition);
  const deleteChart = useChartStore((state) => state.deleteChart);

  return (
    <div className="chart-overlay-container">
      {charts.map((chart) => (
        <DraggableChart
          key={chart.id}
          chart={chart}
          data={chartData.get(chart.id)}
          isSelected={selectedChartId === chart.id}
          onSelect={() => selectChart(chart.id)}
          onMove={(x, y) => updatePosition(chart.id, { x, y })}
          onResize={(width, height) => updatePosition(chart.id, { width, height })}
          onDelete={() => deleteChart(chart.id)}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DRAGGABLE CHART
// ═══════════════════════════════════════════════════════════════════════════

interface DraggableChartProps {
  chart: ChartType;
  data?: import('../../types/visualization').ChartData;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onDelete: () => void;
}

const DraggableChart: React.FC<DraggableChartProps> = ({
  chart,
  data,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Convert chart data to ChartRenderer format
  const extraSeriesKeys = data && data.series.length > 1
    ? data.series.slice(1).map(s => s.name || `series${data.series.indexOf(s)}`)
    : undefined;
  const chartConfig: ChartConfig = {
    id: chart.id,
    type: mapChartType(chart.chartType),
    title: chart.title?.text || chart.name,
    data: convertChartData(data),
    colors: chart.colors,
    showLegend: chart.legend.visible,
    showGrid: chart.axes.xAxis.gridlines,
    seriesKeys: extraSeriesKeys,
  };

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = {
      x: chart.position.x,
      y: chart.position.y,
      width: chart.position.width,
      height: chart.position.height,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onMove(
        Math.max(0, initialPos.current.x + dx),
        Math.max(0, initialPos.current.y + dy)
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chart.position, onMove, onSelect]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = {
      x: chart.position.x,
      y: chart.position.y,
      width: chart.position.width,
      height: chart.position.height,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onResize(
        Math.max(200, initialPos.current.width + dx),
        Math.max(150, initialPos.current.height + dy)
      );
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [chart.position, onResize]);

  return (
    <div
      ref={containerRef}
      className={`chart-overlay ${isSelected ? 'chart-overlay--selected' : ''} ${isDragging ? 'chart-overlay--dragging' : ''}`}
      style={{
        position: 'absolute',
        left: chart.position.x,
        top: chart.position.y,
        width: chart.position.width,
        height: chart.position.height,
        zIndex: chart.position.zIndex + (isSelected ? 100 : 0),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Chart Header (drag handle) */}
      <div
        className="chart-overlay__header"
        onMouseDown={handleDragStart}
      >
        <Move size={14} className="chart-overlay__drag-icon" />
        <span className="chart-overlay__title">{chart.name}</span>
        <button
          className="chart-overlay__close"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Chart Content */}
      <div className="chart-overlay__content">
        <ChartRenderer
          config={chartConfig}
          width={chart.position.width - 16}
          height={chart.position.height - 40}
        />
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="chart-overlay__resize"
          onMouseDown={handleResizeStart}
        >
          <Maximize2 size={12} />
        </div>
      )}

      {/* Selection Border */}
      {isSelected && <div className="chart-overlay__selection-border" />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function mapChartType(type: ChartType['chartType']): ChartConfig['type'] {
  switch (type) {
    case 'Line': return 'line';
    case 'Bar': return 'bar';
    case 'ColumnStacked':
    case 'ColumnClustered': return 'column';
    case 'Pie':
    case 'Doughnut': return 'pie';
    case 'Area':
    case 'AreaStacked': return 'area';
    default: return 'bar';
  }
}

function convertChartData(data?: import('../../types/visualization').ChartData): ChartData[] {
  if (!data || !data.categories || !data.series.length) {
    // Return demo data if no data
    return [
      { name: 'A', value: 10 },
      { name: 'B', value: 25 },
      { name: 'C', value: 15 },
      { name: 'D', value: 30 },
    ];
  }

  // Multi-series support: each data point gets name + value (series 0) + series1, series2, etc.
  return data.categories.map((cat, i) => {
    const point: ChartData = {
      name: cat,
      value: data.series[0]?.values[i] || 0,
    };
    // Add additional series as named keys
    for (let s = 1; s < data.series.length; s++) {
      point[data.series[s].name || `series${s}`] = data.series[s]?.values[i] || 0;
    }
    return point;
  });
}

export default ChartOverlay;
