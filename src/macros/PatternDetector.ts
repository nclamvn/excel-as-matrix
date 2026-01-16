// =============================================================================
// PATTERN DETECTOR — Detect repetitive patterns in user actions
// =============================================================================

import type {
  RecordedAction,
  DetectedPattern,
  Workflow,
  WorkflowStep,
} from './types';

/**
 * Detect repetitive patterns in user actions
 */
export class PatternDetector {
  private actionHistory: RecordedAction[] = [];
  private detectedPatterns: Map<string, DetectedPattern> = new Map();
  private readonly HISTORY_LIMIT = 1000;
  private readonly MIN_PATTERN_LENGTH = 2;
  private readonly MIN_OCCURRENCES = 2;

  /**
   * Record an action for pattern detection
   */
  recordAction(action: RecordedAction): void {
    this.actionHistory.push(action);

    // Limit history size
    if (this.actionHistory.length > this.HISTORY_LIMIT) {
      this.actionHistory = this.actionHistory.slice(-this.HISTORY_LIMIT);
    }

    // Analyze for patterns
    this.analyzePatterns();
  }

  /**
   * Get all detected patterns
   */
  analyze(): DetectedPattern[] {
    this.analyzePatterns();
    return Array.from(this.detectedPatterns.values())
      .filter(p => p.occurrences >= this.MIN_OCCURRENCES)
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Get a specific pattern
   */
  getPattern(patternId: string): DetectedPattern | null {
    return this.detectedPatterns.get(patternId) || null;
  }

  /**
   * Convert pattern to workflow
   */
  toWorkflow(pattern: DetectedPattern): Workflow {
    const steps: WorkflowStep[] = pattern.actions.map((action, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      type: 'action',
      action: {
        id: crypto.randomUUID(),
        type: action.type,
        params: this.generalizeParams(action.params),
      },
      enabled: true,
      label: this.getActionLabel(action),
    }));

    return {
      id: crypto.randomUUID(),
      name: pattern.suggestedName,
      steps,
      variables: this.extractVariables(pattern.actions),
      onError: 'stop',
    };
  }

  /**
   * Clear history and patterns
   */
  clear(): void {
    this.actionHistory = [];
    this.detectedPatterns.clear();
  }

