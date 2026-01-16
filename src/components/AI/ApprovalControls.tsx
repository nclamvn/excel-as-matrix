// =============================================================================
// APPROVAL CONTROLS — Approve/reject buttons for sandbox (Blueprint §2.2.3)
// =============================================================================

import React, { useState } from 'react';
import { Check, X, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import type { Sandbox, SandboxStatus } from '../../ai/sandbox/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ApprovalControlsProps {
  sandbox: Sandbox;
  onApprove: () => void;
  onReject: () => void;
  onRollback?: () => void;
  canRollback?: boolean;
  isLoading?: boolean;
  compact?: boolean;
}

interface StatusIndicatorProps {
  status: SandboxStatus;
}

// -----------------------------------------------------------------------------
// Status Indicator Component
// -----------------------------------------------------------------------------

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={14} />,
          label: 'Pending Review',
          className: 'status--pending',
        };
      case 'approved':
        return {
          icon: <Check size={14} />,
          label: 'Approved',
          className: 'status--approved',
        };
      case 'merged':
        return {
          icon: <Check size={14} />,
          label: 'Merged',
          className: 'status--merged',
        };
      case 'rejected':
        return {
          icon: <X size={14} />,
          label: 'Rejected',
          className: 'status--rejected',
        };
      case 'discarded':
        return {
          icon: <X size={14} />,
          label: 'Discarded',
          className: 'status--discarded',
        };
      case 'rolled_back':
        return {
          icon: <RotateCcw size={14} />,
          label: 'Rolled Back',
          className: 'status--rolled-back',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`sandbox-status ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Approval Controls Component
// -----------------------------------------------------------------------------

export const ApprovalControls: React.FC<ApprovalControlsProps> = ({
  sandbox,
  onApprove,
  onReject,
  onRollback,
  canRollback = false,
  isLoading = false,
  compact = false,
}) => {
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [isConfirmingRollback, setIsConfirmingRollback] = useState(false);

  const isPending = sandbox.status === 'pending';
  const isMerged = sandbox.status === 'merged';
  const isHighRisk = sandbox.riskAssessment?.overallRisk === 'high';

  // Handle approve
  const handleApprove = () => {
    if (!isLoading && isPending) {
      onApprove();
    }
  };

  // Handle reject
  const handleReject = () => {
    if (isConfirmingReject) {
      onReject();
      setIsConfirmingReject(false);
    } else {
      setIsConfirmingReject(true);
    }
  };

  // Handle rollback
  const handleRollback = () => {
    if (isConfirmingRollback) {
      onRollback?.();
      setIsConfirmingRollback(false);
    } else {
      setIsConfirmingRollback(true);
    }
  };

  // Cancel confirmation
  const cancelConfirmation = () => {
    setIsConfirmingReject(false);
    setIsConfirmingRollback(false);
  };

  // Compact view for merged/completed sandboxes
  if (!isPending && !isMerged) {
    return (
      <div className="approval-controls approval-controls--completed">
        <StatusIndicator status={sandbox.status} />
      </div>
    );
  }

  // Rollback view for merged sandboxes
  if (isMerged) {
    return (
      <div className="approval-controls approval-controls--merged">
        <StatusIndicator status={sandbox.status} />
        {canRollback && onRollback && (
          <div className="approval-actions">
            {isConfirmingRollback ? (
              <div className="approval-confirm">
                <span className="approval-confirm-text">Undo all changes?</span>
                <button
                  className="approval-btn approval-btn--confirm"
                  onClick={handleRollback}
                  disabled={isLoading}
                >
                  <RotateCcw size={14} />
                  Yes, Rollback
                </button>
                <button
                  className="approval-btn approval-btn--cancel"
                  onClick={cancelConfirmation}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="approval-btn approval-btn--rollback"
                onClick={handleRollback}
                disabled={isLoading}
              >
                <RotateCcw size={14} />
                Rollback
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Pending view with approve/reject
  if (compact) {
    return (
      <div className="approval-controls approval-controls--compact">
        <button
          className="approval-btn approval-btn--approve-compact"
          onClick={handleApprove}
          disabled={isLoading}
          title="Approve and Apply"
        >
          <Check size={16} />
        </button>
        <button
          className="approval-btn approval-btn--reject-compact"
          onClick={handleReject}
          disabled={isLoading}
          title="Reject"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="approval-controls">
      {/* High risk warning */}
      {isHighRisk && (
        <div className="approval-warning">
          <AlertTriangle size={14} />
          <span>High risk operation. Please review carefully.</span>
        </div>
      )}

      {/* Status */}
      <StatusIndicator status={sandbox.status} />

      {/* Actions */}
      <div className="approval-actions">
        {isConfirmingReject ? (
          <div className="approval-confirm">
            <span className="approval-confirm-text">
              Are you sure you want to reject?
            </span>
            <button
              className="approval-btn approval-btn--confirm-reject"
              onClick={handleReject}
              disabled={isLoading}
            >
              <X size={14} />
              Yes, Reject
            </button>
            <button
              className="approval-btn approval-btn--cancel"
              onClick={cancelConfirmation}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              className="approval-btn approval-btn--approve"
              onClick={handleApprove}
              disabled={isLoading}
            >
              <Check size={14} />
              {isLoading ? 'Applying...' : 'Approve & Apply'}
            </button>
            <button
              className="approval-btn approval-btn--reject"
              onClick={handleReject}
              disabled={isLoading}
            >
              <X size={14} />
              Reject
            </button>
          </>
        )}
      </div>

      {/* Auto-apply hint */}
      {sandbox.riskAssessment?.canAutoApply && (
        <div className="approval-hint">
          <span>Low risk - could be auto-applied with current settings</span>
        </div>
      )}
    </div>
  );
};

export default ApprovalControls;
