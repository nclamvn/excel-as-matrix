// =============================================================================
// DATA CLEANER PANEL — Main panel for data cleaning
// =============================================================================

import React, { useState, useCallback } from 'react';
import { dataCleanerEngine } from '../../datacleaner';
import type {
  CleanerSheetData,
  QualityScore,
  CellChange,
} from '../../datacleaner/types';
import { QualityScoreCard } from './QualityScoreCard';
import { IssuesList } from './IssuesList';
import { CleaningProgress } from './CleaningProgress';
import { loggers } from '@/utils/logger';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface DataCleanerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getData: () => CleanerSheetData | null;
  onApplyChanges?: (changes: CellChange[]) => void;
}

// -----------------------------------------------------------------------------
// Data Cleaner Panel Component
// -----------------------------------------------------------------------------

export const DataCleanerPanel: React.FC<DataCleanerPanelProps> = ({
  isOpen,
  onClose,
  getData,
  onApplyChanges,
}) => {
  const [score, setScore] = useState<QualityScore | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'fixes'>('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<CellChange[]>([]);

  // Analyze data
  const handleAnalyze = useCallback(() => {
    const data = getData();
    if (!data) return;

    setIsAnalyzing(true);

    // Run analysis (simulated async)
    setTimeout(() => {
      const result = dataCleanerEngine.analyze(data);
      setScore(result);
      setIsAnalyzing(false);
    }, 500);
  }, [getData]);

  // Fix all auto-fixable issues
  const handleFixAll = useCallback(async () => {
    const data = getData();
    if (!data) return;

    setIsCleaning(true);
    setCleaningProgress(0);

    try {
      const changes = await dataCleanerEngine.fixAllAutoFixable(data);
      setPendingChanges(changes);
      setCleaningProgress(100);
    } catch (error) {
      loggers.ui.error('Cleaning failed:', error);
    } finally {
      setIsCleaning(false);
    }
  }, [getData]);

  // Apply pending changes
  const handleApplyChanges = useCallback(() => {
    if (pendingChanges.length > 0 && onApplyChanges) {
      onApplyChanges(pendingChanges);
      setPendingChanges([]);
      // Re-analyze after applying
      handleAnalyze();
    }
  }, [pendingChanges, onApplyChanges, handleAnalyze]);

  if (!isOpen) return null;

  return (
    <div className="data-cleaner-panel">
      {/* Header */}
      <div className="data-cleaner-panel__header">
        <div className="data-cleaner-panel__title">
          <CleanerIcon />
          <span>Data Cleaner</span>
        </div>
        <div className="data-cleaner-panel__actions">
          <button
            className="data-cleaner-panel__action data-cleaner-panel__action--primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            className="data-cleaner-panel__action"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Quality Score */}
      {score && (
        <QualityScoreCard score={score} />
      )}

      {/* Stats Bar */}
      {score && (
        <div className="data-cleaner-panel__stats">
          <div className="data-cleaner-panel__stat">
            <span className="data-cleaner-panel__stat-value">{score.summary.totalRows.toLocaleString()}</span>
            <span className="data-cleaner-panel__stat-label">rows</span>
          </div>
          <div className="data-cleaner-panel__stat">
            <span className="data-cleaner-panel__stat-value">{score.summary.totalCells.toLocaleString()}</span>
            <span className="data-cleaner-panel__stat-label">cells</span>
          </div>
          <div className="data-cleaner-panel__stat">
            <span className="data-cleaner-panel__stat-value">{score.summary.totalIssues}</span>
            <span className="data-cleaner-panel__stat-label">issues</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="data-cleaner-panel__tabs">
        <button
          className={`data-cleaner-panel__tab ${activeTab === 'overview' ? 'data-cleaner-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`data-cleaner-panel__tab ${activeTab === 'issues' ? 'data-cleaner-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues {score && score.summary.totalIssues > 0 && (
            <span className="data-cleaner-panel__tab-badge">{score.summary.totalIssues}</span>
          )}
        </button>
        <button
          className={`data-cleaner-panel__tab ${activeTab === 'fixes' ? 'data-cleaner-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('fixes')}
        >
          Fixes {pendingChanges.length > 0 && (
            <span className="data-cleaner-panel__tab-badge">{pendingChanges.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="data-cleaner-panel__content">
        {/* Cleaning Progress */}
        {isCleaning && (
          <CleaningProgress progress={cleaningProgress} />
        )}

        {/* Empty State */}
        {!score && !isAnalyzing && (
          <div className="data-cleaner-panel__empty">
            <EmptyIcon />
            <p>No analysis yet</p>
            <span>Click "Analyze" to check your data quality</span>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="data-cleaner-panel__loading">
            <div className="data-cleaner-panel__spinner" />
            <span>Analyzing your data...</span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && score && !isAnalyzing && (
          <div className="data-cleaner-panel__overview">
            <h4 className="data-cleaner-panel__section-title">Quality by Category</h4>
            <div className="data-cleaner-panel__categories">
              {Object.entries(score.categories).map(([key, cat]) => (
                <CategoryBar
                  key={key}
                  name={formatCategoryName(key)}
                  score={cat.score}
                  grade={cat.grade}
                />
              ))}
            </div>

            {score.summary.autoFixable > 0 && (
              <button
                className="data-cleaner-panel__fix-all"
                onClick={handleFixAll}
                disabled={isCleaning}
              >
                <ZapIcon />
                Fix All Auto-fixable ({score.summary.autoFixable})
              </button>
            )}
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && score && !isAnalyzing && (
          <IssuesList issues={score.issues} />
        )}

        {/* Fixes Tab */}
        {activeTab === 'fixes' && (
          <div className="data-cleaner-panel__fixes">
            {pendingChanges.length === 0 ? (
              <div className="data-cleaner-panel__no-fixes">
                <p>No pending changes</p>
                <span>Run "Fix All" to generate fixes</span>
              </div>
            ) : (
              <>
                <div className="data-cleaner-panel__fixes-summary">
                  <span>{pendingChanges.length} changes ready to apply</span>
                  <button
                    className="data-cleaner-panel__apply-btn"
                    onClick={handleApplyChanges}
                  >
                    Apply Changes
                  </button>
                </div>
                <div className="data-cleaner-panel__fixes-list">
                  {pendingChanges.slice(0, 50).map((change, i) => (
                    <div key={i} className="data-cleaner-panel__fix-item">
                      <span className="data-cleaner-panel__fix-ref">{change.ref}</span>
                      <span className="data-cleaner-panel__fix-type">{change.changeType}</span>
                      <span className="data-cleaner-panel__fix-before">{String(change.before)}</span>
                      <span className="data-cleaner-panel__fix-arrow">→</span>
                      <span className="data-cleaner-panel__fix-after">{String(change.after)}</span>
                    </div>
                  ))}
                  {pendingChanges.length > 50 && (
                    <div className="data-cleaner-panel__fixes-more">
                      +{pendingChanges.length - 50} more changes
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="data-cleaner-panel__footer">
        <span className="data-cleaner-panel__status">
          {score ? `Last analyzed: ${new Date().toLocaleTimeString()}` : 'Ready to analyze'}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Category Bar Component
// -----------------------------------------------------------------------------

interface CategoryBarProps {
  name: string;
  score: number;
  grade: string;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ name, score, grade }) => (
  <div className="category-bar">
    <div className="category-bar__header">
      <span className="category-bar__name">{name}</span>
      <span className={`category-bar__grade category-bar__grade--${grade}`}>{grade}</span>
    </div>
    <div className="category-bar__track">
      <div
        className={`category-bar__fill category-bar__fill--${getScoreColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="category-bar__value">{score}%</span>
  </div>
);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatCategoryName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CleanerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export default DataCleanerPanel;
