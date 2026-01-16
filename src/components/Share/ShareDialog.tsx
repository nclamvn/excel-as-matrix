// ============================================================
// SHARE DIALOG - Share options and link generation
// ============================================================

import React, { useState } from 'react';
import { X, Copy, Check, Globe, Link2 } from 'lucide-react';

interface ShareDialogProps {
  onClose: () => void;
}

type Permission = 'view' | 'comment' | 'edit';

export const ShareDialog: React.FC<ShareDialogProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>('view');
  const [linkCopied, setLinkCopied] = useState(false);
  const [invites, setInvites] = useState<
    { email: string; permission: Permission }[]
  >([]);

  const shareLink = `https://excelai.app/share/${Math.random().toString(36).substring(2, 10)}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleInvite = () => {
    if (email && email.includes('@')) {
      setInvites([...invites, { email, permission }]);
      setEmail('');
    }
  };

  const handleRemoveInvite = (emailToRemove: string) => {
    setInvites(invites.filter((i) => i.email !== emailToRemove));
  };

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h2>Share this workbook</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="share-dialog-content">
          {/* Invite by email */}
          <div className="share-section">
            <label>Invite people</label>
            <div className="invite-row">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as Permission)}
              >
                <option value="view">Can view</option>
                <option value="comment">Can comment</option>
                <option value="edit">Can edit</option>
              </select>
              <button className="invite-btn" onClick={handleInvite}>
                Invite
              </button>
            </div>
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="share-section invites-list">
              <label>Pending invites</label>
              {invites.map((invite) => (
                <div key={invite.email} className="invite-item">
                  <span className="invite-email">{invite.email}</span>
                  <span className="invite-permission">{invite.permission}</span>
                  <button
                    className="remove-invite"
                    onClick={() => handleRemoveInvite(invite.email)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Share link */}
          <div className="share-section">
            <label>Or share via link</label>
            <div className="link-row">
              <div className="share-link-input">
                <Link2 size={14} />
                <span>{shareLink}</span>
              </div>
              <button
                className={`copy-link-btn ${linkCopied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy link
                  </>
                )}
              </button>
            </div>
            <div className="link-permissions">
              <Globe size={14} />
              <span>Anyone with the link can view</span>
              <button className="change-permission">Change</button>
            </div>
          </div>
        </div>

        <div className="share-dialog-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
