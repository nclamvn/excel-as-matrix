// =============================================================================
// CHART GENERATOR — Generate chart configurations from data
// =============================================================================

import type {
  ChartType,
  ChartConfig,
  ChartData,
  DataRange,
  DataCharacteristics,
  SeriesConfig,
  AxisConfig,
  ColorScheme,
} from './types';
import { getRecommendedScheme, getColorByIndex } from './ColorSchemes';

/**
 * Generates chart configurations from data
 */
export class ChartGenerator {
  /**
   * Generate chart config for a specific chart type
   */
  generate(
    type: ChartType,
    data: DataRange,
    characteristics: DataCharacteristics,
    options: {
      colorScheme?: ColorScheme;
      title?: string;
      subtitle?: string;
    } = {}
  ): ChartConfig {
    const colorScheme = options.colorScheme || getRecommendedScheme(type);

    // Build chart data
    const chartData = this.buildChartData(data, characteristics, colorScheme);

    // Build series configuration
    const series = this.buildSeriesConfig(data, characteristics, colorScheme, type);

    // Build axis configuration
    const { xAxis, yAxis } = this.buildAxisConfig(characteristics, type);

    // Generate title if not provided
    const title = options.title || this.generateTitle(data, characteristics, type);
    const subtitle = options.subtitle || this.generateSubtitle(data, characteristics);

    return {
      type,
      title,
      subtitle,
      data: chartData,
      xAxis,
      yAxis,
      series,
      legend: {
        show: series.length > 1 || ['pie', 'donut'].includes(type),
        position: 'bottom',
        align: 'center',
      },
      colorScheme,
      style: this.getDefaultStyle(colorScheme),
      interactive: true,
      tooltip: {
        enabled: true,
        showTitle: true,
        shared: !['scatter', 'bubble'].includes(type),
      },
    };
  }

