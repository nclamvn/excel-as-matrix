// =============================================================================
// CONFIDENCE ENGINE — Calculate AI confidence scores (Blueprint §5.4.6)
// =============================================================================

import type {
  ConfidenceScore,
  ConfidenceBreakdown,
  ConfidenceLevel,
  ConfidenceWeights,
  TrustConfig,
} from './types';
import { DEFAULT_TRUST_CONFIG, CONFIDENCE_THRESHOLDS } from './types';

// -----------------------------------------------------------------------------
// Confidence Engine Class
// -----------------------------------------------------------------------------

export class ConfidenceEngine {
  private config: TrustConfig;
  private baselineAccuracy: number = 0.7; // Default historical accuracy

  constructor(config: Partial<TrustConfig> = {}) {
    this.config = { ...DEFAULT_TRUST_CONFIG, ...config };
  }

  // ---------------------------------------------------------------------------
  // Main Confidence Calculation
  // ---------------------------------------------------------------------------

  /**
   * Calculate confidence score for a task
   */
  calculateConfidence(params: {
    dataQuality?: number;
    intentClarity?: number;
    taskComplexity?: number;
    historicalAccuracy?: number;
    groundingStrength?: number;
  }): ConfidenceScore {
    // Build breakdown with defaults
    const breakdown: ConfidenceBreakdown = {
      dataQuality: this.clamp(params.dataQuality ?? 0.7),
      intentClarity: this.clamp(params.intentClarity ?? 0.7),
      taskComplexity: this.clamp(params.taskComplexity ?? 0.7),
      historicalAccuracy: this.clamp(params.historicalAccuracy ?? this.baselineAccuracy),
      groundingStrength: this.clamp(params.groundingStrength ?? 0.5),
    };

    // Calculate weighted average
    const overall = this.calculateWeightedAverage(breakdown);

    // Determine level
    const level = this.determineLevel(overall);

    // Generate explanation
    const explanation = this.generateExplanation(breakdown, level);

    return {
      overall,
      level,
      breakdown,
      explanation,
      assessedAt: new Date(),
    };
  }

  /**
   * Calculate confidence from context analysis
   */
  calculateFromContext(context: {
    cellCount: number;
    formulaCount: number;
    hasAmbiguity: boolean;
    hasConflicts: boolean;
    referencedRanges: number;
    userRequestLength: number;
    matchedPatterns: number;
  }): ConfidenceScore {
    // Data quality based on completeness
    const dataQuality = this.assessDataQuality(context);

    // Intent clarity from request analysis
    const intentClarity = this.assessIntentClarity(context);

    // Task complexity (inverse - simple = high)
    const taskComplexity = this.assessTaskComplexity(context);

    // Grounding strength from references
    const groundingStrength = this.assessGroundingStrength(context);

    return this.calculateConfidence({
      dataQuality,
      intentClarity,
      taskComplexity,
      groundingStrength,
    });
  }

  // ---------------------------------------------------------------------------
  // Factor Assessment Methods
  // ---------------------------------------------------------------------------

  private assessDataQuality(context: {
    cellCount: number;
    hasConflicts: boolean;
  }): number {
    let score = 0.8; // Base score

    // Reduce for conflicts
    if (context.hasConflicts) {
      score -= 0.3;
    }

    // Bonus for having actual data
    if (context.cellCount > 0) {
      score += 0.1;
    }

    return this.clamp(score);
  }

  private assessIntentClarity(context: {
    hasAmbiguity: boolean;
    userRequestLength: number;
    matchedPatterns: number;
  }): number {
    let score = 0.7; // Base score

    // Reduce for ambiguity
    if (context.hasAmbiguity) {
      score -= 0.25;
    }

    // Longer, clearer requests
    if (context.userRequestLength > 50) {
      score += 0.1;
    }

    // Matched patterns increase clarity
    if (context.matchedPatterns > 0) {
      score += Math.min(0.2, context.matchedPatterns * 0.05);
    }

    return this.clamp(score);
  }

  private assessTaskComplexity(context: {
    formulaCount: number;
    cellCount: number;
    referencedRanges: number;
  }): number {
    // Start high (simple task)
    let score = 0.9;

    // Complex formulas reduce score
    if (context.formulaCount > 5) {
      score -= 0.2;
    } else if (context.formulaCount > 0) {
      score -= 0.1;
    }

    // Large cell counts reduce score
    if (context.cellCount > 100) {
      score -= 0.2;
    } else if (context.cellCount > 20) {
      score -= 0.1;
    }

    // Many ranges increase complexity
    if (context.referencedRanges > 3) {
      score -= 0.15;
    }

    return this.clamp(score);
  }

