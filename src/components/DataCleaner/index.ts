// =============================================================================
// DATA CLEANER COMPONENTS — Module exports
// =============================================================================

// Main panel
export { DataCleanerPanel } from './DataCleanerPanel';
export { default as DataCleanerPanelDefault } from './DataCleanerPanel';

// Quality display
export { QualityScoreCard, MiniScore, GradeBadge } from './QualityScoreCard';
export { default as QualityScoreCardDefault } from './QualityScoreCard';

// Issues
export { IssuesList } from './IssuesList';
export { default as IssuesListDefault } from './IssuesList';

// Progress indicators
export {
  CleaningProgress,
  StepProgress,
  CircularProgress,
} from './CleaningProgress';
export { default as CleaningProgressDefault } from './CleaningProgress';

// Duplicates
export { DuplicatesView } from './DuplicatesView';
export { default as DuplicatesViewDefault } from './DuplicatesView';

// Format standardization
export { FormatPreview, FormatSettings } from './FormatPreview';
export { default as FormatPreviewDefault } from './FormatPreview';

// Missing values
export { MissingValuesView, StrategyInfo } from './MissingValuesView';
export { default as MissingValuesViewDefault } from './MissingValuesView';

// Inconsistencies
export { InconsistencyView, CommonInconsistencies } from './InconsistencyView';
export { default as InconsistencyViewDefault } from './InconsistencyView';

// Validation
export { ValidationReport, RuleBuilder } from './ValidationReport';
export { default as ValidationReportDefault } from './ValidationReport';

// Before/After preview
export { BeforeAfterPreview, DiffView } from './BeforeAfterPreview';
export { default as BeforeAfterPreviewDefault } from './BeforeAfterPreview';

// History
export { CleaningHistory, CompactHistoryBar } from './CleaningHistory';
export { default as CleaningHistoryDefault } from './CleaningHistory';
