// ═══════════════════════════════════════════════════════════════════════════
// GROUNDING MANAGER — Manage grounded claims and evidence (Blueprint §5.4)
// ═══════════════════════════════════════════════════════════════════════════

import type {
  GroundedClaim,
  Evidence,
  GroundingReport,
  VerificationResult,
} from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, parseCellRef } from '../../types/cell';

/**
 * Manage grounded claims and evidence
 * Blueprint §5.4: AI Action Contract - Grounding
 */
export class GroundingManager {
  private claims: Map<string, GroundedClaim> = new Map();
  private evidence: Map<string, Evidence> = new Map();

  /**
   * Create a grounded claim from cell read
   */
  createDirectReadClaim(
    statement: string,
    cellRef: string,
    value: unknown,
    sheetName?: string
  ): GroundedClaim {
    const claim: GroundedClaim = {
      id: crypto.randomUUID(),
      statement,
      groundingType: 'direct_read',
      source: {
        type: 'cell',
        ref: cellRef,
        valueAtRead: value,
        readTimestamp: new Date(),
        sheetName,
      },
      confidence: 0.95, // High confidence for direct reads
      verificationQuery: `Verify value at ${cellRef} equals "${value}"`,
      verified: true,
    };

    this.claims.set(claim.id, claim);
    return claim;
  }

  /**
   * Create a grounded claim from computation
   */
  createComputedClaim(
    statement: string,
    formula: string,
    result: unknown,
    sourceCells: string[]
  ): GroundedClaim {
    const claim: GroundedClaim = {
      id: crypto.randomUUID(),
      statement,
      groundingType: 'computed',
      source: {
        type: 'formula_eval',
        ref: sourceCells.join(', '),
        valueAtRead: { formula, result },
        readTimestamp: new Date(),
      },
      confidence: 0.85, // Good confidence for computations
      verificationQuery: `Verify ${formula} = ${result}`,
      verified: false,
    };

    this.claims.set(claim.id, claim);
    return claim;
  }

  /**
   * Create an inferred claim (AI reasoning)
   */
  createInferredClaim(
    statement: string,
    reasoning: string,
    supportingEvidence: string[]
  ): GroundedClaim {
    const claim: GroundedClaim = {
      id: crypto.randomUUID(),
      statement,
      groundingType: 'inferred',
      source: {
        type: 'user_input',
        ref: 'ai_reasoning',
        valueAtRead: { reasoning, supportingEvidence },
        readTimestamp: new Date(),
      },
      confidence: 0.6, // Lower confidence for inferences
      verificationQuery: undefined,
      verified: false,
    };

    this.claims.set(claim.id, claim);
    return claim;
  }

  /**
   * Add evidence to support claims
   */
  addEvidence(
    type: Evidence['type'],
    source: string,
    content: string,
    quote?: string
  ): Evidence {
    const evidence: Evidence = {
      id: crypto.randomUUID(),
      type,
      source,
      content,
      quote,
      confidence: this.getEvidenceConfidence(type),
      timestamp: new Date(),
    };

    this.evidence.set(evidence.id, evidence);
    return evidence;
  }

  /**
   * Get confidence level for evidence type
   */
  private getEvidenceConfidence(type: Evidence['type']): number {
    switch (type) {
      case 'cell_data':
        return 0.95;
      case 'user_instruction':
        return 0.9;
      case 'pattern_detected':
        return 0.75;
      case 'best_practice':
        return 0.7;
      case 'domain_knowledge':
        return 0.65;
      case 'inferred':
        return 0.5;
      default:
        return 0.5;
    }
  }

  /**
   * Verify a claim against current spreadsheet state
   */
  async verifyClaim(claimId: string): Promise<VerificationResult> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    if (claim.source.type === 'cell' && sheet) {
      const pos = parseCellRef(claim.source.ref);
      if (pos) {
        const key = getCellKey(pos.row, pos.col);
        const currentCell = sheet.cells[key];
        const currentValue = currentCell?.value ?? null;

        const verified = currentValue === claim.source.valueAtRead;

        // Update claim verification status
        claim.verified = verified;

        return {
          claimId,
          verified,
          currentValue,
          expectedValue: claim.source.valueAtRead,
          discrepancy: verified
            ? undefined
            : `Value changed from "${claim.source.valueAtRead}" to "${currentValue}"`,
          timestamp: new Date(),
        };
      }
    }

    // For other types, we can't auto-verify
    return {
      claimId,
      verified: false,
      currentValue: null,
      expectedValue: claim.source.valueAtRead,
      discrepancy: 'Cannot auto-verify this claim type',
      timestamp: new Date(),
    };
  }

  /**
   * Verify all claims
   */
  async verifyAllClaims(): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const claim of this.claims.values()) {
      const result = await this.verifyClaim(claim.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate grounding report
   */
  generateReport(): GroundingReport {
    const claims = Array.from(this.claims.values());
    const evidence = Array.from(this.evidence.values());

    // Find ungrounded statements (would need to analyze AI response)
    const ungroundedStatements: string[] = [];

    // Calculate overall confidence
    const totalConfidence = claims.reduce((sum, c) => sum + c.confidence, 0);
    const overallConfidence =
      claims.length > 0 ? totalConfidence / claims.length : 0;

    // Determine verification status
    const verifiedCount = claims.filter((c) => c.verified).length;
    let verificationStatus: 'verified' | 'partial' | 'unverified';

    if (claims.length === 0) {
      verificationStatus = 'unverified';
    } else if (verifiedCount === claims.length) {
      verificationStatus = 'verified';
    } else if (verifiedCount > 0) {
      verificationStatus = 'partial';
    } else {
      verificationStatus = 'unverified';
    }

    return {
      claims,
      evidence,
      ungroundedStatements,
      overallConfidence,
      verificationStatus,
    };
  }

  /**
   * Format grounded claims for display
   */
  formatClaimsForDisplay(): string {
    let output = '';

    for (const claim of this.claims.values()) {
      const icon =
        claim.groundingType === 'direct_read'
          ? '📍'
          : claim.groundingType === 'computed'
            ? '🔢'
            : '🤔';

      output += `[${icon}${claim.source.ref}] ${claim.statement}\n`;
      output += `  Confidence: ${Math.round(claim.confidence * 100)}%\n`;
      if (claim.verificationQuery) {
        output += `  Verify: ${claim.verificationQuery}\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Get all claims
   */
  getClaims(): GroundedClaim[] {
    return Array.from(this.claims.values());
  }

  /**
   * Get all evidence
   */
  getEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  /**
   * Get claim by ID
   */
  getClaim(id: string): GroundedClaim | undefined {
    return this.claims.get(id);
  }

  /**
   * Clear all claims and evidence
   */
  clear(): void {
    this.claims.clear();
    this.evidence.clear();
  }
}

// Export singleton
export const groundingManager = new GroundingManager();
