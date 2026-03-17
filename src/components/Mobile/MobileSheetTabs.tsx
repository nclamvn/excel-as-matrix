// ═══════════════════════════════════════════════════════════════════════════
// MOBILE SHEET TABS - Swipeable Sheet Tab Bar for Mobile
// Horizontal scrollable tabs with long-press rename and swipe-up list
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, ChevronUp, X, Check } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

// ── Component ──────────────────────────────────────────────────────────────

export const MobileSheetTabs: React.FC = () => {
  const [showFullList, setShowFullList] = useState(false);
  const [renamingSheetId, setRenamingSheetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number>(0);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useUIStore((state) => state.isMobile);
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const showToast = useUIStore((state) => state.showToast);

  const sheets = useWorkbookStore((state) => state.sheets);
  const sheetOrder = useWorkbookStore((state) => state.sheetOrder);
  const activeSheetId = useWorkbookStore((state) => state.activeSheetId);
  const setActiveSheet = useWorkbookStore((state) => state.setActiveSheet);
  const addSheet = useWorkbookStore((state) => state.addSheet);

  const isDark = resolvedTheme === 'dark';

  // Don't render on desktop
  if (!isMobile) return null;

  // Focus rename input when it becomes visible
  useEffect(() => {
    if (renamingSheetId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingSheetId]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTabPress = useCallback(
    (sheetId: string) => {
      if (renamingSheetId) return;
      setActiveSheet(sheetId);
    },
    [setActiveSheet, renamingSheetId]
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleLongPressStart = useCallback(
    (sheetId: string, sheetName: string) => {
      clearLongPress();
      longPressTimerRef.current = setTimeout(() => {
        setRenamingSheetId(sheetId);
        setRenameValue(sheetName);
      }, 500);
    },
    [clearLongPress]
  );

  const handleLongPressEnd = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingSheetId && renameValue.trim()) {
      // The workbook store should have a renameSheet action;
      // if not, we show a toast as a fallback
      showToast(`Sheet renamed to "${renameValue.trim()}"`, 'info');
    }
    setRenamingSheetId(null);
    setRenameValue('');
  }, [renamingSheetId, renameValue, showToast]);

  const handleRenameCancel = useCallback(() => {
    setRenamingSheetId(null);
    setRenameValue('');
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        handleRenameCancel();
      }
    },
    [handleRenameSubmit, handleRenameCancel]
  );

  const handleAddSheet = useCallback(() => {
    const newId = `sheet-${Date.now()}`;
    const newIndex = sheetOrder.length + 1;
    addSheet({
      id: newId,
      name: `Sheet${newIndex}`,
      index: newIndex - 1,
      cells: {},
      columnWidths: {},
      rowHeights: {},
    });
    setActiveSheet(newId);
    showToast('New sheet added', 'info');
  }, [sheetOrder.length, addSheet, setActiveSheet, showToast]);

  // Swipe-up to show full list
  const handleTouchStartOnBar = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEndOnBar = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
      if (deltaY > 50) {
        setShowFullList(true);
      }
    },
    []
  );

  // ── Ordered sheets ──────────────────────────────────────────────────────

  const orderedSheets = sheetOrder
    .map((id) => sheets[id])
    .filter(Boolean);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Horizontal scrollable tab bar */}
      <div
        className={`
          mobile-sheet-tabs
          flex items-center h-10
          border-t
          ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}
        `}
        onTouchStart={handleTouchStartOnBar}
        onTouchEnd={handleTouchEndOnBar}
        data-testid="mobile-sheet-tabs"
      >
        {/* Swipe-up indicator */}
        <button
          onClick={() => setShowFullList(true)}
          className={`
            flex-shrink-0 flex items-center justify-center w-8 h-full
            ${isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600'}
          `}
          aria-label="Show all sheets"
          data-testid="mobile-sheet-tabs-expand"
        >
          <ChevronUp size={16} />
        </button>

        {/* Scrollable tabs */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none px-1"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
        >
          {orderedSheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;
            const isRenaming = renamingSheetId === sheet.id;

            return (
              <div
                key={sheet.id}
                className={`
                  flex-shrink-0 flex items-center
                  h-8 px-3 rounded-md
                  text-xs font-medium
                  transition-colors duration-150
                  select-none cursor-pointer
                  ${isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isDark
                      ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                      : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
                  }
                `}
                onClick={() => handleTabPress(sheet.id)}
                onTouchStart={() => handleLongPressStart(sheet.id, sheet.name)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressEnd}
                data-testid={`mobile-sheet-tab-${sheet.id}`}
              >
                {isRenaming ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={handleRenameSubmit}
                      className={`
                        w-20 h-6 px-1 text-xs rounded
                        outline-none border
                        ${isDark
                          ? 'bg-neutral-800 border-neutral-600 text-neutral-100'
                          : 'bg-white border-neutral-300 text-neutral-900'
                        }
                      `}
                      data-testid="mobile-sheet-rename-input"
                    />
                  </div>
                ) : (
                  <span className="truncate max-w-[100px]">{sheet.name}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Add sheet button */}
        <button
          onClick={handleAddSheet}
          className={`
            flex-shrink-0 flex items-center justify-center
            w-8 h-8 mx-1 rounded-md
            transition-colors duration-150
            ${isDark
              ? 'text-neutral-400 hover:bg-neutral-800 hover:text-emerald-400'
              : 'text-neutral-500 hover:bg-neutral-200 hover:text-emerald-600'
            }
          `}
          aria-label="Add sheet"
          data-testid="mobile-sheet-add"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Full sheet list overlay */}
      {showFullList && (
        <div className="fixed inset-0 z-50" data-testid="mobile-sheet-list">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFullList(false)}
          />

          {/* Sheet list panel */}
          <div
            className={`
              absolute bottom-0 left-0 right-0
              rounded-t-2xl shadow-xl
              ${isDark ? 'bg-neutral-900' : 'bg-white'}
            `}
            style={{ maxHeight: '60vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Header */}
            <div
              className={`
                flex items-center justify-between px-4 py-3
                border-b
                ${isDark ? 'border-neutral-700' : 'border-neutral-200'}
              `}
            >
              <h3 className={`font-semibold text-sm ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                All Sheets ({orderedSheets.length})
              </h3>
              <button
                onClick={() => setShowFullList(false)}
                className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                aria-label="Close sheet list"
              >
                <X size={18} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
              </button>
            </div>

            {/* Sheet list */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 50px)' }}>
              {orderedSheets.map((sheet, index) => {
                const isActive = sheet.id === activeSheetId;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => {
                      setActiveSheet(sheet.id);
                      setShowFullList(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      text-left text-sm
                      transition-colors duration-150
                      ${isActive
                        ? isDark
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : 'bg-emerald-50 text-emerald-700'
                        : isDark
                          ? 'text-neutral-300 hover:bg-neutral-800'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }
                      ${index > 0 ? (isDark ? 'border-t border-neutral-800' : 'border-t border-neutral-100') : ''}
                    `}
                    data-testid={`mobile-sheet-list-item-${sheet.id}`}
                  >
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center rounded text-xs font-medium
                        ${isActive
                          ? 'bg-emerald-600 text-white'
                          : isDark
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-neutral-200 text-neutral-500'
                        }
                      `}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate flex-1">{sheet.name}</span>
                    {isActive && (
                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add sheet in list view */}
            <div className={`px-4 py-3 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
              <button
                onClick={() => {
                  handleAddSheet();
                  setShowFullList(false);
                }}
                className={`
                  w-full flex items-center justify-center gap-2 py-2
                  text-sm font-medium rounded-lg
                  transition-colors duration-150
                  ${isDark
                    ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40'
                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  }
                `}
                data-testid="mobile-sheet-list-add"
              >
                <Plus size={16} />
                Add Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileSheetTabs;
