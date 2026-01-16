// =============================================================================
// OPTIMIZATION CARD — Display for formula optimizations
// =============================================================================

import React, { useState } from 'react';
import type { ProactiveSuggestion } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface OptimizationCardProps {
  optimization: ProactiveSuggestion;
  onAction: (suggestionId: string, actionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

// -----------------------------------------------------------------------------
// Optimization Card Component
// -----------------------------------------------------------------------------

export const OptimizationCard: React.FC<OptimizationCardProps> = ({
  optimization,
  onAction,
  onDismiss,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const metadata = optimization.metadata as OptimizationMetadata | undefined;
  const categoryConfig = getCategoryConfig(optimization.category);

  return (
    <div className="optimization-card">
      <div className="optimization-card__header">
        <div className="optimization-card__icon" style={{ backgroundColor: categoryConfig.bgColor }}>
          {categoryConfig.icon}
        </div>
        <div className="optimization-card__title-area">
          <div className="optimization-card__category">{categoryConfig.label}</div>
          <div className="optimization-card__impact">
            <SpeedIcon />
            <span>{metadata?.speedImprovement || 'Performance boost'}</span>
          </div>
        </div>
        <button
          className="optimization-card__dismiss"
          onClick={() => onDismiss(optimization.id)}
          title="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="optimization-card__content">
        <h4 className="optimization-card__title">{optimization.title}</h4>
        <p className="optimization-card__description">{optimization.description}</p>

        {/* Formula comparison */}
        {metadata?.original && metadata?.optimized && (
          <div className="optimization-card__comparison">
            <div className="optimization-card__formula optimization-card__formula--before">
              <span className="optimization-card__formula-label">Current</span>
              <code className="optimization-card__formula-code">{metadata.original}</code>
            </div>
            <div className="optimization-card__arrow">
              <ArrowRightIcon />
            </div>
            <div className="optimization-card__formula optimization-card__formula--after">
              <span className="optimization-card__formula-label">Optimized</span>
              <code className="optimization-card__formula-code">{metadata.optimized}</code>
            </div>
          </div>
        )}

        {/* Affected cells */}
        {optimization.impact && (
          <div className="optimization-card__affected">
            <CellIcon />
            <span>
              {optimization.impact.cellCount} formula{optimization.impact.cellCount !== 1 ? 's' : ''} can be optimized
            </span>
          </div>
        )}

        {/* Preview toggle */}
        {metadata?.previewData && (
          <button
            className="optimization-card__preview-toggle"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOffIcon /> : <EyeIcon />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}

        {/* Preview area */}
        {showPreview && metadata?.previewData && (
          <div className="optimization-card__preview">
            <table className="optimization-card__preview-table">
              <thead>
                <tr>
                  <th>Cell</th>
                  <th>Current</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {metadata.previewData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td>{row.cell}</td>
                    <td>{row.current}</td>
                    <td>{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {metadata.previewData.length > 5 && (
              <div className="optimization-card__preview-more">
                +{metadata.previewData.length - 5} more
              </div>
            )}
          </div>
        )}

        {/* Confidence */}
        <div className="optimization-card__confidence">
          <div
            className="optimization-card__confidence-bar"
            style={{ width: `${optimization.confidence * 100}%` }}
          />
          <span className="optimization-card__confidence-text">
            {Math.round(optimization.confidence * 100)}% safe
          </span>
        </div>
      </div>

      <div className="optimization-card__actions">
        {optimization.actions.map(action => (
          <button
            key={action.id}
            className={`optimization-card__action optimization-card__action--${action.type}`}
            onClick={() => onAction(optimization.id, action.id)}
          >
            {action.type === 'primary' && <ZapIcon />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface OptimizationMetadata {
  original?: string;
  optimized?: string;
  speedImprovement?: string;
  previewData?: Array<{
    cell: string;
    current: string;
    after: string;
  }>;
}

function getCategoryConfig(category?: string) {
  const configs: Record<string, { label: string; icon: React.ReactNode; bgColor: string }> = {
    vlookup_to_index: {
      label: 'VLOOKUP Optimization',
      icon: <SearchIcon />,
      bgColor: '#dbeafe',
    },
    nested_if: {
      label: 'Nested IF Simplification',
      icon: <GitBranchIcon />,
      bgColor: '#dcfce7',
    },
    sum_if: {
      label: 'SUMIF Conversion',
      icon: <PlusCircleIcon />,
      bgColor: '#fef3c7',
    },
    volatile_functions: {
      label: 'Volatile Function',
      icon: <AlertTriangleIcon />,
      bgColor: '#fee2e2',
    },
    array_formula: {
      label: 'Array Formula',
      icon: <GridIcon />,
      bgColor: '#f3e8ff',
    },
    complexity: {
      label: 'Formula Complexity',
      icon: <LayersIcon />,
      bgColor: '#fce7f3',
    },
  };
  return configs[category || ''] || { label: 'Optimization', icon: <ZapIcon />, bgColor: '#f3f4f6' };
}

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpeedIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CellIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ZapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const GitBranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const PlusCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const LayersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export default OptimizationCard;
