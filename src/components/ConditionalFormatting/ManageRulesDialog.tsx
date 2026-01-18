// ============================================================
// MANAGE RULES DIALOG — View and Manage Conditional Formatting Rules
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import {
  CFRule,
  CFRuleType,
  CFOperator,
  CFTextOperator,
  ICON_SET_DEFINITIONS,
} from '../../types/conditionalFormatting';
import './ConditionalFormatting.css';

interface ManageRulesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRule?: () => void;
}

// Rule type labels
const RULE_TYPE_LABELS: Record<CFRuleType, string> = {
  cellValue: 'Cell Value',
  text: 'Text',
  date: 'Date',
  duplicate: 'Duplicate/Unique',
  topBottom: 'Top/Bottom',
  aboveAverage: 'Above/Below Average',
  dataBar: 'Data Bar',
  colorScale: 'Color Scale',
  iconSet: 'Icon Set',
  formula: 'Custom Formula',
};

// Operator labels
const OPERATOR_LABELS: Record<CFOperator, string> = {
  greaterThan: 'is greater than',
  lessThan: 'is less than',
  greaterThanOrEqual: 'is greater than or equal to',
  lessThanOrEqual: 'is less than or equal to',
  equal: 'is equal to',
  notEqual: 'is not equal to',
  between: 'is between',
  notBetween: 'is not between',
};

const TEXT_OPERATOR_LABELS: Record<CFTextOperator, string> = {
  contains: 'contains',
  notContains: 'does not contain',
  beginsWith: 'begins with',
  endsWith: 'ends with',
};

