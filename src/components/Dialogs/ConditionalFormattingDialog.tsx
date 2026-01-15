import React, { useState } from 'react';
import { X, Palette } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

type RuleType =
  | 'greaterThan'
  | 'lessThan'
  | 'equalTo'
  | 'between'
  | 'textContains'
  | 'duplicate'
  | 'top10'
  | 'blank'
  | 'notBlank';

interface ConditionalFormattingDialogProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  { bg: '#ffcdd2', text: '#b71c1c', name: 'Light Red' },
  { bg: '#fff9c4', text: '#f57f17', name: 'Light Yellow' },
  { bg: '#c8e6c9', text: '#1b5e20', name: 'Light Green' },
  { bg: '#bbdefb', text: '#0d47a1', name: 'Light Blue' },
  { bg: '#e1bee7', text: '#4a148c', name: 'Light Purple' },
  { bg: '#ffe0b2', text: '#e65100', name: 'Light Orange' },
];

export const ConditionalFormattingDialog: React.FC<ConditionalFormattingDialogProps> = ({
  onClose
}) => {
  const [ruleType, setRuleType] = useState<RuleType>('greaterThan');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customBg, setCustomBg] = useState('#ffeb3b');
  const [customText, setCustomText] = useState('#000000');
  const [useCustomColors, setUseCustomColors] = useState(false);

  const { selectionRange, applyFormatToRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const getColors = () => {
    if (useCustomColors) {
      return { bg: customBg, text: customText };
    }
    return { bg: PRESET_COLORS[selectedPreset].bg, text: PRESET_COLORS[selectedPreset].text };
  };

  const handleApply = () => {
    if (!selectionRange) {
      showToast('Please select a range first', 'warning');
      return;
    }

    // For now, apply formatting directly (full conditional formatting would need rule storage)
    const colors = getColors();

    // Apply format to the range
    applyFormatToRange(selectionRange, {
      backgroundColor: colors.bg,
      textColor: colors.text,
    });

    showToast('Conditional formatting applied', 'success');
    onClose();
  };

  const needsValue1 = !['duplicate', 'top10', 'blank', 'notBlank'].includes(ruleType);
  const needsValue2 = ruleType === 'between';

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
        <div className="dialog-header">
          <h2>Conditional Formatting</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Rule Type */}
          <div className="dialog-field">
            <label>Format cells if:</label>
            <select
              value={ruleType}
              onChange={e => setRuleType(e.target.value as RuleType)}
              className="dialog-input"
            >
              <optgroup label="Cell Value">
                <option value="greaterThan">Greater than</option>
                <option value="lessThan">Less than</option>
                <option value="equalTo">Equal to</option>
                <option value="between">Between</option>
              </optgroup>
              <optgroup label="Text">
                <option value="textContains">Text contains</option>
              </optgroup>
              <optgroup label="Special">
                <option value="duplicate">Duplicate values</option>
                <option value="blank">Is blank</option>
                <option value="notBlank">Is not blank</option>
                <option value="top10">Top 10 items</option>
              </optgroup>
            </select>
          </div>

          {/* Value Inputs */}
          {needsValue1 && (
            <div className="dialog-field">
              <label>{ruleType === 'textContains' ? 'Text:' : 'Value:'}</label>
              <input
                type={ruleType === 'textContains' ? 'text' : 'number'}
                value={value1}
                onChange={e => setValue1(e.target.value)}
                placeholder={ruleType === 'textContains' ? 'Enter text' : 'Enter value'}
                className="dialog-input"
              />
            </div>
          )}

          {needsValue2 && (
            <div className="dialog-field">
              <label>And:</label>
              <input
                type="number"
                value={value2}
                onChange={e => setValue2(e.target.value)}
                placeholder="Enter second value"
                className="dialog-input"
              />
            </div>
          )}

          {/* Format Preview */}
          <div className="dialog-field">
            <label>Format with:</label>
            <div
              className="cf-format-preview"
              style={{
                backgroundColor: getColors().bg,
                color: getColors().text,
              }}
            >
              Preview Text ABC 123
            </div>
          </div>

          {/* Preset Colors */}
          <div className="dialog-field">
            <label>Quick Formats:</label>
            <div className="cf-presets">
              {PRESET_COLORS.map((preset, i) => (
                <button
                  key={i}
                  className={`cf-preset-btn ${!useCustomColors && selectedPreset === i ? 'selected' : ''}`}
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                  onClick={() => {
                    setSelectedPreset(i);
                    setUseCustomColors(false);
                  }}
                  title={preset.name}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="dialog-field">
            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={useCustomColors}
                onChange={e => setUseCustomColors(e.target.checked)}
              />
              Use custom colors
            </label>

            {useCustomColors && (
              <div className="cf-custom-colors">
                <label>
                  <Palette size={14} />
                  Background:
                  <input
                    type="color"
                    value={customBg}
                    onChange={e => setCustomBg(e.target.value)}
                  />
                </label>
                <label>
                  <Palette size={14} />
                  Text:
                  <input
                    type="color"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
