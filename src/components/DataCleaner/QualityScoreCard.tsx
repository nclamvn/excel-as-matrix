// =============================================================================
// QUALITY SCORE CARD — Display quality score
// =============================================================================

import React from 'react';
import type { QualityScore, QualityGrade } from '../../datacleaner/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface QualityScoreCardProps {
  score: QualityScore;
  compact?: boolean;
}

// -----------------------------------------------------------------------------
// Quality Score Card Component
// -----------------------------------------------------------------------------

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({
  score,
  compact = false,
}) => {
  const gradeConfig = getGradeConfig(score.grade);

  if (compact) {
    return (
      <div className="quality-score-card quality-score-card--compact">
        <div className="quality-score-card__grade-badge" style={{ backgroundColor: gradeConfig.color }}>
          {score.grade}
        </div>
        <div className="quality-score-card__compact-info">
          <span className="quality-score-card__compact-score">{score.overall}/100</span>
          <span className="quality-score-card__compact-label">{gradeConfig.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="quality-score-card">
      <div className="quality-score-card__gauge">
        <svg viewBox="0 0 100 60" className="quality-score-card__gauge-svg">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={gradeConfig.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${score.overall * 1.26} 126`}
            className="quality-score-card__gauge-fill"
          />
        </svg>
        <div className="quality-score-card__score-display">
          <span className="quality-score-card__score-value">{score.overall}</span>
          <span className="quality-score-card__score-max">/ 100</span>
        </div>
      </div>

      <div className="quality-score-card__grade" style={{ backgroundColor: gradeConfig.bgColor }}>
        <span className="quality-score-card__grade-letter" style={{ color: gradeConfig.color }}>
          {score.grade}
        </span>
        <span className="quality-score-card__grade-label">{gradeConfig.label} Quality</span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mini Score Display
// -----------------------------------------------------------------------------

interface MiniScoreProps {
  score: number;
  label?: string;
}

export const MiniScore: React.FC<MiniScoreProps> = ({ score, label }) => {
  const color = getScoreColor(score);

  return (
    <div className="mini-score">
      <div className="mini-score__bar">
        <div
          className="mini-score__fill"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="mini-score__info">
        <span className="mini-score__value" style={{ color }}>{score}%</span>
        {label && <span className="mini-score__label">{label}</span>}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Grade Badge
// -----------------------------------------------------------------------------

interface GradeBadgeProps {
  grade: QualityGrade;
  size?: 'small' | 'medium' | 'large';
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  size = 'medium',
}) => {
  const config = getGradeConfig(grade);

  return (
    <span
      className={`grade-badge grade-badge--${size}`}
      style={{ backgroundColor: config.color }}
    >
      {grade}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getGradeConfig(grade: QualityGrade): {
  color: string;
  bgColor: string;
  label: string;
} {
  const configs = {
    A: { color: '#22c55e', bgColor: '#dcfce7', label: 'Excellent' },
    B: { color: '#84cc16', bgColor: '#ecfccb', label: 'Good' },
    C: { color: '#eab308', bgColor: '#fef9c3', label: 'Fair' },
    D: { color: '#f97316', bgColor: '#ffedd5', label: 'Poor' },
    F: { color: '#ef4444', bgColor: '#fee2e2', label: 'Critical' },
  };
  return configs[grade];
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#eab308';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}

export default QualityScoreCard;
