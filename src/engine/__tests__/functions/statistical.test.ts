import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Statistical Functions', () => {
  let engine: FormulaEngine;
  let mockDataProvider: CellDataProvider;
  let cellData: Record<string, FormulaValue>;

  beforeEach(() => {
    engine = new FormulaEngine();
    cellData = {};
    mockDataProvider = {
      getCellValue: vi.fn((sheet: string, row: number, col: number) => {
        const key = `${sheet}:${row},${col}`;
        return cellData[key] ?? null;
      }),
      getCellFormula: vi.fn(() => undefined),
    };
  });

  const calc = (formula: string) => engine.calculate(formula, 'sheet1', 0, 0, mockDataProvider);

  const setCell = (sheet: string, row: number, col: number, value: FormulaValue) => {
    cellData[`${sheet}:${row},${col}`] = value;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COUNT Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('COUNT', () => {
    it('should count numbers only', () => {
      expect(calc('=COUNT(1,2,3,"text",TRUE)').value).toBe(3);
    });

    it('should return 0 for no numbers', () => {
      expect(calc('=COUNT("a","b","c")').value).toBe(0);
    });

    it('should count range with numbers', () => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, 'text');
      setCell('sheet1', 2, 0, 3);
      expect(calc('=COUNT(A1:A3)').value).toBe(2);
    });
  });

  describe('COUNTA', () => {
    it('should count non-empty cells', () => {
      expect(calc('=COUNTA(1,"text",TRUE,0)').value).toBe(4);
    });

    it('should not count empty cells', () => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, null);
      setCell('sheet1', 2, 0, 3);
      const result = calc('=COUNTA(A1:A3)');
      expect(result.value).toBe(2);
    });

    it('should count empty string as value', () => {
      expect(calc('=COUNTA("")').value).toBe(1);
    });
  });

  describe('COUNTBLANK', () => {
    it('should count empty cells', () => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, null);
      setCell('sheet1', 2, 0, '');
      setCell('sheet1', 3, 0, 4);
      const result = calc('=COUNTBLANK(A1:A4)');
      expect(result.value).toBe(2); // null and empty string
    });
  });

  describe('COUNTIF', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 10);
      setCell('sheet1', 1, 0, 20);
      setCell('sheet1', 2, 0, 30);
      setCell('sheet1', 3, 0, 20);
      setCell('sheet1', 4, 0, 40);
    });

    it('should count cells equal to value', () => {
      expect(calc('=COUNTIF(A1:A5,20)').value).toBe(2);
    });

    it('should count with greater than', () => {
      expect(calc('=COUNTIF(A1:A5,">20")').value).toBe(2);
    });

    it('should count with less than', () => {
      expect(calc('=COUNTIF(A1:A5,"<20")').value).toBe(1);
    });

    it('should count with greater than or equal', () => {
      expect(calc('=COUNTIF(A1:A5,">=20")').value).toBe(4);
    });

    it('should count with not equal', () => {
      expect(calc('=COUNTIF(A1:A5,"<>20")').value).toBe(3);
    });
  });

  describe('COUNTIFS', () => {
    beforeEach(() => {
      // Region | Sales | Category
      setCell('sheet1', 0, 0, 'North');
      setCell('sheet1', 0, 1, 100);
      setCell('sheet1', 0, 2, 'A');
      setCell('sheet1', 1, 0, 'South');
      setCell('sheet1', 1, 1, 200);
      setCell('sheet1', 1, 2, 'B');
      setCell('sheet1', 2, 0, 'North');
      setCell('sheet1', 2, 1, 150);
      setCell('sheet1', 2, 2, 'A');
      setCell('sheet1', 3, 0, 'North');
      setCell('sheet1', 3, 1, 50);
      setCell('sheet1', 3, 2, 'B');
    });

    it('should count with multiple criteria', () => {
      const result = calc('=COUNTIFS(A1:A4,"North",B1:B4,">100")');
      expect(result.value).toBe(1);
    });

    it('should count with text criteria', () => {
      const result = calc('=COUNTIFS(A1:A4,"North",C1:C4,"A")');
      expect(result.value).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AVERAGE Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AVERAGE', () => {
    it('should calculate average', () => {
      expect(calc('=AVERAGE(10,20,30)').value).toBe(20);
    });

    it('should ignore text', () => {
      expect(calc('=AVERAGE(10,"text",30)').value).toBe(20);
    });

    it('should return #DIV/0! for no numbers', () => {
      expect(calc('=AVERAGE("a","b")').error).toBe('#DIV/0!');
    });
  });

  describe('AVERAGEA', () => {
    it('should include TRUE as 1', () => {
      expect(calc('=AVERAGEA(1,TRUE,3)').value).toBe((1 + 1 + 3) / 3);
    });

    it('should include FALSE as 0', () => {
      expect(calc('=AVERAGEA(0,FALSE,4)').value).toBe((0 + 0 + 4) / 3);
    });

    it('should include text as 0', () => {
      expect(calc('=AVERAGEA(2,"text",4)').value).toBe((2 + 0 + 4) / 3);
    });
  });

  describe('AVERAGEIF', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 10);
      setCell('sheet1', 1, 0, 20);
      setCell('sheet1', 2, 0, 30);
      setCell('sheet1', 3, 0, 40);
    });

    it('should average values meeting criteria', () => {
      expect(calc('=AVERAGEIF(A1:A4,">15")').value).toBe(30);
    });

    it('should use separate sum range', () => {
      setCell('sheet1', 0, 1, 100);
      setCell('sheet1', 1, 1, 200);
      setCell('sheet1', 2, 1, 300);
      setCell('sheet1', 3, 1, 400);
      expect(calc('=AVERAGEIF(A1:A4,">15",B1:B4)').value).toBe(300);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUM Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SUMIF', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 'Apple');
      setCell('sheet1', 0, 1, 10);
      setCell('sheet1', 1, 0, 'Banana');
      setCell('sheet1', 1, 1, 20);
      setCell('sheet1', 2, 0, 'Apple');
      setCell('sheet1', 2, 1, 30);
    });

    it('should sum values meeting criteria', () => {
      expect(calc('=SUMIF(A1:A3,"Apple",B1:B3)').value).toBe(40);
    });

    it('should handle numeric criteria', () => {
      expect(calc('=SUMIF(B1:B3,">15")').value).toBe(50);
    });
  });

  describe('SUMIFS', () => {
    beforeEach(() => {
      // Category | Region | Amount
      setCell('sheet1', 0, 0, 'A');
      setCell('sheet1', 0, 1, 'North');
      setCell('sheet1', 0, 2, 100);
      setCell('sheet1', 1, 0, 'B');
      setCell('sheet1', 1, 1, 'South');
      setCell('sheet1', 1, 2, 200);
      setCell('sheet1', 2, 0, 'A');
      setCell('sheet1', 2, 1, 'North');
      setCell('sheet1', 2, 2, 150);
    });

    it('should sum with multiple criteria', () => {
      expect(calc('=SUMIFS(C1:C3,A1:A3,"A",B1:B3,"North")').value).toBe(250);
    });
  });

  describe('SUMPRODUCT', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 3);
      setCell('sheet1', 2, 0, 4);
      setCell('sheet1', 0, 1, 5);
      setCell('sheet1', 1, 1, 6);
      setCell('sheet1', 2, 1, 7);
    });

    it('should multiply and sum', () => {
      expect(calc('=SUMPRODUCT(A1:A3,B1:B3)').value).toBe(2 * 5 + 3 * 6 + 4 * 7);
    });

    it('should handle single array', () => {
      expect(calc('=SUMPRODUCT(A1:A3)').value).toBe(9);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Variance and Standard Deviation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('VAR', () => {
    it('should calculate sample variance', () => {
      const result = calc('=VAR(2,4,4,4,5,5,7,9)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(4.571, 2);
    });

    it('should return #DIV/0! for single value', () => {
      expect(calc('=VAR(5)').error).toBe('#DIV/0!');
    });
  });

  describe('VARP', () => {
    it('should calculate population variance', () => {
      const result = calc('=VARP(2,4,4,4,5,5,7,9)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(4, 2);
    });

    it('should handle single value', () => {
      expect(calc('=VARP(5)').value).toBe(0);
    });
  });

  describe('STDEV', () => {
    it('should calculate sample standard deviation', () => {
      const result = calc('=STDEV(2,4,4,4,5,5,7,9)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(2.138, 2);
    });
  });

  describe('STDEVP', () => {
    it('should calculate population standard deviation', () => {
      const result = calc('=STDEVP(2,4,4,4,5,5,7,9)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(2, 2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Percentile and Quartile Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PERCENTILE', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 3);
      setCell('sheet1', 3, 0, 4);
      setCell('sheet1', 4, 0, 5);
    });

    it('should return 50th percentile (median)', () => {
      expect(calc('=PERCENTILE(A1:A5,0.5)').value).toBe(3);
    });

    it('should return 0th percentile (min)', () => {
      expect(calc('=PERCENTILE(A1:A5,0)').value).toBe(1);
    });

    it('should return 100th percentile (max)', () => {
      expect(calc('=PERCENTILE(A1:A5,1)').value).toBe(5);
    });

    it('should interpolate', () => {
      const result = calc('=PERCENTILE(A1:A5,0.25)');
      expect(result.value).toBe(2);
    });
  });

  describe('QUARTILE', () => {
    beforeEach(() => {
      for (let i = 0; i < 10; i++) {
        setCell('sheet1', i, 0, i + 1);
      }
    });

    it('should return Q0 (min)', () => {
      expect(calc('=QUARTILE(A1:A10,0)').value).toBe(1);
    });

    it('should return Q1', () => {
      const result = calc('=QUARTILE(A1:A10,1)');
      expect(result.error).toBeUndefined();
    });

    it('should return Q2 (median)', () => {
      const result = calc('=QUARTILE(A1:A10,2)');
      expect(result.value).toBeCloseTo(5.5, 1);
    });

    it('should return Q3', () => {
      const result = calc('=QUARTILE(A1:A10,3)');
      expect(result.error).toBeUndefined();
    });

    it('should return Q4 (max)', () => {
      expect(calc('=QUARTILE(A1:A10,4)').value).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIAN and MODE Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MEDIAN', () => {
    it('should return middle value for odd count', () => {
      expect(calc('=MEDIAN(1,2,3,4,5)').value).toBe(3);
    });

    it('should return average of middle values for even count', () => {
      expect(calc('=MEDIAN(1,2,3,4)').value).toBe(2.5);
    });

    it('should ignore text', () => {
      expect(calc('=MEDIAN(1,"text",5)').value).toBe(3);
    });

    it('should handle unsorted input', () => {
      expect(calc('=MEDIAN(5,1,3,2,4)').value).toBe(3);
    });
  });

  describe('MODE', () => {
    it('should return most frequent value', () => {
      expect(calc('=MODE(1,2,2,3,3,3,4)').value).toBe(3);
    });

    it('should return first mode for tie', () => {
      const result = calc('=MODE(1,1,2,2)');
      expect([1, 2]).toContain(result.value);
    });

    it('should return #N/A for no repeating values', () => {
      expect(calc('=MODE(1,2,3,4)').error).toBe('#N/A');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MIN/MAX with Conditions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MINIFS', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 'A');
      setCell('sheet1', 0, 1, 10);
      setCell('sheet1', 1, 0, 'B');
      setCell('sheet1', 1, 1, 20);
      setCell('sheet1', 2, 0, 'A');
      setCell('sheet1', 2, 1, 5);
    });

    it('should find min with criteria', () => {
      expect(calc('=MINIFS(B1:B3,A1:A3,"A")').value).toBe(5);
    });
  });

  describe('MAXIFS', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 'A');
      setCell('sheet1', 0, 1, 10);
      setCell('sheet1', 1, 0, 'B');
      setCell('sheet1', 1, 1, 20);
      setCell('sheet1', 2, 0, 'A');
      setCell('sheet1', 2, 1, 15);
    });

    it('should find max with criteria', () => {
      expect(calc('=MAXIFS(B1:B3,A1:A3,"A")').value).toBe(15);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LARGE/SMALL Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('LARGE', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 5);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 8);
      setCell('sheet1', 3, 0, 1);
      setCell('sheet1', 4, 0, 9);
    });

    it('should return largest value', () => {
      expect(calc('=LARGE(A1:A5,1)').value).toBe(9);
    });

    it('should return second largest', () => {
      expect(calc('=LARGE(A1:A5,2)').value).toBe(8);
    });

    it('should return smallest as last', () => {
      expect(calc('=LARGE(A1:A5,5)').value).toBe(1);
    });

    it('should return #NUM! for k out of range', () => {
      expect(calc('=LARGE(A1:A5,6)').error).toBe('#NUM!');
    });
  });

  describe('SMALL', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 5);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 8);
      setCell('sheet1', 3, 0, 1);
      setCell('sheet1', 4, 0, 9);
    });

    it('should return smallest value', () => {
      expect(calc('=SMALL(A1:A5,1)').value).toBe(1);
    });

    it('should return second smallest', () => {
      expect(calc('=SMALL(A1:A5,2)').value).toBe(2);
    });

    it('should return largest as last', () => {
      expect(calc('=SMALL(A1:A5,5)').value).toBe(9);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RANK Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RANK', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 7);
      setCell('sheet1', 1, 0, 3);
      setCell('sheet1', 2, 0, 5);
      setCell('sheet1', 3, 0, 9);
      setCell('sheet1', 4, 0, 1);
    });

    it('should return rank in descending order (default)', () => {
      expect(calc('=RANK(9,A1:A5)').value).toBe(1);
    });

    it('should return rank in ascending order', () => {
      expect(calc('=RANK(1,A1:A5,1)').value).toBe(1);
    });

    it('should handle ties', () => {
      setCell('sheet1', 4, 0, 5); // Duplicate 5
      const result = calc('=RANK(5,A1:A5)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Correlation and Covariance Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CORREL', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 3);
      setCell('sheet1', 0, 1, 2);
      setCell('sheet1', 1, 1, 4);
      setCell('sheet1', 2, 1, 6);
    });

    it('should calculate perfect positive correlation', () => {
      expect(calc('=CORREL(A1:A3,B1:B3)').value).toBeCloseTo(1, 5);
    });

    it('should handle negative correlation', () => {
      setCell('sheet1', 0, 1, 6);
      setCell('sheet1', 1, 1, 4);
      setCell('sheet1', 2, 1, 2);
      expect(calc('=CORREL(A1:A3,B1:B3)').value).toBeCloseTo(-1, 5);
    });
  });

  describe('COVAR', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 3);
      setCell('sheet1', 0, 1, 4);
      setCell('sheet1', 1, 1, 5);
      setCell('sheet1', 2, 1, 6);
    });

    it('should calculate covariance', () => {
      const result = calc('=COVAR(A1:A3,B1:B3)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Distribution Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NORM.DIST', () => {
    it('should calculate normal distribution PDF', () => {
      const result = calc('=NORM.DIST(0,0,1,FALSE)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(0.3989, 3);
    });

    it('should calculate normal distribution CDF', () => {
      const result = calc('=NORM.DIST(0,0,1,TRUE)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(0.5, 3);
    });
  });

  describe('NORM.INV', () => {
    it('should calculate inverse normal', () => {
      const result = calc('=NORM.INV(0.5,0,1)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(0, 3);
    });

    it('should return error for probability out of range', () => {
      expect(calc('=NORM.INV(1.5,0,1)').error).toBeDefined();
    });
  });

  describe('T.DIST', () => {
    it('should calculate t-distribution', () => {
      const result = calc('=T.DIST(1,10,TRUE)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Frequency and Histogram Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('FREQUENCY', () => {
    beforeEach(() => {
      // Data
      setCell('sheet1', 0, 0, 5);
      setCell('sheet1', 1, 0, 15);
      setCell('sheet1', 2, 0, 25);
      setCell('sheet1', 3, 0, 35);
      setCell('sheet1', 4, 0, 45);
      // Bins
      setCell('sheet1', 0, 1, 10);
      setCell('sheet1', 1, 1, 20);
      setCell('sheet1', 2, 1, 30);
      setCell('sheet1', 3, 1, 40);
    });

    it('should return frequency distribution', () => {
      const result = calc('=FREQUENCY(A1:A5,B1:B4)');
      expect(result.error).toBeUndefined();
      // Returns array - implementation dependent
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Growth and Trend Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TREND', () => {
    beforeEach(() => {
      // Y values
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 4);
      setCell('sheet1', 2, 0, 6);
      // X values
      setCell('sheet1', 0, 1, 1);
      setCell('sheet1', 1, 1, 2);
      setCell('sheet1', 2, 1, 3);
    });

    it('should calculate linear trend', () => {
      const result = calc('=TREND(A1:A3,B1:B3)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('GROWTH', () => {
    beforeEach(() => {
      // Y values (exponential)
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 4);
      setCell('sheet1', 2, 0, 8);
      // X values
      setCell('sheet1', 0, 1, 1);
      setCell('sheet1', 1, 1, 2);
      setCell('sheet1', 2, 1, 3);
    });

    it('should calculate exponential growth', () => {
      const result = calc('=GROWTH(A1:A3,B1:B3)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Regression Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SLOPE', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 4);
      setCell('sheet1', 2, 0, 6);
      setCell('sheet1', 0, 1, 1);
      setCell('sheet1', 1, 1, 2);
      setCell('sheet1', 2, 1, 3);
    });

    it('should calculate slope', () => {
      const result = calc('=SLOPE(A1:A3,B1:B3)');
      expect(result.value).toBeCloseTo(2, 5);
    });
  });

  describe('INTERCEPT', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 4);
      setCell('sheet1', 2, 0, 6);
      setCell('sheet1', 0, 1, 1);
      setCell('sheet1', 1, 1, 2);
      setCell('sheet1', 2, 1, 3);
    });

    it('should calculate intercept', () => {
      const result = calc('=INTERCEPT(A1:A3,B1:B3)');
      expect(result.value).toBeCloseTo(0, 5);
    });
  });

  describe('RSQ', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 2);
      setCell('sheet1', 1, 0, 4);
      setCell('sheet1', 2, 0, 6);
      setCell('sheet1', 0, 1, 1);
      setCell('sheet1', 1, 1, 2);
      setCell('sheet1', 2, 1, 3);
    });

    it('should calculate R-squared', () => {
      const result = calc('=RSQ(A1:A3,B1:B3)');
      expect(result.value).toBeCloseTo(1, 5); // Perfect linear relationship
    });
  });
});
