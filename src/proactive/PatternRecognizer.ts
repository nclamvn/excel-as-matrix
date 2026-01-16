// =============================================================================
// PATTERN RECOGNIZER — Detect repetitive user actions
// =============================================================================

import type {
  SheetData,
  UserPattern,
  ActionRecord,
  ScanConfig,
} from './types';

/**
 * Recognizes repetitive user patterns and suggests automation
 */
export class PatternRecognizer {
  private config: ScanConfig;
  private actionHistory: ActionRecord[] = [];
  private readonly maxHistorySize = 1000;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * Record a user action
   */
  recordAction(action: ActionRecord): void {
    this.actionHistory.push(action);

    // Limit history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Detect patterns from action history
   */
  async detect(data: SheetData): Promise<UserPattern[]> {
    const patterns: UserPattern[] = [];

    // Detect different pattern types
    patterns.push(...this.detectRepetitiveActions());
    patterns.push(...this.detectCopyPastePatterns());
    patterns.push(...this.detectManualCalculations(data));
    patterns.push(...this.detectDataEntryPatterns(data));
    patterns.push(...this.detectFormattingPatterns());

    return patterns;
  }

  /**
   * Detect repetitive action sequences
   */
  private detectRepetitiveActions(): UserPattern[] {
    const patterns: UserPattern[] = [];
    const sequences = this.findRepeatingSequences();

    for (const seq of sequences) {
      if (seq.frequency >= this.config.patternMinFrequency) {
        patterns.push({
          id: `pattern-rep-${seq.hash}`,
          type: 'pattern',
          patternType: 'repetitive_action',
          priority: seq.frequency > 10 ? 'high' : 'medium',
          status: 'pending',

          title: 'Repetitive actions detected',
          description: `You've performed this ${seq.actions.length}-step sequence ${seq.frequency} times`,
          details: seq.actions.map(a => a.type).join(' → '),

          sheetId: '',
          affectedCells: seq.actions.filter(a => a.cellRef).map(a => a.cellRef!),

          confidence: 0.8,
          impact: {
            cellCount: seq.actions.length * seq.frequency,
            severity: 'medium',
            description: `Could save time by automating this workflow`,
          },

          actions: [
            {
              id: 'automate',
              label: 'Create automation',
              type: 'primary',
              action: 'automate',
              params: { sequence: seq.actions },
            },
            {
              id: 'dismiss',
              label: 'Dismiss',
              type: 'secondary',
              action: 'dismiss',
            },
          ],

          detectedAt: Date.now(),
          category: 'patterns',
          tags: ['automation', 'workflow'],

          frequency: seq.frequency,
          lastOccurrence: seq.lastOccurrence,
          automationSuggestion: {
            description: `Automate this ${seq.actions.length}-step workflow`,
            steps: seq.actions.map((a, i) => `${i + 1}. ${this.describeAction(a)}`),
            estimatedTimeSaved: `${Math.round(seq.frequency * seq.actions.length * 2)} seconds per week`,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect copy-paste patterns
   */
  private detectCopyPastePatterns(): UserPattern[] {
    const patterns: UserPattern[] = [];
    const copyPasteActions = this.actionHistory.filter(
      a => a.type === 'copy' || a.type === 'paste'
    );

    if (copyPasteActions.length < 6) return patterns;

    // Count paste frequency
    let pasteCount = 0;
    for (const action of copyPasteActions) {
      if (action.type === 'paste') pasteCount++;
    }

    if (pasteCount >= 5) {
      patterns.push({
        id: 'pattern-copypaste',
        type: 'pattern',
        patternType: 'copy_paste',
        priority: 'medium',
        status: 'pending',

        title: 'Frequent copy-paste detected',
        description: `You've pasted ${pasteCount} times recently. Consider using fill-down or formulas.`,

        sheetId: '',
        affectedCells: [],

        confidence: 0.7,
        impact: {
          cellCount: pasteCount,
          severity: 'low',
          description: 'Repeated pasting can be automated',
        },

        actions: [
          {
            id: 'learn',
            label: 'Learn faster methods',
            type: 'primary',
            action: 'learn_more',
          },
        ],

        detectedAt: Date.now(),
        category: 'patterns',
        tags: ['copy-paste', 'efficiency'],

        frequency: pasteCount,
        lastOccurrence: copyPasteActions[copyPasteActions.length - 1].timestamp,
        automationSuggestion: {
          description: 'Use fill-down (Ctrl+D) or formulas instead of copy-paste',
          steps: [
            '1. Select the cell with the formula',
            '2. Select the range to fill',
            '3. Press Ctrl+D to fill down',
          ],
          estimatedTimeSaved: '30 seconds per operation',
        },
      });
    }

    return patterns;
  }

  /**
   * Detect manual calculations that could be formulas
   */
  private detectManualCalculations(data: SheetData): UserPattern[] {
    const patterns: UserPattern[] = [];

    // Find cells that look like manual totals
    for (let row = 0; row < data.rowCount; row++) {
      for (let col = 0; col < data.colCount; col++) {
        const cell = data.cells[row]?.[col];
        if (!cell || cell.formula || cell.type !== 'number') continue;

        // Check if this looks like a sum of cells above
        let sumAbove = 0;
        let countAbove = 0;
        for (let r = row - 1; r >= 0 && countAbove < 10; r--) {
          const aboveCell = data.cells[r]?.[col];
          if (aboveCell?.type === 'number' && typeof aboveCell.value === 'number') {
            sumAbove += aboveCell.value;
            countAbove++;
          } else if (aboveCell?.type !== 'empty') {
            break;
          }
        }

        if (countAbove >= 3 && Math.abs(sumAbove - (cell.value as number)) < 0.01) {
          patterns.push({
            id: `pattern-manual-${cell.ref}`,
            type: 'pattern',
            patternType: 'manual_calculation',
            priority: 'medium',
            status: 'pending',

            title: 'Manual total detected',
            description: `Cell ${cell.ref} appears to be a manual sum of cells above`,

            sheetId: data.sheetId,
            affectedCells: [cell.ref],

            confidence: 0.85,
            impact: {
              cellCount: 1,
              severity: 'medium',
              description: 'Manual calculations need to be updated when data changes',
            },

            actions: [
              {
                id: 'convert',
                label: 'Convert to formula',
                type: 'primary',
                action: 'apply_fix',
                params: {
                  cellRef: cell.ref,
                  formula: `=SUM(${this.getColLetter(col)}${row - countAbove + 1}:${this.getColLetter(col)}${row})`,
                },
              },
            ],

            detectedAt: Date.now(),
            category: 'patterns',
            tags: ['manual', 'formula'],

            frequency: 1,
            lastOccurrence: Date.now(),
            automationSuggestion: {
              description: 'Replace manual calculation with SUM formula',
              steps: [
                `1. Select cell ${cell.ref}`,
                `2. Enter: =SUM(${this.getColLetter(col)}${row - countAbove + 1}:${this.getColLetter(col)}${row})`,
                '3. Press Enter',
              ],
              estimatedTimeSaved: 'Automatic updates when data changes',
            },
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect data entry patterns (e.g., same values repeated)
   */
  private detectDataEntryPatterns(_data: SheetData): UserPattern[] {
    const patterns: UserPattern[] = [];
    const recentEdits = this.actionHistory.filter(
      a => a.type === 'edit' && a.value !== undefined
    );

    if (recentEdits.length < 5) return patterns;

    // Find repeated values
    const valueCounts = new Map<string, number>();
    for (const edit of recentEdits) {
      const key = String(edit.value);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    }

    for (const [value, count] of valueCounts) {
      if (count >= 5 && value.length > 0) {
        patterns.push({
          id: `pattern-entry-${value.substring(0, 10)}`,
          type: 'pattern',
          patternType: 'data_entry',
          priority: 'low',
          status: 'pending',

          title: 'Repeated data entry detected',
          description: `You've entered "${value.substring(0, 20)}${value.length > 20 ? '...' : ''}" ${count} times`,

          sheetId: '',
          affectedCells: [],

          confidence: 0.6,
          impact: {
            cellCount: count,
            severity: 'low',
            description: 'Consider using data validation or autocomplete',
          },

          actions: [
            {
              id: 'dropdown',
              label: 'Create dropdown',
              type: 'primary',
              action: 'learn_more',
            },
          ],

          detectedAt: Date.now(),
          category: 'patterns',
          tags: ['data-entry', 'validation'],

          frequency: count,
          lastOccurrence: Date.now(),
          automationSuggestion: {
            description: 'Create a dropdown list for frequently entered values',
            steps: [
              '1. Select the cells where you want the dropdown',
              '2. Go to Data → Data Validation',
              '3. Choose "List" and add your common values',
            ],
            estimatedTimeSaved: 'Faster entry and fewer typos',
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect formatting patterns
   */
  private detectFormattingPatterns(): UserPattern[] {
    const patterns: UserPattern[] = [];
    const formatActions = this.actionHistory.filter(a => a.type === 'format');

    if (formatActions.length < 5) return patterns;

    // Count format operations
    if (formatActions.length >= 10) {
      patterns.push({
        id: 'pattern-formatting',
        type: 'pattern',
        patternType: 'formatting',
        priority: 'low',
        status: 'pending',

        title: 'Frequent formatting detected',
        description: `You've applied formatting ${formatActions.length} times. Consider using styles.`,

        sheetId: '',
        affectedCells: [],

        confidence: 0.6,
        impact: {
          cellCount: formatActions.length,
          severity: 'low',
          description: 'Using styles ensures consistent formatting',
        },

        actions: [
          {
            id: 'styles',
            label: 'Learn about styles',
            type: 'primary',
            action: 'learn_more',
          },
        ],

        detectedAt: Date.now(),
        category: 'patterns',
        tags: ['formatting', 'styles'],

        frequency: formatActions.length,
        lastOccurrence: formatActions[formatActions.length - 1].timestamp,
        automationSuggestion: {
          description: 'Create and apply cell styles for consistent formatting',
          steps: [
            '1. Format a cell the way you want',
            '2. Create a new cell style',
            '3. Apply the style to other cells',
          ],
          estimatedTimeSaved: '5 seconds per cell formatted',
        },
      });
    }

    return patterns;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Find repeating sequences of actions
   */
  private findRepeatingSequences(): SequenceInfo[] {
    const sequences: Map<string, SequenceInfo> = new Map();
    const minSequenceLength = 2;
    const maxSequenceLength = 5;

    for (let len = minSequenceLength; len <= maxSequenceLength; len++) {
      for (let i = 0; i <= this.actionHistory.length - len; i++) {
        const sequence = this.actionHistory.slice(i, i + len);
        const hash = this.hashSequence(sequence);

        const existing = sequences.get(hash);
        if (existing) {
          existing.frequency++;
          existing.lastOccurrence = sequence[sequence.length - 1].timestamp;
        } else {
          sequences.set(hash, {
            hash,
            actions: sequence,
            frequency: 1,
            lastOccurrence: sequence[sequence.length - 1].timestamp,
          });
        }
      }
    }

    return Array.from(sequences.values())
      .filter(s => s.frequency >= this.config.patternMinFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Hash a sequence of actions for comparison
   */
  private hashSequence(actions: ActionRecord[]): string {
    return actions.map(a => `${a.type}:${a.cellRef || ''}`).join('|');
  }

  /**
   * Describe an action in human-readable form
   */
  private describeAction(action: ActionRecord): string {
    switch (action.type) {
      case 'edit':
        return `Edit ${action.cellRef || 'cell'}`;
      case 'copy':
        return 'Copy';
      case 'paste':
        return `Paste to ${action.cellRef || 'cell'}`;
      case 'format':
        return 'Apply formatting';
      case 'delete':
        return `Delete ${action.cellRef || 'cell'}`;
      case 'insert':
        return 'Insert row/column';
      default:
        return action.type;
    }
  }

  /**
   * Get column letter from index
   */
  private getColLetter(col: number): string {
    let result = '';
    let c = col;
    while (c >= 0) {
      result = String.fromCharCode(65 + (c % 26)) + result;
      c = Math.floor(c / 26) - 1;
    }
    return result;
  }

  /**
   * Clear action history
   */
  clearHistory(): void {
    this.actionHistory = [];
  }

  /**
   * Get action history (for debugging)
   */
  getHistory(): ActionRecord[] {
    return [...this.actionHistory];
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface SequenceInfo {
  hash: string;
  actions: ActionRecord[];
  frequency: number;
  lastOccurrence: number;
}
