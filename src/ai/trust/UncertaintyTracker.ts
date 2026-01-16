// =============================================================================
// UNCERTAINTY TRACKER — Track and manage AI uncertainties (Blueprint §5.4.6)
// =============================================================================

import type {
  UncertaintyInfo,
  UncertaintyItem,
  UncertaintyType,
  UncertaintySeverity,
} from './types';

// -----------------------------------------------------------------------------
// Uncertainty Descriptions
// -----------------------------------------------------------------------------

const UNCERTAINTY_DESCRIPTIONS: Record<UncertaintyType, string> = {
  ambiguous_intent: 'The request could be interpreted in multiple ways',
  incomplete_data: 'Some required data is missing from the spreadsheet',
  conflicting_data: 'Inconsistent or contradictory data detected',
  complex_formula: 'Formula is too complex to fully validate',
  external_dependency: 'Result depends on external data sources',
  edge_case: 'This is an unusual situation that may need special handling',
  limited_context: 'Not enough context to fully understand the task',
  multiple_interpretations: 'Multiple valid solutions exist for this request',
};

const UNCERTAINTY_SUGGESTIONS: Record<UncertaintyType, string> = {
  ambiguous_intent: 'Please clarify your request with more specific details',
  incomplete_data: 'Fill in the missing data or specify how to handle gaps',
  conflicting_data: 'Review and resolve the data inconsistencies',
  complex_formula: 'Review the formula logic carefully before applying',
  external_dependency: 'Verify external references are up to date',
  edge_case: 'Review the proposed solution carefully',
  limited_context: 'Provide more context about what you want to achieve',
  multiple_interpretations: 'Review the options and select the best fit',
};

// -----------------------------------------------------------------------------
// Uncertainty Tracker Class
// -----------------------------------------------------------------------------

export class UncertaintyTracker {
  private uncertainties: Map<string, UncertaintyItem[]> = new Map();

  // ---------------------------------------------------------------------------
  // Add Uncertainty
  // ---------------------------------------------------------------------------

  /**
   * Add an uncertainty item
   */
  addUncertainty(
    responseId: string,
    type: UncertaintyType,
    options: {
      severity?: UncertaintySeverity;
      description?: string;
      suggestion?: string;
      affectedCells?: string[];
    } = {}
  ): UncertaintyItem {
    const item: UncertaintyItem = {
      id: crypto.randomUUID(),
      type,
      severity: options.severity ?? this.inferSeverity(type),
      description: options.description ?? UNCERTAINTY_DESCRIPTIONS[type],
      suggestion: options.suggestion ?? UNCERTAINTY_SUGGESTIONS[type],
      affectedCells: options.affectedCells,
    };

    const existing = this.uncertainties.get(responseId) || [];
    existing.push(item);
    this.uncertainties.set(responseId, existing);

    return item;
  }

  /**
   * Add multiple uncertainties at once
   */
  addUncertainties(
    responseId: string,
    types: UncertaintyType[]
  ): UncertaintyItem[] {
    return types.map((type) => this.addUncertainty(responseId, type));
  }

  // ---------------------------------------------------------------------------
  // Query Uncertainties
  // ---------------------------------------------------------------------------

  /**
   * Get uncertainty info for a response
   */
  getUncertaintyInfo(responseId: string): UncertaintyInfo {
    const items = this.uncertainties.get(responseId) || [];
    const criticalCount = items.filter((i) => i.severity === 'critical').length;
    const highCount = items.filter((i) => i.severity === 'high').length;

    return {
      items,
      hasBlockingUncertainty: criticalCount > 0 || highCount > 1,
      totalCount: items.length,
      criticalCount,
      summary: this.generateSummary(items),
    };
  }

  /**
   * Get all uncertainties for a response
   */
  getUncertainties(responseId: string): UncertaintyItem[] {
    return this.uncertainties.get(responseId) || [];
  }

  /**
   * Check if response has blocking uncertainties
   */
  hasBlockingUncertainties(responseId: string): boolean {
    const info = this.getUncertaintyInfo(responseId);
    return info.hasBlockingUncertainty;
  }

  // ---------------------------------------------------------------------------
  // Resolve Uncertainties
  // ---------------------------------------------------------------------------

  /**
   * Mark an uncertainty as resolved
   */
  resolveUncertainty(responseId: string, uncertaintyId: string): boolean {
    const items = this.uncertainties.get(responseId);
    if (!items) return false;

    const item = items.find((i) => i.id === uncertaintyId);
    if (!item) return false;

    item.resolvedAt = new Date();
    return true;
  }

