// ═══════════════════════════════════════════════════════════════════════════
// MOBILE CELL EDITOR — Full-screen editor overlay for mobile cell editing
// Provides a touch-friendly input with formula bar and quick actions
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, FunctionSquare, Hash, Type, Calendar } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { colToLetter } from '../../types/cell';

interface MobileCellEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCellEditor: React.FC<MobileCellEditorProps> = ({ isOpen, onClose }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const selectedCell = useSelectionStore((s) => s.selectedCell);
  const sheets = useWorkbookStore((s) => s.sheets);
  const activeSheetId = useWorkbookStore((s) => s.activeSheetId);
  const setCellValue = useWorkbookStore((s) => s.setCellValue);

  const isDark = resolvedTheme === 'dark';

  // Load current cell value when editor opens
  useEffect(() => {
    if (isOpen && selectedCell && activeSheetId) {
      const sheet = sheets[activeSheetId];
      if (sheet) {
        const key = `${selectedCell.row}:${selectedCell.col}`;
        const cell = sheet.cells[key];
        setValue(cell?.formula || String(cell?.value ?? ''));
        // Focus input after a brief delay for animation
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, selectedCell, activeSheetId, sheets]);

  const cellAddress = selectedCell ? `${colToLetter(selectedCell.col)}${selectedCell.row + 1}` : '';

  const handleConfirm = useCallback(() => {
    if (selectedCell && activeSheetId) {
      const parsed = value.startsWith('=') ? value : isNaN(Number(value)) ? value : Number(value);
      setCellValue(activeSheetId, selectedCell.row, selectedCell.col, parsed);
    }
    onClose();
  }, [selectedCell, activeSheetId, value, setCellValue, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleConfirm, handleCancel]
  );

  // Quick insert buttons
  const quickInserts = [
    { label: '=', icon: <FunctionSquare size={16} />, insert: '=' },
    { label: '123', icon: <Hash size={16} />, insert: '' },
    { label: 'ABC', icon: <Type size={16} />, insert: '' },
    { label: 'Date', icon: <Calendar size={16} />, insert: new Date().toLocaleDateString() },
  ];

  const handleQuickInsert = useCallback((text: string) => {
    if (text) {
      setValue((prev) => prev + text);
      inputRef.current?.focus();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" data-testid="mobile-cell-editor">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDark ? 'bg-neutral-950/90' : 'bg-black/50'}`}
        onClick={handleCancel}
      />

      {/* Editor panel — slides up from bottom */}
      <div
        className={`
          relative mt-auto
          rounded-t-2xl shadow-2xl
          ${isDark ? 'bg-neutral-900' : 'bg-white'}
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        {/* Header with cell address and confirm/cancel */}
        <div
          className={`
            flex items-center justify-between px-4 py-3
            border-b
            ${isDark ? 'border-neutral-700' : 'border-neutral-200'}
          `}
        >
          <button
            type="button"
            onClick={handleCancel}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
              ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'}
            `}
          >
            <X size={16} />
            Cancel
          </button>

          <span
            className={`
              px-3 py-1 rounded-md text-sm font-mono font-semibold
              ${isDark ? 'bg-neutral-800 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}
            `}
          >
            {cellAddress}
          </span>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Check size={16} />
            Done
          </button>
        </div>

        {/* Text input area */}
        <div className="px-4 py-3">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter value or formula..."
            rows={3}
            className={`
              w-full px-3 py-2.5 rounded-lg text-base
              border outline-none resize-none
              transition-colors
              ${
                isDark
                  ? 'bg-neutral-800 border-neutral-600 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-emerald-500'
              }
            `}
            style={{ fontSize: '16px' }} // Prevent iOS auto-zoom
            data-testid="mobile-cell-input"
          />
        </div>

        {/* Quick insert bar */}
        <div
          className={`
            flex items-center gap-2 px-4 pb-3
          `}
        >
          {quickInserts.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => handleQuickInsert(item.insert)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                ${
                  isDark
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 active:bg-neutral-600'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileCellEditor;
