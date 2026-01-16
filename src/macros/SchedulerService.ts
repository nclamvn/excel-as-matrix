// =============================================================================
// SCHEDULER SERVICE — Manage scheduled macro executions
// =============================================================================

import type { Macro, ScheduleConfig } from './types';

/**
 * Scheduled job info
 */
interface ScheduledJob {
  macroId: string;
  macroName: string;
  nextRun: Date;
  schedule: ScheduleConfig;
  enabled: boolean;
}

/**
 * Schedule event
 */
interface ScheduleEvent {
  type: 'job_added' | 'job_removed' | 'job_run' | 'job_error';
  job: ScheduledJob;
  error?: string;
}

type ScheduleEventHandler = (event: ScheduleEvent) => void;

/**
 * Manage scheduled macro executions
 */
export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout | number> = new Map();
  private eventHandlers: Set<ScheduleEventHandler> = new Set();
  private macroRunner: ((macroId: string) => Promise<void>) | null = null;

  /**
   * Set the macro runner function
   */
  setMacroRunner(runner: (macroId: string) => Promise<void>): void {
    this.macroRunner = runner;
  }

  /**
   * Schedule a macro
   */
  schedule(macro: Macro): void {
    if (macro.trigger.type !== 'schedule' || !macro.trigger.config.schedule) {
      return;
    }

    // Remove existing schedule
    this.unschedule(macro.id);

    const schedule = macro.trigger.config.schedule;
    const nextRun = this.calculateNextRun(schedule);

    if (!nextRun) return;

    const job: ScheduledJob = {
      macroId: macro.id,
      macroName: macro.name,
      nextRun,
      schedule,
      enabled: macro.enabled && macro.trigger.enabled,
    };

    this.jobs.set(macro.id, job);

    if (job.enabled) {
      this.scheduleTimer(job);
    }

    this.emit({ type: 'job_added', job });
  }

  /**
   * Unschedule a macro
   */
  unschedule(macroId: string): void {
    const job = this.jobs.get(macroId);
    if (!job) return;

    // Clear timer
    const timer = this.timers.get(macroId);
    if (timer) {
      clearTimeout(timer as NodeJS.Timeout);
      this.timers.delete(macroId);
    }

    this.jobs.delete(macroId);
    this.emit({ type: 'job_removed', job });
  }

  /**
   * Get all scheduled jobs
   */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get upcoming jobs (next 24 hours)
   */
  getUpcomingJobs(hours: number = 24): ScheduledJob[] {
    const cutoff = new Date(Date.now() + hours * 60 * 60 * 1000);

    return this.getJobs()
      .filter(job => job.enabled && job.nextRun <= cutoff)
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }

  /**
   * Get job by macro ID
   */
  getJob(macroId: string): ScheduledJob | null {
    return this.jobs.get(macroId) || null;
  }

  /**
   * Enable/disable a job
   */
  setEnabled(macroId: string, enabled: boolean): void {
    const job = this.jobs.get(macroId);
    if (!job) return;

    job.enabled = enabled;

    if (enabled) {
      this.scheduleTimer(job);
    } else {
      const timer = this.timers.get(macroId);
      if (timer) {
        clearTimeout(timer as NodeJS.Timeout);
        this.timers.delete(macroId);
      }
    }
  }

  /**
   * Subscribe to schedule events
   */
  onEvent(handler: ScheduleEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Format schedule for display
   */
  formatSchedule(schedule: ScheduleConfig, language: 'en' | 'vi' = 'en'): string {
    const labels = {
      en: {
        once: 'Once',
        interval: 'Every',
        daily: 'Daily at',
        weekly: 'Weekly on',
        monthly: 'Monthly on day',
        cron: 'Custom schedule',
        minutes: 'minutes',
        sun: 'Sunday',
        mon: 'Monday',
        tue: 'Tuesday',
        wed: 'Wednesday',
        thu: 'Thursday',
        fri: 'Friday',
        sat: 'Saturday',
      },
      vi: {
        once: 'Một lần',
        interval: 'Mỗi',
        daily: 'Hàng ngày lúc',
        weekly: 'Hàng tuần vào',
        monthly: 'Hàng tháng vào ngày',
        cron: 'Lịch tùy chỉnh',
        minutes: 'phút',
        sun: 'Chủ nhật',
        mon: 'Thứ hai',
        tue: 'Thứ ba',
        wed: 'Thứ tư',
        thu: 'Thứ năm',
        fri: 'Thứ sáu',
        sat: 'Thứ bảy',
      },
    };

    const t = labels[language];
    const days = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

    switch (schedule.type) {
      case 'once':
        return `${t.once}: ${schedule.runAt?.toLocaleString() || ''}`;

      case 'interval':
        return `${t.interval} ${schedule.intervalMinutes} ${t.minutes}`;

      case 'daily':
        return `${t.daily} ${schedule.timeOfDay || '09:00'}`;

      case 'weekly':
        const dayNames = (schedule.daysOfWeek || []).map(d => days[d]).join(', ');
        return `${t.weekly} ${dayNames} ${schedule.timeOfDay || '09:00'}`;

      case 'monthly':
        return `${t.monthly} ${schedule.dayOfMonth || 1} ${schedule.timeOfDay || '09:00'}`;

      case 'cron':
        return `${t.cron}: ${schedule.cronExpression}`;

      default:
        return '';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private scheduleTimer(job: ScheduledJob): void {
    const delay = job.nextRun.getTime() - Date.now();

    if (delay < 0) {
      // Already past, calculate next run
      const nextRun = this.calculateNextRun(job.schedule);
      if (nextRun) {
        job.nextRun = nextRun;
        this.scheduleTimer(job);
      }
      return;
    }

    const timer = setTimeout(async () => {
      await this.runJob(job);
    }, Math.min(delay, 2147483647)); // Max timeout value

    this.timers.set(job.macroId, timer);
  }

  private async runJob(job: ScheduledJob): Promise<void> {
    try {
      if (this.macroRunner) {
        await this.macroRunner(job.macroId);
      }
      this.emit({ type: 'job_run', job });
    } catch (error) {
      this.emit({
        type: 'job_error',
        job,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Reschedule if recurring
    if (job.schedule.type !== 'once') {
      const nextRun = this.calculateNextRun(job.schedule);
      if (nextRun) {
        job.nextRun = nextRun;
        this.scheduleTimer(job);
      }
    } else {
      this.jobs.delete(job.macroId);
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
        return this.getNextWeeklyRun(
          schedule.daysOfWeek || [1],
          schedule.timeOfDay || '09:00'
        );

      case 'monthly':
        return this.getNextMonthlyRun(
          schedule.dayOfMonth || 1,
          schedule.timeOfDay || '09:00'
        );

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

    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

    // Find next occurrence
    for (const day of sortedDays) {
      const next = new Date(now);

      if (day > currentDay) {
        next.setDate(now.getDate() + (day - currentDay));
        next.setHours(hours, minutes, 0, 0);
        return next;
      } else if (day === currentDay) {
        next.setHours(hours, minutes, 0, 0);
        if (next > now) return next;
      }
    }

    // Wrap to next week
    const firstDay = sortedDays[0];
    const next = new Date(now);
    next.setDate(now.getDate() + (7 - currentDay + firstDay));
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

    // Handle months with fewer days
    while (next.getDate() !== dayOfMonth) {
      next.setDate(0); // Go to last day of previous month
    }

    return next;
  }

  private emit(event: ScheduleEvent): void {
    this.eventHandlers.forEach(handler => handler(event));
  }
}
