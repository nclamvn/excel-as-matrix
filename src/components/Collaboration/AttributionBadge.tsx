// =============================================================================
// ATTRIBUTION BADGE — Shows who edited a cell (Blueprint §6.5)
// =============================================================================

import React from 'react';
import type { CellAttribution, EditRecord } from '../../collaboration/types';
import { UserAvatar } from './CollaboratorsList';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface AttributionBadgeProps {
  attribution: CellAttribution;
  compact?: boolean;
  showTime?: boolean;
}

interface AttributionTooltipProps {
  attribution: CellAttribution;
  position?: { x: number; y: number };
}

// -----------------------------------------------------------------------------
// Format relative time
// -----------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// -----------------------------------------------------------------------------
// Attribution Badge Component
// -----------------------------------------------------------------------------

export const AttributionBadge: React.FC<AttributionBadgeProps> = ({
  attribution,
  compact = false,
  showTime = true,
}) => {
  const { lastEditedBy, lastEditedAt } = attribution;

  if (compact) {
    return (
      <div
        className="attribution-badge attribution-badge--compact"
        title={`Last edited by ${lastEditedBy.name}`}
      >
        <span
          className="attribution-badge__dot"
          style={{ backgroundColor: lastEditedBy.color }}
        />
      </div>
    );
  }

  return (
    <div className="attribution-badge">
      <UserAvatar user={lastEditedBy} size="sm" />
      <div className="attribution-badge__info">
        <span className="attribution-badge__name">{lastEditedBy.name}</span>
        {showTime && (
          <span className="attribution-badge__time">
            {formatRelativeTime(lastEditedAt)}
          </span>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Attribution Tooltip (detailed view)
// -----------------------------------------------------------------------------

export const AttributionTooltip: React.FC<AttributionTooltipProps> = ({
  attribution,
  position,
}) => {
  const { lastEditedBy, lastEditedAt, editHistory } = attribution;
  const recentHistory = editHistory.slice(-5).reverse();

  const style = position
    ? { left: position.x, top: position.y }
    : {};

  return (
    <div className="attribution-tooltip" style={style}>
      <div className="attribution-tooltip__header">
        <span className="attribution-tooltip__cell">{attribution.cellRef}</span>
      </div>

      <div className="attribution-tooltip__last-edit">
        <UserAvatar user={lastEditedBy} size="md" />
        <div className="attribution-tooltip__info">
          <span className="attribution-tooltip__name">{lastEditedBy.name}</span>
          <span className="attribution-tooltip__time">
            {formatDateTime(lastEditedAt)}
          </span>
        </div>
      </div>

      {recentHistory.length > 1 && (
        <div className="attribution-tooltip__history">
          <h4 className="attribution-tooltip__history-title">Recent edits</h4>
          <ul className="attribution-tooltip__history-list">
            {recentHistory.map((record, index) => (
              <li key={`${record.eventId}-${index}`} className="attribution-tooltip__history-item">
                <span
                  className="attribution-tooltip__history-dot"
                  style={{ backgroundColor: record.user.color }}
                />
                <span className="attribution-tooltip__history-name">
                  {record.user.name}
                </span>
                <span className="attribution-tooltip__history-type">
                  {formatChangeType(record.changeType)}
                </span>
                <span className="attribution-tooltip__history-time">
                  {formatRelativeTime(record.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Edit History Panel (sidebar)
// -----------------------------------------------------------------------------

interface EditHistoryPanelProps {
  cellRef: string;
  history: EditRecord[];
  onClose?: () => void;
}

export const EditHistoryPanel: React.FC<EditHistoryPanelProps> = ({
  cellRef,
  history,
  onClose,
}) => {
  const sortedHistory = [...history].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="edit-history-panel">
      <div className="edit-history-panel__header">
        <h3 className="edit-history-panel__title">
          Edit History: {cellRef}
        </h3>
        {onClose && (
          <button
            className="edit-history-panel__close"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {sortedHistory.length === 0 ? (
        <div className="edit-history-panel__empty">
          <p>No edit history available</p>
        </div>
      ) : (
        <ul className="edit-history-panel__list">
          {sortedHistory.map((record, index) => (
            <li key={`${record.eventId}-${index}`} className="edit-history-panel__item">
              <UserAvatar user={record.user} size="sm" />
              <div className="edit-history-panel__info">
                <span className="edit-history-panel__name">
                  {record.user.name}
                </span>
                <span className="edit-history-panel__action">
                  {formatChangeType(record.changeType)}
                </span>
              </div>
              <span className="edit-history-panel__time">
                {formatDateTime(record.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Attribution Summary (for cell info)
// -----------------------------------------------------------------------------

interface AttributionSummaryProps {
  attribution: CellAttribution | null;
}

export const AttributionSummary: React.FC<AttributionSummaryProps> = ({
  attribution,
}) => {
  if (!attribution) {
    return (
      <div className="attribution-summary attribution-summary--empty">
        <span>No edit history</span>
      </div>
    );
  }

  return (
    <div className="attribution-summary">
      <span className="attribution-summary__label">Last edited by</span>
      <AttributionBadge attribution={attribution} />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatChangeType(type: EditRecord['changeType']): string {
  switch (type) {
    case 'value':
      return 'changed value';
    case 'formula':
      return 'changed formula';
    case 'format':
      return 'changed format';
    case 'clear':
      return 'cleared cell';
    default:
      return 'edited';
  }
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export default AttributionBadge;
