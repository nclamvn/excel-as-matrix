// =============================================================================
// NL PARSER — Parse natural language into structured intent
// =============================================================================

import type { ParsedNL } from './types';

type PatternList = RegExp[];
type PatternMap = Record<string, PatternList>;

/**
 * Parse natural language into structured intent for formula generation
 */
export class NLParser {
  private patterns: Record<'en' | 'vi', PatternMap> = {
    // =========================================================================
    // ENGLISH PATTERNS
    // =========================================================================
    en: {
      // =======================================================================
      // CONDITIONAL AGGREGATION (must be before simple aggregation!)
      // =======================================================================
      sumif: [
        /^sum\s+(?:of\s+)?(.+?)\s+(?:where|when|if)\s+(.+?)\s+(?:is|=|equals?)\s+(.+)$/i,
        /^total\s+(.+?)\s+(?:for|where)\s+(.+?)\s+=\s+(.+)$/i,
      ],
      countif: [
        /^count\s+(?:where|when|if)\s+(.+?)\s+(?:is|=|equals?)\s+(.+)$/i,
        /^how\s+many\s+(?:where|when|if)\s+(.+?)\s+(?:is|=|equals?)\s+(.+)$/i,
      ],
      averageif: [
        /^average\s+(?:of\s+)?(.+?)\s+(?:where|when|if)\s+(.+?)\s+(?:is|=|equals?)\s+(.+)$/i,
      ],

      // =======================================================================
      // SIMPLE AGGREGATION
      // =======================================================================
      sum: [
        /^sum\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
        /^total\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
        /^add\s+(?:up\s+)?(?:column\s+)?(.+)$/i,
      ],
      average: [
        /^average\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
        /^mean\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
        /^avg\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
      ],
      count: [
        /^count\s+(?:of\s+)?(?:column\s+)?(.+)$/i,
        /^how\s+many\s+(?:in\s+)?(.+)$/i,
        /^number\s+of\s+(?:items\s+in\s+)?(.+)$/i,
      ],
      max: [
        /^max(?:imum)?\s+(?:of\s+)?(?:in\s+)?(?:column\s+)?(.+)$/i,
        /^highest\s+(?:value\s+)?(?:in\s+)?(.+)$/i,
        /^largest\s+(?:in\s+)?(.+)$/i,
      ],
      min: [
        /^min(?:imum)?\s+(?:of\s+)?(?:in\s+)?(?:column\s+)?(.+)$/i,
        /^lowest\s+(?:value\s+)?(?:in\s+)?(.+)$/i,
        /^smallest\s+(?:in\s+)?(.+)$/i,
      ],

      // =======================================================================
      // LOOKUP
      // =======================================================================
      lookup: [
        // "lookup Apple in A return B" format
        /^(?:look\s*up|find|get)\s+(.+?)\s+in\s+([A-Za-z]+)\s+return\s+([A-Za-z]+)$/i,
        /^(?:look\s*up|find|get)\s+(.+?)\s+(?:for|where|when)\s+(.+?)\s+(?:is|=)\s+(.+)$/i,
        /^(?:vlookup|lookup)\s+(.+?)\s+(?:in|from)\s+(.+)$/i,
      ],

      // Logical
      if: [
        /^if\s+(.+?)\s+(?:then|,)\s+(.+?)(?:\s+(?:else|otherwise)\s+(.+))?$/i,
      ],

      // Text
      concat: [
        /^(?:combine|concat(?:enate)?|join)\s+(.+?)\s+(?:and|with|,)\s+(.+)$/i,
      ],

      // Date
      today: [/^today$/i, /^(?:today(?:'s)?\s+date|current\s+date)$/i],
      now: [/^now$/i, /^(?:now|current\s+(?:date\s+and\s+)?time)$/i],
      datediff: [
        /^(?:days?|months?|years?)\s+between\s+(.+?)\s+and\s+(.+)$/i,
        /^difference\s+between\s+(.+?)\s+and\s+(.+)$/i,
      ],

      // Math
      percentage: [
        /^percentage\s+(?:of\s+)?(.+?)\s+(?:of|from|in)\s+(.+)$/i,
        /^(.+?)\s+as\s+(?:a\s+)?percent(?:age)?\s+of\s+(.+)$/i,
      ],
      round: [
        /^round\s+(.+?)(?:\s+to\s+(\d+)\s+(?:decimal\s+)?places?)?$/i,
      ],
    },

    // =========================================================================
    // VIETNAMESE PATTERNS
    // =========================================================================
    vi: {
      // =======================================================================
      // CONDITIONAL AGGREGATION (must be before simple aggregation!)
      // =======================================================================
      sumif: [
        /^tổng\s+(?:của\s+)?(.+?)\s+(?:khi|nếu|với)\s+(.+?)\s+(?:là|=|bằng)\s+(.+)$/i,
        /^cộng\s+(.+?)\s+(?:cho|khi)\s+(.+?)\s+=\s+(.+)$/i,
      ],
      countif: [
        /^đếm\s+(?:khi|nếu|với)\s+(.+?)\s+(?:là|=|bằng)\s+(.+)$/i,
        /^đếm\s+(?:số\s+)?(?:khi|nếu|với)\s+(.+?)\s+(?:là|=|bằng)\s+(.+)$/i,
      ],
      averageif: [
        /^trung\s+bình\s+(?:của\s+)?(.+?)\s+(?:khi|nếu|với)\s+(.+?)\s+(?:là|=|bằng)\s+(.+)$/i,
      ],

      // =======================================================================
      // SIMPLE AGGREGATION
      // =======================================================================
      sum: [
        /^tổng\s+(?:của\s+)?(?:cột\s+)?(.+)$/i,
        /^cộng\s+(?:cột\s+)?(.+)$/i,
        /^tính\s+tổng\s+(.+)$/i,
      ],
      average: [
        /^trung\s+bình\s+(?:của\s+)?(?:cột\s+)?(.+)$/i,
        /^tb\s+(?:cột\s+)?(.+)$/i,
      ],
      count: [
        /^đếm\s+(?:số\s+)?(?:cột\s+)?(.+)$/i,
        /^số\s+lượng\s+(?:trong\s+)?(.+)$/i,
        /^bao\s+nhiêu\s+(.+)$/i,
      ],
      max: [
        /^(?:giá\s+trị\s+)?(?:lớn\s+nhất|max)\s+(?:của\s+)?(?:trong\s+)?(.+)$/i,
        /^cao\s+nhất\s+(?:trong\s+)?(.+)$/i,
      ],
      min: [
        /^(?:giá\s+trị\s+)?(?:nhỏ\s+nhất|min)\s+(?:của\s+)?(?:trong\s+)?(.+)$/i,
        /^thấp\s+nhất\s+(?:trong\s+)?(.+)$/i,
      ],

      // =======================================================================
      // LOOKUP
      // =======================================================================
      lookup: [
        /^tìm\s+(.+?)\s+trong\s+([A-Za-z]+)\s+trả\s+về\s+([A-Za-z]+)$/i,
        /^tìm\s+(.+?)\s+(?:khi|với)\s+(.+?)\s+(?:là|=)\s+(.+)$/i,
        /^tra\s+cứu\s+(.+?)\s+(?:trong|từ)\s+(.+)$/i,
      ],

      // =======================================================================
      // LOGICAL
      // =======================================================================
      if: [
        /^nếu\s+(.+?)\s+(?:thì|,)\s+(.+?)(?:\s+(?:ngược\s+lại|còn\s+không)\s+(.+))?$/i,
      ],

      // =======================================================================
      // DATE
      // =======================================================================
      today: [/^hôm\s*nay$/i, /^(?:ngày\s+)?hôm\s+nay$/i],
      now: [/^bây\s*giờ$/i, /^(?:thời\s+gian\s+)?hiện\s+tại$/i],
      datediff: [
        /^(?:số\s+)?(?:ngày|tháng|năm)\s+(?:giữa|từ)\s+(.+?)\s+(?:đến|và)\s+(.+)$/i,
      ],
      percentage: [
        /^(?:phần\s+trăm|%)\s+(?:của\s+)?(.+?)\s+(?:trong|trên)\s+(.+)$/i,
      ],
      round: [
        /^làm\s+tròn\s+(.+?)(?:\s+(?:đến|còn)\s+(\d+)\s+(?:chữ\s+số)?)?$/i,
      ],
    },
  };

  /**
   * Parse natural language text
   */
  parse(text: string, language: 'en' | 'vi'): ParsedNL {
    const normalized = text.trim().toLowerCase();
    const patterns = this.patterns[language];

    // Try each intent pattern
    for (const [intent, intentPatterns] of Object.entries(patterns)) {
      for (const pattern of intentPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          return this.extractEntities(intent, match);
        }
      }
    }

    // Try fallback patterns
    return this.fallbackParse(text, language);
  }

  /**
   * Extract entities from regex match
   */
  private extractEntities(intent: string, match: RegExpMatchArray): ParsedNL {
    const entities: Record<string, unknown> = {};
    const modifiers: Record<string, unknown> = {};

    switch (intent) {
      case 'sum':
      case 'average':
      case 'count':
      case 'max':
      case 'min':
        entities.range = match[1]?.trim();
        break;

      case 'sumif':
      case 'averageif':
        entities.sumRange = match[1]?.trim();
        entities.criteriaRange = match[2]?.trim();
        entities.criteria = match[3]?.trim();
        modifiers.operator = 'equals';
        break;

      case 'countif':
        entities.criteriaRange = match[1]?.trim();
        entities.criteria = match[2]?.trim();
        modifiers.operator = 'equals';
        break;

      case 'lookup':
        // Handle different patterns:
        // Pattern 1: "lookup Apple in A return B" → match[1]=Apple, match[2]=A, match[3]=B
        // Pattern 2: "lookup X for Y is Z" → match[1]=X(return), match[2]=Y(lookup), match[3]=Z(value)
        // Pattern 3: "lookup X in/from Y" → match[1]=X, match[2]=Y
        if (match[3]) {
          // Check if match[2] looks like a column letter (single letter A-Z)
          if (/^[A-Za-z]$/.test(match[2]?.trim() || '')) {
            // Pattern 1: "lookup Value in ColA return ColB"
            entities.lookupValue = match[1]?.trim();
            entities.lookupColumn = match[2]?.trim();
            entities.returnColumn = match[3]?.trim();
          } else {
            // Pattern 2: "lookup ReturnCol for LookupCol is Value"
            entities.returnColumn = match[1]?.trim();
            entities.lookupColumn = match[2]?.trim();
            entities.lookupValue = match[3]?.trim();
          }
        } else {
          // Pattern 3: two captures only
          entities.lookupValue = match[1]?.trim();
          entities.tableRange = match[2]?.trim();
        }
        break;

      case 'if':
        entities.condition = this.parseCondition(match[1]?.trim() || '');
        entities.trueValue = match[2]?.trim();
        entities.falseValue = match[3]?.trim();
        break;

      case 'concat':
        entities.ranges = [match[1]?.trim(), match[2]?.trim()];
        break;

      case 'datediff':
        entities.startDate = match[1]?.trim();
        entities.endDate = match[2]?.trim();
        modifiers.unit = this.detectDateUnit(match[0]);
        break;

      case 'percentage':
        entities.part = match[1]?.trim();
        entities.total = match[2]?.trim();
        break;

      case 'round':
        entities.value = match[1]?.trim();
        modifiers.decimals = match[2] ? parseInt(match[2]) : 0;
        break;

      case 'today':
      case 'now':
        // No entities needed
        break;
    }

    return { intent, entities, modifiers };
  }

  /**
   * Parse condition string
   */
  private parseCondition(condStr: string): unknown {
    // Try to parse "A > B" style
    const opMatch = condStr.match(/(.+?)\s*(>|<|>=|<=|=|<>|!=)\s*(.+)/);
    if (opMatch) {
      const opMap: Record<string, string> = {
        '>': 'greater',
        '<': 'less',
        '>=': 'greaterEqual',
        '<=': 'lessEqual',
        '=': 'equals',
        '<>': 'notEqual',
        '!=': 'notEqual',
      };
      return {
        left: opMatch[1].trim(),
        operator: opMap[opMatch[2]] || 'equals',
        right: opMatch[3].trim(),
      };
    }

    // Try "A is B" style
    const isMatch = condStr.match(/(.+?)\s+(?:is|equals?|=)\s+(.+)/i);
    if (isMatch) {
      return {
        left: isMatch[1].trim(),
        operator: 'equals',
        right: isMatch[2].trim(),
      };
    }

    return condStr;
  }

  /**
   * Detect date unit from text
   */
  private detectDateUnit(text: string): string {
    if (/days?|ngày/i.test(text)) return 'days';
    if (/months?|tháng/i.test(text)) return 'months';
    if (/years?|năm/i.test(text)) return 'years';
    return 'days';
  }

  /**
   * Fallback parsing using keywords
   */
  private fallbackParse(text: string, _language: string): ParsedNL {
    const lower = text.toLowerCase();

    // Detect intent from keywords
    const keywords: Record<string, string[]> = {
      sum: ['sum', 'total', 'add', 'tổng', 'cộng'],
      average: ['average', 'avg', 'mean', 'trung bình', 'tb'],
      count: ['count', 'how many', 'number of', 'đếm', 'số lượng', 'bao nhiêu'],
      max: ['max', 'maximum', 'highest', 'largest', 'lớn nhất', 'cao nhất'],
      min: ['min', 'minimum', 'lowest', 'smallest', 'nhỏ nhất', 'thấp nhất'],
      lookup: ['lookup', 'find', 'get', 'search', 'tìm', 'tra cứu'],
      if: ['if', 'when', 'nếu', 'khi'],
    };

    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some((w) => lower.includes(w))) {
        // Extract anything that looks like a column reference
        const colMatch = text.match(
          /(?:column\s+)?([A-Z](?::[A-Z])?|\w+(?:\s+\w+)?)/i
        );

        return {
          intent,
          entities: { range: colMatch?.[1] || 'A:A' },
          modifiers: {},
        };
      }
    }

    return {
      intent: '',
      entities: {},
      modifiers: {},
    };
  }
}
