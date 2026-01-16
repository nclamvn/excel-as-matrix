import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { CanvasGrid as Grid } from './components/Grid/CanvasGrid';
import { ToastContainer } from './components/Toast/Toast';
import { useWorkbookStore } from './stores/workbookStore';
import { useSelectionStore } from './stores/selectionStore';
import { useAIStore } from './stores/aiStore';
import { apiClient } from './api/client';
import { shortcutManager } from './shortcuts';

// Landing Page
import { LandingPage } from './components/Landing';

// Lazy load dialogs for better initial load
const FindReplaceDialog = lazy(() => import('./components/FindReplace').then(m => ({ default: m.FindReplaceDialog })));

// Modern 2026 Components
import {
  Header2026,
  Toolbar2026,
  CommandPalette,
  FormulaBar2026,
  SheetTabs2026,
} from './components/Modern';
import { StatusBar2026Enhanced } from './components/Modern/StatusBar2026Enhanced';

// AI Copilot
import { AICopilotDock } from './components/AI';

// File Tabs
import { FileTabs } from './components/FileTabs';

// Charts
import { ChartOverlay } from './components/Charts';

// Shapes
import { ShapeCanvas, ShapeToolbar } from './components/Shapes';

// Pictures
import { PictureCanvas, PictureToolbar } from './components/Pictures';

// Print
import { PrintPreviewDialog } from './components/Print';

// Styles
import './styles/fonts.css';
import './styles/variables.css';
import './styles/modern-2026.css';
import './styles/ai-copilot.css';
import './styles/sandbox.css';
import './styles/trust-ui.css';
import './styles/conversation.css';
import './styles/semantic-types.css';
import './styles/collaboration.css';
import './styles/nl-formula.css';
import './styles/proactive.css';
import './styles/data-cleaner.css';
import './styles/auto-viz.css';
import './styles/macros.css';
import './components/FileMenu/FileMenu.css';
import './components/FileTabs/FileTabs.css';
import './components/Share/Share.css';
import './components/Toolbar/AutoSumDropdown/AutoSumDropdown.css';
import './components/Modern/StatusBar2026Enhanced.css';
import './components/PageLayout/PageLayout.css';
import './components/ConditionalFormatting/ConditionalFormatting.css';
import './components/Review/ReviewTab.css';
import './components/Review/Comments.css';
import './components/Review/TrackChanges.css';
import './components/Review/Protection.css';
import './components/TextOrientation/TextOrientation.css';
import './components/Charts/ChartOverlay.css';
import './components/Shapes/Shapes.css';
import './components/Pictures/Pictures.css';
import './components/Print/Print.css';
import './components/Sparklines/Sparklines.css';

function App() {
  const [showLanding, setShowLanding] = useState(() => {
    // Check localStorage to see if user has entered app before
    return localStorage.getItem('ai-suite-entered') !== 'true';
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleEnterApp = useCallback(() => {
    localStorage.setItem('ai-suite-entered', 'true');
    setShowLanding(false);
  }, []);

  const {
    workbookId,
    workbookName: _workbookName,
    activeSheetId,
    setWorkbook,
    addSheet,
    updateCell,
    setLoading,
  } = useWorkbookStore();

  const isAIOpen = useAIStore((state) => state.isOpen);
  const toggleAIPanel = useAIStore((state) => state.togglePanel);

  // Command Palette shortcut (⌘K), AI Copilot shortcut (⌘J), Print shortcut (⌘P)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
    // AI Copilot toggle (⌘J or Ctrl+J)
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      toggleAIPanel();
    }
    // Print Preview (⌘P or Ctrl+P)
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      setShowPrintPreview(true);
    }
  }, [toggleAIPanel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const { setSelectedCell } = useSelectionStore();

  // Initialize shortcuts manager
  useEffect(() => {
    shortcutManager.init();
    return () => shortcutManager.destroy();
  }, []);

  // Initialize workbook on mount
  useEffect(() => {
    const initializeLocal = () => {
      // Create local workbook without backend
      const localWorkbookId = `local-${Date.now()}`;
      const localSheetId = `sheet-${Date.now()}`;

      setWorkbook(localWorkbookId, 'Untitled Workbook');
      addSheet({
        id: localSheetId,
        name: 'Sheet1',
        index: 0,
        cells: {},
      });

      // Select cell A1
      setSelectedCell({ row: 0, col: 0 });
      setIsInitializing(false);
      setLoading(false);
    };

    const initialize = async () => {
      try {
        setLoading(true);

        // Create a new workbook via API
        const workbook = await apiClient.createWorkbook('Untitled Workbook');

        setWorkbook(workbook.id, workbook.name);

        // Add sheets
        for (const sheet of workbook.sheets) {
          addSheet({
            id: sheet.id,
            name: sheet.name,
            index: sheet.index,
            cells: {},
          });
        }

        // Load cells for first sheet
        if (workbook.sheets.length > 0) {
          const firstSheet = workbook.sheets[0];
          const cells = await apiClient.getCells(workbook.id, firstSheet.id);

          for (const cell of cells) {
            updateCell(firstSheet.id, cell.row, cell.col, {
              value: cell.value,
              formula: cell.formula,
              displayValue: cell.display_value,
            });
          }
        }

        // Select cell A1
        setSelectedCell({ row: 0, col: 0 });

        setIsInitializing(false);
      } catch (err) {
        console.warn('Backend not available, using local mode:', err);
        // Fallback to local mode
        initializeLocal();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Show landing page if user hasn't entered app yet
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <span className="text-green-800">Excel</span>
            <span className="text-gray-400"> - </span>
            <span className="text-amber-700">Claude Code</span>
          </div>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state is no longer blocking - we fall back to local mode

  if (!workbookId || !activeSheetId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">No workbook loaded</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: 'var(--font-2026)', background: 'var(--surface-1)' }}>
      {/* Main Content - adjusts when AI panel is open */}
      <div
        className="h-full flex flex-col"
        style={{
          marginRight: isAIOpen ? '380px' : '0',
          transition: 'margin-right 0.2s ease',
        }}
      >
        {/* Modern Header with Nav */}
        <Header2026 onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

        {/* File Tabs (Browser-style) */}
        <FileTabs />

        {/* Compact Toolbar */}
        <Toolbar2026 />

        {/* Formula Bar */}
        <FormulaBar2026 sheetId={activeSheetId} />

        {/* Grid with Chart, Shape, and Picture Overlay */}
        <div className="flex-1 overflow-hidden relative">
          <Grid workbookId={workbookId} sheetId={activeSheetId} />
          <ChartOverlay sheetId={activeSheetId} />
          <ShapeCanvas sheetId={activeSheetId} />
          <PictureCanvas sheetId={activeSheetId} />
        </div>

        {/* Sheet Tabs */}
        <SheetTabs2026 />

        {/* Status Bar (Green theme - Enhanced) */}
        <StatusBar2026Enhanced />
      </div>

      {/* AI Copilot Dock */}
      <AICopilotDock />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Find/Replace Dialog (lazy loaded) */}
      <Suspense fallback={null}>
        <FindReplaceDialog />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Shape Toolbar (floating, shows when shape selected) */}
      <ShapeToolbar sheetId={activeSheetId} />

      {/* Picture Toolbar (floating, shows when picture selected) */}
      <PictureToolbar sheetId={activeSheetId} />

      {/* Print Preview Dialog (⌘P) */}
      <PrintPreviewDialog
        sheetId={activeSheetId}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
      />
    </div>
  );
}

export default App;
