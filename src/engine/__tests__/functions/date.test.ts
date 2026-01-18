import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Date Functions', () => {
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
  // DATE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DATE', () => {
    it('should create date from year, month, day', () => {
      const result = calc('=DATE(2024,1,15)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle month overflow', () => {
      // Month 13 should roll over to next year
      const result = calc('=DATE(2024,13,1)');
      expect(result.error).toBeUndefined();
    });

    it('should handle day overflow', () => {
      // Day 32 in January should roll over to February
      const result = calc('=DATE(2024,1,32)');
      expect(result.error).toBeUndefined();
    });

    it('should handle negative month', () => {
      const result = calc('=DATE(2024,-1,1)');
      expect(result.error).toBeUndefined();
    });

    it('should handle two-digit year', () => {
      const result = calc('=DATE(24,1,1)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TODAY/NOW Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TODAY', () => {
    it('should return current date as serial number', () => {
      const result = calc('=TODAY()');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should return integer (no time component)', () => {
      const result = calc('=TODAY()');
      expect(Number.isInteger(result.value)).toBe(true);
    });
  });

  describe('NOW', () => {
    it('should return current date and time', () => {
      const result = calc('=NOW()');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should include time component (not integer)', () => {
      const result = calc('=NOW()');
      // NOW includes time, so it should have a decimal part
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // YEAR/MONTH/DAY Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('YEAR', () => {
    it('should extract year from date', () => {
      const result = calc('=YEAR(DATE(2024,6,15))');
      expect(result.value).toBe(2024);
    });

    it('should handle date serial number', () => {
      const result = calc('=YEAR(44927)'); // Jan 1, 2023
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle leap year', () => {
      const result = calc('=YEAR(DATE(2024,2,29))');
      expect(result.value).toBe(2024);
    });
  });

  describe('MONTH', () => {
    it('should extract month from date', () => {
      const result = calc('=MONTH(DATE(2024,6,15))');
      expect(result.value).toBe(6);
    });

    it('should return 1-12 range', () => {
      for (let m = 1; m <= 12; m++) {
        const result = calc(`=MONTH(DATE(2024,${m},1))`);
        expect(result.value).toBe(m);
      }
    });
  });

  describe('DAY', () => {
    it('should extract day from date', () => {
      const result = calc('=DAY(DATE(2024,6,15))');
      expect(result.value).toBe(15);
    });

    it('should handle end of month', () => {
      const result = calc('=DAY(DATE(2024,1,31))');
      expect(result.value).toBe(31);
    });

    it('should handle first day', () => {
      const result = calc('=DAY(DATE(2024,1,1))');
      expect(result.value).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUR/MINUTE/SECOND Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('HOUR', () => {
    it('should extract hour from time', () => {
      const result = calc('=HOUR(TIME(14,30,45))');
      expect(result.value).toBe(14);
    });

    it('should return 0-23 range', () => {
      const result = calc('=HOUR(TIME(0,0,0))');
      expect(result.value).toBe(0);
    });

    it('should handle midnight', () => {
      const result = calc('=HOUR(0)');
      expect(result.value).toBe(0);
    });
  });

  describe('MINUTE', () => {
    it('should extract minute from time', () => {
      const result = calc('=MINUTE(TIME(14,30,45))');
      expect(result.value).toBe(30);
    });

    it('should return 0-59 range', () => {
      const result = calc('=MINUTE(TIME(0,59,0))');
      expect(result.value).toBe(59);
    });
  });

  describe('SECOND', () => {
    it('should extract second from time', () => {
      const result = calc('=SECOND(TIME(14,30,45))');
      expect(result.value).toBe(45);
    });

    it('should return 0-59 range', () => {
      const result = calc('=SECOND(TIME(0,0,59))');
      expect(result.value).toBe(59);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TIME', () => {
    it('should create time from hour, minute, second', () => {
      const result = calc('=TIME(12,30,45)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should return fraction of day', () => {
      const result = calc('=TIME(12,0,0)');
      expect(result.value).toBe(0.5); // Noon is half a day
    });

    it('should handle overflow hours', () => {
      const result = calc('=TIME(25,0,0)');
      expect(result.error).toBeUndefined();
    });

    it('should handle midnight', () => {
      const result = calc('=TIME(0,0,0)');
      expect(result.value).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEKDAY Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('WEEKDAY', () => {
    it('should return weekday number', () => {
      const result = calc('=WEEKDAY(DATE(2024,1,1))'); // Monday
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should default to type 1 (Sunday=1)', () => {
      const result = calc('=WEEKDAY(DATE(2024,1,7))'); // Sunday
      expect(result.value).toBe(1);
    });

    it('should support type 2 (Monday=1)', () => {
      const result = calc('=WEEKDAY(DATE(2024,1,1),2)'); // Monday
      expect(result.value).toBe(1);
    });

    it('should support type 3 (Monday=0)', () => {
      const result = calc('=WEEKDAY(DATE(2024,1,1),3)'); // Monday
      expect(result.value).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEKNUM Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('WEEKNUM', () => {
    it('should return week number', () => {
      const result = calc('=WEEKNUM(DATE(2024,1,15))');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should return 1 for first week', () => {
      const result = calc('=WEEKNUM(DATE(2024,1,1))');
      expect(result.value).toBe(1);
    });

    it('should handle year end', () => {
      const result = calc('=WEEKNUM(DATE(2024,12,31))');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDATE/EOMONTH Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('EDATE', () => {
    it('should add months to date', () => {
      const result = calc('=EDATE(DATE(2024,1,15),3)');
      expect(result.error).toBeUndefined();
    });

    it('should subtract months with negative', () => {
      const result = calc('=EDATE(DATE(2024,6,15),-3)');
      expect(result.error).toBeUndefined();
    });

    it('should handle month end adjustment', () => {
      // Jan 31 + 1 month should give Feb 29 (2024 is leap year)
      const result = calc('=EDATE(DATE(2024,1,31),1)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('EOMONTH', () => {
    it('should return end of month', () => {
      const result = calc('=EOMONTH(DATE(2024,1,15),0)');
      expect(result.error).toBeUndefined();
    });

    it('should return end of future month', () => {
      const result = calc('=EOMONTH(DATE(2024,1,15),2)');
      expect(result.error).toBeUndefined();
    });

    it('should handle February in leap year', () => {
      const result = calc('=DAY(EOMONTH(DATE(2024,2,1),0))');
      expect(result.value).toBe(29);
    });

    it('should handle February in non-leap year', () => {
      const result = calc('=DAY(EOMONTH(DATE(2023,2,1),0))');
      expect(result.value).toBe(28);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DATEDIF Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DATEDIF', () => {
    it('should calculate difference in years', () => {
      const result = calc('=DATEDIF(DATE(2020,1,1),DATE(2024,1,1),"Y")');
      expect(result.value).toBe(4);
    });

    it('should calculate difference in months', () => {
      const result = calc('=DATEDIF(DATE(2024,1,1),DATE(2024,6,1),"M")');
      expect(result.value).toBe(5);
    });

    it('should calculate difference in days', () => {
      const result = calc('=DATEDIF(DATE(2024,1,1),DATE(2024,1,15),"D")');
      expect(result.value).toBe(14);
    });

    it('should return error if start > end', () => {
      const result = calc('=DATEDIF(DATE(2024,6,1),DATE(2024,1,1),"D")');
      expect(result.error).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKDAY Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('WORKDAY', () => {
    it('should add work days', () => {
      const result = calc('=WORKDAY(DATE(2024,1,1),5)');
      expect(result.error).toBeUndefined();
    });

    it('should skip weekends', () => {
      // Starting Monday, 5 work days should end on Monday
      const result = calc('=WORKDAY(DATE(2024,1,1),5)');
      expect(result.error).toBeUndefined();
    });

    it('should handle negative days', () => {
      const result = calc('=WORKDAY(DATE(2024,1,15),-5)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORKDAYS Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NETWORKDAYS', () => {
    it('should count work days between dates', () => {
      const result = calc('=NETWORKDAYS(DATE(2024,1,1),DATE(2024,1,31))');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should return 1 for same day (if workday)', () => {
      const result = calc('=NETWORKDAYS(DATE(2024,1,2),DATE(2024,1,2))'); // Tuesday
      expect(result.value).toBe(1);
    });

    it('should return 0 for weekend', () => {
      const result = calc('=NETWORKDAYS(DATE(2024,1,6),DATE(2024,1,6))'); // Saturday
      expect(result.value).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DAYS/DAYS360 Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DAYS', () => {
    it('should calculate days between dates', () => {
      const result = calc('=DAYS(DATE(2024,1,31),DATE(2024,1,1))');
      expect(result.value).toBe(30);
    });

    it('should return negative for reversed dates', () => {
      const result = calc('=DAYS(DATE(2024,1,1),DATE(2024,1,31))');
      expect(result.value).toBe(-30);
    });

    it('should return 0 for same date', () => {
      const result = calc('=DAYS(DATE(2024,1,1),DATE(2024,1,1))');
      expect(result.value).toBe(0);
    });
  });

  describe('DAYS360', () => {
    it('should calculate days using 360-day year', () => {
      const result = calc('=DAYS360(DATE(2024,1,1),DATE(2024,12,31))');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle US method (default)', () => {
      const result = calc('=DAYS360(DATE(2024,1,30),DATE(2024,2,28))');
      expect(result.error).toBeUndefined();
    });

    it('should handle European method', () => {
      const result = calc('=DAYS360(DATE(2024,1,30),DATE(2024,2,28),TRUE)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // YEARFRAC Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('YEARFRAC', () => {
    it('should calculate fraction of year', () => {
      const result = calc('=YEARFRAC(DATE(2024,1,1),DATE(2024,7,1))');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(0.5, 1);
    });

    it('should handle different basis options', () => {
      // Basis 0: US (NASD) 30/360
      const result0 = calc('=YEARFRAC(DATE(2024,1,1),DATE(2024,12,31),0)');
      expect(result0.error).toBeUndefined();

      // Basis 1: Actual/actual
      const result1 = calc('=YEARFRAC(DATE(2024,1,1),DATE(2024,12,31),1)');
      expect(result1.error).toBeUndefined();

      // Basis 2: Actual/360
      const result2 = calc('=YEARFRAC(DATE(2024,1,1),DATE(2024,12,31),2)');
      expect(result2.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ISOWEEKNUM Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ISOWEEKNUM', () => {
    it('should return ISO week number', () => {
      const result = calc('=ISOWEEKNUM(DATE(2024,1,1))');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should return 1-53 range', () => {
      const result = calc('=ISOWEEKNUM(DATE(2024,12,31))');
      expect(result.error).toBeUndefined();
      const value = result.value as number;
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(53);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DATEVALUE/TIMEVALUE Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DATEVALUE', () => {
    it('should convert date string to serial number', () => {
      const result = calc('=DATEVALUE("2024-01-15")');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle various date formats', () => {
      const result1 = calc('=DATEVALUE("January 15, 2024")');
      expect(result1.error).toBeUndefined();

      const result2 = calc('=DATEVALUE("1/15/2024")');
      expect(result2.error).toBeUndefined();
    });

    it('should return error for invalid date', () => {
      const result = calc('=DATEVALUE("not a date")');
      expect(result.error).toBeDefined();
    });
  });

  describe('TIMEVALUE', () => {
    it('should convert time string to decimal', () => {
      const result = calc('=TIMEVALUE("12:00:00")');
      expect(result.value).toBe(0.5);
    });

    it('should handle AM/PM', () => {
      const result = calc('=TIMEVALUE("6:00 PM")');
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid time', () => {
      const result = calc('=TIMEVALUE("not a time")');
      expect(result.error).toBeDefined();
    });
  });
});
