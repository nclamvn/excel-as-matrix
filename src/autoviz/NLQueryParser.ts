// =============================================================================
// NL QUERY PARSER — Parse natural language chart requests
// =============================================================================

import type {
  NLChartQuery,
  NLParseResult,
  ChartType,
  ChartIntent,
  NLFilter,
  DataRange,
} from './types';

/**
 * Pattern definition for matching
 */
interface QueryPattern {
  keywords: string[];
  keywordsVi?: string[];
  chartType?: ChartType;
  intent: ChartIntent;
  priority: number;
}

/**
 * Defined query patterns
 */
const QUERY_PATTERNS: QueryPattern[] = [
  // Trend patterns
  {
    keywords: ['trend', 'over time', 'timeline', 'growth', 'change over', 'evolution'],
    keywordsVi: ['xu hướng', 'theo thời gian', 'biến đổi', 'tăng trưởng', 'thay đổi'],
    chartType: 'line',
    intent: 'show_trend',
    priority: 10,
  },
  // Comparison patterns
  {
    keywords: ['compare', 'comparison', 'versus', 'vs', 'against', 'difference'],
    keywordsVi: ['so sánh', 'đối chiếu', 'khác biệt', 'giữa'],
    chartType: 'column',
    intent: 'compare_values',
    priority: 9,
  },
  // Composition patterns
  {
    keywords: ['breakdown', 'composition', 'distribution', 'share', 'proportion', 'percentage', 'parts'],
    keywordsVi: ['phân bổ', 'cấu thành', 'tỷ lệ', 'phần trăm', 'thị phần'],
    chartType: 'pie',
    intent: 'show_composition',
    priority: 9,
  },
  // Ranking patterns
  {
    keywords: ['top', 'bottom', 'rank', 'ranking', 'best', 'worst', 'highest', 'lowest'],
    keywordsVi: ['top', 'cao nhất', 'thấp nhất', 'xếp hạng', 'tốt nhất', 'kém nhất'],
    chartType: 'bar',
    intent: 'show_ranking',
    priority: 8,
  },
  // Relationship patterns
  {
    keywords: ['relationship', 'correlation', 'scatter', 'connection', 'link'],
    keywordsVi: ['mối quan hệ', 'tương quan', 'liên kết', 'kết nối'],
    chartType: 'scatter',
    intent: 'show_relationship',
    priority: 8,
  },
  // Distribution patterns
  {
    keywords: ['distribution', 'spread', 'histogram', 'frequency'],
    keywordsVi: ['phân phối', 'tần suất', 'histogram'],
    chartType: 'column',
    intent: 'show_distribution',
    priority: 7,
  },
  // Funnel patterns
  {
    keywords: ['funnel', 'pipeline', 'stages', 'conversion', 'drop-off', 'dropoff'],
    keywordsVi: ['phễu', 'quy trình', 'giai đoạn', 'chuyển đổi'],
    chartType: 'funnel',
    intent: 'show_change',
    priority: 7,
  },
  // Heatmap patterns
  {
    keywords: ['heatmap', 'heat map', 'matrix', 'density'],
    keywordsVi: ['bản đồ nhiệt', 'ma trận', 'mật độ'],
    chartType: 'heatmap',
    intent: 'show_correlation',
    priority: 7,
  },
  // Area patterns
  {
    keywords: ['area', 'volume', 'cumulative', 'stacked'],
    keywordsVi: ['vùng', 'tích lũy', 'xếp chồng'],
    chartType: 'area',
    intent: 'show_trend',
    priority: 6,
  },
  // Radar patterns
  {
    keywords: ['radar', 'spider', 'profile', 'characteristics'],
    keywordsVi: ['radar', 'đặc điểm', 'hồ sơ'],
    chartType: 'radar',
    intent: 'compare_values',
    priority: 6,
  },
  // KPI patterns
  {
    keywords: ['kpi', 'metric', 'single number', 'score'],
    keywordsVi: ['chỉ số', 'điểm số', 'đơn'],
    chartType: 'kpi',
    intent: 'show_change',
    priority: 5,
  },
  // Gauge patterns
  {
    keywords: ['gauge', 'progress', 'target', 'goal'],
    keywordsVi: ['đồng hồ', 'tiến độ', 'mục tiêu'],
    chartType: 'gauge',
    intent: 'show_change',
    priority: 5,
  },
  // Explicit chart type mentions
  {
    keywords: ['line chart', 'line graph'],
    keywordsVi: ['biểu đồ đường'],
    chartType: 'line',
    intent: 'show_trend',
    priority: 10,
  },
  {
    keywords: ['bar chart', 'bar graph'],
    keywordsVi: ['biểu đồ cột ngang'],
    chartType: 'bar',
    intent: 'compare_values',
    priority: 10,
  },
  {
    keywords: ['column chart', 'column graph'],
    keywordsVi: ['biểu đồ cột'],
    chartType: 'column',
    intent: 'compare_values',
    priority: 10,
  },
  {
    keywords: ['pie chart', 'pie graph'],
    keywordsVi: ['biểu đồ tròn'],
    chartType: 'pie',
    intent: 'show_composition',
    priority: 10,
  },
  {
    keywords: ['donut chart', 'doughnut'],
    keywordsVi: ['biểu đồ vành khuyên', 'biểu đồ donut'],
    chartType: 'donut',
    intent: 'show_composition',
    priority: 10,
  },
];