  private assessGroundingStrength(context: {
    referencedRanges: number;
    cellCount: number;
  }): number {
    let score = 0.5; // Base score

    // More references = better grounding
    if (context.referencedRanges > 0) {
      score += Math.min(0.3, context.referencedRanges * 0.1);
    }

    // Having cell data improves grounding
    if (context.cellCount > 0) {
      score += 0.2;
    }

    return this.clamp(score);
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private calculateWeightedAverage(breakdown: ConfidenceBreakdown): number {
    const weights = this.config.weights;

    const weighted =
      breakdown.dataQuality * weights.dataQuality +
      breakdown.intentClarity * weights.intentClarity +
      breakdown.taskComplexity * weights.taskComplexity +
      breakdown.historicalAccuracy * weights.historicalAccuracy +
      breakdown.groundingStrength * weights.groundingStrength;

    return Math.round(weighted * 100) / 100;
  }

  private determineLevel(score: number): ConfidenceLevel {
    if (score >= CONFIDENCE_THRESHOLDS.very_high) return 'very_high';
    if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
    if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
    if (score >= CONFIDENCE_THRESHOLDS.low) return 'low';
    return 'very_low';
  }

  private generateExplanation(
    breakdown: ConfidenceBreakdown,
    level: ConfidenceLevel
  ): string {
    const factors: string[] = [];

    // Identify strengths
    if (breakdown.dataQuality >= 0.8) {
      factors.push('good data quality');
    }
    if (breakdown.intentClarity >= 0.8) {
      factors.push('clear intent');
    }
    if (breakdown.taskComplexity >= 0.8) {
      factors.push('straightforward task');
    }
    if (breakdown.groundingStrength >= 0.7) {
      factors.push('well-grounded in data');
    }

    // Identify weaknesses
    if (breakdown.dataQuality < 0.5) {
      factors.push('data quality concerns');
    }
    if (breakdown.intentClarity < 0.5) {
      factors.push('ambiguous intent');
    }
    if (breakdown.taskComplexity < 0.5) {
      factors.push('complex task');
    }
    if (breakdown.groundingStrength < 0.4) {
      factors.push('limited grounding');
    }

    const levelText = this.getLevelText(level);

    if (factors.length === 0) {
      return `${levelText} confidence based on balanced assessment.`;
    }

    return `${levelText} confidence: ${factors.join(', ')}.`;
  }

  private getLevelText(level: ConfidenceLevel): string {
    switch (level) {
      case 'very_high':
        return 'Very high';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      case 'very_low':
        return 'Very low';
    }
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Update weights
   */
  updateWeights(weights: Partial<ConfidenceWeights>): void {
    this.config.weights = { ...this.config.weights, ...weights };
  }

  /**
   * Set baseline accuracy from calibration
   */
  setBaselineAccuracy(accuracy: number): void {
    this.baselineAccuracy = this.clamp(accuracy);
  }

  /**
   * Get current weights
   */
  getWeights(): ConfidenceWeights {
    return { ...this.config.weights };
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  /**
   * Format confidence for display
   */
  formatConfidence(score: ConfidenceScore): string {
    const percentage = Math.round(score.overall * 100);
    const icon = this.getConfidenceIcon(score.level);
    return `${icon} ${percentage}% confidence`;
  }

  /**
   * Get icon for confidence level
   */
  getConfidenceIcon(level: ConfidenceLevel): string {
    switch (level) {
      case 'very_high':
        return '🟢';
      case 'high':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟠';
      case 'very_low':
        return '🔴';
    }
  }

  /**
   * Get color for confidence level
   */
  getConfidenceColor(level: ConfidenceLevel): string {
    switch (level) {
      case 'very_high':
        return '#15803d'; // green-700
      case 'high':
        return '#22c55e'; // green-500
      case 'medium':
        return '#eab308'; // yellow-500
      case 'low':
        return '#f97316'; // orange-500
      case 'very_low':
        return '#ef4444'; // red-500
    }
  }
}

// Export singleton
export const confidenceEngine = new ConfidenceEngine();
