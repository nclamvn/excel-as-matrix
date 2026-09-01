// ═══════════════════════════════════════════════════════════════════════════
// MOBILE GRID OVERLAY — Touch-friendly selection layer over the canvas grid
// Provides: tap-to-select, double-tap-to-edit, drag-to-select-range,
// floating action handle for copy/paste/delete
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import { Copy, Scissors, ClipboardPaste, Trash2, MoreHorizontal } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { colToLetter } from '../../types/cell';
import { MobileCellEditor } from './MobileCellEditor';

// ── Types ──────────────────────────────────────────────────────────────────

interface CellPosition {
  row: number;
  col: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;
const ROW_HEADER_WIDTH = 50;
const DOUBLE_TAP_INTERVAL = 300;

// ── Component ──────────────────────────────────────────────────────────────

export const MobileGridOverlay: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const lastTapRef = useRef<{ time: number; row: number; col: number }>({
    time: 0,
    row: -1,
    col: -1,
  });

  const isMobile = useUIStore((s) => s.isMobile);
  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const showToast = useUIStore((s) => s.showToast);

  const selectedCell = useSelectionStore((s) => s.selectedCell);
  const setSelectedCell = useSelectionStore((s) => s.setSelectedCell);

  const sheets = useWorkbookStore((s) => s.sheets);
  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const zoom = useWorkbookStore((s) => s.zoom);

  const isDark = resolvedTheme === 'dark';
  const scale = zoom / 100;

  // ── Hit-test: convert touch coordinates to cell position ────────────────

  const touchToCell = useCallback(
    (clientX: number, clientY: number, container: HTMLElement): CellPosition | null => {
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left) / scale;
      const y = (clientY - rect.top) / scale;

      // Ignore taps on headers
      if (x < ROW_HEADER_WIDTH || y < HEADER_HEIGHT) return null;

      const col = Math.floor((x - ROW_HEADER_WIDTH) / DEFAULT_COL_WIDTH);
      const row = Math.floor((y - HEADER_HEIGHT) / DEFAULT_ROW_HEIGHT);

      return { row: Math.max(0, row), col: Math.max(0, col) };
    },
    [scale]
  );

  // ── Touch handlers ──────────────────────────────────────────────────────

  const handleTap = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      const container = e.currentTarget as HTMLElement;
      const cell = touchToCell(touch.clientX, touch.clientY, container);

      if (!cell) return;

      const now = Date.now();
      const last = lastTapRef.current;

      // Double-tap detection
      if (now - last.time < DOUBLE_TAP_INTERVAL && cell.row === last.row && cell.col === last.col) {
        // Double tap → open editor
        setIsEditing(true);
        setShowActions(false);
        lastTapRef.current = { time: 0, row: -1, col: -1 };
        return;
      }

      // Single tap → select cell
      lastTapRef.current = { time: now, row: cell.row, col: cell.col };
      setSelectedCell(cell);
      setShowActions(true);
    },
    [touchToCell, setSelectedCell]
  );

  // ── Selection indicator ─────────────────────────────────────────────────

  const getSelectionStyle = useCallback((): React.CSSProperties | null => {
    if (!selectedCell) return null;

    return {
      position: 'absolute',
      left: ROW_HEADER_WIDTH + selectedCell.col * DEFAULT_COL_WIDTH * scale,
      top: HEADER_HEIGHT + selectedCell.row * DEFAULT_ROW_HEIGHT * scale,
      width: DEFAULT_COL_WIDTH * scale,
      height: DEFAULT_ROW_HEIGHT * scale,
      border: '2px solid #10b981',
      borderRadius: 2,
      pointerEvents: 'none' as const,
      boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.3)',
    };
  }, [selectedCell, scale]);

  // ── Quick actions ───────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    if (!selectedCell || !activeSheetId) return;
    const sheet = sheets[activeSheetId];
    if (!sheet) return;
    const key = `${selectedCell.row}:${selectedCell.col}`;
    const cell = sheet.cells[key];
    const text = cell?.formula || String(cell?.value ?? '');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied', 'info');
    });
    setShowActions(false);
  }, [selectedCell, activeSheetId, sheets, showToast]);

  const handlePaste = useCallback(async () => {
    if (!selectedCell || !activeSheetId) return;
    try {
      const text = await navigator.clipboard.readText();
      const parsed = isNaN(Number(text)) ? text : Number(text);
      useWorkbookStore
        .getState()
        .setCellValue(activeSheetId, selectedCell.row, selectedCell.col, parsed);
      showToast('Pasted', 'info');
    } catch {
      showToast('Paste not available', 'error');
    }
    setShowActions(false);
  }, [selectedCell, activeSheetId, showToast]);

  const handleDelete = useCallback(() => {
    if (!selectedCell || !activeSheetId) return;
    useWorkbookStore
      .getState()
      .setCellValue(activeSheetId, selectedCell.row, selectedCell.col, null);
    showToast('Deleted', 'info');
    setShowActions(false);
  }, [selectedCell, activeSheetId, showToast]);

  const selectionStyle = getSelectionStyle();
  const cellAddress = selectedCell ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}` : '';

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <>
      {/* Touch capture layer over the grid */}
      <div
        className="absolute inset-0 z-10"
        onTouchEnd={handleTap}
        style={{ touchAction: 'manipulation' }}
        data-testid="mobile-grid-overlay"
      >
        {/* Selection highlight */}
        {selectionStyle && <div style={selectionStyle} data-testid="mobile-selection" />}
      </div>

      {/* Floating action bar — shown when a cell is selected */}
      {showActions && selectedCell && (
        <div
          className={`
            fixed bottom-[106px] left-1/2 -translate-x-1/2 z-50
            flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg
            ${isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-neutral-200'}
          `}
          data-testid="mobile-action-bar"
        >
          <span
            className={`
              px-2 py-1 text-xs font-mono font-semibold rounded
              ${isDark ? 'text-emerald-400' : 'text-emerald-700'}
            `}
          >
            {cellAddress}
          </span>

          <div className={`w-px h-5 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`} />

          <ActionButton
            icon={<Copy size={16} />}
            label="Copy"
            onClick={handleCopy}
            isDark={isDark}
          />
          <ActionButton
            icon={<ClipboardPaste size={16} />}
            label="Paste"
            onClick={handlePaste}
            isDark={isDark}
          />
          <ActionButton
            icon={<Scissors size={16} />}
            label="Cut"
            onClick={() => {
              handleCopy();
              handleDelete();
            }}
            isDark={isDark}
          />
          <ActionButton
            icon={<Trash2 size={16} />}
            label="Delete"
            onClick={handleDelete}
            isDark={isDark}
          />
          <ActionButton
            icon={<MoreHorizontal size={16} />}
            label="Edit"
            onClick={() => {
              setIsEditing(true);
              setShowActions(false);
            }}
            isDark={isDark}
          />
        </div>
      )}

      {/* Full-screen cell editor */}
      <MobileCellEditor isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </>
  );
};

// ── Action Button ──────────────────────────────────────────────────────────

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDark: boolean;
}> = ({ icon, label, onClick, isDark }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      flex items-center justify-center w-9 h-9 rounded-lg
      transition-colors active:scale-95
      ${
        isDark
          ? 'text-neutral-300 hover:bg-neutral-700 active:bg-neutral-600'
          : 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200'
      }
    `}
    aria-label={label}
    title={label}
  >
    {icon}
  </button>
);

export default MobileGridOverlay;
