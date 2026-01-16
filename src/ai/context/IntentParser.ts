// ═══════════════════════════════════════════════════════════════════════════
// INTENT PARSER — Parse user intent from natural language
// ═══════════════════════════════════════════════════════════════════════════

import type { ParsedIntent, IntentAction, IntentEntity } from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey, parseCellRef } from '../../types/cell';

/**
 * Parse user intent from natural language
 */
export class IntentParser {
  // Common patterns for different intents
  private patterns: Record<string, RegExp[]> = {
    read: [
      /show\s+(me\s+)?/i,
      /what('s|\s+is)\s+(the\s+)?(value|data|content)/i,
      /display/i,
      /get\s+(me\s+)?/i,
      /xem\s+/i, // Vietnamese
      /hiển\s+thị/i,
    ],
    calculate: [
      /sum\s+(of|up)?/i,
      /average|mean/i,
      /count\s+(how\s+many)?/i,
      /total/i,
      /calculate/i,
      /formula\s+for/i,
      /add\s+up/i,
      /tổng/i, // Vietnamese
      /trung\s+bình/i,
      /tính/i,
    ],
    analyze: [
      /analyze/i,
      /trend/i,
      /pattern/i,
      /insight/i,
      /compare/i,
      /find\s+(any\s+)?(issues?|errors?|problems?)/i,
      /phân\s+tích/i, // Vietnamese
    ],
    modify: [
      /change/i,
      /update/i,
      /set\s+.*\s+to/i,
      /replace/i,
      /fill/i,
      /clear/i,
      /delete/i,
      /thay\s+đổi/i, // Vietnamese
      /cập\s+nhật/i,
    ],
    create: [
      /create/i,
      /make\s+(a|an)?/i,
      /add\s+(a|an)?\s+new/i,
      /insert/i,
      /generate/i,
      /tạo/i, // Vietnamese
      /thêm/i,
    ],
    explain: [
      /explain/i,
      /how\s+(does|do)/i,
      /why\s+(is|does)/i,
      /what\s+does\s+.*\s+mean/i,
      /tell\s+me\s+about/i,
      /understand/i,
      /giải\s+thích/i, // Vietnamese
      /là\s+gì/i,
    ],
    debug: [
      /fix/i,
      /debug/i,
      /wrong/i,
      /error/i,
      /issue/i,
      /problem/i,
      /not\s+working/i,
      /incorrect/i,
      /sửa/i, // Vietnamese
      /lỗi/i,
    ],
  };

  /**
   * Parse user message into structured intent
   */
  async parse(
    message: string,
    _conversationHistory: string[] = []
  ): Promise<ParsedIntent> {
    // Detect action type
    const action = this.detectAction(message);

    // Extract entities
    const entities = this.extractEntities(message);

    // Resolve entity references
    const resolvedEntities = this.resolveEntities(entities);

    // Calculate confidence
    const confidence = this.calculateConfidence(action, resolvedEntities);

    // Find ambiguities
    const ambiguities = this.findAmbiguities(message, resolvedEntities);

    // Generate clarifying questions
    const clarifyingQuestions = this.generateClarifyingQuestions(ambiguities);

    return {
      action,
      entities: resolvedEntities,
      confidence,
      ambiguities,
      clarifyingQuestions,
    };
  }

  /**
   * Detect the action type from message
   */
  private detectAction(message: string): IntentAction {
    const messageLower = message.toLowerCase();

    // Check each pattern category
    for (const [action, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(messageLower)) {
          return action as IntentAction;
        }
      }
    }

    // Default based on question words
    if (/^(what|show|display|get)/i.test(messageLower)) {
      return 'read';
    }
    if (/^(how|why|explain)/i.test(messageLower)) {
      return 'explain';
    }
    if (/^(can you|please|could you)/i.test(messageLower)) {
      // Could be any action, need more context
      return 'unknown';
    }

    return 'unknown';
  }

