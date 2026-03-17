// =============================================================================
// FEEDBACK LOOP — Learn from user corrections (Blueprint §5.7)
// =============================================================================

import type {
  UserFeedback,
  FeedbackType,
  FeedbackCategory,
  ConversationContext,
} from './types';
import { loggers } from '@/utils/logger';

// -----------------------------------------------------------------------------
// Feedback Record
// -----------------------------------------------------------------------------

interface FeedbackRecord {
  feedback: UserFeedback;
  context: {
    action: string;
    target?: string;
    originalRequest: string;
    wasSuccessful: boolean;
  };
  timestamp: Date;
}

interface FeedbackStats {
  totalFeedback: number;
  positive: number;
  negative: number;
  corrections: number;
  averageRating: number;
  commonIssues: { category: FeedbackCategory; count: number }[];
}

// -----------------------------------------------------------------------------
// Feedback Loop Class
// -----------------------------------------------------------------------------

export class FeedbackLoop {
  private records: FeedbackRecord[] = [];
  private readonly maxRecords = 500;

  /**
   * Create feedback from user input
   */
  createFeedback(params: {
    conversationId: string;
    type: FeedbackType;
    rating?: number;
    comment?: string;
    correction?: string;
    categories?: FeedbackCategory[];
  }): UserFeedback {
    return {
      id: crypto.randomUUID(),
      conversationId: params.conversationId,
      type: params.type,
      rating: params.rating,
      comment: params.comment,
      correction: params.correction,
      categories: params.categories,
      providedAt: new Date(),
    };
  }

  /**
   * Record feedback with context
   */
  recordFeedback(
    feedback: UserFeedback,
    context: ConversationContext
  ): void {
    const record: FeedbackRecord = {
      feedback,
      context: {
        action: context.parsedIntent?.action || 'unknown',
        target: context.parsedIntent?.target,
        originalRequest: context.originalRequest,
        wasSuccessful: context.state === 'complete',
      },
      timestamp: new Date(),
    };

    this.records.push(record);

    // Trim old records
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  /**
   * Get feedback statistics
   */
  getStats(): FeedbackStats {
    const ratings = this.records
      .filter((r) => r.feedback.rating !== undefined)
      .map((r) => r.feedback.rating!);

    const categoryCount = new Map<FeedbackCategory, number>();
    for (const record of this.records) {
      for (const category of record.feedback.categories || []) {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      }
    }

    const commonIssues = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalFeedback: this.records.length,
      positive: this.records.filter(
        (r) => r.feedback.type === 'thumbs_up' || (r.feedback.rating && r.feedback.rating >= 4)
      ).length,
      negative: this.records.filter(
        (r) => r.feedback.type === 'thumbs_down' || (r.feedback.rating && r.feedback.rating <= 2)
      ).length,
      corrections: this.records.filter((r) => r.feedback.type === 'correction').length,
      averageRating: ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0,
      commonIssues,
    };
  }

  /**
   * Get accuracy for a specific action type
   */
  getActionAccuracy(action: string): number {
    const actionRecords = this.records.filter(
      (r) => r.context.action === action
    );

    if (actionRecords.length === 0) return 0.7; // Default

    const positive = actionRecords.filter(
      (r) =>
        r.feedback.type === 'thumbs_up' ||
        (r.feedback.rating && r.feedback.rating >= 4) ||
        r.context.wasSuccessful
    ).length;

    return positive / actionRecords.length;
  }

  /**
   * Get common corrections for an action
   */
  getCommonCorrections(action: string): string[] {
    return this.records
      .filter(
        (r) =>
          r.context.action === action &&
          r.feedback.type === 'correction' &&
          r.feedback.correction
      )
      .map((r) => r.feedback.correction!)
      .slice(-10);
  }

