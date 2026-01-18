// ============================================================
// FLOATING AI BUTTON — Context-Aware AI Quick Access
// ============================================================
//
// A floating button that appears near the user's selection:
// - Shows when selection changes with data
// - Provides quick AI actions based on context
// - Expandable menu with smart suggestions
// - Non-intrusive, dismissable
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  HelpCircle,
  Wrench,
  Lightbulb,
  FileText,
  Palette,
  BarChart2,
  Search,
  Eraser,
  Calculator,
  AlertTriangle,
  LineChart,
  Calendar,
  Type,
  Tags,
  CheckCircle,
  Grid3X3,
  Table2,
} from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useAIStore } from '../../stores/aiStore';
import {
  analyzeSelectionContext,
  generateContextualSuggestions,
  getApplicableQuickActions,
  type AISuggestion,
  type ContextAnalysis,
} from '../../ai/contextual/AIContextTriggers';

// Icon mapping - use any to avoid LucideIcon type issues
const ICON_MAP: Record<string, React.FC<{ size?: number | string }>> = {
  Sparkles: Sparkles as React.FC<{ size?: number | string }>,
  HelpCircle: HelpCircle as React.FC<{ size?: number | string }>,
  Wrench: Wrench as React.FC<{ size?: number | string }>,
  Lightbulb: Lightbulb as React.FC<{ size?: number | string }>,
  FileText: FileText as React.FC<{ size?: number | string }>,
  Palette: Palette as React.FC<{ size?: number | string }>,
  BarChart2: BarChart2 as React.FC<{ size?: number | string }>,
  BarChart3: BarChart2 as React.FC<{ size?: number | string }>,
  Search: Search as React.FC<{ size?: number | string }>,
  Eraser: Eraser as React.FC<{ size?: number | string }>,
  Calculator: Calculator as React.FC<{ size?: number | string }>,
  AlertTriangle: AlertTriangle as React.FC<{ size?: number | string }>,
  LineChart: LineChart as React.FC<{ size?: number | string }>,
  Calendar: Calendar as React.FC<{ size?: number | string }>,
  Type: Type as React.FC<{ size?: number | string }>,
  Tags: Tags as React.FC<{ size?: number | string }>,
  CheckCircle: CheckCircle as React.FC<{ size?: number | string }>,
  Grid3X3: Grid3X3 as React.FC<{ size?: number | string }>,
  Table2: Table2 as React.FC<{ size?: number | string }>,
};

interface FloatingAIButtonProps {
  gridRef: React.RefObject<HTMLDivElement>;
  cellWidth?: number;
  cellHeight?: number;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  gridRef,
  cellWidth = 100,
  cellHeight = 24,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [context, setContext] = useState<ContextAnalysis | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { selectionRange } = useSelectionStore();
  const { activeSheetId } = useWorkbookStore();
  const { openPanel, setCurrentInput } = useAIStore();

  // Analyze context when selection changes
  useEffect(() => {
    if (!selectionRange || !activeSheetId) {
      setIsVisible(false);
      return;
    }

    // Convert CellRange to the format expected by context triggers
    const range = {
      startRow: selectionRange.start.row,
      startCol: selectionRange.start.col,
      endRow: selectionRange.end.row,
      endCol: selectionRange.end.col,
    };

    // Debounce to avoid too frequent updates
    const timer = setTimeout(() => {
      const ctx = analyzeSelectionContext(range, activeSheetId);
      setContext(ctx);

      if (ctx && (ctx.hasData || ctx.hasFormulas || ctx.hasErrors)) {
        const newSuggestions = generateContextualSuggestions(ctx, range);
        setSuggestions(newSuggestions);
        setIsVisible(true);
        setIsExpanded(false);

        // Calculate position based on selection
        if (gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect();
          const endCol = range.endCol;
          const startRow = range.startRow;

          // Position to the right of selection
          const x = Math.min(
            (endCol + 1) * cellWidth + 8,
            gridRect.width - 250 // Keep within grid bounds
          );
          const y = startRow * cellHeight;

          setPosition({ x, y });
        }
      } else {
        // Hide after a delay if no relevant context
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 500);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [selectionRange, activeSheetId, gridRef, cellWidth, cellHeight]);

  // Get quick actions based on context
  const quickActions = useMemo(() => {
    return getApplicableQuickActions(context).slice(0, 4);
  }, [context]);

  // Handle quick action click
  const handleQuickAction = useCallback((prompt: string) => {
    openPanel();
    setCurrentInput(prompt);
    // Optionally auto-send
    // sendMessage(prompt);
    setIsExpanded(false);
  }, [openPanel, setCurrentInput]);

  // Handle suggestion click
  const handleSuggestion = useCallback((suggestion: AISuggestion) => {
    openPanel();
    setCurrentInput(suggestion.prompt);
    setIsExpanded(false);
  }, [openPanel, setCurrentInput]);

  // Handle main button click
  const handleMainClick = useCallback(() => {
    if (suggestions.length > 0 || quickActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      openPanel();
    }
  }, [suggestions, quickActions, isExpanded, openPanel]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  if (!isVisible) return null;

  return (
    <div
      ref={buttonRef}
      className="floating-ai-button"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 100,
      }}
    >
      {/* Main FAB Button */}
      <button
        className={`fab-main ${isExpanded ? 'expanded' : ''} ${suggestions.some(s => s.priority === 'high') ? 'has-priority' : ''}`}
        onClick={handleMainClick}
        title="AI Assistant"
      >
        <Sparkles size={16} />
        {suggestions.length > 0 && !isExpanded && (
          <span className="fab-badge">{suggestions.length}</span>
        )}
      </button>

      {/* Expanded Menu */}
      {isExpanded && (
        <div className="fab-menu">
          {/* Header */}
          <div className="fab-menu-header">
            <Sparkles size={14} />
            <span>AI Suggestions</span>
            <button className="fab-close" onClick={() => setIsExpanded(false)}>
              <X size={14} />
            </button>
          </div>

          {/* Context-aware suggestions */}
          {suggestions.length > 0 && (
            <div className="fab-section">
              <div className="fab-section-title">Based on your selection</div>
              {suggestions.slice(0, 3).map(suggestion => {
                const Icon = ICON_MAP[suggestion.icon] || Sparkles;
                return (
                  <button
                    key={suggestion.id}
                    className={`fab-suggestion ${suggestion.priority}`}
                    onClick={() => handleSuggestion(suggestion)}
                  >
                    <div className="fab-suggestion-icon">
                      <Icon size={14} />
                    </div>
                    <div className="fab-suggestion-content">
                      <div className="fab-suggestion-title">{suggestion.title}</div>
                      <div className="fab-suggestion-desc">{suggestion.description}</div>
                    </div>
                    <ChevronRight size={14} className="fab-arrow" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="fab-section">
            <div className="fab-section-title">Quick Actions</div>
            <div className="fab-quick-actions">
              {quickActions.map(action => {
                const Icon = ICON_MAP[action.icon] || Sparkles;
                return (
                  <button
                    key={action.id}
                    className="fab-quick-action"
                    onClick={() => handleQuickAction(action.prompt)}
                    title={action.label}
                  >
                    <Icon size={14} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open full AI panel */}
          <button className="fab-open-panel" onClick={() => { openPanel(); setIsExpanded(false); }}>
            <Sparkles size={14} />
            Open AI Copilot
            <span className="fab-shortcut">⌘J</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingAIButton;
