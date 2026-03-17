// =============================================================================
// SANDBOX PREVIEW — Main sandbox preview panel (Blueprint §2.2.3)
// =============================================================================

import React, { useState, useCallback } from 'react';
import { GitBranch, Clock, User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import type { Sandbox } from '../../ai/sandbox/types';
import { sandboxManager } from '../../ai/sandbox';
import { RiskBadge, RiskDetails, RiskSummary } from './RiskBadge';
import { DiffViewer } from './DiffViewer';
import { ApprovalControls, StatusIndicator } from './ApprovalControls';
import { loggers } from '@/utils/logger';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SandboxPreviewProps {
  sandbox: Sandbox;
  onApproved?: (sandbox: Sandbox) => void;
  onRejected?: (sandbox: Sandbox) => void;
  onRolledBack?: (sandboxId: string) => void;
  compact?: boolean;
}

interface SandboxCardProps {
  sandbox: Sandbox;
  onClick?: () => void;
  selected?: boolean;
}

// -----------------------------------------------------------------------------
// Sandbox Card (for list view)
// -----------------------------------------------------------------------------

export const SandboxCard: React.FC<SandboxCardProps> = ({
  sandbox,
  onClick,
  selected = false,
}) => {
  const timeAgo = getTimeAgo(sandbox.createdAt);

  return (
    <div
      className={`sandbox-card ${selected ? 'sandbox-card--selected' : ''}`}
      onClick={onClick}
    >
      <div className="sandbox-card-header">
        <div className="sandbox-card-title">
          <GitBranch size={14} />
          <span>{sandbox.name}</span>
        </div>
        <StatusIndicator status={sandbox.status} />
      </div>

      <div className="sandbox-card-meta">
        <span className="sandbox-card-time">
          <Clock size={12} />
          {timeAgo}
        </span>
        <span className="sandbox-card-creator">
          {sandbox.createdBy === 'ai' ? <Bot size={12} /> : <User size={12} />}
          {sandbox.createdBy === 'ai' ? 'AI' : 'User'}
        </span>
        {sandbox.diff && (
          <span className="sandbox-card-changes">
            {sandbox.diff.summary.totalChanges} changes
          </span>
        )}
      </div>

      {sandbox.riskAssessment && (
        <div className="sandbox-card-risk">
          <RiskBadge level={sandbox.riskAssessment.overallRisk} size="small" />
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Sandbox Preview Component
// -----------------------------------------------------------------------------

export const SandboxPreview: React.FC<SandboxPreviewProps> = ({
  sandbox,
  onApproved,
  onRejected,
  onRolledBack,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    diff: true,
    risk: true,
    metadata: false,
  });

  // Toggle section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle approve
  const handleApprove = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = sandboxManager.approveAndMerge(sandbox.id);
      if (result.success && result.sandbox) {
        onApproved?.(result.sandbox);
      } else {
        loggers.ui.error('Merge failed:', result.errors);
      }
    } catch (error) {
      loggers.ui.error('Approval failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sandbox.id, onApproved]);

  // Handle reject
  const handleReject = useCallback(() => {
    try {
      sandboxManager.reject(sandbox.id);
      onRejected?.(sandbox);
    } catch (error) {
      loggers.ui.error('Rejection failed:', error);
    }
  }, [sandbox.id, onRejected]);

  // Handle rollback
  const handleRollback = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = sandboxManager.rollback(sandbox.id);
      if (result.success) {
        onRolledBack?.(sandbox.id);
      } else {
        loggers.ui.error('Rollback failed:', result.errors);
      }
    } catch (error) {
      loggers.ui.error('Rollback failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sandbox.id, onRolledBack]);

  const canRollback = sandboxManager.canRollback(sandbox.id);
  const timeAgo = getTimeAgo(sandbox.createdAt);

  // Compact view
  if (compact) {
    return (
      <div className="sandbox-preview sandbox-preview--compact">
        <div className="sandbox-preview-header">
          <div className="sandbox-preview-title">
            <GitBranch size={14} />
            <span>{sandbox.name}</span>
          </div>
          {sandbox.riskAssessment && (
            <RiskBadge
              level={sandbox.riskAssessment.overallRisk}
              size="small"
            />
          )}
        </div>

        {sandbox.diff && (
          <div className="sandbox-preview-summary">
            <span>
              {sandbox.diff.summary.totalChanges} changes
              {sandbox.diff.summary.formulaChanges > 0 &&
                ` (${sandbox.diff.summary.formulaChanges} formulas)`}
            </span>
          </div>
        )}

        <ApprovalControls
          sandbox={sandbox}
          onApprove={handleApprove}
          onReject={handleReject}
          onRollback={handleRollback}
          canRollback={canRollback}
          isLoading={isLoading}
          compact
        />
      </div>
    );
  }

  // Full view
  return (
    <div className="sandbox-preview">
      {/* Header */}
      <div className="sandbox-preview-header">
        <div className="sandbox-preview-title">
          <GitBranch size={18} />
          <div>
            <h3>{sandbox.name}</h3>
            <p className="sandbox-preview-description">{sandbox.description}</p>
          </div>
        </div>
        <StatusIndicator status={sandbox.status} />
      </div>

      {/* Meta info */}
      <div className="sandbox-preview-meta">
        <span className="sandbox-meta-item">
          <Clock size={14} />
          {timeAgo}
        </span>
        <span className="sandbox-meta-item">
          {sandbox.createdBy === 'ai' ? <Bot size={14} /> : <User size={14} />}
          Created by {sandbox.createdBy === 'ai' ? 'AI Copilot' : 'User'}
        </span>
        {sandbox.diff && (
          <span className="sandbox-meta-item">
            {sandbox.diff.summary.totalChanges} total changes
          </span>
        )}
      </div>

      {/* Risk Assessment */}
      {sandbox.riskAssessment && (
        <div className="sandbox-section">
          <div
            className="sandbox-section-header"
            onClick={() => toggleSection('risk')}
          >
            <span>Risk Assessment</span>
            {expandedSections.risk ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
          {expandedSections.risk && (
            <div className="sandbox-section-content">
              <RiskSummary
                level={sandbox.riskAssessment.overallRisk}
                score={sandbox.riskAssessment.riskScore}
                requiresApproval={sandbox.riskAssessment.requiresApproval}
                canAutoApply={sandbox.riskAssessment.canAutoApply}
              />
              <RiskDetails risks={sandbox.riskAssessment.detectedRisks} />
            </div>
          )}
        </div>
      )}

      {/* Diff Preview */}
      {sandbox.diff && (
        <div className="sandbox-section">
          <div
            className="sandbox-section-header"
            onClick={() => toggleSection('diff')}
          >
            <span>Changes Preview</span>
            {expandedSections.diff ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
          {expandedSections.diff && (
            <div className="sandbox-section-content">
              <DiffViewer diff={sandbox.diff} maxRows={20} />
            </div>
          )}
        </div>
      )}

      {/* Metadata (AI reasoning, etc.) */}
      {sandbox.metadata && (sandbox.metadata.intent || sandbox.metadata.reasoning) && (
        <div className="sandbox-section">
          <div
            className="sandbox-section-header"
            onClick={() => toggleSection('metadata')}
          >
            <span>AI Context</span>
            {expandedSections.metadata ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
          {expandedSections.metadata && (
            <div className="sandbox-section-content sandbox-metadata">
              {sandbox.metadata.intent && (
                <div className="sandbox-metadata-item">
                  <span className="sandbox-metadata-label">User Intent:</span>
                  <p>{sandbox.metadata.intent}</p>
                </div>
              )}
              {sandbox.metadata.reasoning && (
                <div className="sandbox-metadata-item">
                  <span className="sandbox-metadata-label">AI Reasoning:</span>
                  <p>{sandbox.metadata.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approval Controls */}
      <div className="sandbox-preview-actions">
        <ApprovalControls
          sandbox={sandbox}
          onApprove={handleApprove}
          onReject={handleReject}
          onRollback={handleRollback}
          canRollback={canRollback}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default SandboxPreview;
