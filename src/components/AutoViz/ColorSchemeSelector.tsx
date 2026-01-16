// =============================================================================
// COLOR SCHEME SELECTOR — Select color scheme for charts
// =============================================================================

import React from 'react';
import { COLOR_SCHEMES } from '../../autoviz/ColorSchemes';

interface ColorSchemeSelectorProps {
  selectedScheme: string;
  onChange: (schemeName: string) => void;
  language?: 'en' | 'vi';
  compact?: boolean;
}

const SCHEME_NAMES_VI: Record<string, string> = {
  professional: 'Chuyên nghiệp',
  modern: 'Hiện đại',
  dark: 'Tối',
  nature: 'Thiên nhiên',
  sunset: 'Hoàng hôn',
  ocean: 'Đại dương',
  corporate: 'Doanh nghiệp',
  vibrant: 'Sống động',
  pastel: 'Pastel',
  monochrome: 'Đơn sắc',
  excel: 'Excel',
  financial: 'Tài chính',
};

export const ColorSchemeSelector: React.FC<ColorSchemeSelectorProps> = ({
  selectedScheme,
  onChange,
  language = 'en',
  compact = false,
}) => {
  const schemeEntries = Object.entries(COLOR_SCHEMES);

  return (
    <div className={`color-scheme-selector ${compact ? 'compact' : ''}`}>
      <h4 className="selector-title">
        {language === 'vi' ? 'Bảng màu' : 'Color Scheme'}
      </h4>

      <div className="color-scheme-grid">
        {schemeEntries.map(([name, scheme]) => (
          <button
            key={name}
            className={`color-scheme-option ${selectedScheme === name ? 'selected' : ''}`}
            onClick={() => onChange(name)}
            title={language === 'vi' ? SCHEME_NAMES_VI[name] || scheme.name : scheme.name}
          >
            <div className="scheme-preview">
              {scheme.colors.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className="scheme-color"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {!compact && (
              <span className="scheme-name">
                {language === 'vi' ? SCHEME_NAMES_VI[name] || scheme.name : scheme.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Preview of selected scheme */}
      {!compact && (
        <div className="scheme-details">
          <div className="scheme-full-preview">
            {COLOR_SCHEMES[selectedScheme]?.colors.map((color, i) => (
              <div
                key={i}
                className="scheme-color-large"
                style={{ backgroundColor: color }}
              >
                <span className="color-hex">{color}</span>
              </div>
            ))}
          </div>
          <div className="scheme-special-colors">
            <div className="special-color">
              <span
                className="color-swatch"
                style={{ backgroundColor: COLOR_SCHEMES[selectedScheme]?.positive }}
              />
              <span>{language === 'vi' ? 'Tích cực' : 'Positive'}</span>
            </div>
            <div className="special-color">
              <span
                className="color-swatch"
                style={{ backgroundColor: COLOR_SCHEMES[selectedScheme]?.negative }}
              />
              <span>{language === 'vi' ? 'Tiêu cực' : 'Negative'}</span>
            </div>
            <div className="special-color">
              <span
                className="color-swatch"
                style={{ backgroundColor: COLOR_SCHEMES[selectedScheme]?.highlight }}
              />
              <span>{language === 'vi' ? 'Nổi bật' : 'Highlight'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSchemeSelector;
