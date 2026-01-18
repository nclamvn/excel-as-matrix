// Large dataset generator for stress tests
import type { CellData, CellFormat } from '../../types/cell';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface DatasetConfig {
  rows: number;
  cols: number;
  includeFormulas?: boolean;
  formulaFrequency?: number; // 1 in N cells will have a formula
  includeFormatting?: boolean;
  formattingFrequency?: number;
  valueTypes?: Array<'number' | 'string' | 'date' | 'boolean' | 'empty'>;
  seed?: number; // For reproducible random data
}

export interface GeneratedDataset {
  cells: Record<string, CellData>;
  stats: {
    totalCells: number;
    formulaCells: number;
    formattedCells: number;
    emptyCells: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Seeded Random Number Generator
// ═══════════════════════════════════════════════════════════════════════════

class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Generators
// ═══════════════════════════════════════════════════════════════════════════

function numberToColLetter(num: number): string {
  let result = '';
  let n = num;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

function generateValue(
  random: SeededRandom,
  valueTypes: Array<'number' | 'string' | 'date' | 'boolean' | 'empty'>,
  row: number,
  col: number
): string | number | boolean | null {
  const type = random.choice(valueTypes);

  switch (type) {
    case 'number':
      return Math.round(random.nextFloat(-10000, 10000) * 100) / 100;

    case 'string':
      const words = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
      return `${random.choice(words)}_${row}_${col}`;

    case 'date': {
      const year = random.nextInt(2020, 2025);
      const month = random.nextInt(1, 12);
      const day = random.nextInt(1, 28);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    case 'boolean':
      return random.next() > 0.5;

    case 'empty':
      return null;

    default:
      return null;
  }
}

function generateFormula(
  random: SeededRandom,
  row: number,
  col: number,
  maxRow: number,
  maxCol: number
): string | null {
  if (row === 0 || col === 0) return null;

  const formulaTypes = ['sum', 'average', 'ref', 'arithmetic', 'if'];
  const type = random.choice(formulaTypes);

  const colLetter = numberToColLetter(col);
  const prevColLetter = numberToColLetter(Math.max(0, col - 1));

  switch (type) {
    case 'sum': {
      const startRow = Math.max(1, row - random.nextInt(1, 10));
      return `=SUM(${colLetter}${startRow}:${colLetter}${row})`;
    }

    case 'average': {
      const startRow = Math.max(1, row - random.nextInt(1, 10));
      return `=AVERAGE(${colLetter}${startRow}:${colLetter}${row})`;
    }

    case 'ref':
      return `=${prevColLetter}${row}`;

    case 'arithmetic': {
      const op = random.choice(['+', '-', '*']);
      return `=${colLetter}${row - 1}${op}${random.nextInt(1, 10)}`;
    }

    case 'if': {
      return `=IF(${colLetter}${row - 1}>0,${colLetter}${row - 1},0)`;
    }

    default:
      return null;
  }
}

function generateFormat(random: SeededRandom): CellFormat {
  const format: CellFormat = {};

  if (random.next() > 0.7) format.bold = true;
  if (random.next() > 0.8) format.italic = true;
  if (random.next() > 0.9) format.underline = true;

  if (random.next() > 0.8) {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
    format.textColor = random.choice(colors);
  }

  if (random.next() > 0.85) {
    const bgColors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff'];
    format.backgroundColor = random.choice(bgColors);
  }

  if (random.next() > 0.7) {
    const aligns: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    format.horizontalAlign = random.choice(aligns);
  }

  return format;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Generator Functions
// ═══════════════════════════════════════════════════════════════════════════

export function generateLargeDataset(config: DatasetConfig): GeneratedDataset {
  const {
    rows,
    cols,
    includeFormulas = false,
    formulaFrequency = 20,
    includeFormatting = false,
    formattingFrequency = 10,
    valueTypes = ['number'],
    seed = 12345,
  } = config;

  const random = new SeededRandom(seed);
  const cells: Record<string, CellData> = {};
  let formulaCells = 0;
  let formattedCells = 0;
  let emptyCells = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row}:${col}`;
      let value = generateValue(random, valueTypes, row, col);
      let formula: string | null = null;
      let format: CellFormat | undefined;

      // Add formula
      if (includeFormulas && row > 0 && random.nextInt(1, formulaFrequency) === 1) {
        formula = generateFormula(random, row, col, rows, cols);
        if (formula) {
          formulaCells++;
          value = null; // Formula cells start with null value
        }
      }

      // Add formatting
      if (includeFormatting && random.nextInt(1, formattingFrequency) === 1) {
        format = generateFormat(random);
        formattedCells++;
      }

      if (value === null && !formula) {
        emptyCells++;
      }

      cells[key] = {
        value,
        formula,
        displayValue: formula || String(value ?? ''),
        format,
      };
    }
  }

  return {
    cells,
    stats: {
      totalCells: rows * cols,
      formulaCells,
      formattedCells,
      emptyCells,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Preset Datasets
// ═══════════════════════════════════════════════════════════════════════════

// Small dataset for quick tests (100 cells)
export function generateSmallDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 10,
    cols: 10,
    valueTypes: ['number', 'string'],
    seed: 1,
  });
}

// Medium dataset for standard tests (10,000 cells)
export function generateMediumDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 100,
    cols: 100,
    includeFormulas: true,
    formulaFrequency: 20,
    includeFormatting: true,
    formattingFrequency: 15,
    valueTypes: ['number', 'string', 'date'],
    seed: 42,
  });
}

// Large dataset for stress tests (100,000 cells)
export function generateStressDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 1000,
    cols: 100,
    includeFormulas: true,
    formulaFrequency: 50,
    includeFormatting: true,
    formattingFrequency: 25,
    valueTypes: ['number', 'string', 'date', 'boolean', 'empty'],
    seed: 9999,
  });
}

// Extra large dataset for extreme stress tests (1,000,000 cells)
export function generateExtremeDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 10000,
    cols: 100,
    includeFormulas: false, // Formulas would make this too slow
    includeFormatting: false,
    valueTypes: ['number'],
    seed: 123456,
  });
}

// Formula-heavy dataset for formula engine stress tests
export function generateFormulaHeavyDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 500,
    cols: 20,
    includeFormulas: true,
    formulaFrequency: 3, // 1 in 3 cells has a formula
    includeFormatting: false,
    valueTypes: ['number'],
    seed: 7777,
  });
}

// Diverse data types dataset
export function generateDiverseDataset(): GeneratedDataset {
  return generateLargeDataset({
    rows: 200,
    cols: 50,
    includeFormulas: true,
    formulaFrequency: 10,
    includeFormatting: true,
    formattingFrequency: 5,
    valueTypes: ['number', 'string', 'date', 'boolean', 'empty'],
    seed: 2468,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Specific Test Data Generators
// ═══════════════════════════════════════════════════════════════════════════

// Generate data with known values for assertion testing
export function generateSequentialNumbers(rows: number, cols: number): Record<string, CellData> {
  const cells: Record<string, CellData> = {};
  let counter = 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row}:${col}`;
      cells[key] = {
        value: counter,
        formula: null,
        displayValue: String(counter),
      };
      counter++;
    }
  }

  return cells;
}

// Generate data with circular formula references (for error testing)
export function generateCircularReferences(): Record<string, CellData> {
  return {
    '0:0': { value: null, formula: '=B1+1', displayValue: '=B1+1' },
    '0:1': { value: null, formula: '=C1+1', displayValue: '=C1+1' },
    '0:2': { value: null, formula: '=A1+1', displayValue: '=A1+1' }, // Circular!
  };
}

// Generate data with dependent formulas (chain)
export function generateFormulaChain(length: number): Record<string, CellData> {
  const cells: Record<string, CellData> = {};

  // First cell is a value
  cells['0:0'] = { value: 1, formula: null, displayValue: '1' };

  // Each subsequent cell references the previous
  for (let i = 1; i < length; i++) {
    const prevCol = numberToColLetter(i - 1);
    cells[`0:${i}`] = {
      value: null,
      formula: `=${prevCol}1+1`,
      displayValue: `=${prevCol}1+1`,
    };
  }

  return cells;
}

// Generate sparse data (few cells in large range)
export function generateSparseData(
  maxRow: number,
  maxCol: number,
  cellCount: number,
  seed: number = 54321
): Record<string, CellData> {
  const random = new SeededRandom(seed);
  const cells: Record<string, CellData> = {};

  for (let i = 0; i < cellCount; i++) {
    const row = random.nextInt(0, maxRow - 1);
    const col = random.nextInt(0, maxCol - 1);
    const key = `${row}:${col}`;

    cells[key] = {
      value: random.nextFloat(0, 1000),
      formula: null,
      displayValue: String(random.nextFloat(0, 1000)),
    };
  }

  return cells;
}

export default {
  generateLargeDataset,
  generateSmallDataset,
  generateMediumDataset,
  generateStressDataset,
  generateExtremeDataset,
  generateFormulaHeavyDataset,
  generateDiverseDataset,
  generateSequentialNumbers,
  generateCircularReferences,
  generateFormulaChain,
  generateSparseData,
};
