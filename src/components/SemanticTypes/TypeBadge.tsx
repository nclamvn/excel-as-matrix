// =============================================================================
// TYPE BADGE — Display semantic type indicator
// =============================================================================

import React from 'react';
import { BUILT_IN_TYPES, type SemanticType } from '../../types/semantic/types';

// -----------------------------------------------------------------------------
// Type Badge Props
// -----------------------------------------------------------------------------

interface TypeBadgeProps {
  type: SemanticType | string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

// -----------------------------------------------------------------------------
// Type Badge Component
// -----------------------------------------------------------------------------

export const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  size = 'medium',
  showIcon = true,
  showLabel = true,
  className = '',
  onClick,
}) => {
  const semanticType = typeof type === 'string' ? BUILT_IN_TYPES[type] : type;

  if (!semanticType) {
    return null;
  }

  const sizeClasses = {
    small: 'type-badge-small',
    medium: 'type-badge-medium',
    large: 'type-badge-large',
  };

  return (
    <span
      className={`type-badge ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${semanticType.color}15`,
        color: semanticType.color,
        borderColor: `${semanticType.color}30`,
      }}
      onClick={onClick}
      title={semanticType.description}
    >
      {showIcon && <span className="type-badge-icon">{semanticType.icon}</span>}
      {showLabel && <span className="type-badge-label">{semanticType.name}</span>}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Type Icon Component (just the icon)
// -----------------------------------------------------------------------------

interface TypeIconProps {
  type: SemanticType | string;
  size?: number;
  className?: string;
}

export const TypeIcon: React.FC<TypeIconProps> = ({ type, size = 16, className = '' }) => {
  const semanticType = typeof type === 'string' ? BUILT_IN_TYPES[type] : type;

  if (!semanticType) {
    return null;
  }

  return (
    <span
      className={`type-icon ${className}`}
      style={{ fontSize: size, color: semanticType.color }}
      title={semanticType.name}
    >
      {semanticType.icon}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Category Badge Component
// -----------------------------------------------------------------------------

interface CategoryBadgeProps {
  category: string;
  size?: 'small' | 'medium';
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  numeric: '#3b82f6',
  financial: '#22c55e',
  temporal: '#f59e0b',
  text: '#6b7280',
  measurement: '#ec4899',
  contact: '#06b6d4',
  boolean: '#10b981',
  geographic: '#14b8a6',
  identifier: '#64748b',
  custom: '#8b5cf6',
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'medium',
  className = '',
}) => {
  const color = CATEGORY_COLORS[category] || '#6b7280';
  const name = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <span
      className={`category-badge category-badge-${size} ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {name}
    </span>
  );
};
