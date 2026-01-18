import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Text Functions', () => {
  let engine: FormulaEngine;
  let mockDataProvider: CellDataProvider;

  beforeEach(() => {
    engine = new FormulaEngine();
    mockDataProvider = {
      getCellValue: vi.fn(() => null),
      getCellFormula: vi.fn(() => undefined),
    };
  });

  const calc = (formula: string) => engine.calculate(formula, 'sheet1', 0, 0, mockDataProvider);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCATENATE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CONCATENATE', () => {
    it('should concatenate strings', () => {
      expect(calc('=CONCATENATE("Hello"," ","World")').value).toBe('Hello World');
    });

    it('should concatenate numbers', () => {
      expect(calc('=CONCATENATE(1,2,3)').value).toBe('123');
    });

    it('should concatenate mixed types', () => {
      expect(calc('=CONCATENATE("Value: ",100)').value).toBe('Value: 100');
    });

    it('should handle single argument', () => {
      expect(calc('=CONCATENATE("Hello")').value).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(calc('=CONCATENATE("A","","B")').value).toBe('AB');
    });

    it('should handle booleans', () => {
      expect(calc('=CONCATENATE("Result: ",TRUE)').value).toBe('Result: TRUE');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LEN Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('LEN', () => {
    it('should return string length', () => {
      expect(calc('=LEN("Hello")').value).toBe(5);
    });

    it('should handle empty string', () => {
      expect(calc('=LEN("")').value).toBe(0);
    });

    it('should handle spaces', () => {
      expect(calc('=LEN("  ")').value).toBe(2);
    });

    it('should handle unicode', () => {
      expect(calc('=LEN("Héllo")').value).toBe(5);
    });

    it('should convert numbers to string', () => {
      expect(calc('=LEN(12345)').value).toBe(5);
    });

    it('should handle boolean', () => {
      expect(calc('=LEN(TRUE)').value).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UPPER/LOWER/PROPER Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('UPPER', () => {
    it('should convert to uppercase', () => {
      expect(calc('=UPPER("hello")').value).toBe('HELLO');
    });

    it('should handle mixed case', () => {
      expect(calc('=UPPER("HeLLo WoRLd")').value).toBe('HELLO WORLD');
    });

    it('should handle already uppercase', () => {
      expect(calc('=UPPER("HELLO")').value).toBe('HELLO');
    });

    it('should handle numbers in string', () => {
      expect(calc('=UPPER("abc123")').value).toBe('ABC123');
    });

    it('should handle empty string', () => {
      expect(calc('=UPPER("")').value).toBe('');
    });
  });

  describe('LOWER', () => {
    it('should convert to lowercase', () => {
      expect(calc('=LOWER("HELLO")').value).toBe('hello');
    });

    it('should handle mixed case', () => {
      expect(calc('=LOWER("HeLLo WoRLd")').value).toBe('hello world');
    });

    it('should handle already lowercase', () => {
      expect(calc('=LOWER("hello")').value).toBe('hello');
    });

    it('should handle numbers in string', () => {
      expect(calc('=LOWER("ABC123")').value).toBe('abc123');
    });
  });

  describe('PROPER', () => {
    it('should capitalize first letter of each word', () => {
      expect(calc('=PROPER("hello world")').value).toBe('Hello World');
    });

    it('should handle all uppercase', () => {
      expect(calc('=PROPER("HELLO WORLD")').value).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(calc('=PROPER("hELLO wORLD")').value).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(calc('=PROPER("hello")').value).toBe('Hello');
    });

    it('should handle punctuation', () => {
      expect(calc('=PROPER("hello-world")').value).toBe('Hello-World');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TRIM Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TRIM', () => {
    it('should remove leading spaces', () => {
      expect(calc('=TRIM("  hello")').value).toBe('hello');
    });

    it('should remove trailing spaces', () => {
      expect(calc('=TRIM("hello  ")').value).toBe('hello');
    });

    it('should remove both leading and trailing', () => {
      expect(calc('=TRIM("  hello  ")').value).toBe('hello');
    });

    it('should reduce multiple internal spaces to one', () => {
      expect(calc('=TRIM("hello   world")').value).toBe('hello world');
    });

    it('should handle already trimmed', () => {
      expect(calc('=TRIM("hello")').value).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(calc('=TRIM("")').value).toBe('');
    });

    it('should handle all spaces', () => {
      expect(calc('=TRIM("   ")').value).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LEFT/RIGHT/MID Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('LEFT', () => {
    it('should extract left characters', () => {
      expect(calc('=LEFT("Hello",2)').value).toBe('He');
    });

    it('should handle default length', () => {
      expect(calc('=LEFT("Hello")').value).toBe('H');
    });

    it('should handle length exceeding string', () => {
      expect(calc('=LEFT("Hi",10)').value).toBe('Hi');
    });

    it('should handle zero length', () => {
      expect(calc('=LEFT("Hello",0)').value).toBe('');
    });

    it('should handle empty string', () => {
      expect(calc('=LEFT("",5)').value).toBe('');
    });
  });

  describe('RIGHT', () => {
    it('should extract right characters', () => {
      expect(calc('=RIGHT("Hello",2)').value).toBe('lo');
    });

    it('should handle default length', () => {
      expect(calc('=RIGHT("Hello")').value).toBe('o');
    });

    it('should handle length exceeding string', () => {
      expect(calc('=RIGHT("Hi",10)').value).toBe('Hi');
    });

    it('should handle zero length', () => {
      expect(calc('=RIGHT("Hello",0)').value).toBe('');
    });
  });

  describe('MID', () => {
    it('should extract middle characters', () => {
      expect(calc('=MID("Hello",2,3)').value).toBe('ell');
    });

    it('should handle start at beginning', () => {
      expect(calc('=MID("Hello",1,2)').value).toBe('He');
    });

    it('should handle length exceeding remaining', () => {
      expect(calc('=MID("Hello",4,10)').value).toBe('lo');
    });

    it('should handle start beyond string', () => {
      expect(calc('=MID("Hello",10,2)').value).toBe('');
    });

    it('should handle zero length', () => {
      expect(calc('=MID("Hello",2,0)').value).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FIND/SEARCH Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('FIND', () => {
    it('should find substring position', () => {
      expect(calc('=FIND("l","Hello")').value).toBe(3);
    });

    it('should be case sensitive', () => {
      expect(calc('=FIND("L","Hello")').error).toBeDefined();
    });

    it('should find from start position', () => {
      expect(calc('=FIND("l","Hello",4)').value).toBe(4);
    });

    it('should return error if not found', () => {
      expect(calc('=FIND("x","Hello")').error).toBeDefined();
    });

    it('should find multi-character substring', () => {
      expect(calc('=FIND("lo","Hello")').value).toBe(4);
    });
  });

  describe('SEARCH', () => {
    it('should find substring position case insensitively', () => {
      expect(calc('=SEARCH("L","Hello")').value).toBe(3);
    });

    it('should find lowercase in uppercase', () => {
      expect(calc('=SEARCH("hello","HELLO WORLD")').value).toBe(1);
    });

    it('should find from start position', () => {
      expect(calc('=SEARCH("L","Hello World",5)').value).toBe(10);
    });

    it('should support wildcards *', () => {
      // Implementation dependent
    });

    it('should support wildcards ?', () => {
      // Implementation dependent
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSTITUTE/REPLACE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SUBSTITUTE', () => {
    it('should substitute all occurrences', () => {
      expect(calc('=SUBSTITUTE("Hello","l","L")').value).toBe('HeLLo');
    });

    it('should substitute specific occurrence', () => {
      expect(calc('=SUBSTITUTE("Hello","l","L",1)').value).toBe('HeLlo');
    });

    it('should handle no match', () => {
      expect(calc('=SUBSTITUTE("Hello","x","y")').value).toBe('Hello');
    });

    it('should substitute with empty string', () => {
      expect(calc('=SUBSTITUTE("Hello","l","")').value).toBe('Heo');
    });

    it('should be case sensitive', () => {
      expect(calc('=SUBSTITUTE("Hello","L","X")').value).toBe('Hello');
    });
  });

  describe('REPLACE', () => {
    it('should replace characters at position', () => {
      expect(calc('=REPLACE("Hello",2,3,"XYZ")').value).toBe('HXYZo');
    });

    it('should handle replacement at start', () => {
      expect(calc('=REPLACE("Hello",1,2,"XY")').value).toBe('XYllo');
    });

    it('should handle replacement at end', () => {
      expect(calc('=REPLACE("Hello",4,2,"XYZ")').value).toBe('HelXYZ');
    });

    it('should handle zero length replacement', () => {
      expect(calc('=REPLACE("Hello",3,0,"XY")').value).toBe('HeXYllo');
    });

    it('should handle empty replacement', () => {
      expect(calc('=REPLACE("Hello",2,3,"")').value).toBe('Ho');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REPT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('REPT', () => {
    it('should repeat string', () => {
      expect(calc('=REPT("ab",3)').value).toBe('ababab');
    });

    it('should handle zero repetitions', () => {
      expect(calc('=REPT("ab",0)').value).toBe('');
    });

    it('should handle one repetition', () => {
      expect(calc('=REPT("ab",1)').value).toBe('ab');
    });

    it('should handle single character', () => {
      expect(calc('=REPT("*",5)').value).toBe('*****');
    });

    it('should handle empty string', () => {
      expect(calc('=REPT("",5)').value).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TEXT', () => {
    it('should format number with decimal places', () => {
      expect(calc('=TEXT(1234.5,"0.00")').value).toBe('1234.50');
    });

    it('should format number with thousands separator', () => {
      const result = calc('=TEXT(1234567,"#,##0")').value;
      expect(result).toBe('1,234,567');
    });

    it('should format percentage', () => {
      expect(calc('=TEXT(0.25,"0%")').value).toBe('25%');
    });

    it('should format with leading zeros', () => {
      expect(calc('=TEXT(42,"000")').value).toBe('042');
    });

    it('should format currency', () => {
      const result = calc('=TEXT(1234.5,"$#,##0.00")').value;
      expect(result).toBe('$1,234.50');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('VALUE', () => {
    it('should convert string to number', () => {
      expect(calc('=VALUE("123")').value).toBe(123);
    });

    it('should convert decimal string', () => {
      expect(calc('=VALUE("123.45")').value).toBe(123.45);
    });

    it('should convert negative string', () => {
      expect(calc('=VALUE("-100")').value).toBe(-100);
    });

    it('should handle percentage string', () => {
      expect(calc('=VALUE("50%")').value).toBe(0.5);
    });

    it('should return #VALUE! for non-numeric', () => {
      expect(calc('=VALUE("abc")').error).toBe('#VALUE!');
    });

    it('should handle number input', () => {
      expect(calc('=VALUE(123)').value).toBe(123);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // T Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('T', () => {
    it('should return text as-is', () => {
      expect(calc('=T("Hello")').value).toBe('Hello');
    });

    it('should return empty for number', () => {
      expect(calc('=T(123)').value).toBe('');
    });

    it('should return empty for boolean', () => {
      expect(calc('=T(TRUE)').value).toBe('');
    });

    it('should return empty for error', () => {
      // Implementation dependent
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE/CHAR Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CODE', () => {
    it('should return ASCII code', () => {
      expect(calc('=CODE("A")').value).toBe(65);
    });

    it('should return code of first character', () => {
      expect(calc('=CODE("ABC")').value).toBe(65);
    });

    it('should handle lowercase', () => {
      expect(calc('=CODE("a")').value).toBe(97);
    });

    it('should handle space', () => {
      expect(calc('=CODE(" ")').value).toBe(32);
    });
  });

  describe('CHAR', () => {
    it('should return character from ASCII code', () => {
      expect(calc('=CHAR(65)').value).toBe('A');
    });

    it('should handle lowercase code', () => {
      expect(calc('=CHAR(97)').value).toBe('a');
    });

    it('should handle space code', () => {
      expect(calc('=CHAR(32)').value).toBe(' ');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXACT Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('EXACT', () => {
    it('should compare identical strings', () => {
      expect(calc('=EXACT("Hello","Hello")').value).toBe(true);
    });

    it('should be case sensitive', () => {
      expect(calc('=EXACT("Hello","hello")').value).toBe(false);
    });

    it('should compare different strings', () => {
      expect(calc('=EXACT("Hello","World")').value).toBe(false);
    });

    it('should compare numbers', () => {
      expect(calc('=EXACT(123,123)').value).toBe(true);
    });
  });
});
