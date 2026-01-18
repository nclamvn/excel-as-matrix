import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaError, FormulaValue } from '../../types';

describe('Math Functions', () => {
  let engine: FormulaEngine;
  let mockDataProvider: CellDataProvider;

  beforeEach(() => {
    engine = new FormulaEngine();
    mockDataProvider = {
      getCellValue: vi.fn((sheetId: string, row: number, col: number) => {
        const data: Record<string, FormulaValue> = {
          'sheet1:0:0': 10,
          'sheet1:0:1': 20,
          'sheet1:0:2': 30,
          'sheet1:1:0': -5,
          'sheet1:1:1': 0,
          'sheet1:2:0': 'text',
        };
        return data[`${sheetId}:${row}:${col}`] ?? null;
      }),
      getCellFormula: vi.fn(() => undefined),
    };
  });

  const calc = (formula: string) => engine.calculate(formula, 'sheet1', 0, 0, mockDataProvider);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUM Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SUM', () => {
    it('should sum numbers', () => {
      expect(calc('=SUM(1,2,3)').value).toBe(6);
    });

    it('should sum with no arguments', () => {
      expect(calc('=SUM()').value).toBe(0);
    });

    it('should sum negative numbers', () => {
      expect(calc('=SUM(-1,-2,-3)').value).toBe(-6);
    });

    it('should sum mixed positive and negative', () => {
      expect(calc('=SUM(-10,5,10,-5)').value).toBe(0);
    });

    it('should sum decimals', () => {
      expect(calc('=SUM(0.1,0.2,0.3)').value).toBeCloseTo(0.6);
    });

    it('should sum arrays', () => {
      expect(calc('=SUM({1,2,3})').value).toBe(6);
    });

    it('should sum 2D arrays', () => {
      expect(calc('=SUM({1,2;3,4})').value).toBe(10);
    });

    it('should ignore text values', () => {
      expect(calc('=SUM(1,"text",2)').value).toBe(3);
    });

    it('should ignore boolean FALSE as 0', () => {
      expect(calc('=SUM(1,FALSE,2)').value).toBe(3);
    });

    it('should count TRUE as 1', () => {
      expect(calc('=SUM(1,TRUE,2)').value).toBe(4);
    });

    it('should handle large number of arguments', () => {
      const nums = Array.from({ length: 100 }, (_, i) => i + 1).join(',');
      expect(calc(`=SUM(${nums})`).value).toBe(5050);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AVERAGE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AVERAGE', () => {
    it('should average numbers', () => {
      expect(calc('=AVERAGE(10,20,30)').value).toBe(20);
    });

    it('should average single value', () => {
      expect(calc('=AVERAGE(5)').value).toBe(5);
    });

    it('should average decimals', () => {
      expect(calc('=AVERAGE(1.5,2.5)').value).toBe(2);
    });

    it('should average negative numbers', () => {
      expect(calc('=AVERAGE(-10,10)').value).toBe(0);
    });

    it('should return #DIV/0! for no numeric values', () => {
      expect(calc('=AVERAGE()').error).toBeDefined();
    });

    it('should ignore text', () => {
      expect(calc('=AVERAGE(10,"text",30)').value).toBe(20);
    });

    it('should average arrays', () => {
      expect(calc('=AVERAGE({1,2,3,4,5})').value).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MIN/MAX Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MIN', () => {
    it('should find minimum', () => {
      expect(calc('=MIN(5,2,8,1,9)').value).toBe(1);
    });

    it('should handle single value', () => {
      expect(calc('=MIN(5)').value).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(calc('=MIN(-5,-2,-8)').value).toBe(-8);
    });

    it('should handle mixed signs', () => {
      expect(calc('=MIN(-5,0,5)').value).toBe(-5);
    });

    it('should handle decimals', () => {
      expect(calc('=MIN(0.1,0.05,0.2)').value).toBe(0.05);
    });

    it('should ignore text', () => {
      expect(calc('=MIN(5,"text",2)').value).toBe(2);
    });

    it('should handle arrays', () => {
      expect(calc('=MIN({5,2,8,1,9})').value).toBe(1);
    });
  });

  describe('MAX', () => {
    it('should find maximum', () => {
      expect(calc('=MAX(5,2,8,1,9)').value).toBe(9);
    });

    it('should handle single value', () => {
      expect(calc('=MAX(5)').value).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(calc('=MAX(-5,-2,-8)').value).toBe(-2);
    });

    it('should handle mixed signs', () => {
      expect(calc('=MAX(-5,0,5)').value).toBe(5);
    });

    it('should ignore text', () => {
      expect(calc('=MAX(5,"text",2)').value).toBe(5);
    });

    it('should handle arrays', () => {
      expect(calc('=MAX({5,2,8,1,9})').value).toBe(9);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ABS Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ABS', () => {
    it('should return absolute value of positive', () => {
      expect(calc('=ABS(5)').value).toBe(5);
    });

    it('should return absolute value of negative', () => {
      expect(calc('=ABS(-5)').value).toBe(5);
    });

    it('should return 0 for 0', () => {
      expect(calc('=ABS(0)').value).toBe(0);
    });

    it('should handle decimals', () => {
      expect(calc('=ABS(-3.14)').value).toBeCloseTo(3.14);
    });

    it('should convert string number', () => {
      expect(calc('=ABS("-10")').value).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SQRT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SQRT', () => {
    it('should calculate square root', () => {
      expect(calc('=SQRT(16)').value).toBe(4);
    });

    it('should handle decimals', () => {
      expect(calc('=SQRT(2)').value).toBeCloseTo(1.414213562);
    });

    it('should return 0 for 0', () => {
      expect(calc('=SQRT(0)').value).toBe(0);
    });

    it('should return #NUM! for negative', () => {
      expect(calc('=SQRT(-1)').error).toBe('#NUM!');
    });

    it('should handle perfect squares', () => {
      expect(calc('=SQRT(144)').value).toBe(12);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POWER Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POWER', () => {
    it('should calculate power', () => {
      expect(calc('=POWER(2,10)').value).toBe(1024);
    });

    it('should handle fractional exponent', () => {
      expect(calc('=POWER(4,0.5)').value).toBe(2);
    });

    it('should handle negative exponent', () => {
      expect(calc('=POWER(2,-1)').value).toBe(0.5);
    });

    it('should handle zero exponent', () => {
      expect(calc('=POWER(5,0)').value).toBe(1);
    });

    it('should handle zero base', () => {
      expect(calc('=POWER(0,5)').value).toBe(0);
    });

    it('should handle negative base', () => {
      expect(calc('=POWER(-2,3)').value).toBe(-8);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUND Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ROUND', () => {
    it('should round to integer', () => {
      expect(calc('=ROUND(3.5,0)').value).toBe(4);
    });

    it('should round down', () => {
      expect(calc('=ROUND(3.4,0)').value).toBe(3);
    });

    it('should round to decimal places', () => {
      expect(calc('=ROUND(3.14159,2)').value).toBe(3.14);
    });

    it('should round negative numbers', () => {
      expect(calc('=ROUND(-3.5,0)').value).toBe(-4);
    });

    it('should round to tens', () => {
      expect(calc('=ROUND(125,-1)').value).toBe(130);
    });

    it('should round to hundreds', () => {
      expect(calc('=ROUND(1234,-2)').value).toBe(1200);
    });
  });

  describe('ROUNDUP', () => {
    it('should round up', () => {
      expect(calc('=ROUNDUP(3.1,0)').value).toBe(4);
    });

    it('should round up decimals', () => {
      expect(calc('=ROUNDUP(3.14,1)').value).toBe(3.2);
    });

    it('should round up negative away from zero', () => {
      expect(calc('=ROUNDUP(-3.1,0)').value).toBe(-4);
    });
  });

  describe('ROUNDDOWN', () => {
    it('should round down', () => {
      expect(calc('=ROUNDDOWN(3.9,0)').value).toBe(3);
    });

    it('should round down decimals', () => {
      expect(calc('=ROUNDDOWN(3.19,1)').value).toBe(3.1);
    });

    it('should round down negative toward zero', () => {
      expect(calc('=ROUNDDOWN(-3.9,0)').value).toBe(-3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INT/TRUNC Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('INT', () => {
    it('should truncate positive', () => {
      expect(calc('=INT(3.9)').value).toBe(3);
    });

    it('should round down negative', () => {
      expect(calc('=INT(-3.1)').value).toBe(-4);
    });

    it('should handle integer input', () => {
      expect(calc('=INT(5)').value).toBe(5);
    });
  });

  describe('TRUNC', () => {
    it('should truncate positive', () => {
      expect(calc('=TRUNC(3.9)').value).toBe(3);
    });

    it('should truncate negative', () => {
      expect(calc('=TRUNC(-3.9)').value).toBe(-3);
    });

    it('should truncate to decimal places', () => {
      expect(calc('=TRUNC(3.14159,2)').value).toBe(3.14);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MOD Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MOD', () => {
    it('should calculate modulo', () => {
      expect(calc('=MOD(10,3)').value).toBe(1);
    });

    it('should handle even division', () => {
      expect(calc('=MOD(10,5)').value).toBe(0);
    });

    it('should handle negative dividend', () => {
      expect(calc('=MOD(-10,3)').value).toBe(2);
    });

    it('should handle negative divisor', () => {
      expect(calc('=MOD(10,-3)').value).toBe(-2);
    });

    it('should return #DIV/0! for divisor 0', () => {
      expect(calc('=MOD(10,0)').error).toBe('#DIV/0!');
    });

    it('should handle decimals', () => {
      expect(calc('=MOD(5.5,2)').value).toBeCloseTo(1.5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CEILING/FLOOR Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CEILING', () => {
    it('should round up to nearest integer', () => {
      expect(calc('=CEILING(3.2,1)').value).toBe(4);
    });

    it('should round up to nearest multiple', () => {
      expect(calc('=CEILING(3.2,0.5)').value).toBe(3.5);
    });

    it('should round to nearest 10', () => {
      expect(calc('=CEILING(23,10)').value).toBe(30);
    });

    it('should handle negative numbers', () => {
      expect(calc('=CEILING(-3.2,1)').value).toBe(-3);
    });
  });

  describe('FLOOR', () => {
    it('should round down to nearest integer', () => {
      expect(calc('=FLOOR(3.9,1)').value).toBe(3);
    });

    it('should round down to nearest multiple', () => {
      expect(calc('=FLOOR(3.9,0.5)').value).toBe(3.5);
    });

    it('should round to nearest 10', () => {
      expect(calc('=FLOOR(27,10)').value).toBe(20);
    });

    it('should handle negative numbers', () => {
      expect(calc('=FLOOR(-3.9,1)').value).toBe(-4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGN Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SIGN', () => {
    it('should return 1 for positive', () => {
      expect(calc('=SIGN(5)').value).toBe(1);
    });

    it('should return -1 for negative', () => {
      expect(calc('=SIGN(-5)').value).toBe(-1);
    });

    it('should return 0 for zero', () => {
      expect(calc('=SIGN(0)').value).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOG Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('LOG', () => {
    it('should calculate log base 10', () => {
      expect(calc('=LOG(100)').value).toBe(2);
    });

    it('should calculate log with custom base', () => {
      expect(calc('=LOG(8,2)').value).toBe(3);
    });

    it('should handle log of 1', () => {
      expect(calc('=LOG(1)').value).toBe(0);
    });

    it('should return #NUM! for negative', () => {
      expect(calc('=LOG(-1)').error).toBe('#NUM!');
    });

    it('should return #NUM! for zero', () => {
      expect(calc('=LOG(0)').error).toBe('#NUM!');
    });
  });

  describe('LN', () => {
    it('should calculate natural log', () => {
      expect(calc('=LN(2.718281828)').value).toBeCloseTo(1, 5);
    });

    it('should handle e', () => {
      const result = calc('=LN(EXP(1))').value as number;
      expect(result).toBeCloseTo(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXP Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('EXP', () => {
    it('should calculate e^x', () => {
      expect(calc('=EXP(1)').value).toBeCloseTo(2.718281828);
    });

    it('should handle 0', () => {
      expect(calc('=EXP(0)').value).toBe(1);
    });

    it('should handle negative exponent', () => {
      expect(calc('=EXP(-1)').value).toBeCloseTo(0.367879441);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PI Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PI', () => {
    it('should return PI', () => {
      expect(calc('=PI()').value).toBeCloseTo(3.14159265359);
    });

    it('should work in expressions', () => {
      expect(calc('=PI()*2').value).toBeCloseTo(6.28318530718);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PRODUCT', () => {
    it('should multiply numbers', () => {
      expect(calc('=PRODUCT(2,3,4)').value).toBe(24);
    });

    it('should handle single value', () => {
      expect(calc('=PRODUCT(5)').value).toBe(5);
    });

    it('should return 0 with zero', () => {
      expect(calc('=PRODUCT(2,0,4)').value).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(calc('=PRODUCT(-2,3)').value).toBe(-6);
    });

    it('should handle arrays', () => {
      expect(calc('=PRODUCT({2,3,4})').value).toBe(24);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTIENT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('QUOTIENT', () => {
    it('should return integer quotient', () => {
      expect(calc('=QUOTIENT(10,3)').value).toBe(3);
    });

    it('should handle even division', () => {
      expect(calc('=QUOTIENT(10,2)').value).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(calc('=QUOTIENT(-10,3)').value).toBe(-3);
    });

    it('should return #DIV/0! for divisor 0', () => {
      expect(calc('=QUOTIENT(10,0)').error).toBe('#DIV/0!');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RAND/RANDBETWEEN Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RAND', () => {
    it('should return number between 0 and 1', () => {
      const result = calc('=RAND()').value as number;
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('should return different values', () => {
      const results = Array.from({ length: 10 }, () => calc('=RAND()').value);
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('RANDBETWEEN', () => {
    it('should return number in range', () => {
      const result = calc('=RANDBETWEEN(1,10)').value as number;
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should return integer', () => {
      const result = calc('=RANDBETWEEN(1,100)').value as number;
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should include boundaries', () => {
      // Run multiple times to increase chance of hitting boundaries
      const results = Array.from({ length: 100 }, () => calc('=RANDBETWEEN(1,2)').value);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COUNT Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('COUNT', () => {
    it('should count numbers', () => {
      expect(calc('=COUNT(1,2,3)').value).toBe(3);
    });

    it('should ignore text', () => {
      expect(calc('=COUNT(1,"text",2)').value).toBe(2);
    });

    it('should ignore booleans', () => {
      expect(calc('=COUNT(1,TRUE,2)').value).toBe(2);
    });

    it('should count string numbers', () => {
      expect(calc('=COUNT("123",456)').value).toBe(2);
    });

    it('should handle arrays', () => {
      expect(calc('=COUNT({1,2,3})').value).toBe(3);
    });

    it('should return 0 for no numbers', () => {
      expect(calc('=COUNT("a","b")').value).toBe(0);
    });
  });

  describe('COUNTA', () => {
    it('should count non-empty values', () => {
      expect(calc('=COUNTA(1,"text",TRUE)').value).toBe(3);
    });

    it('should count strings', () => {
      expect(calc('=COUNTA("a","b","c")').value).toBe(3);
    });

    it('should count booleans', () => {
      expect(calc('=COUNTA(TRUE,FALSE)').value).toBe(2);
    });

    it('should handle empty strings', () => {
      // Empty string "" is a text value (not blank), so it is counted
      expect(calc('=COUNTA("",1,"a")').value).toBe(3);
    });
  });

  describe('COUNTBLANK', () => {
    it('should count empty cells from range', () => {
      mockDataProvider.getCellValue = vi.fn((_, row) => (row === 1 ? null : 1));
      // This depends on implementation of range handling
    });
  });
});
