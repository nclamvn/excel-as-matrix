// =============================================================================
// ANNOTATION ENGINE — Add annotations and highlights to charts
// =============================================================================

import type { ChartConfig, Annotation, ChartInsight } from './types';

/**
 * Annotation style options
 */
export interface AnnotationStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontWeight?: string;
  opacity?: number;
}

/**
 * Reference line options
 */
export interface ReferenceLineOptions {
  value: number;
  axis: 'x' | 'y';
  label?: string;
  style?: AnnotationStyle;
}

/**
 * Reference band options
 */
export interface ReferenceBandOptions {
  from: number;
  to: number;
  axis: 'x' | 'y';
  label?: string;
  style?: AnnotationStyle;
}

/**
 * Manages annotations and highlights on charts
 */
export class AnnotationEngine {
  private idCounter = 0;

  /**
   * Generate unique annotation ID
   */
  private generateId(prefix: string = 'annotation'): string {
    return `${prefix}-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * Add annotation to chart config
   */
  addAnnotation(config: ChartConfig, annotation: Annotation): ChartConfig {
    const annotations = config.annotations || [];
    return {
      ...config,
      annotations: [...annotations, annotation],
    };
  }

  /**
   * Add multiple annotations
   */
  addAnnotations(config: ChartConfig, annotations: Annotation[]): ChartConfig {
    const existing = config.annotations || [];
    return {
      ...config,
      annotations: [...existing, ...annotations],
    };
  }

  /**
   * Remove annotation by ID
   */
  removeAnnotation(config: ChartConfig, annotationId: string): ChartConfig {
    if (!config.annotations) return config;

    return {
      ...config,
      annotations: config.annotations.filter((a) => a.id !== annotationId),
    };
  }

  /**
   * Clear all annotations
   */
  clearAnnotations(config: ChartConfig): ChartConfig {
    return {
      ...config,
      annotations: [],
    };
  }

  /**
   * Create point annotation
   */
  createPointAnnotation(
    x: number | string,
    y: number | string,
    label: string,
    style?: AnnotationStyle
  ): Annotation {
    return {
      id: this.generateId('point'),
      type: 'point',
      x,
      y,
      label,
      color: style?.color || '#3b82f6',
      backgroundColor: style?.backgroundColor || '#eff6ff',
      borderColor: style?.borderColor || '#3b82f6',
    };
  }

  /**
   * Create line annotation (horizontal or vertical)
   */
  createLineAnnotation(
    options: ReferenceLineOptions
  ): Annotation {
    const { value, axis, label, style } = options;

    return {
      id: this.generateId('line'),
      type: 'line',
      x: axis === 'x' ? value : undefined,
      y: axis === 'y' ? value : undefined,
      label,
      color: style?.color || '#6b7280',
      borderColor: style?.borderColor || '#6b7280',
    };
  }

  /**
   * Create region/band annotation
   */
  createRegionAnnotation(
    options: ReferenceBandOptions
  ): Annotation {
    const { from, to, axis, label, style } = options;

    return {
      id: this.generateId('region'),
      type: 'region',
      x: axis === 'x' ? from : undefined,
      y: axis === 'y' ? from : undefined,
      x2: axis === 'x' ? to : undefined,
      y2: axis === 'y' ? to : undefined,
      label,
      color: style?.color || '#e5e7eb',
      backgroundColor: style?.backgroundColor || 'rgba(229, 231, 235, 0.3)',
      borderColor: style?.borderColor || '#d1d5db',
    };
  }

  /**
   * Create label annotation
   */
  createLabelAnnotation(
    x: number | string,
    y: number | string,
    text: string,
    style?: AnnotationStyle
  ): Annotation {
    return {
      id: this.generateId('label'),
      type: 'label',
      x,
      y,
      label: text,
      color: style?.color || '#1f2937',
      backgroundColor: style?.backgroundColor || '#ffffff',
      borderColor: style?.borderColor || '#e5e7eb',
    };
  }

  /**
   * Create arrow annotation
   */
  createArrowAnnotation(
    fromX: number | string,
    fromY: number | string,
    toX: number | string,
    toY: number | string,
    label?: string,
    style?: AnnotationStyle
  ): Annotation {
    return {
      id: this.generateId('arrow'),
      type: 'arrow',
      x: fromX,
      y: fromY,
      x2: toX,
      y2: toY,
      label,
      color: style?.color || '#1f2937',
    };
  }

  /**
   * Create trend line annotation
   */
  createTrendAnnotation(
    startX: number | string,
    startY: number | string,
    endX: number | string,
    endY: number | string,
    label?: string,
    style?: AnnotationStyle
  ): Annotation {
    return {
      id: this.generateId('trend'),
      type: 'trend',
      x: startX,
      y: startY,
      x2: endX,
      y2: endY,
      label,
      color: style?.color || '#8b5cf6',
      borderColor: style?.borderColor || '#8b5cf6',
    };
  }

  /**
   * Add annotations from insights
   */
  addInsightAnnotations(
    config: ChartConfig,
    insights: ChartInsight[]
  ): ChartConfig {
    const annotations: Annotation[] = [];

    for (const insight of insights) {
      if (insight.suggestedAnnotation) {
        annotations.push(insight.suggestedAnnotation);
      }
    }

    return this.addAnnotations(config, annotations);
  }

  /**
   * Add average line annotation
   */
  addAverageLine(
    config: ChartConfig,
    seriesIndex: number = 0,
    options?: { label?: string; style?: AnnotationStyle }
  ): ChartConfig {
    const dataset = config.data.datasets[seriesIndex];
    if (!dataset) return config;

    const values = dataset.data.filter((v) => typeof v === 'number') as number[];
    if (values.length === 0) return config;

    const average = values.reduce((a, b) => a + b, 0) / values.length;

    const annotation = this.createLineAnnotation({
      value: average,
      axis: 'y',
      label: options?.label || `Avg: ${average.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      style: options?.style || {
        color: '#f59e0b',
        borderColor: '#f59e0b',
      },
    });