  /**
   * Resolve all uncertainties for a response
   */
  resolveAll(responseId: string): void {
    const items = this.uncertainties.get(responseId);
    if (!items) return;

    const now = new Date();
    for (const item of items) {
      item.resolvedAt = now;
    }
  }

  // ---------------------------------------------------------------------------
  // Analysis
  // ---------------------------------------------------------------------------

  /**
   * Analyze context and detect uncertainties
   */
  analyzeContext(
    responseId: string,
    context: {
      hasAmbiguousTerms?: boolean;
      missingCells?: string[];
      conflictingValues?: boolean;
      complexFormulas?: string[];
      externalRefs?: string[];
      isEdgeCase?: boolean;
      contextLength?: number;
      multipleOptions?: boolean;
    }
  ): UncertaintyInfo {
    // Clear existing uncertainties
    this.uncertainties.delete(responseId);

    // Detect uncertainties from context
    if (context.hasAmbiguousTerms) {
      this.addUncertainty(responseId, 'ambiguous_intent');
    }

    if (context.missingCells && context.missingCells.length > 0) {
      this.addUncertainty(responseId, 'incomplete_data', {
        affectedCells: context.missingCells,
      });
    }

    if (context.conflictingValues) {
      this.addUncertainty(responseId, 'conflicting_data', {
        severity: 'high',
      });
    }

    if (context.complexFormulas && context.complexFormulas.length > 0) {
      this.addUncertainty(responseId, 'complex_formula', {
        affectedCells: context.complexFormulas,
      });
    }

    if (context.externalRefs && context.externalRefs.length > 0) {
      this.addUncertainty(responseId, 'external_dependency', {
        affectedCells: context.externalRefs,
      });
    }

    if (context.isEdgeCase) {
      this.addUncertainty(responseId, 'edge_case');
    }

    if (context.contextLength !== undefined && context.contextLength < 20) {
      this.addUncertainty(responseId, 'limited_context');
    }

    if (context.multipleOptions) {
      this.addUncertainty(responseId, 'multiple_interpretations');
    }

    return this.getUncertaintyInfo(responseId);
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private inferSeverity(type: UncertaintyType): UncertaintySeverity {
    switch (type) {
      case 'conflicting_data':
      case 'external_dependency':
        return 'high';
      case 'ambiguous_intent':
      case 'incomplete_data':
      case 'complex_formula':
        return 'medium';
      case 'edge_case':
      case 'limited_context':
      case 'multiple_interpretations':
        return 'low';
      default:
        return 'medium';
    }
  }

  private generateSummary(items: UncertaintyItem[]): string {
    if (items.length === 0) {
      return 'No uncertainties detected';
    }

    const unresolved = items.filter((i) => !i.resolvedAt);
    if (unresolved.length === 0) {
      return 'All uncertainties resolved';
    }

    const critical = unresolved.filter((i) => i.severity === 'critical');
    const high = unresolved.filter((i) => i.severity === 'high');

    if (critical.length > 0) {
      return `${critical.length} critical uncertainty requires attention`;
    }

    if (high.length > 0) {
      return `${high.length} high-priority uncertainties to review`;
    }

    return `${unresolved.length} minor uncertainties detected`;
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  /**
   * Get icon for uncertainty severity
   */
  getSeverityIcon(severity: UncertaintySeverity): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
    }
  }

  /**
   * Get color for uncertainty severity
   */
  getSeverityColor(severity: UncertaintySeverity): string {
    switch (severity) {
      case 'critical':
        return '#ef4444'; // red-500
      case 'high':
        return '#f97316'; // orange-500
      case 'medium':
        return '#eab308'; // yellow-500
      case 'low':
        return '#3b82f6'; // blue-500
    }
  }

  /**
   * Format uncertainty for display
   */
  formatUncertainty(item: UncertaintyItem): string {
    const icon = this.getSeverityIcon(item.severity);
    const resolved = item.resolvedAt ? ' (resolved)' : '';
    return `${icon} ${item.description}${resolved}`;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Clear uncertainties for a response
   */
  clear(responseId: string): void {
    this.uncertainties.delete(responseId);
  }

  /**
   * Clear all uncertainties
   */
  clearAll(): void {
    this.uncertainties.clear();
  }
}

// Export singleton
export const uncertaintyTracker = new UncertaintyTracker();
