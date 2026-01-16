// =============================================================================
// TASK PROGRESS — Multi-step progress visualization (Blueprint §5.6)
// =============================================================================

import React from 'react';
import type { TaskPlan, TaskStep, StepStatus, StepResult } from '../../ai/conversation/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TaskProgressProps {
  plan: TaskPlan;
  results: StepResult[];
  currentStepIndex: number;
  onRetryStep?: (stepIndex: number) => void;
  onSkipStep?: (stepIndex: number) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const TaskProgress: React.FC<TaskProgressProps> = ({
  plan,
  results,
  currentStepIndex,
  onRetryStep,
  onSkipStep,
  className = '',
}) => {
  const completedCount = plan.steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const progress = Math.round((completedCount / plan.steps.length) * 100);

  return (
    <div className={`task-progress ${className}`}>
      {/* Header */}
      <div className="task-progress__header">
        <h4 className="task-progress__title">{plan.name}</h4>
        <span className="task-progress__count">
          {completedCount}/{plan.steps.length} steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="task-progress__bar">
        <div
          className="task-progress__fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="task-progress__steps">
        {plan.steps.map((step, index) => {
          const result = results.find((r) => r.stepId === step.id);
          const isCurrent = index === currentStepIndex;

          return (
            <TaskStepRow
              key={step.id}
              step={step}
              result={result}
              isCurrent={isCurrent}
              onRetry={
                onRetryStep && step.canRetry && step.status === 'failed'
                  ? () => onRetryStep(index)
                  : undefined
              }
              onSkip={
                onSkipStep && step.optional && step.status === 'pending'
                  ? () => onSkipStep(index)
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Summary */}
      <div className="task-progress__summary">
        <span className="task-progress__complexity">
          Complexity: {plan.estimatedComplexity}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step Row
// -----------------------------------------------------------------------------

interface TaskStepRowProps {
  step: TaskStep;
  result?: StepResult;
  isCurrent: boolean;
  onRetry?: () => void;
  onSkip?: () => void;
}

const TaskStepRow: React.FC<TaskStepRowProps> = ({
  step,
  result,
  isCurrent,
  onRetry,
  onSkip,
}) => {
  return (
    <div
      className={`task-step ${isCurrent ? 'task-step--current' : ''} task-step--${step.status}`}
    >
      {/* Status indicator */}
      <span className="task-step__status">
        {getStatusIcon(step.status)}
      </span>

      {/* Step info */}
      <div className="task-step__info">
        <span className="task-step__name">
          {step.index + 1}. {step.name}
          {step.optional && <span className="task-step__optional">(optional)</span>}
        </span>
        <span className="task-step__description">{step.description}</span>

        {/* Error message */}
        {result?.error && (
          <span className="task-step__error">{result.error}</span>
        )}
      </div>

      {/* Actions */}
      <div className="task-step__actions">
        {onRetry && (
          <button className="task-step__retry" onClick={onRetry}>
            Retry
          </button>
        )}
        {onSkip && (
          <button className="task-step__skip" onClick={onSkip}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact Progress Bar
// -----------------------------------------------------------------------------

interface CompactProgressProps {
  plan: TaskPlan;
  className?: string;
}

export const CompactProgress: React.FC<CompactProgressProps> = ({
  plan,
  className = '',
}) => {
  return (
    <div className={`compact-progress ${className}`}>
      {plan.steps.map((step) => (
        <span
          key={step.id}
          className={`compact-progress__dot compact-progress__dot--${step.status}`}
          title={`${step.name}: ${step.status}`}
        >
          {getStatusIcon(step.status)}
        </span>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Step List
// -----------------------------------------------------------------------------

interface StepListProps {
  steps: TaskStep[];
  currentIndex: number;
  className?: string;
}

export const StepList: React.FC<StepListProps> = ({
  steps,
  currentIndex,
  className = '',
}) => {
  return (
    <ol className={`step-list ${className}`}>
      {steps.map((step, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <li
            key={step.id}
            className={`step-list__item ${
              isPast
                ? 'step-list__item--past'
                : isCurrent
                ? 'step-list__item--current'
                : isFuture
                ? 'step-list__item--future'
                : ''
            }`}
          >
            <span className="step-list__number">{index + 1}</span>
            <span className="step-list__name">{step.name}</span>
            <span className="step-list__status">
              {getStatusIcon(step.status)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

// -----------------------------------------------------------------------------
// Progress Summary
// -----------------------------------------------------------------------------

interface ProgressSummaryProps {
  plan: TaskPlan;
  results: StepResult[];
  className?: string;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  plan,
  results,
  className = '',
}) => {
  const completed = plan.steps.filter((s) => s.status === 'completed').length;
  const failed = plan.steps.filter((s) => s.status === 'failed').length;
  const skipped = plan.steps.filter((s) => s.status === 'skipped').length;
  const pending = plan.steps.filter((s) => s.status === 'pending').length;
  const running = plan.steps.filter((s) => s.status === 'running').length;

  const totalTime = results.reduce((sum, r) => {
    if (r.completedAt && r.startedAt) {
      return sum + (r.completedAt.getTime() - r.startedAt.getTime());
    }
    return sum;
  }, 0);

  return (
    <div className={`progress-summary ${className}`}>
      <div className="progress-summary__stats">
        {completed > 0 && (
          <span className="progress-summary__stat progress-summary__stat--completed">
            ✓ {completed} completed
          </span>
        )}
        {running > 0 && (
          <span className="progress-summary__stat progress-summary__stat--running">
            ⚡ {running} running
          </span>
        )}
        {failed > 0 && (
          <span className="progress-summary__stat progress-summary__stat--failed">
            ✗ {failed} failed
          </span>
        )}
        {skipped > 0 && (
          <span className="progress-summary__stat progress-summary__stat--skipped">
            ○ {skipped} skipped
          </span>
        )}
        {pending > 0 && (
          <span className="progress-summary__stat progress-summary__stat--pending">
            ○ {pending} pending
          </span>
        )}
      </div>

      {totalTime > 0 && (
        <span className="progress-summary__time">
          Total time: {formatDuration(totalTime)}
        </span>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getStatusIcon(status: StepStatus): string {
  switch (status) {
    case 'pending':
      return '○';
    case 'running':
      return '⚡';
    case 'completed':
      return '✓';
    case 'failed':
      return '✗';
    case 'skipped':
      return '−';
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export default TaskProgress;
