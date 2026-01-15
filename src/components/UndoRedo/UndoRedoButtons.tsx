import React, { useRef, useEffect, useState } from 'react';
import { useUndoStore } from '../../stores/undoStore';
import { useShortcut } from '../../shortcuts/useShortcut';

export const UndoRedoButtons: React.FC = () => {
  const { undo, redo, canUndo, canRedo, past, future } = useUndoStore();
  const [showHistory, setShowHistory] = useState(false);

  useShortcut('UNDO', undo, [undo]);
  useShortcut('REDO', redo, [redo]);

  return (
    <div className="flex items-center gap-1 relative">
      <div className="flex">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 hover:bg-gray-100 rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Undo${past.length > 0 ? `: ${past[past.length - 1].description}` : ''} (Ctrl+Z)`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          disabled={!canUndo()}
          className="p-1 hover:bg-gray-100 rounded-r border-l disabled:opacity-50"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <button
        onClick={redo}
        disabled={!canRedo()}
        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Redo${future.length > 0 ? `: ${future[0].description}` : ''} (Ctrl+Y)`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      {showHistory && past.length > 0 && (
        <HistoryDropdown
          actions={past}
          onSelect={(id) => {
            useUndoStore.getState().jumpTo(id);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

interface HistoryDropdownProps {
  actions: Array<{ id: string; description: string; timestamp: number }>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const HistoryDropdown: React.FC<HistoryDropdownProps> = ({
  actions,
  onSelect,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 min-w-64 max-h-64 overflow-y-auto"
    >
      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase border-b">
        Undo History
      </div>
      {actions
        .slice()
        .reverse()
        .map((action) => (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100"
          >
            <span className="truncate">{action.description}</span>
            <span className="text-xs text-gray-400 ml-2">
              {formatTime(action.timestamp)}
            </span>
          </button>
        ))}
    </div>
  );
};

export default UndoRedoButtons;
