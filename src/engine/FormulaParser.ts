import {
  Token,
  TokenType,
  ASTNode,
  NumberNode,
  StringNode,
  BooleanNode,
  CellRefNode,
  RangeRefNode,
  FunctionCallNode,
  BinaryOpNode,
  UnaryOpNode,
  ArrayNode,
  CellReference,
  FormulaError,
} from './types';

// Column letter to number (A=0, B=1, ..., Z=25, AA=26, ...)
export function colLetterToNumber(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1; // 0-indexed
}

// Number to column letter (0=A, 1=B, ..., 25=Z, 26=AA, ...)
export function numberToColLetter(num: number): string {
  let result = '';
  num += 1; // 1-indexed for calculation
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

// Parse cell reference string like "A1", "$A$1", "Sheet1!A1"
export function parseCellRef(ref: string): CellReference {
  let sheetName: string | undefined;
  let cellPart = ref;

  // Check for sheet reference
  if (ref.includes('!')) {
    const parts = ref.split('!');
    sheetName = parts[0].replace(/^'|'$/g, ''); // Remove quotes if present
    cellPart = parts[1];
  }

  const match = cellPart.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/i);
  if (!match) {
    throw new FormulaError('#REF!', `Invalid cell reference: ${ref}`);
  }

  const colAbsolute = match[1] === '$';
  const col = colLetterToNumber(match[2].toUpperCase());
  const rowAbsolute = match[3] === '$';
  const row = parseInt(match[4], 10) - 1; // 0-indexed

  return { col, row, colAbsolute, rowAbsolute, sheetName };
}

