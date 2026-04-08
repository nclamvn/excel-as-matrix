// ═══════════════════════════════════════════════════════════════════════════
// USER PROFICIENCY TRACKER — Adapts AI behavior to user skill level
// Tracks feature usage patterns to classify beginner/intermediate/expert
// ═══════════════════════════════════════════════════════════════════════════

// Logger available for future debug logging

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'expert';

export interface ProficiencyProfile {
  level: ProficiencyLevel;
  score: number; // 0-100
  signals: ProficiencySignals;
  lastUpdated: number;
}

export interface ProficiencySignals {
  formulasUsed: number;
  complexFormulasUsed: number; // VLOOKUP, INDEX/MATCH, array formulas
  shortcutsUsed: number;
  aiInteractions: number;
  sheetsCreated: number;
  chartsCreated: number;
  macrosCreated: number;
  dataCleanerUsed: number;
  pivotTablesUsed: number;
  namedRangesUsed: number;
  conditionalFormatsUsed: number;
  sessionsCompleted: number;
}

export interface ProficiencyAdaptation {
  /** How verbose AI responses should be */
  responseVerbosity: 'detailed' | 'normal' | 'concise';
  /** Whether to show hints and tips */
  showHints: boolean;
  /** Whether to explain formulas step by step */
  explainFormulas: boolean;
  /** Suggest advanced features */
  suggestAdvanced: boolean;
  /** Default formula complexity in suggestions */
  formulaComplexity: 'simple' | 'moderate' | 'advanced';
  /** System prompt modifier */
  systemPromptAddon: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'excelai-proficiency';

const COMPLEX_FORMULAS = [
  'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', 'INDIRECT',
  'OFFSET', 'SUMPRODUCT', 'ARRAYFORMULA', 'LAMBDA',
  'LET', 'MAP', 'FILTER', 'SORT', 'UNIQUE', 'SEQUENCE',
  'XLOOKUP', 'XMATCH', 'IFS', 'SWITCH',
];

// ─────────────────────────────────────────────────────────────────────────────
// ProficiencyTracker Class
// ─────────────────────────────────────────────────────────────────────────────

export class ProficiencyTracker {
  private profile: ProficiencyProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Signal Recording
  // ─────────────────────────────────────────────────────────────────────────

  recordFormulaUse(formula: string): void {
    this.profile.signals.formulasUsed++;

    const upper = formula.toUpperCase();
    if (COMPLEX_FORMULAS.some((f) => upper.includes(f))) {
      this.profile.signals.complexFormulasUsed++;
    }

    this.recalculate();
  }

  recordShortcutUse(): void {
    this.profile.signals.shortcutsUsed++;
    this.recalculate();
  }

  recordAIInteraction(): void {
    this.profile.signals.aiInteractions++;
    this.recalculate();
  }

  recordSheetCreated(): void {
    this.profile.signals.sheetsCreated++;
    this.recalculate();
  }

  recordChartCreated(): void {
    this.profile.signals.chartsCreated++;
    this.recalculate();
  }

  recordMacroCreated(): void {
    this.profile.signals.macrosCreated++;
    this.recalculate();
  }

  recordFeatureUse(feature: 'dataCleaner' | 'pivotTable' | 'namedRange' | 'conditionalFormat'): void {
    switch (feature) {
      case 'dataCleaner': this.profile.signals.dataCleanerUsed++; break;
      case 'pivotTable': this.profile.signals.pivotTablesUsed++; break;
      case 'namedRange': this.profile.signals.namedRangesUsed++; break;
      case 'conditionalFormat': this.profile.signals.conditionalFormatsUsed++; break;
    }
    this.recalculate();
  }

