// Phase 5: Dashboard Toolbar
// Controls for editing, theming, and exporting dashboards

import React, { useState } from 'react';
import {
  useDashboardStore,
  createChartWidget,
  createKPIWidget,
  createTextWidget,
} from '../../stores/dashboardStore';
import { Dashboard, DEFAULT_THEMES, WidgetPosition } from '../../types/visualization';

interface DashboardToolbarProps {
  dashboard: Dashboard;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({ dashboard }) => {
  const {
    isEditMode,
    setEditMode,
    setPresentationMode,
    addWidget,
    setTheme,
  } = useDashboardStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleAddWidget = (type: string) => {
    const position: WidgetPosition = {
      x: 0,
      y: 0,
      w: type === 'KPI' ? 3 : 6,
      h: type === 'KPI' ? 2 : 4,
      isStatic: false,
    };

    let widget;
    switch (type) {
      case 'KPI':
        widget = createKPIWidget('New KPI', 'A1', position);
        break;
      case 'Text':
        widget = createTextWidget('Enter your text here...', position);
        break;
      case 'Chart':
        widget = createChartWidget('', 'New Chart', { ...position, w: 6, h: 4 });
        break;
      default:
        widget = createTextWidget('New Widget', position);
    }

    addWidget(dashboard.id, widget);
    setShowAddMenu(false);
  };

  const handleThemeChange = (themeName: string) => {
    const theme = DEFAULT_THEMES[themeName];
    if (theme) {
      setTheme(dashboard.id, theme);
    }
    setShowThemeMenu(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
      <div className="flex items-center gap-4">
        {/* Dashboard name */}
        <h1 className="text-lg font-semibold text-gray-800">{dashboard.name}</h1>

        {/* Edit/View toggle */}
        <div className="flex items-center border rounded overflow-hidden">
          <button
            onClick={() => setEditMode(true)}
            className={`px-3 py-1 text-sm ${
              isEditMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setEditMode(false)}
            className={`px-3 py-1 text-sm ${
              !isEditMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            View
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Add Widget Button */}
        {isEditMode && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Widget
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 min-w-[150px]">
                <button
                  onClick={() => handleAddWidget('KPI')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  KPI Card
                </button>
                <button
                  onClick={() => handleAddWidget('Chart')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Chart
                </button>
                <button
                  onClick={() => handleAddWidget('Text')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Text
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => handleAddWidget('Table')}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: dashboard.theme.primaryColor }}
            />
            Theme
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20">
              {Object.entries(DEFAULT_THEMES).map(([name, theme]) => (
                <button
                  key={name}
                  onClick={() => handleThemeChange(name)}
                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50
                    ${dashboard.theme.name === theme.name ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presentation Mode */}
        <button
          onClick={() => setPresentationMode(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          title="Presentation mode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* More Options */}
        <button className="p-1.5 border rounded hover:bg-gray-50" title="More options">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
