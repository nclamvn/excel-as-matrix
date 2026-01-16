// ═══════════════════════════════════════════════════════════════════════════
// HISTORY PANEL — Action History
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  History,
  Check,
  X,
  RotateCcw,
  FileEdit,
  Trash2,
  Zap,
  Clock,
} from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import type { AIActionHistory } from '../../ai/types';

// ─────────────────────────────────────────────────────────────────────────────
// History Item Component
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryItemProps {
  item: AIActionHistory;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const getOutcomeIcon = () => {
    switch (item.outcome) {
      case 'success':
        return <Check size={14} className="text-green-500" />;
      case 'failed':
        return <X size={14} className="text-red-500" />;
      case 'reverted':
        return <RotateCcw size={14} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (item.action.type) {
      case 'write':
        return <FileEdit size={14} />;
      case 'delete':
        return <Trash2 size={14} />;
      default:
        return <Zap size={14} />;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`ai-history-item ai-history-item--${item.outcome}`}>
      <div className="ai-history-item-icon">{getTypeIcon()}</div>

      <div className="ai-history-item-content">
        <div className="ai-history-item-header">
          <span className="ai-history-item-type">{item.action.type}</span>
          <span className="ai-history-item-outcome">
            {getOutcomeIcon()}
            {item.outcome}
          </span>
        </div>
        <div className="ai-history-item-description">
          {item.action.description}
        </div>
        <div className="ai-history-item-meta">
          <span className="ai-history-item-cells">
            {item.action.affectedCells} cells
          </span>
          <span className="ai-history-item-time">
            <Clock size={12} />
            {formatTime(item.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const HistoryPanel: React.FC = () => {
  const actionHistory = useAIStore((state) => state.actionHistory);

  // Sort by most recent first
  const sortedHistory = [...actionHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="ai-history-panel">
      <div className="ai-history-header">
        <History size={18} />
        <h3>Action History</h3>
        <span className="ai-history-count">{actionHistory.length}</span>
      </div>

      {actionHistory.length === 0 ? (
        <div className="ai-history-empty">
          <History size={48} className="ai-history-empty-icon" />
          <h4>No history yet</h4>
          <p>
            Actions you approve or reject will be recorded here for reference.
          </p>
        </div>
      ) : (
        <div className="ai-history-list">
          {sortedHistory.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {actionHistory.length > 0 && (
        <div className="ai-history-stats">
          <h4>Summary</h4>
          <div className="ai-history-stats-grid">
            <div className="ai-history-stat">
              <span className="label">Total</span>
              <span className="value">{actionHistory.length}</span>
            </div>
            <div className="ai-history-stat ai-history-stat--success">
              <span className="label">Success</span>
              <span className="value">
                {actionHistory.filter((h) => h.outcome === 'success').length}
              </span>
            </div>
            <div className="ai-history-stat ai-history-stat--failed">
              <span className="label">Failed</span>
              <span className="value">
                {actionHistory.filter((h) => h.outcome === 'failed').length}
              </span>
            </div>
            <div className="ai-history-stat ai-history-stat--reverted">
              <span className="label">Reverted</span>
              <span className="value">
                {actionHistory.filter((h) => h.outcome === 'reverted').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
