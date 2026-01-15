// Phase 4: Share Link List - Displays and manages share links
import React, { useState } from 'react';
import { ShareLink, CreateShareLinkRequest, ShareLinkType } from '../../types/sharing';

interface ShareLinkListProps {
  links: ShareLink[];
  isLoading: boolean;
  canCreate: boolean;
  onCreate: (request: CreateShareLinkRequest) => Promise<ShareLink>;
  onRevoke: (linkId: string) => Promise<void>;
  onCopy: (link: ShareLink) => Promise<void>;
}

const ShareLinkList: React.FC<ShareLinkListProps> = ({
  links,
  isLoading,
  canCreate,
  onCreate,
  onRevoke,
  onCopy,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (link: ShareLink) => {
    await onCopy(link);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="share-link-list">
      {/* Create button */}
      {canCreate && !showCreateForm && (
        <button onClick={() => setShowCreateForm(true)} style={createButtonStyle}>
          <PlusIcon />
          Create share link
        </button>
      )}

      {/* Create form */}
      {showCreateForm && (
        <CreateLinkForm
          onSubmit={async (request) => {
            await onCreate(request);
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Loading state */}
      {isLoading && links.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
          Loading share links...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && links.length === 0 && (
        <div style={emptyStateStyle}>
          <LinkIcon size={40} color="#d1d5db" />
          <p style={{ marginTop: 12, color: '#6b7280' }}>No share links yet</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            Create a share link to let others access this workbook
          </p>
        </div>
      )}

      {/* Link list */}
      <div style={{ marginTop: 16 }}>
        {links.map((link) => (
          <ShareLinkItem
            key={link.id}
            link={link}
            isCopied={copiedId === link.id}
            onCopy={() => handleCopy(link)}
            onRevoke={() => onRevoke(link.id)}
            canRevoke={canCreate}
          />
        ))}
      </div>
    </div>
  );
};

interface ShareLinkItemProps {
  link: ShareLink;
  isCopied: boolean;
  onCopy: () => void;
  onRevoke: () => void;
  canRevoke: boolean;
}

const ShareLinkItem: React.FC<ShareLinkItemProps> = ({
  link,
  isCopied,
  onCopy,
  onRevoke,
  canRevoke,
}) => {
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);

  const getStatusBadge = () => {
    if (!link.isValid) {
      return <span style={{ ...badgeStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}>Expired</span>;
    }
    if (!link.isActive) {
      return <span style={{ ...badgeStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}>Revoked</span>;
    }
    return <span style={{ ...badgeStyle, backgroundColor: '#f0fdf4', color: '#16a34a' }}>Active</span>;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Edit': return '#dc2626';
      case 'Comment': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={linkItemStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ ...typeBadgeStyle, backgroundColor: `${getTypeColor(link.linkType)}15`, color: getTypeColor(link.linkType) }}>
            {link.linkType}
          </span>
          {getStatusBadge()}
          {link.hasPassword && (
            <span style={{ ...badgeStyle, backgroundColor: '#f3f4f6', color: '#4b5563' }}>
              Password protected
            </span>
          )}
        </div>

        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {link.useCount} uses
          {link.maxUses && ` / ${link.maxUses} max`}
          {link.expiresAt && ` • Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
        </div>

        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontFamily: 'monospace' }}>
          {link.url.substring(0, 50)}...
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCopy} style={actionButtonStyle} title="Copy link">
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </button>
        {canRevoke && link.isActive && (
          <>
            {showConfirmRevoke ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { onRevoke(); setShowConfirmRevoke(false); }}
                  style={{ ...actionButtonStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmRevoke(false)}
                  style={actionButtonStyle}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmRevoke(true)}
                style={actionButtonStyle}
                title="Revoke link"
              >
                <TrashIcon />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface CreateLinkFormProps {
  onSubmit: (request: CreateShareLinkRequest) => Promise<void>;
  onCancel: () => void;
}

const CreateLinkForm: React.FC<CreateLinkFormProps> = ({ onSubmit, onCancel }) => {
  const [linkType, setLinkType] = useState<ShareLinkType>('View');
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(undefined);
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        linkType,
        expiresInHours,
        maxUses,
        password: password || undefined,
        requireLogin,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Create Share Link</h3>

      {/* Link type */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Permission level</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['View', 'Comment', 'Edit'] as ShareLinkType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setLinkType(type)}
              style={{
                ...typeButtonStyle,
                backgroundColor: linkType === type ? '#3b82f6' : '#f3f4f6',
                color: linkType === type ? 'white' : '#4b5563',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Expiry */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Expires after</label>
        <select
          value={expiresInHours || ''}
          onChange={(e) => setExpiresInHours(e.target.value ? Number(e.target.value) : undefined)}
          style={selectStyle}
        >
          <option value="">Never</option>
          <option value="1">1 hour</option>
          <option value="24">24 hours</option>
          <option value="168">7 days</option>
          <option value="720">30 days</option>
        </select>
      </div>

      {/* Max uses */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Max uses</label>
        <select
          value={maxUses || ''}
          onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : undefined)}
          style={selectStyle}
        >
          <option value="">Unlimited</option>
          <option value="1">1 use</option>
          <option value="5">5 uses</option>
          <option value="10">10 uses</option>
          <option value="50">50 uses</option>
        </select>
      </div>

      {/* Password */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Password (optional)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave empty for no password"
          style={inputStyle}
        />
      </div>

      {/* Require login */}
      <div style={{ ...fieldStyle, flexDirection: 'row', alignItems: 'center' }}>
        <input
          type="checkbox"
          id="requireLogin"
          checked={requireLogin}
          onChange={(e) => setRequireLogin(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="requireLogin" style={{ fontSize: 14, color: '#4b5563' }}>
          Require login to access
        </label>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onCancel} style={cancelButtonStyle}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
          {isSubmitting ? 'Creating...' : 'Create Link'}
        </button>
      </div>
    </form>
  );
};

// Icons
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
  </svg>
);

const LinkIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2z" />
    <path d="M2 6a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2h-2v2H2V8h2V6H2z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#16a34a">
    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
    <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
  </svg>
);

// Styles
const createButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'center',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
};

const linkItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  marginBottom: 8,
};

const badgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
};

const typeBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
};

const actionButtonStyle: React.CSSProperties = {
  padding: 8,
  backgroundColor: '#f3f4f6',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const formStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  marginBottom: 16,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

const typeButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  backgroundColor: 'white',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f3f4f6',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
};

const submitButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

export default ShareLinkList;
