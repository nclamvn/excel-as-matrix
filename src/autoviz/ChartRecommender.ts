// =============================================================================
// CHART RECOMMENDER — Recommend best chart types based on data
// =============================================================================

import type {
  ChartType,
  ChartRecommendation,
  DataCharacteristics,
  DataRange,
  ChartConfig,
  ChartPreview,
} from './types';
import { getRecommendedScheme } from './ColorSchemes';

/**
 * Score weights for chart recommendation
 */
interface ScoreFactors {
  dataFit: number; // How well data fits chart type (0-40)
  insightClarity: number; // How clearly insights are shown (0-30)
  aesthetics: number; // Visual appeal for data type (0-15)
  familiarity: number; // How familiar users are with chart (0-15)
}

/**
 * Chart type metadata for recommendations
 */
interface ChartMetadata {
  type: ChartType;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  bestFor: string[];
  bestForVi: string[];
  pros: string[];
  prosVi: string[];
  cons: string[];
  consVi: string[];
  minRows: number;
  maxCategories: number;
  requiresNumeric: boolean;
  requiresTime: boolean;
  supportsMultipleSeries: boolean;
}

/**
 * Chart metadata definitions
 */
const CHART_METADATA: ChartMetadata[] = [
  {
    type: 'line',
    name: 'Line Chart',
    nameVi: 'Biểu đồ đường',
    description: 'Shows trends over time or continuous data',
    descriptionVi: 'Hiển thị xu hướng theo thời gian hoặc dữ liệu liên tục',
    bestFor: ['time series', 'trends', 'continuous data'],
    bestForVi: ['chuỗi thời gian', 'xu hướng', 'dữ liệu liên tục'],
    pros: ['Shows trends clearly', 'Easy to compare multiple series', 'Familiar to users'],
    prosVi: ['Hiển thị xu hướng rõ ràng', 'Dễ so sánh nhiều series', 'Quen thuộc với người dùng'],
    cons: ['Not good for categories', 'Can be cluttered with many series'],
    consVi: ['Không phù hợp cho danh mục', 'Có thể rối với nhiều series'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'bar',
    name: 'Bar Chart',
    nameVi: 'Biểu đồ cột ngang',
    description: 'Compares values across categories (horizontal)',
    descriptionVi: 'So sánh giá trị giữa các danh mục (nằm ngang)',
    bestFor: ['category comparison', 'rankings', 'long labels'],
    bestForVi: ['so sánh danh mục', 'xếp hạng', 'nhãn dài'],
    pros: ['Good for long category names', 'Easy to read rankings', 'Clear comparisons'],
    prosVi: ['Phù hợp với tên dài', 'Dễ đọc xếp hạng', 'So sánh rõ ràng'],
    cons: ['Limited categories', 'Not for time series'],
    consVi: ['Giới hạn số danh mục', 'Không phù hợp chuỗi thời gian'],
    minRows: 2,
    maxCategories: 15,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'column',
    name: 'Column Chart',
    nameVi: 'Biểu đồ cột',
    description: 'Compares values across categories (vertical)',
    descriptionVi: 'So sánh giá trị giữa các danh mục (thẳng đứng)',
    bestFor: ['category comparison', 'time periods', 'grouped data'],
    bestForVi: ['so sánh danh mục', 'khoảng thời gian', 'dữ liệu nhóm'],
    pros: ['Intuitive for comparisons', 'Works well with time', 'Supports grouping'],
    prosVi: ['Trực quan cho so sánh', 'Phù hợp với thời gian', 'Hỗ trợ nhóm'],
    cons: ['Long labels get cut off', 'Limited to ~10 categories'],
    consVi: ['Nhãn dài bị cắt', 'Giới hạn khoảng 10 danh mục'],
    minRows: 2,
    maxCategories: 12,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'pie',
    name: 'Pie Chart',
    nameVi: 'Biểu đồ tròn',
    description: 'Shows parts of a whole',
    descriptionVi: 'Hiển thị tỷ lệ các phần trong tổng thể',
    bestFor: ['proportions', 'percentages', 'market share'],
    bestForVi: ['tỷ lệ', 'phần trăm', 'thị phần'],
    pros: ['Shows composition clearly', 'Familiar to everyone', 'Good for few categories'],
    prosVi: ['Hiển thị cấu thành rõ ràng', 'Quen thuộc với mọi người', 'Phù hợp ít danh mục'],
    cons: ['Hard to compare slices', 'Max 5-6 categories', 'No negative values'],
    consVi: ['Khó so sánh các phần', 'Tối đa 5-6 danh mục', 'Không có giá trị âm'],
    minRows: 2,
    maxCategories: 6,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'donut',
    name: 'Donut Chart',
    nameVi: 'Biểu đồ vành khuyên',
    description: 'Like pie but with center space for metrics',
    descriptionVi: 'Như biểu đồ tròn nhưng có không gian trung tâm',
    bestFor: ['proportions with total', 'KPI display', 'modern dashboards'],
    bestForVi: ['tỷ lệ với tổng', 'hiển thị KPI', 'dashboard hiện đại'],
    pros: ['More modern look', 'Center can show total', 'Less visual distortion'],
    prosVi: ['Giao diện hiện đại', 'Trung tâm hiển thị tổng', 'Ít méo thị giác'],
    cons: ['Same as pie chart', 'Not for many categories'],
    consVi: ['Giống biểu đồ tròn', 'Không phù hợp nhiều danh mục'],
    minRows: 2,
    maxCategories: 6,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'area',
    name: 'Area Chart',
    nameVi: 'Biểu đồ vùng',
    description: 'Shows magnitude over time with filled area',
    descriptionVi: 'Hiển thị độ lớn theo thời gian với vùng tô màu',
    bestFor: ['cumulative totals', 'trends with volume', 'time series'],
    bestForVi: ['tổng tích lũy', 'xu hướng với khối lượng', 'chuỗi thời gian'],
    pros: ['Emphasizes magnitude', 'Good for cumulative data', 'Visually impactful'],
    prosVi: ['Nhấn mạnh độ lớn', 'Phù hợp dữ liệu tích lũy', 'Ấn tượng thị giác'],
    cons: ['Can obscure data', 'Not for comparing series'],
    consVi: ['Có thể che khuất dữ liệu', 'Không tốt cho so sánh series'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'stacked_bar',
    name: 'Stacked Bar Chart',
    nameVi: 'Biểu đồ cột xếp chồng',
    description: 'Shows composition within categories',
    descriptionVi: 'Hiển thị cấu thành trong từng danh mục',
    bestFor: ['part-to-whole by category', 'composition comparison'],
    bestForVi: ['tỷ lệ theo danh mục', 'so sánh cấu thành'],
    pros: ['Shows composition', 'Compares totals and parts', 'Space efficient'],
    prosVi: ['Hiển thị cấu thành', 'So sánh tổng và phần', 'Tiết kiệm không gian'],
    cons: ['Hard to compare middle segments', 'Limited series'],
    consVi: ['Khó so sánh phần giữa', 'Giới hạn số series'],
    minRows: 2,
    maxCategories: 10,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'stacked_area',
    name: 'Stacked Area Chart',
    nameVi: 'Biểu đồ vùng xếp chồng',
    description: 'Shows how composition changes over time',
    descriptionVi: 'Hiển thị cấu thành thay đổi theo thời gian',
    bestFor: ['part-to-whole over time', 'cumulative trends'],
    bestForVi: ['tỷ lệ theo thời gian', 'xu hướng tích lũy'],
    pros: ['Shows composition changes', 'Cumulative view', 'Time-based insights'],
    prosVi: ['Hiển thị thay đổi cấu thành', 'Góc nhìn tích lũy', 'Phân tích theo thời gian'],
    cons: ['Hard to read individual series', 'Can be misleading'],
    consVi: ['Khó đọc từng series', 'Có thể gây hiểu nhầm'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: true,
    supportsMultipleSeries: true,
  },
  {
    type: 'scatter',
    name: 'Scatter Plot',
    nameVi: 'Biểu đồ phân tán',
    description: 'Shows relationship between two variables',
    descriptionVi: 'Hiển thị mối quan hệ giữa hai biến',
    bestFor: ['correlations', 'distributions', 'outlier detection'],
    bestForVi: ['tương quan', 'phân phối', 'phát hiện ngoại lệ'],
    pros: ['Shows relationships', 'Identifies clusters', 'Reveals outliers'],
    prosVi: ['Hiển thị quan hệ', 'Xác định cụm', 'Phát hiện ngoại lệ'],
    cons: ['Needs two numeric columns', 'Can be hard to interpret'],
    consVi: ['Cần hai cột số', 'Có thể khó diễn giải'],
    minRows: 5,
    maxCategories: 500,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'bubble',
    name: 'Bubble Chart',
    nameVi: 'Biểu đồ bong bóng',
    description: 'Scatter plot with size dimension',
    descriptionVi: 'Biểu đồ phân tán với chiều kích thước',
    bestFor: ['three-variable analysis', 'portfolio analysis'],
    bestForVi: ['phân tích ba biến', 'phân tích danh mục'],
    pros: ['Shows three dimensions', 'Visually engaging', 'Good for portfolios'],
    prosVi: ['Hiển thị ba chiều', 'Hấp dẫn thị giác', 'Phù hợp phân tích danh mục'],
    cons: ['Can be cluttered', 'Size is hard to compare precisely'],
    consVi: ['Có thể rối', 'Khó so sánh chính xác kích thước'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'heatmap',
    name: 'Heatmap',
    nameVi: 'Bản đồ nhiệt',
    description: 'Shows patterns in matrix data with colors',
    descriptionVi: 'Hiển thị mẫu trong dữ liệu ma trận bằng màu sắc',
    bestFor: ['correlation matrices', 'time patterns', 'density'],
    bestForVi: ['ma trận tương quan', 'mẫu thời gian', 'mật độ'],
    pros: ['Reveals patterns', 'Compact for large data', 'Good for matrices'],
    prosVi: ['Phát hiện mẫu', 'Gọn cho dữ liệu lớn', 'Phù hợp ma trận'],
    cons: ['Needs specific data format', 'Color perception issues'],
    consVi: ['Cần định dạng dữ liệu cụ thể', 'Vấn đề nhận biết màu'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'treemap',
    name: 'Treemap',
    nameVi: 'Biểu đồ Treemap',
    description: 'Shows hierarchical data as nested rectangles',
    descriptionVi: 'Hiển thị dữ liệu phân cấp dạng hình chữ nhật lồng',
    bestFor: ['hierarchical data', 'budget allocation', 'file sizes'],
    bestForVi: ['dữ liệu phân cấp', 'phân bổ ngân sách', 'kích thước tệp'],
    pros: ['Efficient space usage', 'Shows hierarchy', 'Part-to-whole'],
    prosVi: ['Sử dụng không gian hiệu quả', 'Hiển thị phân cấp', 'Tỷ lệ phần-tổng'],
    cons: ['Hard to compare sizes', 'Labels can be cut off'],
    consVi: ['Khó so sánh kích thước', 'Nhãn có thể bị cắt'],
    minRows: 2,
    maxCategories: 30,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'funnel',
    name: 'Funnel Chart',
    nameVi: 'Biểu đồ phễu',
    description: 'Shows stages in a process',
    descriptionVi: 'Hiển thị các giai đoạn trong quy trình',
    bestFor: ['sales pipeline', 'conversion rates', 'process stages'],
    bestForVi: ['quy trình bán hàng', 'tỷ lệ chuyển đổi', 'giai đoạn quy trình'],
    pros: ['Shows drop-off clearly', 'Intuitive for processes', 'Marketing favorite'],
    prosVi: ['Hiển thị rõ sự giảm', 'Trực quan cho quy trình', 'Ưa thích trong marketing'],
    cons: ['Only for sequential data', 'Limited use cases'],
    consVi: ['Chỉ cho dữ liệu tuần tự', 'Trường hợp sử dụng hạn chế'],
    minRows: 2,
    maxCategories: 8,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'waterfall',
    name: 'Waterfall Chart',
    nameVi: 'Biểu đồ thác nước',
    description: 'Shows cumulative effect of sequential values',
    descriptionVi: 'Hiển thị hiệu ứng tích lũy của giá trị tuần tự',
    bestFor: ['financial analysis', 'profit/loss', 'budget changes'],
    bestForVi: ['phân tích tài chính', 'lãi/lỗ', 'thay đổi ngân sách'],
    pros: ['Shows incremental changes', 'Good for finance', 'Clear running total'],
    prosVi: ['Hiển thị thay đổi từng bước', 'Tốt cho tài chính', 'Tổng chạy rõ ràng'],
    cons: ['Specific use case', 'Can be complex'],
    consVi: ['Trường hợp sử dụng cụ thể', 'Có thể phức tạp'],
    minRows: 2,
    maxCategories: 15,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'radar',
    name: 'Radar Chart',
    nameVi: 'Biểu đồ radar',
    description: 'Shows multiple variables on axes from center',
    descriptionVi: 'Hiển thị nhiều biến trên các trục từ tâm',
    bestFor: ['performance comparison', 'skill profiles', 'product features'],
    bestForVi: ['so sánh hiệu suất', 'hồ sơ kỹ năng', 'tính năng sản phẩm'],
    pros: ['Compares multiple dimensions', 'Good for profiles', 'Visually distinctive'],
    prosVi: ['So sánh nhiều chiều', 'Phù hợp cho hồ sơ', 'Trực quan độc đáo'],
    cons: ['Hard to read', 'Limited categories', 'Area can be misleading'],
    consVi: ['Khó đọc', 'Giới hạn danh mục', 'Diện tích có thể gây hiểu nhầm'],
    minRows: 3,
    maxCategories: 8,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'combo',
    name: 'Combo Chart',
    nameVi: 'Biểu đồ kết hợp',
    description: 'Combines bars and lines for dual metrics',
    descriptionVi: 'Kết hợp cột và đường cho hai loại số liệu',
    bestFor: ['different scales', 'actual vs target', 'mixed metrics'],
    bestForVi: ['thang đo khác nhau', 'thực tế vs mục tiêu', 'số liệu hỗn hợp'],
    pros: ['Shows different metrics together', 'Dual axis support', 'Flexible'],
    prosVi: ['Hiển thị các số liệu khác nhau', 'Hỗ trợ hai trục', 'Linh hoạt'],
    cons: ['Can be confusing', 'Dual axis can mislead'],
    consVi: ['Có thể gây nhầm lẫn', 'Hai trục có thể gây hiểu sai'],
    minRows: 2,
    maxCategories: 20,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: true,
  },
  {
    type: 'gauge',
    name: 'Gauge Chart',
    nameVi: 'Biểu đồ đồng hồ',
    description: 'Shows single value against a target',
    descriptionVi: 'Hiển thị giá trị đơn so với mục tiêu',
    bestFor: ['KPIs', 'progress', 'performance metrics'],
    bestForVi: ['KPI', 'tiến độ', 'chỉ số hiệu suất'],
    pros: ['Clear single metric', 'Shows progress', 'Dashboard favorite'],
    prosVi: ['Số liệu đơn rõ ràng', 'Hiển thị tiến độ', 'Ưa thích trên dashboard'],
    cons: ['Single value only', 'Takes space'],
    consVi: ['Chỉ một giá trị', 'Chiếm nhiều không gian'],
    minRows: 1,
    maxCategories: 1,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'kpi',
    name: 'KPI Card',
    nameVi: 'Thẻ KPI',
    description: 'Displays key metric with optional trend',
    descriptionVi: 'Hiển thị chỉ số chính với xu hướng tùy chọn',
    bestFor: ['single metrics', 'dashboard headers', 'quick stats'],
    bestForVi: ['số liệu đơn', 'tiêu đề dashboard', 'thống kê nhanh'],
    pros: ['Clear and concise', 'Shows change', 'Dashboard essential'],
    prosVi: ['Rõ ràng và súc tích', 'Hiển thị thay đổi', 'Thiết yếu cho dashboard'],
    cons: ['Very limited data', 'No detail'],
    consVi: ['Dữ liệu rất hạn chế', 'Không chi tiết'],
    minRows: 1,
    maxCategories: 1,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
  {
    type: 'sparkline',
    name: 'Sparkline',
    nameVi: 'Đường sparkline',
    description: 'Tiny inline chart showing trend',
    descriptionVi: 'Biểu đồ nhỏ inline hiển thị xu hướng',
    bestFor: ['tables', 'compact trends', 'inline data'],
    bestForVi: ['bảng', 'xu hướng gọn', 'dữ liệu inline'],
    pros: ['Very compact', 'Shows trend quickly', 'Table friendly'],
    prosVi: ['Rất gọn', 'Hiển thị xu hướng nhanh', 'Phù hợp bảng'],
    cons: ['No labels', 'No detail', 'Hard to read exact values'],
    consVi: ['Không có nhãn', 'Không chi tiết', 'Khó đọc giá trị chính xác'],
    minRows: 3,
    maxCategories: 50,
    requiresNumeric: true,
    requiresTime: false,
    supportsMultipleSeries: false,
  },
];

/**
 * Recommends charts based on data characteristics
 */
export class ChartRecommender {
  /**
   * Generate chart recommendations for data
   */
  recommend(
    data: DataRange,
    characteristics: DataCharacteristics
  ): ChartRecommendation[] {
    const scores: { type: ChartType; score: number; factors: ScoreFactors }[] = [];

    for (const metadata of CHART_METADATA) {
      const factors = this.calculateScoreFactors(metadata, data, characteristics);
      const totalScore = this.calculateTotalScore(factors);

      if (totalScore > 20) {
        // Minimum threshold
        scores.push({
          type: metadata.type,
          score: totalScore,
          factors,
        });
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Convert to recommendations
    const recommendations: ChartRecommendation[] = [];

    for (let i = 0; i < Math.min(scores.length, 5); i++) {
      const { type, score } = scores[i];
      const metadata = CHART_METADATA.find((m) => m.type === type)!;

      recommendations.push({
        id: `rec-${type}-${Date.now()}`,
        chartType: type,
        score: Math.round(score),
        reason: this.generateReason(metadata, characteristics),
        reasonVi: this.generateReasonVi(metadata, characteristics),
        insight: this.generateInsight(type, characteristics),
        insightVi: this.generateInsightVi(type, characteristics),
        preview: this.createPreview(type, data),
        suggestedConfig: this.createSuggestedConfig(type, data, characteristics),
        isTopRecommendation: i === 0,
        alternatives: scores.slice(i + 1, i + 4).map((s) => s.type),
        pros: metadata.pros,
        cons: metadata.cons,
      });
    }

    return recommendations;
  }

  /**
   * Calculate score factors for a chart type
   */
  private calculateScoreFactors(
    metadata: ChartMetadata,
    data: DataRange,
    characteristics: DataCharacteristics
  ): ScoreFactors {
    const factors: ScoreFactors = {
      dataFit: 0,
      insightClarity: 0,
      aesthetics: 0,
      familiarity: 0,
    };

    // Data fit scoring (0-40)
    factors.dataFit = this.calculateDataFit(metadata, data, characteristics);

    // Insight clarity (0-30)
    factors.insightClarity = this.calculateInsightClarity(metadata, characteristics);

    // Aesthetics (0-15)
    factors.aesthetics = this.calculateAesthetics(metadata, data);

    // Familiarity (0-15)
    factors.familiarity = this.calculateFamiliarity(metadata);

    return factors;
  }

  /**
   * Calculate data fit score
   */
  private calculateDataFit(
    metadata: ChartMetadata,
    data: DataRange,
    characteristics: DataCharacteristics
  ): number {
    let score = 0;

    // Row count check
    if (data.rowCount >= metadata.minRows) {
      score += 10;
    } else {
      return 0; // Disqualify
    }

    // Category count check
    const categoryCount =
      characteristics.columns.find((c) => c.suggestedRole === 'category')
        ?.uniqueValues || data.rowCount;

    if (categoryCount <= metadata.maxCategories) {
      score += 10;
    } else {
      score -= 10;
    }

    // Time column requirement
    if (metadata.requiresTime) {
      if (characteristics.hasTimeColumn) {
        score += 10;
      } else {
        score -= 15;
      }
    } else if (characteristics.hasTimeColumn) {
      // Bonus for time-friendly charts
      if (['line', 'area', 'stacked_area', 'sparkline'].includes(metadata.type)) {
        score += 5;
      }
    }

    // Multiple series support
    if (characteristics.hasMultipleSeries) {
      if (metadata.supportsMultipleSeries) {
        score += 5;
      } else {
        score -= 10;
      }
    }

    // Numeric requirement
    const numericCols = characteristics.columns.filter(
      (c) => c.dataType === 'number'
    ).length;

    if (metadata.requiresNumeric && numericCols === 0) {
      return 0; // Disqualify
    }

    if (numericCols >= 2 && ['scatter', 'bubble', 'heatmap'].includes(metadata.type)) {
      score += 5;
    }

    return Math.max(0, Math.min(40, score));
  }

  /**
   * Calculate insight clarity score
   */
  private calculateInsightClarity(
    metadata: ChartMetadata,
    characteristics: DataCharacteristics
  ): number {
    let score = 15; // Base score

    // Trend patterns
    const hasTrend = characteristics.patterns.some((p) => p.type === 'trend');
    if (hasTrend) {
      if (['line', 'area', 'sparkline'].includes(metadata.type)) {
        score += 10;
      }
    }

    // Correlation patterns
    const hasCorrelation = characteristics.patterns.some(
      (p) => p.type === 'correlation'
    );
    if (hasCorrelation) {
      if (['scatter', 'bubble', 'heatmap'].includes(metadata.type)) {
        score += 10;
      }
    }

    // Distribution patterns
    const hasDistribution = characteristics.patterns.some(
      (p) => p.type === 'distribution'
    );
    if (hasDistribution) {
      if (['scatter', 'column', 'bar'].includes(metadata.type)) {
        score += 5;
      }
    }

    // Category comparison
    if (characteristics.hasCategoryColumn && !characteristics.hasTimeColumn) {
      if (['bar', 'column', 'pie', 'donut', 'treemap'].includes(metadata.type)) {
        score += 5;
      }
    }

    return Math.min(30, score);
  }

  /**
   * Calculate aesthetics score
   */
  private calculateAesthetics(
    metadata: ChartMetadata,
    data: DataRange
  ): number {
    let score = 10;

    // Penalize cluttered charts
    if (data.rowCount > 20) {
      if (['pie', 'donut', 'radar'].includes(metadata.type)) {
        score -= 5;
      }
    }

    // Bonus for modern charts in appropriate contexts
    if (['donut', 'treemap', 'gauge', 'kpi'].includes(metadata.type)) {
      score += 3;
    }

    return Math.max(0, Math.min(15, score));
  }

  /**
   * Calculate familiarity score
   */
  private calculateFamiliarity(metadata: ChartMetadata): number {
    // Common charts get higher familiarity scores
    const familiarityMap: Record<ChartType, number> = {
      line: 15,
      bar: 15,
      column: 15,
      pie: 15,
      donut: 12,
      area: 10,
      scatter: 8,
      stacked_bar: 10,
      stacked_area: 8,
      bubble: 6,
      heatmap: 6,
      treemap: 5,
      funnel: 8,
      waterfall: 7,
      radar: 5,
      combo: 7,
      gauge: 10,
      kpi: 12,
      sparkline: 8,
    };

    return familiarityMap[metadata.type] || 5;
  }

  /**
   * Calculate total score from factors
   */
  private calculateTotalScore(factors: ScoreFactors): number {
    return (
      factors.dataFit +
      factors.insightClarity +
      factors.aesthetics +
      factors.familiarity
    );
  }

  /**
   * Generate English reason for recommendation
   */
  private generateReason(
    metadata: ChartMetadata,
    characteristics: DataCharacteristics
  ): string {
    const reasons: string[] = [];

    if (characteristics.hasTimeColumn && ['line', 'area'].includes(metadata.type)) {
      reasons.push('Your data has time values, perfect for showing trends');
    }

    if (
      characteristics.hasCategoryColumn &&
      ['bar', 'column', 'pie'].includes(metadata.type)
    ) {
      reasons.push('Categories in your data are ideal for comparison');
    }

    if (characteristics.hasMultipleSeries && metadata.supportsMultipleSeries) {
      reasons.push('Multiple data series can be compared effectively');
    }

    const trendPattern = characteristics.patterns.find((p) => p.type === 'trend');
    if (trendPattern && ['line', 'area'].includes(metadata.type)) {
      reasons.push(`Detected ${trendPattern.description.toLowerCase()}`);
    }

    if (reasons.length === 0) {
      reasons.push(metadata.description);
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Generate Vietnamese reason for recommendation
   */
  private generateReasonVi(
    metadata: ChartMetadata,
    characteristics: DataCharacteristics
  ): string {
    const reasons: string[] = [];

    if (characteristics.hasTimeColumn && ['line', 'area'].includes(metadata.type)) {
      reasons.push('Dữ liệu có giá trị thời gian, phù hợp để hiển thị xu hướng');
    }

    if (
      characteristics.hasCategoryColumn &&
      ['bar', 'column', 'pie'].includes(metadata.type)
    ) {
      reasons.push('Danh mục trong dữ liệu lý tưởng để so sánh');
    }

    if (characteristics.hasMultipleSeries && metadata.supportsMultipleSeries) {
      reasons.push('Có thể so sánh hiệu quả nhiều series dữ liệu');
    }

    if (reasons.length === 0) {
      reasons.push(metadata.descriptionVi);
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Generate insight text
   */
  private generateInsight(
    type: ChartType,
    characteristics: DataCharacteristics
  ): string {
    const insights: string[] = [];

    const trendPattern = characteristics.patterns.find((p) => p.type === 'trend');
    if (trendPattern) {
      insights.push(trendPattern.description);
    }

    const correlationPattern = characteristics.patterns.find(
      (p) => p.type === 'correlation'
    );
    if (correlationPattern) {
      insights.push(correlationPattern.description);
    }

    if (insights.length === 0) {
      const cols = characteristics.columns.filter((c) => c.suggestedRole === 'value');
      if (cols.length > 0) {
        const col = cols[0];
        if (col.min !== undefined && col.max !== undefined) {
          insights.push(
            `${col.name} ranges from ${col.min.toLocaleString()} to ${col.max.toLocaleString()}`
          );
        }
      }
    }

    return insights.join('. ') || `Visualize data with ${type} chart`;
  }

  /**
   * Generate Vietnamese insight text
   */
  private generateInsightVi(
    type: ChartType,
    characteristics: DataCharacteristics
  ): string {
    const metadata = CHART_METADATA.find((m) => m.type === type);
    const cols = characteristics.columns.filter((c) => c.suggestedRole === 'value');

    if (cols.length > 0 && cols[0].min !== undefined && cols[0].max !== undefined) {
      return `${cols[0].name} dao động từ ${cols[0].min.toLocaleString()} đến ${cols[0].max.toLocaleString()}`;
    }

    return `Trực quan hóa dữ liệu với ${metadata?.nameVi || 'biểu đồ'}`;
  }

  /**
   * Create chart preview
   */
  private createPreview(type: ChartType, data: DataRange): ChartPreview {
    return {
      width: 300,
      height: 200,
      config: this.createSuggestedConfig(type, data, {
        rowCount: data.rowCount,
        columnCount: data.colCount,
        columns: [],
        hasTimeColumn: false,
        hasCategoryColumn: true,
        hasMultipleSeries: false,
        patterns: [],
      }),
    };
  }

  /**
   * Create suggested chart configuration
   */
  private createSuggestedConfig(
    type: ChartType,
    data: DataRange,
    _characteristics: DataCharacteristics
  ): ChartConfig {
    const colorScheme = getRecommendedScheme(type);

    // Extract labels and datasets from data
    const labels = data.data.slice(0, Math.min(10, data.rowCount)).map(
      (row) => String(row[0] || '')
    );

    const datasets = [];
    for (let col = 1; col < Math.min(4, data.colCount); col++) {
      const values = data.data.slice(0, Math.min(10, data.rowCount)).map((row) => {
        const val = row[col];
        return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      });

      datasets.push({
        label: data.headers[col] || `Series ${col}`,
        data: values,
        color: colorScheme.colors[col - 1],
        backgroundColor: colorScheme.colors[col - 1],
        borderColor: colorScheme.colors[col - 1],
      });
    }

    return {
      type,
      title: `${data.headers[1] || 'Data'} by ${data.headers[0] || 'Category'}`,
      data: {
        labels,
        datasets,
        sourceRange: data.sourceRange,
      },
      series: datasets.map((ds, i) => ({
        name: ds.label,
        dataKey: `series${i}`,
        color: ds.color,
      })),
      colorScheme,
      style: {
        backgroundColor: colorScheme.background || '#ffffff',
        borderRadius: 8,
        padding: 16,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: '600',
          color: colorScheme.textColor || '#1f2937',
        },
        subtitleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: '400',
          color: colorScheme.neutral || '#6b7280',
        },
        labelFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 11,
          weight: '400',
          color: colorScheme.textColor || '#374151',
        },
        axisFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 10,
          weight: '400',
          color: colorScheme.neutral || '#6b7280',
        },
        animation: true,
      },
      interactive: true,
      legend: {
        show: datasets.length > 1,
        position: 'bottom',
        align: 'center',
      },
      tooltip: {
        enabled: true,
        showTitle: true,
        shared: true,
      },
    };
  }

  /**
   * Get metadata for a chart type
   */
  getChartMetadata(type: ChartType): ChartMetadata | undefined {
    return CHART_METADATA.find((m) => m.type === type);
  }

  /**
   * Get all chart types
   */
  getAllChartTypes(): ChartType[] {
    return CHART_METADATA.map((m) => m.type);
  }
}
