import React, { useState, useCallback } from 'react';
import { FileSpreadsheet, Search, Sparkles, ChevronLeft } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useToolbarStore, TabId } from '../../stores/toolbarStore';
import { useAIStore } from '../../stores/aiStore';
import { FileMenu } from '../FileMenu';
import { ShareButton } from '../Share';

interface Header2026Props {
  onOpenCommandPalette: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'data', label: 'Data' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

export const Header2026: React.FC<Header2026Props> = ({ onOpenCommandPalette }) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const { workbookName } = useWorkbookStore();
  const { activeTab, setActiveTab } = useToolbarStore();
  const isAIOpen = useAIStore((state) => state.isOpen);
  const toggleAIPanel = useAIStore((state) => state.togglePanel);

  const handleBackToLanding = useCallback(() => {
    localStorage.removeItem('ai-suite-entered');
    window.location.reload();
  }, []);

  return (
    <>
      <header className="header-2026">
        {/* Back to Landing */}
        <button
          className="header-2026__back"
          onClick={handleBackToLanding}
          title="Back to Landing"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="header-2026__separator">|</span>

        {/* Brand / File Menu Button */}
        <button
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
          <button
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
        <button
          className="header-2026__cmd-hint"
          onClick={onOpenCommandPalette}
        >
          <Search style={{ width: 14, height: 14 }} />
          <span>Search commands...</span>
          <kbd>⌘K</kbd>
        </button>

        {/* Share Button */}
        <ShareButton />

        {/* AI Copilot Toggle */}
        <button
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
