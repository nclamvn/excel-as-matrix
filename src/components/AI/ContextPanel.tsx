// =============================================================================
// CONTEXT PANEL — Current Spreadsheet Context (Blueprint §5.3)
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  Eye,
  MousePointer,
  FileSpreadsheet,
  Hash,
  Cpu,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { getAIRuntime } from '../../ai/AIRuntime';
import type { AssembledContext } from '../../ai/types';
import { loggers } from '@/utils/logger';

// -----------------------------------------------------------------------------
// Helper to convert column number to letter
// -----------------------------------------------------------------------------

function colToLetter(col: number): string {
  let result = '';
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

// -----------------------------------------------------------------------------
// Context Section Component
// -----------------------------------------------------------------------------

interface ContextSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}

const ContextSection: React.FC<ContextSectionProps> = ({
  title,
  icon,
  children,
  collapsible = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`ai-context-section ${collapsed ? 'collapsed' : ''}`}>
      <div
        className="ai-context-section-header"
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        style={collapsible ? { cursor: 'pointer' } : undefined}
      >
        {icon}
        <span>{title}</span>
        {collapsible && (
          <span className="collapse-indicator">{collapsed ? '▶' : '▼'}</span>
        )}
      </div>
      {!collapsed && <div className="ai-context-section-content">{children}</div>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Token Budget Bar Component
// -----------------------------------------------------------------------------

interface TokenBudgetBarProps {
  used: number;
  total: number;
  label: string;
}

const TokenBudgetBar: React.FC<TokenBudgetBarProps> = ({ used, total, label }) => {
  const percentage = Math.min((used / total) * 100, 100);
  const colorClass =
    percentage > 80 ? 'high' : percentage > 50 ? 'medium' : 'low';

  return (
    <div className="token-budget-bar">
      <div className="token-budget-label">
        <span>{label}</span>
        <span className="token-budget-value">
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="token-budget-track">
        <div
          className={`token-budget-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const ContextPanel: React.FC = () => {
  // Get real-time data from stores
  const activeSheetId = useWorkbookStore((state) => state.activeSheetId);
  const sheets = useWorkbookStore((state) => state.sheets);
  const selectedCell = useSelectionStore((state) => state.selectedCell);
  const selectionRange = useSelectionStore((state) => state.selectionRange);

  const [assembledContext, setAssembledContext] = useState<AssembledContext | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeSheet = activeSheetId ? sheets[activeSheetId] : null;

  // Build selection range string
  let selectionRangeStr = 'None';
  let selectionCellCount = 0;

  if (selectedCell) {
    if (selectionRange) {
      const startCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      const endCol = Math.max(selectionRange.start.col, selectionRange.end.col);
      const startRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const endRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      selectionRangeStr = `${colToLetter(startCol)}${startRow + 1}:${colToLetter(endCol)}${endRow + 1}`;
      selectionCellCount = (endRow - startRow + 1) * (endCol - startCol + 1);
    } else {
      selectionRangeStr = `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`;
      selectionCellCount = 1;
    }
  }

  // Calculate sheet stats
  const cellCount = activeSheet ? Object.keys(activeSheet.cells).length : 0;
  const formulaCount = activeSheet
    ? Object.values(activeSheet.cells).filter((c) => c.formula).length
    : 0;

  // Get last assembled context on mount
  useEffect(() => {
    const runtime = getAIRuntime();
    const lastContext = runtime.getLastAssembledContext();
    if (lastContext) {
      setAssembledContext(lastContext);
    }
  }, []);

  // Refresh context
  const handleRefreshContext = async () => {
    setIsRefreshing(true);
    try {
      const runtime = getAIRuntime();
      const context = await runtime.assembleContext('Show current context');
      setAssembledContext(context);
    } catch (error) {
      loggers.ui.error('Failed to refresh context:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="ai-context-panel">
      <div className="ai-context-header">
        <Eye size={18} />
        <h3>Current Context</h3>
        <button
          className="ai-context-refresh"
          onClick={handleRefreshContext}
          disabled={isRefreshing}
          title="Refresh context"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
        </button>
      </div>

      <div className="ai-context-info">
        <p>
          This is what the AI Copilot knows about your current spreadsheet state.
        </p>
      </div>

      {/* Selection Context */}
      <ContextSection title="Selection" icon={<MousePointer size={14} />}>
        <div className="ai-context-grid">
          <div className="ai-context-item">
            <span className="label">Range</span>
            <span className="value ai-context-range">[{selectionRangeStr}]</span>
          </div>
          <div className="ai-context-item">
            <span className="label">Cells</span>
            <span className="value">{selectionCellCount}</span>
          </div>
        </div>
      </ContextSection>

      {/* Sheet Context */}
      <ContextSection title="Active Sheet" icon={<FileSpreadsheet size={14} />}>
        <div className="ai-context-grid">
          <div className="ai-context-item">
            <span className="label">Name</span>
            <span className="value">{activeSheet?.name || 'Sheet1'}</span>
          </div>
          <div className="ai-context-item">
            <span className="label">ID</span>
            <span className="value ai-context-id">
              {activeSheetId?.slice(0, 8) || 'N/A'}
            </span>
          </div>
        </div>
      </ContextSection>

      {/* Stats Context */}
      <ContextSection title="Statistics" icon={<Hash size={14} />}>
        <div className="ai-context-grid">
          <div className="ai-context-item">
            <span className="label">Used Cells</span>
            <span className="value">{cellCount}</span>
          </div>
          <div className="ai-context-item">
            <span className="label">Formulas</span>
            <span className="value">{formulaCount}</span>
          </div>
        </div>
      </ContextSection>

      {/* Token Budget (Blueprint §5.3) */}
      <ContextSection title="Token Budget" icon={<Cpu size={14} />} collapsible>
        {assembledContext ? (
          <div className="ai-context-tokens">
            <TokenBudgetBar
              used={assembledContext.metadata.totalTokens}
              total={assembledContext.metadata.totalTokens + assembledContext.metadata.budgetRemaining}
              label="Total"
            />
            <TokenBudgetBar
              used={assembledContext.directData.tokensUsed}
              total={20000}
              label="Direct Data"
            />
            <TokenBudgetBar
              used={assembledContext.dependencyContext.tokensUsed}
              total={17500}
              label="Dependencies"
            />
            <TokenBudgetBar
              used={assembledContext.schemaContext.tokensUsed}
              total={7500}
              label="Schema"
            />
            <TokenBudgetBar
              used={assembledContext.eventContext.tokensUsed}
              total={5000}
              label="Events"
            />
          </div>
        ) : (
          <p className="ai-context-empty">
            No context assembled yet. Send a message to the AI to see token usage.
          </p>
        )}
      </ContextSection>

      {/* Assembly Stats */}
      {assembledContext && (
        <ContextSection title="Assembly Stats" icon={<Activity size={14} />} collapsible>
          <div className="ai-context-grid">
            <div className="ai-context-item">
              <span className="label">Direct Ranges</span>
              <span className="value">{assembledContext.directData.ranges.length}</span>
            </div>
            <div className="ai-context-item">
              <span className="label">Direct Cells</span>
              <span className="value">{assembledContext.directData.totalCells}</span>
            </div>
            <div className="ai-context-item">
              <span className="label">Upstream Deps</span>
              <span className="value">{assembledContext.dependencyContext.upstreamCells.length}</span>
            </div>
            <div className="ai-context-item">
              <span className="label">Downstream Deps</span>
              <span className="value">{assembledContext.dependencyContext.downstreamCells.length}</span>
            </div>
            <div className="ai-context-item">
              <span className="label">Assembly Time</span>
              <span className="value">{assembledContext.metadata.assemblyTime.toFixed(1)}ms</span>
            </div>
            {assembledContext.metadata.truncatedItems.length > 0 && (
              <div className="ai-context-item warning">
                <span className="label">Truncated Items</span>
                <span className="value">{assembledContext.metadata.truncatedItems.length}</span>
              </div>
            )}
          </div>
        </ContextSection>
      )}

      {/* Grounding Notation */}
      <div className="ai-context-grounding">
        <h4>Grounding Notation</h4>
        <p>AI responses will use these markers to cite sources:</p>
        <div className="grounding-legend">
          <div className="grounding-legend-item">
            <span className="grounding-icon direct">📍</span>
            <span>Direct cell read</span>
          </div>
          <div className="grounding-legend-item">
            <span className="grounding-icon computed">🔢</span>
            <span>Computed value</span>
          </div>
          <div className="grounding-legend-item">
            <span className="grounding-icon inferred">🤔</span>
            <span>AI inference</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
