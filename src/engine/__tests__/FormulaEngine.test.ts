import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../FormulaEngine';
import { FormulaError, FormulaValue } from '../types';
import formulaTestCases from '../../test/fixtures/formulas.json';

describe('FormulaEngine', () => {
  let engine: FormulaEngine;
  let mockDataProvider: CellDataProvider;

  beforeEach(() => {
    engine = new FormulaEngine();

    // Default mock data provider
    mockDataProvider = {
      getCellValue: vi.fn((sheetId: string, row: number, col: number) => {
        // Default: return row * 10 + col as value
        return row * 10 + col;
      }),
      getCellFormula: vi.fn(() => undefined),
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Basic Calculation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Basic Calculation', () => {
    it('should return non-formula text as-is', () => {
      const result = engine.calculate('Hello', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('Hello');
      expect(result.displayValue).toBe('Hello');
    });

    it('should return numbers as-is when not a formula', () => {
      const result = engine.calculate('42', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('42');
    });

    it('should calculate simple addition', () => {
      const result = engine.calculate('=1+2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(3);
      expect(result.displayValue).toBe('3');
    });

    it('should calculate simple subtraction', () => {
      const result = engine.calculate('=10-3', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(7);
    });

    it('should calculate simple multiplication', () => {
      const result = engine.calculate('=4*5', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(20);
    });

    it('should calculate simple division', () => {
      const result = engine.calculate('=20/4', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(5);
    });

    it('should calculate exponentiation', () => {
      const result = engine.calculate('=2^3', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(8);
    });

    it('should calculate modulo', () => {
      const result = engine.calculate('=10%3', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Order of Operations Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Order of Operations', () => {
    it('should respect multiplication before addition', () => {
      const result = engine.calculate('=2+3*4', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(14);
    });

    it('should respect division before subtraction', () => {
      const result = engine.calculate('=10-6/2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(7);
    });

    it('should respect parentheses', () => {
      const result = engine.calculate('=(2+3)*4', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(20);
    });

    it('should handle nested parentheses', () => {
      const result = engine.calculate('=((2+3)*4)/2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(10);
    });

    it('should handle complex expressions', () => {
      const result = engine.calculate('=2+3*4-6/2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(11);
    });

    it('should handle exponentiation with correct precedence', () => {
      const result = engine.calculate('=2*3^2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(18);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Unary Operators Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Unary Operators', () => {
    it('should handle unary minus', () => {
      const result = engine.calculate('=-5', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(-5);
    });

    it('should handle unary plus', () => {
      const result = engine.calculate('=+5', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(5);
    });

    it('should handle unary minus with expression', () => {
      const result = engine.calculate('=-5+10', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(5);
    });

    it('should handle double negative', () => {
      const result = engine.calculate('=--5', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(5);
    });

    it('should handle negative in multiplication', () => {
      const result = engine.calculate('=-3*2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(-6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cell Reference Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Cell References', () => {
    beforeEach(() => {
      mockDataProvider.getCellValue = vi.fn((sheetId: string, row: number, col: number) => {
        const data: Record<string, FormulaValue> = {
          'sheet1:0:0': 10,
          'sheet1:0:1': 20,
          'sheet1:1:0': 30,
          'sheet1:1:1': 40,
        };
        return data[`${sheetId}:${row}:${col}`] ?? null;
      });
    });

    it('should resolve simple cell reference A1', () => {
      const result = engine.calculate('=A1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(10);
    });

    it('should resolve cell reference B1', () => {
      const result = engine.calculate('=B1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(20);
    });

    it('should resolve cell reference A2', () => {
      const result = engine.calculate('=A2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(30);
    });

    it('should handle absolute column reference', () => {
      const result = engine.calculate('=$A1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(10);
    });

    it('should handle absolute row reference', () => {
      const result = engine.calculate('=A$1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(10);
    });

    it('should handle fully absolute reference', () => {
      const result = engine.calculate('=$A$1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(10);
    });

    it('should calculate with cell references', () => {
      const result = engine.calculate('=A1+B1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(30);
    });

    it('should handle cell references in complex expressions', () => {
      const result = engine.calculate('=A1*2+B1/2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(30);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Range Reference Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Range References', () => {
    beforeEach(() => {
      mockDataProvider.getCellValue = vi.fn((sheetId: string, row: number, col: number) => {
        return row * 10 + col + 1; // 1, 2, 11, 12, 21, 22, etc.
      });
    });

    it('should handle SUM with range', () => {
      const result = engine.calculate('=SUM(A1:A3)', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(33); // 1 + 11 + 21
    });

    it('should handle 2D range in SUM', () => {
      const result = engine.calculate('=SUM(A1:B2)', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(26); // 1 + 2 + 11 + 12
    });

    it('should track range dependencies', () => {
      const result = engine.calculate('=SUM(A1:B2)', 'sheet1', 5, 5, mockDataProvider);
      expect(result.dependencies.length).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Functions', () => {
    describe('SUM', () => {
      it('should sum numbers', () => {
        const result = engine.calculate('=SUM(1,2,3)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(6);
      });

      it('should sum with zero arguments', () => {
        const result = engine.calculate('=SUM()', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(0);
      });

      it('should handle negative numbers', () => {
        const result = engine.calculate('=SUM(1,-2,3)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(2);
      });
    });

    describe('AVERAGE', () => {
      it('should calculate average', () => {
        const result = engine.calculate('=AVERAGE(10,20,30)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(20);
      });

      it('should handle single value', () => {
        const result = engine.calculate('=AVERAGE(5)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(5);
      });
    });

    describe('IF', () => {
      it('should return true value when condition is true', () => {
        const result = engine.calculate('=IF(TRUE,"yes","no")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('yes');
      });

      it('should return false value when condition is false', () => {
        const result = engine.calculate('=IF(FALSE,"yes","no")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('no');
      });

      it('should evaluate numeric conditions', () => {
        const result = engine.calculate('=IF(1>0,"positive","negative")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('positive');
      });

      it('should handle nested IF', () => {
        const result = engine.calculate('=IF(1>2,"A",IF(2>1,"B","C"))', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('B');
      });
    });

    describe('MIN/MAX', () => {
      it('should find minimum', () => {
        const result = engine.calculate('=MIN(5,2,8,1,9)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(1);
      });

      it('should find maximum', () => {
        const result = engine.calculate('=MAX(5,2,8,1,9)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(9);
      });
    });

    describe('COUNT/COUNTA', () => {
      it('should count numbers', () => {
        const result = engine.calculate('=COUNT(1,2,"a",3)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3);
      });

      it('should count non-empty values', () => {
        const result = engine.calculate('=COUNTA(1,"a",TRUE)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3);
      });
    });

    describe('Text Functions', () => {
      it('should concatenate strings', () => {
        const result = engine.calculate('=CONCATENATE("Hello"," ","World")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('Hello World');
      });

      it('should convert to uppercase', () => {
        const result = engine.calculate('=UPPER("hello")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('HELLO');
      });

      it('should convert to lowercase', () => {
        const result = engine.calculate('=LOWER("HELLO")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('hello');
      });

      it('should get string length', () => {
        const result = engine.calculate('=LEN("Hello")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(5);
      });

      it('should extract left characters', () => {
        const result = engine.calculate('=LEFT("Hello",2)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('He');
      });

      it('should extract right characters', () => {
        const result = engine.calculate('=RIGHT("Hello",2)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('lo');
      });

      it('should extract middle characters', () => {
        const result = engine.calculate('=MID("Hello",2,3)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('ell');
      });
    });

    describe('Math Functions', () => {
      it('should calculate absolute value', () => {
        const result = engine.calculate('=ABS(-5)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(5);
      });

      it('should calculate square root', () => {
        const result = engine.calculate('=SQRT(16)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(4);
      });

      it('should calculate power', () => {
        const result = engine.calculate('=POWER(2,10)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(1024);
      });

      it('should round numbers', () => {
        const result = engine.calculate('=ROUND(3.14159,2)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3.14);
      });

      it('should round up', () => {
        const result = engine.calculate('=ROUNDUP(3.14,1)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3.2);
      });

      it('should round down', () => {
        const result = engine.calculate('=ROUNDDOWN(3.19,1)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3.1);
      });

      it('should truncate decimals', () => {
        const result = engine.calculate('=INT(3.9)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(3);
      });
    });

    describe('Logical Functions', () => {
      it('should evaluate AND', () => {
        const result = engine.calculate('=AND(TRUE,TRUE)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(true);
      });

      it('should evaluate AND with false', () => {
        const result = engine.calculate('=AND(TRUE,FALSE)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(false);
      });

      it('should evaluate OR', () => {
        const result = engine.calculate('=OR(FALSE,TRUE)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(true);
      });

      it('should evaluate NOT', () => {
        const result = engine.calculate('=NOT(FALSE)', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe(true);
      });

      it('should handle IFERROR', () => {
        const result = engine.calculate('=IFERROR(1/0,"Error")', 'sheet1', 0, 0, mockDataProvider);
        expect(result.value).toBe('Error');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Error Handling Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    it('should return #DIV/0! for division by zero', () => {
      const result = engine.calculate('=1/0', 'sheet1', 0, 0, mockDataProvider);
      expect(result.error).toBe('#DIV/0!');
    });

    it('should return #NAME? for unknown functions', () => {
      const result = engine.calculate('=UNKNOWN()', 'sheet1', 0, 0, mockDataProvider);
      expect(result.error).toBe('#NAME?');
    });

    it('should return #VALUE! for type errors', () => {
      const result = engine.calculate('="text"+1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.error).toBe('#VALUE!');
    });

    it('should propagate errors through calculations', () => {
      const result = engine.calculate('=1+1/0', 'sheet1', 0, 0, mockDataProvider);
      expect(result.error).toBe('#DIV/0!');
    });

    it('should return #ERROR! for syntax errors', () => {
      const result = engine.calculate('=1+', 'sheet1', 0, 0, mockDataProvider);
      expect(result.error).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Comparison Operators Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Comparison Operators', () => {
    it('should compare equal', () => {
      const result = engine.calculate('=1=1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare not equal', () => {
      const result = engine.calculate('=1<>2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare less than', () => {
      const result = engine.calculate('=1<2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare greater than', () => {
      const result = engine.calculate('=2>1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare less than or equal', () => {
      const result = engine.calculate('=1<=1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare greater than or equal', () => {
      const result = engine.calculate('=2>=1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });

    it('should compare strings', () => {
      const result = engine.calculate('="abc"="abc"', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // String Concatenation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('String Concatenation', () => {
    it('should concatenate strings with &', () => {
      const result = engine.calculate('="Hello"&" "&"World"', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('Hello World');
    });

    it('should concatenate string with number', () => {
      const result = engine.calculate('="Value: "&123', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('Value: 123');
    });

    it('should concatenate multiple values', () => {
      const result = engine.calculate('="A"&"B"&"C"', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('ABC');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Array Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Arrays', () => {
    it('should parse horizontal array', () => {
      const result = engine.calculate('={1,2,3}', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toEqual([[1, 2, 3]]);
    });

    it('should parse vertical array', () => {
      const result = engine.calculate('={1;2;3}', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toEqual([[1], [2], [3]]);
    });

    it('should parse 2D array', () => {
      const result = engine.calculate('={1,2;3,4}', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toEqual([[1, 2], [3, 4]]);
    });

    it('should use arrays in functions', () => {
      const result = engine.calculate('=SUM({1,2,3})', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Dependency Tracking Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Dependency Tracking', () => {
    it('should track cell dependencies', () => {
      const result = engine.calculate('=A1+B1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.dependencies).toContainEqual({ sheetId: 'sheet1', row: 0, col: 0 });
      expect(result.dependencies).toContainEqual({ sheetId: 'sheet1', row: 0, col: 1 });
    });

    it('should track range dependencies', () => {
      const result = engine.calculate('=SUM(A1:A3)', 'sheet1', 0, 0, mockDataProvider);
      expect(result.dependencies.length).toBe(3);
    });

    it('should get dependent cells', () => {
      // First calculate to establish dependency
      engine.calculate('=A1+1', 'sheet1', 0, 1, mockDataProvider);

      const dependents = engine.getDependentCells('sheet1', 0, 0);
      expect(dependents.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cache Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Caching', () => {
    it('should cache results', () => {
      engine.calculate('=1+1', 'sheet1', 0, 0, mockDataProvider);
      const cached = engine.getCachedResult('sheet1', 0, 0);
      expect(cached).toBeDefined();
      expect(cached?.value).toBe(2);
    });

    it('should invalidate cache when cell changes', () => {
      engine.calculate('=A1+1', 'sheet1', 0, 1, mockDataProvider);
      engine.invalidateCell('sheet1', 0, 0);
      const cached = engine.getCachedResult('sheet1', 0, 1);
      expect(cached).toBeUndefined();
    });

    it('should clear all caches', () => {
      engine.calculate('=1+1', 'sheet1', 0, 0, mockDataProvider);
      engine.clearCache();
      const cached = engine.getCachedResult('sheet1', 0, 0);
      expect(cached).toBeUndefined();
    });

    it('should provide cache statistics', () => {
      engine.calculate('=1+1', 'sheet1', 0, 0, mockDataProvider);
      const stats = engine.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cell Reference Helpers Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Cell Reference Helpers', () => {
    it('should generate A1 reference', () => {
      expect(engine.getCellReference(0, 0)).toBe('A1');
    });

    it('should generate Z1 reference', () => {
      expect(engine.getCellReference(0, 25)).toBe('Z1');
    });

    it('should generate AA1 reference', () => {
      expect(engine.getCellReference(0, 26)).toBe('AA1');
    });

    it('should parse cell key', () => {
      const parsed = engine.parseCellKey('sheet1:5:10');
      expect(parsed).toEqual({ sheetId: 'sheet1', row: 5, col: 10 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Display Value Formatting Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Display Value Formatting', () => {
    it('should format numbers without unnecessary decimals', () => {
      const result = engine.calculate('=10/2', 'sheet1', 0, 0, mockDataProvider);
      expect(result.displayValue).toBe('5');
    });

    it('should format boolean TRUE', () => {
      const result = engine.calculate('=TRUE', 'sheet1', 0, 0, mockDataProvider);
      expect(result.displayValue).toBe('TRUE');
    });

    it('should format boolean FALSE', () => {
      const result = engine.calculate('=FALSE', 'sheet1', 0, 0, mockDataProvider);
      expect(result.displayValue).toBe('FALSE');
    });

    it('should format errors', () => {
      const result = engine.calculate('=1/0', 'sheet1', 0, 0, mockDataProvider);
      expect(result.displayValue).toBe('#DIV/0!');
    });

    it('should format empty result', () => {
      mockDataProvider.getCellValue = vi.fn(() => null);
      const result = engine.calculate('=A1', 'sheet1', 0, 0, mockDataProvider);
      expect(result.displayValue).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Nested Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Nested Functions', () => {
    it('should evaluate nested SUM and IF', () => {
      const result = engine.calculate('=SUM(1,IF(TRUE,2,0),3)', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(6);
    });

    it('should evaluate nested AND inside IF', () => {
      const result = engine.calculate('=IF(AND(1>0,2>1),"yes","no")', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('yes');
    });

    it('should evaluate ROUND with SUM', () => {
      const result = engine.calculate('=ROUND(SUM(1.5,2.5),0)', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(4);
    });

    it('should evaluate deeply nested functions', () => {
      const result = engine.calculate('=IF(AND(OR(1>0,FALSE),NOT(FALSE)),"A","B")', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe('A');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Sheet Reference Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Sheet References', () => {
    beforeEach(() => {
      mockDataProvider.getCellValue = vi.fn((sheetId: string, row: number, col: number) => {
        const data: Record<string, FormulaValue> = {
          'Sheet1:0:0': 100,
          'Sheet2:0:0': 200,
        };
        return data[`${sheetId}:${row}:${col}`] ?? null;
      });
    });

    it('should handle cross-sheet reference', () => {
      const result = engine.calculate('=Sheet2!A1', 'Sheet1', 0, 0, mockDataProvider);
      expect(mockDataProvider.getCellValue).toHaveBeenCalledWith('Sheet2', 0, 0);
    });

    it('should handle quoted sheet names', () => {
      mockDataProvider.getCellValue = vi.fn((sheetId: string) => {
        if (sheetId === 'My Sheet') return 500;
        return null;
      });
      const result = engine.calculate("='My Sheet'!A1", 'Sheet1', 0, 0, mockDataProvider);
      expect(mockDataProvider.getCellValue).toHaveBeenCalledWith('My Sheet', 0, 0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Percentage Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Percentages', () => {
    it('should handle percentage literals', () => {
      const result = engine.calculate('=50%', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(0.5);
    });

    it('should handle percentage in calculation', () => {
      const result = engine.calculate('=100*50%', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(50);
    });

    it('should handle multiple percentages', () => {
      const result = engine.calculate('=50%+25%', 'sheet1', 0, 0, mockDataProvider);
      expect(result.value).toBe(0.75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Test Fixture Tests (from formulas.json)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Formula Test Cases (from fixtures)', () => {
    describe('Arithmetic', () => {
      formulaTestCases.arithmetic.forEach((testCase) => {
        it(`should calculate ${testCase.formula} = ${testCase.expected}`, () => {
          const result = engine.calculate(testCase.formula, 'sheet1', 0, 0, mockDataProvider);
          if (typeof testCase.expected === 'number') {
            expect(result.value).toBeCloseTo(testCase.expected, 10);
          } else {
            expect(result.value).toBe(testCase.expected);
          }
        });
      });
    });

    describe('Comparison', () => {
      formulaTestCases.comparison.forEach((testCase) => {
        it(`should evaluate ${testCase.formula} = ${testCase.expected}`, () => {
          const result = engine.calculate(testCase.formula, 'sheet1', 0, 0, mockDataProvider);
          expect(result.value).toBe(testCase.expected);
        });
      });
    });

    describe('Logical', () => {
      formulaTestCases.logical.forEach((testCase) => {
        it(`should evaluate ${testCase.formula} = ${testCase.expected}`, () => {
          const result = engine.calculate(testCase.formula, 'sheet1', 0, 0, mockDataProvider);
          expect(result.value).toBe(testCase.expected);
        });
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Performance Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Performance', () => {
    it('should calculate 1000 formulas in under 1 second', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        engine.calculate(`=${i}+${i}`, 'sheet1', i, 0, mockDataProvider);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should handle complex formulas efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        engine.calculate(
          '=SUM(1,2,3,4,5,6,7,8,9,10)*AVERAGE(1,2,3,4,5)+IF(TRUE,10,0)',
          'sheet1',
          i,
          0,
          mockDataProvider
        );
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });
  });
});
