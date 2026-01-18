// ============================================================
// TRENDLINE DIALOG — Configure and Add Trendlines to Charts
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  LineChart,
  Activity,
  BarChart2,
  Zap,
} from 'lucide-react';
import {
  TrendlineType,
  TrendlineConfig,
  TrendlineResult,
  calculateTrendline,
} from '../../utils/trendlineUtils';
import './Charts.css';

interface TrendlineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: TrendlineConfig, result: TrendlineResult) => void;
  dataPoints: { x: number; y: number }[];
  seriesName?: string;
}

const TRENDLINE_OPTIONS: { type: TrendlineType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: 'linear',
    label: 'Linear',
    icon: <TrendingUp size={18} />,
    description: 'Best fit straight line (y = mx + b)',
  },
  {
    type: 'exponential',
    label: 'Exponential',
    icon: <Zap size={18} />,
    description: 'Exponential growth or decay (y = ae^bx)',
  },
  {
    type: 'logarithmic',
    label: 'Logarithmic',
    icon: <LineChart size={18} />,
    description: 'Logarithmic curve (y = a·ln(x) + b)',
  },
  {
    type: 'polynomial',
    label: 'Polynomial',
    icon: <Activity size={18} />,
    description: 'Polynomial curve of specified degree',
  },
  {
    type: 'power',
    label: 'Power',
    icon: <BarChart2 size={18} />,
    description: 'Power curve (y = ax^b)',
  },
  {
    type: 'moving-average',
    label: 'Moving Average',
    icon: <LineChart size={18} />,
    description: 'Smoothed trend using period average',
  },
];

const COLOR_OPTIONS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#000000', // Black
];

