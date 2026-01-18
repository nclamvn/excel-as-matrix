// =============================================================================
// BENCHMARK UTILITY — Performance testing for spreadsheet operations
// =============================================================================

import { formulaEngine } from '../engine/FormulaEngine';
import type { FormulaValue } from '../engine/types';

export interface BenchmarkResult {
  name: string;
  operations: number;
  totalTime: number;
  avgTime: number;
  opsPerSecond: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
}

export interface BenchmarkSuite {
  results: BenchmarkResult[];
  totalTime: number;
  summary: string;
}

/**
 * Run a benchmark test
 */
export async function runBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  iterations: number = 1000
): Promise<BenchmarkResult> {
  // Force garbage collection if available
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  }

  // Get memory before (if available)
  const memoryBefore = getMemoryUsage();

  // Warm up
  for (let i = 0; i < 10; i++) {
    await fn();
  }

  // Run benchmark
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn();
  }
  const end = performance.now();

  // Get memory after
  const memoryAfter = getMemoryUsage();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSecond = Math.round(iterations / (totalTime / 1000));

  return {
    name,
    operations: iterations,
    totalTime: Math.round(totalTime * 100) / 100,
    avgTime: Math.round(avgTime * 1000) / 1000,
    opsPerSecond,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryBefore && memoryAfter ? memoryAfter - memoryBefore : undefined,
  };
}

/**
 * Get current memory usage in MB
 */
function getMemoryUsage(): number | undefined {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
    return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
  }
  return undefined;
}

/**
 * Format benchmark results for console output
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const lines = [
    `📊 ${result.name}`,
    `   Operations: ${result.operations.toLocaleString()}`,
    `   Total Time: ${result.totalTime}ms`,
    `   Avg Time: ${result.avgTime}ms`,
    `   Ops/sec: ${result.opsPerSecond.toLocaleString()}`,
  ];

  if (result.memoryDelta !== undefined) {
    lines.push(`   Memory Δ: ${result.memoryDelta > 0 ? '+' : ''}${result.memoryDelta}MB`);
  }

  return lines.join('\n');
}

// =============================================================================
// SPREADSHEET-SPECIFIC BENCHMARKS
// =============================================================================

/**
 * Mock cell data provider for benchmarks
 */
function createMockDataProvider(rows: number, cols: number) {
  const data: Map<string, FormulaValue> = new Map();

  // Pre-populate with some data
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Numbers in first 3 columns
      if (c < 3) {
        data.set(`sheet1:${r}:${c}`, (r + 1) * (c + 1));
      }
      // Text in column 4
      else if (c === 3) {
        data.set(`sheet1:${r}:${c}`, `Item ${r + 1}`);
      }
    }
  }

  return {
    getCellValue: (sheetId: string, row: number, col: number): FormulaValue => {
      return data.get(`${sheetId}:${row}:${col}`) ?? null;
    },
    getCellFormula: (): string | undefined => undefined,
  };
}

/**
 * Benchmark formula calculation performance
 */
