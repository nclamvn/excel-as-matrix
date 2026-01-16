// ============================================================
// ICON SETS PREVIEW - Visual selector for icon sets
// ============================================================

import React from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { ICON_SET_DEFINITIONS } from '../../types/conditionalFormatting';

interface IconSetsPreviewProps {
  onSelect: () => void;
}

export const IconSetsPreview: React.FC<IconSetsPreviewProps> = ({ onSelect }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();

  const categories = ['directional', 'shapes', 'indicators', 'ratings'] as const;

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'directional': return 'Directional';
      case 'shapes': return 'Shapes';
      case 'indicators': return 'Indicators';
      case 'ratings': return 'Ratings';
      default: return cat;
    }
  };

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleSelect = (iconDef: typeof ICON_SET_DEFINITIONS[0]) => {
    const range = getSelectionRangeString();
    if (!range) return;

    addRule({
      type: 'iconSet',
      range,
      enabled: true,
      stopIfTrue: false,
      iconSet: {
        iconStyle: iconDef.id,
        showValue: true,
        reverseOrder: false,
        thresholds: iconDef.defaultThresholds.map(t => ({
          type: 'percent',
          value: t,
          operator: '>=',
        })),
      },
    });

    onSelect();
  };

  return (
    <div className="icon-sets-preview">
      {categories.map((category) => {
        const icons = ICON_SET_DEFINITIONS.filter(i => i.category === category);
        if (icons.length === 0) return null;

        return (
          <div key={category} className="preview-section">
            <div className="preview-section-title">{getCategoryTitle(category)}</div>
            <div className="icon-sets-grid">
              {icons.map((iconDef) => (
                <button
                  key={iconDef.id}
                  className="icon-set-item"
                  onClick={() => handleSelect(iconDef)}
                  title={iconDef.name}
                >
                  <div className="icon-set-icons">
                    {iconDef.icons.map((icon, idx) => (
                      <span key={idx} className="icon-preview">{icon}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="preview-footer">
        <button className="more-options-btn">
          More Icon Sets...
        </button>
      </div>
    </div>
  );
};

export default IconSetsPreview;
