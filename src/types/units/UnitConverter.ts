// =============================================================================
// UNIT CONVERTER — Convert between units (Blueprint §3.2)
// =============================================================================

import { findUnit, type Unit } from './UnitSystem';

// -----------------------------------------------------------------------------
// Conversion Result
// -----------------------------------------------------------------------------

export interface ConversionResult {
  success: boolean;
  value: number;
  fromUnit: string;
  toUnit: string;
  formula?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Unit Converter Class
// -----------------------------------------------------------------------------

export class UnitConverter {
  /**
   * Convert a value from one unit to another
   */
  convert(value: number, fromUnitId: string, toUnitId: string): ConversionResult {
    const fromUnit = findUnit(fromUnitId);
    const toUnit = findUnit(toUnitId);

    if (!fromUnit) {
      return {
        success: false,
        value: NaN,
        fromUnit: fromUnitId,
        toUnit: toUnitId,
        error: `Unknown unit: ${fromUnitId}`,
      };
    }

    if (!toUnit) {
      return {
        success: false,
        value: NaN,
        fromUnit: fromUnitId,
        toUnit: toUnitId,
        error: `Unknown unit: ${toUnitId}`,
      };
    }

    if (fromUnit.dimension !== toUnit.dimension) {
      return {
        success: false,
        value: NaN,
        fromUnit: fromUnitId,
        toUnit: toUnitId,
        error: `Cannot convert ${fromUnit.dimension} to ${toUnit.dimension}`,
      };
    }

    // Temperature requires special handling
    if (fromUnit.dimension === 'temperature') {
      return this.convertTemperature(value, fromUnit, toUnit);
    }

    // Standard conversion: value * toBase * fromBase
    const baseValue = value * fromUnit.toBase;
    const result = baseValue * toUnit.fromBase;

    return {
      success: true,
      value: result,
      fromUnit: fromUnit.id,
      toUnit: toUnit.id,
      formula: `${value} ${fromUnit.symbol} = ${result.toFixed(6)} ${toUnit.symbol}`,
    };
  }

  /**
   * Convert temperature (requires offset handling)
   */
  private convertTemperature(value: number, from: Unit, to: Unit): ConversionResult {
    let celsius: number;

    // Convert to Celsius first
    if (from.id === 'celsius') {
      celsius = value;
    } else if (from.id === 'fahrenheit') {
      celsius = (value - 32) * (5 / 9);
    } else {
      // Kelvin
      celsius = value - 273.15;
    }

    // Convert from Celsius to target
    let result: number;
    if (to.id === 'celsius') {
      result = celsius;
    } else if (to.id === 'fahrenheit') {
      result = celsius * (9 / 5) + 32;
    } else {
      // Kelvin
      result = celsius + 273.15;
    }

    return {
      success: true,
      value: result,
      fromUnit: from.id,
      toUnit: to.id,
      formula: `${value} ${from.symbol} = ${result.toFixed(2)} ${to.symbol}`,
    };
  }

  /**
   * Add two values with different units (result in first unit)
   */
  add(value1: number, unit1: string, value2: number, unit2: string): ConversionResult {
    const converted = this.convert(value2, unit2, unit1);
    if (!converted.success) {
      return converted;
    }

    const result = value1 + converted.value;
    return {
      success: true,
      value: result,
      fromUnit: unit2,
      toUnit: unit1,
      formula: `${value1} ${unit1} + ${value2} ${unit2} = ${result.toFixed(6)} ${unit1}`,
    };
  }

  /**
   * Subtract two values with different units (result in first unit)
   */
  subtract(value1: number, unit1: string, value2: number, unit2: string): ConversionResult {
    const converted = this.convert(value2, unit2, unit1);
    if (!converted.success) {
      return converted;
    }

    const result = value1 - converted.value;
    return {
      success: true,
      value: result,
      fromUnit: unit2,
      toUnit: unit1,
      formula: `${value1} ${unit1} - ${value2} ${unit2} = ${result.toFixed(6)} ${unit1}`,
    };
  }

  /**
   * Multiply a value with units by a scalar
   */
  multiply(value: number, unit: string, scalar: number): ConversionResult {
    const result = value * scalar;
    return {
      success: true,
      value: result,
      fromUnit: unit,
      toUnit: unit,
      formula: `${value} ${unit} × ${scalar} = ${result.toFixed(6)} ${unit}`,
    };
  }

  /**
   * Divide a value with units by a scalar
   */
  divide(value: number, unit: string, scalar: number): ConversionResult {
    if (scalar === 0) {
      return {
        success: false,
        value: NaN,
        fromUnit: unit,
        toUnit: unit,
        error: 'Division by zero',
      };
    }

    const result = value / scalar;
    return {
      success: true,
      value: result,
      fromUnit: unit,
      toUnit: unit,
      formula: `${value} ${unit} ÷ ${scalar} = ${result.toFixed(6)} ${unit}`,
    };
  }

  /**
   * Format a conversion result for display
   */
  formatResult(result: ConversionResult, decimals: number = 2): string {
    if (!result.success) {
      return result.error || 'Conversion failed';
    }

    const toUnit = findUnit(result.toUnit);
    const toSymbol = toUnit?.symbol || result.toUnit;

    return `${result.value.toFixed(decimals)} ${toSymbol}`;
  }

  /**
   * Check if two units are compatible (same dimension)
   */
  areCompatible(unit1: string, unit2: string): boolean {
    const u1 = findUnit(unit1);
    const u2 = findUnit(unit2);

    if (!u1 || !u2) return false;
    return u1.dimension === u2.dimension;
  }

  /**
   * Get conversion factor between two units
   */
  getConversionFactor(fromUnitId: string, toUnitId: string): number | null {
    const fromUnit = findUnit(fromUnitId);
    const toUnit = findUnit(toUnitId);

    if (!fromUnit || !toUnit) return null;
    if (fromUnit.dimension !== toUnit.dimension) return null;

    // Temperature doesn't have a simple factor
    if (fromUnit.dimension === 'temperature') return null;

    return fromUnit.toBase * toUnit.fromBase;
  }
}

// Export singleton instance
export const unitConverter = new UnitConverter();
