// ============================================================
// DATA BARS PREVIEW - Visual selector for data bars
// ============================================================

import React from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { DATA_BAR_PRESETS } from '../../types/conditionalFormatting';

interface DataBarsPreviewProps {
  onSelect: () => void;
}

export const DataBarsPreview: React.FC<DataBarsPreviewProps> = ({ onSelect }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();

  const gradientPresets = DATA_BAR_PRESETS.filter(p => p.config.dataBar?.fillType === 'gradient');
  const solidPresets = DATA_BAR_PRESETS.filter(p => p.config.dataBar?.fillType === 'solid');

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleSelect = (preset: typeof DATA_BAR_PRESETS[0]) => {
    const range = getSelectionRangeString();
    if (!range) return;

    addRule({
      type: 'dataBar',
      range,
      enabled: true,
      stopIfTrue: false,
      dataBar: preset.config.dataBar,
    });

    onSelect();
  };

  return (
    <div className="data-bars-preview">
      <div className="preview-section">
        <div className="preview-section-title">Gradient Fill</div>
        <div className="preview-grid">
          {gradientPresets.map((preset) => (
            <button
              key={preset.id}
              className="preview-item"
              onClick={() => handleSelect(preset)}
              title={preset.name}
            >
              <div
                className="data-bar-sample"
                style={{ background: preset.preview }}
              >
                <span className="sample-value">75</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="preview-section">
        <div className="preview-section-title">Solid Fill</div>
        <div className="preview-grid">
          {solidPresets.map((preset) => (
            <button
              key={preset.id}
              className="preview-item"
              onClick={() => handleSelect(preset)}
              title={preset.name}
            >
              <div
                className="data-bar-sample solid"
                style={{ '--bar-color': preset.preview } as React.CSSProperties}
              >
                <span className="sample-value">75</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="preview-footer">
        <button className="more-options-btn">
          More Data Bars...
        </button>
      </div>
    </div>
  );
};

export default DataBarsPreview;
