// =============================================================================
// NL QUERY INPUT — Natural language query input for charts
// =============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface NLQueryInputProps {
  onQuery: (query: string) => void;
  suggestions?: string[];
  language?: 'en' | 'vi';
  placeholder?: string;
  disabled?: boolean;
}

export const NLQueryInput: React.FC<NLQueryInputProps> = ({
  onQuery,
  suggestions = [],
  language = 'en',
  placeholder,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder =
    language === 'vi'
      ? 'Mô tả biểu đồ bạn muốn tạo...'
      : 'Describe the chart you want to create...';

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim() || disabled) return;

      setIsLoading(true);
      try {
        await onQuery(query.trim());
        setQuery('');
      } finally {
        setIsLoading(false);
      }
    },
    [query, onQuery, disabled]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const labels = {
    en: {
      title: 'Ask AI to Create Chart',
      subtitle: 'Describe what you want to visualize in natural language',
      examples: 'Try asking:',
      submit: 'Create',
      loading: 'Creating...',
    },
    vi: {
      title: 'Yêu cầu AI tạo biểu đồ',
      subtitle: 'Mô tả những gì bạn muốn trực quan hóa',
      examples: 'Thử hỏi:',
      submit: 'Tạo',
      loading: 'Đang tạo...',
    },
  };

  const t = labels[language];

  const exampleQueries =
    language === 'vi'
      ? [
          'Hiển thị xu hướng doanh thu theo tháng',
          'So sánh doanh số giữa các sản phẩm',
          'Biểu đồ tròn phân bổ chi phí',
          'Top 10 khách hàng theo doanh thu',
        ]
      : [
          'Show revenue trend over time',
          'Compare sales across products',
          'Pie chart of cost breakdown',
          'Top 10 customers by revenue',
        ];

  return (
    <div className="nl-query-input">
      <div className="nl-query-header">
        <h4 className="nl-query-title">{t.title}</h4>
        <p className="nl-query-subtitle">{t.subtitle}</p>
      </div>

      <form className="nl-query-form" onSubmit={handleSubmit}>
        <div className="nl-query-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            disabled={disabled || isLoading}
            className="nl-query-field"
          />
          <button
            type="submit"
            disabled={!query.trim() || disabled || isLoading}
            className="nl-query-submit"
          >
            {isLoading ? (
              <svg className="loading-spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
            <span>{isLoading ? t.loading : t.submit}</span>
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="nl-query-suggestions"
            onClick={(e) => e.stopPropagation()}
          >
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Example queries */}
      <div className="nl-query-examples">
        <span className="examples-label">{t.examples}</span>
        <div className="examples-list">
          {exampleQueries.map((example, i) => (
            <button
              key={i}
              type="button"
              className="example-chip"
              onClick={() => handleSuggestionClick(example)}
              disabled={disabled}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* AI Icon */}
      <div className="nl-query-ai-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="8" cy="14" r="1"/>
          <circle cx="16" cy="14" r="1"/>
        </svg>
        <span>{language === 'vi' ? 'Hỗ trợ bởi AI' : 'AI Powered'}</span>
      </div>
    </div>
  );
};

export default NLQueryInput;
