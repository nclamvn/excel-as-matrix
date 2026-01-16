// ============================================================
// TOP/BOTTOM RULES - Submenu for top/bottom rules
// ============================================================

import React, { useState } from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { HIGHLIGHT_STYLES, CFTopBottomType, CFAverageType } from '../../types/conditionalFormatting';
import {
  ArrowUp,
  TrendingUp,
  ArrowDown,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface TopBottomRulesProps {
  onSelect: () => void;
}

type RuleType = 'top10' | 'top10Percent' | 'bottom10' | 'bottom10Percent' | 'aboveAverage' | 'belowAverage';

interface RuleConfig {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  type: RuleType;
}

const RULE_CONFIGS: RuleConfig[] = [
  { label: 'Top 10 Items...', icon: <ArrowUp size={14} color="#16a34a" strokeWidth={2.5} />, bgColor: '#C6EFCE', type: 'top10' },
  { label: 'Top 10%...', icon: <TrendingUp size={14} color="#16a34a" strokeWidth={2.5} />, bgColor: '#C6EFCE', type: 'top10Percent' },
  { label: 'Bottom 10 Items...', icon: <ArrowDown size={14} color="#dc2626" strokeWidth={2.5} />, bgColor: '#FFC7CE', type: 'bottom10' },
  { label: 'Bottom 10%...', icon: <TrendingDown size={14} color="#dc2626" strokeWidth={2.5} />, bgColor: '#FFC7CE', type: 'bottom10Percent' },
  { label: 'Above Average...', icon: <ArrowUpRight size={14} color="#ca8a04" strokeWidth={2.5} />, bgColor: '#FFEB9C', type: 'aboveAverage' },
  { label: 'Below Average...', icon: <ArrowDownRight size={14} color="#ca8a04" strokeWidth={2.5} />, bgColor: '#FFEB9C', type: 'belowAverage' },
];

export const TopBottomRules: React.FC<TopBottomRulesProps> = ({ onSelect }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();
  const [showDialog, setShowDialog] = useState<RuleType | null>(null);
  const [value, setValue] = useState('10');
  const [selectedStyle, setSelectedStyle] = useState(0);

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleApply = () => {
    const range = getSelectionRangeString();
    if (!range || !showDialog) return;

    const style = HIGHLIGHT_STYLES[selectedStyle].style;
    const numValue = parseInt(value) || 10;

    switch (showDialog) {
      case 'top10':
        addRule({
          type: 'topBottom',
          range,
          enabled: true,
          stopIfTrue: false,
          topBottomType: 'top' as CFTopBottomType,
          topBottomValue: numValue,
          style,
        });
        break;
      case 'top10Percent':
        addRule({
          type: 'topBottom',
          range,
          enabled: true,
          stopIfTrue: false,
          topBottomType: 'topPercent' as CFTopBottomType,
          topBottomValue: numValue,
          style,
        });
        break;
      case 'bottom10':
        addRule({
          type: 'topBottom',
          range,
          enabled: true,
          stopIfTrue: false,
          topBottomType: 'bottom' as CFTopBottomType,
          topBottomValue: numValue,
          style,
        });
        break;
      case 'bottom10Percent':
        addRule({
          type: 'topBottom',
          range,
          enabled: true,
          stopIfTrue: false,
          topBottomType: 'bottomPercent' as CFTopBottomType,
          topBottomValue: numValue,
          style,
        });
        break;
      case 'aboveAverage':
        addRule({
          type: 'aboveAverage',
          range,
          enabled: true,
          stopIfTrue: false,
          averageType: 'above' as CFAverageType,
          style,
        });
        break;
      case 'belowAverage':
        addRule({
          type: 'aboveAverage',
          range,
          enabled: true,
          stopIfTrue: false,
          averageType: 'below' as CFAverageType,
          style,
        });
        break;
    }

    setShowDialog(null);
    setValue('10');
    onSelect();
  };

  const needsValue = showDialog && !['aboveAverage', 'belowAverage'].includes(showDialog);

  if (showDialog) {
    return (
      <div className="highlight-dialog">
        <div className="dialog-header">
          {RULE_CONFIGS.find(r => r.type === showDialog)?.label}
        </div>
        <div className="dialog-content">
          {needsValue && (
            <div className="input-group">
              <label>
                {showDialog.includes('Percent') ? 'Percentage:' : 'Number of items:'}
              </label>
              <input
                type="number"
                min="1"
                max={showDialog.includes('Percent') ? '100' : '1000'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="style-selector">
            <label>Format with:</label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(parseInt(e.target.value))}
            >
              {HIGHLIGHT_STYLES.map((style, idx) => (
                <option key={idx} value={idx}>{style.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="dialog-footer">
          <button className="btn-cancel" onClick={() => setShowDialog(null)}>Cancel</button>
          <button className="btn-ok" onClick={handleApply}>OK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="highlight-rules-menu">
      {RULE_CONFIGS.map((rule) => (
        <button
          key={rule.type}
          className="highlight-rule-item"
          onClick={() => setShowDialog(rule.type)}
        >
          <span className="rule-icon" style={{ backgroundColor: rule.bgColor }}>
            {rule.icon}
          </span>
          <span className="rule-label">{rule.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TopBottomRules;
