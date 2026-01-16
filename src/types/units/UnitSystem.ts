// =============================================================================
// UNIT SYSTEM — Physical unit definitions (Blueprint §3.2)
// =============================================================================

import type { Dimension } from '../semantic/types';

// -----------------------------------------------------------------------------
// Unit Interface
// -----------------------------------------------------------------------------

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  dimension: Dimension;
  toBase: number;      // Multiply by this to convert to base unit
  fromBase: number;    // Multiply by this to convert from base unit
  offset?: number;     // For temperature conversions
  aliases?: string[];  // Alternative names for this unit
}

// -----------------------------------------------------------------------------
// Unit Definitions (50+ units)
// -----------------------------------------------------------------------------

export const UNITS: Record<string, Record<string, Unit>> = {
  // ═══════════════════════════════════════════════════════════════
  // LENGTH (base: meter)
  // ═══════════════════════════════════════════════════════════════
  length: {
    m: {
      id: 'm',
      name: 'Meter',
      symbol: 'm',
      dimension: 'length',
      toBase: 1,
      fromBase: 1,
      aliases: ['meter', 'meters', 'metre', 'metres'],
    },
    km: {
      id: 'km',
      name: 'Kilometer',
      symbol: 'km',
      dimension: 'length',
      toBase: 1000,
      fromBase: 0.001,
      aliases: ['kilometer', 'kilometers'],
    },
    cm: {
      id: 'cm',
      name: 'Centimeter',
      symbol: 'cm',
      dimension: 'length',
      toBase: 0.01,
      fromBase: 100,
      aliases: ['centimeter', 'centimeters'],
    },
    mm: {
      id: 'mm',
      name: 'Millimeter',
      symbol: 'mm',
      dimension: 'length',
      toBase: 0.001,
      fromBase: 1000,
      aliases: ['millimeter', 'millimeters'],
    },
    mi: {
      id: 'mi',
      name: 'Mile',
      symbol: 'mi',
      dimension: 'length',
      toBase: 1609.344,
      fromBase: 0.000621371,
      aliases: ['mile', 'miles'],
    },
    ft: {
      id: 'ft',
      name: 'Foot',
      symbol: 'ft',
      dimension: 'length',
      toBase: 0.3048,
      fromBase: 3.28084,
      aliases: ['foot', 'feet'],
    },
    in: {
      id: 'in',
      name: 'Inch',
      symbol: 'in',
      dimension: 'length',
      toBase: 0.0254,
      fromBase: 39.3701,
      aliases: ['inch', 'inches'],
    },
    yd: {
      id: 'yd',
      name: 'Yard',
      symbol: 'yd',
      dimension: 'length',
      toBase: 0.9144,
      fromBase: 1.09361,
      aliases: ['yard', 'yards'],
    },
    nmi: {
      id: 'nmi',
      name: 'Nautical Mile',
      symbol: 'nmi',
      dimension: 'length',
      toBase: 1852,
      fromBase: 0.000539957,
      aliases: ['nautical mile', 'nautical miles'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MASS (base: kilogram)
  // ═══════════════════════════════════════════════════════════════
  mass: {
    kg: {
      id: 'kg',
      name: 'Kilogram',
      symbol: 'kg',
      dimension: 'mass',
      toBase: 1,
      fromBase: 1,
      aliases: ['kilogram', 'kilograms'],
    },
    g: {
      id: 'g',
      name: 'Gram',
      symbol: 'g',
      dimension: 'mass',
      toBase: 0.001,
      fromBase: 1000,
      aliases: ['gram', 'grams'],
    },
    mg: {
      id: 'mg',
      name: 'Milligram',
      symbol: 'mg',
      dimension: 'mass',
      toBase: 0.000001,
      fromBase: 1000000,
      aliases: ['milligram', 'milligrams'],
    },
    t: {
      id: 't',
      name: 'Metric Ton',
      symbol: 't',
      dimension: 'mass',
      toBase: 1000,
      fromBase: 0.001,
      aliases: ['ton', 'tons', 'tonne', 'tonnes'],
    },
    lb: {
      id: 'lb',
      name: 'Pound',
      symbol: 'lb',
      dimension: 'mass',
      toBase: 0.453592,
      fromBase: 2.20462,
      aliases: ['pound', 'pounds', 'lbs'],
    },
    oz: {
      id: 'oz',
      name: 'Ounce',
      symbol: 'oz',
      dimension: 'mass',
      toBase: 0.0283495,
      fromBase: 35.274,
      aliases: ['ounce', 'ounces'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TIME (base: second)
  // ═══════════════════════════════════════════════════════════════
  time: {
    s: {
      id: 's',
      name: 'Second',
      symbol: 's',
      dimension: 'time',
      toBase: 1,
      fromBase: 1,
      aliases: ['sec', 'second', 'seconds'],
    },
    ms: {
      id: 'ms',
      name: 'Millisecond',
      symbol: 'ms',
      dimension: 'time',
      toBase: 0.001,
      fromBase: 1000,
      aliases: ['millisecond', 'milliseconds'],
    },
    min: {
      id: 'min',
      name: 'Minute',
      symbol: 'min',
      dimension: 'time',
      toBase: 60,
      fromBase: 1 / 60,
      aliases: ['minute', 'minutes'],
    },
    h: {
      id: 'h',
      name: 'Hour',
      symbol: 'h',
      dimension: 'time',
      toBase: 3600,
      fromBase: 1 / 3600,
      aliases: ['hr', 'hour', 'hours'],
    },
    d: {
      id: 'd',
      name: 'Day',
      symbol: 'd',
      dimension: 'time',
      toBase: 86400,
      fromBase: 1 / 86400,
      aliases: ['day', 'days'],
    },
    wk: {
      id: 'wk',
      name: 'Week',
      symbol: 'wk',
      dimension: 'time',
      toBase: 604800,
      fromBase: 1 / 604800,
      aliases: ['week', 'weeks'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TEMPERATURE (base: Celsius - special handling)
  // ═══════════════════════════════════════════════════════════════
  temperature: {
    celsius: {
      id: 'celsius',
      name: 'Celsius',
      symbol: '°C',
      dimension: 'temperature',
      toBase: 1,
      fromBase: 1,
      offset: 0,
      aliases: ['c', 'degc', '°c'],
    },
    fahrenheit: {
      id: 'fahrenheit',
      name: 'Fahrenheit',
      symbol: '°F',
      dimension: 'temperature',
      toBase: 5 / 9,
      fromBase: 9 / 5,
      offset: -32,
      aliases: ['f', 'degf', '°f'],
    },
    kelvin: {
      id: 'kelvin',
      name: 'Kelvin',
      symbol: 'K',
      dimension: 'temperature',
      toBase: 1,
      fromBase: 1,
      offset: -273.15,
      aliases: ['k'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // AREA (base: square meter)
  // ═══════════════════════════════════════════════════════════════
  area: {
    m2: {
      id: 'm2',
      name: 'Square Meter',
      symbol: 'm²',
      dimension: 'area',
      toBase: 1,
      fromBase: 1,
      aliases: ['sqm', 'square meter', 'square meters'],
    },
    km2: {
      id: 'km2',
      name: 'Square Kilometer',
      symbol: 'km²',
      dimension: 'area',
      toBase: 1000000,
      fromBase: 0.000001,
      aliases: ['sqkm', 'square kilometer'],
    },
    ha: {
      id: 'ha',
      name: 'Hectare',
      symbol: 'ha',
      dimension: 'area',
      toBase: 10000,
      fromBase: 0.0001,
      aliases: ['hectare', 'hectares'],
    },
    acre: {
      id: 'acre',
      name: 'Acre',
      symbol: 'acre',
      dimension: 'area',
      toBase: 4046.86,
      fromBase: 0.000247105,
      aliases: ['acres'],
    },
    ft2: {
      id: 'ft2',
      name: 'Square Foot',
      symbol: 'ft²',
      dimension: 'area',
      toBase: 0.092903,
      fromBase: 10.7639,
      aliases: ['sqft', 'square foot', 'square feet'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // VOLUME (base: liter)
  // ═══════════════════════════════════════════════════════════════
  volume: {
    liter: {
      id: 'liter',
      name: 'Liter',
      symbol: 'L',
      dimension: 'volume',
      toBase: 1,
      fromBase: 1,
      aliases: ['l', 'litre', 'litres', 'liters'],
    },
    ml: {
      id: 'ml',
      name: 'Milliliter',
      symbol: 'mL',
      dimension: 'volume',
      toBase: 0.001,
      fromBase: 1000,
      aliases: ['milliliter', 'milliliters'],
    },
    m3: {
      id: 'm3',
      name: 'Cubic Meter',
      symbol: 'm³',
      dimension: 'volume',
      toBase: 1000,
      fromBase: 0.001,
      aliases: ['cubic meter', 'cubic meters'],
    },
    gal: {
      id: 'gal',
      name: 'Gallon',
      symbol: 'gal',
      dimension: 'volume',
      toBase: 3.78541,
      fromBase: 0.264172,
      aliases: ['gallon', 'gallons'],
    },
    qt: {
      id: 'qt',
      name: 'Quart',
      symbol: 'qt',
      dimension: 'volume',
      toBase: 0.946353,
      fromBase: 1.05669,
      aliases: ['quart', 'quarts'],
    },
    cup: {
      id: 'cup',
      name: 'Cup',
      symbol: 'cup',
      dimension: 'volume',
      toBase: 0.236588,
      fromBase: 4.22675,
      aliases: ['cups'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SPEED (base: km/h)
  // ═══════════════════════════════════════════════════════════════
  speed: {
    'km/h': {
      id: 'km/h',
      name: 'Kilometers per Hour',
      symbol: 'km/h',
      dimension: 'speed',
      toBase: 1,
      fromBase: 1,
      aliases: ['kph', 'kmh', 'kmph'],
    },
    'm/s': {
      id: 'm/s',
      name: 'Meters per Second',
      symbol: 'm/s',
      dimension: 'speed',
      toBase: 3.6,
      fromBase: 1 / 3.6,
      aliases: ['mps'],
    },
    'mi/h': {
      id: 'mi/h',
      name: 'Miles per Hour',
      symbol: 'mph',
      dimension: 'speed',
      toBase: 1.60934,
      fromBase: 0.621371,
      aliases: ['mph'],
    },
    knot: {
      id: 'knot',
      name: 'Knot',
      symbol: 'kn',
      dimension: 'speed',
      toBase: 1.852,
      fromBase: 0.539957,
      aliases: ['knots', 'kn'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // DATA (base: byte)
  // ═══════════════════════════════════════════════════════════════
  data: {
    byte: {
      id: 'byte',
      name: 'Byte',
      symbol: 'B',
      dimension: 'data',
      toBase: 1,
      fromBase: 1,
      aliases: ['bytes'],
    },
    kb: {
      id: 'kb',
      name: 'Kilobyte',
      symbol: 'KB',
      dimension: 'data',
      toBase: 1024,
      fromBase: 1 / 1024,
      aliases: ['kilobyte', 'kilobytes'],
    },
    mb: {
      id: 'mb',
      name: 'Megabyte',
      symbol: 'MB',
      dimension: 'data',
      toBase: 1048576,
      fromBase: 1 / 1048576,
      aliases: ['megabyte', 'megabytes'],
    },
    gb: {
      id: 'gb',
      name: 'Gigabyte',
      symbol: 'GB',
      dimension: 'data',
      toBase: 1073741824,
      fromBase: 1 / 1073741824,
      aliases: ['gigabyte', 'gigabytes'],
    },
    tb: {
      id: 'tb',
      name: 'Terabyte',
      symbol: 'TB',
      dimension: 'data',
      toBase: 1099511627776,
      fromBase: 1 / 1099511627776,
      aliases: ['terabyte', 'terabytes'],
    },
  },

  // Currency placeholder (handled separately)
  currency: {},
};

// -----------------------------------------------------------------------------
// Unit Lookup Functions
// -----------------------------------------------------------------------------

/**
 * Find a unit by ID, symbol, or alias
 */
export function findUnit(query: string, dimension?: string): Unit | null {
  const queryLower = query.toLowerCase().trim();
  const dimensions = dimension ? [dimension] : Object.keys(UNITS);

  for (const dim of dimensions) {
    const units = UNITS[dim];
    if (!units) continue;

    for (const unit of Object.values(units)) {
      if (
        unit.id.toLowerCase() === queryLower ||
        unit.symbol.toLowerCase() === queryLower ||
        unit.aliases?.some((a) => a.toLowerCase() === queryLower)
      ) {
        return unit;
      }
    }
  }
  return null;
}

/**
 * Get all units for a dimension
 */
export function getUnitsForDimension(dimension: string): Unit[] {
  return Object.values(UNITS[dimension] || {});
}

/**
 * Get all dimensions
 */
export function getDimensions(): string[] {
  return Object.keys(UNITS).filter((d) => d !== 'currency');
}

/**
 * Get the base unit for a dimension
 */
export function getBaseUnit(dimension: string): Unit | null {
  const units = UNITS[dimension];
  if (!units) return null;

  // Base unit has toBase = 1
  return Object.values(units).find((u) => u.toBase === 1) || null;
}