  /**
   * Build chart data from raw data
   */
  private buildChartData(
    data: DataRange,
    characteristics: DataCharacteristics,
    colorScheme: ColorScheme
  ): ChartData {
    // Find category/label column
    const categoryCol = characteristics.columns.find(
      (c) => c.suggestedRole === 'category' || c.suggestedRole === 'time'
    );

    // Find value columns
    const valueCols = characteristics.columns.filter(
      (c) => c.suggestedRole === 'value'
    );

    // Build labels
    const labels = categoryCol
      ? data.data.map((row) => String(row[categoryCol.index] || ''))
      : data.data.map((_, i) => `Row ${i + 1}`);

    // Build datasets
    const datasets = valueCols.map((col, index) => {
      const values = data.data.map((row) => {
        const value = row[col.index];
        if (typeof value === 'number') return value;
        const parsed = parseFloat(String(value).replace(/[$€¥£,\s%]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      });

      const color = getColorByIndex(colorScheme, index);

      return {
        label: col.name,
        data: values,
        color,
        backgroundColor: color,
        borderColor: color,
        fill: false,
      };
    });

    // If no value columns found, use all numeric columns
    if (datasets.length === 0) {
      for (let col = 0; col < data.colCount; col++) {
        const colData = characteristics.columns[col];
        if (colData?.dataType === 'number') {
          const values = data.data.map((row) => {
            const value = row[col];
            return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
          });

          const color = getColorByIndex(colorScheme, datasets.length);
          datasets.push({
            label: data.headers[col] || `Series ${col + 1}`,
            data: values,
            color,
            backgroundColor: color,
            borderColor: color,
            fill: false,
          });
        }
      }
    }

    return {
      labels,
      datasets,
      sourceRange: data.sourceRange,
    };
  }

  /**
   * Build series configuration
   */
  private buildSeriesConfig(
    data: DataRange,
    characteristics: DataCharacteristics,
    colorScheme: ColorScheme,
    chartType: ChartType
  ): SeriesConfig[] {
    const valueCols = characteristics.columns.filter(
      (c) => c.suggestedRole === 'value' || c.dataType === 'number'
    );

    return valueCols.map((col, index) => ({
      name: col.name || data.headers[col.index] || `Series ${index + 1}`,
      dataKey: `series${index}`,
      color: getColorByIndex(colorScheme, index),
      lineStyle: 'solid',
      showPoints: chartType === 'line' && data.rowCount <= 20,
      chartType: chartType === 'combo' ? (index === 0 ? 'column' : 'line') : undefined,
      fillOpacity: chartType === 'area' ? 0.3 : undefined,
    }));
  }

  /**
   * Build axis configuration
   */
  private buildAxisConfig(
    characteristics: DataCharacteristics,
    type: ChartType
  ): { xAxis?: AxisConfig; yAxis?: AxisConfig } {
    // No axes for pie, donut, gauge, kpi
    if (['pie', 'donut', 'gauge', 'kpi', 'treemap'].includes(type)) {
      return {};
    }

    const categoryCol = characteristics.columns.find(
      (c) => c.suggestedRole === 'category' || c.suggestedRole === 'time'
    );

    const valueCol = characteristics.columns.find(
      (c) => c.suggestedRole === 'value' || c.dataType === 'number'
    );

    const xAxis: AxisConfig = {
      type: categoryCol?.dataType === 'date' ? 'time' : 'category',
      label: categoryCol?.name,
      showGrid: false,
    };

    const yAxis: AxisConfig = {
      type: 'linear',
      label: valueCol?.name,
      showGrid: true,
      gridColor: '#e5e7eb',
    };

    // Swap axes for horizontal bar chart
    if (type === 'bar') {
      return { xAxis: yAxis, yAxis: xAxis };
    }

    return { xAxis, yAxis };
  }

  /**
   * Generate chart title
   */
  private generateTitle(
    data: DataRange,
    characteristics: DataCharacteristics,
    type: ChartType
  ): string {
    const valueCol = characteristics.columns.find(
      (c) => c.suggestedRole === 'value'
    );
    const categoryCol = characteristics.columns.find(
      (c) => c.suggestedRole === 'category' || c.suggestedRole === 'time'
    );

    const valueName = valueCol?.name || data.headers[1] || 'Values';
    const categoryName = categoryCol?.name || data.headers[0] || 'Categories';

    switch (type) {
      case 'line':
      case 'area':
        return `${valueName} Over ${categoryName}`;
      case 'pie':
      case 'donut':
        return `${valueName} Distribution`;
      case 'bar':
      case 'column':
        return `${valueName} by ${categoryName}`;
      case 'scatter':
      case 'bubble':
        return `${valueName} vs ${categoryName}`;
      case 'heatmap':
        return `${valueName} Heatmap`;
      case 'funnel':
        return `${valueName} Funnel`;
      case 'waterfall':
        return `${valueName} Waterfall`;
      case 'radar':
        return `${valueName} Comparison`;
      case 'gauge':
        return valueName;
      case 'kpi':
        return valueName;
      default:
        return `${valueName} Analysis`;
    }
  }

  /**
   * Generate chart subtitle
   */
  private generateSubtitle(
    data: DataRange,
    _characteristics: DataCharacteristics
  ): string {
    return `${data.rowCount} data points`;
  }

  /**
   * Get default style configuration
   */
  private getDefaultStyle(colorScheme: ColorScheme) {
    return {
      backgroundColor: colorScheme.background || '#ffffff',
      borderRadius: 8,
      padding: 20,
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 18,
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
        size: 12,
        weight: '400',
        color: colorScheme.textColor || '#374151',
      },
      axisFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
        weight: '400',
        color: colorScheme.neutral || '#6b7280',
      },
      animation: true,
      shadow: false,
    };
  }

  /**
   * Generate quick chart (auto-detect best type)
   */
  generateQuick(
    data: DataRange,
    characteristics: DataCharacteristics
  ): ChartConfig {
    // Auto-detect best chart type
    const type = this.detectBestChartType(characteristics);
    return this.generate(type, data, characteristics);
  }

