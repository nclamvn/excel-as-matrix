// =============================================================================
// TRUST TYPES — Type definitions for AI confidence & trust (Blueprint §5.4.6)
// =============================================================================

// -----------------------------------------------------------------------------
// Confidence Types
// -----------------------------------------------------------------------------

/**
 * Confidence factors with individual scores (0-1)
 */
export interface ConfidenceBreakdown {
  dataQuality: number;        // How reliable is the source data
  intentClarity: number;      // How clear is the user's intent
  taskComplexity: number;     // Inverse of complexity (simple = high)
  historicalAccuracy: number; // Past performance on similar tasks
  groundingStrength: number;  // How well grounded in spreadsheet context
}

/**
 * Weights for confidence factors
 */
export interface ConfidenceWeights {
  dataQuality: number;
  intentClarity: number;
  taskComplexity: number;
  historicalAccuracy: number;
  groundingStrength: number;
}

/**
 * Confidence level thresholds
 */
export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

/**
 * Full confidence score with breakdown
 */
export interface ConfidenceScore {
  overall: number;            // 0-1 weighted average
  level: ConfidenceLevel;     // Categorical level
  breakdown: ConfidenceBreakdown;
  explanation: string;        // Human-readable explanation
  assessedAt: Date;
}

// -----------------------------------------------------------------------------
// Uncertainty Types
// -----------------------------------------------------------------------------

/**
 * Types of uncertainty the AI can have
 */
export type UncertaintyType =
  | 'ambiguous_intent'      // User request is unclear
  | 'incomplete_data'       // Missing information in spreadsheet
  | 'conflicting_data'      // Data inconsistencies detected
  | 'complex_formula'       // Formula too complex to fully validate
  | 'external_dependency'   // Depends on external data
  | 'edge_case'            // Unusual situation
  | 'limited_context'      // Not enough context available
  | 'multiple_interpretations'; // Request could mean different things

/**
 * Uncertainty severity levels
 */
export type UncertaintySeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Individual uncertainty item
 */
export interface UncertaintyItem {
  id: string;
  type: UncertaintyType;
  severity: UncertaintySeverity;
  description: string;
  suggestion?: string;        // How to resolve
  affectedCells?: string[];   // Which cells are affected
  resolvedAt?: Date;
}

/**
 * Collection of uncertainties for a response
 */
export interface UncertaintyInfo {
  items: UncertaintyItem[];
  hasBlockingUncertainty: boolean;  // Should prevent auto-apply
  totalCount: number;
  criticalCount: number;
  summary: string;
}

// -----------------------------------------------------------------------------
// Source Attribution Types
// -----------------------------------------------------------------------------

/**
 * Types of sources the AI can reference
 */
export type SourceType =
  | 'cell_reference'     // Direct cell value
  | 'range_reference'    // Range of cells
  | 'formula_analysis'   // Derived from formula inspection
  | 'pattern_detection'  // Detected pattern in data
  | 'user_history'       // Previous user interactions
  | 'domain_knowledge'   // Built-in knowledge
  | 'external_data';     // External reference

/**
 * Individual source attribution
 */
export interface SourceAttribution {
  id: string;
  type: SourceType;
  reference: string;          // Cell ref, range, or description
  confidence: number;         // How confident in this source (0-1)
  snippet?: string;           // Preview of the data
  relevance: string;          // Why this source matters
}

/**
 * Collection of sources for a response
 */
export interface SourceInfo {
  sources: SourceAttribution[];
  primarySource?: SourceAttribution;
  groundedInData: boolean;    // Is response grounded in actual data
  citationCount: number;
}

// -----------------------------------------------------------------------------
// Calibration Types
// -----------------------------------------------------------------------------

/**
 * Outcome of a prediction
 */
export type PredictionOutcome = 'correct' | 'incorrect' | 'partial' | 'unknown';

/**
 * Record of a single prediction for calibration
 */
export interface CalibrationRecord {
  id: string;
  taskType: string;           // Type of task (formula, formatting, etc.)
  predictedConfidence: number; // What AI said confidence was
  actualOutcome: PredictionOutcome;
  outcomeScore: number;       // 0-1 score of actual outcome
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Calibration statistics for a confidence bucket
 */
export interface CalibrationBucket {
  range: [number, number];    // e.g., [0.8, 0.9]
  predictedAccuracy: number;  // Average predicted confidence
  actualAccuracy: number;     // Actual success rate
  sampleCount: number;        // Number of samples
  isCalibrated: boolean;      // Is predicted close to actual?
}

/**
 * Overall calibration metrics
 */
export interface CalibrationMetrics {
  overallCalibration: number;  // 0-1, how well calibrated (1 = perfect)
  brier: number;               // Brier score (lower = better)
  buckets: CalibrationBucket[];
  totalPredictions: number;
  recentAccuracy: number;      // Last N predictions accuracy
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

// -----------------------------------------------------------------------------
// Trust Score Types
// -----------------------------------------------------------------------------

/**
 * Overall trust score combining multiple factors
 */
export interface TrustScore {
  overall: number;            // 0-100
  confidence: ConfidenceScore;
  uncertainty: UncertaintyInfo;
  sources: SourceInfo;
  calibration: CalibrationMetrics;
  recommendation: TrustRecommendation;
}

/**
 * Trust-based recommendation
 */
export interface TrustRecommendation {
  action: 'auto_apply' | 'review_suggested' | 'review_required' | 'manual_only';
  reason: string;
  riskFactors: string[];
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/**
 * Default confidence weights
 */
export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  dataQuality: 0.25,
  intentClarity: 0.25,
  taskComplexity: 0.15,
  historicalAccuracy: 0.20,
  groundingStrength: 0.15,
};

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  very_high: 0.9,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
  very_low: 0,
} as const;

/**
 * Trust configuration
 */
export interface TrustConfig {
  weights: ConfidenceWeights;
  thresholds: typeof CONFIDENCE_THRESHOLDS;
  calibrationWindowSize: number;  // How many records to keep
  autoApplyThreshold: number;     // Minimum confidence for auto-apply
  requireReviewThreshold: number; // Below this, review required
}

/**
 * Default trust configuration
 */
export const DEFAULT_TRUST_CONFIG: TrustConfig = {
  weights: DEFAULT_CONFIDENCE_WEIGHTS,
  thresholds: CONFIDENCE_THRESHOLDS,
  calibrationWindowSize: 100,
  autoApplyThreshold: 0.85,
  requireReviewThreshold: 0.5,
};
