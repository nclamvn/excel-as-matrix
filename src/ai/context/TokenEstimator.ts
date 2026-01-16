// ═══════════════════════════════════════════════════════════════════════════
// TOKEN ESTIMATOR — Estimate token usage for context items
// ═══════════════════════════════════════════════════════════════════════════

import type { SerializedRange, CellSnapshot } from '../types';

/**
 * Estimate token usage for context items
 * Using approximate ratio of 1 token ≈ 4 characters
 */
export class TokenEstimator {
  private readonly CHARS_PER_TOKEN = 4;

  /**
   * Estimate tokens for a serialized range
   */
  estimateRange(range: SerializedRange): number {
    let chars = 0;

    // Range reference
    chars += range.ref.length + 10; // "Range: A1:C10\n"

    // Values
    for (const row of range.values) {
      for (const cell of row) {
        chars += String(cell ?? '').length + 3; // value + separator
      }
    }

    // Formulas (if any)
    for (const row of range.formulas) {
      for (const formula of row) {
        if (formula) {
          chars += formula.length + 5;
        }
      }
    }

    // Overhead (formatting, structure)
    chars += range.cellCount * 10;

    return Math.ceil(chars / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for a cell snapshot
   */
  estimateSnapshot(snapshot: CellSnapshot): number {
    let chars = 0;

    // Reference
    chars += snapshot.ref.length + 5;

    // Value
    chars += String(snapshot.value ?? '').length + 3;

    // Formula
    if (snapshot.formula) {
      chars += snapshot.formula.length + 10;
    }

    // Dependencies
    chars += snapshot.dependencies.join(', ').length + 15;

    // Overhead
    chars += 20;

    return Math.ceil(chars / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for a string
   */
  estimateString(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for a JSON object
   */
  estimateObject(obj: unknown): number {
    const json = JSON.stringify(obj);
    return Math.ceil(json.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Estimate tokens for an array of strings
   */
  estimateStringArray(arr: string[]): number {
    return arr.reduce((sum, s) => sum + this.estimateString(s), 0);
  }
}

// Export singleton
export const tokenEstimator = new TokenEstimator();
