import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormulaEngine, CellDataProvider } from '../../FormulaEngine';
import { FormulaValue } from '../../types';

describe('Financial Functions', () => {
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
  // Present Value / Future Value Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PV', () => {
    it('should calculate present value', () => {
      // $100/month for 5 years at 5% annual (monthly rate)
      const result = calc('=PV(0.05/12,60,-100)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle future value argument', () => {
      const result = calc('=PV(0.05/12,60,-100,1000)');
      expect(result.error).toBeUndefined();
    });

    it('should handle type argument (beginning of period)', () => {
      const result = calc('=PV(0.05/12,60,-100,0,1)');
      expect(result.error).toBeUndefined();
    });

    it('should return 0 for 0 rate', () => {
      const result = calc('=PV(0,12,-100)');
      expect(result.value).toBeCloseTo(1200, 2);
    });
  });

  describe('FV', () => {
    it('should calculate future value', () => {
      const result = calc('=FV(0.06/12,10,-200,-500)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle monthly deposits', () => {
      // $100/month for 1 year at 6% annual
      const result = calc('=FV(0.06/12,12,-100)');
      expect(result.error).toBeUndefined();
    });

    it('should handle beginning of period', () => {
      const result = calc('=FV(0.06/12,12,-100,0,1)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Payment Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PMT', () => {
    it('should calculate loan payment', () => {
      // $200,000 loan, 30 years, 6% annual rate
      const result = calc('=PMT(0.06/12,360,200000)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeLessThan(0); // Payment is negative
    });

    it('should calculate mortgage payment', () => {
      const result = calc('=PMT(0.05/12,360,300000)');
      expect(result.error).toBeUndefined();
      // Approximately -$1610 per month
      expect(result.value).toBeCloseTo(-1610.46, 0);
    });

    it('should handle future value', () => {
      const result = calc('=PMT(0.08/12,120,0,-50000)');
      expect(result.error).toBeUndefined();
    });

    it('should handle 0 rate', () => {
      const result = calc('=PMT(0,12,1200)');
      expect(result.value).toBeCloseTo(-100, 2);
    });
  });

  describe('IPMT', () => {
    it('should calculate interest portion of payment', () => {
      // First month of $200,000 loan at 6%
      const result = calc('=IPMT(0.06/12,1,360,200000)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(-1000, 0); // 6%/12 * 200000
    });

    it('should decrease interest over time', () => {
      const first = calc('=IPMT(0.06/12,1,360,200000)');
      const last = calc('=IPMT(0.06/12,360,360,200000)');
      expect(Math.abs(first.value as number)).toBeGreaterThan(Math.abs(last.value as number));
    });
  });

  describe('PPMT', () => {
    it('should calculate principal portion of payment', () => {
      const result = calc('=PPMT(0.06/12,1,360,200000)');
      expect(result.error).toBeUndefined();
    });

    it('should increase principal over time', () => {
      const first = calc('=PPMT(0.06/12,1,360,200000)');
      const last = calc('=PPMT(0.06/12,360,360,200000)');
      expect(Math.abs(last.value as number)).toBeGreaterThan(Math.abs(first.value as number));
    });

    it('IPMT + PPMT should equal PMT', () => {
      const pmt = calc('=PMT(0.06/12,360,200000)').value as number;
      const ipmt = calc('=IPMT(0.06/12,1,360,200000)').value as number;
      const ppmt = calc('=PPMT(0.06/12,1,360,200000)').value as number;
      expect(ipmt + ppmt).toBeCloseTo(pmt, 5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Rate Calculations Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RATE', () => {
    it('should calculate interest rate', () => {
      // Find rate for $200,000 loan with $1199.10 payment over 360 months
      const result = calc('=RATE(360,-1199.10,200000)');
      expect(result.error).toBeUndefined();
      // Should be approximately 0.5% monthly (6% annual)
    });

    it('should handle guess parameter', () => {
      const result = calc('=RATE(360,-1199.10,200000,0,0,0.01)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('NPER', () => {
    it('should calculate number of periods', () => {
      // How long to pay off $200,000 at 6% with $1500/month
      const result = calc('=NPER(0.06/12,-1500,200000)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle savings goal', () => {
      // How long to save $10,000 with $200/month at 5%
      const result = calc('=NPER(0.05/12,-200,0,10000)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NPV and IRR Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('NPV', () => {
    it('should calculate net present value', () => {
      const result = calc('=NPV(0.1,100,200,300)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should handle investment scenario', () => {
      // Initial investment -1000, returns 200, 300, 400, 500
      const result = calc('=-1000+NPV(0.1,200,300,400,500)');
      expect(result.error).toBeUndefined();
    });

    it('should return sum for 0 rate', () => {
      const result = calc('=NPV(0,100,200,300)');
      expect(result.value).toBeCloseTo(600, 2);
    });
  });

  describe('IRR', () => {
    it('should calculate internal rate of return', () => {
      // Investment: -100, returns: 30, 40, 50
      const result = calc('=IRR({-100,30,40,50})');
      expect(result.error).toBeUndefined();
    });

    it('should handle guess parameter', () => {
      const result = calc('=IRR({-100,30,40,50},0.1)');
      expect(result.error).toBeUndefined();
    });

    it('should return error for no sign change', () => {
      const result = calc('=IRR({100,200,300})');
      expect(result.error).toBeDefined();
    });
  });

  describe('XNPV', () => {
    it('should calculate NPV with dates', () => {
      const result = calc('=XNPV(0.1,{-100,50,60},{DATE(2024,1,1),DATE(2024,6,1),DATE(2025,1,1)})');
      expect(result.error).toBeUndefined();
    });
  });

  describe('XIRR', () => {
    it('should calculate IRR with dates', () => {
      const result = calc('=XIRR({-100,50,60},{DATE(2024,1,1),DATE(2024,6,1),DATE(2025,1,1)})');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Depreciation Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('SLN', () => {
    it('should calculate straight-line depreciation', () => {
      // Cost: 30000, Salvage: 7500, Life: 10 years
      const result = calc('=SLN(30000,7500,10)');
      expect(result.value).toBe(2250);
    });

    it('should handle zero salvage', () => {
      const result = calc('=SLN(10000,0,5)');
      expect(result.value).toBe(2000);
    });
  });

  describe('DB', () => {
    it('should calculate declining balance depreciation', () => {
      // Cost: 1000000, Salvage: 100000, Life: 6 years, Period: 1
      const result = calc('=DB(1000000,100000,6,1)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });

    it('should decrease over time', () => {
      const first = calc('=DB(1000000,100000,6,1)');
      const last = calc('=DB(1000000,100000,6,6)');
      expect(first.value as number).toBeGreaterThan(last.value as number);
    });
  });

  describe('DDB', () => {
    it('should calculate double declining balance', () => {
      const result = calc('=DDB(2400,300,10*365,1)');
      expect(result.error).toBeUndefined();
    });

    it('should handle factor parameter', () => {
      const result = calc('=DDB(2400,300,10,1,2)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('SYD', () => {
    it('should calculate sum-of-years-digits depreciation', () => {
      // Cost: 30000, Salvage: 7500, Life: 10, Period: 1
      const result = calc('=SYD(30000,7500,10,1)');
      expect(result.error).toBeUndefined();
    });

    it('should decrease each period', () => {
      const first = calc('=SYD(30000,7500,10,1)');
      const last = calc('=SYD(30000,7500,10,10)');
      expect(first.value as number).toBeGreaterThan(last.value as number);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Interest and Effective Rate Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('EFFECT', () => {
    it('should calculate effective annual rate', () => {
      // 5% nominal, compounded monthly
      const result = calc('=EFFECT(0.05,12)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeGreaterThan(0.05);
    });

    it('should return nominal rate for annual compounding', () => {
      const result = calc('=EFFECT(0.05,1)');
      expect(result.value).toBeCloseTo(0.05, 5);
    });
  });

  describe('NOMINAL', () => {
    it('should calculate nominal rate', () => {
      // 5.116% effective, compounded monthly
      const result = calc('=NOMINAL(0.05116,12)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeCloseTo(0.05, 2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Bond Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PRICE', () => {
    it('should calculate bond price', () => {
      // Settlement, Maturity, Rate, Yield, Redemption, Frequency
      const result = calc('=PRICE(DATE(2024,1,1),DATE(2034,1,1),0.05,0.06,100,2)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });
  });

  describe('YIELD', () => {
    it('should calculate bond yield', () => {
      const result = calc('=YIELD(DATE(2024,1,1),DATE(2034,1,1),0.05,95,100,2)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('ACCRINT', () => {
    it('should calculate accrued interest', () => {
      const result = calc('=ACCRINT(DATE(2024,1,1),DATE(2024,7,1),DATE(2024,3,1),0.05,1000,2)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Dollar Conversion Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DOLLARDE', () => {
    it('should convert fractional to decimal', () => {
      // $1.02 in 1/8ths = $1.25
      const result = calc('=DOLLARDE(1.02,8)');
      expect(result.value).toBeCloseTo(1.25, 5);
    });

    it('should handle 16ths', () => {
      const result = calc('=DOLLARDE(1.08,16)');
      expect(result.value).toBeCloseTo(1.5, 5);
    });
  });

  describe('DOLLARFR', () => {
    it('should convert decimal to fractional', () => {
      const result = calc('=DOLLARFR(1.25,8)');
      expect(result.value).toBeCloseTo(1.02, 5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Treasury Bill Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('TBILLPRICE', () => {
    it('should calculate T-bill price', () => {
      const result = calc('=TBILLPRICE(DATE(2024,1,1),DATE(2024,7,1),0.05)');
      expect(result.error).toBeUndefined();
      expect(typeof result.value).toBe('number');
    });
  });

  describe('TBILLYIELD', () => {
    it('should calculate T-bill yield', () => {
      const result = calc('=TBILLYIELD(DATE(2024,1,1),DATE(2024,7,1),98)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('TBILLEQ', () => {
    it('should calculate T-bill equivalent yield', () => {
      const result = calc('=TBILLEQ(DATE(2024,1,1),DATE(2024,7,1),0.05)');
      expect(result.error).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cumulative Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('CUMIPMT', () => {
    it('should calculate cumulative interest', () => {
      // Rate, Nper, Pv, Start, End, Type
      const result = calc('=CUMIPMT(0.06/12,360,200000,1,12,0)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeLessThan(0);
    });

    it('should return total interest for full term', () => {
      const result = calc('=CUMIPMT(0.06/12,12,10000,1,12,0)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('CUMPRINC', () => {
    it('should calculate cumulative principal', () => {
      const result = calc('=CUMPRINC(0.06/12,360,200000,1,12,0)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeLessThan(0);
    });

    it('should sum to original principal', () => {
      const result = calc('=CUMPRINC(0.06/12,12,10000,1,12,0)');
      expect(result.value).toBeCloseTo(-10000, 0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Other Financial Functions Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('MIRR', () => {
    it('should calculate modified IRR', () => {
      const result = calc('=MIRR({-100,30,40,50},0.1,0.12)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('DISC', () => {
    it('should calculate discount rate', () => {
      const result = calc('=DISC(DATE(2024,1,1),DATE(2024,7,1),98,100)');
      expect(result.error).toBeUndefined();
    });
  });

  describe('PRICEDISC', () => {
    it('should calculate discounted price', () => {
      const result = calc('=PRICEDISC(DATE(2024,1,1),DATE(2024,7,1),0.05,100)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeLessThan(100);
    });
  });

  describe('RECEIVED', () => {
    it('should calculate amount received at maturity', () => {
      const result = calc('=RECEIVED(DATE(2024,1,1),DATE(2024,7,1),97,0.05)');
      expect(result.error).toBeUndefined();
      expect(result.value).toBeGreaterThan(97);
    });
  });

  describe('INTRATE', () => {
    it('should calculate interest rate for investment', () => {
      const result = calc('=INTRATE(DATE(2024,1,1),DATE(2024,7,1),97,100)');
      expect(result.error).toBeUndefined();
    });
  });
});
