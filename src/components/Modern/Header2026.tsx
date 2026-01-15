import React from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useToolbarStore, TabId } from '../../stores/toolbarStore';

interface Header2026Props {
  onOpenCommandPalette: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'data', label: 'Data' },
  { id: 'view', label: 'View' },
];

export const Header2026: React.FC<Header2026Props> = ({ onOpenCommandPalette }) => {
  const { workbookName } = useWorkbookStore();
  const { activeTab, setActiveTab } = useToolbarStore();

  return (
    <header className="header-2026">
      {/* Brand */}
      <div className="header-2026__brand">
        <FileSpreadsheet />
        <span>Excel</span>
      </div>

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
      </div>
    </header>
  );
};
