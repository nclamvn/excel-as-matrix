// =============================================================================
// PROACTIVE SCHEDULER — Background scanning scheduler
// =============================================================================

import type { ScanConfig, SheetData } from './types';
import { loggers } from '@/utils/logger';

/**
 * Schedules and manages background scans
 */
export class ProactiveScheduler {
  private config: ScanConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastScanTime = 0;
  private scanCallback: ((data: SheetData) => Promise<unknown>) | null = null;
  private getDataCallback: (() => SheetData | null) | null = null;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * Start the scheduler
   */
  start(
    getDataCallback: () => SheetData | null,
    scanCallback: (data: SheetData) => Promise<unknown>
  ): void {
    if (this.intervalId) {
      this.stop();
    }

    this.getDataCallback = getDataCallback;
    this.scanCallback = scanCallback;
    this.isRunning = true;

    // Run initial scan
    this.runScan();

    // Schedule periodic scans
    this.intervalId = setInterval(() => {
      if (this.config.enabled && this.isRunning) {
        this.runScan();
      }
    }, this.config.interval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Pause scanning
   */
  pause(): void {
    this.isRunning = false;
  }

  /**
   * Resume scanning
   */
  resume(): void {
    this.isRunning = true;
  }

  /**
   * Run a scan immediately
   */
  async runScan(): Promise<void> {
    if (!this.getDataCallback || !this.scanCallback) {
      return;
    }

    const data = this.getDataCallback();
    if (!data) {
      return;
    }

    // Skip if data is too large
    const cellCount = data.rowCount * data.colCount;
    if (cellCount > this.config.maxCellsToScan) {
      loggers.proactive.warn('Skipping scan: data too large');
      return;
    }

    this.lastScanTime = Date.now();

    try {
      await this.scanCallback(data);
    } catch (error) {
      loggers.proactive.error('Scan failed:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScanConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart if interval changed
    if (config.interval && this.intervalId) {
      this.stop();
      if (this.getDataCallback && this.scanCallback) {
        this.start(this.getDataCallback, this.scanCallback);
      }
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      lastScanTime: this.lastScanTime,
      nextScanTime: this.lastScanTime + this.config.interval,
      interval: this.config.interval,
      enabled: this.config.enabled,
    };
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning && this.config.enabled;
  }

  /**
   * Get time until next scan
   */
  getTimeUntilNextScan(): number {
    if (!this.isRunning) return -1;
    const elapsed = Date.now() - this.lastScanTime;
    return Math.max(0, this.config.interval - elapsed);
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface SchedulerStatus {
  isRunning: boolean;
  lastScanTime: number;
  nextScanTime: number;
  interval: number;
  enabled: boolean;
}
