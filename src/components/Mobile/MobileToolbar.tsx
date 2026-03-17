// ═══════════════════════════════════════════════════════════════════════════
// MOBILE TOOLBAR - Bottom Sheet Toolbar for Mobile Devices
// Replaces desktop ribbon with touch-friendly action panels
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import {
  Type,
  Plus,
  Database,
  Sparkles,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  PlusCircle,
  MinusCircle,
  Palette,
  PaintBucket,
  AlignLeft,
  AlignCenter,
  AlignRight,
  BarChart3,
  FunctionSquare,
  Image,
  Link,
  ArrowUpAZ,
  ArrowDownZA,
  Filter,
  ShieldCheck,
  MessageSquare,
  Wand2,
  Brush,
  Printer,
  Download,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useWorkbookStore } from '../../stores/workbookStore';

// ── Types ──────────────────────────────────────────────────────────────────

type PanelId = 'format' | 'insert' | 'data' | 'ai' | 'more' | null;

interface ToolButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const MobileToolbar: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMobile = useUIStore((state) => state.isMobile);
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const showToast = useUIStore((state) => state.showToast);
  const zoom = useWorkbookStore((state) => state.zoom);
  const setZoom = useWorkbookStore((state) => state.setZoom);

  // Don't render on desktop
  if (!isMobile) return null;

  const isDark = resolvedTheme === 'dark';

  // ── Panel toggle ────────────────────────────────────────────────────────

  const togglePanel = useCallback(
    (panelId: PanelId) => {
      setActivePanel((current) => (current === panelId ? null : panelId));
    },
    []
  );

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  // ── Action handlers ─────────────────────────────────────────────────────
  // These are placeholder actions that integrate with the store or show toasts
  // for features that require further wiring.

  const notifyAction = useCallback(
    (label: string) => {
      showToast(`${label} activated`, 'info');
      closePanel();
    },
    [showToast, closePanel]
  );

  // ── Panel definitions ───────────────────────────────────────────────────

  const formatButtons: ToolButton[] = [
    { id: 'bold', label: 'Bold', icon: <Bold size={20} />, action: () => notifyAction('Bold') },
    { id: 'italic', label: 'Italic', icon: <Italic size={20} />, action: () => notifyAction('Italic') },
    { id: 'underline', label: 'Underline', icon: <Underline size={20} />, action: () => notifyAction('Underline') },
    {
      id: 'font-size-up',
      label: 'Font +',
      icon: <PlusCircle size={20} />,
      action: () => notifyAction('Font Size +'),
    },
    {
      id: 'font-size-down',
      label: 'Font -',
      icon: <MinusCircle size={20} />,
      action: () => notifyAction('Font Size -'),
    },
    { id: 'text-color', label: 'Text Color', icon: <Palette size={20} />, action: () => notifyAction('Text Color') },
    {
      id: 'fill-color',
      label: 'Fill Color',
      icon: <PaintBucket size={20} />,
      action: () => notifyAction('Fill Color'),
    },
    {
      id: 'align-left',
      label: 'Align Left',
      icon: <AlignLeft size={20} />,
      action: () => notifyAction('Align Left'),
    },
    {
      id: 'align-center',
      label: 'Center',
      icon: <AlignCenter size={20} />,
      action: () => notifyAction('Align Center'),
    },
    {
      id: 'align-right',
      label: 'Align Right',
      icon: <AlignRight size={20} />,
      action: () => notifyAction('Align Right'),
    },
  ];

  const insertButtons: ToolButton[] = [
    { id: 'chart', label: 'Chart', icon: <BarChart3 size={20} />, action: () => notifyAction('Insert Chart') },
    {
      id: 'function',
      label: 'Function',
      icon: <FunctionSquare size={20} />,
      action: () => notifyAction('Insert Function'),
    },
    { id: 'image', label: 'Image', icon: <Image size={20} />, action: () => notifyAction('Insert Image') },
    { id: 'link', label: 'Link', icon: <Link size={20} />, action: () => notifyAction('Insert Link') },
  ];

  const dataButtons: ToolButton[] = [
    { id: 'sort-az', label: 'Sort A-Z', icon: <ArrowUpAZ size={20} />, action: () => notifyAction('Sort A-Z') },
    { id: 'sort-za', label: 'Sort Z-A', icon: <ArrowDownZA size={20} />, action: () => notifyAction('Sort Z-A') },
    { id: 'filter', label: 'Filter', icon: <Filter size={20} />, action: () => notifyAction('Filter') },
    { id: 'validate', label: 'Validate', icon: <ShieldCheck size={20} />, action: () => notifyAction('Validate') },
  ];

  const aiButtons: ToolButton[] = [
    {
      id: 'ask-ai',
      label: 'Ask AI',
      icon: <MessageSquare size={20} />,
      action: () => notifyAction('Ask AI'),
    },
    {
      id: 'nl-formula',
      label: 'NL Formula',
      icon: <Wand2 size={20} />,
      action: () => notifyAction('NL Formula'),
    },
    {
      id: 'data-clean',
      label: 'Data Clean',
      icon: <Brush size={20} />,
      action: () => notifyAction('Data Clean'),
    },
  ];

  const moreButtons: ToolButton[] = [
    { id: 'print', label: 'Print', icon: <Printer size={20} />, action: () => notifyAction('Print') },
    { id: 'export', label: 'Export', icon: <Download size={20} />, action: () => notifyAction('Export') },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, action: () => notifyAction('Settings') },
    {
      id: 'zoom-in',
      label: `Zoom In (${zoom}%)`,
      icon: <PlusCircle size={20} />,
      action: () => {
        setZoom(Math.min(400, zoom + 10));
      },
    },
    {
      id: 'zoom-out',
      label: `Zoom Out (${zoom}%)`,
      icon: <MinusCircle size={20} />,
      action: () => {
        setZoom(Math.max(25, zoom - 10));
      },
    },
  ];

  const panelMap: Record<Exclude<PanelId, null>, ToolButton[]> = {
    format: formatButtons,
    insert: insertButtons,
    data: dataButtons,
    ai: aiButtons,
    more: moreButtons,
  };

  const panelTitles: Record<Exclude<PanelId, null>, string> = {
    format: 'Format',
    insert: 'Insert',
    data: 'Data',
    ai: 'AI Tools',
    more: 'More',
  };

  // ── Tab bar items ───────────────────────────────────────────────────────

  const tabs: { id: PanelId; label: string; icon: React.ReactNode }[] = [
    { id: 'format', label: 'Format', icon: <Type size={20} /> },
    { id: 'insert', label: 'Insert', icon: <Plus size={20} /> },
    { id: 'data', label: 'Data', icon: <Database size={20} /> },
    { id: 'ai', label: 'AI', icon: <Sparkles size={20} /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal size={20} /> },
  ];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mobile-toolbar-root fixed bottom-0 left-0 right-0 z-50" data-testid="mobile-toolbar">
      {/* Backdrop overlay when panel is open */}
      {activePanel && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closePanel}
          data-testid="mobile-toolbar-backdrop"
        />
      )}

      {/* Slide-up panel */}
      {activePanel && (
        <div
          ref={panelRef}
          className={`
            fixed bottom-[56px] left-0 right-0 z-50
            rounded-t-2xl shadow-xl
            transition-transform duration-200 ease-out
            ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}
            border-t
          `}
          style={{ maxHeight: '50vh', overflowY: 'auto' }}
          data-testid={`mobile-panel-${activePanel}`}
        >
          {/* Panel header */}
          <div
            className={`
              flex items-center justify-between px-4 py-3
              border-b
              ${isDark ? 'border-neutral-700' : 'border-neutral-200'}
            `}
          >
            <h3 className={`font-semibold text-sm ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
              {panelTitles[activePanel]}
            </h3>
            <button
              onClick={closePanel}
              className={`
                p-1 rounded-full
                ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}
              `}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Panel tools grid */}
          <div className="grid grid-cols-4 gap-1 p-3">
            {panelMap[activePanel].map((btn) => (
              <button
                key={btn.id}
                onClick={btn.action}
                className={`
                  flex flex-col items-center justify-center gap-1
                  min-h-[56px] min-w-[56px] p-2
                  rounded-xl
                  transition-colors duration-150
                  active:scale-95
                  ${isDark
                    ? 'text-neutral-300 hover:bg-neutral-800 active:bg-neutral-700'
                    : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200'
                  }
                `}
                style={{ minHeight: '56px', minWidth: '44px' }}
                aria-label={btn.label}
                data-testid={`mobile-btn-${btn.id}`}
              >
                {btn.icon}
                <span className="text-[10px] leading-tight text-center truncate w-full">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div
        className={`
          flex items-center justify-around
          h-14 px-1
          border-t
          ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}
          safe-area-bottom
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        data-testid="mobile-toolbar-bar"
      >
        {tabs.map((tab) => {
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => togglePanel(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-0.5
                min-h-[44px] min-w-[44px] px-3 py-1
                rounded-lg
                transition-colors duration-150
                ${isActive
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : isDark
                    ? 'text-neutral-400 hover:text-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-700'
                }
              `}
              aria-label={tab.label}
              aria-pressed={isActive}
              data-testid={`mobile-tab-${tab.id}`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileToolbar;
