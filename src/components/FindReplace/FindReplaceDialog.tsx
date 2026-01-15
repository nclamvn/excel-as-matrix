import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFindStore } from '../../stores/findStore';
import { useShortcut } from '../../shortcuts/useShortcut';

export const FindReplaceDialog: React.FC = () => {
  const {
    isOpen,
    isReplaceMode,
    searchText,
    replaceText,
    options,
    matches,
    currentMatchIndex,
    isSearching,
    close,
    setSearchText,
    setReplaceText,
    setOptions,
    search,
    findNext,
    findPrevious,
    replaceCurrent,
    replaceAll,
  } = useFindStore();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  useShortcut('SHOW_FIND', () => useFindStore.getState().open(false), []);
  useShortcut('SHOW_REPLACE', () => useFindStore.getState().open(true), []);
  useShortcut('FIND_NEXT', findNext, [findNext]);
  useShortcut('FIND_PREV', findPrevious, [findPrevious]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          findPrevious();
        } else {
          if (matches.length === 0) {
            search();
          } else {
            findNext();
          }
        }
      } else if (e.key === 'Escape') {
        close();
      }
    },
    [search, findNext, findPrevious, close, matches.length]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-50 bg-white rounded-lg shadow-xl border w-96">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {isReplaceMode ? 'Find and Replace' : 'Find'}
          </span>
        </div>
        <button onClick={close} className="p-1 hover:bg-gray-200 rounded">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {matches.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {currentMatchIndex + 1} of {matches.length}
              </span>
            )}
          </div>
          <button
            onClick={() => search()}
            disabled={isSearching || !searchText.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? '...' : 'Find'}
          </button>
        </div>

        {isReplaceMode && (
          <div className="flex gap-2">
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Replace with..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={findPrevious}
              disabled={matches.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Find previous (Shift+F3)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={findNext}
              disabled={matches.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Find next (F3)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {isReplaceMode && (
            <div className="flex gap-2">
              <button
                onClick={replaceCurrent}
                disabled={currentMatchIndex < 0}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                disabled={matches.length === 0}
                className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Replace All
              </button>
            </div>
          )}

          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 rounded ${showOptions ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {showOptions && (
          <div className="pt-3 border-t space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.matchCase}
                onChange={(e) => setOptions({ matchCase: e.target.checked })}
                className="rounded"
              />
              Match case
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.matchWholeCell}
                onChange={(e) => setOptions({ matchWholeCell: e.target.checked })}
                className="rounded"
              />
              Match entire cell contents
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={options.useRegex}
                onChange={(e) => setOptions({ useRegex: e.target.checked })}
                className="rounded"
              />
              Use regular expressions
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span>Search in:</span>
              <select
                value={options.searchIn}
                onChange={(e) => setOptions({ searchIn: e.target.value as 'values' | 'formulas' | 'both' })}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="values">Values</option>
                <option value="formulas">Formulas</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Scope:</span>
              <select
                value={options.searchScope}
                onChange={(e) => setOptions({ searchScope: e.target.value as 'sheet' | 'workbook' })}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="sheet">Current Sheet</option>
                <option value="workbook">Entire Workbook</option>
              </select>
            </div>
          </div>
        )}

        {searchText && matches.length === 0 && !isSearching && (
          <p className="text-sm text-gray-500 text-center py-2">No matches found</p>
        )}
      </div>
    </div>
  );
};

export default FindReplaceDialog;
