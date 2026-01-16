// =============================================================================
// CHART TYPE SELECTOR — Select chart type
// =============================================================================

import React from 'react';
import type { ChartType } from '../../autoviz/types';

interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onChange: (type: ChartType) => void;
  language?: 'en' | 'vi';
  disabled?: boolean;
}

interface ChartTypeOption {
  type: ChartType;
  nameEn: string;
  nameVi: string;
  icon: React.ReactNode;
  category: 'comparison' | 'trend' | 'composition' | 'relationship' | 'single';
}

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  {
    type: 'column',
    nameEn: 'Column',
    nameVi: 'Cột',
    category: 'comparison',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="10" width="4" height="10"/>
        <rect x="10" y="4" width="4" height="16"/>
        <rect x="16" y="7" width="4" height="13"/>
      </svg>
    ),
  },
  {
    type: 'bar',
    nameEn: 'Bar',
    nameVi: 'Thanh',
    category: 'comparison',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="10" height="4"/>
        <rect x="4" y="10" width="16" height="4"/>
        <rect x="4" y="16" width="12" height="4"/>
      </svg>
    ),
  },
  {
    type: 'line',
    nameEn: 'Line',
    nameVi: 'Đường',
    category: 'trend',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 18l5-5 4 4 7-9"/>
      </svg>
    ),
  },
  {
    type: 'area',
    nameEn: 'Area',
    nameVi: 'Vùng',
    category: 'trend',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
        <path d="M4 20V14l5-5 4 4 7-9v16H4z"/>
      </svg>
    ),
  },
  {
    type: 'pie',
    nameEn: 'Pie',
    nameVi: 'Tròn',
    category: 'composition',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2v10l8.66 5a10 10 0 1 1-8.66-15z"/>
        <path d="M12 2a10 10 0 0 1 8.66 15L12 12V2z" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'donut',
    nameEn: 'Donut',
    nameVi: 'Vành khuyên',
    category: 'composition',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 4a8 8 0 0 1 6.93 12" stroke="currentColor" strokeWidth="4" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'scatter',
    nameEn: 'Scatter',
    nameVi: 'Phân tán',
    category: 'relationship',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="6" cy="16" r="2"/>
        <circle cx="10" cy="10" r="2"/>
        <circle cx="14" cy="14" r="2"/>
        <circle cx="18" cy="8" r="2"/>
      </svg>
    ),
  },
  {
    type: 'bubble',
    nameEn: 'Bubble',
    nameVi: 'Bong bóng',
    category: 'relationship',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
        <circle cx="8" cy="14" r="4"/>
        <circle cx="16" cy="8" r="3"/>
        <circle cx="14" cy="16" r="2"/>
      </svg>
    ),
  },
  {
    type: 'stacked_bar',
    nameEn: 'Stacked Bar',
    nameVi: 'Thanh xếp chồng',
    category: 'composition',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="6" height="4"/>
        <rect x="10" y="4" width="10" height="4" opacity="0.5"/>
        <rect x="4" y="10" width="10" height="4"/>
        <rect x="14" y="10" width="6" height="4" opacity="0.5"/>
        <rect x="4" y="16" width="8" height="4"/>
        <rect x="12" y="16" width="8" height="4" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'stacked_area',
    nameEn: 'Stacked Area',
    nameVi: 'Vùng xếp chồng',
    category: 'composition',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 20V16l5-3 5 2 6-5v10H4z" opacity="0.3"/>
        <path d="M4 20V12l5-2 5 3 6-7v14H4z" opacity="0.6"/>
      </svg>
    ),
  },
  {
    type: 'heatmap',
    nameEn: 'Heatmap',
    nameVi: 'Bản đồ nhiệt',
    category: 'relationship',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="5" height="5" opacity="0.3"/>
        <rect x="10" y="4" width="5" height="5" opacity="0.7"/>
        <rect x="16" y="4" width="4" height="5" opacity="0.5"/>
        <rect x="4" y="10" width="5" height="5" opacity="0.9"/>
        <rect x="10" y="10" width="5" height="5" opacity="0.4"/>
        <rect x="16" y="10" width="4" height="5" opacity="0.2"/>
        <rect x="4" y="16" width="5" height="4" opacity="0.6"/>
        <rect x="10" y="16" width="5" height="4" opacity="0.8"/>
        <rect x="16" y="16" width="4" height="4" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'radar',
    nameEn: 'Radar',
    nameVi: 'Radar',
    category: 'comparison',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <polygon points="12,3 21,9 18,19 6,19 3,9" fill="currentColor" opacity="0.2"/>
        <polygon points="12,6 17,10 15,16 9,16 7,10" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
  },
  {
    type: 'funnel',
    nameEn: 'Funnel',
    nameVi: 'Phễu',
    category: 'single',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h16l-2 4H6l-2-4z" opacity="0.9"/>
        <path d="M6 10h12l-2 4H8l-2-4z" opacity="0.7"/>
        <path d="M8 16h8l-2 4h-4l-2-4z" opacity="0.5"/>
      </svg>
    ),
  },
  {
    type: 'waterfall',
    nameEn: 'Waterfall',
    nameVi: 'Thác nước',
    category: 'single',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="3" height="8"/>
        <rect x="8" y="8" width="3" height="6" opacity="0.5"/>
        <rect x="12" y="6" width="3" height="8"/>
        <rect x="16" y="10" width="4" height="10"/>
      </svg>
    ),
  },
  {
    type: 'gauge',
    nameEn: 'Gauge',
    nameVi: 'Đồng hồ',
    category: 'single',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
        <path d="M12 12l3-3"/>
      </svg>
    ),
  },
  {
    type: 'kpi',
    nameEn: 'KPI Card',
    nameVi: 'Thẻ KPI',
    category: 'single',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <path d="M8 12h8M12 8v8"/>
      </svg>
    ),
  },
];

const CATEGORIES = {
  comparison: { en: 'Comparison', vi: 'So sánh' },
  trend: { en: 'Trend', vi: 'Xu hướng' },
  composition: { en: 'Composition', vi: 'Cấu thành' },
  relationship: { en: 'Relationship', vi: 'Quan hệ' },
  single: { en: 'Single Value', vi: 'Giá trị đơn' },
};

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  selectedType,
  onChange,
  language = 'en',
  disabled = false,
}) => {
  const groupedOptions = CHART_TYPE_OPTIONS.reduce(
    (acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    },
    {} as Record<string, ChartTypeOption[]>
  );

  return (
    <div className="chart-type-selector">
      <h4 className="selector-title">
        {language === 'vi' ? 'Loại biểu đồ' : 'Chart Type'}
      </h4>

      {Object.entries(groupedOptions).map(([category, options]) => (
        <div key={category} className="chart-type-category">
          <span className="category-label">
            {CATEGORIES[category as keyof typeof CATEGORIES][language]}
          </span>
          <div className="chart-type-grid">
            {options.map((option) => (
              <button
                key={option.type}
                className={`chart-type-button ${
                  selectedType === option.type ? 'selected' : ''
                }`}
                onClick={() => onChange(option.type)}
                disabled={disabled}
                title={language === 'vi' ? option.nameVi : option.nameEn}
              >
                <span className="chart-type-icon">{option.icon}</span>
                <span className="chart-type-name">
                  {language === 'vi' ? option.nameVi : option.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChartTypeSelector;
