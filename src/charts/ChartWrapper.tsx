// =============================================================================
// CHART WRAPPER — Base wrapper for all chart components
// =============================================================================

import React, { useRef, useEffect, useState } from 'react';
import type { ChartConfig, Annotation } from '../autoviz/types';

interface ChartWrapperProps {
  config: ChartConfig;
  children: React.ReactNode;
  onResize?: (width: number, height: number) => void;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  config,
  children,
  onResize,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [_dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { style, colorScheme, title, subtitle, legend, annotations } = config;

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        onResize?.(width, height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [onResize]);

  // Generate CSS variables
  const cssVariables = {
    '--chart-bg': style.backgroundColor,
    '--chart-text': colorScheme.textColor || '#1f2937',
    '--chart-grid': colorScheme.gridColor || '#e5e7eb',
    '--chart-primary': colorScheme.colors[0],
    '--chart-positive': colorScheme.positive || '#22c55e',
    '--chart-negative': colorScheme.negative || '#ef4444',
    '--chart-highlight': colorScheme.highlight || '#f59e0b',
    '--chart-border-radius': `${style.borderRadius}px`,
    '--chart-padding': `${style.padding}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`chart-wrapper ${className} ${style.animation ? 'animated' : ''}`}
      style={{
        ...cssVariables,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
        boxShadow: style.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      }}
    >
      {/* Title Section */}
      {title && (
        <div className="chart-header">
          <h3
            className="chart-title"
            style={{
              fontFamily: style.titleFont.family,
              fontSize: style.titleFont.size,
              fontWeight: style.titleFont.weight,
              color: style.titleFont.color,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="chart-subtitle"
              style={{
                fontFamily: style.subtitleFont.family,
                fontSize: style.subtitleFont.size,
                fontWeight: style.subtitleFont.weight,
                color: style.subtitleFont.color,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart Content */}
      <div className="chart-content">{children}</div>

      {/* Legend */}
      {legend?.show && config.data.datasets.length > 1 && (
        <div
          className={`chart-legend chart-legend-${legend.position}`}
          style={{ justifyContent: legend.align }}
        >
          {config.data.datasets.map((dataset, i) => (
            <div key={i} className="legend-item">
              <span
                className="legend-color"
                style={{
                  backgroundColor: dataset.color || colorScheme.colors[i],
                }}
              />
              <span
                className="legend-label"
                style={{
                  fontFamily: style.labelFont.family,
                  fontSize: style.labelFont.size,
                  color: style.labelFont.color,
                }}
              >
                {dataset.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Annotations (rendered as overlays) */}
      {annotations && annotations.length > 0 && (
        <div className="chart-annotations">
          {annotations.map((annotation) => (
            <AnnotationOverlay key={annotation.id} annotation={annotation} />
          ))}
        </div>
      )}
    </div>
  );
};

// Annotation Overlay Component
const AnnotationOverlay: React.FC<{ annotation: Annotation }> = ({
  annotation,
}) => {
  const { type, label, color, backgroundColor, borderColor } = annotation;

  const getStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      color: color || '#1f2937',
    };

    switch (type) {
      case 'label':
        return {
          ...base,
          backgroundColor: backgroundColor || '#ffffff',
          border: `1px solid ${borderColor || '#e5e7eb'}`,
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
        };
      case 'point':
        return {
          ...base,
          backgroundColor: backgroundColor || color,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          border: `2px solid ${borderColor || '#ffffff'}`,
        };
      default:
        return base;
    }
  };

  if (type === 'line' || type === 'trend' || type === 'region') {
    // These are rendered in SVG
    return null;
  }

  return (
    <div className={`annotation annotation-${type}`} style={getStyle()}>
      {label && <span className="annotation-label">{label}</span>}
    </div>
  );
};

export default ChartWrapper;
