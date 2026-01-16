// =============================================================================
// RISK ASSESSOR — Assess risk levels for sandbox changes (Blueprint §2.2.3)
// =============================================================================

import type {
  SandboxDiff,
  RiskAssessment,
  DetectedRisk,
  RiskLevel,
  RiskFactor,
  SandboxConfig,
} from './types';
import { DEFAULT_SANDBOX_CONFIG } from './types';

// -----------------------------------------------------------------------------
// Risk Factor Weights
// -----------------------------------------------------------------------------

const RISK_WEIGHTS: Record<RiskFactor, number> = {
  large_blast_radius: 25,
  formula_complexity: 15,
  data_loss: 30,
  formula_removal: 20,
  cross_sheet: 10,
  circular_dependency: 35,
  external_reference: 15,
  array_formula: 10,
  volatile_function: 5,
};

// -----------------------------------------------------------------------------
// Risk Assessor Class
// -----------------------------------------------------------------------------

export class RiskAssessor {
  private config: SandboxConfig;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
  }

  /**
   * Assess risk for a sandbox diff
   */
  assessRisk(sandboxId: string, diff: SandboxDiff): RiskAssessment {
    const detectedRisks: DetectedRisk[] = [];

    // Check each risk factor
    this.checkLargeBlastRadius(diff, detectedRisks);
    this.checkFormulaComplexity(diff, detectedRisks);
    this.checkDataLoss(diff, detectedRisks);
    this.checkFormulaRemoval(diff, detectedRisks);
    this.checkCrossSheet(diff, detectedRisks);
    this.checkCircularDependency(diff, detectedRisks);
    this.checkExternalReferences(diff, detectedRisks);
    this.checkArrayFormulas(diff, detectedRisks);
    this.checkVolatileFunctions(diff, detectedRisks);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(detectedRisks);

    // Determine overall risk level
    const overallRisk = this.determineRiskLevel(riskScore);

    // Determine if approval is required
    const requiresApproval = this.checkRequiresApproval(
      overallRisk,
      diff,
      detectedRisks
    );

    // Determine if auto-apply is possible
    const canAutoApply =
      this.config.autoApprove.enabled &&
      !requiresApproval &&
      overallRisk === 'low';

    return {
      sandboxId,
      overallRisk,
      riskScore,
      detectedRisks,
      requiresApproval,
      canAutoApply,
      assessedAt: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // Risk Factor Checks
  // ---------------------------------------------------------------------------

  private checkLargeBlastRadius(
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): void {
    const threshold = this.config.riskThresholds.largeBatchSize;

    if (diff.summary.totalChanges > threshold) {
      risks.push({
        factor: 'large_blast_radius',
        severity: diff.summary.totalChanges > threshold * 2 ? 'high' : 'medium',
        description: `${diff.summary.totalChanges} cells will be affected (threshold: ${threshold})`,
        suggestion: 'Consider breaking this into smaller operations',
      });
    }
  }

  private checkFormulaComplexity(
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): void {
    const complexFormulas: string[] = [];

    for (const change of diff.changes) {
      const formula = change.after?.formula;
      if (formula && this.isComplexFormula(formula)) {
        complexFormulas.push(change.ref);
      }
    }

    if (complexFormulas.length > 0) {
      risks.push({
        factor: 'formula_complexity',
        severity: complexFormulas.length > 5 ? 'high' : 'medium',
        description: `${complexFormulas.length} complex formulas detected`,
        affectedCells: complexFormulas,
        suggestion: 'Review formulas carefully for accuracy',
      });
    }
  }

  private checkDataLoss(diff: SandboxDiff, risks: DetectedRisk[]): void {
    const deletedCells = diff.changes.filter(
      (c) => c.changeType === 'deleted' && c.before?.value !== null
    );

    if (deletedCells.length > 0) {
      risks.push({
        factor: 'data_loss',
        severity: deletedCells.length > 10 ? 'high' : 'medium',
        description: `${deletedCells.length} cells with data will be cleared`,
        affectedCells: deletedCells.map((c) => c.ref),
        suggestion: 'Verify that data deletion is intentional',
      });
    }
  }

  private checkFormulaRemoval(diff: SandboxDiff, risks: DetectedRisk[]): void {
    const formulasRemoved = diff.changes.filter(
      (c) => c.before?.formula && !c.after?.formula
    );

    if (formulasRemoved.length > 0) {
      risks.push({
        factor: 'formula_removal',
        severity: formulasRemoved.length > 5 ? 'high' : 'medium',
        description: `${formulasRemoved.length} formulas will be removed`,
        affectedCells: formulasRemoved.map((c) => c.ref),
        suggestion: 'Ensure formula removal is intentional',
      });
    }
  }

  private checkCrossSheet(diff: SandboxDiff, risks: DetectedRisk[]): void {
    if (diff.summary.sheetsAffected.length > 1) {
      risks.push({
        factor: 'cross_sheet',
        severity: 'medium',
        description: `Changes span ${diff.summary.sheetsAffected.length} sheets: ${diff.summary.sheetsAffected.join(', ')}`,
        suggestion: 'Review changes across all affected sheets',
      });
    }
  }

  private checkCircularDependency(
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): void {
    // Check for potential circular references in new formulas
    const potentialCircular: string[] = [];

    for (const change of diff.changes) {
      const formula = change.after?.formula;
      if (formula) {
        // Simple check: formula references its own cell
        const cellRef = change.ref.toUpperCase();
        if (formula.toUpperCase().includes(cellRef)) {
          potentialCircular.push(change.ref);
        }
      }
    }

    if (potentialCircular.length > 0) {
      risks.push({
        factor: 'circular_dependency',
        severity: 'high',
        description: `Potential circular reference detected`,
        affectedCells: potentialCircular,
        suggestion: 'Review formula dependencies to avoid circular references',
      });
    }
  }

  private checkExternalReferences(
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): void {
    const externalRefs: string[] = [];

    for (const change of diff.changes) {
      const formula = change.after?.formula;
      if (formula && this.hasExternalReference(formula)) {
        externalRefs.push(change.ref);
      }
    }

    if (externalRefs.length > 0) {
      risks.push({
        factor: 'external_reference',
        severity: 'medium',
        description: `${externalRefs.length} formulas reference external workbooks`,
        affectedCells: externalRefs,
        suggestion: 'Verify external references are correct',
      });
    }
  }

  private checkArrayFormulas(diff: SandboxDiff, risks: DetectedRisk[]): void {
    const arrayFormulas: string[] = [];

    for (const change of diff.changes) {
      const formula = change.after?.formula;
      if (formula && this.isArrayFormula(formula)) {
        arrayFormulas.push(change.ref);
      }
    }

    if (arrayFormulas.length > 0) {
      risks.push({
        factor: 'array_formula',
        severity: 'low',
        description: `${arrayFormulas.length} array/dynamic formulas detected`,
        affectedCells: arrayFormulas,
        suggestion: 'Ensure array formulas have room to spill',
      });
    }
  }

  private checkVolatileFunctions(
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): void {
    const volatileCells: string[] = [];
    const volatileFuncs = ['RAND', 'RANDBETWEEN', 'NOW', 'TODAY', 'OFFSET', 'INDIRECT'];

    for (const change of diff.changes) {
      const formula = change.after?.formula?.toUpperCase() || '';
      if (volatileFuncs.some((f) => formula.includes(f + '('))) {
        volatileCells.push(change.ref);
      }
    }

    if (volatileCells.length > 0) {
      risks.push({
        factor: 'volatile_function',
        severity: 'low',
        description: `${volatileCells.length} cells use volatile functions (recalculate frequently)`,
        affectedCells: volatileCells,
        suggestion: 'Volatile functions may impact performance',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private isComplexFormula(formula: string): boolean {
    // Count nested functions
    const functionCount = (formula.match(/[A-Z]+\(/gi) || []).length;

    // Check nesting depth
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of formula) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }

    return functionCount >= 3 || maxDepth >= 3;
  }

  private hasExternalReference(formula: string): boolean {
    // Check for [workbook.xlsx] pattern
    return /\[[^\]]+\.xlsx?\]/i.test(formula);
  }

  private isArrayFormula(formula: string): boolean {
    const arrayFuncs = [
      'UNIQUE',
      'SORT',
      'SORTBY',
      'FILTER',
      'SEQUENCE',
      'RANDARRAY',
      'LET',
      'LAMBDA',
    ];
    const upperFormula = formula.toUpperCase();
    return arrayFuncs.some((f) => upperFormula.includes(f + '('));
  }

  private calculateRiskScore(risks: DetectedRisk[]): number {
    let score = 0;

    for (const risk of risks) {
      const weight = RISK_WEIGHTS[risk.factor];
      const severityMultiplier =
        risk.severity === 'high' ? 1.5 : risk.severity === 'medium' ? 1.0 : 0.5;
      score += weight * severityMultiplier;
    }

    // Cap at 100
    return Math.min(100, Math.round(score));
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= this.config.riskThresholds.highRiskScore) {
      return 'high';
    }
    if (score >= this.config.riskThresholds.mediumRiskScore) {
      return 'medium';
    }
    return 'low';
  }

  private checkRequiresApproval(
    riskLevel: RiskLevel,
    diff: SandboxDiff,
    risks: DetectedRisk[]
  ): boolean {
    // Always require approval for high risk
    if (riskLevel === 'high') {
      return true;
    }

    // Check if too many cells affected
    if (diff.summary.totalChanges > this.config.autoApprove.maxAffectedCells) {
      return true;
    }

    // Check if formula changes require approval
    if (
      this.config.autoApprove.requireForFormulas &&
      diff.summary.formulaChanges > 0
    ) {
      return true;
    }

    // Check if any critical risk factors are present
    const criticalFactors: RiskFactor[] = [
      'circular_dependency',
      'data_loss',
    ];
    if (risks.some((r) => criticalFactors.includes(r.factor))) {
      return true;
    }

    return false;
  }

  /**
   * Format risk assessment for display
   */
  formatRiskReport(assessment: RiskAssessment): string {
    const lines: string[] = [];

    // Header
    const riskIcon = this.getRiskIcon(assessment.overallRisk);
    lines.push(`${riskIcon} Risk Level: ${assessment.overallRisk.toUpperCase()}`);
    lines.push(`Score: ${assessment.riskScore}/100`);
    lines.push('');

    // Detected risks
    if (assessment.detectedRisks.length > 0) {
      lines.push('Detected Risks:');
      for (const risk of assessment.detectedRisks) {
        const icon = this.getRiskIcon(risk.severity);
        lines.push(`  ${icon} ${risk.description}`);
        if (risk.suggestion) {
          lines.push(`     Suggestion: ${risk.suggestion}`);
        }
      }
    } else {
      lines.push('No significant risks detected.');
    }

    // Approval status
    lines.push('');
    if (assessment.requiresApproval) {
      lines.push('Approval Required: Yes');
    } else if (assessment.canAutoApply) {
      lines.push('Can Auto-Apply: Yes');
    }

    return lines.join('\n');
  }

  private getRiskIcon(level: RiskLevel): string {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton
export const riskAssessor = new RiskAssessor();
