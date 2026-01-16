// =============================================================================
// SHARE DIALOG — Document sharing UI (Blueprint §6)
// =============================================================================

import React, { useState } from 'react';
import type { CollaborationUser } from '../../collaboration/types';
import { UserAvatar } from './CollaboratorsList';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';

interface SharedUser {
  user: CollaborationUser;
  permission: PermissionLevel;
  invitedAt: Date;
  invitedBy?: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  currentUser: CollaborationUser;
  sharedUsers: SharedUser[];
  onInvite: (email: string, permission: PermissionLevel) => Promise<void>;
  onUpdatePermission: (userId: string, permission: PermissionLevel) => void;
  onRemoveUser: (userId: string) => void;
  shareLink?: string;
  onCopyLink?: () => void;
}

// -----------------------------------------------------------------------------
// Share Dialog Component
// -----------------------------------------------------------------------------

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  documentTitle,
  currentUser,
  sharedUsers,
  onInvite,
  onUpdatePermission,
  onRemoveUser,
  shareLink,
  onCopyLink,
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('edit');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      await onInvite(email.trim(), permission);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    onCopyLink?.();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite();
    }
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-dialog__header">
          <h2 className="share-dialog__title">Share "{documentTitle}"</h2>
          <button
            className="share-dialog__close"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Invite Form */}
        <div className="share-dialog__invite">
          <div className="share-dialog__invite-row">
            <input
              type="email"
              className="share-dialog__input"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInviting}
            />
            <select
              className="share-dialog__select"
              value={permission}
              onChange={(e) => setPermission(e.target.value as PermissionLevel)}
              disabled={isInviting}
            >
              <option value="view">Can view</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
              <option value="admin">Admin</option>
            </select>
            <button
              className="share-dialog__btn share-dialog__btn--primary"
              onClick={handleInvite}
              disabled={isInviting || !email.trim()}
            >
              {isInviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
          {error && (
            <p className="share-dialog__error">{error}</p>
          )}
        </div>

        {/* Share Link */}
        {shareLink && (
          <div className="share-dialog__link">
            <div className="share-dialog__link-label">
              <LinkIcon />
              <span>Anyone with the link can view</span>
            </div>
            <div className="share-dialog__link-row">
              <input
                type="text"
                className="share-dialog__link-input"
                value={shareLink}
                readOnly
              />
              <button
                className="share-dialog__btn share-dialog__btn--secondary"
                onClick={handleCopyLink}
              >
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {/* Shared Users List */}
        <div className="share-dialog__users">
          <h3 className="share-dialog__users-title">
            People with access ({sharedUsers.length + 1})
          </h3>
          <ul className="share-dialog__users-list">
            {/* Current user (owner) */}
            <li className="share-dialog__user">
              <UserAvatar user={currentUser} size="md" />
              <div className="share-dialog__user-info">
                <span className="share-dialog__user-name">
                  {currentUser.name} (you)
                </span>
                <span className="share-dialog__user-email">
                  {currentUser.email}
                </span>
              </div>
              <span className="share-dialog__user-role">Owner</span>
            </li>

            {/* Shared users */}
            {sharedUsers.map((shared) => (
              <li key={shared.user.id} className="share-dialog__user">
                <UserAvatar user={shared.user} size="md" />
                <div className="share-dialog__user-info">
                  <span className="share-dialog__user-name">
                    {shared.user.name}
                  </span>
                  <span className="share-dialog__user-email">
                    {shared.user.email}
                  </span>
                </div>
                <select
                  className="share-dialog__user-select"
                  value={shared.permission}
                  onChange={(e) =>
                    onUpdatePermission(shared.user.id, e.target.value as PermissionLevel)
                  }
                >
                  <option value="view">Can view</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="share-dialog__user-remove"
                  onClick={() => onRemoveUser(shared.user.id)}
                  title="Remove access"
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="share-dialog__footer">
          <button
            className="share-dialog__btn share-dialog__btn--secondary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Share Button (trigger for dialog)
// -----------------------------------------------------------------------------

interface ShareButtonProps {
  onClick: () => void;
  userCount?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  onClick,
  userCount = 0,
}) => {
  return (
    <button className="share-button" onClick={onClick}>
      <ShareIcon />
      <span className="share-button__label">Share</span>
      {userCount > 0 && (
        <span className="share-button__count">{userCount}</span>
      )}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Quick Share Menu (for toolbar)
// -----------------------------------------------------------------------------

interface QuickShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullDialog: () => void;
  shareLink?: string;
  onCopyLink?: () => void;
}

export const QuickShareMenu: React.FC<QuickShareMenuProps> = ({
  isOpen,
  onClose,
  onOpenFullDialog,
  shareLink,
  onCopyLink,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopyLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="quick-share-menu" onClick={(e) => e.stopPropagation()}>
      <div className="quick-share-menu__header">
        <h4>Quick Share</h4>
        <button onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {shareLink && (
        <div className="quick-share-menu__link">
          <input type="text" value={shareLink} readOnly />
          <button onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <button
        className="quick-share-menu__full"
        onClick={onOpenFullDialog}
      >
        Manage access
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

export default ShareDialog;
