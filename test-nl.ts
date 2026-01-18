// Test NL Formula Engine
import { NLFormulaEngine } from './src/nlformula/NLFormulaEngine';

const engine = new NLFormulaEngine();

const testCases = [
  // English
  { text: 'sum of column A', lang: 'en' },
  { text: 'average of Sales', lang: 'en' },
  { text: 'count where Status equals Complete', lang: 'en' },
  { text: 'max of column B', lang: 'en' },
  { text: 'today', lang: 'en' },
  { text: 'lookup Apple in A return B', lang: 'en' },

  // Vietnamese
  { text: 'tổng của cột A', lang: 'vi' },
  { text: 'trung bình của Doanh số', lang: 'vi' },
  { text: 'đếm khi Trạng thái bằng Hoàn thành', lang: 'vi' },
];

const context = {
  cellRef: 'C1',
  sheetId: 'test-sheet-1',
  sheetName: 'TestSheet',
  headers: [
    { name: 'Status', colLetter: 'A', col: 0, dataType: 'text' as const, sampleValues: ['Complete', 'Pending', 'In Progress'] },
    { name: 'Sales', colLetter: 'B', col: 1, dataType: 'number' as const, sampleValues: [100, 200, 300] },
    { name: 'Trạng thái', colLetter: 'C', col: 2, dataType: 'text' as const, sampleValues: ['Hoàn thành', 'Đang xử lý'] },
    { name: 'Doanh số', colLetter: 'D', col: 3, dataType: 'number' as const, sampleValues: [1000, 2000, 3000] },
  ],
  dataRange: {
    startRow: 0,
    endRow: 100,
    startCol: 0,
    endCol: 4,
    hasHeaders: true,
    rowCount: 100,
    colCount: 4,
  },
};

async function runTests() {
  console.log('=== NL Formula Engine Test ===\n');

  for (const test of testCases) {
    const result = await engine.interpret({
      text: test.text,
      language: test.lang as 'en' | 'vi',
      context,
    });

    console.log('Input: "' + test.text + '" (' + test.lang + ')');
    if (result.success) {
      console.log('  Formula: ' + result.formula);
      console.log('  Confidence: ' + Math.round(result.confidence * 100) + '%');
      console.log('  Explanation: ' + result.explanation);
    } else {
      console.log('  Error: ' + result.error);
    }
    console.log('');
  }
}

runTests();
