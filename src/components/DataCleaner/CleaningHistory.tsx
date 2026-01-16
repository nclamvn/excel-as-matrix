// =============================================================================
// CLEANING HISTORY — Track and manage cleaning session history
// =============================================================================

import React, { useState } from 'react';
import type { CellChange } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CleaningSession {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual' | 'batch';
  changes: CellChange[];
  undone: boolean;
  description: string;
}

interface HistoryState {
  sessions: CleaningSession[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface CleaningHistoryProps {
  history: HistoryState;
  onUndo?: () => void;
  onRedo?: () => void;
  onUndoSession?: (sessionId: string) => void;
  onRevertToSession?: (sessionId: string) => void;
  onClearHistory?: () => void;
}

// -----------------------------------------------------------------------------
// Cleaning History Component
// -----------------------------------------------------------------------------

export const CleaningHistory: React.FC<CleaningHistoryProps> = ({
  history,
  onUndo,
  onRedo,
  onUndoSession,
  onRevertToSession,
  onClearHistory,
}) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showUndone, setShowUndone] = useState(false);

  const visibleSessions = showUndone
    ? history.sessions
    : history.sessions.filter(s => !s.undone);

  const totalChanges = visibleSessions.reduce((sum, s) => sum + s.changes.length, 0);

  return (
    <div className="cleaning-history">
      {/* Header */}
      <div className="cleaning-history__header">
        <div className="cleaning-history__title">
          <HistoryIcon />
          <span>Cleaning History</span>
        </div>
        <div className="cleaning-history__controls">
          <button
            className="cleaning-history__undo"
            onClick={onUndo}
            disabled={!history.canUndo}
            title="Undo last action"
          >
            <UndoIcon />
          </button>
          <button
            className="cleaning-history__redo"
            onClick={onRedo}
            disabled={!history.canRedo}
            title="Redo last action"
          >
            <RedoIcon />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="cleaning-history__summary">
        <span className="cleaning-history__count">
          {visibleSessions.length} sessions
        </span>
        <span className="cleaning-history__changes">
          {totalChanges} changes
        </span>
        <label className="cleaning-history__show-undone">
          <input
            type="checkbox"
            checked={showUndone}
            onChange={(e) => setShowUndone(e.target.checked)}
          />
          Show undone
        </label>
      </div>

      {/* Timeline */}
      <div className="cleaning-history__timeline">
        {visibleSessions.length === 0 ? (
          <div className="cleaning-history__empty">
            <EmptyIcon />
            <p>No cleaning history</p>
            <span>Your cleaning actions will appear here</span>
          </div>
        ) : (
          visibleSessions.map((session, index) => (
            <HistorySessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSession === session.id}
              isCurrent={index === history.currentIndex}
              onToggle={() => setExpandedSession(
                expandedSession === session.id ? null : session.id
              )}
              onUndo={onUndoSession}
              onRevert={onRevertToSession}
            />
          ))
        )}
      </div>

      {/* Clear Button */}
      {onClearHistory && visibleSessions.length > 0 && (
        <div className="cleaning-history__footer">
          <button
            className="cleaning-history__clear"
            onClick={onClearHistory}
          >
            <TrashIcon />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// History Session Card Component
// -----------------------------------------------------------------------------

interface HistorySessionCardProps {
  session: CleaningSession;
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
  onUndo?: (sessionId: string) => void;
  onRevert?: (sessionId: string) => void;
}

const HistorySessionCard: React.FC<HistorySessionCardProps> = ({
  session,
  isExpanded,
  isCurrent,
  onToggle,
  onUndo,
  onRevert,
}) => {
  const typeConfig = getSessionTypeConfig(session.type);

  return (
    <div
      className={`history-session ${session.undone ? 'history-session--undone' : ''} ${isCurrent ? 'history-session--current' : ''}`}
    >
      {/* Timeline Dot */}
      <div className="history-session__dot">
        <div
          className="history-session__dot-inner"
          style={{ backgroundColor: session.undone ? '#94a3b8' : typeConfig.color }}
        />
      </div>

      {/* Session Content */}
      <div className="history-session__content">
        <div className="history-session__header" onClick={onToggle}>
          <div className="history-session__info">
            <span className="history-session__icon" style={{ color: typeConfig.color }}>
              {typeConfig.icon}
            </span>
            <span className="history-session__description">{session.description}</span>
            {session.undone && (
              <span className="history-session__undone-badge">Undone</span>
            )}
            {isCurrent && (
              <span className="history-session__current-badge">Current</span>
            )}
          </div>
          <div className="history-session__meta">
            <span className="history-session__time">
              {formatTime(session.timestamp)}
            </span>
            <span className="history-session__changes-count">
              {session.changes.length} changes
            </span>
          </div>
          <ChevronIcon expanded={isExpanded} />
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="history-session__details">
            {/* Change Preview */}
            <div className="history-session__changes">
              {session.changes.slice(0, 10).map((change, i) => (
                <div key={i} className="history-session__change">
                  <span className="history-session__change-cell">{change.ref}</span>
                  <span className="history-session__change-before">
                    {formatValue(change.before)}
                  </span>
                  <span className="history-session__change-arrow">→</span>
                  <span className="history-session__change-after">
                    {formatValue(change.after)}
                  </span>
                </div>
              ))}
              {session.changes.length > 10 && (
                <div className="history-session__changes-more">
                  +{session.changes.length - 10} more changes
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="history-session__actions">
              {!session.undone && onUndo && (
                <button
                  className="history-session__action"
                  onClick={() => onUndo(session.id)}
                >
                  <UndoIcon />
                  Undo Session
                </button>
              )}
              {onRevert && (
                <button
                  className="history-session__action"
                  onClick={() => onRevert(session.id)}
                >
                  <RevertIcon />
                  Revert to Here
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact History Bar Component
// -----------------------------------------------------------------------------

interface CompactHistoryBarProps {
  history: HistoryState;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const CompactHistoryBar: React.FC<CompactHistoryBarProps> = ({
  history,
  onUndo,
  onRedo,
}) => {
  const recentSession = history.sessions[history.currentIndex];

  return (
    <div className="compact-history-bar">
      <button
        className="compact-history-bar__btn"
        onClick={onUndo}
        disabled={!history.canUndo}
        title="Undo"
      >
        <UndoIcon />
      </button>
      <div className="compact-history-bar__status">
        {recentSession ? (
          <span>{recentSession.description}</span>
        ) : (
          <span>No changes</span>
        )}
      </div>
      <button
        className="compact-history-bar__btn"
        onClick={onRedo}
        disabled={!history.canRedo}
        title="Redo"
      >
        <RedoIcon />
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getSessionTypeConfig(type: CleaningSession['type']): {
  color: string;
  icon: React.ReactNode;
} {
  const configs = {
    auto: {
      color: '#3b82f6',
      icon: <ZapIcon />,
    },
    manual: {
      color: '#8b5cf6',
      icon: <EditIcon />,
    },
    batch: {
      color: '#10b981',
      icon: <BatchIcon />,
    },
  };
  return configs[type];
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (value === '') return '(blank)';
  const str = String(value);
  return str.length > 20 ? str.slice(0, 20) + '...' : str;
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UndoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

const RevertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ZapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const BatchIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default CleaningHistory;
