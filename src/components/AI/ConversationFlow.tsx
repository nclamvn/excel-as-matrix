// =============================================================================
// CONVERSATION FLOW — Visual state indicator (Blueprint §5.6)
// =============================================================================

import React from 'react';
import type { ConversationState, ConversationContext } from '../../ai/conversation/types';
import { STATE_DESCRIPTIONS, STATE_ICONS } from '../../ai/conversation/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ConversationFlowProps {
  context: ConversationContext;
  onCancel?: () => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const ConversationFlow: React.FC<ConversationFlowProps> = ({
  context,
  onCancel,
  className = '',
}) => {
  const states: ConversationState[] = [
    'idle',
    'intent_gathering',
    'clarifying',
    'planning',
    'executing',
    'reviewing',
    'awaiting_approval',
    'complete',
  ];

  const currentIndex = states.indexOf(context.state);
  const isError = context.state === 'error';
  const isCancelled = context.state === 'cancelled';

  return (
    <div className={`conversation-flow ${className}`}>
      {/* State progress bar */}
      <div className="conversation-flow__progress">
        {states.slice(0, -1).map((state, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <React.Fragment key={state}>
              {/* State dot */}
              <div
                className={`conversation-flow__dot ${
                  isActive ? 'conversation-flow__dot--active' : ''
                } ${isPast ? 'conversation-flow__dot--past' : ''} ${
                  isFuture ? 'conversation-flow__dot--future' : ''
                }`}
                title={STATE_DESCRIPTIONS[state]}
              >
                <span className="conversation-flow__dot-icon">
                  {STATE_ICONS[state]}
                </span>
              </div>

              {/* Connector line */}
              {index < states.length - 2 && (
                <div
                  className={`conversation-flow__line ${
                    isPast ? 'conversation-flow__line--filled' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current state info */}
      <div className="conversation-flow__current">
        <span className="conversation-flow__current-icon">
          {isError ? '❌' : isCancelled ? '🚫' : STATE_ICONS[context.state]}
        </span>
        <span className="conversation-flow__current-text">
          {isError
            ? 'Error occurred'
            : isCancelled
            ? 'Cancelled'
            : STATE_DESCRIPTIONS[context.state]}
        </span>

        {/* Cancel button */}
        {onCancel && !['complete', 'cancelled', 'idle'].includes(context.state) && (
          <button
            className="conversation-flow__cancel"
            onClick={onCancel}
            title="Cancel"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Error info */}
      {isError && context.lastError && (
        <div className="conversation-flow__error">
          <span className="conversation-flow__error-message">
            {context.lastError.message}
          </span>
          {context.lastError.recoverable && (
            <span className="conversation-flow__error-hint">
              (Recoverable)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Compact State Badge
// -----------------------------------------------------------------------------

interface StateBadgeProps {
  state: ConversationState;
  showLabel?: boolean;
  className?: string;
}

export const StateBadge: React.FC<StateBadgeProps> = ({
  state,
  showLabel = true,
  className = '',
}) => {
  const color = getStateColor(state);

  return (
    <span
      className={`state-badge ${className}`}
      style={{ '--state-color': color } as React.CSSProperties}
    >
      <span className="state-badge__icon">{STATE_ICONS[state]}</span>
      {showLabel && (
        <span className="state-badge__label">{formatStateName(state)}</span>
      )}
    </span>
  );
};

// -----------------------------------------------------------------------------
// State Timeline
// -----------------------------------------------------------------------------

interface StateTimelineProps {
  events: { state: ConversationState; timestamp: Date }[];
  className?: string;
}

export const StateTimeline: React.FC<StateTimelineProps> = ({
  events,
  className = '',
}) => {
  return (
    <div className={`state-timeline ${className}`}>
      {events.map((event, index) => (
        <div key={index} className="state-timeline__item">
          <span className="state-timeline__dot">
            {STATE_ICONS[event.state]}
          </span>
          <div className="state-timeline__content">
            <span className="state-timeline__state">
              {formatStateName(event.state)}
            </span>
            <span className="state-timeline__time">
              {formatTime(event.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// State Indicator (minimal)
// -----------------------------------------------------------------------------

interface StateIndicatorProps {
  state: ConversationState;
  pulse?: boolean;
  className?: string;
}

export const StateIndicator: React.FC<StateIndicatorProps> = ({
  state,
  pulse = false,
  className = '',
}) => {
  const color = getStateColor(state);
  const isActive = ['intent_gathering', 'planning', 'executing'].includes(state);

  return (
    <span
      className={`state-indicator ${isActive && pulse ? 'state-indicator--pulse' : ''} ${className}`}
      style={{ backgroundColor: color }}
      title={STATE_DESCRIPTIONS[state]}
    />
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getStateColor(state: ConversationState): string {
  switch (state) {
    case 'idle':
      return '#9ca3af'; // gray
    case 'intent_gathering':
    case 'planning':
    case 'executing':
      return '#3b82f6'; // blue
    case 'clarifying':
      return '#f59e0b'; // amber
    case 'reviewing':
    case 'awaiting_approval':
      return '#8b5cf6'; // purple
    case 'complete':
      return '#22c55e'; // green
    case 'error':
      return '#ef4444'; // red
    case 'cancelled':
      return '#6b7280'; // gray
    default:
      return '#9ca3af';
  }
}

function formatStateName(state: ConversationState): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default ConversationFlow;
