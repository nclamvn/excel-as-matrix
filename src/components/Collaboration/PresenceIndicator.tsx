// =============================================================================
// PRESENCE INDICATOR — Connection status indicator (Blueprint §6.3)
// =============================================================================

import React from 'react';
import type { ConnectionStatus, UserSession } from '../../collaboration/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface PresenceIndicatorProps {
  status: ConnectionStatus;
  userCount?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onReconnect?: () => void;
  showDetails?: boolean;
}

// -----------------------------------------------------------------------------
// Presence Indicator Component
// -----------------------------------------------------------------------------

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  userCount = 0,
  showLabel = true,
  size = 'md',
}) => {
  const statusInfo = getStatusInfo(status);

  return (
    <div className={`presence-indicator presence-indicator--${size}`}>
      <span
        className={`presence-indicator__dot presence-indicator__dot--${status}`}
        title={statusInfo.label}
      />
      {showLabel && (
        <span className="presence-indicator__label">
          {userCount > 1 ? `${userCount} users` : statusInfo.label}
        </span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Connection Status Bar
// -----------------------------------------------------------------------------

export const ConnectionStatusBar: React.FC<ConnectionStatusProps> = ({
  status,
  onReconnect,
  showDetails = true,
}) => {
  const statusInfo = getStatusInfo(status);

  // Only show for non-connected states
  if (status === 'connected' && !showDetails) return null;

  return (
    <div className={`connection-status connection-status--${status}`}>
      <span
        className={`connection-status__dot connection-status__dot--${status}`}
      />
      <span className="connection-status__text">
        {statusInfo.message}
      </span>
      {status === 'disconnected' && onReconnect && (
        <button
          className="connection-status__reconnect"
          onClick={onReconnect}
        >
          Reconnect
        </button>
      )}
      {status === 'connecting' && (
        <span className="connection-status__spinner" />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Online Users Indicator
// -----------------------------------------------------------------------------

interface OnlineUsersIndicatorProps {
  users: UserSession[];
  maxAvatars?: number;
  onClick?: () => void;
}

export const OnlineUsersIndicator: React.FC<OnlineUsersIndicatorProps> = ({
  users,
  maxAvatars = 3,
  onClick,
}) => {
  const visibleUsers = users.slice(0, maxAvatars);
  const overflowCount = Math.max(0, users.length - maxAvatars);

  if (users.length === 0) {
    return (
      <div className="online-users-indicator online-users-indicator--empty">
        <span className="online-users-indicator__text">No one else online</span>
      </div>
    );
  }

  return (
    <button
      className="online-users-indicator"
      onClick={onClick}
      title={`${users.length} user${users.length !== 1 ? 's' : ''} online`}
    >
      <div className="online-users-indicator__avatars">
        {visibleUsers.map((session) => (
          <div
            key={session.user.id}
            className="online-users-indicator__avatar"
            style={{ borderColor: session.user.color }}
          >
            {session.user.avatar ? (
              <img
                src={session.user.avatar}
                alt={session.user.name}
                className="online-users-indicator__avatar-img"
              />
            ) : (
              <span
                className="online-users-indicator__avatar-initials"
                style={{ backgroundColor: session.user.color }}
              >
                {getInitials(session.user.name)}
              </span>
            )}
          </div>
        ))}
        {overflowCount > 0 && (
          <div className="online-users-indicator__overflow">
            +{overflowCount}
          </div>
        )}
      </div>
      <span className="online-users-indicator__count">
        {users.length} online
      </span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Typing Indicator
// -----------------------------------------------------------------------------

interface TypingIndicatorProps {
  users: { name: string; color: string }[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].name} is typing...`
      : users.length === 2
        ? `${users[0].name} and ${users[1].name} are typing...`
        : `${users[0].name} and ${users.length - 1} others are typing...`;

  return (
    <div className="typing-indicator">
      <div className="typing-indicator__dots">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
      <span className="typing-indicator__text">{text}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Live Indicator (pulsing dot for real-time features)
// -----------------------------------------------------------------------------

interface LiveIndicatorProps {
  isLive: boolean;
  label?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive,
  label = 'Live',
}) => {
  return (
    <div className={`live-indicator ${isLive ? 'live-indicator--active' : ''}`}>
      <span className="live-indicator__dot" />
      {label && <span className="live-indicator__label">{label}</span>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface StatusInfo {
  label: string;
  message: string;
  color: string;
}

function getStatusInfo(status: ConnectionStatus): StatusInfo {
  switch (status) {
    case 'connected':
      return {
        label: 'Connected',
        message: 'Real-time collaboration active',
        color: '#22c55e',
      };
    case 'connecting':
      return {
        label: 'Connecting',
        message: 'Connecting to server...',
        color: '#f59e0b',
      };
    case 'disconnected':
      return {
        label: 'Offline',
        message: 'Connection lost. Changes will sync when reconnected.',
        color: '#ef4444',
      };
    case 'reconnecting':
      return {
        label: 'Reconnecting',
        message: 'Attempting to reconnect...',
        color: '#f59e0b',
      };
    case 'error':
      return {
        label: 'Error',
        message: 'Connection error. Please try again.',
        color: '#ef4444',
      };
    default:
      return {
        label: 'Unknown',
        message: 'Unknown connection status',
        color: '#6b7280',
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default PresenceIndicator;
