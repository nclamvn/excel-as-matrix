// =============================================================================
// PROACTIVE PANEL — Main panel for AI suggestions
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { proactiveEngine } from '../../proactive';
import type {
  ProactiveSuggestion,
  SuggestionType,
  ProactiveEvent,
} from '../../proactive/types';
import { SuggestionCard } from './SuggestionCard';
import { QuickActions } from './QuickActions';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface ProactivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

// -----------------------------------------------------------------------------
// Proactive Panel Component
// -----------------------------------------------------------------------------

export const ProactivePanel: React.FC<ProactivePanelProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [activeFilter, setActiveFilter] = useState<SuggestionType | 'all'>('all');
  const [isScanning, setIsScanning] = useState(false);

  // Load suggestions
  const loadSuggestions = useCallback(() => {
    const all = proactiveEngine.getSuggestions();
    setSuggestions(all);
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = proactiveEngine.on((event: ProactiveEvent) => {
      switch (event.type) {
        case 'scan_started':
          setIsScanning(true);
          break;
        case 'scan_completed':
          setIsScanning(false);
          loadSuggestions();
          break;
        case 'suggestion_added':
        case 'suggestion_dismissed':
        case 'action_executed':
          loadSuggestions();
          break;
      }
    });

    loadSuggestions();

    return unsubscribe;
  }, [loadSuggestions]);

  // Handle action execution
  const handleAction = useCallback(async (suggestionId: string, actionId: string) => {
    await proactiveEngine.executeAction(suggestionId, actionId);
    loadSuggestions();
  }, [loadSuggestions]);

  // Handle dismiss
  const handleDismiss = useCallback((suggestionId: string) => {
    proactiveEngine.dismissSuggestion(suggestionId);
    loadSuggestions();
  }, [loadSuggestions]);

  // Filter suggestions
  const filteredSuggestions = activeFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.type === activeFilter);

  // Count by type
  const counts = {
    all: suggestions.length,
    issue: suggestions.filter(s => s.type === 'issue').length,
    insight: suggestions.filter(s => s.type === 'insight').length,
    optimization: suggestions.filter(s => s.type === 'optimization').length,
    pattern: suggestions.filter(s => s.type === 'pattern').length,
  };

  if (!isOpen) return null;

  return (
    <div className="proactive-panel">
      {/* Header */}
      <div className="proactive-panel__header">
        <div className="proactive-panel__title">
          <SparklesIcon />
          <span>AI Assistant</span>
          {suggestions.length > 0 && (
            <span className="proactive-panel__badge">{suggestions.length}</span>
          )}
        </div>
        <div className="proactive-panel__actions">
          {onOpenSettings && (
            <button
              className="proactive-panel__action"
              onClick={onOpenSettings}
              title="Settings"
            >
              <SettingsIcon />
            </button>
          )}
          <button
            className="proactive-panel__action"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="proactive-panel__filters">
        <FilterButton
          label="All"
          count={counts.all}
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <FilterButton
          label="Issues"
          count={counts.issue}
          active={activeFilter === 'issue'}
          onClick={() => setActiveFilter('issue')}
          icon={<IssueIcon />}
        />
        <FilterButton
          label="Insights"
          count={counts.insight}
          active={activeFilter === 'insight'}
          onClick={() => setActiveFilter('insight')}
          icon={<InsightIcon />}
        />
        <FilterButton
          label="Optimize"
          count={counts.optimization}
          active={activeFilter === 'optimization'}
          onClick={() => setActiveFilter('optimization')}
          icon={<OptimizeIcon />}
        />
      </div>

      {/* Quick Actions */}
      {counts.issue > 0 && activeFilter === 'all' && (
        <QuickActions
          issues={suggestions.filter(s => s.type === 'issue')}
          onAction={handleAction}
        />
      )}

      {/* Suggestions List */}
      <div className="proactive-panel__content">
        {isScanning && (
          <div className="proactive-panel__scanning">
            <div className="proactive-panel__spinner" />
            <span>Analyzing your data...</span>
          </div>
        )}

        {!isScanning && filteredSuggestions.length === 0 && (
          <div className="proactive-panel__empty">
            <EmptyIcon />
            <p>No suggestions yet</p>
            <span>AI is monitoring your data for issues and insights</span>
          </div>
        )}

        {filteredSuggestions.map(suggestion => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAction={handleAction}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="proactive-panel__footer">
        <span className="proactive-panel__status">
          {isScanning ? 'Scanning...' : 'AI monitoring active'}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Filter Button Component
// -----------------------------------------------------------------------------

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  count,
  active,
  onClick,
  icon,
}) => (
  <button
    className={`proactive-panel__filter ${active ? 'proactive-panel__filter--active' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && <span className="proactive-panel__filter-count">{count}</span>}
  </button>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    <path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IssueIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const InsightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const OptimizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

export default ProactivePanel;
