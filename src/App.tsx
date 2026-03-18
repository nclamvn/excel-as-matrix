import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { CanvasGrid as Grid } from './components/Grid/CanvasGrid';
import { ToastContainer } from './components/Toast/Toast';
import { useWorkbookStore } from './stores/workbookStore';
import { useSelectionStore } from './stores/selectionStore';
import { useAIStore } from './stores/aiStore';
import { useSyncStore } from './stores/syncStore';
import { apiClient } from './api/client';
import { logger } from './utils/logger';
import { shortcutManager } from './shortcuts';
import { auditLog } from './audit/AuditLogService';
import { useCollaboration } from './hooks/useCollaboration';
import type { CollaborationConfig } from './collaboration/CollaborationManager';

// Crash Recovery & Accessibility
import { crashRecovery } from './recovery/CrashRecoveryJournal';
import { SkipToContent } from './components/Accessibility/SkipToContent';

// Lazy load non-critical overlays
const CrashRecoveryBanner = lazy(() => import('./components/Recovery/CrashRecoveryBanner').then(m => ({ default: m.CrashRecoveryBanner })));
const MobileGridOverlay = lazy(() => import('./components/Mobile/MobileGridOverlay').then(m => ({ default: m.MobileGridOverlay })));
const OnboardingTour = lazy(() => import('./components/Onboarding/OnboardingTour'));

// Landing Page — lazy since only shown on first visit
const CompetitiveLanding = lazy(() => import('./components/Landing/CompetitiveLanding').then(m => ({ default: m.CompetitiveLanding })));

// Modern 2026 Components (critical path — not lazy)
import {
  Header2026,
  Toolbar2026,
  CommandPalette,
  FormulaBar2026,
  SheetTabs2026,
} from './components/Modern';
import { StatusBar2026Enhanced } from './components/Modern/StatusBar2026Enhanced';

// File Tabs (critical path)
import { FileTabs } from './components/FileTabs';

// Lazy load non-critical modules for smaller initial bundle
const FindReplaceDialog = lazy(() => import('./components/FindReplace').then(m => ({ default: m.FindReplaceDialog })));
const AICopilotDock = lazy(() => import('./components/AI').then(m => ({ default: m.AICopilotDock })));
const ProactiveAINotifications = lazy(() => import('./components/AI').then(m => ({ default: m.ProactiveAINotifications })));
const ChartOverlay = lazy(() => import('./components/Charts').then(m => ({ default: m.ChartOverlay })));
const ShapeCanvas = lazy(() => import('./components/Shapes').then(m => ({ default: m.ShapeCanvas })));
const ShapeToolbar = lazy(() => import('./components/Shapes').then(m => ({ default: m.ShapeToolbar })));
const PictureCanvas = lazy(() => import('./components/Pictures').then(m => ({ default: m.PictureCanvas })));
const PictureToolbar = lazy(() => import('./components/Pictures').then(m => ({ default: m.PictureToolbar })));
const PrintPreviewDialog = lazy(() => import('./components/Print').then(m => ({ default: m.PrintPreviewDialog })));

