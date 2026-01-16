// ============================================================
// COLOR SCALES PREVIEW - Visual selector for color scales
// ============================================================

import React from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { COLOR_SCALE_PRESETS } from '../../types/conditionalFormatting';

interface ColorScalesPreviewProps {
  onSelect: () => void;
}

export const ColorScalesPreview: React.FC<ColorScalesPreviewProps> = ({ onSelect }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();

  const twoColorPresets = COLOR_SCALE_PRESETS.filter(p => p.config.colorScale?.type === '2-color');
  const threeColorPresets = COLOR_SCALE_PRESETS.filter(p => p.config.colorScale?.type === '3-color');

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleSelect = (preset: typeof COLOR_SCALE_PRESETS[0]) => {
    const range = getSelectionRangeString();
    if (!range) return;

    addRule({
      type: 'colorScale',
      range,
      enabled: true,
      stopIfTrue: false,
      colorScale: preset.config.colorScale,
    });

    onSelect();
  };

  return (
    <div className="color-scales-preview">
      <div className="preview-section">
        <div className="preview-section-title">2-Color Scale</div>
        <div className="preview-grid cols-3">
          {twoColorPresets.map((preset) => (
            <button
              key={preset.id}
              className="preview-item"
              onClick={() => handleSelect(preset)}
              title={preset.name}
            >
              <div
                className="color-scale-sample"
                style={{ background: preset.preview }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="preview-section">
        <div className="preview-section-title">3-Color Scale</div>
        <div className="preview-grid cols-3">
          {threeColorPresets.map((preset) => (
            <button
              key={preset.id}
              className="preview-item"
              onClick={() => handleSelect(preset)}
              title={preset.name}
            >
              <div
                className="color-scale-sample"
                style={{ background: preset.preview }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="preview-footer">
        <button className="more-options-btn">
          More Color Scales...
        </button>
      </div>
    </div>
  );
};

export default ColorScalesPreview;
