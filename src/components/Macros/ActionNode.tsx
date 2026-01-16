// =============================================================================
// ACTION NODE — Display a single workflow step
// =============================================================================

import React, { useState } from 'react';
import type { WorkflowStep } from '../../macros/types';

interface ActionNodeProps {
  step: WorkflowStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onAddAfter: () => void;
}

export const ActionNode: React.FC<ActionNodeProps> = ({
  step,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onAddAfter,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getActionIcon = (_type: string) => {
    const icons: Record<string, JSX.Element> = {
      copy_range: <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>,
      paste_range: <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9z"/>,
      filter_data: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
      sort_data: <><line x1="4" y1="6" x2="11" y2="6"/><line x1="4" y1="12" x2="11" y2="12"/><line x1="4" y1="18" x2="13" y2="18"/><polyline points="15 15 18 18 21 15"/><line x1="18" y1="6" x2="18" y2="18"/></>,
      format_cells: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
      create_chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
      export_pdf: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
      send_email: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
      ai_clean_data: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
      ai_create_chart: <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
    };

    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[step.action.type] || <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>}
      </svg>
    );
  };

  const getActionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      copy_range: 'Copy Range',
      paste_range: 'Paste',
      clear_range: 'Clear',
      filter_data: 'Filter Data',
      sort_data: 'Sort Data',
      remove_duplicates: 'Remove Duplicates',
      apply_formula: 'Apply Formula',
      format_cells: 'Format Cells',
      create_chart: 'Create Chart',
      export_pdf: 'Export PDF',
      export_excel: 'Export Excel',
      send_email: 'Send Email',
      show_notification: 'Notification',
      ai_clean_data: 'AI Clean Data',
      ai_create_chart: 'AI Create Chart',
      ai_formula: 'AI Formula',
      ai_analyze: 'AI Analyze',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  return (
    <div className={`action-node ${!step.enabled ? 'disabled' : ''}`}>
      {/* Connector line */}
      {!isFirst && <div className="connector-line top" />}

      {/* Main node */}
      <div className="node-content">
        <div className="node-header" onClick={() => setExpanded(!expanded)}>
          <span className="step-number">{index + 1}</span>
          <span className="action-icon">{getActionIcon(step.action.type)}</span>
          <span className="action-name">
            {step.label || getActionLabel(step.action.type)}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`expand-icon ${expanded ? 'expanded' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {expanded && (
          <div className="node-details">
            {/* Parameters */}
            <div className="params-section">
              {Object.entries(step.action.params).length > 0 ? (
                Object.entries(step.action.params).map(([key, value]) => (
                  <div key={key} className="param-row">
                    <label>{key}:</label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => {
                        const newParams = { ...step.action.params, [key]: e.target.value };
                        onUpdate({
                          action: { ...step.action, params: newParams }
                        });
                      }}
                    />
                  </div>
                ))
              ) : (
                <p className="no-params">No parameters required</p>
              )}
            </div>

            {/* Enable toggle */}
            <div className="enable-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={(e) => onUpdate({ enabled: e.target.checked })}
                />
                <span>Enabled</span>
              </label>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="node-actions">
          <button
            className="action-btn move"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button
            className="action-btn move"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            className="action-btn add"
            onClick={onAddAfter}
            title="Add step after"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button
            className="action-btn remove"
            onClick={onRemove}
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Connector line */}
      {!isLast && <div className="connector-line bottom" />}
    </div>
  );
};

export default ActionNode;
