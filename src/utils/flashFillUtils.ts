/**
 * Flash Fill Utilities
 * Detects patterns from examples and applies them to other cells
 */

export interface FlashFillPattern {
  type: 'extract' | 'combine' | 'transform' | 'format';
  description: string;
  confidence: number;
}

export interface FlashFillResult {
  success: boolean;
  pattern: FlashFillPattern | null;
  values: string[];
  message: string;
}

/**
 * Detect pattern from source and example values
 */
export function detectFlashFillPattern(
  sourceValues: string[],
  exampleValues: string[]
): FlashFillPattern | null {
  if (sourceValues.length === 0 || exampleValues.length === 0) {
    return null;
  }

  // Try to detect extract pattern (e.g., extract first name from full name)
  const extractPattern = detectExtractPattern(sourceValues, exampleValues);
  if (extractPattern) return extractPattern;

  // Try to detect format pattern (e.g., format phone numbers)
  const formatPattern = detectFormatPattern(sourceValues, exampleValues);
  if (formatPattern) return formatPattern;

  // Try to detect transform pattern (e.g., uppercase, lowercase)
  const transformPattern = detectTransformPattern(sourceValues, exampleValues);
  if (transformPattern) return transformPattern;

  return null;
}

/**
 * Apply detected pattern to generate values for all source data
 */
export function applyFlashFill(
  sourceValues: string[],
  exampleValues: string[],
  pattern: FlashFillPattern
): FlashFillResult {
  const results: string[] = [];

  // Use examples to learn the pattern, then apply to remaining rows
  const exampleCount = exampleValues.filter((v) => v && v.trim()).length;

  for (let i = 0; i < sourceValues.length; i++) {
    const source = sourceValues[i];

    if (i < exampleCount && exampleValues[i]) {
      // Use the provided example
      results.push(exampleValues[i]);
    } else {
      // Apply the detected pattern
      const generated = generateValueFromPattern(source, sourceValues, exampleValues, pattern);
      results.push(generated);
    }
  }

  return {
    success: true,
    pattern,
    values: results,
    message: `Applied ${pattern.type} pattern with ${Math.round(pattern.confidence * 100)}% confidence`,
  };
}

// ============================================================================
// Pattern Detection Helpers
// ============================================================================

function detectExtractPattern(
  sourceValues: string[],
  exampleValues: string[]
): FlashFillPattern | null {
  // Check if examples are substrings of source
  let matchCount = 0;
  let extractType: 'first' | 'last' | 'word' | null = null;

  for (let i = 0; i < Math.min(sourceValues.length, exampleValues.length); i++) {
    const source = sourceValues[i];
    const example = exampleValues[i];

    if (!source || !example) continue;

    // Check if example is at the start
    if (source.startsWith(example)) {
      matchCount++;
      if (!extractType) extractType = 'first';
    }
    // Check if example is at the end
    else if (source.endsWith(example)) {
      matchCount++;
      if (!extractType) extractType = 'last';
    }
    // Check if example is a word from the source
    else if (source.includes(example)) {
      matchCount++;
      if (!extractType) extractType = 'word';
    }
    // Check first word extraction
    else {
      const firstWord = source.split(/\s+/)[0];
      const lastWord = source.split(/\s+/).pop() || '';

      if (example === firstWord) {
        matchCount++;
        if (!extractType) extractType = 'first';
      } else if (example === lastWord) {
        matchCount++;
        if (!extractType) extractType = 'last';
      }
    }
  }

  const validExamples = exampleValues.filter((v) => v && v.trim()).length;
  if (matchCount > 0 && matchCount >= validExamples * 0.5) {
    return {
      type: 'extract',
      description: `Extract ${extractType || 'part'} from text`,
      confidence: matchCount / Math.max(validExamples, 1),
    };
  }

  return null;
}

function detectFormatPattern(
  sourceValues: string[],
  exampleValues: string[]
): FlashFillPattern | null {
  // Check for formatting patterns (add dashes, parentheses, etc.)
  let formatMatch = 0;
  const validExamples = exampleValues.filter((v) => v && v.trim()).length;

  for (let i = 0; i < Math.min(sourceValues.length, exampleValues.length); i++) {
    const source = sourceValues[i];
    const example = exampleValues[i];

    if (!source || !example) continue;

    // Remove non-alphanumeric characters and compare
    const sourceClean = source.replace(/[^a-zA-Z0-9]/g, '');
    const exampleClean = example.replace(/[^a-zA-Z0-9]/g, '');

    if (sourceClean === exampleClean && source !== example) {
      formatMatch++;
    }
  }

  if (formatMatch > 0 && formatMatch >= validExamples * 0.5) {
    return {
      type: 'format',
      description: 'Apply formatting pattern',
      confidence: formatMatch / Math.max(validExamples, 1),
    };
  }

  return null;
}

