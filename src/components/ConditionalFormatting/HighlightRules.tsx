// ============================================================
// HIGHLIGHT RULES - Submenu for highlight cell rules
// ============================================================

import React, { useState } from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { HIGHLIGHT_STYLES, CFOperator, CFTextOperator } from '../../types/conditionalFormatting';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeftRight,
  Equal,
  Type,
  Calendar,
  Grid3X3
} from 'lucide-react';

interface HighlightRulesProps {
  onSelect: () => void;
}

type RuleType = 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'textContains' | 'date' | 'duplicate';

interface RuleConfig {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  type: RuleType;
}

const RULE_CONFIGS: RuleConfig[] = [
  { label: 'Greater Than...', icon: <ChevronRight size={14} color="#dc2626" strokeWidth={3} />, bgColor: '#FFC7CE', type: 'greaterThan' },
  { label: 'Less Than...', icon: <ChevronLeft size={14} color="#ca8a04" strokeWidth={3} />, bgColor: '#FFEB9C', type: 'lessThan' },
  { label: 'Between...', icon: <ArrowLeftRight size={14} color="#2563eb" strokeWidth={2.5} />, bgColor: '#C6EFCE', type: 'between' },
  { label: 'Equal To...', icon: <Equal size={14} color="#16a34a" strokeWidth={3} />, bgColor: '#C6EFCE', type: 'equal' },
  { label: 'Text That Contains...', icon: <Type size={14} color="#ca8a04" strokeWidth={2.5} />, bgColor: '#FFEB9C', type: 'textContains' },
  { label: 'A Date Occurring...', icon: <Calendar size={14} color="#dc2626" strokeWidth={2} />, bgColor: '#FFC7CE', type: 'date' },
  { label: 'Duplicate Values...', icon: <Grid3X3 size={14} color="#16a34a" strokeWidth={2} />, bgColor: '#C6EFCE', type: 'duplicate' },
];

export const HighlightRules: React.FC<HighlightRulesProps> = ({ onSelect }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();
  const [showDialog, setShowDialog] = useState<RuleType | null>(null);
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
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

    switch (showDialog) {
      case 'greaterThan':
        addRule({
          type: 'cellValue',
          range,
          enabled: true,
          stopIfTrue: false,
          operator: 'greaterThan' as CFOperator,
          value1: parseFloat(value1) || 0,
          style,
        });
        break;
      case 'lessThan':
        addRule({
          type: 'cellValue',
          range,
          enabled: true,
          stopIfTrue: false,
          operator: 'lessThan' as CFOperator,
          value1: parseFloat(value1) || 0,
          style,
        });
        break;
      case 'between':
        addRule({
          type: 'cellValue',
          range,
          enabled: true,
          stopIfTrue: false,
          operator: 'between' as CFOperator,
          value1: parseFloat(value1) || 0,
          value2: parseFloat(value2) || 0,
          style,
        });
        break;
      case 'equal':
        addRule({
          type: 'cellValue',
          range,
          enabled: true,
          stopIfTrue: false,
          operator: 'equal' as CFOperator,
          value1: parseFloat(value1) || 0,
          style,
        });
        break;
      case 'textContains':
        addRule({
          type: 'text',
          range,
          enabled: true,
          stopIfTrue: false,
          textOperator: 'contains' as CFTextOperator,
          text: value1,
          style,
        });
        break;
      case 'duplicate':
        addRule({
          type: 'duplicate',
          range,
          enabled: true,
          stopIfTrue: false,
          duplicateType: 'duplicate',
          style,
        });
        break;
    }

    setShowDialog(null);
    setValue1('');
    setValue2('');
    onSelect();
  };

  if (showDialog) {
    return (
      <div className="highlight-dialog">
        <div className="dialog-header">
          {RULE_CONFIGS.find(r => r.type === showDialog)?.label}
        </div>
        <div className="dialog-content">
          {showDialog !== 'duplicate' && showDialog !== 'date' && (
            <div className="input-group">
              <label>{showDialog === 'textContains' ? 'Text:' : 'Value:'}</label>
              <input
                type={showDialog === 'textContains' ? 'text' : 'number'}
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder={showDialog === 'textContains' ? 'Enter text...' : 'Enter value...'}
                autoFocus
              />
            </div>
          )}
          {showDialog === 'between' && (
            <div className="input-group">
              <label>And:</label>
              <input
                type="number"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                placeholder="Enter value..."
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

export default HighlightRules;
