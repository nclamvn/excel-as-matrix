// ============================================================
// CF RULE DIALOG - Create/Edit conditional formatting rule
// ============================================================

import React, { useState } from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import {
  CFRuleType,
  CFOperator,
  HIGHLIGHT_STYLES,
} from '../../types/conditionalFormatting';
import { X } from 'lucide-react';

interface CFRuleDialogProps {
  onClose: () => void;
  onSave: () => void;
  editRuleId?: string;
}

const RULE_TYPES: { value: CFRuleType; label: string }[] = [
  { value: 'cellValue', label: 'Cell Value' },
  { value: 'text', label: 'Text Contains' },
  { value: 'duplicate', label: 'Duplicate/Unique Values' },
  { value: 'topBottom', label: 'Top/Bottom Values' },
  { value: 'aboveAverage', label: 'Above/Below Average' },
  { value: 'formula', label: 'Use a Formula' },
];

const OPERATORS: { value: CFOperator; label: string }[] = [
  { value: 'greaterThan', label: 'greater than' },
  { value: 'lessThan', label: 'less than' },
  { value: 'greaterThanOrEqual', label: 'greater than or equal to' },
  { value: 'lessThanOrEqual', label: 'less than or equal to' },
  { value: 'equal', label: 'equal to' },
  { value: 'notEqual', label: 'not equal to' },
  { value: 'between', label: 'between' },
  { value: 'notBetween', label: 'not between' },
];

export const CFRuleDialog: React.FC<CFRuleDialogProps> = ({ onClose, onSave }) => {
  const { addRule } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();

  const [ruleType, setRuleType] = useState<CFRuleType>('cellValue');
  const [operator, setOperator] = useState<CFOperator>('greaterThan');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [text, setText] = useState('');
  const [formula, setFormula] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(0);

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleSave = () => {
    const range = getSelectionRangeString();
    if (!range) {
      alert('Please select cells first');
      return;
    }

    const style = HIGHLIGHT_STYLES[selectedStyle].style;

    switch (ruleType) {
      case 'cellValue':
        addRule({
          type: 'cellValue',
          range,
          enabled: true,
          stopIfTrue: false,
          operator,
          value1: parseFloat(value1) || 0,
          value2: operator === 'between' || operator === 'notBetween' ? parseFloat(value2) || 0 : undefined,
          style,
        });
        break;
      case 'text':
        addRule({
          type: 'text',
          range,
          enabled: true,
          stopIfTrue: false,
          textOperator: 'contains',
          text,
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
      case 'topBottom':
        addRule({
          type: 'topBottom',
          range,
          enabled: true,
          stopIfTrue: false,
          topBottomType: 'top',
          topBottomValue: parseInt(value1) || 10,
          style,
        });
        break;
      case 'aboveAverage':
        addRule({
          type: 'aboveAverage',
          range,
          enabled: true,
          stopIfTrue: false,
          averageType: 'above',
          style,
        });
        break;
      case 'formula':
        addRule({
          type: 'formula',
          range,
          enabled: true,
          stopIfTrue: false,
          formula,
          style,
        });
        break;
    }

    onSave();
  };

  const renderValueInputs = () => {
    switch (ruleType) {
      case 'cellValue':
        return (
          <>
            <div className="form-row">
              <label>Operator:</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value as CFOperator)}>
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Value:</label>
              <input
                type="number"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                placeholder="Enter value..."
              />
            </div>
            {(operator === 'between' || operator === 'notBetween') && (
              <div className="form-row">
                <label>And:</label>
                <input
                  type="number"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  placeholder="Enter value..."
                />
              </div>
            )}
          </>
        );
      case 'text':
        return (
          <div className="form-row">
            <label>Text contains:</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
            />
          </div>
        );
      case 'topBottom':
        return (
          <div className="form-row">
            <label>Number of items:</label>
            <input
              type="number"
              min="1"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="10"
            />
          </div>
        );
      case 'formula':
        return (
          <div className="form-row">
            <label>Formula:</label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="=A1>100"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="cf-dialog-overlay" onClick={onClose}>
      <div className="cf-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cf-dialog-header">
          <h2>New Formatting Rule</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cf-dialog-content">
          <div className="form-section">
            <h3>Select a Rule Type:</h3>
            <div className="rule-type-list">
              {RULE_TYPES.map((type) => (
                <label key={type.value} className="rule-type-option">
                  <input
                    type="radio"
                    name="ruleType"
                    value={type.value}
                    checked={ruleType === type.value}
                    onChange={() => setRuleType(type.value)}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Edit the Rule Description:</h3>
            {renderValueInputs()}
          </div>

          <div className="form-section">
            <h3>Preview:</h3>
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
            <div
              className="format-preview"
              style={{
                backgroundColor: HIGHLIGHT_STYLES[selectedStyle].style.backgroundColor,
                color: HIGHLIGHT_STYLES[selectedStyle].style.textColor,
              }}
            >
              AaBbCcYyZz
            </div>
          </div>
        </div>

        <div className="cf-dialog-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-ok" onClick={handleSave}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default CFRuleDialog;