export async function benchmarkFormulaEngine(): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];
  const suiteStart = performance.now();

  // Clear cache before benchmarks
  formulaEngine.clearCache();

  // Test 1: Simple arithmetic
  results.push(
    await runBenchmark('Simple Arithmetic (=1+2*3)', () => {
      formulaEngine.calculate('=1+2*3', 'sheet1', 0, 0, createMockDataProvider(0, 0));
    }, 10000)
  );

  // Test 2: SUM function
  const sumProvider = createMockDataProvider(100, 5);
  results.push(
    await runBenchmark('SUM 100 cells', () => {
      formulaEngine.clearCache();
      formulaEngine.calculate('=SUM(A1:A100)', 'sheet1', 0, 5, sumProvider);
    }, 1000)
  );

  // Test 3: VLOOKUP
  const vlookupProvider = createMockDataProvider(1000, 5);
  results.push(
    await runBenchmark('VLOOKUP in 1000 rows', () => {
      formulaEngine.clearCache();
      formulaEngine.calculate('=VLOOKUP(500,A1:D1000,2,FALSE)', 'sheet1', 0, 5, vlookupProvider);
    }, 100)
  );

  // Test 4: Nested IF
  results.push(
    await runBenchmark('Nested IF (3 levels)', () => {
      formulaEngine.calculate('=IF(1>2,"A",IF(2>3,"B",IF(3>4,"C","D")))', 'sheet1', 0, 0, createMockDataProvider(0, 0));
    }, 5000)
  );

  // Test 5: Cache hit rate
  const cacheProvider = createMockDataProvider(100, 5);
  formulaEngine.clearCache();
  // Populate cache
  for (let i = 0; i < 100; i++) {
    formulaEngine.calculate(`=SUM(A${i + 1}:C${i + 1})`, 'sheet1', i, 5, cacheProvider);
  }
  results.push(
    await runBenchmark('Cache hit (pre-calculated)', () => {
      formulaEngine.getCachedResult('sheet1', 50, 5);
    }, 100000)
  );

  // Get cache stats
  const cacheStats = formulaEngine.getCacheStats();

  const suiteEnd = performance.now();
  const totalTime = Math.round((suiteEnd - suiteStart) * 100) / 100;

  const summary = [
    '=== Formula Engine Benchmark Summary ===',
    `Total Time: ${totalTime}ms`,
    `Cache Stats: ${cacheStats.size} entries, ${Math.round(cacheStats.hitRate * 100)}% hit rate`,
    '',
    ...results.map(formatBenchmarkResult),
  ].join('\n');

  return { results, totalTime, summary };
}

/**
 * Benchmark large dataset rendering simulation
 */
export async function benchmarkVirtualScrolling(
  rows: number = 100000,
  cols: number = 100
): Promise<BenchmarkResult> {
  // Simulate visible range calculation
  const visibleRows = 50;
  const visibleCols = 15;
  const overscan = 5;

  return runBenchmark(
    `Virtual scroll range calc (${rows.toLocaleString()} rows × ${cols} cols)`,
    () => {
      // Simulate what happens on each scroll
      const startRow = Math.floor(Math.random() * (rows - visibleRows));
      const startCol = Math.floor(Math.random() * (cols - visibleCols));

      const rowsToRender = visibleRows + overscan * 2;
      const colsToRender = visibleCols + overscan * 2;

      // Simulate cell position calculations
      const cells: Array<{ row: number; col: number; top: number; left: number }> = [];
      for (let r = 0; r < rowsToRender; r++) {
        for (let c = 0; c < colsToRender; c++) {
          cells.push({
            row: startRow + r,
            col: startCol + c,
            top: (startRow + r) * 24,
            left: (startCol + c) * 100,
          });
        }
      }
    },
    1000
  );
}

/**
 * Benchmark memory usage with large cell count
 */
export async function benchmarkMemoryUsage(cellCount: number = 100000): Promise<BenchmarkResult> {
  return runBenchmark(
    `Memory: create ${cellCount.toLocaleString()} cells`,
    () => {
      const cells = new Map<string, { value: number; formula: string | null }>();
      for (let i = 0; i < cellCount; i++) {
        const row = Math.floor(i / 100);
        const col = i % 100;
        cells.set(`${row}:${col}`, { value: i, formula: null });
      }
      cells.clear();
    },
    10
  );
}

/**
 * Run full benchmark suite
 */
export async function runFullBenchmarkSuite(): Promise<{
  formula: BenchmarkSuite;
  virtualScroll: BenchmarkResult;
  memory: BenchmarkResult;
}> {
  console.log('🚀 Starting ExcelAI Performance Benchmark Suite...\n');

  const formula = await benchmarkFormulaEngine();
  console.log(formula.summary);
  console.log('\n');

  const virtualScroll = await benchmarkVirtualScrolling();
  console.log(formatBenchmarkResult(virtualScroll));
  console.log('\n');

  const memory = await benchmarkMemoryUsage();
  console.log(formatBenchmarkResult(memory));

  console.log('\n✅ Benchmark suite completed!');

  return { formula, virtualScroll, memory };
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as { runBenchmark: typeof runFullBenchmarkSuite }).runBenchmark = runFullBenchmarkSuite;
}

export default runFullBenchmarkSuite;
