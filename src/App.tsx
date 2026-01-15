import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { Grid } from './components/Grid/Grid';
import { ToastContainer } from './components/Toast/Toast';
import { useWorkbookStore } from './stores/workbookStore';
import { useSelectionStore } from './stores/selectionStore';
import { apiClient } from './api/client';
import { shortcutManager } from './shortcuts';

// Lazy load dialogs for better initial load
const FindReplaceDialog = lazy(() => import('./components/FindReplace').then(m => ({ default: m.FindReplaceDialog })));

// Modern 2026 Components
import {
  Header2026,
  Toolbar2026,
  CommandPalette,
  FormulaBar2026,
  SheetTabs2026,
  StatusBar2026
} from './components/Modern';

// Styles
import './styles/fonts.css';
import './styles/variables.css';
import './styles/modern-2026.css';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const {
    workbookId,
    workbookName: _workbookName,
    activeSheetId,
    setWorkbook,
    addSheet,
    updateCell,
    setLoading,
  } = useWorkbookStore();

  // Command Palette shortcut (⌘K)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
  }, []);

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
      {/* Modern Header with Nav */}
      <Header2026 onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

      {/* Compact Toolbar */}
      <Toolbar2026 />

      {/* Formula Bar */}
      <FormulaBar2026 sheetId={activeSheetId} />

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <Grid workbookId={workbookId} sheetId={activeSheetId} />
      </div>

      {/* Sheet Tabs */}
      <SheetTabs2026 />

      {/* Status Bar (Green theme) */}
      <StatusBar2026 />

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
    </div>
  );
}

export default App;
