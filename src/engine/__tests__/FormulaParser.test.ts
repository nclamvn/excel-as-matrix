import { describe, it, expect } from 'vitest';
import {
  Tokenizer,
  Parser,
  parseFormula,
  parseCellRef,
  colLetterToNumber,
  numberToColLetter,
} from '../FormulaParser';
import { FormulaError } from '../types';

describe('FormulaParser', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Column Conversion Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('colLetterToNumber', () => {
    it('should convert A to 0', () => {
      expect(colLetterToNumber('A')).toBe(0);
    });

    it('should convert B to 1', () => {
      expect(colLetterToNumber('B')).toBe(1);
    });

    it('should convert Z to 25', () => {
      expect(colLetterToNumber('Z')).toBe(25);
    });

    it('should convert AA to 26', () => {
      expect(colLetterToNumber('AA')).toBe(26);
    });

    it('should convert AB to 27', () => {
      expect(colLetterToNumber('AB')).toBe(27);
    });

    it('should convert AZ to 51', () => {
      expect(colLetterToNumber('AZ')).toBe(51);
    });

    it('should convert BA to 52', () => {
      expect(colLetterToNumber('BA')).toBe(52);
    });

    it('should convert ZZ to 701', () => {
      expect(colLetterToNumber('ZZ')).toBe(701);
    });

    it('should convert AAA to 702', () => {
      expect(colLetterToNumber('AAA')).toBe(702);
    });

    it('should handle lowercase letters', () => {
      expect(colLetterToNumber('a')).toBe(0);
      expect(colLetterToNumber('z')).toBe(25);
    });
  });

  describe('numberToColLetter', () => {
    it('should convert 0 to A', () => {
      expect(numberToColLetter(0)).toBe('A');
    });

    it('should convert 1 to B', () => {
      expect(numberToColLetter(1)).toBe('B');
    });

    it('should convert 25 to Z', () => {
      expect(numberToColLetter(25)).toBe('Z');
    });

    it('should convert 26 to AA', () => {
      expect(numberToColLetter(26)).toBe('AA');
    });

    it('should convert 27 to AB', () => {
      expect(numberToColLetter(27)).toBe('AB');
    });

    it('should convert 51 to AZ', () => {
      expect(numberToColLetter(51)).toBe('AZ');
    });

    it('should convert 701 to ZZ', () => {
      expect(numberToColLetter(701)).toBe('ZZ');
    });

    it('should convert 702 to AAA', () => {
      expect(numberToColLetter(702)).toBe('AAA');
    });

    it('should be inverse of colLetterToNumber', () => {
      for (let i = 0; i < 1000; i++) {
        expect(colLetterToNumber(numberToColLetter(i))).toBe(i);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cell Reference Parsing Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('parseCellRef', () => {
    it('should parse simple reference A1', () => {
      const ref = parseCellRef('A1');
      expect(ref.col).toBe(0);
      expect(ref.row).toBe(0);
      expect(ref.colAbsolute).toBe(false);
      expect(ref.rowAbsolute).toBe(false);
    });

    it('should parse reference B2', () => {
      const ref = parseCellRef('B2');
      expect(ref.col).toBe(1);
      expect(ref.row).toBe(1);
    });

    it('should parse reference Z100', () => {
      const ref = parseCellRef('Z100');
      expect(ref.col).toBe(25);
      expect(ref.row).toBe(99);
    });

    it('should parse reference AA1', () => {
      const ref = parseCellRef('AA1');
      expect(ref.col).toBe(26);
      expect(ref.row).toBe(0);
    });

    it('should parse absolute column $A1', () => {
      const ref = parseCellRef('$A1');
      expect(ref.col).toBe(0);
      expect(ref.colAbsolute).toBe(true);
      expect(ref.rowAbsolute).toBe(false);
    });

    it('should parse absolute row A$1', () => {
      const ref = parseCellRef('A$1');
      expect(ref.col).toBe(0);
      expect(ref.rowAbsolute).toBe(true);
      expect(ref.colAbsolute).toBe(false);
    });

    it('should parse fully absolute $A$1', () => {
      const ref = parseCellRef('$A$1');
      expect(ref.colAbsolute).toBe(true);
      expect(ref.rowAbsolute).toBe(true);
    });

    it('should parse sheet reference Sheet1!A1', () => {
      const ref = parseCellRef('Sheet1!A1');
      expect(ref.sheetName).toBe('Sheet1');
      expect(ref.col).toBe(0);
      expect(ref.row).toBe(0);
    });

    it('should parse quoted sheet reference', () => {
      const ref = parseCellRef("'My Sheet'!A1");
      expect(ref.sheetName).toBe('My Sheet');
      expect(ref.col).toBe(0);
    });

    it('should throw on invalid reference', () => {
      expect(() => parseCellRef('invalid')).toThrow(FormulaError);
    });

    it('should throw on empty reference', () => {
      expect(() => parseCellRef('')).toThrow(FormulaError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Tokenizer Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Tokenizer', () => {
    describe('Numbers', () => {
      it('should tokenize integer', () => {
        const tokenizer = new Tokenizer('=123');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '123' });
      });

      it('should tokenize decimal', () => {
        const tokenizer = new Tokenizer('=3.14');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '3.14' });
      });

      it('should tokenize scientific notation', () => {
        const tokenizer = new Tokenizer('=1e10');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '1e10' });
      });

      it('should tokenize negative exponent', () => {
        const tokenizer = new Tokenizer('=1e-5');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '1e-5' });
      });

      it('should tokenize percentage', () => {
        const tokenizer = new Tokenizer('=50%');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '50%' });
      });

      it('should tokenize leading decimal', () => {
        const tokenizer = new Tokenizer('=.5');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'NUMBER', value: '.5' });
      });
    });

    describe('Strings', () => {
      it('should tokenize simple string', () => {
        const tokenizer = new Tokenizer('="Hello"');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'Hello' });
      });

      it('should tokenize string with spaces', () => {
        const tokenizer = new Tokenizer('="Hello World"');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'Hello World' });
      });

      it('should tokenize escaped quotes', () => {
        const tokenizer = new Tokenizer('="Say ""Hello"""');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: 'Say "Hello"' });
      });

      it('should tokenize empty string', () => {
        const tokenizer = new Tokenizer('=""');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'STRING', value: '' });
      });
    });

    describe('Booleans', () => {
      it('should tokenize TRUE', () => {
        const tokenizer = new Tokenizer('=TRUE');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'TRUE' });
      });

      it('should tokenize FALSE', () => {
        const tokenizer = new Tokenizer('=FALSE');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'FALSE' });
      });

      it('should tokenize lowercase true as boolean', () => {
        const tokenizer = new Tokenizer('=true');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'BOOLEAN', value: 'TRUE' });
      });
    });

    describe('Cell References', () => {
      it('should tokenize simple cell reference', () => {
        const tokenizer = new Tokenizer('=A1');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'CELL_REF', value: 'A1' });
      });

      it('should tokenize multi-letter column', () => {
        const tokenizer = new Tokenizer('=AA100');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'CELL_REF', value: 'AA100' });
      });

      it('should tokenize absolute reference', () => {
        const tokenizer = new Tokenizer('=$A$1');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'CELL_REF', value: '$A$1' });
      });

      it('should tokenize sheet reference', () => {
        const tokenizer = new Tokenizer('=Sheet1!A1');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'CELL_REF', value: 'Sheet1!A1' });
      });
    });

    describe('Functions', () => {
      it('should tokenize function name', () => {
        const tokenizer = new Tokenizer('=SUM(');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'FUNCTION', value: 'SUM' });
      });

      it('should tokenize function in lowercase as uppercase', () => {
        const tokenizer = new Tokenizer('=sum(');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'FUNCTION', value: 'SUM' });
      });

      it('should tokenize function with underscores', () => {
        const tokenizer = new Tokenizer('=MODE_SNGL(');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'FUNCTION', value: 'MODE_SNGL' });
      });
    });

    describe('Operators', () => {
      it('should tokenize arithmetic operators', () => {
        const tokenizer = new Tokenizer('=+-*/%^&');
        const tokens = tokenizer.tokenize();
        expect(tokens.map((t) => t.value)).toEqual(['+', '-', '*', '/', '%', '^', '&', '']);
      });

      it('should tokenize comparison operators', () => {
        const tokenizer = new Tokenizer('=<><=>=');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'OPERATOR', value: '<>' });
        expect(tokens[1]).toMatchObject({ type: 'OPERATOR', value: '<=' });
        expect(tokens[2]).toMatchObject({ type: 'OPERATOR', value: '>=' });
      });

      it('should tokenize equals', () => {
        const tokenizer = new Tokenizer('=1=1');
        const tokens = tokenizer.tokenize();
        expect(tokens[1]).toMatchObject({ type: 'OPERATOR', value: '=' });
      });
    });

    describe('Punctuation', () => {
      it('should tokenize parentheses', () => {
        const tokenizer = new Tokenizer('=()');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'LPAREN' });
        expect(tokens[1]).toMatchObject({ type: 'RPAREN' });
      });

      it('should tokenize comma', () => {
        const tokenizer = new Tokenizer('=,');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'COMMA' });
      });

      it('should tokenize colon', () => {
        const tokenizer = new Tokenizer('=:');
        const tokens = tokenizer.tokenize();
        expect(tokens[0]).toMatchObject({ type: 'COLON' });
      });
    });

    describe('Whitespace', () => {
      it('should skip whitespace', () => {
        const tokenizer = new Tokenizer('= 1 + 2 ');
        const tokens = tokenizer.tokenize();
        expect(tokens.filter((t) => t.type !== 'EOF').length).toBe(3);
      });

      it('should preserve position after whitespace', () => {
        const tokenizer = new Tokenizer('=   1');
        const tokens = tokenizer.tokenize();
        expect(tokens[0].position).toBe(4);
      });
    });

    describe('Complex Expressions', () => {
      it('should tokenize complete formula', () => {
        const tokenizer = new Tokenizer('=SUM(A1:B10)+IF(C1>0,100,0)');
        const tokens = tokenizer.tokenize();
        expect(tokens.map((t) => t.value)).toEqual([
          'SUM', '(', 'A1', ':', 'B10', ')', '+', 'IF', '(',
          'C1', '>', '0', ',', '100', ',', '0', ')', '',
        ]);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Parser Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Parser', () => {
    describe('Literals', () => {
      it('should parse number', () => {
        const ast = parseFormula('=42');
        expect(ast).toMatchObject({ type: 'Number', value: 42 });
      });

      it('should parse decimal', () => {
        const ast = parseFormula('=3.14');
        expect(ast).toMatchObject({ type: 'Number', value: 3.14 });
      });

      it('should parse percentage as decimal', () => {
        const ast = parseFormula('=50%');
        expect(ast).toMatchObject({ type: 'Number', value: 0.5 });
      });

      it('should parse string', () => {
        const ast = parseFormula('="Hello"');
        expect(ast).toMatchObject({ type: 'String', value: 'Hello' });
      });

      it('should parse TRUE', () => {
        const ast = parseFormula('=TRUE');
        expect(ast).toMatchObject({ type: 'Boolean', value: true });
      });

      it('should parse FALSE', () => {
        const ast = parseFormula('=FALSE');
        expect(ast).toMatchObject({ type: 'Boolean', value: false });
      });
    });

    describe('Cell References', () => {
      it('should parse cell reference', () => {
        const ast = parseFormula('=A1');
        expect(ast.type).toBe('CellRef');
        expect((ast as any).ref.col).toBe(0);
        expect((ast as any).ref.row).toBe(0);
      });

      it('should parse absolute reference', () => {
        const ast = parseFormula('=$A$1');
        expect((ast as any).ref.colAbsolute).toBe(true);
        expect((ast as any).ref.rowAbsolute).toBe(true);
      });

      it('should parse range reference', () => {
        const ast = parseFormula('=A1:B10');
        expect(ast.type).toBe('RangeRef');
        expect((ast as any).start.col).toBe(0);
        expect((ast as any).end.col).toBe(1);
      });
    });

    describe('Binary Operations', () => {
      it('should parse addition', () => {
        const ast = parseFormula('=1+2');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '+',
          left: { type: 'Number', value: 1 },
          right: { type: 'Number', value: 2 },
        });
      });

      it('should parse subtraction', () => {
        const ast = parseFormula('=5-3');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '-',
        });
      });

      it('should parse multiplication', () => {
        const ast = parseFormula('=2*3');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '*',
        });
      });

      it('should parse division', () => {
        const ast = parseFormula('=6/2');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '/',
        });
      });

      it('should parse exponentiation', () => {
        const ast = parseFormula('=2^3');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '^',
        });
      });

      it('should parse string concatenation', () => {
        const ast = parseFormula('="A"&"B"');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '&',
        });
      });

      it('should respect operator precedence', () => {
        const ast = parseFormula('=1+2*3');
        expect(ast.type).toBe('BinaryOp');
        expect((ast as any).operator).toBe('+');
        expect((ast as any).right.operator).toBe('*');
      });
    });

    describe('Comparison Operations', () => {
      it('should parse equals', () => {
        const ast = parseFormula('=1=1');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '=',
        });
      });

      it('should parse not equals', () => {
        const ast = parseFormula('=1<>2');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '<>',
        });
      });

      it('should parse less than', () => {
        const ast = parseFormula('=1<2');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '<',
        });
      });

      it('should parse greater than', () => {
        const ast = parseFormula('=2>1');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '>',
        });
      });

      it('should parse less than or equal', () => {
        const ast = parseFormula('=1<=2');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '<=',
        });
      });

      it('should parse greater than or equal', () => {
        const ast = parseFormula('=2>=1');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '>=',
        });
      });
    });

    describe('Unary Operations', () => {
      it('should parse unary minus', () => {
        const ast = parseFormula('=-5');
        expect(ast).toMatchObject({
          type: 'UnaryOp',
          operator: '-',
          operand: { type: 'Number', value: 5 },
        });
      });

      it('should parse unary plus', () => {
        const ast = parseFormula('=+5');
        expect(ast).toMatchObject({
          type: 'UnaryOp',
          operator: '+',
        });
      });

      it('should parse double negative', () => {
        const ast = parseFormula('=--5');
        expect(ast.type).toBe('UnaryOp');
        expect((ast as any).operand.type).toBe('UnaryOp');
      });
    });

    describe('Parentheses', () => {
      it('should parse parenthesized expression', () => {
        const ast = parseFormula('=(1+2)');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '+',
        });
      });

      it('should respect parentheses in precedence', () => {
        const ast = parseFormula('=(1+2)*3');
        expect(ast.type).toBe('BinaryOp');
        expect((ast as any).operator).toBe('*');
        expect((ast as any).left.operator).toBe('+');
      });

      it('should handle nested parentheses', () => {
        const ast = parseFormula('=((1+2))');
        expect(ast).toMatchObject({
          type: 'BinaryOp',
          operator: '+',
        });
      });
    });

    describe('Function Calls', () => {
      it('should parse function with no arguments', () => {
        const ast = parseFormula('=TODAY()');
        expect(ast).toMatchObject({
          type: 'FunctionCall',
          name: 'TODAY',
          args: [],
        });
      });

      it('should parse function with one argument', () => {
        const ast = parseFormula('=ABS(-5)');
        expect(ast).toMatchObject({
          type: 'FunctionCall',
          name: 'ABS',
        });
        expect((ast as any).args.length).toBe(1);
      });

      it('should parse function with multiple arguments', () => {
        const ast = parseFormula('=SUM(1,2,3)');
        expect(ast).toMatchObject({
          type: 'FunctionCall',
          name: 'SUM',
        });
        expect((ast as any).args.length).toBe(3);
      });

      it('should parse nested functions', () => {
        const ast = parseFormula('=SUM(ABS(-1),2)');
        expect(ast.type).toBe('FunctionCall');
        expect((ast as any).args[0].type).toBe('FunctionCall');
      });

      it('should parse function with range argument', () => {
        const ast = parseFormula('=SUM(A1:B10)');
        expect(ast).toMatchObject({
          type: 'FunctionCall',
          name: 'SUM',
        });
        expect((ast as any).args[0].type).toBe('RangeRef');
      });

      it('should parse function with expression argument', () => {
        const ast = parseFormula('=IF(1+1=2,TRUE,FALSE)');
        expect(ast.type).toBe('FunctionCall');
        expect((ast as any).args[0].type).toBe('BinaryOp');
      });
    });

    describe('Arrays', () => {
      it('should parse horizontal array', () => {
        const ast = parseFormula('={1,2,3}');
        expect(ast).toMatchObject({
          type: 'Array',
          elements: [[{ type: 'Number', value: 1 }, { type: 'Number', value: 2 }, { type: 'Number', value: 3 }]],
        });
      });

      it('should parse vertical array', () => {
        const ast = parseFormula('={1;2;3}');
        expect(ast).toMatchObject({
          type: 'Array',
          elements: [[{ type: 'Number', value: 1 }], [{ type: 'Number', value: 2 }], [{ type: 'Number', value: 3 }]],
        });
      });

      it('should parse 2D array', () => {
        const ast = parseFormula('={1,2;3,4}');
        expect((ast as any).elements.length).toBe(2);
        expect((ast as any).elements[0].length).toBe(2);
      });

      it('should parse array with strings', () => {
        const ast = parseFormula('={"a","b"}');
        expect((ast as any).elements[0][0].type).toBe('String');
      });
    });

    describe('Complex Expressions', () => {
      it('should parse formula with mixed elements', () => {
        const ast = parseFormula('=SUM(A1:B10)+IF(C1>0,100,0)*2');
        expect(ast.type).toBe('BinaryOp');
      });

      it('should parse deeply nested expression', () => {
        const ast = parseFormula('=IF(AND(OR(A1>0,B1>0),C1<100),D1*2,0)');
        expect(ast.type).toBe('FunctionCall');
        expect((ast as any).name).toBe('IF');
      });

      it('should parse formula with all operator types', () => {
        const ast = parseFormula('=-1+2*3/4^5%6&"x"=TRUE<>FALSE<1>2<=3>=4');
        expect(ast.type).toBe('BinaryOp');
      });
    });

    describe('Error Handling', () => {
      it('should throw on unclosed parenthesis', () => {
        expect(() => parseFormula('=(1+2')).toThrow();
      });

      it('should throw on unclosed string', () => {
        expect(() => parseFormula('="hello')).toThrow();
      });

      it('should throw on invalid character', () => {
        expect(() => parseFormula('=1@2')).toThrow();
      });

      it('should throw on empty expression', () => {
        expect(() => parseFormula('=')).toThrow();
      });

      it('should throw on trailing operator', () => {
        expect(() => parseFormula('=1+')).toThrow();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Integration Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Integration', () => {
    it('should parse real-world formulas correctly', () => {
      const formulas = [
        '=VLOOKUP(A1,B1:D10,2,FALSE)',
        '=SUMIF(A:A,">0",B:B)',
        '=INDEX(MATCH(A1,B1:B10,0),C1:C10)',
        '=IFERROR(A1/B1,"Error")',
        '=CONCATENATE(A1," - ",B1)',
        '=ROUND(AVERAGE(A1:A10),2)',
        '=IF(AND(A1>0,B1<100),C1*D1,0)',
        '=DATE(YEAR(A1),MONTH(A1)+1,1)-1',
      ];

      formulas.forEach((formula) => {
        expect(() => parseFormula(formula)).not.toThrow();
      });
    });

    it('should handle whitespace consistently', () => {
      const compact = parseFormula('=SUM(1,2,3)');
      const spaced = parseFormula('= SUM( 1 , 2 , 3 )');

      expect(compact.type).toBe(spaced.type);
      expect((compact as any).name).toBe((spaced as any).name);
      expect((compact as any).args.length).toBe((spaced as any).args.length);
    });

    it('should be case insensitive for functions', () => {
      const upper = parseFormula('=SUM(1,2)');
      const lower = parseFormula('=sum(1,2)');
      const mixed = parseFormula('=Sum(1,2)');

      expect((upper as any).name).toBe('SUM');
      expect((lower as any).name).toBe('SUM');
      expect((mixed as any).name).toBe('SUM');
    });
  });
});