export const TrendlineDialog: React.FC<TrendlineDialogProps> = ({
  isOpen,
  onClose,
  onApply,
  dataPoints,
  seriesName: _seriesName = 'Series',
}) => {
  const [selectedType, setSelectedType] = useState<TrendlineType>('linear');
  const [degree, setDegree] = useState(2);
  const [period, setPeriod] = useState(3);
  const [displayEquation, setDisplayEquation] = useState(true);
  const [displayRSquared, setDisplayRSquared] = useState(true);
  const [forward, setForward] = useState(0);
  const [backward, setBackward] = useState(0);
  const [color, setColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [dashArray, setDashArray] = useState('5,5');

  const xValues = dataPoints.map(p => p.x);
  const yValues = dataPoints.map(p => p.y);

  // Calculate preview result
  const previewResult = useMemo(() => {
    if (dataPoints.length < 2) return null;

    const config: TrendlineConfig = {
      type: selectedType,
      degree: selectedType === 'polynomial' ? degree : undefined,
      period: selectedType === 'moving-average' ? period : undefined,
      displayEquation,
      displayRSquared,
      forward,
      backward,
      color,
      strokeWidth,
      dashArray,
    };

    return calculateTrendline(xValues, yValues, config);
  }, [selectedType, degree, period, forward, backward, dataPoints, xValues, yValues, displayEquation, displayRSquared, color, strokeWidth, dashArray]);

  const handleApply = () => {
    if (!previewResult) return;

    const config: TrendlineConfig = {
      type: selectedType,
      degree: selectedType === 'polynomial' ? degree : undefined,
      period: selectedType === 'moving-average' ? period : undefined,
      displayEquation,
      displayRSquared,
      forward,
      backward,
      color,
      strokeWidth,
      dashArray,
    };

    onApply(config, previewResult);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog trendline-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>
            <TrendingUp size={18} />
            Add Trendline
          </h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Trendline Type Selection */}
          <div className="dialog-field">
            <label>Trendline Type</label>
            <div className="trendline-type-grid">
              {TRENDLINE_OPTIONS.map(option => (
                <button
                  key={option.type}
                  className={`trendline-type-btn ${selectedType === option.type ? 'active' : ''}`}
                  onClick={() => setSelectedType(option.type)}
                >
                  <div className="type-icon">{option.icon}</div>
                  <div className="type-info">
                    <span className="type-label">{option.label}</span>
                    <span className="type-desc">{option.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Polynomial Degree */}
          {selectedType === 'polynomial' && (
            <div className="dialog-field">
              <label>Polynomial Degree</label>
              <div className="degree-selector">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    className={`degree-btn ${degree === d ? 'active' : ''}`}
                    onClick={() => setDegree(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Moving Average Period */}
          {selectedType === 'moving-average' && (
            <div className="dialog-field">
              <label>Period</label>
              <input
                type="number"
                min="2"
                max="20"
                value={period}
                onChange={e => setPeriod(parseInt(e.target.value) || 3)}
                className="dialog-input"
                style={{ width: '100px' }}
              />
            </div>
          )}

          {/* Forecasting */}
          <div className="dialog-field">
            <label>Forecast</label>
            <div className="forecast-inputs">
              <div className="forecast-input">
                <span>Forward:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={forward}
                  onChange={e => setForward(parseInt(e.target.value) || 0)}
                  className="dialog-input"
                />
                <span>periods</span>
              </div>
              <div className="forecast-input">
                <span>Backward:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={backward}
                  onChange={e => setBackward(parseInt(e.target.value) || 0)}
                  className="dialog-input"
                />
                <span>periods</span>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="dialog-field">
            <label>Display Options</label>
            <div className="checkbox-group">
              <label className="dialog-checkbox">
                <input
                  type="checkbox"
                  checked={displayEquation}
                  onChange={e => setDisplayEquation(e.target.checked)}
                />
                <span>Display equation on chart</span>
              </label>
              {selectedType !== 'moving-average' && (
                <label className="dialog-checkbox">
                  <input
                    type="checkbox"
                    checked={displayRSquared}
                    onChange={e => setDisplayRSquared(e.target.checked)}
                  />
                  <span>Display R-squared value on chart</span>
                </label>
              )}
            </div>
          </div>

          {/* Style Options */}
          <div className="dialog-field">
            <label>Line Style</label>
            <div className="style-options">
              <div className="color-picker">
                <span>Color:</span>
                <div className="color-options">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      className={`color-btn ${color === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="width-picker">
                <span>Width:</span>
                <select
                  value={strokeWidth}
                  onChange={e => setStrokeWidth(parseFloat(e.target.value))}
                  className="dialog-select"
                >
                  <option value="1">Thin (1px)</option>
                  <option value="2">Medium (2px)</option>
                  <option value="3">Thick (3px)</option>
                </select>
              </div>
              <div className="dash-picker">
                <span>Dash:</span>
                <select
                  value={dashArray}
                  onChange={e => setDashArray(e.target.value)}
                  className="dialog-select"
                >
                  <option value="">Solid</option>
                  <option value="5,5">Dashed</option>
                  <option value="2,2">Dotted</option>
                  <option value="10,5,2,5">Dash-dot</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewResult && (
            <div className="dialog-field">
              <label>Preview</label>
              <div className="trendline-preview">
                <div className="preview-stats">
                  <div className="stat">
                    <span className="stat-label">Equation:</span>
                    <span className="stat-value">{previewResult.equation}</span>
                  </div>
                  {selectedType !== 'moving-average' && (
                    <div className="stat">
                      <span className="stat-label">R² Value:</span>
                      <span className="stat-value">{previewResult.rSquared.toFixed(4)}</span>
                    </div>
                  )}
                  <div className="stat">
                    <span className="stat-label">Data Points:</span>
                    <span className="stat-value">{dataPoints.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Trendline Points:</span>
                    <span className="stat-value">{previewResult.points.length}</span>
                  </div>
                </div>
                <div className="preview-line">
                  <svg width="100%" height="40" viewBox="0 0 200 40">
                    <line
                      x1="10"
                      y1="20"
                      x2="190"
                      y2="20"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dialog-btn-primary"
            onClick={handleApply}
            disabled={!previewResult || previewResult.points.length === 0}
          >
            Add Trendline
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendlineDialog;