// Tokenizer
export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private tokens: Token[] = [];

  constructor(formula: string) {
    // Remove leading = if present
    this.input = formula.startsWith('=') ? formula.slice(1) : formula;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.pos = 0;

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }

    this.tokens.push({ type: 'EOF', value: '', position: this.pos });
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private nextToken(): Token | null {
    const startPos = this.pos;
    const char = this.input[this.pos];

    // String literal
    if (char === '"') {
      return this.readString();
    }

    // Number
    if (/\d/.test(char) || (char === '.' && /\d/.test(this.input[this.pos + 1] || ''))) {
      return this.readNumber();
    }

    // Cell reference, range, or function name
    if (/[A-Za-z$']/.test(char)) {
      return this.readIdentifier();
    }

    // Operators
    if ('+-*/^%&'.includes(char)) {
      this.pos++;
      return { type: 'OPERATOR', value: char, position: startPos };
    }

    // Comparison operators
    if (char === '<' || char === '>' || char === '=') {
      return this.readComparisonOperator();
    }

    // Parentheses
    if (char === '(') {
      this.pos++;
      return { type: 'LPAREN', value: '(', position: startPos };
    }
    if (char === ')') {
      this.pos++;
      return { type: 'RPAREN', value: ')', position: startPos };
    }

    // Comma
    if (char === ',') {
      this.pos++;
      return { type: 'COMMA', value: ',', position: startPos };
    }

    // Colon (for ranges)
    if (char === ':') {
      this.pos++;
      return { type: 'COLON', value: ':', position: startPos };
    }

    // Array braces
    if (char === '{' || char === '}' || char === ';') {
      this.pos++;
      return { type: 'OPERATOR', value: char, position: startPos };
    }

    throw new FormulaError('#ERROR!', `Unexpected character: ${char}`);
  }

  private readString(): Token {
    const startPos = this.pos;
    this.pos++; // Skip opening quote
    let value = '';

    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === '"') {
        // Check for escaped quote
        if (this.input[this.pos + 1] === '"') {
          value += '"';
          this.pos += 2;
        } else {
          this.pos++; // Skip closing quote
          break;
        }
      } else {
        value += char;
        this.pos++;
      }
    }

    return { type: 'STRING', value, position: startPos };
  }

  private readNumber(): Token {
    const startPos = this.pos;
    let value = '';

    // Read integer part
    while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
      value += this.input[this.pos];
      this.pos++;
    }

    // Read decimal part
    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      value += '.';
      this.pos++;
      while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
        value += this.input[this.pos];
        this.pos++;
      }
    }

    // Read exponent part
    if (this.pos < this.input.length && /[eE]/.test(this.input[this.pos])) {
      value += this.input[this.pos];
      this.pos++;
      if (this.pos < this.input.length && /[+-]/.test(this.input[this.pos])) {
        value += this.input[this.pos];
        this.pos++;
      }
      while (this.pos < this.input.length && /\d/.test(this.input[this.pos])) {
        value += this.input[this.pos];
        this.pos++;
      }
    }

    // Check for percentage
    if (this.pos < this.input.length && this.input[this.pos] === '%') {
      value += '%';
      this.pos++;
    }

    return { type: 'NUMBER', value, position: startPos };
  }

  private readIdentifier(): Token {
    const startPos = this.pos;
    let value = '';

    // Handle quoted sheet names
    if (this.input[this.pos] === "'") {
      this.pos++;
      while (this.pos < this.input.length && this.input[this.pos] !== "'") {
        value += this.input[this.pos];
        this.pos++;
      }
      if (this.pos < this.input.length) this.pos++; // Skip closing quote
      value = "'" + value + "'";
    }

    // Read identifier (letters, numbers, $, _, !)
    while (this.pos < this.input.length && /[A-Za-z0-9$_!]/.test(this.input[this.pos])) {
      value += this.input[this.pos];
      this.pos++;
    }

    // Check if followed by colon (range) - peek ahead
    const nextNonSpace = this.peekNonSpace();
    if (nextNonSpace === ':') {
      // This might be a range start
      return this.classifyIdentifier(value, startPos);
    }

    // Check if followed by parenthesis (function call)
    if (nextNonSpace === '(') {
      return { type: 'FUNCTION', value: value.toUpperCase(), position: startPos };
    }

    return this.classifyIdentifier(value, startPos);
  }

  private classifyIdentifier(value: string, position: number): Token {
    const upperValue = value.toUpperCase();

    // Boolean values
    if (upperValue === 'TRUE') {
      return { type: 'BOOLEAN', value: 'TRUE', position };
    }
    if (upperValue === 'FALSE') {
      return { type: 'BOOLEAN', value: 'FALSE', position };
    }

    // Cell reference pattern: optional sheet!, optional $, letters, optional $, numbers
    const cellPattern = /^(?:'?[^'!]+'?!)?(\$?[A-Z]+\$?\d+)$/i;
    if (cellPattern.test(value)) {
      return { type: 'CELL_REF', value, position };
    }

    // Just a column or row reference (for ranges like A:A or 1:1)
    // For now, treat as cell ref
    return { type: 'CELL_REF', value, position };
  }

  private readComparisonOperator(): Token {
    const startPos = this.pos;
    let value = this.input[this.pos];
    this.pos++;

    // Check for two-character operators
    if (this.pos < this.input.length) {
      const next = this.input[this.pos];
      if ((value === '<' && (next === '=' || next === '>')) ||
          (value === '>' && next === '=') ||
          (value === '=' && next === '=')) {
        value += next;
        this.pos++;
      }
    }

    return { type: 'OPERATOR', value, position: startPos };
  }

  private peekNonSpace(): string {
    let i = this.pos;
    while (i < this.input.length && /\s/.test(this.input[i])) {
      i++;
    }
    return this.input[i] || '';
  }
}