  /**
   * Detect best chart type based on data characteristics
   */
  private detectBestChartType(characteristics: DataCharacteristics): ChartType {
    // Time series -> line chart
    if (characteristics.hasTimeColumn) {
      return 'line';
    }

    // Multiple series -> grouped column
    if (characteristics.hasMultipleSeries && characteristics.hasCategoryColumn) {
      return 'column';
    }

    // Category with single value -> bar or pie
    if (characteristics.hasCategoryColumn) {
      const categoryCol = characteristics.columns.find(
        (c) => c.suggestedRole === 'category'
      );
      if (categoryCol && categoryCol.uniqueValues && categoryCol.uniqueValues <= 6) {
        return 'pie';
      }
      return 'column';
    }

    // Two numeric columns -> scatter
    const numericCols = characteristics.columns.filter(
      (c) => c.dataType === 'number'
    );
    if (numericCols.length >= 2) {
      return 'scatter';
    }

    // Default to column chart
    return 'column';
  }

  /**
   * Clone config with modifications
   */
  cloneConfig(
    config: ChartConfig,
    modifications: Partial<ChartConfig>
  ): ChartConfig {
    return {
      ...config,
      ...modifications,
      data: modifications.data || config.data,
      series: modifications.series || config.series,
      colorScheme: modifications.colorScheme || config.colorScheme,
      style: {
        ...config.style,
        ...(modifications.style || {}),
      },
    };
  }

  /**
   * Convert chart to different type
   */
  convertType(
    config: ChartConfig,
    newType: ChartType,
    colorScheme?: ColorScheme
  ): ChartConfig {
    const scheme = colorScheme || config.colorScheme;

    // Rebuild axes for new type
    let xAxis = config.xAxis;
    let yAxis = config.yAxis;

    if (['pie', 'donut', 'gauge', 'kpi', 'treemap'].includes(newType)) {
      xAxis = undefined;
      yAxis = undefined;
    } else if (newType === 'bar' && config.type !== 'bar') {
      // Swap axes for bar chart
      xAxis = config.yAxis;
      yAxis = config.xAxis;
    } else if (config.type === 'bar' && newType !== 'bar') {
      // Swap back from bar chart
      xAxis = config.yAxis;
      yAxis = config.xAxis;
    }

    return {
      ...config,
      type: newType,
      xAxis,
      yAxis,
      colorScheme: scheme,
      legend: {
        show: config.series.length > 1 || ['pie', 'donut'].includes(newType),
        position: config.legend?.position || 'bottom',
        align: config.legend?.align || 'center',
      },
    };
  }

  /**
   * Add series to existing config
   */
  addSeries(
    config: ChartConfig,
    data: number[],
    name: string
  ): ChartConfig {
    const newColor = getColorByIndex(config.colorScheme, config.series.length);

    const newDataset = {
      label: name,
      data,
      color: newColor,
      backgroundColor: newColor,
      borderColor: newColor,
      fill: config.type === 'area',
    };

    const newSeries: SeriesConfig = {
      name,
      dataKey: `series${config.series.length}`,
      color: newColor,
      lineStyle: 'solid',
    };

    return {
      ...config,
      data: {
        ...config.data,
        datasets: [...config.data.datasets, newDataset],
      },
      series: [...config.series, newSeries],
      legend: {
        show: true,
        position: config.legend?.position || 'bottom',
        align: config.legend?.align || 'center',
      },
    };
  }

  /**
   * Remove series from config
   */
  removeSeries(config: ChartConfig, seriesIndex: number): ChartConfig {
    if (config.series.length <= 1) return config;

    return {
      ...config,
      data: {
        ...config.data,
        datasets: config.data.datasets.filter((_, i) => i !== seriesIndex),
      },
      series: config.series.filter((_, i) => i !== seriesIndex),
    };
  }
}
