import React, { useState } from 'react';
import { ChevronUp, Users } from 'lucide-react';
import { QuickAccessBar } from './QuickAccessBar';
import { HomeTabPremium } from './tabs/HomeTabPremium';
import { InsertTab } from './tabs/InsertTab';
import { FormulasTab } from './tabs/FormulasTab';
import { DataTab } from './tabs/DataTab';
import { ViewTab } from './tabs/ViewTab';
import { PageLayoutToolbar } from '../Modern/toolbars/PageLayoutToolbar';
import { FileMenu } from '../FileMenu';

type TabId = 'file' | 'home' | 'insert' | 'page-layout' | 'formulas' | 'data' | 'review' | 'view';

interface Tab {
  id: TabId;
  label: string;
  isFile?: boolean;
}

const tabs: Tab[] = [
  { id: 'file', label: 'File', isFile: true },
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'page-layout', label: 'Page Layout' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'data', label: 'Data' },
  { id: 'review', label: 'Review' },
  { id: 'view', label: 'View' },
];

export const RibbonPremium: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);

  const handleTabClick = (tabId: TabId) => {
    if (tabId === 'file') {
      setIsFileMenuOpen(true);
      return;
    }
    setActiveTab(tabId);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTabPremium />;
      case 'insert':
        return <InsertTab />;
      case 'page-layout':
        return <PageLayoutToolbar />;
      case 'formulas':
        return <FormulasTab />;
      case 'data':
        return <DataTab />;
      case 'view':
        return <ViewTab />;
      default:
        return <HomeTabPremium />;
    }
  };

  return (
    <div className="ribbon-premium">
      {/* Quick Access Bar */}
      <QuickAccessBar />

      {/* Ribbon Header with Tabs */}
      <div className="ribbon-header">
        <div className="ribbon-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`ribbon-tab ${tab.isFile ? 'ribbon-tab--file' : ''} ${activeTab === tab.id ? 'ribbon-tab--active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ribbon-actions">
          <button className="ribbon-share-btn">
            <Users />
            <span>Share</span>
          </button>

          <button
            className={`ribbon-collapse-btn ${isCollapsed ? 'ribbon-collapse-btn--collapsed' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
          >
            <ChevronUp />
          </button>
        </div>
      </div>

      {/* Ribbon Content */}
      <div className={`ribbon-content ${isCollapsed ? 'ribbon-content--collapsed' : ''}`}>
        {renderTabContent()}
      </div>

      {/* File Menu */}
      <FileMenu isOpen={isFileMenuOpen} onClose={() => setIsFileMenuOpen(false)} />
    </div>
  );
};
