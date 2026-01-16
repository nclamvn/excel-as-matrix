// =============================================================================
// TRIGGER MANAGER — Manage macro triggers
// =============================================================================

import type { Macro, ScheduleConfig } from './types';

type MacroRunner = (macroId: string, triggerData?: unknown) => Promise<unknown>;

interface ScheduledJob {
  macroId: string;
  timeoutId: NodeJS.Timeout | number;
  nextRun: Date;
}

/**
 * Manage macro triggers
 */
export class TriggerManager {
  private macroRunner: MacroRunner;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private dataWatchers: Map<string, { macroId: string; range?: string; sheet?: string }> = new Map();
  private webhookHandlers: Map<string, string> = new Map();

  constructor(macroRunner: MacroRunner) {
    this.macroRunner = macroRunner;
  }

  /**
   * Register a macro's trigger
   */
  register(macro: Macro): void {
    const { trigger } = macro;

    switch (trigger.type) {
      case 'schedule':
        this.registerSchedule(macro);
        break;
      case 'data_change':
        this.registerDataWatcher(macro);
        break;
      case 'webhook':
        this.registerWebhook(macro);
        break;
    }
  }

  /**
   * Unregister a macro's trigger
   */
  unregister(macroId: string): void {
    // Clear scheduled job
    const job = this.scheduledJobs.get(macroId);
    if (job) {
      clearTimeout(job.timeoutId as NodeJS.Timeout);
      this.scheduledJobs.delete(macroId);
    }

    // Remove data watcher
    this.dataWatchers.delete(macroId);

    // Remove webhook handler
    this.webhookHandlers.delete(macroId);
  }

  /**
   * Handle data change event
   */
  onDataChange(sheetId: string, range: string, newValue: unknown): void {
    for (const [_id, watcher] of this.dataWatchers) {
      if (watcher.sheet && watcher.sheet !== sheetId) continue;
      if (watcher.range && !this.rangeOverlaps(watcher.range, range)) continue;

      this.macroRunner(watcher.macroId, { sheetId, range, newValue });
    }
  }

  /**
   * Handle webhook call
   */
  onWebhook(url: string, data: unknown): void {
    const macroId = this.webhookHandlers.get(url);
    if (macroId) {
      this.macroRunner(macroId, data);
    }
  }

  /**
   * Get next scheduled run for a macro
   */
  getNextRun(macroId: string): Date | null {
    return this.scheduledJobs.get(macroId)?.nextRun || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private registerSchedule(macro: Macro): void {
    const schedule = macro.trigger.config.schedule;
    if (!schedule) return;

    const nextRun = this.calculateNextRun(schedule);
    if (!nextRun) return;

    const delay = nextRun.getTime() - Date.now();

    const timeoutId = setTimeout(() => {
      this.macroRunner(macro.id, { scheduledAt: nextRun });

      // Re-schedule for recurring schedules
      if (schedule.type !== 'once') {
        this.registerSchedule(macro);
      }
    }, Math.max(delay, 0));

    this.scheduledJobs.set(macro.id, {
      macroId: macro.id,
      timeoutId,
      nextRun,
    });
  }

  private registerDataWatcher(macro: Macro): void {
    const { watchRange, watchSheet } = macro.trigger.config;

    this.dataWatchers.set(macro.id, {
      macroId: macro.id,
      range: watchRange,
      sheet: watchSheet,
    });
  }

  private registerWebhook(macro: Macro): void {
    const { webhookUrl } = macro.trigger.config;
    if (webhookUrl) {
      this.webhookHandlers.set(webhookUrl, macro.id);
    }
  }

  private calculateNextRun(schedule: ScheduleConfig): Date | null {
    const now = new Date();

    switch (schedule.type) {
      case 'once':
        return schedule.runAt || null;

      case 'interval':
        if (!schedule.intervalMinutes) return null;
        return new Date(now.getTime() + schedule.intervalMinutes * 60 * 1000);

      case 'daily':
        return this.getNextDailyRun(schedule.timeOfDay || '09:00');

      case 'weekly':
        return this.getNextWeeklyRun(schedule.daysOfWeek || [1], schedule.timeOfDay || '09:00');

      case 'monthly':
        return this.getNextMonthlyRun(schedule.dayOfMonth || 1, schedule.timeOfDay || '09:00');

      default:
        return null;
    }
  }

  private getNextDailyRun(timeOfDay: string): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private getNextWeeklyRun(daysOfWeek: number[], timeOfDay: string): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();

    // Sort days and find next occurrence
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

    for (const day of sortedDays) {
      if (day > currentDay || (day === currentDay && this.isTimeInFuture(hours, minutes))) {
        const next = new Date(now);
        next.setDate(now.getDate() + (day - currentDay));
        next.setHours(hours, minutes, 0, 0);
        return next;
      }
    }

    // Wrap to next week
    const firstDay = sortedDays[0];
    const daysUntil = 7 - currentDay + firstDay;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntil);
    next.setHours(hours, minutes, 0, 0);
    return next;
  }

  private getNextMonthlyRun(dayOfMonth: number, timeOfDay: string): Date {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setDate(dayOfMonth);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  private isTimeInFuture(hours: number, minutes: number): boolean {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    return target > now;
  }

  private rangeOverlaps(range1: string, range2: string): boolean {
    // Simple check - in production would need proper range parsing
    return range1 === range2 || range1.includes(range2) || range2.includes(range1);
  }
}
