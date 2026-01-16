// =============================================================================
// EXECUTION LOG — Show macro execution history
// =============================================================================

import React from 'react';
import type { MacroExecution } from '../../macros/types';

interface ExecutionLogProps {
  executions: MacroExecution[];
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ executions }) => {
  const getStatusIcon = (status: MacroExecution['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
      case 'failed':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'running':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        );
      case 'cancelled':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (executions.length === 0) {
    return (
      <div className="empty-log">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <h3>No execution history</h3>
        <p>Run a macro to see its execution log here</p>
      </div>
    );
  }

  // Sort by most recent first
  const sortedExecutions = [...executions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return (
    <div className="execution-log">
      {sortedExecutions.map(execution => (
        <div
          key={execution.id}
          className={`execution-item ${execution.status}`}
        >
          <div className="execution-header">
            {getStatusIcon(execution.status)}
            <span className="execution-name">
              Execution #{execution.id.slice(0, 8)}
            </span>
            <span className="execution-time">
              {new Date(execution.startedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="execution-details">
            <div className="detail">
              <span className="label">Status:</span>
              <span className={`value status-${execution.status}`}>
                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
              </span>
            </div>
            <div className="detail">
              <span className="label">Duration:</span>
              <span className="value">{formatDuration(execution.duration)}</span>
            </div>
            <div className="detail">
              <span className="label">Steps:</span>
              <span className="value">
                {execution.results.filter(r => r.status === 'success').length}/
                {execution.results.length}
              </span>
            </div>
            <div className="detail">
              <span className="label">Trigger:</span>
              <span className="value">{execution.triggeredBy}</span>
            </div>
          </div>

          {execution.error && (
            <div className="execution-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{execution.error.message}</span>
            </div>
          )}

          {execution.status === 'running' && execution.currentStep && (
            <div className="execution-progress">
              <div
                className="progress-bar"
                style={{
                  width: `${(execution.currentStep / execution.results.length) * 100}%`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExecutionLog;
