// =============================================================================
// TRIGGER CONFIG — Configure macro trigger
// =============================================================================

import React from 'react';
import type { MacroTrigger, TriggerType, ScheduleConfig } from '../../macros/types';

interface TriggerConfigProps {
  trigger: MacroTrigger;
  onChange: (trigger: MacroTrigger) => void;
}

export const TriggerConfig: React.FC<TriggerConfigProps> = ({
  trigger,
  onChange,
}) => {
  const handleTypeChange = (type: TriggerType) => {
    onChange({
      ...trigger,
      type,
      config: type === 'schedule' ? { schedule: { type: 'daily', timeOfDay: '09:00' } } : {},
    });
  };

  const handleScheduleChange = (updates: Partial<ScheduleConfig>) => {
    onChange({
      ...trigger,
      config: {
        ...trigger.config,
        schedule: {
          ...trigger.config.schedule,
          ...updates,
        } as ScheduleConfig,
      },
    });
  };

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case 'manual':
        return <polygon points="5 3 19 12 5 21 5 3"/>;
      case 'schedule':
        return (
          <>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </>
        );
      case 'data_change':
        return (
          <>
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </>
        );
      case 'webhook':
        return (
          <>
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </>
        );
      default:
        return <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>;
    }
  };

  return (
    <div className="trigger-config">
      <div className="config-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>Trigger</span>
      </div>

      {/* Trigger Type Selection */}
      <div className="trigger-types">
        {(['manual', 'schedule', 'data_change'] as TriggerType[]).map(type => (
          <button
            key={type}
            className={`trigger-type-btn ${trigger.type === type ? 'active' : ''}`}
            onClick={() => handleTypeChange(type)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {getTriggerIcon(type)}
            </svg>
            <span>
              {type === 'manual' && 'Manual'}
              {type === 'schedule' && 'Scheduled'}
              {type === 'data_change' && 'On Change'}
            </span>
          </button>
        ))}
      </div>

      {/* Schedule Configuration */}
      {trigger.type === 'schedule' && trigger.config.schedule && (
        <div className="schedule-config">
          <div className="config-row">
            <label>Frequency:</label>
            <select
              value={trigger.config.schedule.type}
              onChange={(e) => handleScheduleChange({ type: e.target.value as ScheduleConfig['type'] })}
            >
              <option value="interval">Interval</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {trigger.config.schedule.type === 'interval' && (
            <div className="config-row">
              <label>Every:</label>
              <input
                type="number"
                min="1"
                value={trigger.config.schedule.intervalMinutes || 60}
                onChange={(e) => handleScheduleChange({ intervalMinutes: parseInt(e.target.value) })}
              />
              <span>minutes</span>
            </div>
          )}

          {trigger.config.schedule.type === 'daily' && (
            <div className="config-row">
              <label>At:</label>
              <input
                type="time"
                value={trigger.config.schedule.timeOfDay || '09:00'}
                onChange={(e) => handleScheduleChange({ timeOfDay: e.target.value })}
              />
            </div>
          )}

          {trigger.config.schedule.type === 'weekly' && (
            <>
              <div className="config-row">
                <label>Days:</label>
                <div className="day-selector">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <button
                      key={day}
                      className={`day-btn ${trigger.config.schedule?.daysOfWeek?.includes(i) ? 'active' : ''}`}
                      onClick={() => {
                        const current = trigger.config.schedule?.daysOfWeek || [];
                        const updated = current.includes(i)
                          ? current.filter(d => d !== i)
                          : [...current, i];
                        handleScheduleChange({ daysOfWeek: updated });
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="config-row">
                <label>At:</label>
                <input
                  type="time"
                  value={trigger.config.schedule.timeOfDay || '09:00'}
                  onChange={(e) => handleScheduleChange({ timeOfDay: e.target.value })}
                />
              </div>
            </>
          )}

          {trigger.config.schedule.type === 'monthly' && (
            <>
              <div className="config-row">
                <label>Day:</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={trigger.config.schedule.dayOfMonth || 1}
                  onChange={(e) => handleScheduleChange({ dayOfMonth: parseInt(e.target.value) })}
                />
              </div>
              <div className="config-row">
                <label>At:</label>
                <input
                  type="time"
                  value={trigger.config.schedule.timeOfDay || '09:00'}
                  onChange={(e) => handleScheduleChange({ timeOfDay: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Data Change Configuration */}
      {trigger.type === 'data_change' && (
        <div className="data-change-config">
          <div className="config-row">
            <label>Watch Range:</label>
            <input
              type="text"
              placeholder="e.g., A1:Z100"
              value={trigger.config.watchRange || ''}
              onChange={(e) => onChange({
                ...trigger,
                config: { ...trigger.config, watchRange: e.target.value },
              })}
            />
          </div>
          <div className="config-row">
            <label>Change Type:</label>
            <select
              value={trigger.config.changeType || 'any'}
              onChange={(e) => onChange({
                ...trigger,
                config: { ...trigger.config, changeType: e.target.value as 'any' | 'value' | 'formula' },
              })}
            >
              <option value="any">Any change</option>
              <option value="value">Value change</option>
              <option value="formula">Formula change</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriggerConfig;
