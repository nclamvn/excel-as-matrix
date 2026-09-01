/**
 * Formula Engine Test Suite
 * Comprehensive tests for Excel-like formula calculations
 */

import { formulaEngine, CellDataProvider, FormulaValue } from '../engine';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockCells: Record<string, FormulaValue> = {
  '0:0': 10, // A1 = 10
  '0:1': 20, // B1 = 20
  '1:0': 5, // A2 = 5
  '2:0': 15, // A3 = 15
  '0:2': 'Hello', // C1 = "Hello"
  '1:2': 'World', // C2 = "World"
  '3:0': 0, // A4 = 0
  '4:0': -5, // A5 = -5
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

const testFormula = (formula: string, expected: FormulaValue, description: string): boolean => {
  const dataProvider = createDataProvider();
  const result = formulaEngine.calculate(formula, 'sheet1', 10, 10, dataProvider);

  const actual = result.value;
  let passed = false;

  // Handle error comparison
  if (expected !== null && typeof expected === 'object' && 'type' in (expected as any)) {
    passed =
      actual !== null &&
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
  console.log(
    `${icon} ${description}: ${formula} = ${formatValue(actual)} (expected: ${formatValue(expected)})`
  );

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
  const record = (didPass: boolean) => {
    if (didPass) passed += 1;
    else failed += 1;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BASIC ARITHMETIC
  // ═══════════════════════════════════════════════════════════════════════
  console.log('─── Basic Arithmetic ───');
  record(testFormula('=1+2', 3, 'Addition'));
  record(testFormula('=10-3', 7, 'Subtraction'));
  record(testFormula('=4*5', 20, 'Multiplication'));
  record(testFormula('=20/4', 5, 'Division'));
  record(testFormula('=2^3', 8, 'Power'));
  record(testFormula('=1+2*3', 7, 'Operator precedence'));
  record(testFormula('=(1+2)*3', 9, 'Parentheses'));
  record(testFormula('=-5', -5, 'Unary minus'));
  record(testFormula('=+10', 10, 'Unary plus'));
  record(testFormula('=10%', 0.1, 'Percentage'));

  // ═══════════════════════════════════════════════════════════════════════
  // CELL REFERENCES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Cell References ───');
  record(testFormula('=A1', 10, 'Single cell ref'));
  record(testFormula('=A1+B1', 30, 'Add two cells'));
  record(testFormula('=A1*A2', 50, 'Multiply cells'));
  record(testFormula('=A1+10', 20, 'Cell + number'));
  record(testFormula('=A1-A2', 5, 'Subtract cells'));
  record(testFormula('=B1/A1', 2, 'Divide cells'));

  // ═══════════════════════════════════════════════════════════════════════
  // MATH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Math Functions ───');
  record(testFormula('=SUM(1,2,3)', 6, 'SUM numbers'));
  record(testFormula('=SUM(A1,A2,A3)', 30, 'SUM cells'));
  record(testFormula('=SUM(A1:A3)', 30, 'SUM range'));
  record(testFormula('=AVERAGE(2,4,6)', 4, 'AVERAGE'));
  record(testFormula('=MAX(1,5,3)', 5, 'MAX'));
  record(testFormula('=MIN(1,5,3)', 1, 'MIN'));
  record(testFormula('=ABS(-10)', 10, 'ABS'));
  record(testFormula('=SQRT(16)', 4, 'SQRT'));
  record(testFormula('=POWER(2,3)', 8, 'POWER'));
  record(testFormula('=ROUND(3.14159,2)', 3.14, 'ROUND'));
  record(testFormula('=MOD(10,3)', 1, 'MOD'));
  record(testFormula('=INT(3.7)', 3, 'INT'));
  record(testFormula('=PRODUCT(2,3,4)', 24, 'PRODUCT'));
  record(testFormula('=QUOTIENT(10,3)', 3, 'QUOTIENT'));
  record(testFormula('=CEILING(2.5,1)', 3, 'CEILING'));
  record(testFormula('=FLOOR(2.5,1)', 2, 'FLOOR'));
  record(testFormula('=ROUNDUP(2.123,2)', 2.13, 'ROUNDUP'));
  record(testFormula('=ROUNDDOWN(2.789,2)', 2.78, 'ROUNDDOWN'));
  record(testFormula('=PI()', Math.PI, 'PI'));
  record(testFormula('=EXP(1)', Math.E, 'EXP'));
  record(testFormula('=LN(2.718281828)', 1, 'LN'));
  record(testFormula('=LOG(100)', 2, 'LOG base 10'));
  record(testFormula('=LOG10(1000)', 3, 'LOG10'));
  record(testFormula('=SIN(0)', 0, 'SIN'));
  record(testFormula('=COS(0)', 1, 'COS'));

  // ═══════════════════════════════════════════════════════════════════════
  // TEXT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Text Functions ───');
  record(testFormula('=LEN("Hello")', 5, 'LEN'));
  record(testFormula('=UPPER("hello")', 'HELLO', 'UPPER'));
  record(testFormula('=LOWER("HELLO")', 'hello', 'LOWER'));
  record(testFormula('=LEFT("Hello",2)', 'He', 'LEFT'));
  record(testFormula('=RIGHT("Hello",2)', 'lo', 'RIGHT'));
  record(testFormula('=MID("Hello",2,3)', 'ell', 'MID'));
  record(testFormula('=TRIM("  hi  ")', 'hi', 'TRIM'));
  record(testFormula('=CONCATENATE("A","B","C")', 'ABC', 'CONCATENATE'));
  record(testFormula('=CONCAT("X","Y","Z")', 'XYZ', 'CONCAT'));
  record(testFormula('="Hello"&" "&"World"', 'Hello World', 'Concat operator'));
  record(testFormula('=PROPER("hello world")', 'Hello World', 'PROPER'));
  record(testFormula('=REPT("Ab",3)', 'AbAbAb', 'REPT'));
  record(testFormula('=FIND("l","Hello")', 3, 'FIND'));
  record(testFormula('=SEARCH("L","Hello")', 3, 'SEARCH case-insensitive'));
  record(testFormula('=SUBSTITUTE("Hello","l","X")', 'HeXXo', 'SUBSTITUTE'));
  record(testFormula('=CHAR(65)', 'A', 'CHAR'));
  record(testFormula('=CODE("A")', 65, 'CODE'));
  record(testFormula('=T("Hello")', 'Hello', 'T with text'));
  record(testFormula('=T(123)', '', 'T with number'));
  record(testFormula('=VALUE("123")', 123, 'VALUE'));
  record(testFormula('=EXACT("ABC","ABC")', true, 'EXACT true'));
  record(testFormula('=EXACT("ABC","abc")', false, 'EXACT false'));

  // ═══════════════════════════════════════════════════════════════════════
  // LOGICAL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Logical Functions ───');
  record(testFormula('=IF(1>0,"Yes","No")', 'Yes', 'IF true'));
  record(testFormula('=IF(1<0,"Yes","No")', 'No', 'IF false'));
  record(testFormula('=AND(TRUE,TRUE)', true, 'AND true'));
  record(testFormula('=AND(TRUE,FALSE)', false, 'AND false'));
  record(testFormula('=OR(TRUE,FALSE)', true, 'OR true'));
  record(testFormula('=OR(FALSE,FALSE)', false, 'OR false'));
  record(testFormula('=NOT(TRUE)', false, 'NOT true'));
  record(testFormula('=NOT(FALSE)', true, 'NOT false'));
  record(testFormula('=XOR(TRUE,FALSE)', true, 'XOR true'));
  record(testFormula('=XOR(TRUE,TRUE)', false, 'XOR false'));
  record(testFormula('=IF(A1>5,"Big","Small")', 'Big', 'IF with cell ref'));
  record(testFormula('=TRUE()', true, 'TRUE function'));
  record(testFormula('=FALSE()', false, 'FALSE function'));
  record(testFormula('=ISBLANK(A1)', false, 'ISBLANK false'));
  record(testFormula('=ISNUMBER(A1)', true, 'ISNUMBER true'));
  record(testFormula('=ISNUMBER("text")', false, 'ISNUMBER false'));
  record(testFormula('=ISTEXT("Hello")', true, 'ISTEXT true'));
  record(testFormula('=ISTEXT(123)', false, 'ISTEXT false'));
  record(testFormula('=ISLOGICAL(TRUE)', true, 'ISLOGICAL true'));
  record(testFormula('=ISEVEN(4)', true, 'ISEVEN true'));
  record(testFormula('=ISEVEN(3)', false, 'ISEVEN false'));
  record(testFormula('=ISODD(3)', true, 'ISODD true'));
  record(testFormula('=ISODD(4)', false, 'ISODD false'));

  // ═══════════════════════════════════════════════════════════════════════
  // COMPARISON OPERATORS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Comparison Operators ───');
  record(testFormula('=1=1', true, 'Equal true'));
  record(testFormula('=1=2', false, 'Equal false'));
  record(testFormula('=1<2', true, 'Less than true'));
  record(testFormula('=1>2', false, 'Greater than false'));
  record(testFormula('=1<=1', true, 'Less than or equal'));
  record(testFormula('=1>=2', false, 'Greater than or equal'));
  record(testFormula('=1<>2', true, 'Not equal true'));
  record(testFormula('=1<>1', false, 'Not equal false'));
  record(testFormula('="A"="A"', true, 'String equal'));
  record(testFormula('="A"<"B"', true, 'String less than'));

  // ═══════════════════════════════════════════════════════════════════════
  // DATE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Date Functions ───');
  const dataProvider = createDataProvider();
  const todayResult = formulaEngine.calculate('=TODAY()', 'sheet1', 0, 0, dataProvider);
  const todayPass = typeof todayResult.value === 'number' && todayResult.value > 40000;
  console.log(`${todayPass ? '✅' : '❌'} TODAY returns serial: ${todayResult.value}`);
  record(todayPass);

  const nowResult = formulaEngine.calculate('=NOW()', 'sheet1', 0, 0, dataProvider);
  const nowPass = typeof nowResult.value === 'number' && nowResult.value > 40000;
  console.log(`${nowPass ? '✅' : '❌'} NOW returns serial: ${nowResult.value}`);
  record(nowPass);

  record(testFormula('=YEAR(DATE(2024,6,15))', 2024, 'YEAR'));
  record(testFormula('=MONTH(DATE(2024,6,15))', 6, 'MONTH'));
  record(testFormula('=DAY(DATE(2024,6,15))', 15, 'DAY'));
  record(testFormula('=DATE(2024,1,1)', 45292, 'DATE serial'));
  record(testFormula('=TIME(12,30,0)', 0.520833333, 'TIME'));
  record(testFormula('=HOUR(0.5)', 12, 'HOUR'));
  record(testFormula('=MINUTE(0.5208333)', 30, 'MINUTE'));

  // ═══════════════════════════════════════════════════════════════════════
  // STATISTICAL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Statistical Functions ───');
  record(testFormula('=COUNT(1,2,3)', 3, 'COUNT'));
  record(testFormula('=COUNTA(1,"a",TRUE)', 3, 'COUNTA'));
  record(testFormula('=MEDIAN(1,2,3,4,5)', 3, 'MEDIAN odd'));
  record(testFormula('=MEDIAN(1,2,3,4)', 2.5, 'MEDIAN even'));
  record(testFormula('=LARGE({1,2,3,4,5},2)', 4, 'LARGE'));
  record(testFormula('=SMALL({1,2,3,4,5},2)', 2, 'SMALL'));

  // ═══════════════════════════════════════════════════════════════════════
  // LOOKUP FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Lookup Functions ───');
  record(testFormula('=CHOOSE(2,"A","B","C")', 'B', 'CHOOSE'));
  record(testFormula('=ROW()', 11, 'ROW'));
  record(testFormula('=COLUMN()', 11, 'COLUMN'));

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n─── Error Handling ───');

  const divZero = formulaEngine.calculate('=1/0', 'sheet1', 0, 0, dataProvider);
  const divZeroPass = divZero.error === '#DIV/0!';
  console.log(`${divZeroPass ? '✅' : '❌'} Division by zero: ${divZero.displayValue}`);
  record(divZeroPass);

  const unknownFunc = formulaEngine.calculate('=UNKNOWN()', 'sheet1', 0, 0, dataProvider);
  const unknownPass = unknownFunc.error === '#NAME?';
  console.log(`${unknownPass ? '✅' : '❌'} Unknown function: ${unknownFunc.displayValue}`);
  record(unknownPass);

  const sqrtNeg = formulaEngine.calculate('=SQRT(-1)', 'sheet1', 0, 0, dataProvider);
  const sqrtNegPass = sqrtNeg.error === '#NUM!';
  console.log(`${sqrtNegPass ? '✅' : '❌'} SQRT negative: ${sqrtNeg.displayValue}`);
  record(sqrtNegPass);

  record(testFormula('=IFERROR(1/0,"Error")', 'Error', 'IFERROR'));

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY                                  ');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`📈 Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('════════════════════════════════════════════════════════════════\n');

  // Return results for report generation
  return {
    passed,
    failed,
    total: passed + failed,
    passRate: Math.round((passed / (passed + failed)) * 100),
    results: results.filter((r) => !r.passed), // Return failed tests
  };
};

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).runFormulaTests = runFormulaTests;
}

export default runFormulaTests;
