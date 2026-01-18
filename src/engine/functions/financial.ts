import { FunctionDef, FormulaValue, FormulaError, EvalContext } from '../types';
import { toNumber, isError, flattenValues } from './utils';

export const financialFunctions: FunctionDef[] = [
  // PMT - payment for a loan
  {
    name: 'PMT',
    minArgs: 3,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const nper = toNumber(args[1]);
      const pv = toNumber(args[2]);
      const fv = args[3] !== undefined ? toNumber(args[3]) : 0;
      const type = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(rate)) return rate;
      if (isError(nper)) return nper;
      if (isError(pv)) return pv;
      if (isError(fv)) return fv;
      if (isError(type)) return type;

      const r = rate as number;
      const n = nper as number;
      const presentValue = pv as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      if (n === 0) {
        return new FormulaError('#NUM!', 'Number of periods cannot be zero');
      }

      if (r === 0) {
        return -(presentValue + futureValue) / n;
      }

      const pvif = Math.pow(1 + r, n);
      let pmt = (r * (presentValue * pvif + futureValue)) / (pvif - 1);

      if (paymentType === 1) {
        pmt = pmt / (1 + r);
      }

      return -pmt;
    },
  },

  // FV - future value
  {
    name: 'FV',
    minArgs: 3,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const nper = toNumber(args[1]);
      const pmt = toNumber(args[2]);
      const pv = args[3] !== undefined ? toNumber(args[3]) : 0;
      const type = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(rate)) return rate;
      if (isError(nper)) return nper;
      if (isError(pmt)) return pmt;
      if (isError(pv)) return pv;
      if (isError(type)) return type;

      const r = rate as number;
      const n = nper as number;
      const payment = pmt as number;
      const presentValue = pv as number;
      const paymentType = type as number;

      if (r === 0) {
        return -(presentValue + payment * n);
      }

      const pvif = Math.pow(1 + r, n);
      let fv = -presentValue * pvif - (payment * (1 + r * paymentType) * (pvif - 1)) / r;

      return fv;
    },
  },

  // PV - present value
  {
    name: 'PV',
    minArgs: 3,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const nper = toNumber(args[1]);
      const pmt = toNumber(args[2]);
      const fv = args[3] !== undefined ? toNumber(args[3]) : 0;
      const type = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(rate)) return rate;
      if (isError(nper)) return nper;
      if (isError(pmt)) return pmt;
      if (isError(fv)) return fv;
      if (isError(type)) return type;

      const r = rate as number;
      const n = nper as number;
      const payment = pmt as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      if (r === 0) {
        return -(futureValue + payment * n);
      }

      const pvif = Math.pow(1 + r, n);
      const pv = (-futureValue - (payment * (1 + r * paymentType) * (pvif - 1)) / r) / pvif;

      return pv;
    },
  },

  // NPV - net present value
  {
    name: 'NPV',
    minArgs: 2,
    maxArgs: 255,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      if (isError(rate)) return rate;

      const r = rate as number;
      const cashFlows = flattenValues(args.slice(1)).filter(
        (v): v is number => typeof v === 'number'
      );

      if (cashFlows.length === 0) {
        return new FormulaError('#VALUE!');
      }

      let npv = 0;
      for (let i = 0; i < cashFlows.length; i++) {
        npv += cashFlows[i] / Math.pow(1 + r, i + 1);
      }

      return npv;
    },
  },

  // IRR - internal rate of return
  {
    name: 'IRR',
    minArgs: 1,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const cashFlows = flattenValues([args[0]]).filter(
        (v): v is number => typeof v === 'number'
      );
      const guess = args[1] !== undefined ? toNumber(args[1]) : 0.1;

      if (isError(guess)) return guess;
      if (cashFlows.length < 2) {
        return new FormulaError('#NUM!', 'IRR requires at least 2 cash flows');
      }

      // Newton-Raphson method
      let rate = guess as number;
      const maxIterations = 100;
      const tolerance = 1e-10;

      for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;

        for (let j = 0; j < cashFlows.length; j++) {
          const pvif = Math.pow(1 + rate, j);
          npv += cashFlows[j] / pvif;
          if (j > 0) {
            dnpv -= (j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
          }
        }

        if (Math.abs(dnpv) < tolerance) {
          return new FormulaError('#NUM!', 'IRR calculation did not converge');
        }

        const newRate = rate - npv / dnpv;

        if (Math.abs(newRate - rate) < tolerance) {
          return newRate;
        }

        rate = newRate;
      }

      return new FormulaError('#NUM!', 'IRR calculation did not converge');
    },
  },

  // RATE - interest rate per period
  {
    name: 'RATE',
    minArgs: 3,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const nper = toNumber(args[0]);
      const pmt = toNumber(args[1]);
      const pv = toNumber(args[2]);
      const fv = args[3] !== undefined ? toNumber(args[3]) : 0;
      const type = args[4] !== undefined ? toNumber(args[4]) : 0;
      const guess = args[5] !== undefined ? toNumber(args[5]) : 0.1;

      if (isError(nper)) return nper;
      if (isError(pmt)) return pmt;
      if (isError(pv)) return pv;
      if (isError(fv)) return fv;
      if (isError(type)) return type;
      if (isError(guess)) return guess;

      const n = nper as number;
      const payment = pmt as number;
      const presentValue = pv as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      // Newton-Raphson method
      let rate = guess as number;
      const maxIterations = 100;
      const tolerance = 1e-10;

      for (let i = 0; i < maxIterations; i++) {
        const pvif = Math.pow(1 + rate, n);
        const y =
          presentValue * pvif +
          (payment * (1 + rate * paymentType) * (pvif - 1)) / rate +
          futureValue;
        const dy =
          n * presentValue * Math.pow(1 + rate, n - 1) +
          (payment *
            (1 + rate * paymentType) *
            ((n * Math.pow(1 + rate, n - 1) * rate - pvif + 1) / (rate * rate))) +
          (payment * paymentType * (pvif - 1)) / rate;

        if (Math.abs(dy) < tolerance) {
          return new FormulaError('#NUM!', 'RATE calculation did not converge');
        }

        const newRate = rate - y / dy;

        if (Math.abs(newRate - rate) < tolerance) {
          return newRate;
        }

        rate = newRate;
      }

      return new FormulaError('#NUM!', 'RATE calculation did not converge');
    },
  },

  // NPER - number of periods
  {
    name: 'NPER',
    minArgs: 3,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const pmt = toNumber(args[1]);
      const pv = toNumber(args[2]);
      const fv = args[3] !== undefined ? toNumber(args[3]) : 0;
      const type = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(rate)) return rate;
      if (isError(pmt)) return pmt;
      if (isError(pv)) return pv;
      if (isError(fv)) return fv;
      if (isError(type)) return type;

      const r = rate as number;
      const payment = pmt as number;
      const presentValue = pv as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      if (r === 0) {
        if (payment === 0) {
          return new FormulaError('#NUM!');
        }
        return -(presentValue + futureValue) / payment;
      }

      const pmtAdj = payment * (1 + r * paymentType);
      const num = pmtAdj - futureValue * r;
      const den = presentValue * r + pmtAdj;

      // The ratio num/den must be positive for log to work
      const ratio = num / den;
      if (ratio <= 0) {
        return new FormulaError('#NUM!');
      }

      return Math.log(ratio) / Math.log(1 + r);
    },
  },

  // IPMT - interest payment for a period
  {
    name: 'IPMT',
    minArgs: 4,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const per = toNumber(args[1]);
      const nper = toNumber(args[2]);
      const pv = toNumber(args[3]);
      const fv = args[4] !== undefined ? toNumber(args[4]) : 0;
      const type = args[5] !== undefined ? toNumber(args[5]) : 0;

      if (isError(rate)) return rate;
      if (isError(per)) return per;
      if (isError(nper)) return nper;
      if (isError(pv)) return pv;
      if (isError(fv)) return fv;
      if (isError(type)) return type;

      const r = rate as number;
      const period = per as number;
      const n = nper as number;
      const presentValue = pv as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      if (period < 1 || period > n) {
        return new FormulaError('#NUM!', 'Period must be between 1 and nper');
      }

      // Calculate PMT first (negative for loans with positive pv)
      let pmt: number;
      if (r === 0) {
        pmt = -(presentValue + futureValue) / n;
      } else {
        const pvif = Math.pow(1 + r, n);
        pmt = -(r * (presentValue * pvif + futureValue)) / (pvif - 1);
        if (paymentType === 1) {
          pmt = pmt / (1 + r);
        }
      }

      // Calculate balance at start of period
      let balance = presentValue;
      for (let i = 1; i < period; i++) {
        if (paymentType === 0) {
          balance = balance * (1 + r) + pmt;
        } else {
          balance = (balance + pmt) * (1 + r);
        }
      }

      // Interest for the period (negative for loan outflow)
      if (paymentType === 1 && period === 1) {
        return 0;
      }

      return -balance * r;
    },
  },

  // PPMT - principal payment for a period
  {
    name: 'PPMT',
    minArgs: 4,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const per = toNumber(args[1]);
      const nper = toNumber(args[2]);
      const pv = toNumber(args[3]);
      const fv = args[4] !== undefined ? toNumber(args[4]) : 0;
      const type = args[5] !== undefined ? toNumber(args[5]) : 0;

      if (isError(rate)) return rate;
      if (isError(per)) return per;
      if (isError(nper)) return nper;
      if (isError(pv)) return pv;
      if (isError(fv)) return fv;
      if (isError(type)) return type;

      const r = rate as number;
      const period = per as number;
      const n = nper as number;
      const presentValue = pv as number;
      const futureValue = fv as number;
      const paymentType = type as number;

      if (period < 1 || period > n) {
        return new FormulaError('#NUM!', 'Period must be between 1 and nper');
      }

      // Calculate PMT (negative for loans with positive pv)
      let pmt: number;
      if (r === 0) {
        pmt = -(presentValue + futureValue) / n;
      } else {
        const pvif = Math.pow(1 + r, n);
        pmt = -(r * (presentValue * pvif + futureValue)) / (pvif - 1);
        if (paymentType === 1) {
          pmt = pmt / (1 + r);
        }
      }

      // Calculate balance at start of period
      let balance = presentValue;
      for (let i = 1; i < period; i++) {
        if (paymentType === 0) {
          balance = balance * (1 + r) + pmt;
        } else {
          balance = (balance + pmt) * (1 + r);
        }
      }

      let ipmt: number;
      if (paymentType === 1 && period === 1) {
        ipmt = 0;
      } else {
        ipmt = -balance * r; // Negative for loan outflow
      }

      // PPMT = PMT - IPMT
      return pmt - ipmt;
    },
  },

  // SLN - straight-line depreciation
  {
    name: 'SLN',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const cost = toNumber(args[0]);
      const salvage = toNumber(args[1]);
      const life = toNumber(args[2]);

      if (isError(cost)) return cost;
      if (isError(salvage)) return salvage;
      if (isError(life)) return life;

      const lifeVal = life as number;
      if (lifeVal === 0) {
        return new FormulaError('#DIV/0!');
      }

      return ((cost as number) - (salvage as number)) / lifeVal;
    },
  },

  // DB - declining balance depreciation
  {
    name: 'DB',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const cost = toNumber(args[0]);
      const salvage = toNumber(args[1]);
      const life = toNumber(args[2]);
      const period = toNumber(args[3]);
      const month = args[4] !== undefined ? toNumber(args[4]) : 12;

      if (isError(cost)) return cost;
      if (isError(salvage)) return salvage;
      if (isError(life)) return life;
      if (isError(period)) return period;
      if (isError(month)) return month;

      const costVal = cost as number;
      const salvageVal = salvage as number;
      const lifeVal = life as number;
      const periodVal = period as number;
      const monthVal = month as number;

      if (lifeVal <= 0 || periodVal <= 0 || periodVal > lifeVal + 1) {
        return new FormulaError('#NUM!');
      }

      // Calculate rate
      const rate = Math.round((1 - Math.pow(salvageVal / costVal, 1 / lifeVal)) * 1000) / 1000;

      let totalDepreciation = 0;
      let bookValue = costVal;

      for (let i = 1; i <= periodVal; i++) {
        let depreciation: number;
        if (i === 1) {
          depreciation = (costVal * rate * monthVal) / 12;
        } else if (i === lifeVal + 1) {
          depreciation = bookValue - salvageVal;
        } else {
          depreciation = bookValue * rate;
        }

        totalDepreciation = depreciation;
        bookValue -= depreciation;
      }

      return totalDepreciation;
    },
  },

  // DDB - double declining balance depreciation
  {
    name: 'DDB',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const cost = toNumber(args[0]);
      const salvage = toNumber(args[1]);
      const life = toNumber(args[2]);
      const period = toNumber(args[3]);
      const factor = args[4] !== undefined ? toNumber(args[4]) : 2;

      if (isError(cost)) return cost;
      if (isError(salvage)) return salvage;
      if (isError(life)) return life;
      if (isError(period)) return period;
      if (isError(factor)) return factor;

      const costVal = cost as number;
      const salvageVal = salvage as number;
      const lifeVal = life as number;
      const periodVal = period as number;
      const factorVal = factor as number;

      if (lifeVal <= 0 || periodVal <= 0 || periodVal > lifeVal) {
        return new FormulaError('#NUM!');
      }

      const rate = factorVal / lifeVal;
      let bookValue = costVal;
      let depreciation = 0;

      for (let i = 1; i <= periodVal; i++) {
        depreciation = Math.min(bookValue * rate, bookValue - salvageVal);
        depreciation = Math.max(depreciation, 0);
        bookValue -= depreciation;
      }

      return depreciation;
    },
  },

  // SYD - sum of years digits depreciation
  {
    name: 'SYD',
    minArgs: 4,
    maxArgs: 4,
    fn: (args: FormulaValue[]): FormulaValue => {
      const cost = toNumber(args[0]);
      const salvage = toNumber(args[1]);
      const life = toNumber(args[2]);
      const period = toNumber(args[3]);

      if (isError(cost)) return cost;
      if (isError(salvage)) return salvage;
      if (isError(life)) return life;
      if (isError(period)) return period;

      const costVal = cost as number;
      const salvageVal = salvage as number;
      const lifeVal = life as number;
      const periodVal = period as number;

      if (lifeVal <= 0 || periodVal <= 0 || periodVal > lifeVal) {
        return new FormulaError('#NUM!');
      }

      const sumOfYears = (lifeVal * (lifeVal + 1)) / 2;
      const depreciableBase = costVal - salvageVal;
      const remainingLife = lifeVal - periodVal + 1;

      return (depreciableBase * remainingLife) / sumOfYears;
    },
  },

  // EFFECT - effective annual interest rate
  {
    name: 'EFFECT',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const nominalRate = toNumber(args[0]);
      const npery = toNumber(args[1]);

      if (isError(nominalRate)) return nominalRate;
      if (isError(npery)) return npery;

      const rate = nominalRate as number;
      const periods = Math.floor(npery as number);

      if (rate <= 0 || periods < 1) {
        return new FormulaError('#NUM!');
      }

      return Math.pow(1 + rate / periods, periods) - 1;
    },
  },

  // NOMINAL - nominal annual interest rate
  {
    name: 'NOMINAL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const effectRate = toNumber(args[0]);
      const npery = toNumber(args[1]);

      if (isError(effectRate)) return effectRate;
      if (isError(npery)) return npery;

      const rate = effectRate as number;
      const periods = Math.floor(npery as number);

      if (rate <= 0 || periods < 1) {
        return new FormulaError('#NUM!');
      }

      return periods * (Math.pow(rate + 1, 1 / periods) - 1);
    },
  },

  // XNPV - net present value for irregular cash flows
  {
    name: 'XNPV',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      if (isError(rate)) return rate;

      const values = flattenValues([args[1]]).filter(
        (v): v is number => typeof v === 'number'
      );
      const dates = flattenValues([args[2]]).filter(
        (v): v is number => typeof v === 'number'
      );

      if (values.length !== dates.length || values.length === 0) {
        return new FormulaError('#NUM!');
      }

      const r = rate as number;
      const firstDate = dates[0];
      let xnpv = 0;

      for (let i = 0; i < values.length; i++) {
        const years = (dates[i] - firstDate) / 365;
        xnpv += values[i] / Math.pow(1 + r, years);
      }

      return xnpv;
    },
  },

  // XIRR - IRR for irregular cash flows
  {
    name: 'XIRR',
    minArgs: 2,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues([args[0]]).filter(
        (v): v is number => typeof v === 'number'
      );
      const dates = flattenValues([args[1]]).filter(
        (v): v is number => typeof v === 'number'
      );
      const guess = args[2] !== undefined ? toNumber(args[2]) : 0.1;

      if (isError(guess)) return guess;
      if (values.length !== dates.length || values.length < 2) {
        return new FormulaError('#NUM!');
      }

      // Newton-Raphson method
      let rate = guess as number;
      const maxIterations = 100;
      const tolerance = 1e-10;
      const firstDate = dates[0];

      for (let i = 0; i < maxIterations; i++) {
        let xnpv = 0;
        let dxnpv = 0;

        for (let j = 0; j < values.length; j++) {
          const years = (dates[j] - firstDate) / 365;
          const factor = Math.pow(1 + rate, years);
          xnpv += values[j] / factor;
          if (years !== 0) {
            dxnpv -= years * values[j] / (factor * (1 + rate));
          }
        }

        if (Math.abs(dxnpv) < tolerance) {
          return new FormulaError('#NUM!');
        }

        const newRate = rate - xnpv / dxnpv;
        if (Math.abs(newRate - rate) < tolerance) {
          return newRate;
        }
        rate = newRate;
      }

      return new FormulaError('#NUM!');
    },
  },

  // DOLLARDE - convert fractional dollar to decimal
  {
    name: 'DOLLARDE',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const fractionalDollar = toNumber(args[0]);
      const fraction = toNumber(args[1]);

      if (isError(fractionalDollar)) return fractionalDollar;
      if (isError(fraction)) return fraction;

      const fd = fractionalDollar as number;
      const frac = Math.floor(fraction as number);

      if (frac < 1) {
        return new FormulaError('#NUM!');
      }

      const sign = fd < 0 ? -1 : 1;
      const absFd = Math.abs(fd);
      const intPart = Math.floor(absFd);
      const fracPart = absFd - intPart;
      // The fractional part represents numerator/100, convert to numerator/fraction
      const numerator = Math.floor(fracPart * 100 + 0.5); // Round to handle floating point
      return sign * (intPart + numerator / frac);
    },
  },

  // DOLLARFR - convert decimal dollar to fractional
  {
    name: 'DOLLARFR',
    minArgs: 2,
    maxArgs: 2,
    fn: (args: FormulaValue[]): FormulaValue => {
      const decimalDollar = toNumber(args[0]);
      const fraction = toNumber(args[1]);

      if (isError(decimalDollar)) return decimalDollar;
      if (isError(fraction)) return fraction;

      const dd = decimalDollar as number;
      const frac = Math.floor(fraction as number);

      if (frac < 1) {
        return new FormulaError('#NUM!');
      }

      const sign = dd < 0 ? -1 : 1;
      const absDd = Math.abs(dd);
      const intPart = Math.floor(absDd);
      const decPart = absDd - intPart;
      // Convert decimal to numerator, then express as decimal fraction
      const numerator = decPart * frac;
      return sign * (intPart + numerator / 100);
    },
  },

  // PRICE - bond price
  {
    name: 'PRICE',
    minArgs: 6,
    maxArgs: 7,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const rate = toNumber(args[2]);
      const yld = toNumber(args[3]);
      const redemption = toNumber(args[4]);
      const frequency = toNumber(args[5]);
      const basis = args[6] !== undefined ? toNumber(args[6]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(rate)) return rate;
      if (isError(yld)) return yld;
      if (isError(redemption)) return redemption;
      if (isError(frequency)) return frequency;
      if (isError(basis)) return basis;

      const r = rate as number;
      const y = yld as number;
      const red = redemption as number;
      const freq = frequency as number;

      if (![1, 2, 4].includes(freq) || r < 0 || y < 0) {
        return new FormulaError('#NUM!');
      }

      // Simplified bond pricing formula
      const periods = Math.ceil(((maturity as number) - (settlement as number)) / (365 / freq));
      const coupon = (r * red) / freq;
      let price = 0;

      for (let i = 1; i <= periods; i++) {
        price += coupon / Math.pow(1 + y / freq, i);
      }
      price += red / Math.pow(1 + y / freq, periods);

      return price;
    },
  },

  // YIELD - bond yield
  {
    name: 'YIELD',
    minArgs: 6,
    maxArgs: 7,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const rate = toNumber(args[2]);
      const pr = toNumber(args[3]);
      const redemption = toNumber(args[4]);
      const frequency = toNumber(args[5]);
      const basis = args[6] !== undefined ? toNumber(args[6]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(rate)) return rate;
      if (isError(pr)) return pr;
      if (isError(redemption)) return redemption;
      if (isError(frequency)) return frequency;
      if (isError(basis)) return basis;

      const freq = frequency as number;
      const price = pr as number;

      if (![1, 2, 4].includes(freq) || price <= 0) {
        return new FormulaError('#NUM!');
      }

      // Newton-Raphson to find yield
      let yld = rate as number || 0.05;
      const maxIterations = 100;
      const tolerance = 1e-10;

      // Create a minimal context for internal function calls
      const internalContext = { getCell: () => null, getRange: () => [] } as unknown as EvalContext;

      for (let i = 0; i < maxIterations; i++) {
        const calcArgs = [args[0], args[1], args[2], yld, args[4], args[5], args[6]];
        const calcPrice = financialFunctions.find(f => f.name === 'PRICE')!.fn(calcArgs as FormulaValue[], internalContext);
        if (isError(calcPrice)) return calcPrice;

        const diff = (calcPrice as number) - price;
        if (Math.abs(diff) < tolerance) {
          return yld;
        }

        // Numerical derivative
        const yld2 = yld + 0.0001;
        const calcArgs2 = [args[0], args[1], args[2], yld2, args[4], args[5], args[6]];
        const calcPrice2 = financialFunctions.find(f => f.name === 'PRICE')!.fn(calcArgs2 as FormulaValue[], internalContext);
        if (isError(calcPrice2)) return calcPrice2;

        const deriv = ((calcPrice2 as number) - (calcPrice as number)) / 0.0001;
        if (Math.abs(deriv) < tolerance) {
          return new FormulaError('#NUM!');
        }

        yld = yld - diff / deriv;
      }

      return new FormulaError('#NUM!');
    },
  },

  // ACCRINT - accrued interest
  {
    name: 'ACCRINT',
    minArgs: 6,
    maxArgs: 8,
    fn: (args: FormulaValue[]): FormulaValue => {
      const issue = toNumber(args[0]);
      const firstInterest = toNumber(args[1]);
      const settlement = toNumber(args[2]);
      const rate = toNumber(args[3]);
      const par = toNumber(args[4]);
      const frequency = toNumber(args[5]);
      const basis = args[6] !== undefined ? toNumber(args[6]) : 0;

      if (isError(issue)) return issue;
      if (isError(firstInterest)) return firstInterest;
      if (isError(settlement)) return settlement;
      if (isError(rate)) return rate;
      if (isError(par)) return par;
      if (isError(frequency)) return frequency;
      if (isError(basis)) return basis;

      const r = rate as number;
      const p = par as number;
      const freq = frequency as number;
      const days = (settlement as number) - (issue as number);

      if (![1, 2, 4].includes(freq) || r < 0 || days < 0) {
        return new FormulaError('#NUM!');
      }

      // Simplified accrued interest calculation
      return r * p * (days / 365);
    },
  },

  // TBILLPRICE - T-bill price
  {
    name: 'TBILLPRICE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const discount = toNumber(args[2]);

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(discount)) return discount;

      const days = (maturity as number) - (settlement as number);
      const d = discount as number;

      if (days <= 0 || days > 365 || d < 0) {
        return new FormulaError('#NUM!');
      }

      return 100 * (1 - d * days / 360);
    },
  },

  // TBILLYIELD - T-bill yield
  {
    name: 'TBILLYIELD',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const pr = toNumber(args[2]);

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(pr)) return pr;

      const days = (maturity as number) - (settlement as number);
      const price = pr as number;

      if (days <= 0 || days > 365 || price <= 0) {
        return new FormulaError('#NUM!');
      }

      return ((100 - price) / price) * (360 / days);
    },
  },

  // TBILLEQ - T-bill bond equivalent yield
  {
    name: 'TBILLEQ',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const discount = toNumber(args[2]);

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(discount)) return discount;

      const days = (maturity as number) - (settlement as number);
      const d = discount as number;

      if (days <= 0 || days > 365 || d < 0) {
        return new FormulaError('#NUM!');
      }

      return (365 * d) / (360 - d * days);
    },
  },

  // CUMIPMT - cumulative interest payment
  {
    name: 'CUMIPMT',
    minArgs: 6,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const nper = toNumber(args[1]);
      const pv = toNumber(args[2]);
      const startPeriod = toNumber(args[3]);
      const endPeriod = toNumber(args[4]);
      const type = toNumber(args[5]);

      if (isError(rate)) return rate;
      if (isError(nper)) return nper;
      if (isError(pv)) return pv;
      if (isError(startPeriod)) return startPeriod;
      if (isError(endPeriod)) return endPeriod;
      if (isError(type)) return type;

      const r = rate as number;
      const n = nper as number;
      const presentValue = pv as number;
      const start = Math.floor(startPeriod as number);
      const end = Math.floor(endPeriod as number);
      const paymentType = type as number;

      if (r <= 0 || n <= 0 || presentValue <= 0 || start < 1 || end < start || end > n || (paymentType !== 0 && paymentType !== 1)) {
        return new FormulaError('#NUM!');
      }

      // Calculate PMT first (negative for loans with positive pv)
      let pmt: number;
      if (r === 0) {
        pmt = -(presentValue) / n;
      } else {
        const pvif = Math.pow(1 + r, n);
        pmt = -(r * (presentValue * pvif)) / (pvif - 1);
        if (paymentType === 1) {
          pmt = pmt / (1 + r);
        }
      }

      let cumInt = 0;
      for (let per = start; per <= end; per++) {
        let balance = presentValue;
        for (let i = 1; i < per; i++) {
          if (paymentType === 0) {
            balance = balance * (1 + r) + pmt;
          } else {
            balance = (balance + pmt) * (1 + r);
          }
        }

        if (!(paymentType === 1 && per === 1)) {
          cumInt += -balance * r;
        }
      }

      return cumInt;
    },
  },

  // CUMPRINC - cumulative principal payment
  {
    name: 'CUMPRINC',
    minArgs: 6,
    maxArgs: 6,
    fn: (args: FormulaValue[]): FormulaValue => {
      const rate = toNumber(args[0]);
      const nper = toNumber(args[1]);
      const pv = toNumber(args[2]);
      const startPeriod = toNumber(args[3]);
      const endPeriod = toNumber(args[4]);
      const type = toNumber(args[5]);

      if (isError(rate)) return rate;
      if (isError(nper)) return nper;
      if (isError(pv)) return pv;
      if (isError(startPeriod)) return startPeriod;
      if (isError(endPeriod)) return endPeriod;
      if (isError(type)) return type;

      const r = rate as number;
      const n = nper as number;
      const presentValue = pv as number;
      const start = Math.floor(startPeriod as number);
      const end = Math.floor(endPeriod as number);
      const paymentType = type as number;

      if (r <= 0 || n <= 0 || presentValue <= 0 || start < 1 || end < start || end > n || (paymentType !== 0 && paymentType !== 1)) {
        return new FormulaError('#NUM!');
      }

      // Calculate PMT first (negative for loans with positive pv)
      let pmt: number;
      if (r === 0) {
        pmt = -(presentValue) / n;
      } else {
        const pvif = Math.pow(1 + r, n);
        pmt = -(r * (presentValue * pvif)) / (pvif - 1);
        if (paymentType === 1) {
          pmt = pmt / (1 + r);
        }
      }

      let cumPrinc = 0;
      for (let per = start; per <= end; per++) {
        let balance = presentValue;
        for (let i = 1; i < per; i++) {
          if (paymentType === 0) {
            balance = balance * (1 + r) + pmt;
          } else {
            balance = (balance + pmt) * (1 + r);
          }
        }

        let ipmt: number;
        if (paymentType === 1 && per === 1) {
          ipmt = 0;
        } else {
          ipmt = -balance * r;
        }

        // PPMT = PMT - IPMT
        cumPrinc += pmt - ipmt;
      }

      return cumPrinc;
    },
  },

  // MIRR - modified internal rate of return
  {
    name: 'MIRR',
    minArgs: 3,
    maxArgs: 3,
    fn: (args: FormulaValue[]): FormulaValue => {
      const values = flattenValues([args[0]]).filter(
        (v): v is number => typeof v === 'number'
      );
      const financeRate = toNumber(args[1]);
      const reinvestRate = toNumber(args[2]);

      if (isError(financeRate)) return financeRate;
      if (isError(reinvestRate)) return reinvestRate;

      if (values.length < 2) {
        return new FormulaError('#NUM!');
      }

      const fr = financeRate as number;
      const rr = reinvestRate as number;
      const n = values.length;

      // Present value of negative cash flows (discounted at finance rate)
      let pvNeg = 0;
      // Future value of positive cash flows (compounded at reinvest rate)
      let fvPos = 0;

      for (let i = 0; i < n; i++) {
        if (values[i] < 0) {
          pvNeg += values[i] / Math.pow(1 + fr, i);
        } else {
          fvPos += values[i] * Math.pow(1 + rr, n - 1 - i);
        }
      }

      if (pvNeg >= 0 || fvPos <= 0) {
        return new FormulaError('#NUM!');
      }

      return Math.pow(-fvPos / pvNeg, 1 / (n - 1)) - 1;
    },
  },

  // DISC - discount rate for a security
  {
    name: 'DISC',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const pr = toNumber(args[2]);
      const redemption = toNumber(args[3]);
      const basis = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(pr)) return pr;
      if (isError(redemption)) return redemption;
      if (isError(basis)) return basis;

      const price = pr as number;
      const red = redemption as number;
      const days = (maturity as number) - (settlement as number);
      const yearDays = getDaysInYear(basis as number);

      if (days <= 0 || price <= 0 || red <= 0) {
        return new FormulaError('#NUM!');
      }

      return ((red - price) / red) * (yearDays / days);
    },
  },

  // PRICEDISC - price of a discounted security
  {
    name: 'PRICEDISC',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const discount = toNumber(args[2]);
      const redemption = toNumber(args[3]);
      const basis = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(discount)) return discount;
      if (isError(redemption)) return redemption;
      if (isError(basis)) return basis;

      const disc = discount as number;
      const red = redemption as number;
      const days = (maturity as number) - (settlement as number);
      const yearDays = getDaysInYear(basis as number);

      if (days <= 0 || disc < 0 || red <= 0) {
        return new FormulaError('#NUM!');
      }

      return red * (1 - disc * days / yearDays);
    },
  },

  // RECEIVED - amount received at maturity for fully invested security
  {
    name: 'RECEIVED',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const investment = toNumber(args[2]);
      const discount = toNumber(args[3]);
      const basis = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(investment)) return investment;
      if (isError(discount)) return discount;
      if (isError(basis)) return basis;

      const inv = investment as number;
      const disc = discount as number;
      const days = (maturity as number) - (settlement as number);
      const yearDays = getDaysInYear(basis as number);

      if (days <= 0 || inv <= 0 || disc < 0) {
        return new FormulaError('#NUM!');
      }

      return inv / (1 - disc * days / yearDays);
    },
  },

  // INTRATE - interest rate for fully invested security
  {
    name: 'INTRATE',
    minArgs: 4,
    maxArgs: 5,
    fn: (args: FormulaValue[]): FormulaValue => {
      const settlement = toNumber(args[0]);
      const maturity = toNumber(args[1]);
      const investment = toNumber(args[2]);
      const redemption = toNumber(args[3]);
      const basis = args[4] !== undefined ? toNumber(args[4]) : 0;

      if (isError(settlement)) return settlement;
      if (isError(maturity)) return maturity;
      if (isError(investment)) return investment;
      if (isError(redemption)) return redemption;
      if (isError(basis)) return basis;

      const inv = investment as number;
      const red = redemption as number;
      const days = (maturity as number) - (settlement as number);
      const yearDays = getDaysInYear(basis as number);

      if (days <= 0 || inv <= 0 || red <= 0) {
        return new FormulaError('#NUM!');
      }

      return ((red - inv) / inv) * (yearDays / days);
    },
  },
];

// Helper function to get days in year based on basis
function getDaysInYear(basis: number): number {
  switch (basis) {
    case 0: return 360; // US (NASD) 30/360
    case 1: return 365; // Actual/actual
    case 2: return 360; // Actual/360
    case 3: return 365; // Actual/365
    case 4: return 360; // European 30/360
    default: return 360;
  }
}
