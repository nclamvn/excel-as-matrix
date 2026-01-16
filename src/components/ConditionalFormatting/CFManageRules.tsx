// ============================================================
// CF MANAGE RULES - Panel to manage all rules
// ============================================================

import React from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { CFRule } from '../../types/conditionalFormatting';
import { X, ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';

interface CFManageRulesProps {
  onClose: () => void;
}

export const CFManageRules: React.FC<CFManageRulesProps> = ({ onClose }) => {
  const {
    getAllRules,
    deleteRule,
    toggleRule,
    movePriority,
  } = useConditionalFormattingStore();

  const rules = getAllRules();

  const getRuleDescription = (rule: CFRule): string => {
    switch (rule.type) {
      case 'cellValue':
        return `Cell Value ${rule.operator} ${rule.value1}${rule.value2 ? ` and ${rule.value2}` : ''}`;
      case 'text':
        return `Text ${rule.textOperator} "${rule.text}"`;
      case 'date':
        return `Date ${rule.dateOperator}`;
      case 'duplicate':
        return rule.duplicateType === 'duplicate' ? 'Duplicate Values' : 'Unique Values';
      case 'topBottom':
        return `${rule.topBottomType} ${rule.topBottomValue}`;
      case 'aboveAverage':
        return `${rule.averageType} Average`;
      case 'dataBar':
        return 'Data Bar';
      case 'colorScale':
        return `Color Scale (${rule.colorScale?.type})`;
      case 'iconSet':
        return `Icon Set (${rule.iconSet?.iconStyle})`;
      case 'formula':
        return `Formula: ${rule.formula}`;
      default:
        return 'Unknown Rule';
    }
  };

  const getPreviewStyle = (rule: CFRule): React.CSSProperties => {
    if (rule.style) {
      return {
        backgroundColor: rule.style.backgroundColor,
        color: rule.style.textColor,
        fontWeight: rule.style.fontWeight,
        fontStyle: rule.style.fontStyle,
        borderLeft: rule.style.border ? `4px ${rule.style.border.style} ${rule.style.border.color}` : undefined,
      };
    }
    if (rule.dataBar) {
      return {
        background: `linear-gradient(90deg, ${rule.dataBar.positiveColor} 60%, transparent 60%)`,
      };
    }
    if (rule.colorScale) {
      return {
        background: `linear-gradient(90deg, ${rule.colorScale.minColor} 0%, ${rule.colorScale.midColor || rule.colorScale.maxColor} 50%, ${rule.colorScale.maxColor} 100%)`,
      };
    }
    return {};
  };

  return (
    <div className="cf-manage-overlay" onClick={onClose}>
      <div className="cf-manage-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cf-manage-header">
          <h2>Conditional Formatting Rules Manager</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cf-manage-toolbar">
          <span className="rules-count">{rules.length} rule(s)</span>
        </div>

        <div className="cf-manage-content">
          {rules.length === 0 ? (
            <div className="no-rules">
              <p>No conditional formatting rules defined.</p>
              <p className="hint">Select cells and use the Conditional Formatting menu to add rules.</p>
            </div>
          ) : (
            <div className="rules-list">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}
                >
                  <div className="rule-priority">#{index + 1}</div>

                  <div
                    className="rule-preview"
                    style={getPreviewStyle(rule)}
                  >
                    {rule.iconSet && '🔶'}
                    {!rule.iconSet && 'Aa'}
                  </div>

                  <div className="rule-info">
                    <div className="rule-description">{getRuleDescription(rule)}</div>
                    <div className="rule-range">Applies to: {rule.range}</div>
                  </div>

                  <div className="rule-actions">
                    <button
                      className="action-btn"
                      onClick={() => movePriority(rule.id, 'up')}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => movePriority(rule.id, 'down')}
                      disabled={index === rules.length - 1}
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => toggleRule(rule.id)}
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {rule.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      className="action-btn"
                      title="Edit Rule"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => deleteRule(rule.id)}
                      title="Delete Rule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cf-manage-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CFManageRules;