  /**
   * Get suggestions based on current action
   */
  getSuggestions(currentAction: RecordedAction): DetectedPattern[] {
    const suggestions: DetectedPattern[] = [];

    for (const pattern of this.detectedPatterns.values()) {
      // Check if current action matches start of a pattern
      if (pattern.actions[0].type === currentAction.type) {
        suggestions.push(pattern);
      }
    }

    return suggestions.slice(0, 3);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private analyzePatterns(): void {
    if (this.actionHistory.length < this.MIN_PATTERN_LENGTH) return;

    // Find repeating sequences of different lengths
    for (let length = this.MIN_PATTERN_LENGTH; length <= Math.min(10, this.actionHistory.length / 2); length++) {
      this.findPatternsOfLength(length);
    }

    // Remove low-confidence patterns
    for (const [id, pattern] of this.detectedPatterns) {
      if (pattern.occurrences < this.MIN_OCCURRENCES || pattern.confidence < 0.5) {
        this.detectedPatterns.delete(id);
      }
    }
  }

  private findPatternsOfLength(length: number): void {
    const sequences = new Map<string, { actions: RecordedAction[]; occurrences: number; lastSeen: Date }>();

    for (let i = 0; i <= this.actionHistory.length - length; i++) {
      const sequence = this.actionHistory.slice(i, i + length);
      const key = this.getSequenceKey(sequence);

      if (sequences.has(key)) {
        const existing = sequences.get(key)!;
        existing.occurrences++;
        existing.lastSeen = sequence[sequence.length - 1].timestamp;
      } else {
        sequences.set(key, {
          actions: sequence,
          occurrences: 1,
          lastSeen: sequence[sequence.length - 1].timestamp,
        });
      }
    }

    // Convert to patterns
    for (const [key, data] of sequences) {
      if (data.occurrences >= this.MIN_OCCURRENCES) {
        const patternId = `pattern_${key}`;

        if (!this.detectedPatterns.has(patternId)) {
          this.detectedPatterns.set(patternId, {
            id: patternId,
            name: this.generatePatternName(data.actions),
            suggestedName: this.generateSuggestedName(data.actions),
            description: this.generateDescription(data.actions),
            actions: data.actions,
            occurrences: data.occurrences,
            lastSeen: data.lastSeen,
            confidence: this.calculateConfidence(data.actions, data.occurrences),
          });
        } else {
          const pattern = this.detectedPatterns.get(patternId)!;
          pattern.occurrences = data.occurrences;
          pattern.lastSeen = data.lastSeen;
          pattern.confidence = this.calculateConfidence(data.actions, data.occurrences);
        }
      }
    }
  }

  private getSequenceKey(actions: RecordedAction[]): string {
    return actions.map(a => `${a.type}:${a.sheetId || ''}:${a.range || ''}`).join('|');
  }

  private generatePatternName(actions: RecordedAction[]): string {
    const types = [...new Set(actions.map(a => a.type))];
    return types.slice(0, 3).join(' → ');
  }

  private generateSuggestedName(actions: RecordedAction[]): string {
    const firstAction = actions[0];
    const lastAction = actions[actions.length - 1];

    const actionNames: Record<string, string> = {
      copy_range: 'Copy',
      paste_range: 'Paste',
      format_cells: 'Format',
      apply_formula: 'Calculate',
      filter_data: 'Filter',
      sort_data: 'Sort',
      create_chart: 'Chart',
      export_pdf: 'Export PDF',
      export_excel: 'Export Excel',
      send_email: 'Email',
    };

    const first = actionNames[firstAction.type] || firstAction.type;
    const last = actionNames[lastAction.type] || lastAction.type;

    if (first === last) {
      return `${first} Workflow`;
    }

    return `${first} to ${last}`;
  }

  private generateDescription(actions: RecordedAction[]): string {
    const actionDescriptions = actions.map(a => {
      const range = a.range ? ` on ${a.range}` : '';
      return `${a.type.replace(/_/g, ' ')}${range}`;
    });

    return actionDescriptions.join(', then ');
  }

  private calculateConfidence(actions: RecordedAction[], occurrences: number): number {
    // Higher confidence for:
    // - More occurrences
    // - Consistent parameters
    // - Recent patterns

    let confidence = Math.min(occurrences * 0.2, 0.6);

    // Check parameter consistency
    const paramConsistency = this.checkParamConsistency(actions);
    confidence += paramConsistency * 0.3;

    // Bonus for longer patterns
    confidence += Math.min(actions.length * 0.02, 0.1);

    return Math.min(confidence, 1);
  }

  private checkParamConsistency(_actions: RecordedAction[]): number {
    // Check if parameters are similar across occurrences
    // For now, simple check
    return 0.5;
  }

  private generalizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const generalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (key === 'range' && typeof value === 'string') {
        // Keep range as variable reference
        generalized[key] = '{{selectedRange}}';
      } else {
        generalized[key] = value;
      }
    }

    return generalized;
  }

  private extractVariables(actions: RecordedAction[]): { name: string; type: 'string' | 'range'; isInput?: boolean }[] {
    const variables: { name: string; type: 'string' | 'range'; isInput?: boolean }[] = [];

    // Check for common variable needs
    const hasRange = actions.some(a => a.range);
    if (hasRange) {
      variables.push({
        name: 'selectedRange',
        type: 'range',
        isInput: true,
      });
    }

    return variables;
  }

  private getActionLabel(action: RecordedAction): string {
    const labels: Record<string, string> = {
      copy_range: 'Copy',
      paste_range: 'Paste',
      clear_range: 'Clear',
      format_cells: 'Format',
      apply_formula: 'Formula',
      filter_data: 'Filter',
      sort_data: 'Sort',
      create_chart: 'Chart',
      export_pdf: 'PDF',
      export_excel: 'Excel',
      send_email: 'Email',
    };

    return labels[action.type] || action.type;
  }
}
