// Phase 5: Dashboard Widget Component
// Individual widget container with type-specific rendering

import React from 'react';
import { DashboardWidget as WidgetType, DashboardTheme } from '../../types/visualization';

interface DashboardWidgetProps {
  widget: WidgetType;
  theme: DashboardTheme;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  theme,
  isEditMode,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
}) => {
  const renderContent = () => {
    switch (widget.widgetType) {
      case 'KPI':
        return <KPIContent widget={widget} theme={theme} />;
      case 'Text':
        return <TextContent widget={widget} theme={theme} />;
      case 'Image':
        return <ImageContent widget={widget} />;
      case 'Chart':
        return <PlaceholderContent type="Chart" icon="chart" />;
      case 'PivotTable':
        return <PlaceholderContent type="Pivot Table" icon="table" />;
      case 'Table':
        return <PlaceholderContent type="Data Table" icon="table" />;
      case 'Gauge':
        return <GaugeContent widget={widget} theme={theme} />;
      default:
        return <PlaceholderContent type={widget.widgetType} icon="widget" />;
    }
  };

  return (
    <div
      className={`
        w-full h-full rounded-lg overflow-hidden transition-shadow
        ${widget.config.showShadow ? 'shadow-lg' : 'shadow-sm'}
        ${isEditMode ? 'cursor-move' : ''}
      `}
      style={{
        backgroundColor: widget.style.backgroundColor,
        border: widget.config.showBorder ? `1px solid ${widget.style.borderColor}` : 'none',
        borderRadius: widget.style.borderRadius,
      }}
      onClick={onSelect}
      onMouseDown={isEditMode ? onDragStart : undefined}
    >
      {/* Header */}
      {widget.config.showTitle && widget.title && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: widget.style.borderColor }}
        >
          <span
            className="font-medium truncate"
            style={{
              fontSize: widget.style.titleFontSize,
              color: widget.style.titleColor,
            }}
          >
            {widget.title}
          </span>

          {isEditMode && isSelected && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-gray-400 hover:text-red-500 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="h-full overflow-hidden"
        style={{ padding: widget.style.padding }}
      >
        {renderContent()}
      </div>

      {/* Edit mode indicator */}
      {isEditMode && isSelected && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
      )}
    </div>
  );
};

// KPI Widget Content
const KPIContent: React.FC<{ widget: WidgetType; theme: DashboardTheme }> = ({
  widget,
  theme,
}) => {
  const kpi = widget.config.kpiConfig;
  if (!kpi) return null;

  // Demo values - in real app would fetch from data source
  const value = 125678;
  const comparison = 12.5;
  const isPositive = comparison >= 0;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-baseline gap-2">
        {kpi.prefix && (
          <span className="text-2xl" style={{ color: theme.textColor + '80' }}>
            {kpi.prefix}
          </span>
        )}
        <span className="text-4xl font-bold" style={{ color: theme.primaryColor }}>
          {value.toLocaleString()}
        </span>
        {kpi.suffix && (
          <span className="text-2xl" style={{ color: theme.textColor + '80' }}>
            {kpi.suffix}
          </span>
        )}
      </div>

      {kpi.comparisonType !== 'None' && (
        <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            {isPositive ? (
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            )}
          </svg>
          <span className="text-sm font-medium">{Math.abs(comparison)}%</span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
};

// Text Widget Content
const TextContent: React.FC<{ widget: WidgetType; theme: DashboardTheme }> = ({
  widget,
  theme,
}) => {
  return (
    <div
      className="h-full overflow-auto prose prose-sm max-w-none"
      style={{ color: theme.textColor }}
      dangerouslySetInnerHTML={{ __html: widget.config.textContent || '' }}
    />
  );
};

// Image Widget Content
const ImageContent: React.FC<{ widget: WidgetType }> = ({ widget }) => {
  if (!widget.config.imageUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No image URL
      </div>
    );
  }

  return (
    <img
      src={widget.config.imageUrl}
      alt={widget.title || 'Dashboard image'}
      className="w-full h-full object-contain"
    />
  );
};

// Gauge Widget Content
const GaugeContent: React.FC<{ widget: WidgetType; theme: DashboardTheme }> = ({
  widget,
  theme,
}) => {
  const gauge = widget.config.gaugeConfig;
  if (!gauge) return null;

  // Demo value
  const value = 75;
  const percentage = ((value - gauge.minValue) / (gauge.maxValue - gauge.minValue)) * 100;
  const angle = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={theme.primaryColor}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
        />

        {/* Needle */}
        <g transform={`rotate(${angle} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke={theme.textColor} strokeWidth="3" />
          <circle cx="100" cy="100" r="8" fill={theme.textColor} />
        </g>
      </svg>

      {gauge.showValue && (
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
            {value}
          </span>
          {gauge.showPercentage && (
            <span className="text-sm text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
          )}
        </div>
      )}
    </div>
  );
};

// Placeholder Content for chart/table widgets
const PlaceholderContent: React.FC<{ type: string; icon: string }> = ({ type, icon }) => {
  const icons: Record<string, React.ReactNode> = {
    chart: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    table: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    ),
    widget: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[icon] || icons.widget}
      </svg>
      <span className="text-sm">{type}</span>
    </div>
  );
};
