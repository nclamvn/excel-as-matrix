// =============================================================================
// COLLABORATORS LIST — Shows who's online (Blueprint §6.3)
// =============================================================================

import React from 'react';
import type { UserSession, CollaborationUser } from '../../collaboration/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface CollaboratorsListProps {
  users: UserSession[];
  currentUser: CollaborationUser;
  maxVisible?: number;
  onUserClick?: (user: UserSession) => void;
}

// -----------------------------------------------------------------------------
// User Avatar Component
// -----------------------------------------------------------------------------

interface UserAvatarProps {
  user: CollaborationUser;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  isTyping?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showTooltip = true,
  isTyping = false,
}) => {
  const sizeClasses = {
    sm: 'collab-avatar--sm',
    md: 'collab-avatar--md',
    lg: 'collab-avatar--lg',
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`collab-avatar ${sizeClasses[size]} ${isTyping ? 'collab-avatar--typing' : ''}`}
      style={{ borderColor: user.color }}
      title={showTooltip ? user.name : undefined}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="collab-avatar__image" />
      ) : (
        <span className="collab-avatar__initials" style={{ backgroundColor: user.color }}>
          {getInitials(user.name)}
        </span>
      )}
      {isTyping && <span className="collab-avatar__typing-indicator" />}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Collaborators List Component
// -----------------------------------------------------------------------------

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  users,
  currentUser,
  maxVisible = 5,
  onUserClick,
}) => {
  // Filter out current user and sort by join time
  const otherUsers = users
    .filter((u) => u.user.id !== currentUser.id)
    .sort((a, b) => a.connectedAt.getTime() - b.connectedAt.getTime());

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  if (otherUsers.length === 0) {
    return (
      <div className="collab-list collab-list--empty">
        <span className="collab-list__empty-text">Only you</span>
      </div>
    );
  }

  return (
    <div className="collab-list">
      <div className="collab-list__avatars">
        {visibleUsers.map((session) => (
          <button
            key={session.user.id}
            className="collab-list__avatar-btn"
            onClick={() => onUserClick?.(session)}
            title={`${session.user.name}${session.activeSheet ? ` - on ${session.activeSheet}` : ''}`}
          >
            <UserAvatar user={session.user} size="md" showTooltip={false} />
            <span
              className={`collab-list__status collab-list__status--${session.status}`}
            />
          </button>
        ))}
        {hiddenCount > 0 && (
          <div className="collab-list__overflow">
            <span className="collab-list__overflow-count">+{hiddenCount}</span>
          </div>
        )}
      </div>
      <span className="collab-list__count">
        {otherUsers.length + 1} online
      </span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact User List (for sidebar)
// -----------------------------------------------------------------------------

interface CompactUserListProps {
  users: UserSession[];
  currentUser: CollaborationUser;
  onUserClick?: (user: UserSession) => void;
}

export const CompactUserList: React.FC<CompactUserListProps> = ({
  users,
  currentUser,
  onUserClick,
}) => {
  const sortedUsers = [...users].sort((a, b) => {
    // Current user first
    if (a.user.id === currentUser.id) return -1;
    if (b.user.id === currentUser.id) return 1;
    // Then by connection time
    return a.connectedAt.getTime() - b.connectedAt.getTime();
  });

  return (
    <div className="collab-user-list">
      <h4 className="collab-user-list__title">Collaborators ({users.length})</h4>
      <ul className="collab-user-list__items">
        {sortedUsers.map((session) => (
          <li
            key={session.user.id}
            className="collab-user-list__item"
            onClick={() => onUserClick?.(session)}
          >
            <UserAvatar user={session.user} size="sm" />
            <div className="collab-user-list__info">
              <span className="collab-user-list__name">
                {session.user.name}
                {session.user.id === currentUser.id && ' (you)'}
              </span>
              {session.activeSheet && (
                <span className="collab-user-list__sheet">
                  {session.activeSheet}
                </span>
              )}
            </div>
            <span
              className={`collab-user-list__status collab-user-list__status--${session.status}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollaboratorsList;
