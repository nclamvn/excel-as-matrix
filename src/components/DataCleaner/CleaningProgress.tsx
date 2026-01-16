// =============================================================================
// CLEANING PROGRESS — Progress indicator for cleaning operations
// =============================================================================

import React from 'react';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface CleaningProgressProps {
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  currentStepIndex?: number;
}

// -----------------------------------------------------------------------------
// Cleaning Progress Component
// -----------------------------------------------------------------------------

export const CleaningProgress: React.FC<CleaningProgressProps> = ({
  progress,
  currentStep,
  totalSteps,
  currentStepIndex,
}) => {
  return (
    <div className="cleaning-progress">
      <div className="cleaning-progress__header">
        <CleaningIcon />
        <span className="cleaning-progress__title">Cleaning in progress...</span>
      </div>

      <div className="cleaning-progress__bar-container">
        <div className="cleaning-progress__bar">
          <div
            className="cleaning-progress__bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="cleaning-progress__percent">{Math.round(progress)}%</span>
      </div>

      {currentStep && (
        <div className="cleaning-progress__step">
          <span className="cleaning-progress__step-name">{currentStep}</span>
          {totalSteps && currentStepIndex !== undefined && (
            <span className="cleaning-progress__step-count">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step Progress Component
// -----------------------------------------------------------------------------

interface StepProgressProps {
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'error';
  }>;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps }) => {
  return (
    <div className="step-progress">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`step-progress__item step-progress__item--${step.status}`}
        >
          <div className="step-progress__indicator">
            {step.status === 'completed' && <CheckIcon />}
            {step.status === 'running' && <SpinnerIcon />}
            {step.status === 'error' && <ErrorIcon />}
            {step.status === 'pending' && <span>{index + 1}</span>}
          </div>
          <span className="step-progress__name">{step.name}</span>
          {index < steps.length - 1 && (
            <div className={`step-progress__connector step-progress__connector--${step.status}`} />
          )}
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Circular Progress Component
// -----------------------------------------------------------------------------

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          className="circular-progress__bg"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress circle */}
        <circle
          className="circular-progress__fill"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="circular-progress__label">
          <span className="circular-progress__value">{Math.round(progress)}</span>
          <span className="circular-progress__percent">%</span>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const CleaningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="step-progress__spinner">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default CleaningProgress;
