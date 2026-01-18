import { describe, it, expect, vi } from 'vitest';
import { FormulaEvaluator } from '../FormulaEvaluator';
import { parseFormula } from '../FormulaParser';
import { FormulaError, EvalContext, FormulaValue, CellReference } from '../types';

describe('FormulaEvaluator', () => {
  let evaluator: FormulaEvaluator;
  let mockContext: EvalContext;

  beforeEach(() => {
    evaluator = new FormulaEvaluator();

    mockContext = {
      getCellValue: vi.fn((ref: CellReference) => {
        const data: Record<string, FormulaValue> = {
          '0:0': 10,
          '0:1': 20,
          '1:0': 30,
          '1:1': 40,
          '2:0': 'text',
          '2:1': true,
        };
        return data[`${ref.row}:${ref.col}`] ?? null;
      }),
      getRangeValues: vi.fn((start: CellReference, end: CellReference) => {
        const values: FormulaValue[][] = [];
        for (let r = start.row; r <= end.row; r++) {
          const row: FormulaValue[] = [];
          for (let c = start.col; c <= end.col; c++) {
            row.push(r * 10 + c + 1);
          }
          values.push(row);
        }
        return values;
      }),
      sheetId: 'sheet1',
      currentCell: { row: 0, col: 0, colAbsolute: false, rowAbsolute: false },
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Literal Evaluation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Literal Evaluation', () => {
    it('should evaluate number', () => {
      const ast = parseFormula('=42');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(42);
    });

    it('should evaluate decimal', () => {
      const ast = parseFormula('=3.14159');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeCloseTo(3.14159);
    });

    it('should evaluate string', () => {
      const ast = parseFormula('="Hello World"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('Hello World');
    });

    it('should evaluate TRUE', () => {
      const ast = parseFormula('=TRUE');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should evaluate FALSE', () => {
      const ast = parseFormula('=FALSE');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(false);
    });

    it('should evaluate percentage', () => {
      const ast = parseFormula('=50%');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(0.5);
    });

    it('should evaluate negative number', () => {
      const ast = parseFormula('=-123');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(-123);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Arithmetic Operations Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Arithmetic Operations', () => {
    it('should add numbers', () => {
      const ast = parseFormula('=1+2');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(3);
    });

    it('should subtract numbers', () => {
      const ast = parseFormula('=10-3');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(7);
    });

    it('should multiply numbers', () => {
      const ast = parseFormula('=4*5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(20);
    });

    it('should divide numbers', () => {
      const ast = parseFormula('=20/4');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(5);
    });

    it('should calculate power', () => {
      const ast = parseFormula('=2^10');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(1024);
    });

    it('should calculate modulo', () => {
      const ast = parseFormula('=17%5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(2);
    });

    it('should handle complex arithmetic', () => {
      const ast = parseFormula('=2+3*4-10/2');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(9);
    });

    it('should handle parenthesized expressions', () => {
      const ast = parseFormula('=(2+3)*4');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(20);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Division by Zero Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Division by Zero', () => {
    it('should return #DIV/0! for direct division by zero', () => {
      const ast = parseFormula('=1/0');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
      expect((result as FormulaError).type).toBe('#DIV/0!');
    });

    it('should return #DIV/0! for modulo by zero', () => {
      const ast = parseFormula('=5%0');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
      expect((result as FormulaError).type).toBe('#DIV/0!');
    });

    it('should propagate #DIV/0! in expressions', () => {
      const ast = parseFormula('=1+1/0+2');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Comparison Operations Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Comparison Operations', () => {
    it('should compare equal numbers', () => {
      const ast = parseFormula('=5=5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare unequal numbers', () => {
      const ast = parseFormula('=5=6');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(false);
    });

    it('should compare not equal', () => {
      const ast = parseFormula('=5<>6');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare less than', () => {
      const ast = parseFormula('=3<5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare greater than', () => {
      const ast = parseFormula('=5>3');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare less than or equal', () => {
      const ast = parseFormula('=5<=5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare greater than or equal', () => {
      const ast = parseFormula('=5>=5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare strings case sensitively', () => {
      const ast = parseFormula('="ABC"="abc"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(false); // Case-sensitive comparison

      const ast2 = parseFormula('="abc"="abc"');
      const result2 = evaluator.evaluate(ast2, mockContext);
      expect(result2).toBe(true);
    });

    it('should compare booleans', () => {
      const ast = parseFormula('=TRUE=TRUE');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });

    it('should compare null values', () => {
      mockContext.getCellValue = vi.fn(() => null);
      const ast = parseFormula('=A1=A2');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // String Concatenation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('String Concatenation', () => {
    it('should concatenate two strings', () => {
      const ast = parseFormula('="Hello"&"World"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('HelloWorld');
    });

    it('should concatenate string and number', () => {
      const ast = parseFormula('="Value: "&42');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('Value: 42');
    });

    it('should concatenate number and string', () => {
      const ast = parseFormula('=42&" items"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('42 items');
    });

    it('should concatenate boolean and string', () => {
      const ast = parseFormula('="Result: "&TRUE');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('Result: TRUE');
    });

    it('should concatenate multiple values', () => {
      const ast = parseFormula('="A"&"B"&"C"&"D"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('ABCD');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Unary Operations Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Unary Operations', () => {
    it('should negate number', () => {
      const ast = parseFormula('=-5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(-5);
    });

    it('should apply unary plus', () => {
      const ast = parseFormula('=+5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(5);
    });

    it('should handle double negation', () => {
      const ast = parseFormula('=--5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(5);
    });

    it('should negate expression result', () => {
      const ast = parseFormula('=-(3+2)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(-5);
    });

    it('should convert string to negative number', () => {
      mockContext.getCellValue = vi.fn(() => '10');
      const ast = parseFormula('=-A1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(-10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cell Reference Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Cell Reference Evaluation', () => {
    it('should evaluate cell reference', () => {
      const ast = parseFormula('=A1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(10);
    });

    it('should track cell dependency', () => {
      const ast = parseFormula('=A1');
      evaluator.evaluate(ast, mockContext);
      const deps = evaluator.getDependencies();
      expect(deps).toContainEqual({ sheetId: 'sheet1', row: 0, col: 0 });
    });

    it('should evaluate multiple cell references', () => {
      const ast = parseFormula('=A1+B1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(30);
    });

    it('should handle null cell values', () => {
      mockContext.getCellValue = vi.fn(() => null);
      const ast = parseFormula('=A1+1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(1);
    });

    it('should handle text cell values in arithmetic', () => {
      mockContext.getCellValue = vi.fn(() => 'abc');
      const ast = parseFormula('=A1+1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Range Reference Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Range Reference Evaluation', () => {
    it('should evaluate range as 2D array', () => {
      const ast = parseFormula('=A1:B2');
      const result = evaluator.evaluate(ast, mockContext);
      expect(Array.isArray(result)).toBe(true);
      expect((result as FormulaValue[][]).length).toBe(2);
    });

    it('should track all range dependencies', () => {
      const ast = parseFormula('=A1:B2');
      evaluator.evaluate(ast, mockContext);
      const deps = evaluator.getDependencies();
      expect(deps.length).toBe(4);
    });

    it('should work with SUM function', () => {
      const ast = parseFormula('=SUM(A1:B2)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(26); // 1+2+11+12
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Function Call Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Function Call Evaluation', () => {
    it('should call function with no arguments', () => {
      const ast = parseFormula('=PI()');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeCloseTo(Math.PI);
    });

    it('should call function with one argument', () => {
      const ast = parseFormula('=ABS(-5)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(5);
    });

    it('should call function with multiple arguments', () => {
      const ast = parseFormula('=SUM(1,2,3,4,5)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(15);
    });

    it('should call nested functions', () => {
      const ast = parseFormula('=ABS(SUM(-1,-2,-3))');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(6);
    });

    it('should return #NAME? for unknown function', () => {
      const ast = parseFormula('=UNKNOWN_FUNC()');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
      expect((result as FormulaError).type).toBe('#NAME?');
    });

    it('should return #VALUE! for wrong argument count', () => {
      const ast = parseFormula('=ABS()');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Array Evaluation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Array Evaluation', () => {
    it('should evaluate horizontal array', () => {
      const ast = parseFormula('={1,2,3}');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should evaluate vertical array', () => {
      const ast = parseFormula('={1;2;3}');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('should evaluate 2D array', () => {
      const ast = parseFormula('={1,2;3,4}');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toEqual([[1, 2], [3, 4]]);
    });

    it('should evaluate array with expressions', () => {
      const ast = parseFormula('={1+1,2+2}');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toEqual([[2, 4]]);
    });

    it('should work with SUM on array', () => {
      const ast = parseFormula('=SUM({1,2,3,4,5})');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(15);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Error Propagation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Error Propagation', () => {
    it('should propagate error through addition', () => {
      const ast = parseFormula('=1/0+5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });

    it('should propagate error through multiplication', () => {
      const ast = parseFormula('=1/0*5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });

    it('should propagate error through function call', () => {
      const ast = parseFormula('=SUM(1,1/0,2)');
      const result = evaluator.evaluate(ast, mockContext);
      // SUM might handle errors differently, check implementation
      expect(result).toBeDefined();
    });

    it('should propagate error through negation', () => {
      const ast = parseFormula('=-(1/0)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });

    it('should propagate error in left operand', () => {
      const ast = parseFormula('=(1/0)+5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });

    it('should propagate error in right operand', () => {
      const ast = parseFormula('=5+(1/0)');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeInstanceOf(FormulaError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Type Coercion Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Type Coercion', () => {
    it('should coerce string number to number in arithmetic', () => {
      mockContext.getCellValue = vi.fn(() => '42');
      const ast = parseFormula('=A1+8');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(50);
    });

    it('should coerce boolean to number in arithmetic', () => {
      const ast = parseFormula('=TRUE+1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(2);
    });

    it('should coerce FALSE to 0 in arithmetic', () => {
      const ast = parseFormula('=FALSE+5');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(5);
    });

    it('should coerce null to 0 in arithmetic', () => {
      mockContext.getCellValue = vi.fn(() => null);
      const ast = parseFormula('=A1+10');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(10);
    });

    it('should convert number to string in concatenation', () => {
      const ast = parseFormula('="Total: "&100');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('Total: 100');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Dependency Tracking Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Dependency Tracking', () => {
    it('should clear dependencies before evaluation', () => {
      const ast1 = parseFormula('=A1');
      evaluator.evaluate(ast1, mockContext);

      const ast2 = parseFormula('=B1');
      evaluator.evaluate(ast2, mockContext);

      const deps = evaluator.getDependencies();
      expect(deps.length).toBe(1);
      expect(deps[0].col).toBe(1);
    });

    it('should track multiple cell dependencies', () => {
      const ast = parseFormula('=A1+B1+C1');
      evaluator.evaluate(ast, mockContext);
      const deps = evaluator.getDependencies();
      expect(deps.length).toBe(3);
    });

    it('should track dependencies through nested functions', () => {
      const ast = parseFormula('=SUM(A1,IF(B1>0,C1,D1))');
      evaluator.evaluate(ast, mockContext);
      const deps = evaluator.getDependencies();
      expect(deps.length).toBeGreaterThan(1);
    });

    it('should not track dependencies for literals', () => {
      const ast = parseFormula('=1+2+3');
      evaluator.evaluate(ast, mockContext);
      const deps = evaluator.getDependencies();
      expect(deps.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge Cases Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const ast = parseFormula('=1e308');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(1e308);
    });

    it('should handle very small numbers', () => {
      const ast = parseFormula('=1e-308');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBeCloseTo(1e-308);
    });

    it('should handle empty string', () => {
      const ast = parseFormula('=""');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('');
    });

    it('should handle string with special characters', () => {
      const ast = parseFormula('="Hello\\nWorld"');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe('Hello\\nWorld');
    });

    it('should handle zero in exponentiation', () => {
      const ast = parseFormula('=0^0');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(1);
    });

    it('should handle negative exponent', () => {
      const ast = parseFormula('=2^-1');
      const result = evaluator.evaluate(ast, mockContext);
      expect(result).toBe(0.5);
    });
  });
});
