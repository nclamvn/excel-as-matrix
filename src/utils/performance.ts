/**
 * Performance Monitoring Utilities
 *
 * Provides tools for measuring, tracking, and reporting
 * performance metrics for the spreadsheet application.
 */

// ============ Types ============

import { logger } from '@/utils/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetric[];
  summary: PerformanceSummary;
}

export interface PerformanceSummary {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  calcTime: number;
  networkLatency: number;
  cacheHitRate: number;
}

export interface TimingResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

// ============ Performance Monitor Class ============

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private timers: Map<string, number> = new Map();
  private frameCount = 0;
  private lastFPSTime = 0;
  private fps = 60;
  private isRecording = false;
  private recordedMetrics: PerformanceMetric[] = [];
  private observers: Set<(metric: PerformanceMetric) => void> = new Set();

  constructor() {
    this.startFPSMonitoring();
  }

  // ============ Timing Methods ============

  /**
   * Start a timer
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a timer and record the duration
   */
  endTimer(name: string): TimingResult | null {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      logger.warn(`Timer "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
    });

    return { name, duration, startTime, endTime };
  }

  /**
   * Measure the execution time of a function
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endTimer(name);
    }
  }

  /**
   * Create a measurement decorator for class methods
   */
  measureMethod(name: string) {
    const monitor = this;
    return function (
      _target: unknown,
      _propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: unknown[]) {
        return monitor.measure(name, () => originalMethod.apply(this, args));
      };
      return descriptor;
    };
  }

  // ============ FPS Monitoring ============

  private startFPSMonitoring(): void {
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();

      if (now - this.lastFPSTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSTime));
        this.frameCount = 0;
        this.lastFPSTime = now;

        this.recordMetric({
          name: 'fps',
          value: this.fps,
          unit: 'fps',
          timestamp: Date.now(),
        });
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  // ============ Memory Monitoring ============

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): MemoryInfo | null {
    const memory = (performance as unknown as { memory?: MemoryInfo }).memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      this.recordMetric({
        name: 'memory.used',
        value: memory.usedJSHeapSize / 1024 / 1024,
        unit: 'MB',
        timestamp: Date.now(),
      });

      this.recordMetric({
        name: 'memory.total',
        value: memory.totalJSHeapSize / 1024 / 1024,
        unit: 'MB',
        timestamp: Date.now(),
      });
    }
  }

  // ============ Metric Recording ============

  /**
   * Record a metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const { name } = metric;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 1000 metrics per name
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Notify observers
    this.observers.forEach((observer) => observer(metric));

    // Record if in recording mode
    if (this.isRecording) {
      this.recordedMetrics.push(metric);
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string, windowMs: number = 5000): number {
    const metrics = this.getMetrics(name);
    const cutoff = Date.now() - windowMs;
    const recent = metrics.filter((m) => m.timestamp >= cutoff);

    if (recent.length === 0) return 0;
    return recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
  }

  /**
   * Get percentile value for a metric
   */
  getPercentile(name: string, percentile: number, windowMs: number = 5000): number {
    const metrics = this.getMetrics(name);
    const cutoff = Date.now() - windowMs;
    const recent = metrics.filter((m) => m.timestamp >= cutoff);

    if (recent.length === 0) return 0;

    const sorted = [...recent].sort((a, b) => a.value - b.value);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)].value;
  }

  // ============ Recording ============

  /**
   * Start recording metrics
   */
  startRecording(): void {
    this.isRecording = true;
    this.recordedMetrics = [];
  }

  /**
   * Stop recording and return recorded metrics
   */
  stopRecording(): PerformanceMetric[] {
    this.isRecording = false;
    const metrics = [...this.recordedMetrics];
    this.recordedMetrics = [];
    return metrics;
  }

  // ============ Observers ============

  /**
   * Subscribe to metric updates
   */
  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  // ============ Reporting ============

  /**
   * Generate a performance report
   */
  generateReport(durationMs: number = 5000): PerformanceReport {
    const now = Date.now();
    const cutoff = now - durationMs;

    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach((metrics) => {
      allMetrics.push(...metrics.filter((m) => m.timestamp >= cutoff));
    });

    const summary: PerformanceSummary = {
      fps: this.getAverage('fps', durationMs),
      memoryUsage: this.getAverage('memory.used', durationMs),
      renderTime: this.getAverage('render', durationMs),
      calcTime: this.getAverage('calculation', durationMs),
      networkLatency: this.getAverage('network.latency', durationMs),
      cacheHitRate: this.calculateCacheHitRate(durationMs),
    };

    return {
      timestamp: now,
      duration: durationMs,
      metrics: allMetrics,
      summary,
    };
  }

  private calculateCacheHitRate(windowMs: number): number {
    const hits = this.getMetrics('cache.hit').filter(
      (m) => m.timestamp >= Date.now() - windowMs
    ).length;
    const misses = this.getMetrics('cache.miss').filter(
      (m) => m.timestamp >= Date.now() - windowMs
    ).length;

    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 100;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
    this.recordedMetrics = [];
  }
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// ============ React Hook ============

import { useCallback, useEffect, useRef, useState } from 'react';

export function usePerformanceMonitor(options: {
  trackMemory?: boolean;
  memoryInterval?: number;
} = {}) {
  const { trackMemory = true, memoryInterval = 5000 } = options;
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);

  useEffect(() => {
    monitorRef.current = new PerformanceMonitor();

    // Track memory usage periodically
    if (trackMemory) {
      const interval = setInterval(() => {
        monitorRef.current?.recordMemoryUsage();
      }, memoryInterval);

      return () => clearInterval(interval);
    }
  }, [trackMemory, memoryInterval]);

  // Update summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (monitorRef.current) {
        const report = monitorRef.current.generateReport();
        setSummary(report.summary);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startTimer = useCallback((name: string) => {
    monitorRef.current?.startTimer(name);
  }, []);

  const endTimer = useCallback((name: string) => {
    return monitorRef.current?.endTimer(name);
  }, []);

  const measure = useCallback(async <T,>(name: string, fn: () => T | Promise<T>) => {
    if (!monitorRef.current) return fn();
    return monitorRef.current.measure(name, fn);
  }, []);

  const recordMetric = useCallback((metric: PerformanceMetric) => {
    monitorRef.current?.recordMetric(metric);
  }, []);

  const getReport = useCallback((durationMs?: number) => {
    return monitorRef.current?.generateReport(durationMs);
  }, []);

  return {
    monitor: monitorRef.current,
    summary,
    startTimer,
    endTimer,
    measure,
    recordMetric,
    getReport,
  };
}

// ============ Render Performance ============

export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const monitor = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    monitor.current = new PerformanceMonitor();
  }, []);

  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const duration = now - lastRenderTime.current;
    lastRenderTime.current = now;

    monitor.current?.recordMetric({
      name: `${componentName}.render`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { renderCount: renderCount.current },
    });
  });

  const getRenderStats = useCallback(() => {
    const metrics = monitor.current?.getMetrics(`${componentName}.render`) || [];
    const recent = metrics.slice(-100);

    return {
      totalRenders: renderCount.current,
      avgRenderTime: recent.length > 0
        ? recent.reduce((sum, m) => sum + m.value, 0) / recent.length
        : 0,
      maxRenderTime: recent.length > 0
        ? Math.max(...recent.map((m) => m.value))
        : 0,
    };
  }, [componentName]);

  return { renderCount: renderCount.current, getRenderStats };
}

// ============ Network Performance ============

export function trackNetworkRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = performance.now();
  const monitor = new PerformanceMonitor();

  return fetch(url, options).then((response) => {
    const duration = performance.now() - startTime;

    monitor.recordMetric({
      name: 'network.latency',
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        url,
        method: options.method || 'GET',
        status: response.status,
      },
    });

    return response;
  });
}

// ============ Utility Functions ============

/**
 * Debounce function with performance tracking
 */
export function debounceWithMetrics<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  metricName: string
): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  let callCount = 0;
  const monitor = new PerformanceMonitor();

  return ((...args: Parameters<T>) => {
    callCount++;
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      monitor.recordMetric({
        name: `${metricName}.debounced`,
        value: callCount,
        unit: 'calls',
        timestamp: Date.now(),
      });
      callCount = 0;
      fn(...args);
    }, delay);
  }) as T;
}

/**
 * Throttle function with performance tracking
 */
export function throttleWithMetrics<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
  metricName: string
): T {
  let lastCall = 0;
  let skippedCalls = 0;
  const monitor = new PerformanceMonitor();

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= limit) {
      if (skippedCalls > 0) {
        monitor.recordMetric({
          name: `${metricName}.throttled`,
          value: skippedCalls,
          unit: 'calls',
          timestamp: now,
        });
        skippedCalls = 0;
      }
      lastCall = now;
      fn(...args);
    } else {
      skippedCalls++;
    }
  }) as T;
}

// ============ Singleton Instance ============

let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}
