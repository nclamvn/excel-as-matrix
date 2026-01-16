// =============================================================================
// PROACTIVE SETTINGS — Settings panel for proactive AI
// =============================================================================

import React, { useState, useEffect } from 'react';
import { proactiveEngine } from '../../proactive';
import type { ScanConfig } from '../../proactive/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface ProactiveSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// -----------------------------------------------------------------------------
// Proactive Settings Component
// -----------------------------------------------------------------------------

export const ProactiveSettings: React.FC<ProactiveSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<ScanConfig>(proactiveEngine.getConfig());
  const [hasChanges, setHasChanges] = useState(false);

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      setConfig(proactiveEngine.getConfig());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleChange = <K extends keyof ScanConfig>(key: K, value: ScanConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    proactiveEngine.updateConfig(config);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    const defaultConfig = proactiveEngine.getConfig();
    setConfig(defaultConfig);
    setHasChanges(false);
  };

  if (!isOpen) return null;

  return (
    <div className="proactive-settings-overlay">
      <div className="proactive-settings">
        <div className="proactive-settings__header">
          <h3 className="proactive-settings__title">
            <SettingsIcon />
            Proactive AI Settings
          </h3>
          <button
            className="proactive-settings__close"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="proactive-settings__content">
          {/* Main Toggle */}
          <SettingsSection title="General">
            <ToggleSetting
              label="Enable Proactive AI"
              description="Automatically scan your data for issues and insights"
              value={config.enabled}
              onChange={(v) => handleChange('enabled', v)}
            />
            <SliderSetting
              label="Scan Interval"
              description="How often to scan your data"
              value={config.interval}
              min={10000}
              max={120000}
              step={5000}
              unit="seconds"
              formatValue={(v) => `${v / 1000}s`}
              onChange={(v) => handleChange('interval', v)}
            />
          </SettingsSection>

          {/* Scan Types */}
          <SettingsSection title="Scan Types">
            <ToggleSetting
              label="Data Issues"
              description="Find duplicates, missing values, outliers, and format errors"
              value={config.scanIssues}
              onChange={(v) => handleChange('scanIssues', v)}
              icon={<IssueIcon />}
            />
            <ToggleSetting
              label="Insights"
              description="Detect trends, correlations, and anomalies"
              value={config.scanInsights}
              onChange={(v) => handleChange('scanInsights', v)}
              icon={<InsightIcon />}
            />
            <ToggleSetting
              label="Optimizations"
              description="Suggest formula improvements and performance gains"
              value={config.scanOptimizations}
              onChange={(v) => handleChange('scanOptimizations', v)}
              icon={<OptimizeIcon />}
            />
            <ToggleSetting
              label="Patterns"
              description="Learn your workflow and suggest automations"
              value={config.scanPatterns}
              onChange={(v) => handleChange('scanPatterns', v)}
              icon={<PatternIcon />}
            />
          </SettingsSection>

          {/* Thresholds */}
          <SettingsSection title="Detection Thresholds">
            <SliderSetting
              label="Duplicate Threshold"
              description="Minimum occurrences to flag as duplicate"
              value={config.duplicateThreshold}
              min={2}
              max={10}
              step={1}
              onChange={(v) => handleChange('duplicateThreshold', v)}
            />
            <SliderSetting
              label="Outlier Sensitivity"
              description="Z-score threshold for outlier detection (lower = more sensitive)"
              value={config.outlierZScore}
              min={2}
              max={5}
              step={0.5}
              formatValue={(v) => v.toFixed(1)}
              onChange={(v) => handleChange('outlierZScore', v)}
            />
            <SliderSetting
              label="Correlation Threshold"
              description="Minimum correlation coefficient to report"
              value={config.correlationThreshold}
              min={0.3}
              max={0.95}
              step={0.05}
              formatValue={(v) => v.toFixed(2)}
              onChange={(v) => handleChange('correlationThreshold', v)}
            />
            <SliderSetting
              label="Pattern Frequency"
              description="Minimum repetitions to detect as pattern"
              value={config.patternMinFrequency}
              min={2}
              max={10}
              step={1}
              onChange={(v) => handleChange('patternMinFrequency', v)}
            />
          </SettingsSection>

          {/* Limits */}
          <SettingsSection title="Limits">
            <SliderSetting
              label="Max Suggestions"
              description="Maximum number of suggestions to show"
              value={config.maxSuggestions}
              min={10}
              max={100}
              step={10}
              onChange={(v) => handleChange('maxSuggestions', v)}
            />
            <SliderSetting
              label="Max Cells to Scan"
              description="Skip scanning if data exceeds this limit"
              value={config.maxCellsToScan}
              min={1000}
              max={100000}
              step={1000}
              formatValue={(v) => v.toLocaleString()}
              onChange={(v) => handleChange('maxCellsToScan', v)}
            />
          </SettingsSection>
        </div>

        <div className="proactive-settings__footer">
          <button
            className="proactive-settings__button proactive-settings__button--secondary"
            onClick={handleReset}
          >
            Reset to Default
          </button>
          <div className="proactive-settings__footer-right">
            <button
              className="proactive-settings__button proactive-settings__button--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="proactive-settings__button proactive-settings__button--primary"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Settings Section Component
// -----------------------------------------------------------------------------

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="settings-section">
    <h4 className="settings-section__title">{title}</h4>
    <div className="settings-section__content">{children}</div>
  </div>
);

// -----------------------------------------------------------------------------
// Toggle Setting Component
// -----------------------------------------------------------------------------

interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({
  label,
  description,
  value,
  onChange,
  icon,
}) => (
  <div className="setting-row">
    <div className="setting-row__info">
      {icon && <span className="setting-row__icon">{icon}</span>}
      <div className="setting-row__text">
        <span className="setting-row__label">{label}</span>
        <span className="setting-row__description">{description}</span>
      </div>
    </div>
    <button
      className={`toggle-switch ${value ? 'toggle-switch--on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-switch__thumb" />
    </button>
  </div>
);

// -----------------------------------------------------------------------------
// Slider Setting Component
// -----------------------------------------------------------------------------

interface SliderSettingProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

const SliderSetting: React.FC<SliderSettingProps> = ({
  label,
  description,
  value,
  min,
  max,
  step,
  formatValue = (v) => v.toString(),
  onChange,
}) => (
  <div className="setting-row setting-row--slider">
    <div className="setting-row__info">
      <div className="setting-row__text">
        <span className="setting-row__label">{label}</span>
        <span className="setting-row__description">{description}</span>
      </div>
    </div>
    <div className="setting-row__slider-area">
      <input
        type="range"
        className="setting-row__slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="setting-row__value">{formatValue(value)}</span>
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IssueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InsightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const OptimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PatternIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default ProactiveSettings;