  recordSessionComplete(): void {
    this.profile.signals.sessionsCompleted++;
    this.recalculate();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Score Calculation
  // ─────────────────────────────────────────────────────────────────────────

  private recalculate(): void {
    const s = this.profile.signals;

    // Weighted scoring (higher weight = stronger signal of expertise)
    let score = 0;

    // Basic usage (max 20 points)
    score += Math.min(10, s.formulasUsed * 0.5);
    score += Math.min(10, s.sessionsCompleted * 2);

    // Intermediate signals (max 30 points)
    score += Math.min(10, s.shortcutsUsed * 0.3);
    score += Math.min(10, s.sheetsCreated * 2);
    score += Math.min(10, s.chartsCreated * 3);

    // Advanced signals (max 50 points)
    score += Math.min(15, s.complexFormulasUsed * 3);
    score += Math.min(10, s.macrosCreated * 5);
    score += Math.min(10, s.dataCleanerUsed * 3);
    score += Math.min(5, s.pivotTablesUsed * 5);
    score += Math.min(5, s.namedRangesUsed * 3);
    score += Math.min(5, s.conditionalFormatsUsed * 2);

    this.profile.score = Math.min(100, Math.round(score));

    // Classify level
    if (this.profile.score >= 60) {
      this.profile.level = 'expert';
    } else if (this.profile.score >= 25) {
      this.profile.level = 'intermediate';
    } else {
      this.profile.level = 'beginner';
    }

    this.profile.lastUpdated = Date.now();
    this.saveProfile();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Adaptation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get adaptation settings based on current proficiency level
   */
  getAdaptation(): ProficiencyAdaptation {
    switch (this.profile.level) {
      case 'beginner':
        return {
          responseVerbosity: 'detailed',
          showHints: true,
          explainFormulas: true,
          suggestAdvanced: false,
          formulaComplexity: 'simple',
          systemPromptAddon: `
## User Proficiency: BEGINNER
- Use simple language and explain concepts step by step
- When suggesting formulas, explain what each part does
- Offer tips and keyboard shortcuts proactively
- Prefer simple formulas (SUM, AVERAGE, IF) over complex ones
- Ask before making multi-step changes`,
        };

      case 'intermediate':
        return {
          responseVerbosity: 'normal',
          showHints: false,
          explainFormulas: false,
          suggestAdvanced: true,
          formulaComplexity: 'moderate',
          systemPromptAddon: `
## User Proficiency: INTERMEDIATE
- Be concise but explain non-obvious decisions
- Suggest moderately complex formulas when appropriate
- Mention advanced alternatives when relevant
- User knows basics — don't over-explain simple operations`,
        };

      case 'expert':
        return {
          responseVerbosity: 'concise',
          showHints: false,
          explainFormulas: false,
          suggestAdvanced: true,
          formulaComplexity: 'advanced',
          systemPromptAddon: `
## User Proficiency: EXPERT
- Be very concise — skip basic explanations
- Use advanced formulas freely (XLOOKUP, LAMBDA, array formulas)
- Suggest optimal approaches, not just working ones
- User is proficient — focus on efficiency and power features`,
        };
    }
  }

  /**
   * Get the system prompt addon for AI
   */
  getSystemPromptAddon(): string {
    return this.getAdaptation().systemPromptAddon;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile Management
  // ─────────────────────────────────────────────────────────────────────────

  getProfile(): ProficiencyProfile {
    return { ...this.profile };
  }

  getLevel(): ProficiencyLevel {
    return this.profile.level;
  }

  getScore(): number {
    return this.profile.score;
  }

  /**
   * Manually override level (e.g., from settings)
   */
  setLevel(level: ProficiencyLevel): void {
    this.profile.level = level;
    switch (level) {
      case 'beginner': this.profile.score = 10; break;
      case 'intermediate': this.profile.score = 40; break;
      case 'expert': this.profile.score = 80; break;
    }
    this.saveProfile();
  }

  /**
   * Reset proficiency tracking
   */
  reset(): void {
    this.profile = this.createDefaultProfile();
    this.saveProfile();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────────

  private loadProfile(): ProficiencyProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return this.createDefaultProfile();
  }

  private saveProfile(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Storage full or unavailable
    }
  }

  private createDefaultProfile(): ProficiencyProfile {
    return {
      level: 'beginner',
      score: 0,
      signals: {
        formulasUsed: 0,
        complexFormulasUsed: 0,
        shortcutsUsed: 0,
        aiInteractions: 0,
        sheetsCreated: 0,
        chartsCreated: 0,
        macrosCreated: 0,
        dataCleanerUsed: 0,
        pivotTablesUsed: 0,
        namedRangesUsed: 0,
        conditionalFormatsUsed: 0,
        sessionsCompleted: 0,
      },
      lastUpdated: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const proficiencyTracker = new ProficiencyTracker();
