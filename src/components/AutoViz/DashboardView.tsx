// =============================================================================
// DASHBOARD VIEW — Display and manage dashboards
// =============================================================================

import React, { useState, useCallback } from 'react';
import type { Dashboard, DashboardChart } from '../../autoviz/types';
import { ChartPreview } from './ChartPreview';

interface DashboardViewProps {
  dashboard: Dashboard;
  onChartClick?: (chart: DashboardChart) => void;
  onChartRemove?: (chartId: string) => void;
  onChartResize?: (chartId: string, width: number, height: number) => void;
  onChartMove?: (chartId: string, x: number, y: number) => void;
  onUpdate?: (dashboard: Dashboard) => void;
  editable?: boolean;
  language?: 'en' | 'vi';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboard,
  onChartClick,
  onChartRemove,
  onChartResize: _onChartResize,
  onChartMove: _onChartMove,
  onUpdate: _onUpdate,
  editable = false,
  language = 'en',
}) => {
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [isDragging, _setIsDragging] = useState(false);

  const { layout, charts, theme } = dashboard;

  // Calculate grid cell size
  const cellWidth = 100 / layout.columns;
  const cellHeight = layout.rowHeight;
  const gap = layout.gap;

  // Calculate chart position and size
  const getChartStyle = (chart: DashboardChart) => {
    const { x, y, w, h } = chart.position;
    return {
      left: `calc(${x * cellWidth}% + ${x > 0 ? gap / 2 : 0}px)`,
      top: y * cellHeight + (y > 0 ? gap : 0),
      width: `calc(${w * cellWidth}% - ${gap}px)`,
      height: h * cellHeight - gap,
    };
  };

  const handleChartClick = useCallback(
    (chart: DashboardChart) => {
      setSelectedChartId(chart.id);
      onChartClick?.(chart);
    },
    [onChartClick]
  );

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent, chartId: string) => {
      e.stopPropagation();
      onChartRemove?.(chartId);
    },
    [onChartRemove]
  );

  // Calculate total dashboard height
  const maxY = Math.max(...charts.map((c) => c.position.y + c.position.h), 0);
  const dashboardHeight = maxY * cellHeight + gap * (maxY + 1);

  const labels = {
    en: {
      emptyDashboard: 'No charts in this dashboard',
      addChart: 'Add Chart',
      removeChart: 'Remove',
      editChart: 'Edit',
    },
    vi: {
      emptyDashboard: 'Dashboard chưa có biểu đồ',
      addChart: 'Thêm biểu đồ',
      removeChart: 'Xóa',
      editChart: 'Sửa',
    },
  };

  const t = labels[language];

  return (
    <div
      className="dashboard-view"
      style={{
        backgroundColor: theme.background,
        minHeight: dashboardHeight,
      }}
    >
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h2 className="dashboard-title" style={{ color: theme.textColor }}>
            {dashboard.name}
          </h2>
          {dashboard.description && (
            <p className="dashboard-description" style={{ color: theme.neutral }}>
              {dashboard.description}
            </p>
          )}
        </div>

        {/* Filters */}
        {dashboard.filters && dashboard.filters.length > 0 && (
          <div className="dashboard-filters">
            {dashboard.filters.map((filter) => (
              <div key={filter.id} className="dashboard-filter">
                <label>{filter.label}</label>
                {filter.type === 'dropdown' && (
                  <select className="filter-select">
                    <option>All</option>
                  </select>
                )}
                {filter.type === 'date' && (
                  <input type="date" className="filter-date" />
                )}
                {filter.type === 'text' && (
                  <input type="text" className="filter-text" placeholder={filter.label} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div
        className="dashboard-grid"
        style={{
          height: dashboardHeight,
          position: 'relative',
        }}
      >
        {charts.length === 0 ? (
          <div className="dashboard-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            <p>{t.emptyDashboard}</p>
            {editable && (
              <button className="add-chart-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {t.addChart}
              </button>
            )}
          </div>
        ) : (
          charts.map((chart) => (
            <div
              key={chart.id}
              className={`dashboard-chart ${selectedChartId === chart.id ? 'selected' : ''} ${
                isDragging ? 'dragging' : ''
              }`}
              style={getChartStyle(chart)}
              onClick={() => handleChartClick(chart)}
            >
              <ChartPreview
                config={chart.config}
                width={
                  ((chart.position.w * window.innerWidth * 0.8) / layout.columns) - gap
                }
                height={chart.position.h * cellHeight - gap}
                showTitle={true}
                interactive={false}
              />

              {/* Edit overlay */}
              {editable && selectedChartId === chart.id && (
                <div className="chart-edit-overlay">
                  <div className="chart-actions">
                    <button
                      className="chart-action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChartClick?.(chart);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      {t.editChart}
                    </button>
                    <button
                      className="chart-action-btn remove"
                      onClick={(e) => handleRemoveClick(e, chart.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      {t.removeChart}
                    </button>
                  </div>

                  {/* Resize handles */}
                  <div className="resize-handles">
                    <div className="resize-handle resize-se" />
                    <div className="resize-handle resize-e" />
                    <div className="resize-handle resize-s" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Chart Button (floating) */}
      {editable && charts.length > 0 && (
        <button className="dashboard-add-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default DashboardView;
