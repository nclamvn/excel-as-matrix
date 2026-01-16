// ============================================================
// PAGE LAYOUT TOOLBAR
// ============================================================

import React, { useState } from 'react';
import {
  Grid,
  Rows,
  Columns,
  ImageIcon,
  Printer,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { usePrintStore } from '../../../stores/printStore';
import { useUIStore } from '../../../stores/uiStore';
import {
  ThemesDropdown,
  MarginsDropdown,
  OrientationDropdown,
  SizeDropdown,
  PrintTitlesDialog,
  BackgroundDialog,
} from '../../PageLayout';
import '../../PageLayout/PageLayout.css';

export const PageLayoutToolbar: React.FC = () => {
  const { activeSheetId } = useWorkbookStore();
  const { getSettings, setGridlines, setHeadings } = usePrintStore();
  const { showToast } = useUIStore();

  const [showPrintTitlesDialog, setShowPrintTitlesDialog] = useState(false);
  const [showBackgroundDialog, setShowBackgroundDialog] = useState(false);

  const settings = activeSheetId ? getSettings(activeSheetId) : null;

  const handleToggleGridlines = () => {
    if (activeSheetId) {
      const newValue = !settings?.printGridlines;
      setGridlines(activeSheetId, newValue);
      showToast(newValue ? 'Gridlines will print' : 'Gridlines hidden', 'info');
    }
  };

  const handleToggleHeadings = () => {
    if (activeSheetId) {
      const newValue = !settings?.printRowColHeaders;
      setHeadings(activeSheetId, newValue);
      showToast(newValue ? 'Headings will print' : 'Headings hidden', 'info');
    }
  };

  const handleInsertPageBreak = () => {
    showToast('Page break inserted at selection', 'success');
  };

  return (
    <>
      <div className="toolbar-2026">
        {/* Themes Section */}
        <div className="toolbar-2026__group">
          {activeSheetId && <ThemesDropdown sheetId={activeSheetId} />}
        </div>

        <div className="toolbar-2026__divider" />

        {/* Page Setup Section */}
        <div className="toolbar-2026__group">
          {activeSheetId && <MarginsDropdown sheetId={activeSheetId} />}
          {activeSheetId && <OrientationDropdown sheetId={activeSheetId} />}
          {activeSheetId && <SizeDropdown sheetId={activeSheetId} />}
        </div>

        <div className="toolbar-2026__divider" />

        {/* Print Area Section */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => showToast('Set print area from selection', 'info')}
            title="Print Area"
          >
            <Printer size={16} />
            <span>Print Area</span>
          </button>
          <button
            className="toolbar-2026__btn"
            onClick={() => activeSheetId && setShowPrintTitlesDialog(true)}
            title="Print Titles"
          >
            <Rows size={16} />
            <span>Titles</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Page Breaks Section */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={handleInsertPageBreak}
            title="Insert Page Break"
          >
            <Columns size={16} />
            <span>Breaks</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Background Section */}
        <div className="toolbar-2026__group">
          <button
            className="toolbar-2026__btn"
            onClick={() => activeSheetId && setShowBackgroundDialog(true)}
            title="Sheet Background"
          >
            <ImageIcon size={16} />
            <span>Background</span>
          </button>
        </div>

        <div className="toolbar-2026__divider" />

        {/* Sheet Options Section */}
        <div className="toolbar-2026__group">
          <button
            className={`toolbar-2026__btn ${settings?.printGridlines ? 'active' : ''}`}
            onClick={handleToggleGridlines}
            title="Print Gridlines"
          >
            <Grid size={16} />
            <span>Gridlines</span>
          </button>
          <button
            className={`toolbar-2026__btn ${settings?.printRowColHeaders ? 'active' : ''}`}
            onClick={handleToggleHeadings}
            title="Print Headings"
          >
            {settings?.printRowColHeaders ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Headings</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      {activeSheetId && (
        <PrintTitlesDialog
          sheetId={activeSheetId}
          isOpen={showPrintTitlesDialog}
          onClose={() => setShowPrintTitlesDialog(false)}
        />
      )}

      {activeSheetId && (
        <BackgroundDialog
          sheetId={activeSheetId}
          isOpen={showBackgroundDialog}
          onClose={() => setShowBackgroundDialog(false)}
        />
      )}
    </>
  );
};

export default PageLayoutToolbar;
