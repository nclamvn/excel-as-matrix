// =============================================================================
// TYPE INFERENCE — Auto-detect types from data (Blueprint §3.4)
// =============================================================================

import { BUILT_IN_TYPES, type SemanticType } from './types';

// -----------------------------------------------------------------------------
// Inference Result
// -----------------------------------------------------------------------------

export interface TypeInferenceResult {
  type: SemanticType;
  confidence: number;
  reason: string;
  alternates?: TypeInferenceResult[];
}

// -----------------------------------------------------------------------------
// Header Patterns
// -----------------------------------------------------------------------------

const HEADER_PATTERNS: Array<{ pattern: RegExp; type: string; confidence: number; reason: string }> = [
  // Financial
  { pattern: /\b(price|cost|amount|total|revenue|salary|budget|income|expense|payment)\b/i, type: 'currency', confidence: 0.85, reason: 'Header suggests currency' },
  { pattern: /\b(percent|rate|ratio|%)\b/i, type: 'percentage', confidence: 0.85, reason: 'Header suggests percentage' },

  // Temporal
  { pattern: /\b(date|day|created|updated|deadline|birthday|dob|born)\b/i, type: 'date', confidence: 0.85, reason: 'Header suggests date' },
  { pattern: /\b(time|hour|minute|timestamp)\b/i, type: 'time', confidence: 0.80, reason: 'Header suggests time' },
  { pattern: /\b(datetime|timestamp|created_at|updated_at)\b/i, type: 'datetime', confidence: 0.85, reason: 'Header suggests datetime' },
  { pattern: /\b(duration|elapsed|time_spent|period)\b/i, type: 'duration', confidence: 0.80, reason: 'Header suggests duration' },

  // Contact
  { pattern: /\b(email|e-mail|mail)\b/i, type: 'email', confidence: 0.95, reason: 'Header suggests email' },
  { pattern: /\b(phone|tel|mobile|cell|fax)\b/i, type: 'phone', confidence: 0.95, reason: 'Header suggests phone' },
  { pattern: /\b(url|website|link|webpage|site)\b/i, type: 'url', confidence: 0.95, reason: 'Header suggests URL' },

  // Numeric
  { pattern: /\b(count|quantity|qty|number|#|num|total|amount)\b/i, type: 'integer', confidence: 0.80, reason: 'Header suggests integer' },
  { pattern: /\b(id|code|sku|ref|reference)\b/i, type: 'text', confidence: 0.70, reason: 'Header suggests identifier' },

  // Boolean
  { pattern: /\b(active|enabled|status|verified|approved|is_|has_|can_)\b/i, type: 'boolean', confidence: 0.75, reason: 'Header suggests boolean' },

  // Measurement
  { pattern: /\b(weight|mass)\b/i, type: 'mass', confidence: 0.85, reason: 'Header suggests mass' },
  { pattern: /\b(height|length|width|distance|depth)\b/i, type: 'length', confidence: 0.85, reason: 'Header suggests length' },
  { pattern: /\b(temperature|temp)\b/i, type: 'temperature', confidence: 0.90, reason: 'Header suggests temperature' },
  { pattern: /\b(area|size|surface)\b/i, type: 'area', confidence: 0.80, reason: 'Header suggests area' },
  { pattern: /\b(volume|capacity)\b/i, type: 'volume', confidence: 0.80, reason: 'Header suggests volume' },
  { pattern: /\b(speed|velocity)\b/i, type: 'speed', confidence: 0.85, reason: 'Header suggests speed' },

  // Geographic
  { pattern: /\b(lat|lng|latitude|longitude|coords|coordinates)\b/i, type: 'coordinates', confidence: 0.90, reason: 'Header suggests coordinates' },
  { pattern: /\b(country|nation)\b/i, type: 'country', confidence: 0.85, reason: 'Header suggests country' },
];

// -----------------------------------------------------------------------------
// Value Patterns
// -----------------------------------------------------------------------------

const VALUE_PATTERNS: Array<{ pattern: RegExp; type: string; confidence: number; reason: string }> = [
  // Email
  { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, type: 'email', confidence: 0.95, reason: 'Email pattern detected' },

  // URL
  { pattern: /^https?:\/\//, type: 'url', confidence: 0.95, reason: 'URL pattern detected' },

  // Phone
  { pattern: /^\+?[\d\s\-()]{7,}$/, type: 'phone', confidence: 0.80, reason: 'Phone pattern detected' },

  // Date patterns
  { pattern: /^\d{4}-\d{2}-\d{2}$/, type: 'date', confidence: 0.90, reason: 'ISO date pattern' },
  { pattern: /^\d{2}\/\d{2}\/\d{4}$/, type: 'date', confidence: 0.85, reason: 'US date pattern' },
  { pattern: /^\d{2}-\d{2}-\d{4}$/, type: 'date', confidence: 0.85, reason: 'Date pattern' },

  // Datetime
  { pattern: /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/, type: 'datetime', confidence: 0.90, reason: 'Datetime pattern' },

  // Time
  { pattern: /^\d{2}:\d{2}(:\d{2})?$/, type: 'time', confidence: 0.90, reason: 'Time pattern' },

  // Percentage
  { pattern: /^-?\d+(\.\d+)?%$/, type: 'percentage', confidence: 0.95, reason: 'Percentage pattern' },

  // Currency
  { pattern: /^\$-?\d+(\.\d{2})?$/, type: 'currency', confidence: 0.90, reason: 'USD currency pattern' },
  { pattern: /^-?\d+(\.\d{2})?\s*(USD|EUR|GBP|JPY)$/i, type: 'currency', confidence: 0.90, reason: 'Currency with code' },

  // VND
  { pattern: /^-?\d+(\.\d+)?\s*(VND|đ|₫)$/i, type: 'currency_vnd', confidence: 0.90, reason: 'VND currency pattern' },

  // Boolean strings
  { pattern: /^(true|false|yes|no|y|n|1|0)$/i, type: 'boolean', confidence: 0.85, reason: 'Boolean string' },

  // UUID
  { pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, type: 'uuid', confidence: 0.98, reason: 'UUID pattern' },

  // Coordinates
  { pattern: /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, type: 'coordinates', confidence: 0.80, reason: 'Coordinate pair' },
];

// -----------------------------------------------------------------------------
// Type Inference Class
// -----------------------------------------------------------------------------

export class TypeInference {
  /**
   * Infer type from column header
   */
  inferFromHeader(header: string): TypeInferenceResult {
    const h = header.toLowerCase().trim();

    for (const { pattern, type, confidence, reason } of HEADER_PATTERNS) {
      if (pattern.test(h)) {
        return {
          type: BUILT_IN_TYPES[type] || BUILT_IN_TYPES.text,
          confidence,
          reason,
        };
      }
    }

    return {
      type: BUILT_IN_TYPES.text,
      confidence: 0.5,
      reason: 'No specific type detected from header',
    };
  }

  /**
   * Infer type from a single value
   */
  inferFromValue(value: unknown): TypeInferenceResult {
    // Handle null/undefined/empty
    if (value === null || value === undefined || value === '') {
      return {
        type: BUILT_IN_TYPES.text,
        confidence: 0.5,
        reason: 'Empty value',
      };
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return {
        type: BUILT_IN_TYPES.boolean,
        confidence: 1.0,
        reason: 'Boolean value',
      };
    }

    // Handle Date object
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return {
          type: BUILT_IN_TYPES.text,
          confidence: 0.5,
          reason: 'Invalid date',
        };
      }
      return {
        type: BUILT_IN_TYPES.datetime,
        confidence: 1.0,
        reason: 'Date object',
      };
    }

    // Handle number
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return {
          type: BUILT_IN_TYPES.text,
          confidence: 0.5,
          reason: 'NaN value',
        };
      }

      if (Number.isInteger(value)) {
        return {
          type: BUILT_IN_TYPES.integer,
          confidence: 0.7,
          reason: 'Integer value',
        };
      }

      return {
        type: BUILT_IN_TYPES.number,
        confidence: 0.8,
        reason: 'Numeric value',
      };
    }

    // Handle string
    if (typeof value === 'string') {
      const v = value.trim();

      // Check against value patterns
      for (const { pattern, type, confidence, reason } of VALUE_PATTERNS) {
        if (pattern.test(v)) {
          return {
            type: BUILT_IN_TYPES[type] || BUILT_IN_TYPES.text,
            confidence,
            reason,
          };
        }
      }

      // Check if it's a number string
      const numValue = parseFloat(v);
      if (!isNaN(numValue) && v === String(numValue)) {
        if (Number.isInteger(numValue)) {
          return {
            type: BUILT_IN_TYPES.integer,
            confidence: 0.7,
            reason: 'Integer string',
          };
        }
        return {
          type: BUILT_IN_TYPES.number,
          confidence: 0.8,
          reason: 'Numeric string',
        };
      }

      return {
        type: BUILT_IN_TYPES.text,
        confidence: 0.9,
        reason: 'Text value',
      };
    }

    // Handle object/array
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return {
          type: BUILT_IN_TYPES.text,
          confidence: 0.6,
          reason: 'Array value',
        };
      }

      // Check for coordinate-like object
      const obj = value as Record<string, unknown>;
      if ('lat' in obj && 'lng' in obj) {
        return {
          type: BUILT_IN_TYPES.coordinates,
          confidence: 0.9,
          reason: 'Coordinate object',
        };
      }

      return {
        type: BUILT_IN_TYPES.text,
        confidence: 0.6,
        reason: 'Object value',
      };
    }

    return {
      type: BUILT_IN_TYPES.text,
      confidence: 0.5,
      reason: 'Unknown value type',
    };
  }

  /**
   * Infer type from multiple sample values
   */
  inferFromSamples(values: unknown[]): TypeInferenceResult {
    const nonEmptyValues = values.filter(
      (v) => v !== null && v !== undefined && v !== ''
    );

    if (nonEmptyValues.length === 0) {
      return {
        type: BUILT_IN_TYPES.text,
        confidence: 0.5,
        reason: 'No samples',
      };
    }

    // Get inference for each value
    const inferences = nonEmptyValues.map((v) => this.inferFromValue(v));

    // Count type occurrences
    const counts = new Map<string, number>();
    for (const inf of inferences) {
      const typeId = inf.type.id;
      counts.set(typeId, (counts.get(typeId) || 0) + 1);
    }

    // Find most common type
    let maxType = BUILT_IN_TYPES.text;
    let maxCount = 0;
    for (const [typeId, count] of counts) {
      if (count > maxCount && BUILT_IN_TYPES[typeId]) {
        maxCount = count;
        maxType = BUILT_IN_TYPES[typeId];
      }
    }

    // Build alternates
    const alternates: TypeInferenceResult[] = [];
    for (const [typeId, count] of counts) {
      if (typeId !== maxType.id && BUILT_IN_TYPES[typeId]) {
        alternates.push({
          type: BUILT_IN_TYPES[typeId],
          confidence: count / inferences.length,
          reason: `${count}/${inferences.length} samples`,
        });
      }
    }

    // Sort alternates by confidence
    alternates.sort((a, b) => b.confidence - a.confidence);

    return {
      type: maxType,
      confidence: maxCount / inferences.length,
      reason: `${maxCount}/${inferences.length} samples`,
      alternates: alternates.slice(0, 3),
    };
  }

  /**
   * Combined inference from header and samples
   */
  infer(header: string, samples: unknown[]): TypeInferenceResult {
    const headerResult = this.inferFromHeader(header);
    const samplesResult = this.inferFromSamples(samples);

    // If header has high confidence, prefer it
    if (headerResult.confidence >= 0.85) {
      return {
        ...headerResult,
        confidence: Math.min(1, headerResult.confidence + samplesResult.confidence * 0.1),
        alternates: [samplesResult],
      };
    }

    // If samples have high confidence, prefer them
    if (samplesResult.confidence >= 0.9) {
      return {
        ...samplesResult,
        alternates: [headerResult, ...(samplesResult.alternates || [])],
      };
    }

    // Check if they agree
    if (headerResult.type.id === samplesResult.type.id) {
      return {
        type: headerResult.type,
        confidence: Math.min(1, (headerResult.confidence + samplesResult.confidence) / 1.5),
        reason: `Header and samples agree: ${headerResult.type.name}`,
      };
    }

    // Prefer header if reasonable, otherwise use samples
    if (headerResult.confidence > 0.7) {
      return {
        ...headerResult,
        alternates: [samplesResult],
      };
    }

    return {
      ...samplesResult,
      alternates: [headerResult, ...(samplesResult.alternates || [])],
    };
  }
}

// Export singleton instance
export const typeInference = new TypeInference();
