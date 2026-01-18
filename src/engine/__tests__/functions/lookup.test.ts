import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Lookup Functions', () => {
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
  // VLOOKUP Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('VLOOKUP', () => {
    beforeEach(() => {
      // Set up lookup table in A1:C4
      // ID | Name | Score
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 0, 1, 'Alice');
      setCell('sheet1', 0, 2, 85);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 1, 1, 'Bob');
      setCell('sheet1', 1, 2, 92);
      setCell('sheet1', 2, 0, 3);
      setCell('sheet1', 2, 1, 'Charlie');
      setCell('sheet1', 2, 2, 78);
      setCell('sheet1', 3, 0, 4);
      setCell('sheet1', 3, 1, 'Diana');
      setCell('sheet1', 3, 2, 95);
    });

    it('should find exact match', () => {
      const result = calc('=VLOOKUP(2,A1:C4,2,FALSE)');
      expect(result.value).toBe('Bob');
    });

    it('should return value from specified column', () => {
      const result = calc('=VLOOKUP(3,A1:C4,3,FALSE)');
      expect(result.value).toBe(78);
    });

    it('should return #N/A for no match with exact', () => {
      const result = calc('=VLOOKUP(5,A1:C4,2,FALSE)');
      expect(result.error).toBe('#N/A');
    });

    it('should find approximate match (default)', () => {
      const result = calc('=VLOOKUP(2.5,A1:C4,2,TRUE)');
      expect(result.value).toBe('Bob'); // Closest match <= 2.5
    });

    it('should handle first column match', () => {
      const result = calc('=VLOOKUP(1,A1:C4,2,FALSE)');
      expect(result.value).toBe('Alice');
    });

    it('should handle last row match', () => {
      const result = calc('=VLOOKUP(4,A1:C4,2,FALSE)');
      expect(result.value).toBe('Diana');
    });

    it('should return #REF! for invalid column index', () => {
      const result = calc('=VLOOKUP(1,A1:C4,5,FALSE)');
      expect(result.error).toBe('#REF!');
    });

    it('should return error for column index < 1', () => {
      const result = calc('=VLOOKUP(1,A1:C4,0,FALSE)');
      expect(result.error).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HLOOKUP Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('HLOOKUP', () => {
    beforeEach(() => {
      // Set up horizontal lookup table in A1:D3
      // Header row
      setCell('sheet1', 0, 0, 'Q1');
      setCell('sheet1', 0, 1, 'Q2');
      setCell('sheet1', 0, 2, 'Q3');
      setCell('sheet1', 0, 3, 'Q4');
      // Sales row
      setCell('sheet1', 1, 0, 100);
      setCell('sheet1', 1, 1, 150);
      setCell('sheet1', 1, 2, 200);
      setCell('sheet1', 1, 3, 250);
      // Expenses row
      setCell('sheet1', 2, 0, 50);
      setCell('sheet1', 2, 1, 75);
      setCell('sheet1', 2, 2, 100);
      setCell('sheet1', 2, 3, 125);
    });

    it('should find exact match', () => {
      const result = calc('=HLOOKUP("Q2",A1:D3,2,FALSE)');
      expect(result.value).toBe(150);
    });

    it('should return value from specified row', () => {
      const result = calc('=HLOOKUP("Q3",A1:D3,3,FALSE)');
      expect(result.value).toBe(100);
    });

    it('should return #N/A for no match with exact', () => {
      const result = calc('=HLOOKUP("Q5",A1:D3,2,FALSE)');
      expect(result.error).toBe('#N/A');
    });

    it('should handle first column', () => {
      const result = calc('=HLOOKUP("Q1",A1:D3,2,FALSE)');
      expect(result.value).toBe(100);
    });

    it('should handle last column', () => {
      const result = calc('=HLOOKUP("Q4",A1:D3,2,FALSE)');
      expect(result.value).toBe(250);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INDEX Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('INDEX', () => {
    beforeEach(() => {
      // Set up 3x3 array in A1:C3
      setCell('sheet1', 0, 0, 'A');
      setCell('sheet1', 0, 1, 'B');
      setCell('sheet1', 0, 2, 'C');
      setCell('sheet1', 1, 0, 'D');
      setCell('sheet1', 1, 1, 'E');
      setCell('sheet1', 1, 2, 'F');
      setCell('sheet1', 2, 0, 'G');
      setCell('sheet1', 2, 1, 'H');
      setCell('sheet1', 2, 2, 'I');
    });

    it('should return value at row,col intersection', () => {
      const result = calc('=INDEX(A1:C3,2,2)');
      expect(result.value).toBe('E');
    });

    it('should handle first row, first col', () => {
      const result = calc('=INDEX(A1:C3,1,1)');
      expect(result.value).toBe('A');
    });

    it('should handle last row, last col', () => {
      const result = calc('=INDEX(A1:C3,3,3)');
      expect(result.value).toBe('I');
    });

    it('should return entire row with col=0', () => {
      // Returns array reference - implementation dependent
      const result = calc('=INDEX(A1:C3,2,0)');
      expect(result.error).toBeUndefined();
    });

    it('should return entire column with row=0', () => {
      const result = calc('=INDEX(A1:C3,0,2)');
      expect(result.error).toBeUndefined();
    });

    it('should return #REF! for out of bounds row', () => {
      const result = calc('=INDEX(A1:C3,5,1)');
      expect(result.error).toBe('#REF!');
    });

    it('should return #REF! for out of bounds col', () => {
      const result = calc('=INDEX(A1:C3,1,5)');
      expect(result.error).toBe('#REF!');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCH Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MATCH', () => {
    beforeEach(() => {
      // Set up vertical array in A1:A5
      setCell('sheet1', 0, 0, 10);
      setCell('sheet1', 1, 0, 20);
      setCell('sheet1', 2, 0, 30);
      setCell('sheet1', 3, 0, 40);
      setCell('sheet1', 4, 0, 50);
    });

    it('should find exact match position', () => {
      const result = calc('=MATCH(30,A1:A5,0)');
      expect(result.value).toBe(3);
    });

    it('should return 1 for first element', () => {
      const result = calc('=MATCH(10,A1:A5,0)');
      expect(result.value).toBe(1);
    });

    it('should return last position for last element', () => {
      const result = calc('=MATCH(50,A1:A5,0)');
      expect(result.value).toBe(5);
    });

    it('should return #N/A for no match', () => {
      const result = calc('=MATCH(25,A1:A5,0)');
      expect(result.error).toBe('#N/A');
    });

    it('should find largest value <= lookup (match_type 1)', () => {
      const result = calc('=MATCH(35,A1:A5,1)');
      expect(result.value).toBe(3); // 30 is largest <= 35
    });

    it('should find smallest value >= lookup (match_type -1)', () => {
      // For match_type -1, array must be in descending order
      setCell('sheet1', 0, 0, 50);
      setCell('sheet1', 1, 0, 40);
      setCell('sheet1', 2, 0, 30);
      setCell('sheet1', 3, 0, 20);
      setCell('sheet1', 4, 0, 10);
      const result = calc('=MATCH(35,A1:A5,-1)');
      expect(result.value).toBe(2); // 40 is smallest >= 35
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INDEX/MATCH Combination Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('INDEX/MATCH combination', () => {
    beforeEach(() => {
      // Set up lookup table in A1:C4
      setCell('sheet1', 0, 0, 'Product');
      setCell('sheet1', 0, 1, 'Price');
      setCell('sheet1', 0, 2, 'Stock');
      setCell('sheet1', 1, 0, 'Apple');
      setCell('sheet1', 1, 1, 1.5);
      setCell('sheet1', 1, 2, 100);
      setCell('sheet1', 2, 0, 'Banana');
      setCell('sheet1', 2, 1, 0.75);
      setCell('sheet1', 2, 2, 150);
      setCell('sheet1', 3, 0, 'Orange');
      setCell('sheet1', 3, 1, 2.0);
      setCell('sheet1', 3, 2, 80);
    });

    it('should perform left lookup', () => {
      const result = calc('=INDEX(A1:A4,MATCH(0.75,B1:B4,0))');
      expect(result.value).toBe('Banana');
    });

    it('should find price by product name', () => {
      const result = calc('=INDEX(B1:B4,MATCH("Orange",A1:A4,0))');
      expect(result.value).toBe(2.0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOOKUP Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('LOOKUP', () => {
    beforeEach(() => {
      // Set up arrays
      setCell('sheet1', 0, 0, 1);
      setCell('sheet1', 1, 0, 2);
      setCell('sheet1', 2, 0, 3);
      setCell('sheet1', 3, 0, 4);

      setCell('sheet1', 0, 1, 'One');
      setCell('sheet1', 1, 1, 'Two');
      setCell('sheet1', 2, 1, 'Three');
      setCell('sheet1', 3, 1, 'Four');
    });

    it('should find value in vector form', () => {
      const result = calc('=LOOKUP(2,A1:A4,B1:B4)');
      expect(result.value).toBe('Two');
    });

    it('should find approximate match', () => {
      const result = calc('=LOOKUP(2.5,A1:A4,B1:B4)');
      expect(result.value).toBe('Two'); // Largest <= 2.5
    });

    it('should return last match if all less', () => {
      const result = calc('=LOOKUP(10,A1:A4,B1:B4)');
      expect(result.value).toBe('Four');
    });

    it('should return #N/A if all greater', () => {
      const result = calc('=LOOKUP(0,A1:A4,B1:B4)');
      expect(result.error).toBe('#N/A');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // XLOOKUP Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('XLOOKUP', () => {
    beforeEach(() => {
      // Set up lookup table
      setCell('sheet1', 0, 0, 'Apple');
      setCell('sheet1', 1, 0, 'Banana');
      setCell('sheet1', 2, 0, 'Cherry');

      setCell('sheet1', 0, 1, 100);
      setCell('sheet1', 1, 1, 200);
      setCell('sheet1', 2, 1, 300);
    });

    it('should find exact match', () => {
      const result = calc('=XLOOKUP("Banana",A1:A3,B1:B3)');
      expect(result.value).toBe(200);
    });

    it('should return default if not found', () => {
      const result = calc('=XLOOKUP("Date",A1:A3,B1:B3,"Not Found")');
      expect(result.value).toBe('Not Found');
    });

    it('should return #N/A if no default and not found', () => {
      const result = calc('=XLOOKUP("Date",A1:A3,B1:B3)');
      expect(result.error).toBe('#N/A');
    });

    it('should handle case insensitive search', () => {
      const result = calc('=XLOOKUP("BANANA",A1:A3,B1:B3)');
      // Depends on implementation - may be case sensitive or not
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CHOOSE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CHOOSE', () => {
    it('should return value at index', () => {
      expect(calc('=CHOOSE(2,"a","b","c")').value).toBe('b');
    });

    it('should return first value', () => {
      expect(calc('=CHOOSE(1,"first","second","third")').value).toBe('first');
    });

    it('should return last value', () => {
      expect(calc('=CHOOSE(3,"a","b","c")').value).toBe('c');
    });

    it('should return #VALUE! for index < 1', () => {
      expect(calc('=CHOOSE(0,"a","b")').error).toBe('#VALUE!');
    });

    it('should return #VALUE! for index > count', () => {
      expect(calc('=CHOOSE(5,"a","b","c")').error).toBe('#VALUE!');
    });

    it('should handle numbers as values', () => {
      expect(calc('=CHOOSE(2,10,20,30)').value).toBe(20);
    });

    it('should handle expressions as values', () => {
      expect(calc('=CHOOSE(1,1+1,2+2,3+3)').value).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROW/COLUMN Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ROW', () => {
    it('should return current row (1-based)', () => {
      const result = engine.calculate('=ROW()', 'sheet1', 5, 0, mockDataProvider);
      expect(result.value).toBe(6); // 0-indexed row 5 = row 6 in Excel
    });

    it('should return row of reference', () => {
      const result = calc('=ROW(A10)');
      expect(result.value).toBe(10);
    });

    it('should return first row of range', () => {
      const result = calc('=ROW(A5:C10)');
      expect(result.value).toBe(5);
    });
  });

  describe('COLUMN', () => {
    it('should return current column (1-based)', () => {
      const result = engine.calculate('=COLUMN()', 'sheet1', 0, 3, mockDataProvider);
      expect(result.value).toBe(4); // 0-indexed col 3 = column D
    });

    it('should return column of reference', () => {
      const result = calc('=COLUMN(D1)');
      expect(result.value).toBe(4);
    });

    it('should return first column of range', () => {
      const result = calc('=COLUMN(C5:F10)');
      expect(result.value).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROWS/COLUMNS Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ROWS', () => {
    it('should return number of rows in range', () => {
      expect(calc('=ROWS(A1:A10)').value).toBe(10);
    });

    it('should return 1 for single cell', () => {
      expect(calc('=ROWS(A1)').value).toBe(1);
    });

    it('should count multi-column range', () => {
      expect(calc('=ROWS(A1:C5)').value).toBe(5);
    });
  });

  describe('COLUMNS', () => {
    it('should return number of columns in range', () => {
      expect(calc('=COLUMNS(A1:E1)').value).toBe(5);
    });

    it('should return 1 for single cell', () => {
      expect(calc('=COLUMNS(A1)').value).toBe(1);
    });

    it('should count multi-row range', () => {
      expect(calc('=COLUMNS(A1:C5)').value).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDRESS Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ADDRESS', () => {
    it('should create absolute reference', () => {
      expect(calc('=ADDRESS(1,1,1)').value).toBe('$A$1');
    });

    it('should create absolute row only', () => {
      expect(calc('=ADDRESS(1,1,2)').value).toBe('A$1');
    });

    it('should create absolute column only', () => {
      expect(calc('=ADDRESS(1,1,3)').value).toBe('$A1');
    });

    it('should create relative reference', () => {
      expect(calc('=ADDRESS(1,1,4)').value).toBe('A1');
    });

    it('should handle column Z', () => {
      expect(calc('=ADDRESS(1,26,4)').value).toBe('Z1');
    });

    it('should handle column AA', () => {
      expect(calc('=ADDRESS(1,27,4)').value).toBe('AA1');
    });

    it('should include sheet name', () => {
      const result = calc('=ADDRESS(1,1,4,TRUE,"Sheet2")');
      expect(result.value).toContain('Sheet2');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIRECT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('INDIRECT', () => {
    beforeEach(() => {
      setCell('sheet1', 0, 0, 'Hello');
      setCell('sheet1', 1, 0, 'World');
    });

    it('should resolve A1 style reference', () => {
      const result = calc('=INDIRECT("A1")');
      expect(result.value).toBe('Hello');
    });

    it('should resolve constructed reference', () => {
      const result = calc('=INDIRECT("A"&"2")');
      expect(result.value).toBe('World');
    });

    it('should return #REF! for invalid reference', () => {
      const result = calc('=INDIRECT("InvalidRef")');
      expect(result.error).toBe('#REF!');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFSET Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('OFFSET', () => {
    beforeEach(() => {
      // Set up grid
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          setCell('sheet1', r, c, r * 5 + c + 1);
        }
      }
    });

    it('should offset single cell', () => {
      const result = calc('=OFFSET(A1,1,1)');
      expect(result.value).toBe(7); // B2
    });

    it('should offset with height and width', () => {
      const result = calc('=SUM(OFFSET(A1,0,0,2,2))');
      expect(result.value).toBe(1 + 2 + 6 + 7); // A1:B2
    });

    it('should handle negative offset', () => {
      const result = calc('=OFFSET(C3,-1,-1)');
      expect(result.value).toBe(7); // B2
    });

    it('should return #REF! for out of bounds', () => {
      const result = calc('=OFFSET(A1,-1,0)');
      expect(result.error).toBe('#REF!');
    });
  });
});