function detectTransformPattern(
  sourceValues: string[],
  exampleValues: string[]
): FlashFillPattern | null {
  let upperCount = 0;
  let lowerCount = 0;
  let titleCount = 0;
  const validExamples = exampleValues.filter((v) => v && v.trim()).length;

  for (let i = 0; i < Math.min(sourceValues.length, exampleValues.length); i++) {
    const source = sourceValues[i];
    const example = exampleValues[i];

    if (!source || !example) continue;

    if (example === source.toUpperCase()) {
      upperCount++;
    } else if (example === source.toLowerCase()) {
      lowerCount++;
    } else if (example === toTitleCase(source)) {
      titleCount++;
    }
  }

  if (upperCount >= validExamples * 0.5) {
    return {
      type: 'transform',
      description: 'Convert to UPPERCASE',
      confidence: upperCount / Math.max(validExamples, 1),
    };
  }

  if (lowerCount >= validExamples * 0.5) {
    return {
      type: 'transform',
      description: 'Convert to lowercase',
      confidence: lowerCount / Math.max(validExamples, 1),
    };
  }

  if (titleCount >= validExamples * 0.5) {
    return {
      type: 'transform',
      description: 'Convert to Title Case',
      confidence: titleCount / Math.max(validExamples, 1),
    };
  }

  return null;
}

// ============================================================================
// Value Generation
// ============================================================================

function generateValueFromPattern(
  source: string,
  allSources: string[],
  examples: string[],
  pattern: FlashFillPattern
): string {
  if (!source) return '';

  switch (pattern.type) {
    case 'extract':
      return generateExtractValue(source, allSources, examples);

    case 'format':
      return generateFormatValue(source, allSources, examples);

    case 'transform':
      return generateTransformValue(source, pattern.description);

    default:
      return source;
  }
}

function generateExtractValue(
  source: string,
  allSources: string[],
  examples: string[]
): string {
  // Find the first valid source-example pair to learn from
  for (let i = 0; i < Math.min(allSources.length, examples.length); i++) {
    const srcExample = allSources[i];
    const targetExample = examples[i];

    if (!srcExample || !targetExample) continue;

    // Check if it's first word extraction
    const srcWords = srcExample.split(/\s+/);
    if (srcWords[0] === targetExample) {
      return source.split(/\s+/)[0] || source;
    }

    // Check if it's last word extraction
    if (srcWords[srcWords.length - 1] === targetExample) {
      const words = source.split(/\s+/);
      return words[words.length - 1] || source;
    }

    // Check if it's extracting up to a delimiter
    const delimiterMatch = srcExample.indexOf(targetExample);
    if (delimiterMatch === 0) {
      // Example is at the start, find where it ends
      const endPos = targetExample.length;
      const nextChar = srcExample[endPos];
      if (nextChar) {
        // Extract up to the same position ratio
        const ratio = endPos / srcExample.length;
        const extractEnd = Math.round(source.length * ratio);
        return source.substring(0, extractEnd);
      }
    }
  }

  // Default: return first word
  return source.split(/\s+/)[0] || source;
}

function generateFormatValue(
  source: string,
  allSources: string[],
  examples: string[]
): string {
  // Find the first valid source-example pair to learn the format
  for (let i = 0; i < Math.min(allSources.length, examples.length); i++) {
    const srcExample = allSources[i];
    const targetExample = examples[i];

    if (!srcExample || !targetExample) continue;

    // Build a format template
    const sourceDigits = srcExample.replace(/[^0-9a-zA-Z]/g, '');
    const targetDigits = targetExample.replace(/[^0-9a-zA-Z]/g, '');

    if (sourceDigits === targetDigits) {
      // Same content, different format - apply the same formatting
      let result = '';
      let sourceIdx = 0;
      const cleanSource = source.replace(/[^0-9a-zA-Z]/g, '');

      for (const char of targetExample) {
        if (/[0-9a-zA-Z]/.test(char)) {
          result += cleanSource[sourceIdx] || '';
          sourceIdx++;
        } else {
          result += char;
        }
      }

      // Add remaining characters if source is longer
      if (sourceIdx < cleanSource.length) {
        result += cleanSource.substring(sourceIdx);
      }

      return result;
    }
  }

  return source;
}

function generateTransformValue(source: string, description: string): string {
  if (description.includes('UPPERCASE')) {
    return source.toUpperCase();
  }
  if (description.includes('lowercase')) {
    return source.toLowerCase();
  }
  if (description.includes('Title Case')) {
    return toTitleCase(source);
  }
  return source;
}

// ============================================================================
// Utility Functions
// ============================================================================

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Auto-detect and apply flash fill in one step
 */
export function autoFlashFill(
  sourceValues: string[],
  exampleValues: string[]
): FlashFillResult {
  const pattern = detectFlashFillPattern(sourceValues, exampleValues);

  if (!pattern) {
    return {
      success: false,
      pattern: null,
      values: [],
      message: 'Could not detect a pattern. Try providing more examples.',
    };
  }

  return applyFlashFill(sourceValues, exampleValues, pattern);
}
