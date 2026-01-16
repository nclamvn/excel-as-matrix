// =============================================================================
// FORMULA HISTORY — Recent formulas component
// =============================================================================

import React, { useState, useCallback } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FormulaHistoryItem {
  id: string;
  formula: string;
  nlInput?: string;
  timestamp: number;
  cellRef?: string;
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaHistoryProps {
  history: FormulaHistoryItem[];
  onSelect: (formula: string) => void;
  onClear?: () => void;
  maxItems?: number;
}

// -----------------------------------------------------------------------------
// Formula History Component
// -----------------------------------------------------------------------------

export const FormulaHistory: React.FC<FormulaHistoryProps> = ({
  history,
  onSelect,
  onClear,
  maxItems = 20,
}) => {
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter history
  const filteredHistory = history.filter((item) => {
    if (!filter) return true;
    const searchLower = filter.toLowerCase();
    return (
      item.formula.toLowerCase().includes(searchLower) ||
      (item.nlInput && item.nlInput.toLowerCase().includes(searchLower))
    );
  });

  // Display items
  const displayItems = showAll
    ? filteredHistory
    : filteredHistory.slice(0, maxItems);

  // Format timestamp
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  if (history.length === 0) {
    return (
      <div className="formula-history formula-history--empty">
        <EmptyHistoryIcon />
        <p>No formula history yet</p>
        <span className="formula-history__hint">
          Your recent formulas will appear here
        </span>
      </div>
    );
  }

  return (
    <div className="formula-history">
      {/* Header */}
      <div className="formula-history__header">
        <h4 className="formula-history__title">
          <HistoryIcon /> Recent Formulas
        </h4>
        {onClear && history.length > 0 && (
          <button
            className="formula-history__clear"
            onClick={onClear}
            title="Clear history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="formula-history__search">
        <SearchIcon />
        <input
          type="text"
          className="formula-history__search-input"
          placeholder="Search formulas..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button
            className="formula-history__search-clear"
            onClick={() => setFilter('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Results count */}
      {filter && (
        <div className="formula-history__count">
          {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* History list */}
      <ul className="formula-history__list">
        {displayItems.map((item) => (
          <li
            key={item.id}
            className="formula-history__item"
            onClick={() => onSelect(item.formula)}
          >
            <div className="formula-history__item-main">
              <code className="formula-history__formula">{item.formula}</code>
              {item.nlInput && (
                <span className="formula-history__nl-input">
                  "{item.nlInput}"
                </span>
              )}
            </div>
            <div className="formula-history__item-meta">
              {item.cellRef && (
                <span className="formula-history__cell-ref">{item.cellRef}</span>
              )}
              <span className="formula-history__time">
                {formatTime(item.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Show more */}
      {filteredHistory.length > maxItems && !showAll && (
        <button
          className="formula-history__show-more"
          onClick={() => setShowAll(true)}
        >
          Show all ({filteredHistory.length - maxItems} more)
        </button>
      )}

      {/* Show less */}
      {showAll && filteredHistory.length > maxItems && (
        <button
          className="formula-history__show-less"
          onClick={() => setShowAll(false)}
        >
          Show less
        </button>
      )}

      {/* No results */}
      {filter && filteredHistory.length === 0 && (
        <div className="formula-history__no-results">
          <p>No formulas match "{filter}"</p>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Hook for managing formula history
// -----------------------------------------------------------------------------

const HISTORY_STORAGE_KEY = 'nlformula-history';
const MAX_HISTORY_SIZE = 100;

export function useFormulaHistory() {
  const [history, setHistory] = useState<FormulaHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((item: Omit<FormulaHistoryItem, 'id' | 'timestamp'>) => {
    setHistory((prev) => {
      // Check if formula already exists
      const existingIndex = prev.findIndex((h) => h.formula === item.formula);

      let newHistory: FormulaHistoryItem[];

      if (existingIndex >= 0) {
        // Move to top and update timestamp
        const existing = prev[existingIndex];
        newHistory = [
          { ...existing, ...item, timestamp: Date.now() },
          ...prev.slice(0, existingIndex),
          ...prev.slice(existingIndex + 1),
        ];
      } else {
        // Add new item
        newHistory = [
          {
            ...item,
            id: `formula-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: Date.now(),
          },
          ...prev,
        ];
      }

      // Limit size
      newHistory = newHistory.slice(0, MAX_HISTORY_SIZE);

      // Persist
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch {
        // Storage full or unavailable
      }

      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch {
        // Ignore
      }
      return newHistory;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const HistoryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EmptyHistoryIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default FormulaHistory;