// Styles
import './styles/mobile.css';
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
  const setBackendAvailableStore = useSyncStore((state) => state.setBackendAvailable);

  // Collaboration — enabled when ?collab=true or VITE_COLLAB_ENABLED is set
  // Use ?mock=true for local testing without a real WebSocket server
  const collabConfig: CollaborationConfig | undefined = (() => {
    const params = new URLSearchParams(window.location.search);
    const collabEnabled = params.get('collab') === 'true' || import.meta.env.VITE_COLLAB_ENABLED === 'true';
    if (!collabEnabled || !workbookId) return undefined;
    const useMock = params.get('mock') === 'true';
    const userId = params.get('userId') || `user-${Math.random().toString(36).slice(2, 8)}`;
    const userName = params.get('userName') || `User ${userId.slice(-4)}`;
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3001`;
    return { wsUrl: `${wsUrl}/ws/${workbookId}`, documentId: workbookId, userId, userName, useMock };
  })();

  const { isConnected: _collabConnected, userCount: _collabUserCount } = useCollaboration({
    enabled: !!collabConfig,
    config: collabConfig,
  });

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

  // Initialize shortcuts manager + responsive mobile detection
  useEffect(() => {
    shortcutManager.init();

    // Responsive mobile detection on resize
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      import('./stores/uiStore').then(({ useUIStore }) => {
        const current = useUIStore.getState().isMobile;
        if (current !== mobile) useUIStore.getState().setMobile(mobile);
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      shortcutManager.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize audit log + crash recovery journal
  useEffect(() => {
    auditLog.init().then(() => {
      auditLog.logSystem('app.start', 'Application initialized');
    });

    // Audit data operations via workbook store subscription
    const unsubAudit = useWorkbookStore.subscribe(
      (state, prev) => {
        // Log sheet additions
        const newSheets = Object.keys(state.sheets).filter(k => !prev.sheets[k]);
        for (const sid of newSheets) {
          auditLog.logData('sheet.create', `Sheet created: ${state.sheets[sid]?.name}`, {
            workbookId: state.workbookId || undefined,
            metadata: { sheetId: sid },
          });
        }
        // Log workbook changes
        if (state.workbookId !== prev.workbookId && state.workbookId) {
          auditLog.logData('workbook.open', `Workbook opened: ${state.workbookName}`, {
            workbookId: state.workbookId,
          });
        }
      }
    );

    crashRecovery.init().then(() => {
      crashRecovery.cleanup();
    });

    const handleBeforeUnload = () => {
      auditLog.logSystem('app.close', 'Application closing');
      auditLog.flush();
      crashRecovery.closeSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      unsubAudit();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      crashRecovery.closeSession();
    };
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
        setBackendAvailableStore(true);

        setIsInitializing(false);
      } catch (err) {
        logger.warn('Backend not available, using local mode:', err);
        setBackendAvailableStore(false);
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
    return (
      <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="text-sm text-gray-500">Loading...</div></div>}>
        <CompetitiveLanding onEnterApp={handleEnterApp} />
      </Suspense>
    );
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
      {/* Skip to Content — WCAG 2.1 AA */}
      <SkipToContent />

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

        {/* Grid with Chart, Shape, Picture, and Mobile Overlay */}
        <div id="main-grid" className="flex-1 overflow-hidden relative" tabIndex={-1} role="region" aria-label="Spreadsheet grid">
          <Grid workbookId={workbookId} sheetId={activeSheetId} />
          <Suspense fallback={null}>
            <MobileGridOverlay />
          </Suspense>
          <Suspense fallback={null}>
            <ChartOverlay sheetId={activeSheetId} />
            <ShapeCanvas sheetId={activeSheetId} />
            <PictureCanvas sheetId={activeSheetId} />
          </Suspense>
        </div>

        {/* Sheet Tabs */}
        <SheetTabs2026 />

        {/* Status Bar (Green theme - Enhanced) */}
        <StatusBar2026Enhanced />
      </div>

      {/* AI Copilot Dock */}
      <Suspense fallback={null}>
        <AICopilotDock />
      </Suspense>

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Find/Replace Dialog (lazy loaded) */}
      <Suspense fallback={null}>
        <FindReplaceDialog />
      </Suspense>

      {/* Crash Recovery Banner */}
      <Suspense fallback={null}>
        <CrashRecoveryBanner />
      </Suspense>

      {/* Onboarding Tour (lazy) */}
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Floating toolbars & dialogs (lazy) */}
      <Suspense fallback={null}>
        <ShapeToolbar sheetId={activeSheetId} />
        <PictureToolbar sheetId={activeSheetId} />
        <PrintPreviewDialog
          sheetId={activeSheetId}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
        />
        <ProactiveAINotifications />
      </Suspense>
    </div>
  );
}

export default App;
