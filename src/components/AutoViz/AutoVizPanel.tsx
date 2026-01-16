// =============================================================================
// AUTO-VIZ PANEL — Main panel for automatic visualization
// =============================================================================

import React, { useState, useCallback } from 'react';
import type {
  DataRange,
  ChartRecommendation,
  ChartConfig,
  ChartInsight,
} from '../../autoviz/types';
import { autoVizEngine } from '../../autoviz';
import { RecommendationCard } from './RecommendationCard';
import { ChartPreview } from './ChartPreview';
import { InsightPanel } from './InsightPanel';
import { ChartTypeSelector } from './ChartTypeSelector';
import { ColorSchemeSelector } from './ColorSchemeSelector';
import { NLQueryInput } from './NLQueryInput';
import { ChartCustomizer } from './ChartCustomizer';

interface AutoVizPanelProps {
  data: DataRange | null;
  onChartCreate?: (config: ChartConfig) => void;
  onClose?: () => void;
  language?: 'en' | 'vi';
}

type TabType = 'recommend' | 'customize' | 'nlquery';

export const AutoVizPanel: React.FC<AutoVizPanelProps> = ({
  data,
  onChartCreate,
  onClose,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ChartRecommendation | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ChartConfig | null>(null);
  const [insights, setInsights] = useState<ChartInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze data and get recommendations
  const handleAnalyze = useCallback(async () => {
    if (!data) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const recs = await autoVizEngine.recommend(data);
      setRecommendations(recs);

      if (recs.length > 0) {
        setSelectedRecommendation(recs[0]);
        const config = await autoVizEngine.createChart(recs[0], data, {
          autoBeautify: true,
          addInsights: true,
        });
        setCurrentConfig(config);
      }

      const extractedInsights = autoVizEngine.extractInsights(data);
      setInsights(extractedInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [data]);

  // Handle recommendation selection
  const handleSelectRecommendation = useCallback(
    async (rec: ChartRecommendation) => {
      if (!data) return;

      setSelectedRecommendation(rec);
      try {
        const config = await autoVizEngine.createChart(rec, data, {
          autoBeautify: true,
          addInsights: true,
        });
        setCurrentConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create chart');
      }
    },
    [data]
  );

  // Handle chart type change
  const handleChartTypeChange = useCallback(
    (type: string) => {
      if (!currentConfig) return;
      const newConfig = autoVizEngine.convertChartType(currentConfig, type as any);
      setCurrentConfig(newConfig);
    },
    [currentConfig]
  );

  // Handle color scheme change
  const handleColorSchemeChange = useCallback(
    (schemeName: string) => {
      if (!currentConfig) return;
      const newConfig = autoVizEngine.changeColorScheme(currentConfig, schemeName);
      setCurrentConfig(newConfig);
    },
    [currentConfig]
  );

  // Handle NL query
  const handleNLQuery = useCallback(
    async (queryText: string) => {
      if (!data) return;

      try {
        const { config } = await autoVizEngine.createFromNL(
          { text: queryText, language: 'auto' },
          data
        );
        if (config) {
          setCurrentConfig(config);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Query failed');
      }
    },
    [data]
  );

  // Handle config update from customizer
  const handleConfigUpdate = useCallback((config: ChartConfig) => {
    setCurrentConfig(config);
  }, []);

  // Handle create chart
  const handleCreate = useCallback(() => {
    if (currentConfig && onChartCreate) {
      onChartCreate(currentConfig);
    }
  }, [currentConfig, onChartCreate]);

  // Auto-analyze when data changes
  React.useEffect(() => {
    if (data && recommendations.length === 0) {
      handleAnalyze();
    }
  }, [data, recommendations.length, handleAnalyze]);

  const labels = {
    en: {
      title: 'Auto-Viz',
      subtitle: 'AI-Powered Chart Recommendations',
      recommend: 'Recommendations',
      customize: 'Customize',
      nlquery: 'Ask AI',
      analyze: 'Analyze Data',
      analyzing: 'Analyzing...',
      create: 'Create Chart',
      noData: 'Select data range to visualize',
      recommendations: 'Chart Recommendations',
      insights: 'Data Insights',
    },
    vi: {
      title: 'Auto-Viz',
      subtitle: 'Đề xuất biểu đồ bằng AI',
      recommend: 'Đề xuất',
      customize: 'Tùy chỉnh',
      nlquery: 'Hỏi AI',
      analyze: 'Phân tích',
      analyzing: 'Đang phân tích...',
      create: 'Tạo biểu đồ',
      noData: 'Chọn vùng dữ liệu để trực quan hóa',
      recommendations: 'Đề xuất biểu đồ',
      insights: 'Thông tin dữ liệu',
    },
  };

  const t = labels[language];

  return (
    <div className="auto-viz-panel">
      {/* Header */}
      <div className="auto-viz-header">
        <div className="auto-viz-title-section">
          <h2 className="auto-viz-title">{t.title}</h2>
          <span className="auto-viz-subtitle">{t.subtitle}</span>
        </div>
        {onClose && (
          <button className="auto-viz-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="auto-viz-tabs">
        <button
          className={`auto-viz-tab ${activeTab === 'recommend' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommend')}
        >
          {t.recommend}
        </button>
        <button
          className={`auto-viz-tab ${activeTab === 'customize' ? 'active' : ''}`}
          onClick={() => setActiveTab('customize')}
        >
          {t.customize}
        </button>
        <button
          className={`auto-viz-tab ${activeTab === 'nlquery' ? 'active' : ''}`}
          onClick={() => setActiveTab('nlquery')}
        >
          {t.nlquery}
        </button>
      </div>

      {/* Content */}
      <div className="auto-viz-content">
        {!data ? (
          <div className="auto-viz-empty">
            <div className="auto-viz-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <p>{t.noData}</p>
          </div>
        ) : (
          <>
            {/* Preview Section */}
            <div className="auto-viz-preview-section">
              {currentConfig ? (
                <ChartPreview config={currentConfig} />
              ) : (
                <div className="auto-viz-preview-placeholder">
                  {isAnalyzing ? t.analyzing : t.noData}
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'recommend' && (
              <div className="auto-viz-recommend-section">
                <h3 className="auto-viz-section-title">{t.recommendations}</h3>
                <div className="auto-viz-recommendations">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      isSelected={selectedRecommendation?.id === rec.id}
                      onSelect={() => handleSelectRecommendation(rec)}
                      language={language}
                    />
                  ))}
                </div>

                {insights.length > 0 && (
                  <>
                    <h3 className="auto-viz-section-title">{t.insights}</h3>
                    <InsightPanel insights={insights} language={language} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'customize' && currentConfig && (
              <div className="auto-viz-customize-section">
                <ChartTypeSelector
                  selectedType={currentConfig.type}
                  onChange={handleChartTypeChange}
                  language={language}
                />
                <ColorSchemeSelector
                  selectedScheme={currentConfig.colorScheme.name}
                  onChange={handleColorSchemeChange}
                  language={language}
                />
                <ChartCustomizer
                  config={currentConfig}
                  onChange={handleConfigUpdate}
                  language={language}
                />
              </div>
            )}

            {activeTab === 'nlquery' && (
              <div className="auto-viz-nlquery-section">
                <NLQueryInput
                  onQuery={handleNLQuery}
                  suggestions={data ? autoVizEngine.getQuerySuggestions(data) : []}
                  language={language}
                />
              </div>
            )}
          </>
        )}

        {error && <div className="auto-viz-error">{error}</div>}
      </div>

      {/* Footer */}
      <div className="auto-viz-footer">
        <button
          className="auto-viz-btn auto-viz-btn-secondary"
          onClick={handleAnalyze}
          disabled={!data || isAnalyzing}
        >
          {isAnalyzing ? t.analyzing : t.analyze}
        </button>
        <button
          className="auto-viz-btn auto-viz-btn-primary"
          onClick={handleCreate}
          disabled={!currentConfig}
        >
          {t.create}
        </button>
      </div>
    </div>
  );
};

export default AutoVizPanel;
