// =============================================================================
// UNIT PARSER — Parse values with units (Blueprint §3.2)
// =============================================================================

import { findUnit, type Unit } from './UnitSystem';

// -----------------------------------------------------------------------------
// Parse Result
// -----------------------------------------------------------------------------

export interface ParsedValueWithUnit {
  value: number;
  unit: Unit | null;
  unitString: string;
  valid: boolean;
  error?: string;
  raw: string;
}

// -----------------------------------------------------------------------------
// Unit Parser Class
// -----------------------------------------------------------------------------

export class UnitParser {
  // Common unit patterns
  private static PATTERNS = [
    // Number followed by unit symbol: "100 km", "50.5 lbs", "32°F"
    /^(-?\d+(?:\.\d+)?)\s*([a-zA-Z°/²³]+[a-zA-Z0-9°/²³]*)$/,
    // Number with unit attached: "100km", "50lbs"
    /^(-?\d+(?:\.\d+)?)([a-zA-Z°]+[a-zA-Z0-9°/²³]*)$/,
    // Just a number
    /^(-?\d+(?:\.\d+)?)$/,
  ];

  /**
   * Parse a string that may contain a value with a unit
   */
  parse(input: string): ParsedValueWithUnit {
    const trimmed = input.trim();

    if (!trimmed) {
      return {
        value: NaN,
        unit: null,
        unitString: '',
        valid: false,
        error: 'Empty input',
        raw: input,
      };
    }

    for (const pattern of UnitParser.PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        const unitString = match[2] || '';

        if (isNaN(value)) {
          return {
            value: NaN,
            unit: null,
            unitString: '',
            valid: false,
            error: 'Invalid number',
            raw: input,
          };
        }

        if (!unitString) {
          // Just a number, no unit
          return {
            value,
            unit: null,
            unitString: '',
            valid: true,
            raw: input,
          };
        }

        const unit = findUnit(unitString);
        if (!unit) {
          return {
            value,
            unit: null,
            unitString,
            valid: false,
            error: `Unknown unit: ${unitString}`,
            raw: input,
          };
        }

        return {
          value,
          unit,
          unitString: unit.symbol,
          valid: true,
          raw: input,
        };
      }
    }

    // Try to extract just the number if nothing else works
    const numberMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[0]);
      const remaining = trimmed.replace(numberMatch[0], '').trim();

      if (remaining) {
        const unit = findUnit(remaining);
        if (unit) {
          return {
            value,
            unit,
            unitString: unit.symbol,
            valid: true,
            raw: input,
          };
        }
      }

      return {
        value,
        unit: null,
        unitString: '',
        valid: true,
        raw: input,
      };
    }

    return {
      value: NaN,
      unit: null,
      unitString: '',
      valid: false,
      error: 'Could not parse value',
      raw: input,
    };
  }

  /**
   * Parse multiple values from a string
   * e.g., "100 km + 50 mi" → [{ value: 100, unit: km }, { value: 50, unit: mi }]
   */
  parseMultiple(input: string): ParsedValueWithUnit[] {
    const parts = input.split(/[+\-*/]/);
    return parts.map((part) => this.parse(part.trim()));
  }

  /**
   * Format a value with its unit
   */
  format(value: number, unit: Unit | string | null, decimals: number = 2): string {
    if (unit === null) {
      return value.toFixed(decimals);
    }

    const unitObj = typeof unit === 'string' ? findUnit(unit) : unit;
    const symbol = unitObj?.symbol || (typeof unit === 'string' ? unit : '');

    return `${value.toFixed(decimals)} ${symbol}`.trim();
  }

  /**
   * Try to detect the unit from a string (without the number)
   */
  detectUnit(input: string): Unit | null {
    const cleaned = input.replace(/[0-9.\-+]/g, '').trim();
    if (!cleaned) return null;
    return findUnit(cleaned);
  }

  /**
   * Suggest units based on partial input
   */
  suggestUnits(partial: string, limit: number = 5): Unit[] {
    const query = partial.toLowerCase().trim();
    if (!query) return [];

    const matches: Unit[] = [];

    // Import all units
    const { UNITS } = require('./UnitSystem');

    for (const dimension of Object.keys(UNITS)) {
      for (const unit of Object.values(UNITS[dimension]) as Unit[]) {
        if (
          unit.id.toLowerCase().includes(query) ||
          unit.name.toLowerCase().includes(query) ||
          unit.symbol.toLowerCase().includes(query) ||
          unit.aliases?.some((a: string) => a.toLowerCase().includes(query))
        ) {
          matches.push(unit);
          if (matches.length >= limit) {
            return matches;
          }
        }
      }
    }

    return matches;
  }

  /**
   * Check if a string looks like it has a unit
   */
  hasUnit(input: string): boolean {
    const parsed = this.parse(input);
    return parsed.valid && parsed.unit !== null;
  }

  /**
   * Extract numeric value from a string, ignoring units
   */
  extractNumber(input: string): number | null {
    const parsed = this.parse(input);
    if (parsed.valid && !isNaN(parsed.value)) {
      return parsed.value;
    }
    return null;
  }
}

// Export singleton instance
export const unitParser = new UnitParser();
