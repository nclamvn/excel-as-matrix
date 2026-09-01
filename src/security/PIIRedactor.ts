// ═══════════════════════════════════════════════════════════════════════════
// PII REDACTOR — Detects and masks personally identifiable information
// before sending data to external AI APIs
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'date_of_birth'
  | 'passport'
  | 'drivers_license';

export interface PIIMatch {
  type: PIIType;
  original: string;
  redacted: string;
  start: number;
  end: number;
}

export interface RedactionResult {
  text: string;
  matches: PIIMatch[];
  hasRedactions: boolean;
}

export interface RedactionStats {
  totalScanned: number;
  totalRedacted: number;
  byType: Record<PIIType, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PII Patterns — ordered by specificity (most specific first)
// ─────────────────────────────────────────────────────────────────────────────

interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  label: string;
  validate?: (match: string) => boolean;
}

const PII_PATTERNS: PIIPattern[] = [
  {
    type: 'credit_card',
    // Visa, MC, Amex, Discover — with optional separators
    regex:
      /\b(?:4[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|5[1-5][0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|3[47][0-9]{1}[-\s]?[0-9]{4}[-\s]?[0-9]{6}[-\s]?[0-9]{5}|6(?:011|5[0-9]{2})[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/g,
    label: 'CREDIT_CARD',
    validate: (match: string) => luhnCheck(match.replace(/[-\s]/g, '')),
  },
  {
    type: 'ssn',
    // US Social Security Number
    regex: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,
    label: 'SSN',
    validate: (match: string) => {
      const digits = match.replace(/[-\s]/g, '');
      return digits.length === 9 && !/^(\d)\1{8}$/.test(digits);
    },
  },
  {
    type: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    label: 'EMAIL',
  },
  {
    type: 'phone',
    // International and US formats
    regex: /(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    label: 'PHONE',
    validate: (match: string) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    },
  },
  {
    type: 'ip_address',
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    label: 'IP_ADDR',
    validate: (match: string) => {
      // Skip common non-PII IPs (localhost, link-local)
      return match !== '127.0.0.1' && !match.startsWith('0.') && match !== '255.255.255.255';
    },
  },
  {
    type: 'passport',
    // US passport format
    regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
    label: 'PASSPORT',
    validate: (match: string) => match.length >= 7 && match.length <= 11,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Luhn Check for credit card validation
// ─────────────────────────────────────────────────────────────────────────────

function luhnCheck(num: string): boolean {
  if (!/^\d+$/.test(num) || num.length < 13 || num.length > 19) return false;

  let sum = 0;
  let alternate = false;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIIRedactor Class
// ─────────────────────────────────────────────────────────────────────────────

export class PIIRedactor {
  private stats: RedactionStats = {
    totalScanned: 0,
    totalRedacted: 0,
    byType: {
      email: 0,
      phone: 0,
      ssn: 0,
      credit_card: 0,
      ip_address: 0,
      date_of_birth: 0,
      passport: 0,
      drivers_license: 0,
    },
  };

  private tokenMap = new Map<string, string>(); // redacted → original (for restoration)
  private reverseMap = new Map<string, string>(); // original → redacted (dedup)
  private tokenCounter = 0;

  /**
   * Redact PII from a text string
   */
  redact(text: string): RedactionResult {
    this.stats.totalScanned++;

    const matches: PIIMatch[] = [];
    let redactedText = text;

    for (const pattern of PII_PATTERNS) {
      // Reset regex lastIndex
      pattern.regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      // Collect all matches first to avoid modifying text while iterating
      const found: Array<{ value: string; index: number }> = [];

      while ((match = pattern.regex.exec(text)) !== null) {
        const value = match[0];

        // Run validation if available
        if (pattern.validate && !pattern.validate(value)) continue;

        found.push({ value, index: match.index });
      }

      for (const { value } of found) {
        // Check if already mapped (dedup)
        let token = this.reverseMap.get(value);
        if (!token) {
          this.tokenCounter++;
          token = `[${pattern.label}_${this.tokenCounter}]`;
          this.tokenMap.set(token, value);
          this.reverseMap.set(value, token);
        }

        matches.push({
          type: pattern.type,
          original: value,
          redacted: token,
          start: 0, // Position in original text (approximate after replacements)
          end: 0,
        });

        redactedText = redactedText.split(value).join(token);
        this.stats.totalRedacted++;
        this.stats.byType[pattern.type]++;
      }
    }

    if (matches.length > 0) {
      loggers.ai.info(
        `PII redacted: ${matches.length} items (${matches.map((m) => m.type).join(', ')})`
      );
    }

    return {
      text: redactedText,
      matches,
      hasRedactions: matches.length > 0,
    };
  }

  /**
   * Restore PII tokens back to original values in AI response text
   */
  restore(text: string): string {
    let restored = text;
    for (const [token, original] of this.tokenMap.entries()) {
      restored = restored.split(token).join(original);
    }
    return restored;
  }

  /**
   * Redact PII from an array of Claude API messages
   */
  redactMessages(messages: Array<{ role: string; content: string | unknown[] }>): {
    messages: Array<{ role: string; content: string | unknown[] }>;
    totalRedactions: number;
  } {
    let totalRedactions = 0;

    const redactedMessages = messages.map((msg) => {
      if (typeof msg.content === 'string') {
        const result = this.redact(msg.content);
        totalRedactions += result.matches.length;
        return { ...msg, content: result.text };
      }

      // Handle content blocks (array format)
      if (Array.isArray(msg.content)) {
        const redactedContent = msg.content.map((block: unknown) => {
          if (
            typeof block === 'object' &&
            block !== null &&
            'type' in block &&
            (block as { type: string }).type === 'text' &&
            'text' in block
          ) {
            const result = this.redact((block as { text: string }).text);
            totalRedactions += result.matches.length;
            return { ...block, text: result.text };
          }
          return block;
        });
        return { ...msg, content: redactedContent };
      }

      return msg;
    });

    return { messages: redactedMessages, totalRedactions };
  }

  /**
   * Redact PII from system prompt
   */
  redactSystemPrompt(prompt: string): RedactionResult {
    return this.redact(prompt);
  }

  /**
   * Restore PII in AI response
   */
  restoreResponse(response: string): string {
    return this.restore(response);
  }

  /**
   * Get redaction statistics
   */
  getStats(): RedactionStats {
    return { ...this.stats };
  }

  /**
   * Reset the redactor state (new conversation)
   */
  reset(): void {
    this.tokenMap.clear();
    this.reverseMap.clear();
    this.tokenCounter = 0;
  }

  /**
   * Get number of active tokens (for debugging)
   */
  getActiveTokenCount(): number {
    return this.tokenMap.size;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-side PII Redactor (for use in server/routes/ai.ts)
// Same patterns but without import.meta.env dependency
// ─────────────────────────────────────────────────────────────────────────────

export function createPIIRedactor(): PIIRedactor {
  return new PIIRedactor();
}

// Export singleton for client-side use
export const piiRedactor = new PIIRedactor();
