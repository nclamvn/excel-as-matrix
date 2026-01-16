// =============================================================================
// TRUST MODULE — AI Confidence & Trust System (Blueprint §5.4.6, §5.5)
// =============================================================================

// Types
export type {
  ConfidenceBreakdown,
  ConfidenceWeights,
  ConfidenceLevel,
  ConfidenceScore,
  UncertaintyType,
  UncertaintySeverity,
  UncertaintyItem,
  UncertaintyInfo,
  SourceType,
  SourceAttribution,
  SourceInfo,
  PredictionOutcome,
  CalibrationRecord,
  CalibrationBucket,
  CalibrationMetrics,
  TrustScore,
  TrustRecommendation,
  TrustConfig,
} from './types';

// Constants
export {
  DEFAULT_CONFIDENCE_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  DEFAULT_TRUST_CONFIG,
} from './types';

// Engines
export { ConfidenceEngine, confidenceEngine } from './ConfidenceEngine';
export { UncertaintyTracker, uncertaintyTracker } from './UncertaintyTracker';
export { CalibrationTracker, calibrationTracker } from './CalibrationTracker';