  /**
   * Extract entity references from message
   */
  private extractEntities(message: string): IntentEntity[] {
    const entities: IntentEntity[] = [];

    // Extract ranges (must check before cells)
    const rangePattern = /\b([A-Z]{1,3}\d{1,7}):([A-Z]{1,3}\d{1,7})\b/gi;
    let rangeMatch;
    while ((rangeMatch = rangePattern.exec(message)) !== null) {
      entities.push({
        type: 'range',
        reference: rangeMatch[0].toUpperCase(),
        resolved: false,
        confidence: 0.9,
      });
    }

    // Extract cells (exclude those already in ranges)
    const rangeRefs = entities.map((e) => e.reference);
    const cellPattern = /\b([A-Z]{1,3}\d{1,7})\b/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(message)) !== null) {
      const ref = cellMatch[0].toUpperCase();
      // Check if this cell is part of a range
      const isInRange = rangeRefs.some((r) => {
        const [start, end] = r.split(':');
        return start === ref || end === ref;
      });

      if (!isInRange) {
        // Make sure it's not a duplicate
        if (!entities.some((e) => e.reference === ref)) {
          entities.push({
            type: 'cell',
            reference: ref,
            resolved: false,
            confidence: 0.9,
          });
        }
      }
    }

    // Extract column references
    const columnPattern = /column\s+([A-Z])/gi;
    let colMatch;
    while ((colMatch = columnPattern.exec(message)) !== null) {
      const col = colMatch[1].toUpperCase();
      entities.push({
        type: 'column',
        reference: col,
        resolved: false,
        confidence: 0.8,
      });
    }

    // Also check for standalone column mentions like "cột A" (Vietnamese)
    const colPatternVN = /cột\s+([A-Z])/gi;
    while ((colMatch = colPatternVN.exec(message)) !== null) {
      const col = colMatch[1].toUpperCase();
      entities.push({
        type: 'column',
        reference: col,
        resolved: false,
        confidence: 0.8,
      });
    }

    // Extract row references
    const rowPattern = /row\s+(\d{1,7})/gi;
    let rowMatch;
    while ((rowMatch = rowPattern.exec(message)) !== null) {
      entities.push({
        type: 'row',
        reference: rowMatch[1],
        resolved: false,
        confidence: 0.8,
      });
    }

    // Also check for standalone row mentions like "hàng 5" (Vietnamese)
    const rowPatternVN = /hàng\s+(\d{1,7})/gi;
    while ((rowMatch = rowPatternVN.exec(message)) !== null) {
      entities.push({
        type: 'row',
        reference: rowMatch[1],
        resolved: false,
        confidence: 0.8,
      });
    }

    return entities;
  }

  /**
   * Resolve entity references against actual spreadsheet
   */
  private resolveEntities(entities: IntentEntity[]): IntentEntity[] {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    return entities.map((entity) => {
      switch (entity.type) {
        case 'cell':
        case 'range': {
          // Verify cell/range exists (has data or is valid reference)
          try {
            const cellRef = entity.reference.split(':')[0];
            const pos = parseCellRef(cellRef);
            if (pos) {
              const key = getCellKey(pos.row, pos.col);
              const cell = sheet?.cells[key];
              return {
                ...entity,
                resolved: true,
                resolvedRef: entity.reference,
                confidence: cell ? 0.95 : 0.85,
              };
            }
            return entity;
          } catch {
            return entity;
          }
        }

        case 'column': {
          // Convert column letter to range
          const colLetter = entity.reference;
          return {
            ...entity,
            resolved: true,
            resolvedRef: `${colLetter}1:${colLetter}100`, // Default to first 100 rows
            confidence: 0.8,
          };
        }

        case 'row': {
          // Convert row number to range
          const rowNum = entity.reference;
          return {
            ...entity,
            resolved: true,
            resolvedRef: `A${rowNum}:Z${rowNum}`, // Default to columns A-Z
            confidence: 0.8,
          };
        }

        default:
          return entity;
      }
    });
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    action: IntentAction,
    entities: IntentEntity[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Action clarity
    if (action !== 'unknown') {
      confidence += 0.2;
    }

    // Entity resolution
    const resolvedCount = entities.filter((e) => e.resolved).length;
    if (entities.length > 0) {
      confidence += 0.2 * (resolvedCount / entities.length);
    } else {
      confidence += 0.1; // No entities is not necessarily bad
    }

    // Entity confidence average
    if (entities.length > 0) {
      const avgEntityConfidence =
        entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence += 0.1 * avgEntityConfidence;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Find ambiguities in the intent
   */
  private findAmbiguities(
    message: string,
    entities: IntentEntity[]
  ): string[] {
    const ambiguities: string[] = [];

    // Check for unresolved entities
    const unresolved = entities.filter((e) => !e.resolved);
    if (unresolved.length > 0) {
      ambiguities.push(
        `Could not find: ${unresolved.map((e) => e.reference).join(', ')}`
      );
    }

    // Check for vague references
    if (/\b(it|this|that|those|these|nó|này|đó)\b/i.test(message)) {
      ambiguities.push('Vague reference detected (it/this/that)');
    }

    // Check for missing range specification
    if (
      /\b(all|every|each|tất\s+cả|mỗi)\b/i.test(message) &&
      !entities.some((e) => e.type === 'range')
    ) {
      ambiguities.push('Range not specified for "all/every/each"');
    }

    return ambiguities;
  }

  /**
   * Generate clarifying questions
   */
  private generateClarifyingQuestions(ambiguities: string[]): string[] {
    const questions: string[] = [];

    for (const ambiguity of ambiguities) {
      if (ambiguity.includes('Could not find')) {
        questions.push('Which specific cells or range are you referring to?');
      }
      if (ambiguity.includes('Vague reference')) {
        questions.push('Could you specify which cell or range you mean?');
      }
      if (ambiguity.includes('Range not specified')) {
        questions.push('What range should I apply this to?');
      }
    }

    return questions;
  }
}

// Export singleton
export const intentParser = new IntentParser();
