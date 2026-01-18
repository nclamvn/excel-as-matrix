// ============================================================
// CHART TEMPLATES DIALOG — Browse and Apply Chart Templates
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Star,
  Clock,
  Grid3X3,
  BarChart2,
  LineChart,
  PieChart,
  TrendingUp,
  Layers,
  DollarSign,
  Palette,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';
import { useChartTemplateStore } from '../../stores/chartTemplateStore';
import {
  ChartTemplate,
  ChartTemplateCategory,
  ColorScheme,
  ChartType,
} from '../../types/visualization';
import './Charts.css';

interface ChartTemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ChartTemplate, colorScheme?: ColorScheme) => void;
}

type TabType = 'all' | 'favorites' | 'recent' | 'custom';

const CATEGORY_CONFIG: Record<ChartTemplateCategory, { label: string; icon: React.ReactNode }> = {
  basic: { label: 'Basic', icon: <Grid3X3 size={14} /> },
  comparison: { label: 'Comparison', icon: <BarChart2 size={14} /> },
  trend: { label: 'Trend', icon: <TrendingUp size={14} /> },
  distribution: { label: 'Distribution', icon: <LineChart size={14} /> },
  composition: { label: 'Composition', icon: <PieChart size={14} /> },
  financial: { label: 'Financial', icon: <DollarSign size={14} /> },
  custom: { label: 'Custom', icon: <Layers size={14} /> },
};

const CHART_TYPE_ICONS: Partial<Record<ChartType, React.ReactNode>> = {
  ColumnClustered: <BarChart2 size={24} />,
  Bar: <BarChart2 size={24} className="rotate-90" />,
  Line: <LineChart size={24} />,
  Pie: <PieChart size={24} />,
  Area: <TrendingUp size={24} />,
  Scatter: <Grid3X3 size={24} />,
  Combo: <Layers size={24} />,
};

export const ChartTemplatesDialog: React.FC<ChartTemplatesDialogProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const {
    getTemplates,
    getFavoriteTemplates,
    getRecentTemplates,
    toggleFavorite,
    isFavorite,
    addToRecent,
    duplicateTemplate,
    deleteCustomTemplate,
    getColorSchemes,
    customTemplates,
  } = useChartTemplateStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<ChartTemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ChartTemplate | null>(null);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorSchemes = getColorSchemes();

  const templates = useMemo(() => {
    let result: ChartTemplate[] = [];

    switch (activeTab) {
      case 'favorites':
        result = getFavoriteTemplates();
        break;
      case 'recent':
        result = getRecentTemplates();
        break;
      case 'custom':
        result = customTemplates;
        break;
      default:
        result = getTemplates(selectedCategory === 'all' ? undefined : selectedCategory);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [
    activeTab,
    selectedCategory,
    searchQuery,
    getTemplates,
    getFavoriteTemplates,
    getRecentTemplates,
    customTemplates,
  ]);

  const handleSelectTemplate = (template: ChartTemplate) => {
    setSelectedTemplate(template);
    setSelectedColorScheme(null);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      addToRecent(selectedTemplate.id);
      onSelectTemplate(selectedTemplate, selectedColorScheme || undefined);
      onClose();
    }
  };

  const handleDuplicate = (template: ChartTemplate) => {
    duplicateTemplate(template.id);
  };

  const handleDelete = (template: ChartTemplate) => {
    if (!template.isBuiltIn) {
      deleteCustomTemplate(template.id);
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    }
  };

  const renderTemplatePreview = (template: ChartTemplate) => {
    const isDark = template.style.backgroundColor === '#1E1E1E';

    return (
      <div
        className="template-preview"
        style={{
          backgroundColor: template.style.backgroundColor,
          borderColor: template.style.borderColor,
        }}
      >
        <div className="preview-chart-icon" style={{ color: isDark ? '#fff' : '#333' }}>
          {CHART_TYPE_ICONS[template.chartType] || <BarChart2 size={24} />}
        </div>
        <div className="preview-color-bar">
          {template.colorScheme.slice(0, 5).map((color, i) => (
            <div
              key={i}
              className="color-sample"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="chart-templates-overlay" onClick={onClose}>
      <div className="chart-templates-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="templates-header">
          <h2>Chart Templates</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="templates-content">
          {/* Sidebar */}
          <div className="templates-sidebar">
            {/* Tabs */}
            <div className="sidebar-tabs">
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <Grid3X3 size={14} />
                <span>All Templates</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <Star size={14} />
                <span>Favorites</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                <Clock size={14} />
                <span>Recent</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
                onClick={() => setActiveTab('custom')}
              >
                <Layers size={14} />
                <span>My Templates</span>
              </button>
            </div>

            {/* Categories (only show for 'all' tab) */}
            {activeTab === 'all' && (
              <div className="category-list">
                <h4>Categories</h4>
                <button
                  className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </button>
                {(Object.keys(CATEGORY_CONFIG) as ChartTemplateCategory[]).map(category => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {CATEGORY_CONFIG[category].icon}
                    <span>{CATEGORY_CONFIG[category].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="templates-main">
            {/* Search */}
            <div className="templates-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Templates Grid */}
            <div className="templates-grid">
              {templates.length === 0 ? (
                <div className="no-templates">
                  <p>No templates found</p>
                </div>
              ) : (
                templates.map(template => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    {renderTemplatePreview(template)}
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                    </div>
                    <div className="template-actions">
                      <button
                        className={`action-btn ${isFavorite(template.id) ? 'favorited' : ''}`}
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite(template.id);
                        }}
                        title="Toggle favorite"
                      >
                        <Star size={14} fill={isFavorite(template.id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={e => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                        title="Duplicate template"
                      >
                        <Copy size={14} />
                      </button>
                      {!template.isBuiltIn && (
                        <button
                          className="action-btn danger"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(template);
                          }}
                          title="Delete template"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="templates-preview">
            {selectedTemplate ? (
              <>
                <h3>Preview</h3>
                <div className="preview-large">
                  {renderTemplatePreview(selectedTemplate)}
                </div>
                <div className="preview-details">
                  <h4>{selectedTemplate.name}</h4>
                  <p>{selectedTemplate.description}</p>
                  <div className="detail-row">
                    <span>Type:</span>
                    <span>{selectedTemplate.chartType}</span>
                  </div>
                  <div className="detail-row">
                    <span>Category:</span>
                    <span>{CATEGORY_CONFIG[selectedTemplate.category].label}</span>
                  </div>
                </div>

                {/* Color Scheme Selector */}
                <div className="color-scheme-section">
                  <button
                    className="color-scheme-toggle"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  >
                    <Palette size={14} />
                    <span>Change Color Scheme</span>
                  </button>

                  {showColorPicker && (
                    <div className="color-schemes-grid">
                      {colorSchemes.map(scheme => (
                        <button
                          key={scheme.id}
                          className={`color-scheme-option ${selectedColorScheme?.id === scheme.id ? 'selected' : ''}`}
                          onClick={() => setSelectedColorScheme(scheme)}
                          title={scheme.name}
                        >
                          <div className="scheme-colors">
                            {scheme.colors.slice(0, 4).map((color, i) => (
                              <div
                                key={i}
                                className="scheme-color"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {selectedColorScheme?.id === scheme.id && (
                            <Check size={12} className="check-icon" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="apply-btn" onClick={handleApplyTemplate}>
                  Apply Template
                </button>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a template to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartTemplatesDialog;
