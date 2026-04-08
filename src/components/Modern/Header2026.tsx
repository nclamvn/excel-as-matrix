import React, { useState, useCallback } from 'react';
import { FileSpreadsheet, Search, Sparkles, ChevronLeft, History } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useToolbarStore, TabId } from '../../stores/toolbarStore';
import { useAIStore } from '../../stores/aiStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { FileMenu } from '../FileMenu';
import { ShareButton } from '../Share';
import { PresenceAvatars } from '../Collab/PresenceAvatars';
import { NotificationBell } from '../Notifications/NotificationBell';
import { useRealtime } from '../../providers/RealtimeProvider';

interface Header2026Props {
  onOpenCommandPalette: () => void;
  onOpenVersionHistory?: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'data', label: 'Data' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

export const Header2026: React.FC<Header2026Props> = ({ onOpenCommandPalette, onOpenVersionHistory }) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const { workbookName } = useWorkbookStore();
  const { activeTab, setActiveTab } = useToolbarStore();
  const isAIOpen = useAIStore((state) => state.isOpen);
  const toggleAIPanel = useAIStore((state) => state.togglePanel);
  const { isConnected, isEnabled } = useRealtime();
  const localUser = usePresenceStore((s) => s.localUser);

  const handleBackToLanding = useCallback(() => {
    localStorage.removeItem('ai-suite-entered');
    window.location.reload();
  }, []);

  return (
    <>
      <header className="header-2026">
        {/* Back to Landing */}
        <button type="button"
          className="header-2026__back"
          onClick={handleBackToLanding}
          title="Back to Landing"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="header-2026__separator">|</span>

        {/* Brand / File Menu Button */}
        <button type="button"
          className="header-2026__brand"
          onClick={() => setIsFileMenuOpen(true)}
          title="File Menu"
        >
          <FileSpreadsheet />
          <span>File</span>
        </button>

        {/* Navigation */}
        <nav className="header-2026__nav">
          {TABS.map((tab) => (
          <button type="button"
            key={tab.id}
            className={`header-2026__nav-item ${activeTab === tab.id ? 'header-2026__nav-item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Title */}
      <div className="header-2026__title">
        {workbookName || 'Untitled'}
      </div>

      {/* Actions */}
      <div className="header-2026__actions">
        <button type="button"
          className="header-2026__cmd-hint"
          onClick={onOpenCommandPalette}
        >
          <Search style={{ width: 14, height: 14 }} />
          <span>Search commands...</span>
          <kbd>⌘K</kbd>
        </button>

        {/* Presence: online users + connection status */}
        {isEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
            <PresenceAvatars size="sm" maxVisible={4} />
            <span
              title={isConnected ? 'Live — real-time sync active' : 'Offline'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: isConnected ? '#22c55e' : '#9ca3af',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#22c55e' : '#9ca3af',
                  display: 'inline-block',
                }}
              />
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        )}

        {/* Version History */}
        {onOpenVersionHistory && (
          <button type="button"
            className="header-2026__history-btn"
            onClick={onOpenVersionHistory}
            title="Version History"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              height: 28,
              background: 'transparent',
              border: '1px solid var(--surface-3, #d4d4d4)',
              borderRadius: 5,
              fontSize: 12,
              color: 'var(--text-2, #525252)',
              cursor: 'pointer',
            }}
          >
            <History size={14} />
            <span>History</span>
          </button>
        )}

        {/* Notification Bell */}
        <NotificationBell userId={localUser?.userId || 'anonymous'} />

        {/* Share Button */}
        <ShareButton />

        {/* AI Copilot Toggle */}
        <button type="button"
          className={`ai-toggle-btn ${isAIOpen ? 'ai-toggle-btn--active' : ''}`}
          onClick={toggleAIPanel}
          title="AI Copilot"
        >
          <Sparkles size={14} />
          <span>AI Copilot</span>
        </button>
      </div>
    </header>

      {/* File Menu Modal */}
      <FileMenu
        isOpen={isFileMenuOpen}
        onClose={() => setIsFileMenuOpen(false)}
      />
    </>
  );
};
