// =============================================================================
// SUGGESTION RANKER — Prioritize and rank suggestions
// =============================================================================

import type {
  ProactiveSuggestion,
  SuggestionType,
  SuggestionPriority,
  ScanConfig,
} from './types';

/**
 * Ranks and prioritizes suggestions
 */
export class SuggestionRanker {
  private config: ScanConfig;

  // Priority weights
  private readonly priorityWeights: Record<SuggestionPriority, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };

  // Type weights
  private readonly typeWeights: Record<SuggestionType, number> = {
    issue: 1.5,
    insight: 1.0,
    optimization: 1.2,
    pattern: 0.8,
  };

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * Rank all suggestions by importance
   */
  rank(suggestions: ProactiveSuggestion[]): ProactiveSuggestion[] {
    // Calculate scores
    const scored = suggestions.map(s => ({
      suggestion: s,
      score: this.calculateScore(s),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply diversity (don't show too many of same type)
    const diversified = this.applyDiversity(scored);

    // Limit to max suggestions
    return diversified.slice(0, this.config.maxSuggestions);
  }

  /**
   * Calculate suggestion score
   */
  private calculateScore(suggestion: ProactiveSuggestion): number {
    let score = 0;

    // Base priority score
    score += this.priorityWeights[suggestion.priority];

    // Type weight
    score *= this.typeWeights[suggestion.type];

    // Confidence bonus
    score *= (0.5 + suggestion.confidence * 0.5);

    // Impact bonus
    const impactMultiplier =
      suggestion.impact.severity === 'high' ? 1.5 :
      suggestion.impact.severity === 'medium' ? 1.2 : 1.0;
    score *= impactMultiplier;

    // Affected cells bonus (log scale to prevent domination)
    const cellBonus = Math.log10(Math.max(1, suggestion.impact.cellCount) + 1);
    score += cellBonus * 5;

    // Auto-fix bonus
    if (this.hasAutoFix(suggestion)) {
      score *= 1.3;
    }

    // Freshness bonus (newer suggestions slightly prioritized)
    const ageMinutes = (Date.now() - suggestion.detectedAt) / 60000;
    const freshnessMultiplier = Math.max(0.8, 1 - ageMinutes / 1440); // Decay over 24 hours
    score *= freshnessMultiplier;

    return score;
  }

  /**
   * Apply diversity to avoid showing too many similar suggestions
   */
  private applyDiversity(
    scored: { suggestion: ProactiveSuggestion; score: number }[]
  ): ProactiveSuggestion[] {
    const result: ProactiveSuggestion[] = [];
    const typeCounts: Record<SuggestionType, number> = {
      issue: 0,
      insight: 0,
      optimization: 0,
      pattern: 0,
    };

    const maxPerType = Math.ceil(this.config.maxSuggestions / 3);

    for (const { suggestion } of scored) {
      // Check if we've hit the limit for this type
      if (typeCounts[suggestion.type] >= maxPerType) {
        // Still add if it's high priority
        if (suggestion.priority !== 'critical' && suggestion.priority !== 'high') {
          continue;
        }
      }

      result.push(suggestion);
      typeCounts[suggestion.type]++;

      if (result.length >= this.config.maxSuggestions) {
        break;
      }
    }

    return result;
  }

  /**
   * Check if suggestion has auto-fix action
   */
  private hasAutoFix(suggestion: ProactiveSuggestion): boolean {
    return suggestion.actions.some(a =>
      a.action === 'apply_fix' ||
      a.action === 'remove_duplicates' ||
      a.action === 'fill_missing' ||
      a.action === 'fix_format' ||
      a.action === 'optimize_formula'
    );
  }

  /**
   * Group suggestions by category
   */
  groupByCategory(suggestions: ProactiveSuggestion[]): Map<string, ProactiveSuggestion[]> {
    const groups = new Map<string, ProactiveSuggestion[]>();

    for (const suggestion of suggestions) {
      const existing = groups.get(suggestion.category) || [];
      existing.push(suggestion);
      groups.set(suggestion.category, existing);
    }

    return groups;
  }

  /**
   * Group suggestions by type
   */
  groupByType(suggestions: ProactiveSuggestion[]): Record<SuggestionType, ProactiveSuggestion[]> {
    const groups: Record<SuggestionType, ProactiveSuggestion[]> = {
      issue: [],
      insight: [],
      optimization: [],
      pattern: [],
    };

    for (const suggestion of suggestions) {
      groups[suggestion.type].push(suggestion);
    }

    return groups;
  }

  /**
   * Filter suggestions by type
   */
  filterByType(
    suggestions: ProactiveSuggestion[],
    types: SuggestionType[]
  ): ProactiveSuggestion[] {
    return suggestions.filter(s => types.includes(s.type));
  }

  /**
   * Filter suggestions by priority
   */
  filterByPriority(
    suggestions: ProactiveSuggestion[],
    minPriority: SuggestionPriority
  ): ProactiveSuggestion[] {
    const priorityOrder: SuggestionPriority[] = ['low', 'medium', 'high', 'critical'];
    const minIndex = priorityOrder.indexOf(minPriority);

    return suggestions.filter(s => {
      const index = priorityOrder.indexOf(s.priority);
      return index >= minIndex;
    });
  }

  /**
   * Get summary statistics
   */
  getSummary(suggestions: ProactiveSuggestion[]): SuggestionsSummary {
    const byType: Record<SuggestionType, number> = {
      issue: 0,
      insight: 0,
      optimization: 0,
      pattern: 0,
    };

    const byPriority: Record<SuggestionPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const suggestion of suggestions) {
      byType[suggestion.type]++;
      byPriority[suggestion.priority]++;
    }

    return {
      total: suggestions.length,
      byType,
      byPriority,
      hasAutoFix: suggestions.filter(s => this.hasAutoFix(s)).length,
      highPriority: byPriority.critical + byPriority.high,
    };
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface SuggestionsSummary {
  total: number;
  byType: Record<SuggestionType, number>;
  byPriority: Record<SuggestionPriority, number>;
  hasAutoFix: number;
  highPriority: number;
}
