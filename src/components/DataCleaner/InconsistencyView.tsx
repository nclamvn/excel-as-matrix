// =============================================================================
// INCONSISTENCY VIEW — Display and fix data inconsistencies
// =============================================================================

import React, { useState } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface InconsistencyGroup {
  id: string;
  column: string;
  canonical: string;
  variants: InconsistentVariant[];
  totalCount: number;
}

interface InconsistentVariant {
  value: string;
  count: number;
  rows: number[];
  isCanonical: boolean;
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface InconsistencyViewProps {
  groups: InconsistencyGroup[];
  onSetCanonical?: (groupId: string, value: string) => void;
  onFixGroup?: (groupId: string) => void;
  onFixAll?: () => void;
}

// -----------------------------------------------------------------------------
// Inconsistency View Component
// -----------------------------------------------------------------------------

export const InconsistencyView: React.FC<InconsistencyViewProps> = ({
  groups,
  onSetCanonical,
  onFixGroup,
  onFixAll,
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = searchTerm
    ? groups.filter(g =>
        g.canonical.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.variants.some(v => v.value.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : groups;

  const totalInconsistencies = groups.reduce(
    (sum, g) => sum + g.variants.filter(v => !v.isCanonical).reduce((s, v) => s + v.count, 0),
    0
  );

  if (groups.length === 0) {
    return (
      <div className="inconsistency-view inconsistency-view--empty">
        <CheckIcon />
        <p>No inconsistencies found</p>
        <span>Your data is consistent</span>
      </div>
    );
  }

  return (
    <div className="inconsistency-view">
      {/* Header */}
      <div className="inconsistency-view__header">
        <div className="inconsistency-view__summary">
          <span className="inconsistency-view__count">{groups.length} groups</span>
          <span className="inconsistency-view__total">{totalInconsistencies} to fix</span>
        </div>
        <div className="inconsistency-view__actions">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="inconsistency-view__search"
          />
          {onFixAll && (
            <button className="inconsistency-view__fix-all" onClick={onFixAll}>
              <ZapIcon />
              Fix All
            </button>
          )}
        </div>
      </div>

      {/* Groups List */}
      <div className="inconsistency-view__groups">
        {filteredGroups.map((group) => (
          <InconsistencyGroupCard
            key={group.id}
            group={group}
            isExpanded={expandedGroup === group.id}
            onToggle={() => setExpandedGroup(
              expandedGroup === group.id ? null : group.id
            )}
            onSetCanonical={onSetCanonical}
            onFix={onFixGroup}
          />
        ))}
      </div>

      {filteredGroups.length === 0 && searchTerm && (
        <div className="inconsistency-view__no-results">
          No groups match "{searchTerm}"
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Inconsistency Group Card Component
// -----------------------------------------------------------------------------

interface InconsistencyGroupCardProps {
  group: InconsistencyGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSetCanonical?: (groupId: string, value: string) => void;
  onFix?: (groupId: string) => void;
}

const InconsistencyGroupCard: React.FC<InconsistencyGroupCardProps> = ({
  group,
  isExpanded,
  onToggle,
  onSetCanonical,
  onFix,
}) => {
  const variantsToFix = group.variants.filter(v => !v.isCanonical);

  return (
    <div className={`inconsistency-group ${isExpanded ? 'inconsistency-group--expanded' : ''}`}>
      {/* Group Header */}
      <div className="inconsistency-group__header" onClick={onToggle}>
        <div className="inconsistency-group__info">
          <span className="inconsistency-group__column">{group.column}</span>
          <span className="inconsistency-group__canonical">
            <TargetIcon />
            {group.canonical}
          </span>
        </div>
        <div className="inconsistency-group__meta">
          <span className="inconsistency-group__variants-count">
            {group.variants.length} variants
          </span>
          <span className="inconsistency-group__affected">
            {group.totalCount} cells
          </span>
        </div>
        <div className="inconsistency-group__actions">
          {onFix && variantsToFix.length > 0 && (
            <button
              className="inconsistency-group__fix-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFix(group.id);
              }}
            >
              Fix
            </button>
          )}
          <ChevronIcon expanded={isExpanded} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="inconsistency-group__content">
          <div className="inconsistency-group__variants-header">
            <span>Value</span>
            <span>Count</span>
            <span>Action</span>
          </div>
          <div className="inconsistency-group__variants">
            {group.variants.map((variant, index) => (
              <div
                key={index}
                className={`inconsistency-variant ${variant.isCanonical ? 'inconsistency-variant--canonical' : ''}`}
              >
                <div className="inconsistency-variant__value">
                  {variant.value}
                  {variant.isCanonical && (
                    <span className="inconsistency-variant__canonical-badge">Canonical</span>
                  )}
                </div>
                <div className="inconsistency-variant__count">
                  {variant.count} cells
                </div>
                <div className="inconsistency-variant__actions">
                  {!variant.isCanonical && onSetCanonical && (
                    <button
                      className="inconsistency-variant__set-canonical"
                      onClick={() => onSetCanonical(group.id, variant.value)}
                      title="Set as canonical value"
                    >
                      <TargetIcon />
                      Set as Standard
                    </button>
                  )}
                  {variant.isCanonical && (
                    <span className="inconsistency-variant__current">
                      <CheckIcon small />
                      Standard Value
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="inconsistency-group__preview">
            <span className="inconsistency-group__preview-label">Changes:</span>
            {variantsToFix.slice(0, 3).map((variant, i) => (
              <div key={i} className="inconsistency-group__preview-item">
                <span className="inconsistency-group__preview-from">{variant.value}</span>
                <span className="inconsistency-group__preview-arrow">→</span>
                <span className="inconsistency-group__preview-to">{group.canonical}</span>
                <span className="inconsistency-group__preview-count">
                  ({variant.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Common Inconsistencies Panel
// -----------------------------------------------------------------------------

interface CommonInconsistenciesProps {
  examples: Array<{
    original: string;
    standardized: string;
    category: string;
  }>;
}

export const CommonInconsistencies: React.FC<CommonInconsistenciesProps> = ({
  examples,
}) => (
  <div className="common-inconsistencies">
    <h4>Common Fixes</h4>
    <div className="common-inconsistencies__list">
      {examples.map((example, i) => (
        <div key={i} className="common-inconsistencies__item">
          <span className="common-inconsistencies__category">{example.category}</span>
          <span className="common-inconsistencies__original">{example.original}</span>
          <span className="common-inconsistencies__arrow">→</span>
          <span className="common-inconsistencies__standardized">{example.standardized}</span>
        </div>
      ))}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CheckIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <svg
    width={small ? 14 : 48}
    height={small ? 14 : 48}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#22c55e"
    strokeWidth={small ? 2 : 1.5}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ZapIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const TargetIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default InconsistencyView;
