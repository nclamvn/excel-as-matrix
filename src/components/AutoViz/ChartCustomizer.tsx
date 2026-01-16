// =============================================================================
// CHART CUSTOMIZER — Customize chart options
// =============================================================================

import React, { useState, useCallback } from 'react';
import type { ChartConfig } from '../../autoviz/types';
import { ChartBeautifier, BeautifyPreset } from '../../autoviz/ChartBeautifier';

interface ChartCustomizerProps {
  config: ChartConfig;
  onChange: (config: ChartConfig) => void;
  language?: 'en' | 'vi';
}

const beautifier = new ChartBeautifier();

const PRESETS: Array<{ value: BeautifyPreset; labelEn: string; labelVi: string }> = [
  { value: 'modern', labelEn: 'Modern', labelVi: 'Hiện đại' },
  { value: 'classic', labelEn: 'Classic', labelVi: 'Cổ điển' },
  { value: 'minimal', labelEn: 'Minimal', labelVi: 'Tối giản' },
  { value: 'bold', labelEn: 'Bold', labelVi: 'Nổi bật' },
  { value: 'elegant', labelEn: 'Elegant', labelVi: 'Sang trọng' },
  { value: 'dashboard', labelEn: 'Dashboard', labelVi: 'Dashboard' },
  { value: 'presentation', labelEn: 'Presentation', labelVi: 'Thuyết trình' },
  { value: 'print', labelEn: 'Print', labelVi: 'In ấn' },
];

export const ChartCustomizer: React.FC<ChartCustomizerProps> = ({
  config,
  onChange,
  language = 'en',
}) => {
  const [activeSection, setActiveSection] = useState<string>('preset');

  const handlePresetChange = useCallback(
    (preset: BeautifyPreset) => {
      const newConfig = beautifier.beautify(config, { preset });
      onChange(newConfig);
    },
    [config, onChange]
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      onChange({ ...config, title });
    },
    [config, onChange]
  );

  const handleSubtitleChange = useCallback(
    (subtitle: string) => {
      onChange({ ...config, subtitle });
    },
    [config, onChange]
  );

  const handleToggle = useCallback(
    (key: 'animation' | 'shadow' | 'showLegend' | 'showGrid') => {
      let newConfig = config;

      switch (key) {
        case 'animation':
          newConfig = {
            ...config,
            style: { ...config.style, animation: !config.style.animation },
          };
          break;
        case 'shadow':
          newConfig = {
            ...config,
            style: { ...config.style, shadow: !config.style.shadow },
          };
          break;
        case 'showLegend':
          newConfig = {
            ...config,
            legend: { ...config.legend!, show: !config.legend?.show },
          };
          break;
        case 'showGrid':
          newConfig = {
            ...config,
            yAxis: config.yAxis
              ? { ...config.yAxis, showGrid: !config.yAxis.showGrid }
              : undefined,
          };
          break;
      }

      onChange(newConfig);
    },
    [config, onChange]
  );

  const handleLegendPosition = useCallback(
    (position: 'top' | 'bottom' | 'left' | 'right') => {
      onChange({
        ...config,
        legend: { ...config.legend!, position },
      });
    },
    [config, onChange]
  );

  const handleBorderRadiusChange = useCallback(
    (radius: number) => {
      onChange({
        ...config,
        style: { ...config.style, borderRadius: radius },
      });
    },
    [config, onChange]
  );

  const handlePaddingChange = useCallback(
    (padding: number) => {
      onChange({
        ...config,
        style: { ...config.style, padding },
      });
    },
    [config, onChange]
  );

  const labels = {
    en: {
      preset: 'Style Preset',
      title: 'Title',
      subtitle: 'Subtitle',
      appearance: 'Appearance',
      legend: 'Legend',
      animation: 'Animation',
      shadow: 'Shadow',
      showLegend: 'Show Legend',
      showGrid: 'Show Grid',
      legendPosition: 'Position',
      borderRadius: 'Corner Radius',
      padding: 'Padding',
      top: 'Top',
      bottom: 'Bottom',
      left: 'Left',
      right: 'Right',
    },
    vi: {
      preset: 'Kiểu định dạng',
      title: 'Tiêu đề',
      subtitle: 'Phụ đề',
      appearance: 'Giao diện',
      legend: 'Chú giải',
      animation: 'Hiệu ứng',
      shadow: 'Bóng đổ',
      showLegend: 'Hiện chú giải',
      showGrid: 'Hiện lưới',
      legendPosition: 'Vị trí',
      borderRadius: 'Bo góc',
      padding: 'Khoảng cách',
      top: 'Trên',
      bottom: 'Dưới',
      left: 'Trái',
      right: 'Phải',
    },
  };

  const t = labels[language];

  return (
    <div className="chart-customizer">
      {/* Section Tabs */}
      <div className="customizer-tabs">
        {['preset', 'title', 'appearance', 'legend'].map((section) => (
          <button
            key={section}
            className={`customizer-tab ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {t[section as keyof typeof t]}
          </button>
        ))}
      </div>

      {/* Preset Section */}
      {activeSection === 'preset' && (
        <div className="customizer-section">
          <div className="preset-grid">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                className="preset-button"
                onClick={() => handlePresetChange(preset.value)}
              >
                <span className="preset-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </span>
                <span className="preset-label">
                  {language === 'vi' ? preset.labelVi : preset.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Title Section */}
      {activeSection === 'title' && (
        <div className="customizer-section">
          <div className="form-group">
            <label>{t.title}</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>{t.subtitle}</label>
            <input
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => handleSubtitleChange(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      )}

      {/* Appearance Section */}
      {activeSection === 'appearance' && (
        <div className="customizer-section">
          <div className="toggle-group">
            <label className="toggle-label">
              <span>{t.animation}</span>
              <button
                className={`toggle-button ${config.style.animation ? 'active' : ''}`}
                onClick={() => handleToggle('animation')}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </label>
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <span>{t.shadow}</span>
              <button
                className={`toggle-button ${config.style.shadow ? 'active' : ''}`}
                onClick={() => handleToggle('shadow')}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </label>
          </div>

          <div className="toggle-group">
            <label className="toggle-label">
              <span>{t.showGrid}</span>
              <button
                className={`toggle-button ${config.yAxis?.showGrid ? 'active' : ''}`}
                onClick={() => handleToggle('showGrid')}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </label>
          </div>

          <div className="slider-group">
            <label>
              {t.borderRadius}: {config.style.borderRadius}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={config.style.borderRadius}
              onChange={(e) => handleBorderRadiusChange(Number(e.target.value))}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <label>
              {t.padding}: {config.style.padding}px
            </label>
            <input
              type="range"
              min="0"
              max="40"
              value={config.style.padding}
              onChange={(e) => handlePaddingChange(Number(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>
      )}

      {/* Legend Section */}
      {activeSection === 'legend' && (
        <div className="customizer-section">
          <div className="toggle-group">
            <label className="toggle-label">
              <span>{t.showLegend}</span>
              <button
                className={`toggle-button ${config.legend?.show ? 'active' : ''}`}
                onClick={() => handleToggle('showLegend')}
              >
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </button>
            </label>
          </div>

          {config.legend?.show && (
            <div className="position-group">
              <label>{t.legendPosition}</label>
              <div className="position-buttons">
                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    className={`position-button ${config.legend?.position === pos ? 'active' : ''}`}
                    onClick={() => handleLegendPosition(pos)}
                  >
                    {t[pos]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartCustomizer;
