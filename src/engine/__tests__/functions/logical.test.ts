import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Logical Functions', () => {
  let engine: FormulaEngine;
  let mockDataProvider: CellDataProvider;

  beforeEach(() => {
    engine = new FormulaEngine();
    mockDataProvider = {
      getCellValue: vi.fn((sheetId: string, row: number, col: number) => {
        const data: Record<string, FormulaValue> = {
          'sheet1:0:0': 10,
          'sheet1:0:1': 0,
          'sheet1:0:2': -5,
          'sheet1:1:0': 'text',
          'sheet1:1:1': true,
          'sheet1:1:2': false,
        };
        return data[`${sheetId}:${row}:${col}`] ?? null;
      }),
      getCellFormula: vi.fn(() => undefined),
    };
  });

  const calc = (formula: string) => engine.calculate(formula, 'sheet1', 0, 0, mockDataProvider);

  // ═══════════════════════════════════════════════════════════════════════════
  // IF Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('IF', () => {
    it('should return value_if_true when condition is TRUE', () => {
      expect(calc('=IF(TRUE,"yes","no")').value).toBe('yes');
    });

    it('should return value_if_false when condition is FALSE', () => {
      expect(calc('=IF(FALSE,"yes","no")').value).toBe('no');
    });

    it('should evaluate numeric condition (non-zero = true)', () => {
      expect(calc('=IF(1,"yes","no")').value).toBe('yes');
    });

    it('should evaluate numeric condition (zero = false)', () => {
      expect(calc('=IF(0,"yes","no")').value).toBe('no');
    });

    it('should evaluate comparison', () => {
      expect(calc('=IF(5>3,"greater","less")').value).toBe('greater');
    });

    it('should handle nested IF', () => {
      expect(calc('=IF(1>2,"A",IF(2>1,"B","C"))').value).toBe('B');
    });

    it('should handle deeply nested IF', () => {
      expect(calc('=IF(1>2,"A",IF(2>3,"B",IF(3>2,"C","D")))').value).toBe('C');
    });

    it('should return FALSE when value_if_false omitted and condition FALSE', () => {
      expect(calc('=IF(FALSE,"yes")').value).toBe(false);
    });

    it('should handle numeric return values', () => {
      expect(calc('=IF(TRUE,100,0)').value).toBe(100);
    });

    it('should handle cell reference in condition', () => {
      expect(calc('=IF(A1>5,"big","small")').value).toBe('big');
    });

    it('should handle formula in return values', () => {
      expect(calc('=IF(TRUE,1+2,3+4)').value).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AND Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AND', () => {
    it('should return TRUE when all arguments are TRUE', () => {
      expect(calc('=AND(TRUE,TRUE,TRUE)').value).toBe(true);
    });

    it('should return FALSE when any argument is FALSE', () => {
      expect(calc('=AND(TRUE,FALSE,TRUE)').value).toBe(false);
    });

    it('should return FALSE when all arguments are FALSE', () => {
      expect(calc('=AND(FALSE,FALSE)').value).toBe(false);
    });

    it('should handle single argument', () => {
      expect(calc('=AND(TRUE)').value).toBe(true);
    });

    it('should evaluate numeric values (non-zero = true)', () => {
      expect(calc('=AND(1,2,3)').value).toBe(true);
    });

    it('should evaluate numeric values (zero = false)', () => {
      expect(calc('=AND(1,0,3)').value).toBe(false);
    });

    it('should handle comparisons', () => {
      expect(calc('=AND(1>0,2>1,3>2)').value).toBe(true);
    });

    it('should work with IF', () => {
      expect(calc('=IF(AND(1>0,2>1),"yes","no")').value).toBe('yes');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OR Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('OR', () => {
    it('should return TRUE when any argument is TRUE', () => {
      expect(calc('=OR(FALSE,TRUE,FALSE)').value).toBe(true);
    });

    it('should return FALSE when all arguments are FALSE', () => {
      expect(calc('=OR(FALSE,FALSE,FALSE)').value).toBe(false);
    });

    it('should return TRUE when all arguments are TRUE', () => {
      expect(calc('=OR(TRUE,TRUE)').value).toBe(true);
    });

    it('should handle single argument', () => {
      expect(calc('=OR(FALSE)').value).toBe(false);
    });

    it('should evaluate numeric values', () => {
      expect(calc('=OR(0,0,1)').value).toBe(true);
    });

    it('should return FALSE for all zeros', () => {
      expect(calc('=OR(0,0,0)').value).toBe(false);
    });

    it('should handle comparisons', () => {
      expect(calc('=OR(1>5,2>5,3>5)').value).toBe(false);
    });

    it('should work with IF', () => {
      expect(calc('=IF(OR(1>5,2<5),"yes","no")').value).toBe('yes');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NOT', () => {
    it('should return FALSE for TRUE', () => {
      expect(calc('=NOT(TRUE)').value).toBe(false);
    });

    it('should return TRUE for FALSE', () => {
      expect(calc('=NOT(FALSE)').value).toBe(true);
    });

    it('should handle numeric TRUE (non-zero)', () => {
      expect(calc('=NOT(1)').value).toBe(false);
    });

    it('should handle numeric FALSE (zero)', () => {
      expect(calc('=NOT(0)').value).toBe(true);
    });

    it('should work with comparison', () => {
      expect(calc('=NOT(1>2)').value).toBe(true);
    });

    it('should work with AND/OR', () => {
      expect(calc('=NOT(AND(TRUE,FALSE))').value).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // XOR Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('XOR', () => {
    it('should return TRUE for odd number of TRUE values', () => {
      expect(calc('=XOR(TRUE,FALSE)').value).toBe(true);
    });

    it('should return FALSE for even number of TRUE values', () => {
      expect(calc('=XOR(TRUE,TRUE)').value).toBe(false);
    });

    it('should return FALSE for all FALSE', () => {
      expect(calc('=XOR(FALSE,FALSE)').value).toBe(false);
    });

    it('should handle multiple arguments', () => {
      expect(calc('=XOR(TRUE,TRUE,TRUE)').value).toBe(true);
    });

    it('should handle four TRUE values', () => {
      expect(calc('=XOR(TRUE,TRUE,TRUE,TRUE)').value).toBe(false);
    });

    it('should handle numeric values', () => {
      expect(calc('=XOR(1,0)').value).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TRUE/FALSE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TRUE', () => {
    it('should return TRUE', () => {
      expect(calc('=TRUE()').value).toBe(true);
    });

    it('should work in expressions', () => {
      expect(calc('=IF(TRUE(),"yes","no")').value).toBe('yes');
    });
  });

  describe('FALSE', () => {
    it('should return FALSE', () => {
      expect(calc('=FALSE()').value).toBe(false);
    });

    it('should work in expressions', () => {
      expect(calc('=IF(FALSE(),"yes","no")').value).toBe('no');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // IFERROR Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('IFERROR', () => {
    it('should return value if no error', () => {
      expect(calc('=IFERROR(10/2,"Error")').value).toBe(5);
    });

    it('should return error value if error', () => {
      expect(calc('=IFERROR(10/0,"Error")').value).toBe('Error');
    });

    it('should handle #NAME? error', () => {
      expect(calc('=IFERROR(UNKNOWN(),"Not found")').value).toBe('Not found');
    });

    it('should handle #VALUE! error', () => {
      expect(calc('=IFERROR("text"+1,"Invalid")').value).toBe('Invalid');
    });

    it('should return 0 as error value', () => {
      expect(calc('=IFERROR(1/0,0)').value).toBe(0);
    });

    it('should return formula result as error value', () => {
      expect(calc('=IFERROR(1/0,1+1)').value).toBe(2);
    });

    it('should handle nested IFERROR', () => {
      expect(calc('=IFERROR(IFERROR(1/0,2/0),"double error")').value).toBe('double error');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // IFNA Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('IFNA', () => {
    it('should return value if not #N/A', () => {
      expect(calc('=IFNA(10,"Not found")').value).toBe(10);
    });

    // Note: #N/A errors typically come from VLOOKUP, MATCH, etc.
    // Testing depends on those functions being implemented
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // IFS Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('IFS', () => {
    it('should return value for first TRUE condition', () => {
      expect(calc('=IFS(FALSE,"A",TRUE,"B",TRUE,"C")').value).toBe('B');
    });

    it('should check conditions in order', () => {
      expect(calc('=IFS(1>2,"A",2>3,"B",3>2,"C")').value).toBe('C');
    });

    it('should handle first condition TRUE', () => {
      expect(calc('=IFS(TRUE,"first",TRUE,"second")').value).toBe('first');
    });

    it('should handle all numeric conditions', () => {
      expect(calc('=IFS(0,1,0,2,1,3)').value).toBe(3);
    });

    it('should return error if no condition is TRUE', () => {
      expect(calc('=IFS(FALSE,1,FALSE,2)').error).toBeDefined();
    });

    it('should handle default case with TRUE', () => {
      expect(calc('=IFS(FALSE,"A",FALSE,"B",TRUE,"default")').value).toBe('default');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SWITCH Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SWITCH', () => {
    it('should return matching value', () => {
      expect(calc('=SWITCH(2,1,"one",2,"two",3,"three")').value).toBe('two');
    });

    it('should return default if no match', () => {
      expect(calc('=SWITCH(4,1,"one",2,"two","default")').value).toBe('default');
    });

    it('should handle string expression', () => {
      expect(calc('=SWITCH("B","A","alpha","B","beta","C","gamma")').value).toBe('beta');
    });

    it('should handle first match', () => {
      expect(calc('=SWITCH(1,1,"first",1,"second")').value).toBe('first');
    });

    it('should return error if no match and no default', () => {
      const result = calc('=SWITCH(5,1,"one",2,"two")');
      expect(result.error).toBeDefined();
    });

    it('should handle numeric values', () => {
      expect(calc('=SWITCH(1,1,100,2,200)').value).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Type Checking Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ISNUMBER', () => {
    it('should return TRUE for number', () => {
      expect(calc('=ISNUMBER(123)').value).toBe(true);
    });

    it('should return FALSE for text', () => {
      expect(calc('=ISNUMBER("text")').value).toBe(false);
    });

    it('should return FALSE for boolean', () => {
      expect(calc('=ISNUMBER(TRUE)').value).toBe(false);
    });

    it('should return TRUE for formula result', () => {
      expect(calc('=ISNUMBER(1+1)').value).toBe(true);
    });

    it('should return FALSE for text number', () => {
      expect(calc('=ISNUMBER("123")').value).toBe(false);
    });
  });

  describe('ISTEXT', () => {
    it('should return TRUE for text', () => {
      expect(calc('=ISTEXT("hello")').value).toBe(true);
    });

    it('should return FALSE for number', () => {
      expect(calc('=ISTEXT(123)').value).toBe(false);
    });

    it('should return FALSE for boolean', () => {
      expect(calc('=ISTEXT(TRUE)').value).toBe(false);
    });

    it('should return TRUE for empty string', () => {
      expect(calc('=ISTEXT("")').value).toBe(true);
    });
  });

  describe('ISLOGICAL', () => {
    it('should return TRUE for TRUE', () => {
      expect(calc('=ISLOGICAL(TRUE)').value).toBe(true);
    });

    it('should return TRUE for FALSE', () => {
      expect(calc('=ISLOGICAL(FALSE)').value).toBe(true);
    });

    it('should return FALSE for number', () => {
      expect(calc('=ISLOGICAL(1)').value).toBe(false);
    });

    it('should return FALSE for text', () => {
      expect(calc('=ISLOGICAL("TRUE")').value).toBe(false);
    });
  });

  describe('ISBLANK', () => {
    it('should return TRUE for null cell', () => {
      mockDataProvider.getCellValue = vi.fn(() => null);
      expect(calc('=ISBLANK(A1)').value).toBe(true);
    });

    it('should return FALSE for non-empty cell', () => {
      expect(calc('=ISBLANK(A1)').value).toBe(false);
    });

    it('should return FALSE for literal value', () => {
      expect(calc('=ISBLANK(0)').value).toBe(false);
    });

    it('should return FALSE for empty string', () => {
      expect(calc('=ISBLANK("")').value).toBe(false);
    });
  });

  describe('ISERROR', () => {
    it('should return TRUE for #DIV/0!', () => {
      expect(calc('=ISERROR(1/0)').value).toBe(true);
    });

    it('should return TRUE for #NAME?', () => {
      expect(calc('=ISERROR(UNKNOWN())').value).toBe(true);
    });

    it('should return FALSE for valid value', () => {
      expect(calc('=ISERROR(10)').value).toBe(false);
    });

    it('should return FALSE for text', () => {
      expect(calc('=ISERROR("text")').value).toBe(false);
    });
  });

  describe('ISNA', () => {
    it('should return FALSE for non-#N/A values', () => {
      expect(calc('=ISNA(1/0)').value).toBe(false);
    });

    it('should return FALSE for numbers', () => {
      expect(calc('=ISNA(10)').value).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // N Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('N', () => {
    it('should return number as-is', () => {
      expect(calc('=N(123)').value).toBe(123);
    });

    it('should return 1 for TRUE', () => {
      expect(calc('=N(TRUE)').value).toBe(1);
    });

    it('should return 0 for FALSE', () => {
      expect(calc('=N(FALSE)').value).toBe(0);
    });

    it('should return 0 for text', () => {
      expect(calc('=N("text")').value).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(calc('=N("")').value).toBe(0);
    });
  });
});
