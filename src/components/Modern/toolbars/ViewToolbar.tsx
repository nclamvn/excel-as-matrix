import React from 'react';
import {
  Grid, Columns, ZoomIn, ZoomOut,
  Maximize, Sun, Moon
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';

export const ViewToolbar: React.FC = () => {
  const {
    zoom, setZoom,
    showGridlines, setShowGridlines,
    showHeadings, setShowHeadings,
  } = useWorkbookStore();

  const { resolvedTheme, toggleTheme, formulaBarVisible, toggleFormulaBar } = useUIStore();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="toolbar-2026">
      {/* View Options */}
      <div className="toolbar-2026__group">
        <label className="toolbar-2026__checkbox">
          <input
            type="checkbox"
            checked={showGridlines}
            onChange={(e) => setShowGridlines(e.target.checked)}
          />
          <Grid size={14} />
          <span>Gridlines</span>
        </label>
        <label className="toolbar-2026__checkbox">
          <input
            type="checkbox"
            checked={showHeadings}
            onChange={(e) => setShowHeadings(e.target.checked)}
          />
          <Columns size={14} />
          <span>Headings</span>
        </label>
        <label className="toolbar-2026__checkbox">
          <input
            type="checkbox"
            checked={formulaBarVisible}
            onChange={toggleFormulaBar}
          />
          <span>Formula Bar</span>
        </label>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Zoom */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={() => setZoom(Math.max(25, zoom - 10))}
          disabled={zoom <= 25}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="toolbar-2026__zoom-value">{zoom}%</span>
        <button
          className="toolbar-2026__btn"
          onClick={() => setZoom(Math.min(400, zoom + 10))}
          disabled={zoom >= 400}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => setZoom(100)}
          title="Reset to 100%"
        >
          <Maximize size={16} />
          <span>100%</span>
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Theme */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
          <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </div>
  );
};
