/**
 * Formula Engine Test Suite
 * Comprehensive tests for Excel-like formula calculations
 */

import { formulaEngine, CellDataProvider, FormulaValue } from '../engine';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockCells: Record<string, FormulaValue> = {
  '0:0': 10,     // A1 = 10
  '0:1': 20,     // B1 = 20
  '1:0': 5,      // A2 = 5
  '2:0': 15,     // A3 = 15
  '0:2': 'Hello', // C1 = "Hello"
  '1:2': 'World', // C2 = "World"
  '3:0': 0,      // A4 = 0
  '4:0': -5,     // A5 = -5
};

const mockFormulas: Record<string, string> = {};

// Create mock data provider
const createDataProvider = (): CellDataProvider => ({
  getCellValue: (_sheetId: string, row: number, col: number): FormulaValue => {
    const key = `${row}:${col}`;
    return mockCells[key] ?? null;
  },
  getCellFormula: (_sheetId: string, row: number, col: number): string | undefined => {
    const key = `${row}:${col}`;
    return mockFormulas[key];
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

interface TestResult {
  description: string;
  formula: string;
  expected: FormulaValue;
  actual: FormulaValue;
  passed: boolean;
}

const results: TestResult[] = [];

const testFormula = (
  formula: string,
  expected: FormulaValue,
  description: string
): boolean => {
  const dataProvider = createDataProvider();
  const result = formulaEngine.calculate(formula, 'sheet1', 10, 10, dataProvider);

  let actual = result.value;
  let passed = false;

  // Handle error comparison
  if (expected !== null && typeof expected === 'object' && 'type' in (expected as any)) {
    passed = actual !== null &&
             typeof actual === 'object' &&
             'type' in (actual as any) &&
             (actual as any).type === (expected as any).type;
  } else if (typeof expected === 'number' && typeof actual === 'number') {
    // Handle floating point comparison
    passed = Math.abs(expected - actual) < 0.0001;
  } else {
    passed = actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
  }

  results.push({ description, formula, expected, actual, passed });

  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${description}: ${formula} = ${formatValue(actual)} (expected: ${formatValue(expected)})`);

  return passed;
};

const formatValue = (val: FormulaValue): string => {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object' && 'type' in val) return (val as any).type;
  if (typeof val === 'string') return `"${val}"`;
  return String(val);
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════

export const runFormulaTests = () => {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('                    FORMULA ENGINE TESTS                          ');
  console.log('════════════════════════════════════════════════════════════════\n');

  results.length = 0;
  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // BASIC ARITHMETIC
  // ═══════════════════════════════════════════════════════════════════════
  console.log('─── Basic Arithmetic ───');
  testFormula('=1+2', 3, 'Addition') ? passed++ : failed++;
  testFormula('=10-3', 7, 'Subtraction') ? passed++ : failed++;
  testFormula('=4*5', 20, 'Multiplication') ? passed++ : failed++;
  testFormula('=20/4', 5, 'Division') ? passed++ : failed++;
  testFormula('=2^3', 8, 'Power') ? passed++ : failed++;
  testFormula('=1+2*3', 7, 'Operator precedence') ? passed++ : failed++;
  testFormula('=(1+2)*3', 9, 'Parentheses') ? passed++ : failed++;
  testFormula('=-5', -5, 'Unary minus') ? passed++ : failed++;
  testFormula('=+10', 10, 'Unary plus') ? passed++ : failed++;
  testFormula('=10%', 0.1, 'Percentage') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // CELL REFERENCES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Cell References ───');
  testFormula('=A1', 10, 'Single cell ref') ? passed++ : failed++;
  testFormula('=A1+B1', 30, 'Add two cells') ? passed++ : failed++;
  testFormula('=A1*A2', 50, 'Multiply cells') ? passed++ : failed++;
  testFormula('=A1+10', 20, 'Cell + number') ? passed++ : failed++;
  testFormula('=A1-A2', 5, 'Subtract cells') ? passed++ : failed++;
  testFormula('=B1/A1', 2, 'Divide cells') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // MATH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Math Functions ───');
  testFormula('=SUM(1,2,3)', 6, 'SUM numbers') ? passed++ : failed++;
  testFormula('=SUM(A1,A2,A3)', 30, 'SUM cells') ? passed++ : failed++;
  testFormula('=SUM(A1:A3)', 30, 'SUM range') ? passed++ : failed++;
  testFormula('=AVERAGE(2,4,6)', 4, 'AVERAGE') ? passed++ : failed++;
  testFormula('=MAX(1,5,3)', 5, 'MAX') ? passed++ : failed++;
  testFormula('=MIN(1,5,3)', 1, 'MIN') ? passed++ : failed++;
  testFormula('=ABS(-10)', 10, 'ABS') ? passed++ : failed++;
  testFormula('=SQRT(16)', 4, 'SQRT') ? passed++ : failed++;
  testFormula('=POWER(2,3)', 8, 'POWER') ? passed++ : failed++;
  testFormula('=ROUND(3.14159,2)', 3.14, 'ROUND') ? passed++ : failed++;
  testFormula('=MOD(10,3)', 1, 'MOD') ? passed++ : failed++;
  testFormula('=INT(3.7)', 3, 'INT') ? passed++ : failed++;
  testFormula('=PRODUCT(2,3,4)', 24, 'PRODUCT') ? passed++ : failed++;
  testFormula('=QUOTIENT(10,3)', 3, 'QUOTIENT') ? passed++ : failed++;
  testFormula('=CEILING(2.5,1)', 3, 'CEILING') ? passed++ : failed++;
  testFormula('=FLOOR(2.5,1)', 2, 'FLOOR') ? passed++ : failed++;
  testFormula('=ROUNDUP(2.123,2)', 2.13, 'ROUNDUP') ? passed++ : failed++;
  testFormula('=ROUNDDOWN(2.789,2)', 2.78, 'ROUNDDOWN') ? passed++ : failed++;
  testFormula('=PI()', Math.PI, 'PI') ? passed++ : failed++;
  testFormula('=EXP(1)', Math.E, 'EXP') ? passed++ : failed++;
  testFormula('=LN(2.718281828)', 1, 'LN') ? passed++ : failed++;
  testFormula('=LOG(100)', 2, 'LOG base 10') ? passed++ : failed++;
  testFormula('=LOG10(1000)', 3, 'LOG10') ? passed++ : failed++;
  testFormula('=SIN(0)', 0, 'SIN') ? passed++ : failed++;
  testFormula('=COS(0)', 1, 'COS') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // TEXT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Text Functions ───');
  testFormula('=LEN("Hello")', 5, 'LEN') ? passed++ : failed++;
  testFormula('=UPPER("hello")', 'HELLO', 'UPPER') ? passed++ : failed++;
  testFormula('=LOWER("HELLO")', 'hello', 'LOWER') ? passed++ : failed++;
  testFormula('=LEFT("Hello",2)', 'He', 'LEFT') ? passed++ : failed++;
  testFormula('=RIGHT("Hello",2)', 'lo', 'RIGHT') ? passed++ : failed++;
  testFormula('=MID("Hello",2,3)', 'ell', 'MID') ? passed++ : failed++;
  testFormula('=TRIM("  hi  ")', 'hi', 'TRIM') ? passed++ : failed++;
  testFormula('=CONCATENATE("A","B","C")', 'ABC', 'CONCATENATE') ? passed++ : failed++;
  testFormula('=CONCAT("X","Y","Z")', 'XYZ', 'CONCAT') ? passed++ : failed++;
  testFormula('="Hello"&" "&"World"', 'Hello World', 'Concat operator') ? passed++ : failed++;
  testFormula('=PROPER("hello world")', 'Hello World', 'PROPER') ? passed++ : failed++;
  testFormula('=REPT("Ab",3)', 'AbAbAb', 'REPT') ? passed++ : failed++;
  testFormula('=FIND("l","Hello")', 3, 'FIND') ? passed++ : failed++;
  testFormula('=SEARCH("L","Hello")', 3, 'SEARCH case-insensitive') ? passed++ : failed++;
  testFormula('=SUBSTITUTE("Hello","l","X")', 'HeXXo', 'SUBSTITUTE') ? passed++ : failed++;
  testFormula('=CHAR(65)', 'A', 'CHAR') ? passed++ : failed++;
  testFormula('=CODE("A")', 65, 'CODE') ? passed++ : failed++;
  testFormula('=T("Hello")', 'Hello', 'T with text') ? passed++ : failed++;
  testFormula('=T(123)', '', 'T with number') ? passed++ : failed++;
  testFormula('=VALUE("123")', 123, 'VALUE') ? passed++ : failed++;
  testFormula('=EXACT("ABC","ABC")', true, 'EXACT true') ? passed++ : failed++;
  testFormula('=EXACT("ABC","abc")', false, 'EXACT false') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // LOGICAL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Logical Functions ───');
  testFormula('=IF(1>0,"Yes","No")', 'Yes', 'IF true') ? passed++ : failed++;
  testFormula('=IF(1<0,"Yes","No")', 'No', 'IF false') ? passed++ : failed++;
  testFormula('=AND(TRUE,TRUE)', true, 'AND true') ? passed++ : failed++;
  testFormula('=AND(TRUE,FALSE)', false, 'AND false') ? passed++ : failed++;
  testFormula('=OR(TRUE,FALSE)', true, 'OR true') ? passed++ : failed++;
  testFormula('=OR(FALSE,FALSE)', false, 'OR false') ? passed++ : failed++;
  testFormula('=NOT(TRUE)', false, 'NOT true') ? passed++ : failed++;
  testFormula('=NOT(FALSE)', true, 'NOT false') ? passed++ : failed++;
  testFormula('=XOR(TRUE,FALSE)', true, 'XOR true') ? passed++ : failed++;
  testFormula('=XOR(TRUE,TRUE)', false, 'XOR false') ? passed++ : failed++;
  testFormula('=IF(A1>5,"Big","Small")', 'Big', 'IF with cell ref') ? passed++ : failed++;
  testFormula('=TRUE()', true, 'TRUE function') ? passed++ : failed++;
  testFormula('=FALSE()', false, 'FALSE function') ? passed++ : failed++;
  testFormula('=ISBLANK(A1)', false, 'ISBLANK false') ? passed++ : failed++;
  testFormula('=ISNUMBER(A1)', true, 'ISNUMBER true') ? passed++ : failed++;
  testFormula('=ISNUMBER("text")', false, 'ISNUMBER false') ? passed++ : failed++;
  testFormula('=ISTEXT("Hello")', true, 'ISTEXT true') ? passed++ : failed++;
  testFormula('=ISTEXT(123)', false, 'ISTEXT false') ? passed++ : failed++;
  testFormula('=ISLOGICAL(TRUE)', true, 'ISLOGICAL true') ? passed++ : failed++;
  testFormula('=ISEVEN(4)', true, 'ISEVEN true') ? passed++ : failed++;
  testFormula('=ISEVEN(3)', false, 'ISEVEN false') ? passed++ : failed++;
  testFormula('=ISODD(3)', true, 'ISODD true') ? passed++ : failed++;
  testFormula('=ISODD(4)', false, 'ISODD false') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // COMPARISON OPERATORS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Comparison Operators ───');
  testFormula('=1=1', true, 'Equal true') ? passed++ : failed++;
  testFormula('=1=2', false, 'Equal false') ? passed++ : failed++;
  testFormula('=1<2', true, 'Less than true') ? passed++ : failed++;
  testFormula('=1>2', false, 'Greater than false') ? passed++ : failed++;
  testFormula('=1<=1', true, 'Less than or equal') ? passed++ : failed++;
  testFormula('=1>=2', false, 'Greater than or equal') ? passed++ : failed++;
  testFormula('=1<>2', true, 'Not equal true') ? passed++ : failed++;
  testFormula('=1<>1', false, 'Not equal false') ? passed++ : failed++;
  testFormula('="A"="A"', true, 'String equal') ? passed++ : failed++;
  testFormula('="A"<"B"', true, 'String less than') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // DATE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Date Functions ───');
  const dataProvider = createDataProvider();
  const todayResult = formulaEngine.calculate('=TODAY()', 'sheet1', 0, 0, dataProvider);
  const todayPass = typeof todayResult.value === 'number' && todayResult.value > 40000;
  console.log(`${todayPass ? '✅' : '❌'} TODAY returns serial: ${todayResult.value}`);
  todayPass ? passed++ : failed++;

  const nowResult = formulaEngine.calculate('=NOW()', 'sheet1', 0, 0, dataProvider);
  const nowPass = typeof nowResult.value === 'number' && nowResult.value > 40000;
  console.log(`${nowPass ? '✅' : '❌'} NOW returns serial: ${nowResult.value}`);
  nowPass ? passed++ : failed++;

  testFormula('=YEAR(DATE(2024,6,15))', 2024, 'YEAR') ? passed++ : failed++;
  testFormula('=MONTH(DATE(2024,6,15))', 6, 'MONTH') ? passed++ : failed++;
  testFormula('=DAY(DATE(2024,6,15))', 15, 'DAY') ? passed++ : failed++;
  testFormula('=DATE(2024,1,1)', 45292, 'DATE serial') ? passed++ : failed++;
  testFormula('=TIME(12,30,0)', 0.520833333, 'TIME') ? passed++ : failed++;
  testFormula('=HOUR(0.5)', 12, 'HOUR') ? passed++ : failed++;
  testFormula('=MINUTE(0.5208333)', 30, 'MINUTE') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // STATISTICAL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Statistical Functions ───');
  testFormula('=COUNT(1,2,3)', 3, 'COUNT') ? passed++ : failed++;
  testFormula('=COUNTA(1,"a",TRUE)', 3, 'COUNTA') ? passed++ : failed++;
  testFormula('=MEDIAN(1,2,3,4,5)', 3, 'MEDIAN odd') ? passed++ : failed++;
  testFormula('=MEDIAN(1,2,3,4)', 2.5, 'MEDIAN even') ? passed++ : failed++;
  testFormula('=LARGE({1,2,3,4,5},2)', 4, 'LARGE') ? passed++ : failed++;
  testFormula('=SMALL({1,2,3,4,5},2)', 2, 'SMALL') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // LOOKUP FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Lookup Functions ───');
  testFormula('=CHOOSE(2,"A","B","C")', 'B', 'CHOOSE') ? passed++ : failed++;
  testFormula('=ROW()', 11, 'ROW') ? passed++ : failed++;
  testFormula('=COLUMN()', 11, 'COLUMN') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Error Handling ───');

  const divZero = formulaEngine.calculate('=1/0', 'sheet1', 0, 0, dataProvider);
  const divZeroPass = divZero.error === '#DIV/0!';
  console.log(`${divZeroPass ? '✅' : '❌'} Division by zero: ${divZero.displayValue}`);
  divZeroPass ? passed++ : failed++;

  const unknownFunc = formulaEngine.calculate('=UNKNOWN()', 'sheet1', 0, 0, dataProvider);
  const unknownPass = unknownFunc.error === '#NAME?';
  console.log(`${unknownPass ? '✅' : '❌'} Unknown function: ${unknownFunc.displayValue}`);
  unknownPass ? passed++ : failed++;

  const sqrtNeg = formulaEngine.calculate('=SQRT(-1)', 'sheet1', 0, 0, dataProvider);
  const sqrtNegPass = sqrtNeg.error === '#NUM!';
  console.log(`${sqrtNegPass ? '✅' : '❌'} SQRT negative: ${sqrtNeg.displayValue}`);
  sqrtNegPass ? passed++ : failed++;

  testFormula('=IFERROR(1/0,"Error")', 'Error', 'IFERROR') ? passed++ : failed++;

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY                                  ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`📈 Pass Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
  console.log('════════════════════════════════════════════════════════════════\n');

  // Return results for report generation
  return {
    passed,
    failed,
    total: passed + failed,
    passRate: Math.round(passed / (passed + failed) * 100),
    results: results.filter(r => !r.passed), // Return failed tests
  };
};

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).runFormulaTests = runFormulaTests;
}

export default runFormulaTests;
