// =============================================================================
// CHART BEAUTIFIER — Apply professional styling to charts
// =============================================================================

import type {
  ChartConfig,
  ChartType,
  ChartStyle,
  ColorScheme,
  FontConfig,
} from './types';
import { COLOR_SCHEMES, adjustBrightness } from './ColorSchemes';

/**
 * Beautification preset options
 */
export type BeautifyPreset =
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'bold'
  | 'elegant'
  | 'dashboard'
  | 'presentation'
  | 'print';

/**
 * Beautification options
 */
export interface BeautifyOptions {
  preset?: BeautifyPreset;
  colorScheme?: string | ColorScheme;
  darkMode?: boolean;
  roundedCorners?: boolean;
  shadows?: boolean;
  gradients?: boolean;
  animations?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  spacing?: 'compact' | 'normal' | 'spacious';
}

/**
 * Preset configurations
 */
const PRESETS: Record<BeautifyPreset, Partial<BeautifyOptions>> = {
  modern: {
    colorScheme: 'modern',
    roundedCorners: true,
    shadows: false,
    gradients: true,
    animations: true,
    fontSize: 'medium',
    spacing: 'normal',
  },
  classic: {
    colorScheme: 'excel',
    roundedCorners: false,
    shadows: false,
    gradients: false,
    animations: false,
    fontSize: 'medium',
    spacing: 'normal',
  },
  minimal: {
    colorScheme: 'monochrome',
    roundedCorners: false,
    shadows: false,
    gradients: false,
    animations: false,
    fontSize: 'small',
    spacing: 'compact',
  },
  bold: {
    colorScheme: 'vibrant',
    roundedCorners: true,
    shadows: true,
    gradients: true,
    animations: true,
    fontSize: 'large',
    spacing: 'spacious',
  },
  elegant: {
    colorScheme: 'professional',
    roundedCorners: true,
    shadows: false,
    gradients: false,
    animations: true,
    fontSize: 'medium',
    spacing: 'normal',
  },
  dashboard: {
    colorScheme: 'professional',
    roundedCorners: true,
    shadows: true,
    gradients: false,
    animations: true,
    fontSize: 'small',
    spacing: 'compact',
  },
  presentation: {
    colorScheme: 'modern',
    roundedCorners: true,
    shadows: true,
    gradients: true,
    animations: true,
    fontSize: 'large',
    spacing: 'spacious',
  },
  print: {
    colorScheme: 'monochrome',
    roundedCorners: false,
    shadows: false,
    gradients: false,
    animations: false,
    fontSize: 'medium',
    spacing: 'normal',
  },
};

/**
 * Font size configurations
 */
const FONT_SIZES = {
  small: { title: 14, subtitle: 10, label: 10, axis: 9 },
  medium: { title: 18, subtitle: 12, label: 12, axis: 11 },
  large: { title: 24, subtitle: 14, label: 14, axis: 12 },
};

/**
 * Spacing configurations
 */
const SPACING = {
  compact: { padding: 12, borderRadius: 4 },
  normal: { padding: 20, borderRadius: 8 },
  spacious: { padding: 32, borderRadius: 12 },
};

/**
 * Applies professional styling to charts
 */
export class ChartBeautifier {
  /**
   * Beautify a chart configuration
   */
  beautify(config: ChartConfig, options: BeautifyOptions = {}): ChartConfig {
    // Apply preset if specified
    const resolvedOptions = this.resolveOptions(options);

    // Get color scheme
    const colorScheme = this.resolveColorScheme(
      resolvedOptions.colorScheme,
      resolvedOptions.darkMode
    );

    // Build new style
    const style = this.buildStyle(config.type, colorScheme, resolvedOptions);

    // Update colors in series
    const series = config.series.map((s, i) => ({
      ...s,
      color: colorScheme.colors[i % colorScheme.colors.length],
    }));

    // Update datasets
    const datasets = config.data.datasets.map((ds, i) => ({
      ...ds,
      color: colorScheme.colors[i % colorScheme.colors.length],
      backgroundColor: this.getBackgroundColor(
        config.type,
        colorScheme.colors[i % colorScheme.colors.length],
        resolvedOptions.gradients
      ),
      borderColor: colorScheme.colors[i % colorScheme.colors.length],
    }));

    // Update axis styling
    const xAxis = config.xAxis
      ? {
          ...config.xAxis,
          gridColor: colorScheme.gridColor,
        }
      : undefined;

    const yAxis = config.yAxis
      ? {
          ...config.yAxis,
          gridColor: colorScheme.gridColor,
        }
      : undefined;

    return {
      ...config,
      data: {
        ...config.data,
        datasets,
      },
      series,
      xAxis,
      yAxis,
      colorScheme,
      style,
      interactive: resolvedOptions.animations !== false,
    };
  }

