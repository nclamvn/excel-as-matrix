import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { FillSeriesConfig, DateUnit } from '../../utils/fillSeriesUtils';

interface FillSeriesDialogProps {
  onClose: () => void;
}

export const FillSeriesDialog: React.FC<FillSeriesDialogProps> = ({ onClose }) => {
  const [direction, setDirection] = useState<'rows' | 'columns'>('columns');
  const [type, setType] = useState<'linear' | 'growth' | 'date' | 'autofill'>('linear');
  const [dateUnit, setDateUnit] = useState<DateUnit>('day');
  const [stepValue, setStepValue] = useState(1);
  const [stopValue, setStopValue] = useState<string>('');
  const [trend, setTrend] = useState(false);

  const { fillSeries, selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleApply = () => {
    if (!selectionRange) {
      showToast('Please select a range first', 'warning');
      onClose();
      return;
    }

    const config: FillSeriesConfig = {
      type,
      direction,
      step: stepValue,
      dateUnit: type === 'date' ? dateUnit : undefined,
      stopValue: stopValue ? parseFloat(stopValue) : undefined,
      trend,
    };

    fillSeries(config);
    showToast('Series filled successfully', 'success');
    onClose();
  };

  const isDateType = type === 'date';

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog fill-series-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
        <div className="dialog-header">
          <h2>Series</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="fill-series-layout">
            {/* Series in Section */}
            <div className="fill-series-section">
              <div className="fill-series-section-title">Series in</div>
              <div className="fill-series-radio-group">
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'rows'}
                    onChange={() => setDirection('rows')}
                  />
                  <span>Rows</span>
                </label>
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'columns'}
                    onChange={() => setDirection('columns')}
                  />
                  <span>Columns</span>
                </label>
              </div>
            </div>

            {/* Type Section */}
            <div className="fill-series-section">
              <div className="fill-series-section-title">Type</div>
              <div className="fill-series-radio-group">
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'linear'}
                    onChange={() => setType('linear')}
                  />
                  <span>Linear</span>
                </label>
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'growth'}
                    onChange={() => setType('growth')}
                  />
                  <span>Growth</span>
                </label>
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'date'}
                    onChange={() => setType('date')}
                  />
                  <span>Date</span>
                </label>
                <label className="fill-series-radio">
                  <input
                    type="radio"
                    name="type"
                    checked={type === 'autofill'}
                    onChange={() => setType('autofill')}
                  />
                  <span>AutoFill</span>
                </label>
              </div>
            </div>

            {/* Date Unit Section (only visible when Date type is selected) */}
            {isDateType && (
              <div className="fill-series-section">
                <div className="fill-series-section-title">Date unit</div>
                <div className="fill-series-radio-group">
                  <label className="fill-series-radio">
                    <input
                      type="radio"
                      name="dateUnit"
                      checked={dateUnit === 'day'}
                      onChange={() => setDateUnit('day')}
                    />
                    <span>Day</span>
                  </label>
                  <label className="fill-series-radio">
                    <input
                      type="radio"
                      name="dateUnit"
                      checked={dateUnit === 'weekday'}
                      onChange={() => setDateUnit('weekday')}
                    />
                    <span>Weekday</span>
                  </label>
                  <label className="fill-series-radio">
                    <input
                      type="radio"
                      name="dateUnit"
                      checked={dateUnit === 'month'}
                      onChange={() => setDateUnit('month')}
                    />
                    <span>Month</span>
                  </label>
                  <label className="fill-series-radio">
                    <input
                      type="radio"
                      name="dateUnit"
                      checked={dateUnit === 'year'}
                      onChange={() => setDateUnit('year')}
                    />
                    <span>Year</span>
                  </label>
                </div>
              </div>
            )}

            {/* Values Section */}
            <div className="fill-series-values">
              <div className="fill-series-field">
                <label>Step value:</label>
                <input
                  type="number"
                  value={stepValue}
                  onChange={(e) => setStepValue(parseFloat(e.target.value) || 1)}
                  className="dialog-input"
                  step="any"
                />
              </div>
              <div className="fill-series-field">
                <label>Stop value:</label>
                <input
                  type="number"
                  value={stopValue}
                  onChange={(e) => setStopValue(e.target.value)}
                  className="dialog-input"
                  placeholder="Optional"
                  step="any"
                />
              </div>
            </div>

            {/* Trend Checkbox */}
            <div className="fill-series-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={trend}
                  onChange={(e) => setTrend(e.target.checked)}
                />
                <span>Trend</span>
              </label>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleApply}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
