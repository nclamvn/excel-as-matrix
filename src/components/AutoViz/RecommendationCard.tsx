// =============================================================================
// RECOMMENDATION CARD — Display chart recommendation
// =============================================================================

import React from 'react';
import type { ChartRecommendation } from '../../autoviz/types';

interface RecommendationCardProps {
  recommendation: ChartRecommendation;
  isSelected: boolean;
  onSelect: () => void;
  language?: 'en' | 'vi';
}

const CHART_ICONS: Record<string, React.ReactNode> = {
  line: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8"/>
      <circle cx="9" cy="11" r="1"/>
      <circle cx="13" cy="15" r="1"/>
      <circle cx="21" cy="7" r="1"/>
    </svg>
  ),
  bar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="4" height="18"/>
      <rect x="10" y="8" width="4" height="13"/>
      <rect x="17" y="5" width="4" height="16"/>
    </svg>
  ),
  column: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="12" width="5" height="9"/>
      <rect x="9.5" y="6" width="5" height="15"/>
      <rect x="16" y="9" width="5" height="12"/>
    </svg>
  ),
  pie: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3v9l6.36 6.36"/>
    </svg>
  ),
  donut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 3v5M12 16v5"/>
    </svg>
  ),
  area: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V10l6 4 6-8 6 6v9H3z" fill="currentColor" opacity="0.2"/>
      <path d="M3 10l6 4 6-8 6 6"/>
    </svg>
  ),
  scatter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="15" r="2"/>
      <circle cx="9" cy="9" r="2"/>
      <circle cx="15" cy="12" r="2"/>
      <circle cx="19" cy="6" r="2"/>
    </svg>
  ),
  heatmap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="6" height="6"/>
      <rect x="9" y="3" width="6" height="6" fill="currentColor" opacity="0.3"/>
      <rect x="15" y="3" width="6" height="6" fill="currentColor" opacity="0.6"/>
      <rect x="3" y="9" width="6" height="6" fill="currentColor" opacity="0.5"/>
      <rect x="9" y="9" width="6" height="6"/>
      <rect x="15" y="9" width="6" height="6" fill="currentColor" opacity="0.2"/>
      <rect x="3" y="15" width="6" height="6" fill="currentColor" opacity="0.8"/>
      <rect x="9" y="15" width="6" height="6" fill="currentColor" opacity="0.4"/>
      <rect x="15" y="15" width="6" height="6"/>
    </svg>
  ),
  funnel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4h18l-6 8v8l-4-2v-6l-8-8z"/>
    </svg>
  ),
  radar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 22,8.5 19,20 5,20 2,8.5"/>
      <polygon points="12,6 17,10 15,17 9,17 7,10" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  gauge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/>
      <path d="M12 12l4-4"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  kpi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 12h8M12 8v8"/>
    </svg>
  ),
};

const CHART_NAMES: Record<string, { en: string; vi: string }> = {
  line: { en: 'Line Chart', vi: 'Biểu đồ đường' },
  bar: { en: 'Bar Chart', vi: 'Biểu đồ cột ngang' },
  column: { en: 'Column Chart', vi: 'Biểu đồ cột' },
  pie: { en: 'Pie Chart', vi: 'Biểu đồ tròn' },
  donut: { en: 'Donut Chart', vi: 'Biểu đồ vành khuyên' },
  area: { en: 'Area Chart', vi: 'Biểu đồ vùng' },
  scatter: { en: 'Scatter Plot', vi: 'Biểu đồ phân tán' },
  bubble: { en: 'Bubble Chart', vi: 'Biểu đồ bong bóng' },
  heatmap: { en: 'Heatmap', vi: 'Bản đồ nhiệt' },
  treemap: { en: 'Treemap', vi: 'Treemap' },
  funnel: { en: 'Funnel Chart', vi: 'Biểu đồ phễu' },
  waterfall: { en: 'Waterfall Chart', vi: 'Biểu đồ thác nước' },
  radar: { en: 'Radar Chart', vi: 'Biểu đồ radar' },
  combo: { en: 'Combo Chart', vi: 'Biểu đồ kết hợp' },
  gauge: { en: 'Gauge', vi: 'Đồng hồ' },
  kpi: { en: 'KPI Card', vi: 'Thẻ KPI' },
  sparkline: { en: 'Sparkline', vi: 'Sparkline' },
  stacked_bar: { en: 'Stacked Bar', vi: 'Cột xếp chồng' },
  stacked_area: { en: 'Stacked Area', vi: 'Vùng xếp chồng' },
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isSelected,
  onSelect,
  language = 'en',
}) => {
  const chartName = CHART_NAMES[recommendation.chartType]?.[language] || recommendation.chartType;
  const reason = language === 'vi' ? recommendation.reasonVi : recommendation.reason;
  const insight = language === 'vi' ? recommendation.insightVi : recommendation.insight;

  return (
    <div
      className={`recommendation-card ${isSelected ? 'selected' : ''} ${
        recommendation.isTopRecommendation ? 'top-recommendation' : ''
      }`}
      onClick={onSelect}
    >
      {/* Badge */}
      {recommendation.isTopRecommendation && (
        <div className="recommendation-badge">
          {language === 'vi' ? 'Đề xuất hàng đầu' : 'Top Pick'}
        </div>
      )}

      {/* Header */}
      <div className="recommendation-header">
        <div className="recommendation-icon">
          {CHART_ICONS[recommendation.chartType] || CHART_ICONS.column}
        </div>
        <div className="recommendation-info">
          <h4 className="recommendation-name">{chartName}</h4>
          <div className="recommendation-score">
            <div className="score-bar">
              <div
                className="score-fill"
                style={{ width: `${recommendation.score}%` }}
              />
            </div>
            <span className="score-value">{recommendation.score}%</span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <p className="recommendation-reason">{reason}</p>

      {/* Insight */}
      {insight && (
        <div className="recommendation-insight">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span>{insight}</span>
        </div>
      )}

      {/* Pros & Cons */}
      <div className="recommendation-details">
        {recommendation.pros.length > 0 && (
          <div className="recommendation-pros">
            {recommendation.pros.slice(0, 2).map((pro, i) => (
              <span key={i} className="pro-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {pro}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Alternatives */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div className="recommendation-alternatives">
          <span className="alternatives-label">
            {language === 'vi' ? 'Thay thế:' : 'Alternatives:'}
          </span>
          {recommendation.alternatives.slice(0, 2).map((alt, i) => (
            <span key={i} className="alternative-chip">
              {CHART_NAMES[alt]?.[language] || alt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
