// =============================================================================
// SOURCE ATTRIBUTION — Show AI response sources (Blueprint §5.4.6)
// =============================================================================

import React, { useState } from 'react';
import type {
  SourceInfo,
  SourceAttribution as SourceAttributionType,
  SourceType,
} from '../../ai/trust/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface SourceAttributionProps {
  info: SourceInfo;
  onSourceClick?: (source: SourceAttributionType) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const SourceAttribution: React.FC<SourceAttributionProps> = ({
  info,
  onSourceClick,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (info.sources.length === 0) {
    return null;
  }

  return (
    <div className={`source-attribution ${className}`}>
      <button
        className="source-attribution__trigger"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="source-attribution__icon">
          {info.groundedInData ? '🔗' : '💡'}
        </span>
        <span className="source-attribution__count">
          {info.citationCount} source{info.citationCount !== 1 ? 's' : ''}
        </span>
        {info.groundedInData && (
          <span className="source-attribution__grounded">
            Grounded in data
          </span>
        )}
        <span className="source-attribution__arrow">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="source-attribution__panel">
          {info.primarySource && (
            <div className="source-attribution__primary">
              <span className="source-attribution__primary-label">
                Primary Source
              </span>
              <SourceItem
                source={info.primarySource}
                onClick={onSourceClick}
                isPrimary
              />
            </div>
          )}

          <div className="source-attribution__list">
            {info.sources
              .filter((s) => s.id !== info.primarySource?.id)
              .map((source) => (
                <SourceItem
                  key={source.id}
                  source={source}
                  onClick={onSourceClick}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Source Item
// -----------------------------------------------------------------------------

interface SourceItemProps {
  source: SourceAttributionType;
  onClick?: (source: SourceAttributionType) => void;
  isPrimary?: boolean;
}

const SourceItem: React.FC<SourceItemProps> = ({
  source,
  onClick,
  isPrimary = false,
}) => {
  const typeInfo = getSourceTypeInfo(source.type);
  const confidenceColor = getConfidenceColor(source.confidence);

  return (
    <button
      className={`source-item ${isPrimary ? 'source-item--primary' : ''}`}
      onClick={() => onClick?.(source)}
    >
      <div className="source-item__header">
        <span className="source-item__icon">{typeInfo.icon}</span>
        <span className="source-item__type">{typeInfo.label}</span>
        <span
          className="source-item__confidence"
          style={{ color: confidenceColor }}
        >
          {Math.round(source.confidence * 100)}%
        </span>
      </div>

      <div className="source-item__reference">{source.reference}</div>

      {source.snippet && (
        <div className="source-item__snippet">
          <code>{source.snippet}</code>
        </div>
      )}

      <div className="source-item__relevance">{source.relevance}</div>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Inline Source Citation
// -----------------------------------------------------------------------------

interface SourceCitationProps {
  source: SourceAttributionType;
  onClick?: () => void;
  className?: string;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({
  source,
  onClick,
  className = '',
}) => {
  const typeInfo = getSourceTypeInfo(source.type);

  return (
    <button
      className={`source-citation ${className}`}
      onClick={onClick}
      title={source.relevance}
    >
      <span className="source-citation__icon">{typeInfo.icon}</span>
      <span className="source-citation__ref">{source.reference}</span>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Sources Summary Bar
// -----------------------------------------------------------------------------

interface SourcesSummaryProps {
  info: SourceInfo;
  onClick?: () => void;
  className?: string;
}

export const SourcesSummary: React.FC<SourcesSummaryProps> = ({
  info,
  onClick,
  className = '',
}) => {
  if (info.sources.length === 0) {
    return (
      <div className={`sources-summary sources-summary--empty ${className}`}>
        <span className="sources-summary__icon">💭</span>
        <span className="sources-summary__text">No direct sources</span>
      </div>
    );
  }

  // Group by type
  const byType = groupSourcesByType(info.sources);

  return (
    <button
      className={`sources-summary ${className}`}
      onClick={onClick}
    >
      <span className="sources-summary__icon">
        {info.groundedInData ? '🔗' : '💡'}
      </span>
      <span className="sources-summary__text">
        {info.groundedInData ? 'Grounded in:' : 'Based on:'}
      </span>
      <div className="sources-summary__types">
        {Array.from(byType.entries()).map(([type, sources]) => {
          const typeInfo = getSourceTypeInfo(type);
          return (
            <span key={type} className="sources-summary__type">
              <span className="sources-summary__type-icon">{typeInfo.icon}</span>
              <span className="sources-summary__type-count">
                {sources.length}
              </span>
            </span>
          );
        })}
      </div>
    </button>
  );
};

// -----------------------------------------------------------------------------
// Cell Reference Source
// -----------------------------------------------------------------------------

interface CellSourceProps {
  cellRef: string;
  value?: string;
  confidence: number;
  onClick?: () => void;
  className?: string;
}

export const CellSource: React.FC<CellSourceProps> = ({
  cellRef,
  value,
  confidence,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`cell-source ${className}`}
      onClick={onClick}
      title={`Cell ${cellRef}: ${value || 'empty'}`}
    >
      <span className="cell-source__ref">{cellRef}</span>
      {value && <span className="cell-source__value">{value}</span>}
      <span
        className="cell-source__confidence"
        style={{
          opacity: confidence,
          backgroundColor: getConfidenceColor(confidence),
        }}
      />
    </button>
  );
};

// -----------------------------------------------------------------------------
// Source Type List
// -----------------------------------------------------------------------------

interface SourceTypeListProps {
  sources: SourceAttributionType[];
  onSourceClick?: (source: SourceAttributionType) => void;
  className?: string;
}

export const SourceTypeList: React.FC<SourceTypeListProps> = ({
  sources,
  onSourceClick,
  className = '',
}) => {
  const grouped = groupSourcesByType(sources);

  return (
    <div className={`source-type-list ${className}`}>
      {Array.from(grouped.entries()).map(([type, typeSources]) => {
        const typeInfo = getSourceTypeInfo(type);
        return (
          <div key={type} className="source-type-list__group">
            <div className="source-type-list__header">
              <span className="source-type-list__icon">{typeInfo.icon}</span>
              <span className="source-type-list__label">{typeInfo.label}</span>
              <span className="source-type-list__count">
                {typeSources.length}
              </span>
            </div>
            <div className="source-type-list__items">
              {typeSources.map((source) => (
                <SourceItem
                  key={source.id}
                  source={source}
                  onClick={onSourceClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface SourceTypeInfo {
  icon: string;
  label: string;
  description: string;
}

function getSourceTypeInfo(type: SourceType): SourceTypeInfo {
  switch (type) {
    case 'cell_reference':
      return {
        icon: '📍',
        label: 'Cell',
        description: 'Direct cell reference',
      };
    case 'range_reference':
      return {
        icon: '📊',
        label: 'Range',
        description: 'Range of cells',
      };
    case 'formula_analysis':
      return {
        icon: '🔢',
        label: 'Formula',
        description: 'Formula analysis',
      };
    case 'pattern_detection':
      return {
        icon: '🔍',
        label: 'Pattern',
        description: 'Detected pattern',
      };
    case 'user_history':
      return {
        icon: '📝',
        label: 'History',
        description: 'Previous interactions',
      };
    case 'domain_knowledge':
      return {
        icon: '🧠',
        label: 'Knowledge',
        description: 'Built-in knowledge',
      };
    case 'external_data':
      return {
        icon: '🌐',
        label: 'External',
        description: 'External reference',
      };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#22c55e'; // green
  if (confidence >= 0.6) return '#84cc16'; // lime
  if (confidence >= 0.4) return '#eab308'; // yellow
  return '#f97316'; // orange
}

function groupSourcesByType(
  sources: SourceAttributionType[]
): Map<SourceType, SourceAttributionType[]> {
  const grouped = new Map<SourceType, SourceAttributionType[]>();

  for (const source of sources) {
    const existing = grouped.get(source.type) || [];
    existing.push(source);
    grouped.set(source.type, existing);
  }

  return grouped;
}

export default SourceAttribution;
