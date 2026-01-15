// Phase 4: Share Dialog - Main sharing UI
import React, { useState, useCallback } from 'react';
import { ShareLink, CreateShareLinkRequest } from '../../types/sharing';
import { WorkbookPermission } from '../../types/auth';
import { usePermissions } from '../../hooks/usePermissions';
import ShareLinkList from './ShareLinkList';
import PermissionsPanel from './PermissionsPanel';
import { getAuthHeaders } from '../../stores/authStore';

interface ShareDialogProps {
  workbookId: string;
  workbookName: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'people' | 'links';

const API_BASE = 'http://localhost:3001/api';

export const ShareDialog: React.FC<ShareDialogProps> = ({
  workbookId,
  workbookName,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('people');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [permissions, setPermissions] = useState<WorkbookPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { canShare } = usePermissions({ workbookId });

  // Fetch share links
  const fetchShareLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/shares`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const links = await response.json();
        setShareLinks(links);
      }
    } catch (e) {
      setError('Failed to fetch share links');
    } finally {
      setIsLoading(false);
    }
  }, [workbookId]);

  // Create share link
  const createShareLink = useCallback(async (request: CreateShareLinkRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const newLink = await response.json();
      setShareLinks((prev) => [newLink, ...prev]);
      return newLink;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create share link');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [workbookId]);

  // Revoke share link
  const revokeShareLink = useCallback(async (linkId: string) => {
    try {
      const response = await fetch(`${API_BASE}/workbooks/${workbookId}/shares/${linkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setShareLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } catch (e) {
      setError('Failed to revoke share link');
    }
  }, [workbookId]);

  // Copy link to clipboard
  const copyLink = useCallback(async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = link.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  // Load data when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      fetchShareLinks();
    }
  }, [isOpen, fetchShareLinks]);

  if (!isOpen) return null;

  return (
    <div className="share-dialog-overlay" onClick={onClose} style={overlayStyle}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()} style={dialogStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Share "{workbookName}"
          </h2>
          <button onClick={onClose} style={closeButtonStyle}>
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div style={tabsStyle}>
          <button
            onClick={() => setActiveTab('people')}
            style={{
              ...tabStyle,
              borderBottom: activeTab === 'people' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'people' ? '#3b82f6' : '#6b7280',
            }}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab('links')}
            style={{
              ...tabStyle,
              borderBottom: activeTab === 'links' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'links' ? '#3b82f6' : '#6b7280',
            }}
          >
            Share Links
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={errorStyle}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 8, cursor: 'pointer' }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Content */}
        <div style={contentStyle}>
          {activeTab === 'people' && (
            <PermissionsPanel
              workbookId={workbookId}
              permissions={permissions}
              onPermissionsChange={setPermissions}
              canEdit={canShare}
            />
          )}
          {activeTab === 'links' && (
            <ShareLinkList
              links={shareLinks}
              isLoading={isLoading}
              canCreate={canShare}
              onCreate={createShareLink}
              onRevoke={revokeShareLink}
              onCopy={copyLink}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 12,
  width: '100%',
  maxWidth: 560,
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 4,
  cursor: 'pointer',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e5e7eb',
  padding: '0 20px',
};

const tabStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '12px 16px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

const contentStyle: React.CSSProperties = {
  padding: 20,
  overflowY: 'auto',
  flex: 1,
};

const errorStyle: React.CSSProperties = {
  margin: '12px 20px',
  padding: '12px 16px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  borderRadius: 8,
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

export default ShareDialog;