export const ManageRulesDialog: React.FC<ManageRulesDialogProps> = ({
  isOpen,
  onClose,
  onAddRule,
}) => {
  const { activeSheetId, sheets } = useWorkbookStore();
  const {
    getAllRules,
    deleteRule,
    toggleRule,
    movePriority,
    clearAllRules,
  } = useConditionalFormattingStore();

  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filterRange, setFilterRange] = useState('');

  // Convert null to undefined for type compatibility
  const sheetId = activeSheetId ?? undefined;
  const sheetName = sheetId ? sheets[sheetId]?.name || 'Sheet' : 'Sheet';

  // Get all rules for the active sheet
  const rules = useMemo(() => {
    const allRules = getAllRules(sheetId);
    if (!filterRange) return allRules;

    // Filter by range if specified
    return allRules.filter(rule =>
      rule.range.toLowerCase().includes(filterRange.toLowerCase())
    );
  }, [getAllRules, sheetId, filterRange]);

  // Get rule description
  const getRuleDescription = (rule: CFRule): string => {
    switch (rule.type) {
      case 'cellValue':
        if (rule.operator === 'between' || rule.operator === 'notBetween') {
          return `Cell value ${OPERATOR_LABELS[rule.operator]} ${rule.value1} and ${rule.value2}`;
        }
        return `Cell value ${OPERATOR_LABELS[rule.operator!]} ${rule.value1}`;

      case 'text':
        return `Text ${TEXT_OPERATOR_LABELS[rule.textOperator!]} "${rule.text}"`;

      case 'duplicate':
        return rule.duplicateType === 'unique' ? 'Unique values' : 'Duplicate values';

      case 'topBottom':
        return `${rule.topBottomType} ${rule.topBottomValue} items`;

      case 'aboveAverage':
        return `Values ${rule.averageType} average`;

      case 'dataBar':
        return 'Data Bar';

      case 'colorScale':
        return `${rule.colorScale?.type === '3-color' ? '3' : '2'}-Color Scale`;

      case 'iconSet':
        const iconDef = ICON_SET_DEFINITIONS.find(i => i.id === rule.iconSet?.iconStyle);
        return `Icon Set: ${iconDef?.name || rule.iconSet?.iconStyle}`;

      case 'formula':
        return `Formula: ${rule.formula}`;

      default:
        return 'Custom rule';
    }
  };

  // Render rule preview
  const renderRulePreview = (rule: CFRule) => {
    if (rule.style) {
      return (
        <div
          className="rule-preview-box"
          style={{
            backgroundColor: rule.style.backgroundColor,
            color: rule.style.textColor,
            fontWeight: rule.style.fontWeight,
            fontStyle: rule.style.fontStyle,
          }}
        >
          Abc
        </div>
      );
    }

    if (rule.dataBar) {
      return (
        <div
          className="rule-preview-databar"
          style={{
            background: rule.dataBar.fillType === 'gradient'
              ? `linear-gradient(90deg, ${rule.dataBar.positiveColor} 0%, ${rule.dataBar.positiveColor}33 100%)`
              : rule.dataBar.positiveColor,
          }}
        />
      );
    }

    if (rule.colorScale) {
      const colors = rule.colorScale.type === '3-color'
        ? `${rule.colorScale.minColor}, ${rule.colorScale.midColor}, ${rule.colorScale.maxColor}`
        : `${rule.colorScale.minColor}, ${rule.colorScale.maxColor}`;
      return (
        <div
          className="rule-preview-colorscale"
          style={{
            background: `linear-gradient(90deg, ${colors})`,
          }}
        />
      );
    }

    if (rule.iconSet) {
      const iconDef = ICON_SET_DEFINITIONS.find(i => i.id === rule.iconSet?.iconStyle);
      return (
        <div className="rule-preview-iconset">
          {iconDef?.icons.slice(0, 3).join(' ')}
        </div>
      );
    }

    return <div className="rule-preview-empty" />;
  };

  const handleDeleteSelected = () => {
    if (selectedRuleId) {
      deleteRule(selectedRuleId, sheetId);
      setSelectedRuleId(undefined);
    }
    setShowDeleteConfirm(false);
  };

  const handleClearAll = () => {
    clearAllRules(sheetId);
    setSelectedRuleId(undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog manage-rules-dialog"
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>Conditional Formatting Rules Manager</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          {/* Toolbar */}
          <div className="rules-toolbar">
            <div className="toolbar-left">
              <span className="sheet-label">Show rules for: {sheetName}</span>
              <input
                type="text"
                placeholder="Filter by range..."
                value={filterRange}
                onChange={e => setFilterRange(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="toolbar-right">
              <button
                className="toolbar-btn primary"
                onClick={onAddRule}
              >
                <Plus size={14} />
                New Rule
              </button>
            </div>
          </div>

          {/* Rules List */}
          <div className="rules-list">
            {rules.length === 0 ? (
              <div className="no-rules">
                <AlertCircle size={32} />
                <p>No conditional formatting rules found.</p>
                <button className="add-rule-btn" onClick={onAddRule}>
                  <Plus size={16} />
                  Add New Rule
                </button>
              </div>
            ) : (
              <table className="rules-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>Rule</th>
                    <th style={{ width: 100 }}>Format</th>
                    <th style={{ width: 100 }}>Range</th>
                    <th style={{ width: 60 }}>Stop</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, index) => (
                    <tr
                      key={rule.id}
                      className={`rule-row ${selectedRuleId === rule.id ? 'selected' : ''} ${!rule.enabled ? 'disabled' : ''}`}
                      onClick={() => setSelectedRuleId(rule.id)}
                    >
                      <td className="priority-cell">
                        <span className="priority-badge">{index + 1}</span>
                      </td>
                      <td className="rule-cell">
                        <div className="rule-info">
                          <span className="rule-type">{RULE_TYPE_LABELS[rule.type]}</span>
                          <span className="rule-description">{getRuleDescription(rule)}</span>
                        </div>
                      </td>
                      <td className="format-cell">
                        {renderRulePreview(rule)}
                      </td>
                      <td className="range-cell">
                        <code>{rule.range}</code>
                      </td>
                      <td className="stop-cell">
                        {rule.stopIfTrue && <span className="stop-badge">Yes</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Action Buttons */}
          {rules.length > 0 && (
            <div className="rules-actions">
              <div className="action-group">
                <button
                  className="action-btn"
                  disabled={!selectedRuleId}
                  onClick={() => selectedRuleId && movePriority(selectedRuleId, 'up', sheetId)}
                  title="Move Up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  className="action-btn"
                  disabled={!selectedRuleId}
                  onClick={() => selectedRuleId && movePriority(selectedRuleId, 'down', sheetId)}
                  title="Move Down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="action-group">
                <button
                  className="action-btn"
                  disabled={!selectedRuleId}
                  onClick={() => selectedRuleId && toggleRule(selectedRuleId, sheetId)}
                  title="Enable/Disable"
                >
                  {rules.find(r => r.id === selectedRuleId)?.enabled !== false
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>
                <button
                  className="action-btn edit"
                  disabled={!selectedRuleId}
                  title="Edit Rule"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="action-btn danger"
                  disabled={!selectedRuleId}
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="action-group">
                <button
                  className="action-btn danger-text"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-dialog">
              <p>Delete the selected rule?</p>
              <div className="confirm-actions">
                <button
                  className="confirm-btn cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn delete"
                  onClick={handleDeleteSelected}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRulesDialog;