  /**
   * Learn from correction
   */
  analyzeCorrection(feedback: UserFeedback): {
    pattern: string;
    suggestion: string;
  } | null {
    if (!feedback.correction) return null;

    // Analyze what went wrong
    const categories = feedback.categories || [];

    if (categories.includes('wrong_cells')) {
      return {
        pattern: 'target_selection',
        suggestion: 'Ask for cell range confirmation before executing',
      };
    }

    if (categories.includes('wrong_formula')) {
      return {
        pattern: 'formula_interpretation',
        suggestion: 'Show formula preview before applying',
      };
    }

    if (categories.includes('misunderstood_intent')) {
      return {
        pattern: 'intent_parsing',
        suggestion: 'Ask clarifying questions for ambiguous requests',
      };
    }

    return null;
  }

  /**
   * Check if we should ask for feedback
   */
  shouldAskForFeedback(context: ConversationContext): boolean {
    // Ask for feedback on completed conversations
    if (context.state !== 'complete') return false;

    // Don't ask too frequently (1 in 3 conversations)
    const recentFeedback = this.records.filter(
      (r) => Date.now() - r.timestamp.getTime() < 3600000 // Last hour
    );

    return recentFeedback.length < 3;
  }

  /**
   * Get improvement suggestions based on feedback
   */
  getImprovementSuggestions(): string[] {
    const stats = this.getStats();
    const suggestions: string[] = [];

    // Check for common issues
    for (const issue of stats.commonIssues.slice(0, 3)) {
      switch (issue.category) {
        case 'wrong_cells':
          suggestions.push('Improve cell selection accuracy');
          break;
        case 'wrong_formula':
          suggestions.push('Review formula interpretation logic');
          break;
        case 'misunderstood_intent':
          suggestions.push('Add more clarification questions');
          break;
        case 'incomplete_result':
          suggestions.push('Ensure all steps complete successfully');
          break;
        case 'too_slow':
          suggestions.push('Optimize execution performance');
          break;
      }
    }

    // Check overall satisfaction
    if (stats.averageRating < 3 && stats.totalFeedback >= 10) {
      suggestions.push('Overall satisfaction is low - review recent conversations');
    }

    return suggestions;
  }

  /**
   * Export feedback data
   */
  exportData(): string {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * Import feedback data
   */
  importData(json: string): void {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        this.records = data.map((r) => ({
          ...r,
          timestamp: new Date(r.timestamp),
          feedback: {
            ...r.feedback,
            providedAt: new Date(r.feedback.providedAt),
          },
        }));
      }
    } catch {
      loggers.ai.error('Failed to import feedback data');
    }
  }

  /**
   * Clear all feedback
   */
  clear(): void {
    this.records = [];
  }

  /**
   * Get recent feedback
   */
  getRecentFeedback(count: number = 10): FeedbackRecord[] {
    return this.records.slice(-count);
  }

  /**
   * Format feedback for display
   */
  formatFeedback(feedback: UserFeedback): string {
    const lines: string[] = [];

    // Type indicator
    const icon = this.getFeedbackIcon(feedback.type);
    lines.push(`${icon} ${this.formatType(feedback.type)}`);

    // Rating
    if (feedback.rating) {
      lines.push(`Rating: ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}`);
    }

    // Comment
    if (feedback.comment) {
      lines.push(`Comment: ${feedback.comment}`);
    }

    // Correction
    if (feedback.correction) {
      lines.push(`Correction: ${feedback.correction}`);
    }

    // Categories
    if (feedback.categories && feedback.categories.length > 0) {
      lines.push(`Issues: ${feedback.categories.join(', ')}`);
    }

    return lines.join('\n');
  }

  private getFeedbackIcon(type: FeedbackType): string {
    switch (type) {
      case 'thumbs_up':
        return '👍';
      case 'thumbs_down':
        return '👎';
      case 'correction':
        return '✏️';
      case 'suggestion':
        return '💡';
    }
  }

  private formatType(type: FeedbackType): string {
    switch (type) {
      case 'thumbs_up':
        return 'Positive Feedback';
      case 'thumbs_down':
        return 'Negative Feedback';
      case 'correction':
        return 'Correction';
      case 'suggestion':
        return 'Suggestion';
    }
  }
}

// Export singleton
export const feedbackLoop = new FeedbackLoop();