/**
 * Filter operator patterns for advanced query parsing
 */
export const FILTER_PATTERNS = {
  equals: ['=', 'equals', 'is', 'bằng', 'là'],
  contains: ['contains', 'includes', 'has', 'chứa', 'có'],
  greater: ['>', 'greater than', 'more than', 'above', 'lớn hơn', 'trên'],
  less: ['<', 'less than', 'below', 'under', 'nhỏ hơn', 'dưới'],
  between: ['between', 'from...to', 'trong khoảng', 'từ...đến'],
};

/**
 * Time range patterns
 */
const TIME_PATTERNS = [
  { pattern: /last\s+(\d+)\s+(day|week|month|year)s?/i, type: 'relative' },
  { pattern: /this\s+(week|month|quarter|year)/i, type: 'current' },
  { pattern: /(\d{4})/i, type: 'year' },
  { pattern: /q[1-4]\s+\d{4}/i, type: 'quarter' },
  { pattern: /tuần này|tháng này|năm nay/i, type: 'current_vi' },
  { pattern: /(\d+)\s+(ngày|tuần|tháng|năm)\s+qua/i, type: 'relative_vi' },
];

/**
 * Parses natural language queries for chart creation
 */
export class NLQueryParser {
  /**
   * Parse a natural language query
   */
  parse(query: NLChartQuery, dataRange?: DataRange): NLParseResult {
    const text = query.text.toLowerCase();
    const language = query.language === 'auto' ? this.detectLanguage(text) : query.language;

    // Find matching pattern
    const matchedPattern = this.findBestPattern(text, language);

    // Extract metrics (column references)
    const metrics = this.extractMetrics(text, dataRange);

    // Extract dimensions (grouping columns)
    const dimensions = this.extractDimensions(text, dataRange);

    // Extract filters
    const filters = this.extractFilters(text);

    // Extract time range
    const timeRange = this.extractTimeRange(text);

    // Calculate confidence
    const confidence = this.calculateConfidence(
      matchedPattern,
      metrics,
      dimensions,
      filters
    );

    return {
      understood: confidence > 0.3,
      intent: matchedPattern?.intent || 'compare_values',
      chartType: matchedPattern?.chartType,
      metrics,
      dimensions,
      filters,
      timeRange,
      confidence,
    };
  }

  /**
   * Detect language of query
   */
  private detectLanguage(text: string): 'en' | 'vi' {
    const viPatterns = [
      /biểu đồ/i,
      /hiển thị/i,
      /so sánh/i,
      /xu hướng/i,
      /tháng/i,
      /năm/i,
      /tỷ lệ/i,
    ];

    for (const pattern of viPatterns) {
      if (pattern.test(text)) {
        return 'vi';
      }
    }

    return 'en';
  }

