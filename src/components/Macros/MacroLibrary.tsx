// =============================================================================
// MACRO LIBRARY — Display saved macros
// =============================================================================

import React from 'react';
import type { Macro, TriggerType } from '../../macros/types';

interface MacroLibraryProps {
  macros: Macro[];
  onRun: (macroId: string) => void;
  onEdit: (macro: Macro) => void;
  onDelete: (macroId: string) => void;
}

export const MacroLibrary: React.FC<MacroLibraryProps> = ({
  macros,
  onRun,
  onEdit,
  onDelete,
}) => {
  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'schedule':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        );
      case 'data_change':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        );
      default:
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
    }
  };

  const getTriggerLabel = (macro: Macro): string => {
    const { type, config } = macro.trigger;

    switch (type) {
      case 'schedule':
        const schedule = config.schedule;
        if (schedule?.type === 'daily') return 'Daily';
        if (schedule?.type === 'weekly') return 'Weekly';
        if (schedule?.type === 'monthly') return 'Monthly';
        return 'Scheduled';
      case 'data_change':
        return 'On data change';
      default:
        return 'Manual';
    }
  };

  if (macros.length === 0) {
    return (
      <div className="empty-library">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <h3>No macros yet</h3>
        <p>Create your first macro by recording actions or using AI</p>
      </div>
    );
  }

  return (
    <div className="macro-library">
      {macros.map(macro => (
        <div key={macro.id} className={`macro-card ${!macro.enabled ? 'disabled' : ''}`}>
          <div className="macro-card-header">
            <div className="macro-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div className="macro-info">
              <h4>{macro.name}</h4>
              <div className="macro-meta">
                <span className="trigger-badge">
                  {getTriggerIcon(macro.trigger.type)}
                  {getTriggerLabel(macro)}
                </span>
                <span className="step-count">
                  {macro.workflow.steps.length} steps
                </span>
              </div>
            </div>
          </div>

          {macro.description && (
            <p className="macro-description">{macro.description}</p>
          )}

          <div className="macro-stats">
            <div className="stat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>
                {macro.lastRunAt
                  ? `Last run: ${new Date(macro.lastRunAt).toLocaleDateString()}`
                  : 'Never run'}
              </span>
            </div>
            <div className="stat">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>{macro.runCount} runs</span>
            </div>
          </div>

          <div className="macro-actions">
            <button
              className="run-btn"
              onClick={() => onRun(macro.id)}
              disabled={!macro.enabled}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Run
            </button>
            <button
              className="edit-btn"
              onClick={() => onEdit(macro)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              className="delete-btn"
              onClick={() => onDelete(macro.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MacroLibrary;