  /**
   * Resolve options with preset
   */
  private resolveOptions(options: BeautifyOptions): Required<BeautifyOptions> {
    const preset = options.preset ? PRESETS[options.preset] : {};

    return {
      preset: options.preset || 'modern',
      colorScheme: options.colorScheme || preset.colorScheme || 'professional',
      darkMode: options.darkMode ?? false,
      roundedCorners: options.roundedCorners ?? preset.roundedCorners ?? true,
      shadows: options.shadows ?? preset.shadows ?? false,
      gradients: options.gradients ?? preset.gradients ?? false,
      animations: options.animations ?? preset.animations ?? true,
      fontSize: options.fontSize || preset.fontSize || 'medium',
      spacing: options.spacing || preset.spacing || 'normal',
    };
  }

  /**
   * Resolve color scheme
   */
  private resolveColorScheme(
    scheme: string | ColorScheme | undefined,
    darkMode?: boolean
  ): ColorScheme {
    if (typeof scheme === 'object' && scheme !== null) {
      return scheme;
    }

    if (darkMode) {
      return COLOR_SCHEMES.dark;
    }

    const schemeName = scheme || 'professional';
    return COLOR_SCHEMES[schemeName] || COLOR_SCHEMES.professional;
  }

  /**
   * Build style configuration
   */
  private buildStyle(
    _chartType: ChartType,
    colorScheme: ColorScheme,
    options: Required<BeautifyOptions>
  ): ChartStyle {
    const fontSizes = FONT_SIZES[options.fontSize];
    const spacing = SPACING[options.spacing];

    const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

    return {
      backgroundColor: colorScheme.background || '#ffffff',
      borderRadius: options.roundedCorners ? spacing.borderRadius : 0,
      padding: spacing.padding,
      titleFont: {
        family: fontFamily,
        size: fontSizes.title,
        weight: '600',
        color: colorScheme.textColor || '#1f2937',
      },
      subtitleFont: {
        family: fontFamily,
        size: fontSizes.subtitle,
        weight: '400',
        color: colorScheme.neutral || '#6b7280',
      },
      labelFont: {
        family: fontFamily,
        size: fontSizes.label,
        weight: '500',
        color: colorScheme.textColor || '#374151',
      },
      axisFont: {
        family: fontFamily,
        size: fontSizes.axis,
        weight: '400',
        color: colorScheme.neutral || '#6b7280',
      },
      animation: options.animations,
      shadow: options.shadows,
    };
  }

  /**
   * Get background color for chart elements
   */
  private getBackgroundColor(
    chartType: ChartType,
    baseColor: string,
    useGradient?: boolean
  ): string {
    // Filled charts get semi-transparent backgrounds
    if (['area', 'radar'].includes(chartType)) {
      return this.addAlpha(baseColor, 0.3);
    }

    // Pie/donut use solid colors
    if (['pie', 'donut'].includes(chartType)) {
      return baseColor;
    }

    // Bars can use gradients
    if (useGradient && ['bar', 'column'].includes(chartType)) {
      return `linear-gradient(180deg, ${baseColor} 0%, ${adjustBrightness(baseColor, -20)} 100%)`;
    }

    return baseColor;
  }

