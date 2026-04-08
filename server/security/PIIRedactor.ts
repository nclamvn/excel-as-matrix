// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE PII REDACTOR — Runs on Hono server before forwarding to Claude
// ═══════════════════════════════════════════════════════════════════════════

type PIIType = 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address';

interface PIIPattern {
  type: PIIType;
  regex: RegExp;
  label: string;
  validate?: (match: string) => boolean;
}

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

const PII_PATTERNS: PIIPattern[] = [
  {
    type: 'credit_card',
    regex: /\b(?:4[0-9]{3}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|5[1-5][0-9]{2}[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}|3[47][0-9]{1}[-\s]?[0-9]{4}[-\s]?[0-9]{6}[-\s]?[0-9]{5}|6(?:011|5[0-9]{2})[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4})\b/g,
    label: 'CREDIT_CARD',
    validate: (match: string) => luhnCheck(match.replace(/[-\s]/g, '')),
  },
  {
    type: 'ssn',
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
    validate: (match: string) => match !== '127.0.0.1' && !match.startsWith('0.') && match !== '255.255.255.255',
  },
];

export class ServerPIIRedactor {
  private tokenMap = new Map<string, string>();
  private reverseMap = new Map<string, string>();
  private counter = 0;
  private redactionCount = 0;

  redactText(text: string): string {
    let result = text;

    for (const pattern of PII_PATTERNS) {
      pattern.regex.lastIndex = 0;
      const found: string[] = [];
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(text)) !== null) {
        if (pattern.validate && !pattern.validate(match[0])) continue;
        found.push(match[0]);
      }

      for (const value of found) {
        let token = this.reverseMap.get(value);
        if (!token) {
          this.counter++;
          token = `[${pattern.label}_${this.counter}]`;
          this.tokenMap.set(token, value);
          this.reverseMap.set(value, token);
        }
        result = result.split(value).join(token);
        this.redactionCount++;
      }
    }

    return result;
  }

  restoreText(text: string): string {
    let result = text;
    for (const [token, original] of this.tokenMap.entries()) {
      result = result.split(token).join(original);
    }
    return result;
  }

  redactMessages(messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      ...msg,
      content: typeof msg.content === 'string' ? this.redactText(msg.content) : msg.content,
    }));
  }

  getRedactionCount(): number {
    return this.redactionCount;
  }
}
