// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS PANEL — Pending AI Actions
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import {
  Check,
  X,
  AlertTriangle,
  Shield,
  Zap,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import type { AIProposedAction } from '../../ai/types';

// ─────────────────────────────────────────────────────────────────────────────
// Action Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface ActionCardProps {
  action: AIProposedAction;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  action,
  isSelected,
  onSelect,
  onApprove,
  onReject,
}) => {
  const getRiskIcon = () => {
    switch (action.riskLevel) {
      case 'high':
        return <AlertTriangle size={14} className="text-red-500" />;
      case 'medium':
        return <Shield size={14} className="text-yellow-500" />;
      default:
        return <Zap size={14} className="text-green-500" />;
    }
  };

  const getTypeIcon = () => {
    switch (action.type) {
      case 'write':
        return <FileEdit size={14} />;
      case 'delete':
        return <Trash2 size={14} />;
      default:
        return <Zap size={14} />;
    }
  };

  return (
    <div
      className={`ai-action-card ${isSelected ? 'ai-action-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="ai-action-card-header">
        <div className="ai-action-card-type">
          {getTypeIcon()}
          <span>{action.type}</span>
        </div>
        <div className="ai-action-card-risk">
          {getRiskIcon()}
          <span>{action.riskLevel}</span>
        </div>
      </div>

      <div className="ai-action-card-description">{action.description}</div>

      <div className="ai-action-card-meta">
        <span>{action.affectedCells} cells</span>
        <span>{action.status}</span>
      </div>

      {action.status === 'pending' && (
        <div className="ai-action-card-actions">
          <button
            className="ai-action-btn ai-action-btn--approve"
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
          >
            <Check size={14} />
            <span>Approve</span>
          </button>
          <button
            className="ai-action-btn ai-action-btn--reject"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
          >
            <X size={14} />
            <span>Reject</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const ActionsPanel: React.FC = () => {
  const pendingActions = useAIStore((state) => state.pendingActions);
  const selectedAction = useAIStore((state) => state.selectedAction);
  const selectAction = useAIStore((state) => state.selectAction);
  const approveAction = useAIStore((state) => state.approveAction);
  const rejectAction = useAIStore((state) => state.rejectAction);

  const handleSelect = useCallback(
    (action: AIProposedAction) => {
      selectAction(selectedAction?.id === action.id ? null : action);
    },
    [selectedAction, selectAction]
  );

  const handleApprove = useCallback(
    (actionId: string) => {
      approveAction(actionId);
    },
    [approveAction]
  );

  const handleReject = useCallback(
    (actionId: string) => {
      rejectAction(actionId);
    },
    [rejectAction]
  );

  return (
    <div className="ai-actions-panel">
      <div className="ai-actions-header">
        <h3>Pending Actions</h3>
        <span className="ai-actions-count">{pendingActions.length}</span>
      </div>

      {pendingActions.length === 0 ? (
        <div className="ai-actions-empty">
          <Zap size={48} className="ai-actions-empty-icon" />
          <h4>No pending actions</h4>
          <p>
            Actions proposed by AI that require your approval will appear here.
          </p>
        </div>
      ) : (
        <div className="ai-actions-list">
          {pendingActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              isSelected={selectedAction?.id === action.id}
              onSelect={() => handleSelect(action)}
              onApprove={() => handleApprove(action.id)}
              onReject={() => handleReject(action.id)}
            />
          ))}
        </div>
      )}

      {/* Selected Action Preview */}
      {selectedAction && (
        <div className="ai-action-preview">
          <h4>Preview</h4>
          <div className="ai-action-preview-content">
            <div className="ai-action-preview-section">
              <span className="label">Type:</span>
              <span>{selectedAction.type}</span>
            </div>
            <div className="ai-action-preview-section">
              <span className="label">Risk:</span>
              <span className={`risk-${selectedAction.riskLevel}`}>
                {selectedAction.riskLevel}
              </span>
            </div>
            <div className="ai-action-preview-section">
              <span className="label">Cells:</span>
              <span>{selectedAction.affectedCells}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPanel;