  /**
   * Add alpha to hex color
   */
  private addAlpha(hex: string, alpha: number): string {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${hex}${alphaHex}`;
  }

  /**
   * Apply specific beautification feature
   */
  applyFeature(
    config: ChartConfig,
    feature: 'shadow' | 'rounded' | 'gradient' | 'animation',
    enabled: boolean
  ): ChartConfig {
    switch (feature) {
      case 'shadow':
        return {
          ...config,
          style: { ...config.style, shadow: enabled },
        };

      case 'rounded':
        return {
          ...config,
          style: {
            ...config.style,
            borderRadius: enabled ? 8 : 0,
          },
        };

      case 'gradient':
        return {
          ...config,
          data: {
            ...config.data,
            datasets: config.data.datasets.map((ds) => ({
              ...ds,
              backgroundColor: enabled
                ? this.getBackgroundColor(config.type, ds.color || '#3b82f6', true)
                : ds.color,
            })),
          },
        };

      case 'animation':
        return {
          ...config,
          style: { ...config.style, animation: enabled },
          interactive: enabled,
        };

      default:
        return config;
    }
  }

  /**
   * Auto-beautify based on chart type
   */
  autoBeautify(config: ChartConfig): ChartConfig {
    // Choose best preset based on chart type
    const presetMap: Partial<Record<ChartType, BeautifyPreset>> = {
      line: 'elegant',
      bar: 'modern',
      column: 'modern',
      pie: 'bold',
      donut: 'bold',
      area: 'elegant',
      scatter: 'minimal',
      bubble: 'modern',
      heatmap: 'minimal',
      treemap: 'modern',
      funnel: 'modern',
      waterfall: 'elegant',
      radar: 'modern',
      combo: 'elegant',
      gauge: 'dashboard',
      kpi: 'dashboard',
      sparkline: 'minimal',
      stacked_bar: 'modern',
      stacked_area: 'elegant',
    };

    const preset = presetMap[config.type] || 'modern';
    return this.beautify(config, { preset });
  }

  /**
   * Get available presets
   */
  getPresets(): BeautifyPreset[] {
    return Object.keys(PRESETS) as BeautifyPreset[];
  }

  /**
   * Get preset configuration
   */
  getPresetConfig(preset: BeautifyPreset): Partial<BeautifyOptions> {
    return PRESETS[preset];
  }

  /**
   * Create custom font configuration
   */
  createFontConfig(
    family: string,
    size: number,
    weight: string,
    color: string
  ): FontConfig {
    return { family, size, weight, color };
  }

  /**
   * Apply title styling
   */
  styleTitle(
    config: ChartConfig,
    options: {
      text?: string;
      font?: Partial<FontConfig>;
      align?: 'left' | 'center' | 'right';
    }
  ): ChartConfig {
    return {
      ...config,
      title: options.text ?? config.title,
      style: {
        ...config.style,
        titleFont: {
          ...config.style.titleFont,
          ...options.font,
        },
      },
    };
  }

  /**
   * Apply legend styling
   */
  styleLegend(
    config: ChartConfig,
    options: {
      show?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      align?: 'start' | 'center' | 'end';
    }
  ): ChartConfig {
    return {
      ...config,
      legend: {
        ...config.legend,
        show: options.show ?? config.legend?.show ?? true,
        position: options.position ?? config.legend?.position ?? 'bottom',
        align: options.align ?? config.legend?.align ?? 'center',
      },
    };
  }

  /**
   * Generate CSS variables for chart
   */
  generateCssVariables(config: ChartConfig): Record<string, string> {
    const { colorScheme, style } = config;

    return {
      '--chart-bg': style.backgroundColor,
      '--chart-text': colorScheme.textColor || '#1f2937',
      '--chart-grid': colorScheme.gridColor || '#e5e7eb',
      '--chart-primary': colorScheme.colors[0],
      '--chart-secondary': colorScheme.colors[1] || colorScheme.colors[0],
      '--chart-positive': colorScheme.positive || '#22c55e',
      '--chart-negative': colorScheme.negative || '#ef4444',
      '--chart-highlight': colorScheme.highlight || '#f59e0b',
      '--chart-border-radius': `${style.borderRadius}px`,
      '--chart-padding': `${style.padding}px`,
      '--chart-title-size': `${style.titleFont.size}px`,
      '--chart-label-size': `${style.labelFont.size}px`,
    };
  }
}
