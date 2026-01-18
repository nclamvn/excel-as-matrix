// ============================================================
// CONDITIONAL FORMATTING RENDERERS
// Data Bars, Color Scales, Icon Sets rendering components
// ============================================================

import React from 'react';
import {
  CFDataBar,
  CFColorScale,
  CFIconSet,
  ICON_SET_DEFINITIONS,
} from '../../types/conditionalFormatting';

// ============================================================
// DATA BAR RENDERER
// ============================================================

interface DataBarRendererProps {
  value: number;
  config: CFDataBar;
  minValue: number;
  maxValue: number;
  cellWidth?: number;
}

export const DataBarRenderer: React.FC<DataBarRendererProps> = ({
  value,
  config,
  minValue,
  maxValue,
  cellWidth = 100,
}) => {
  const range = maxValue - minValue || 1;
  const isNegative = value < 0;

  // Calculate percentage
  let percentage: number;
  let barStart: number = 0;

  if (minValue >= 0) {
    // All positive values
    percentage = ((value - minValue) / range) * 100;
  } else if (maxValue <= 0) {
    // All negative values
    percentage = ((maxValue - value) / range) * 100;
    barStart = 100 - percentage;
  } else {
    // Mixed values - need axis
    const zeroPosition = (Math.abs(minValue) / range) * 100;

    if (value >= 0) {
      percentage = (value / maxValue) * (100 - zeroPosition);
      barStart = zeroPosition;
    } else {
      percentage = (Math.abs(value) / Math.abs(minValue)) * zeroPosition;
      barStart = zeroPosition - percentage;
    }
  }

  // Clamp percentage
  percentage = Math.max(0, Math.min(100, percentage));

  const barColor = isNegative ? config.negativeColor : config.positiveColor;

  const barStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${barStart}%`,
    top: '10%',
    width: `${percentage}%`,
    height: '80%',
    background: config.fillType === 'gradient'
      ? `linear-gradient(90deg, ${barColor} 0%, ${barColor}66 100%)`
      : barColor,
    borderRadius: '2px',
    transition: 'width 0.2s ease',
  };

  // Axis line for mixed values
  const showAxis = config.axisPosition !== 'none' && minValue < 0 && maxValue > 0;
  const axisPosition = showAxis ? (Math.abs(minValue) / range) * 100 : 0;

  return (
    <div className="cf-databar-container" style={{ width: cellWidth }}>
      <div className="cf-databar-bg">
        {showAxis && (
          <div
            className="cf-databar-axis"
            style={{
              left: `${axisPosition}%`,
              backgroundColor: config.axisColor || '#999',
            }}
          />
        )}
        <div style={barStyle} />
      </div>
      {config.showValue && (
        <span className="cf-databar-value">{value}</span>
      )}
    </div>
  );
};

// ============================================================
// COLOR SCALE RENDERER
// ============================================================

interface ColorScaleRendererProps {
  value: number;
  config: CFColorScale;
  minValue: number;
  maxValue: number;
  midValue?: number;
}

export const ColorScaleRenderer: React.FC<ColorScaleRendererProps> = ({
  value,
  config,
  minValue,
  maxValue,
  midValue,
}) => {
  // Interpolate color based on value position
  const getInterpolatedColor = (): string => {
    const range = maxValue - minValue || 1;
    const normalizedValue = (value - minValue) / range;

    if (config.type === '2-color') {
      return interpolateColor(config.minColor, config.maxColor, normalizedValue);
    }

    // 3-color scale
    const mid = midValue ?? (minValue + maxValue) / 2;
    const midNormalized = (mid - minValue) / range;

    if (normalizedValue <= midNormalized) {
      const subNormalized = normalizedValue / midNormalized;
      return interpolateColor(config.minColor, config.midColor!, subNormalized);
    } else {
      const subNormalized = (normalizedValue - midNormalized) / (1 - midNormalized);
      return interpolateColor(config.midColor!, config.maxColor, subNormalized);
    }
  };

  return (
    <div
      className="cf-colorscale-cell"
      style={{ backgroundColor: getInterpolatedColor() }}
    />
  );
};

// Color interpolation helper
function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = parseHexColor(color1);
  const hex2 = parseHexColor(color2);

  const r = Math.round(hex1.r + (hex2.r - hex1.r) * factor);
  const g = Math.round(hex1.g + (hex2.g - hex1.g) * factor);
  const b = Math.round(hex1.b + (hex2.b - hex1.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

// ============================================================
// ICON SET RENDERER
// ============================================================

interface IconSetRendererProps {
  value: number;
  config: CFIconSet;
  minValue: number;
  maxValue: number;
}

export const IconSetRenderer: React.FC<IconSetRendererProps> = ({
  value,
  config,
  minValue,
  maxValue,
}) => {
  const iconDef = ICON_SET_DEFINITIONS.find(d => d.id === config.iconStyle);
  if (!iconDef) return null;

  const icons = config.reverseOrder
    ? [...iconDef.icons].reverse()
    : iconDef.icons;

  // Calculate which icon to show based on thresholds
  const getIconIndex = (): number => {
    const range = maxValue - minValue || 1;
    const normalizedPercent = ((value - minValue) / range) * 100;

    // Check thresholds from highest to lowest
    for (let i = 0; i < config.thresholds.length; i++) {
      const threshold = config.thresholds[i];
      let thresholdValue: number;

      switch (threshold.type) {
        case 'percent':
          thresholdValue = Number(threshold.value);
          break;
        case 'percentile':
          // For simplicity, treat as percent
          thresholdValue = Number(threshold.value);
          break;
        case 'number':
          thresholdValue = ((Number(threshold.value) - minValue) / range) * 100;
          break;
        default:
          thresholdValue = Number(threshold.value);
      }

      const passes = threshold.operator === '>='
        ? normalizedPercent >= thresholdValue
        : normalizedPercent > thresholdValue;

      if (passes) {
        return i;
      }
    }

    return icons.length - 1;
  };

  const iconIndex = getIconIndex();
  const icon = icons[iconIndex] || icons[icons.length - 1];

  // Determine icon color based on position
  const getIconColor = (): string => {
    const colors = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6'];
    if (iconDef.category === 'directional') {
      if (iconIndex === 0) return '#22c55e';
      if (iconIndex === icons.length - 1) return '#ef4444';
      return '#f59e0b';
    }
    return colors[iconIndex % colors.length];
  };

  return (
    <div className="cf-iconset-container">
      <span
        className="cf-icon"
        style={{ color: getIconColor() }}
        title={`Value: ${value}`}
      >
        {icon}
      </span>
      {config.showValue && (
        <span className="cf-iconset-value">{value}</span>
      )}
    </div>
  );
};

// ============================================================
// COMBINED CONDITIONAL FORMAT RENDERER
// ============================================================

interface CFCellRendererProps {
  value: number | string | null;
  dataBar?: CFDataBar;
  colorScale?: CFColorScale;
  iconSet?: CFIconSet;
  style?: React.CSSProperties;
  rangeMin: number;
  rangeMax: number;
  rangeMid?: number;
}

export const CFCellRenderer: React.FC<CFCellRendererProps> = ({
  value,
  dataBar,
  colorScale,
  iconSet,
  style,
  rangeMin,
  rangeMax,
  rangeMid,
}) => {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value) || '0');

  if (dataBar) {
    return (
      <DataBarRenderer
        value={numValue}
        config={dataBar}
        minValue={rangeMin}
        maxValue={rangeMax}
      />
    );
  }

  if (colorScale) {
    return (
      <ColorScaleRenderer
        value={numValue}
        config={colorScale}
        minValue={rangeMin}
        maxValue={rangeMax}
        midValue={rangeMid}
      />
    );
  }

  if (iconSet) {
    return (
      <IconSetRenderer
        value={numValue}
        config={iconSet}
        minValue={rangeMin}
        maxValue={rangeMax}
      />
    );
  }

  // Default - apply style only
  return (
    <div className="cf-styled-cell" style={style}>
      {value}
    </div>
  );
};

export default CFCellRenderer;