// Parser - converts tokens to AST
export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  parse(formula: string): ASTNode {
    const tokenizer = new Tokenizer(formula);
    this.tokens = tokenizer.tokenize();
    this.pos = 0;
    return this.parseExpression();
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: 0 };
  }


  private consume(type?: TokenType): Token {
    const token = this.current();
    if (type && token.type !== type) {
      throw new FormulaError('#ERROR!', `Expected ${type}, got ${token.type}`);
    }
    this.pos++;
    return token;
  }

  private parseExpression(): ASTNode {
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    let left = this.parseConcat();

    while (['=', '<>', '<', '>', '<=', '>='].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseConcat();
      left = { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseConcat(): ASTNode {
    let left = this.parseAddSub();

    while (this.current().value === '&') {
      const operator = this.consume().value;
      const right = this.parseAddSub();
      left = { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();

    while (['+', '-'].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseMulDiv();
      left = { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseMulDiv(): ASTNode {
    let left = this.parsePower();

    while (['*', '/', '%'].includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parsePower();
      left = { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parsePower(): ASTNode {
    let left = this.parseUnary();

    while (this.current().value === '^') {
      const operator = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'BinaryOp', operator, left, right } as BinaryOpNode;
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.current().value === '-' || this.current().value === '+') {
      const operator = this.consume().value;
      const operand = this.parseUnary();
      return { type: 'UnaryOp', operator, operand } as UnaryOpNode;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    switch (token.type) {
      case 'NUMBER': {
        this.consume();
        let value = parseFloat(token.value);
        if (token.value.endsWith('%')) {
          value = parseFloat(token.value.slice(0, -1)) / 100;
        }
        return { type: 'Number', value } as NumberNode;
      }

      case 'STRING': {
        this.consume();
        return { type: 'String', value: token.value } as StringNode;
      }

      case 'BOOLEAN': {
        this.consume();
        return { type: 'Boolean', value: token.value === 'TRUE' } as BooleanNode;
      }

      case 'FUNCTION': {
        return this.parseFunctionCall();
      }

      case 'CELL_REF': {
        return this.parseCellOrRange();
      }

      case 'LPAREN': {
        this.consume('LPAREN');
        const expr = this.parseExpression();
        this.consume('RPAREN');
        return expr;
      }

      case 'OPERATOR': {
        if (token.value === '{') {
          return this.parseArray();
        }
        throw new FormulaError('#ERROR!', `Unexpected operator: ${token.value}`);
      }

      default:
        throw new FormulaError('#ERROR!', `Unexpected token: ${token.type}`);
    }
  }

  private parseFunctionCall(): FunctionCallNode {
    const name = this.consume('FUNCTION').value;
    this.consume('LPAREN');

    const args: ASTNode[] = [];

    if (this.current().type !== 'RPAREN') {
      args.push(this.parseExpression());

      while (this.current().type === 'COMMA') {
        this.consume('COMMA');
        args.push(this.parseExpression());
      }
    }

    this.consume('RPAREN');

    return { type: 'FunctionCall', name, args };
  }

  private parseCellOrRange(): ASTNode {
    const firstRef = this.consume('CELL_REF').value;

    // Check if this is a range
    if (this.current().type === 'COLON') {
      this.consume('COLON');
      const secondRef = this.consume('CELL_REF').value;

      return {
        type: 'RangeRef',
        start: parseCellRef(firstRef),
        end: parseCellRef(secondRef),
      } as RangeRefNode;
    }

    return {
      type: 'CellRef',
      ref: parseCellRef(firstRef),
    } as CellRefNode;
  }

  private parseArray(): ArrayNode {
    this.consume(); // Consume '{'
    const rows: ASTNode[][] = [];
    let currentRow: ASTNode[] = [];

    while (this.current().value !== '}') {
      if (this.current().value === ';') {
        rows.push(currentRow);
        currentRow = [];
        this.consume();
      } else if (this.current().type === 'COMMA') {
        this.consume();
      } else {
        currentRow.push(this.parseExpression());
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    this.consume(); // Consume '}'

    return { type: 'Array', elements: rows };
  }
}

// Export a simple parse function
export function parseFormula(formula: string): ASTNode {
  const parser = new Parser();
  return parser.parse(formula);
}
