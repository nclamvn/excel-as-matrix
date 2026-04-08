// ═══════════════════════════════════════════════════════════════════════════
// AI USAGE LOGGER — Tracks all AI interactions for governance & compliance
// Integrates with AuditLogService for immutable audit trail
// ═══════════════════════════════════════════════════════════════════════════

import { auditLog } from './AuditLogService';
import type { AuditSeverity } from './AuditLogService';
import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIUsageEvent {
  conversationId: string;
  userId: string | null;
  workbookId: string | null;
  action: AIUsageAction;
  toolName?: string;
  inputSummary: string; // Redacted summary of input
  outputSummary: string; // Summary of output
  tokensUsed: number;
  durationMs: number;
  piiRedacted: number; // Count of PII items redacted
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export type AIUsageAction =
  | 'chat.send'
  | 'chat.stream'
  | 'tool.execute'
  | 'tool.approve'
  | 'tool.reject'
  | 'context.assemble'
  | 'suggestion.proactive'
  | 'suggestion.accept'
  | 'suggestion.dismiss'
  | 'macro.ai_create'
  | 'formula.nl_convert';

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalPIIRedacted: number;
  totalErrors: number;
  byAction: Record<string, number>;
  averageTokensPerRequest: number;
  averageDurationMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AIUsageLogger Class
// ─────────────────────────────────────────────────────────────────────────────

class AIUsageLogger {
  private sessionStats: AIUsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalPIIRedacted: 0,
    totalErrors: 0,
    byAction: {},
    averageTokensPerRequest: 0,
    averageDurationMs: 0,
  };

  private totalDurationMs = 0;

  /**
   * Log an AI usage event to the immutable audit log
   */
  async logUsage(event: AIUsageEvent): Promise<void> {
    // Update session stats
    this.sessionStats.totalRequests++;
    this.sessionStats.totalTokens += event.tokensUsed;
    this.sessionStats.totalPIIRedacted += event.piiRedacted;
    this.totalDurationMs += event.durationMs;

    if (event.status === 'error') {
      this.sessionStats.totalErrors++;
    }

    this.sessionStats.byAction[event.action] =
      (this.sessionStats.byAction[event.action] || 0) + 1;
    this.sessionStats.averageTokensPerRequest =
      this.sessionStats.totalTokens / this.sessionStats.totalRequests;
    this.sessionStats.averageDurationMs =
      this.totalDurationMs / this.sessionStats.totalRequests;

    // Determine severity
    let severity: AuditSeverity = 'info';
    if (event.status === 'error') severity = 'warning';
    if (event.piiRedacted > 5) severity = 'warning'; // Lots of PII is notable

    // Write to immutable audit log
    await auditLog.logAI(event.action, this.buildDescription(event), {
      userId: event.userId ?? undefined,
      workbookId: event.workbookId ?? undefined,
      severity,
      metadata: {
        conversationId: event.conversationId,
        toolName: event.toolName || null,
        tokensUsed: event.tokensUsed,
        durationMs: event.durationMs,
        piiRedacted: event.piiRedacted,
        status: event.status,
        inputSummary: event.inputSummary,
        outputSummary: event.outputSummary,
        ...(event.errorMessage ? { errorMessage: event.errorMessage } : {}),
      },
    });

    loggers.ai.debug(
      `AI usage: ${event.action} | tokens=${event.tokensUsed} | pii=${event.piiRedacted} | ${event.status}`
    );
  }

  /**
   * Log a chat message send
   */
  async logChat(options: {
    conversationId: string;
    userId?: string | null;
    workbookId?: string | null;
    inputLength: number;
    outputLength: number;
    tokensUsed: number;
    durationMs: number;
    piiRedacted: number;
    streaming: boolean;
    status: 'success' | 'error';
    errorMessage?: string;
  }): Promise<void> {
    await this.logUsage({
      conversationId: options.conversationId,
      userId: options.userId ?? null,
      workbookId: options.workbookId ?? null,
      action: options.streaming ? 'chat.stream' : 'chat.send',
      inputSummary: `${options.inputLength} chars`,
      outputSummary: `${options.outputLength} chars`,
      tokensUsed: options.tokensUsed,
      durationMs: options.durationMs,
      piiRedacted: options.piiRedacted,
      status: options.status,
      errorMessage: options.errorMessage,
    });
  }

  /**
   * Log a tool execution
   */
  async logToolExecution(options: {
    conversationId: string;
    userId?: string | null;
    workbookId?: string | null;
    toolName: string;
    inputSummary: string;
    outputSummary: string;
    durationMs: number;
    status: 'success' | 'error' | 'pending';
    errorMessage?: string;
  }): Promise<void> {
    await this.logUsage({
      conversationId: options.conversationId,
      userId: options.userId ?? null,
      workbookId: options.workbookId ?? null,
      action: 'tool.execute',
      toolName: options.toolName,
      inputSummary: options.inputSummary,
      outputSummary: options.outputSummary,
      tokensUsed: 0,
      durationMs: options.durationMs,
      piiRedacted: 0,
      status: options.status,
      errorMessage: options.errorMessage,
    });
  }

  /**
   * Log tool approval/rejection
   */
  async logToolDecision(options: {
    conversationId: string;
    userId?: string | null;
    toolName: string;
    actionId: string;
    approved: boolean;
  }): Promise<void> {
    await this.logUsage({
      conversationId: options.conversationId,
      userId: options.userId ?? null,
      workbookId: null,
      action: options.approved ? 'tool.approve' : 'tool.reject',
      toolName: options.toolName,
      inputSummary: `actionId=${options.actionId}`,
      outputSummary: options.approved ? 'approved' : 'rejected',
      tokensUsed: 0,
      durationMs: 0,
      piiRedacted: 0,
      status: 'success',
    });
  }

  /**
   * Log proactive suggestion
   */
  async logProactiveSuggestion(options: {
    userId?: string | null;
    workbookId?: string | null;
    suggestionType: string;
    accepted: boolean;
  }): Promise<void> {
    await this.logUsage({
      conversationId: 'proactive',
      userId: options.userId ?? null,
      workbookId: options.workbookId ?? null,
      action: options.accepted ? 'suggestion.accept' : 'suggestion.dismiss',
      inputSummary: options.suggestionType,
      outputSummary: options.accepted ? 'accepted' : 'dismissed',
      tokensUsed: 0,
      durationMs: 0,
      piiRedacted: 0,
      status: 'success',
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(): AIUsageStats {
    return { ...this.sessionStats };
  }

  /**
   * Query AI usage from audit log
   */
  async queryUsage(options: {
    userId?: string;
    workbookId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}) {
    return auditLog.query({
      category: 'ai',
      userId: options.userId,
      workbookId: options.workbookId,
      startDate: options.startDate,
      endDate: options.endDate,
      limit: options.limit || 100,
    });
  }

  /**
   * Reset session stats (e.g., on new session)
   */
  resetSessionStats(): void {
    this.sessionStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalPIIRedacted: 0,
      totalErrors: 0,
      byAction: {},
      averageTokensPerRequest: 0,
      averageDurationMs: 0,
    };
    this.totalDurationMs = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  private buildDescription(event: AIUsageEvent): string {
    const parts = [`AI ${event.action}`];

    if (event.toolName) parts.push(`tool=${event.toolName}`);
    parts.push(`tokens=${event.tokensUsed}`);

    if (event.piiRedacted > 0) {
      parts.push(`pii_redacted=${event.piiRedacted}`);
    }

    if (event.status === 'error') {
      parts.push(`ERROR: ${event.errorMessage || 'unknown'}`);
    }

    return parts.join(' | ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const aiUsageLogger = new AIUsageLogger();
