import React, { useState } from 'react';
import { RibbonTab } from './RibbonTab';
import { HomeTab } from './tabs/HomeTab';
import { InsertTab } from './tabs/InsertTab';
import { FormulasTab } from './tabs/FormulasTab';
import { DataTab } from './tabs/DataTab';
import { ViewTab } from './tabs/ViewTab';
import { PageLayoutToolbar } from '../Modern/toolbars/PageLayoutToolbar';
import { Menu, ChevronUp, ChevronDown } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', component: HomeTab },
  { id: 'insert', label: 'Insert', component: InsertTab },
  { id: 'page-layout', label: 'Page Layout', component: PageLayoutToolbar },
  { id: 'formulas', label: 'Formulas', component: FormulasTab },
  { id: 'data', label: 'Data', component: DataTab },
  { id: 'view', label: 'View', component: ViewTab },
];

export const Ribbon: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isCollapsed, setCollapsed] = useState(false);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || HomeTab;

  return (
    <div className="ribbon">
      {/* File Menu Button + Tab Bar */}
      <div className="ribbon-header">
        <button className="file-button">
          <Menu className="w-4 h-4" />
          <span>File</span>
        </button>

        <div className="ribbon-tabs">
          {TABS.map(tab => (
            <RibbonTab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <button
          className="collapse-button"
          onClick={() => setCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Tab Content */}
      {!isCollapsed && (
        <div className="ribbon-content">
          <ActiveComponent />
        </div>
      )}
    </div>
  );
};