  /**
   * Find best matching pattern
   */
  private findBestPattern(
    text: string,
    language: 'en' | 'vi'
  ): QueryPattern | null {
    let bestMatch: QueryPattern | null = null;
    let bestScore = 0;

    for (const pattern of QUERY_PATTERNS) {
      const keywords = language === 'vi'
        ? [...pattern.keywords, ...(pattern.keywordsVi || [])]
        : pattern.keywords;

      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += pattern.priority;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  /**
   * Extract metrics from query
   */
  private extractMetrics(text: string, dataRange?: DataRange): string[] {
    const metrics: string[] = [];

    if (!dataRange) return metrics;

    // Check if any column names are mentioned
    for (const header of dataRange.headers) {
      if (header && text.toLowerCase().includes(header.toLowerCase())) {
        metrics.push(header);
      }
    }

    // Common metric keywords
    const metricKeywords = [
      'sales', 'revenue', 'profit', 'cost', 'count', 'amount', 'total',
      'average', 'sum', 'quantity', 'price', 'value',
      'doanh thu', 'lợi nhuận', 'chi phí', 'số lượng', 'giá', 'tổng',
    ];

    for (const keyword of metricKeywords) {
      if (text.includes(keyword.toLowerCase()) && !metrics.includes(keyword)) {
        metrics.push(keyword);
      }
    }

    return metrics;
  }

  /**
   * Extract dimensions from query
   */
  private extractDimensions(text: string, dataRange?: DataRange): string[] {
    const dimensions: string[] = [];

    if (!dataRange) return dimensions;

    // Check column names
    for (const header of dataRange.headers) {
      if (header && text.toLowerCase().includes(header.toLowerCase())) {
        // Skip if already in metrics (likely a measure)
        dimensions.push(header);
      }
    }

    // Common dimension keywords
    const dimensionKeywords = [
      'by', 'per', 'each', 'group by', 'category', 'region', 'product',
      'customer', 'date', 'month', 'year', 'quarter',
      'theo', 'mỗi', 'từng', 'nhóm', 'danh mục', 'vùng', 'sản phẩm',
      'khách hàng', 'ngày', 'tháng', 'năm', 'quý',
    ];

    for (const keyword of dimensionKeywords) {
      const regex = new RegExp(`${keyword}\\s+(\\w+)`, 'i');
      const match = text.match(regex);
      if (match && match[1] && !dimensions.includes(match[1])) {
        dimensions.push(match[1]);
      }
    }

    return dimensions;
  }

  /**
   * Extract filters from query
   */
  private extractFilters(text: string): NLFilter[] {
    const filters: NLFilter[] = [];

    // Pattern: "where/when X is/equals Y"
    const wherePattern = /(?:where|when|với|khi)\s+(\w+)\s+(?:is|=|equals|bằng|là)\s+["']?([^"'\s]+)["']?/gi;
    let match;

    while ((match = wherePattern.exec(text)) !== null) {
      filters.push({
        column: match[1],
        operator: 'equals',
        value: match[2],
      });
    }

    // Pattern: "X > Y" or "X greater than Y"
    const greaterPattern = /(\w+)\s+(?:>|greater than|more than|lớn hơn)\s+(\d+)/gi;
    while ((match = greaterPattern.exec(text)) !== null) {
      filters.push({
        column: match[1],
        operator: 'greater',
        value: parseFloat(match[2]),
      });
    }

    // Pattern: "X < Y" or "X less than Y"
    const lessPattern = /(\w+)\s+(?:<|less than|nhỏ hơn)\s+(\d+)/gi;
    while ((match = lessPattern.exec(text)) !== null) {
      filters.push({
        column: match[1],
        operator: 'less',
        value: parseFloat(match[2]),
      });
    }

    // Pattern: "top N"
    const topPattern = /top\s+(\d+)/i;
    const topMatch = text.match(topPattern);
    if (topMatch) {
      filters.push({
        column: '_limit',
        operator: 'equals',
        value: parseInt(topMatch[1], 10),
      });
    }

    return filters;
  }

  /**
   * Extract time range from query
   */
  private extractTimeRange(text: string): string | undefined {
    for (const { pattern, type: _type } of TIME_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    pattern: QueryPattern | null,
    metrics: string[],
    dimensions: string[],
    filters: NLFilter[]
  ): number {
    let confidence = 0;

    // Pattern match contributes most
    if (pattern) {
      confidence += 0.5;
    }

    // Metrics found
    if (metrics.length > 0) {
      confidence += 0.2;
    }

    // Dimensions found
    if (dimensions.length > 0) {
      confidence += 0.15;
    }

    // Filters found
    if (filters.length > 0) {
      confidence += 0.15;
    }

    return Math.min(1, confidence);
  }

  /**
   * Get suggested chart types for intent
   */
  getSuggestedChartTypes(intent: ChartIntent): ChartType[] {
    const suggestions: Record<ChartIntent, ChartType[]> = {
      show_trend: ['line', 'area', 'sparkline'],
      compare_values: ['column', 'bar', 'radar'],
      show_composition: ['pie', 'donut', 'treemap', 'stacked_bar'],
      show_distribution: ['column', 'scatter', 'heatmap'],
      show_relationship: ['scatter', 'bubble', 'heatmap'],
      show_ranking: ['bar', 'column', 'funnel'],
      show_change: ['waterfall', 'kpi', 'gauge'],
      show_correlation: ['scatter', 'heatmap', 'bubble'],
    };

    return suggestions[intent] || ['column'];
  }

  /**
   * Generate query suggestions based on data
   */
  generateSuggestions(dataRange: DataRange): string[] {
    const suggestions: string[] = [];
    const headers = dataRange.headers.filter((h) => h);

    if (headers.length >= 2) {
      suggestions.push(`Show ${headers[1]} by ${headers[0]}`);
      suggestions.push(`Compare ${headers[1]} across ${headers[0]}`);
      suggestions.push(`Show trend of ${headers[1]} over time`);
      suggestions.push(`Top 10 ${headers[0]} by ${headers[1]}`);
    }

    if (headers.length >= 3) {
      suggestions.push(`Show ${headers[1]} and ${headers[2]} by ${headers[0]}`);
    }

    return suggestions;
  }

  /**
   * Format parse result as human-readable text
   */
  formatResult(result: NLParseResult, language: 'en' | 'vi' = 'en'): string {
    if (!result.understood) {
      return language === 'en'
        ? "I couldn't understand the request. Please try rephrasing."
        : 'Tôi không hiểu yêu cầu. Vui lòng thử diễn đạt lại.';
    }

    const parts: string[] = [];

    if (language === 'en') {
      parts.push(`Intent: ${result.intent.replace(/_/g, ' ')}`);
      if (result.chartType) {
        parts.push(`Suggested chart: ${result.chartType}`);
      }
      if (result.metrics && result.metrics.length > 0) {
        parts.push(`Metrics: ${result.metrics.join(', ')}`);
      }
      if (result.dimensions && result.dimensions.length > 0) {
        parts.push(`Dimensions: ${result.dimensions.join(', ')}`);
      }
      parts.push(`Confidence: ${Math.round(result.confidence * 100)}%`);
    } else {
      parts.push(`Ý định: ${result.intent.replace(/_/g, ' ')}`);
      if (result.chartType) {
        parts.push(`Biểu đồ đề xuất: ${result.chartType}`);
      }
      if (result.metrics && result.metrics.length > 0) {
        parts.push(`Chỉ số: ${result.metrics.join(', ')}`);
      }
      if (result.dimensions && result.dimensions.length > 0) {
        parts.push(`Chiều: ${result.dimensions.join(', ')}`);
      }
      parts.push(`Độ tin cậy: ${Math.round(result.confidence * 100)}%`);
    }

    return parts.join('\n');
  }
}