    return this.addAnnotation(config, annotation);
  }

  /**
   * Add target line annotation
   */
  addTargetLine(
    config: ChartConfig,
    target: number,
    options?: { label?: string; style?: AnnotationStyle }
  ): ChartConfig {
    const annotation = this.createLineAnnotation({
      value: target,
      axis: 'y',
      label: options?.label || `Target: ${target.toLocaleString()}`,
      style: options?.style || {
        color: '#22c55e',
        borderColor: '#22c55e',
      },
    });

    return this.addAnnotation(config, annotation);
  }

  /**
   * Add min/max annotations
   */
  addMinMaxAnnotations(
    config: ChartConfig,
    seriesIndex: number = 0
  ): ChartConfig {
    const dataset = config.data.datasets[seriesIndex];
    if (!dataset) return config;

    const labels = config.data.labels || [];
    const values = dataset.data;

    let minIndex = 0;
    let maxIndex = 0;
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (typeof value === 'number') {
        if (value < minValue) {
          minValue = value;
          minIndex = i;
        }
        if (value > maxValue) {
          maxValue = value;
          maxIndex = i;
        }
      }
    }

    if (minValue === Infinity || maxValue === -Infinity) return config;

    const annotations: Annotation[] = [
      this.createPointAnnotation(
        labels[minIndex] || minIndex,
        minValue,
        `Min: ${minValue.toLocaleString()}`,
        { color: '#ef4444', backgroundColor: '#fef2f2', borderColor: '#ef4444' }
      ),
      this.createPointAnnotation(
        labels[maxIndex] || maxIndex,
        maxValue,
        `Max: ${maxValue.toLocaleString()}`,
        { color: '#22c55e', backgroundColor: '#f0fdf4', borderColor: '#22c55e' }
      ),
    ];

    return this.addAnnotations(config, annotations);
  }

  /**
   * Add threshold region
   */
  addThresholdRegion(
    config: ChartConfig,
    threshold: number,
    type: 'above' | 'below',
    options?: { label?: string; style?: AnnotationStyle }
  ): ChartConfig {
    // Find the max value for region bounds
    let maxValue = threshold;
    let minValue = 0;

    for (const dataset of config.data.datasets) {
      for (const value of dataset.data) {
        if (typeof value === 'number') {
          maxValue = Math.max(maxValue, value);
          minValue = Math.min(minValue, value);
        }
      }
    }

    const from = type === 'above' ? threshold : minValue;
    const to = type === 'above' ? maxValue * 1.1 : threshold;

    const annotation = this.createRegionAnnotation({
      from,
      to,
      axis: 'y',
      label: options?.label,
      style: options?.style || {
        color: type === 'above' ? '#fef2f2' : '#f0fdf4',
        backgroundColor:
          type === 'above' ? 'rgba(254, 202, 202, 0.2)' : 'rgba(187, 247, 208, 0.2)',
        borderColor: type === 'above' ? '#fca5a5' : '#86efac',
      },
    });

    return this.addAnnotation(config, annotation);
  }

  /**
   * Highlight specific data points
   */
  highlightPoints(
    config: ChartConfig,
    indices: number[],
    seriesIndex: number = 0,
    options?: { label?: (index: number, value: number) => string; style?: AnnotationStyle }
  ): ChartConfig {
    const dataset = config.data.datasets[seriesIndex];
    if (!dataset) return config;

    const labels = config.data.labels || [];
    const annotations: Annotation[] = [];

    for (const index of indices) {
      const value = dataset.data[index];
      if (typeof value !== 'number') continue;

      const label = options?.label
        ? options.label(index, value)
        : value.toLocaleString();

      annotations.push(
        this.createPointAnnotation(labels[index] || index, value, label, {
          color: config.colorScheme.highlight || '#f59e0b',
          backgroundColor: '#fef3c7',
          borderColor: config.colorScheme.highlight || '#f59e0b',
          ...options?.style,
        })
      );
    }

    return this.addAnnotations(config, annotations);
  }

  /**
   * Update annotation by ID
   */
  updateAnnotation(
    config: ChartConfig,
    annotationId: string,
    updates: Partial<Annotation>
  ): ChartConfig {
    if (!config.annotations) return config;

    return {
      ...config,
      annotations: config.annotations.map((a) =>
        a.id === annotationId ? { ...a, ...updates } : a
      ),
    };
  }

  /**
   * Get annotations by type
   */
  getAnnotationsByType(config: ChartConfig, type: Annotation['type']): Annotation[] {
    return (config.annotations || []).filter((a) => a.type === type);
  }

  /**
   * Check if config has annotations
   */
  hasAnnotations(config: ChartConfig): boolean {
    return (config.annotations || []).length > 0;
  }

  /**
   * Get annotation count
   */
  getAnnotationCount(config: ChartConfig): number {
    return (config.annotations || []).length;
  }
}
