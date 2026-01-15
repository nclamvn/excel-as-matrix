// Phase 5: Dashboard View Component
// Main dashboard container with draggable widgets

import React, { useCallback, useMemo, useState } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { Dashboard, WidgetPosition } from '../../types/visualization';
import { DashboardWidget as WidgetComponent } from './DashboardWidget';
import { DashboardToolbar } from './DashboardToolbar';

interface DashboardViewProps {
  dashboard: Dashboard;
  onWidgetClick?: (widgetId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboard,
  onWidgetClick,
}) => {
  const {
    isEditMode,
    isPresentationMode,
    selectedWidgetId,
    selectWidget,
    updateWidgetPositions,
    removeWidget,
  } = useDashboardStore();

  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { columns, rowHeight, margin, padding } = dashboard.layout;

  const containerWidth = 1200; // Could be responsive
  const colWidth = (containerWidth - padding[0] * 2 - margin[0] * (columns - 1)) / columns;

  // Calculate pixel position from grid position
  const getPixelPosition = useCallback(
    (pos: WidgetPosition) => ({
      left: pos.x * (colWidth + margin[0]) + padding[0],
      top: pos.y * (rowHeight + margin[1]) + padding[1],
      width: pos.w * colWidth + (pos.w - 1) * margin[0],
      height: pos.h * rowHeight + (pos.h - 1) * margin[1],
    }),
    [colWidth, rowHeight, margin, padding]
  );

  // Calculate grid position from pixel position
  const getGridPosition = useCallback(
    (pixelX: number, pixelY: number, width: number, height: number): WidgetPosition => {
      const x = Math.max(0, Math.min(columns - 1, Math.round((pixelX - padding[0]) / (colWidth + margin[0]))));
      const y = Math.max(0, Math.round((pixelY - padding[1]) / (rowHeight + margin[1])));
      const w = Math.max(1, Math.min(columns - x, Math.round((width + margin[0]) / (colWidth + margin[0]))));
      const h = Math.max(1, Math.round((height + margin[1]) / (rowHeight + margin[1])));
      return { x, y, w, h, isStatic: false };
    },
    [columns, colWidth, rowHeight, margin, padding]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      if (!isEditMode) return;
      e.preventDefault();
      setIsDragging(true);
      setDraggedWidget(widgetId);
      selectWidget(widgetId);

      const widget = dashboard.widgets.find((w) => w.id === widgetId);
      if (widget) {
        const pixelPos = getPixelPosition(widget.position);
        setDragOffset({
          x: e.clientX - pixelPos.left,
          y: e.clientY - pixelPos.top,
        });
      }
    },
    [isEditMode, dashboard.widgets, getPixelPosition, selectWidget]
  );

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !draggedWidget) return;

      const widget = dashboard.widgets.find((w) => w.id === draggedWidget);
      if (!widget) return;

      const pixelPos = getPixelPosition(widget.position);
      const newPixelX = e.clientX - dragOffset.x;
      const newPixelY = e.clientY - dragOffset.y;

      const newGridPos = getGridPosition(newPixelX, newPixelY, pixelPos.width, pixelPos.height);

      updateWidgetPositions(dashboard.id, [
        { id: draggedWidget, position: { ...widget.position, x: newGridPos.x, y: newGridPos.y } },
      ]);
    },
    [isDragging, draggedWidget, dashboard, dragOffset, getPixelPosition, getGridPosition, updateWidgetPositions]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedWidget(null);
  }, []);

  const handleWidgetSelect = useCallback(
    (widgetId: string) => {
      selectWidget(widgetId);
      onWidgetClick?.(widgetId);
    },
    [selectWidget, onWidgetClick]
  );

  const handleWidgetDelete = useCallback(
    (widgetId: string) => {
      if (confirm('Delete this widget?')) {
        removeWidget(dashboard.id, widgetId);
      }
    },
    [dashboard.id, removeWidget]
  );

  // Calculate total height based on widget positions
  const totalHeight = useMemo(() => {
    if (dashboard.widgets.length === 0) return 400;
    const maxBottom = Math.max(
      ...dashboard.widgets.map((w) => (w.position.y + w.position.h) * rowHeight + padding[1] * 2)
    );
    return Math.max(400, maxBottom + 100);
  }, [dashboard.widgets, rowHeight, padding]);

  return (
    <div
      className="relative w-full"
      style={{
        backgroundColor: dashboard.theme.backgroundColor,
        minHeight: totalHeight,
        fontFamily: dashboard.theme.fontFamily,
      }}
      onMouseMove={isDragging ? handleDrag : undefined}
      onMouseUp={isDragging ? handleDragEnd : undefined}
      onMouseLeave={isDragging ? handleDragEnd : undefined}
    >
      {/* Toolbar */}
      {dashboard.settings.showToolbar && !isPresentationMode && (
        <DashboardToolbar dashboard={dashboard} />
      )}

      {/* Grid background (edit mode only) */}
      {isEditMode && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${dashboard.theme.textColor}20 1px, transparent 1px),
              linear-gradient(to bottom, ${dashboard.theme.textColor}20 1px, transparent 1px)
            `,
            backgroundSize: `${colWidth + margin[0]}px ${rowHeight + margin[1]}px`,
            backgroundPosition: `${padding[0]}px ${padding[1]}px`,
          }}
        />
      )}

      {/* Widgets */}
      {dashboard.widgets.map((widget) => {
        const pixelPos = getPixelPosition(widget.position);
        const isSelected = selectedWidgetId === widget.id;
        const isBeingDragged = draggedWidget === widget.id;

        return (
          <div
            key={widget.id}
            className={`absolute transition-all duration-150 ${
              isBeingDragged ? 'z-50 opacity-90' : ''
            } ${isSelected && isEditMode ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: pixelPos.left,
              top: pixelPos.top,
              width: pixelPos.width,
              height: pixelPos.height,
            }}
          >
            <WidgetComponent
              widget={widget}
              theme={dashboard.theme}
              isEditMode={isEditMode}
              isSelected={isSelected}
              onSelect={() => handleWidgetSelect(widget.id)}
              onDelete={() => handleWidgetDelete(widget.id)}
              onDragStart={(e) => handleDragStart(e, widget.id)}
            />
          </div>
        );
      })}

      {/* Empty state */}
      {dashboard.widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: dashboard.theme.textColor + '40' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <p style={{ color: dashboard.theme.textColor + '80' }}>
              Add widgets to build your dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
