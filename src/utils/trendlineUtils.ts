// ============================================================
// TRENDLINE UTILITIES — Calculate and Generate Trendlines
// ============================================================

export type TrendlineType = 'linear' | 'exponential' | 'logarithmic' | 'polynomial' | 'moving-average' | 'power';

export interface TrendlineConfig {
  type: TrendlineType;
  degree?: number;         // For polynomial
  period?: number;         // For moving average
  displayEquation?: boolean;
  displayRSquared?: boolean;
  forward?: number;        // Forecast forward periods
  backward?: number;       // Forecast backward periods
  color?: string;
  strokeWidth?: number;
  dashArray?: string;
}

export interface TrendlineResult {
  points: [number, number][];
  equation: string;
  rSquared: number;
  coefficients: number[];
}

// Linear regression: y = mx + b
export function calculateLinearTrendline(
  xValues: number[],
  yValues: number[],
  forward: number = 0,
  backward: number = 0
): TrendlineResult {
  const n = xValues.length;
  if (n < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssTot = yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = xValues.reduce((acc, x, i) => {
    const predicted = slope * x + intercept;
    return acc + Math.pow(yValues[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate points
  const minX = Math.min(...xValues) - backward;
  const maxX = Math.max(...xValues) + forward;
  const step = (maxX - minX) / 100;
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x += step) {
    points.push([x, slope * x + intercept]);
  }

  const equation = `y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+' : ''} ${intercept.toFixed(4)}`;

  return { points, equation, rSquared, coefficients: [slope, intercept] };
}

// Exponential: y = a * e^(bx) or y = a * b^x
export function calculateExponentialTrendline(
  xValues: number[],
  yValues: number[],
  forward: number = 0,
  backward: number = 0
): TrendlineResult {
  const n = xValues.length;
  if (n < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  // Take log of y values (filter out non-positive values)
  const validIndices: number[] = [];
  const logY: number[] = [];
  for (let i = 0; i < n; i++) {
    if (yValues[i] > 0) {
      validIndices.push(i);
      logY.push(Math.log(yValues[i]));
    }
  }

  if (validIndices.length < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  const validX = validIndices.map(i => xValues[i]);
  const validY = validIndices.map(i => yValues[i]);

  // Linear regression on log values
  const sumX = validX.reduce((a, b) => a + b, 0);
  const sumLogY = logY.reduce((a, b) => a + b, 0);
  const sumXLogY = validX.reduce((acc, x, i) => acc + x * logY[i], 0);
  const sumX2 = validX.reduce((acc, x) => acc + x * x, 0);

  const m = validX.length;
  const b = (m * sumXLogY - sumX * sumLogY) / (m * sumX2 - sumX * sumX);
  const a = Math.exp((sumLogY - b * sumX) / m);

  // Calculate R²
  const yMean = validY.reduce((a, b) => a + b, 0) / m;
  const ssTot = validY.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = validX.reduce((acc, x, i) => {
    const predicted = a * Math.exp(b * x);
    return acc + Math.pow(validY[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate points
  const minX = Math.min(...xValues) - backward;
  const maxX = Math.max(...xValues) + forward;
  const step = (maxX - minX) / 100;
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x += step) {
    const y = a * Math.exp(b * x);
    if (isFinite(y) && y >= 0) {
      points.push([x, y]);
    }
  }

  const equation = `y = ${a.toFixed(4)}e^(${b.toFixed(4)}x)`;

  return { points, equation, rSquared, coefficients: [a, b] };
}

// Logarithmic: y = a * ln(x) + b
export function calculateLogarithmicTrendline(
  xValues: number[],
  yValues: number[],
  forward: number = 0
): TrendlineResult {
  const n = xValues.length;
  if (n < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  // Filter out non-positive x values
  const validIndices: number[] = [];
  const logX: number[] = [];
  for (let i = 0; i < n; i++) {
    if (xValues[i] > 0) {
      validIndices.push(i);
      logX.push(Math.log(xValues[i]));
    }
  }

  if (validIndices.length < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  const validY = validIndices.map(i => yValues[i]);

  // Linear regression on log(x)
  const m = logX.length;
  const sumLogX = logX.reduce((a, b) => a + b, 0);
  const sumY = validY.reduce((a, b) => a + b, 0);
  const sumLogXY = logX.reduce((acc, x, i) => acc + x * validY[i], 0);
  const sumLogX2 = logX.reduce((acc, x) => acc + x * x, 0);

  const a = (m * sumLogXY - sumLogX * sumY) / (m * sumLogX2 - sumLogX * sumLogX);
  const b = (sumY - a * sumLogX) / m;

  // Calculate R²
  const yMean = sumY / m;
  const ssTot = validY.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = logX.reduce((acc, lx, i) => {
    const predicted = a * lx + b;
    return acc + Math.pow(validY[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate points
  const minX = Math.max(0.1, Math.min(...xValues));
  const maxX = Math.max(...xValues) + forward;
  const step = (maxX - minX) / 100;
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x += step) {
    if (x > 0) {
      points.push([x, a * Math.log(x) + b]);
    }
  }

  const equation = `y = ${a.toFixed(4)}ln(x) ${b >= 0 ? '+' : ''} ${b.toFixed(4)}`;

  return { points, equation, rSquared, coefficients: [a, b] };
}

// Polynomial: y = a_n*x^n + ... + a_1*x + a_0
export function calculatePolynomialTrendline(
  xValues: number[],
  yValues: number[],
  degree: number = 2,
  forward: number = 0,
  backward: number = 0
): TrendlineResult {
  const n = xValues.length;
  if (n < degree + 1) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  // Build Vandermonde matrix
  const matrix: number[][] = [];
  const rhs: number[] = [];

  for (let i = 0; i <= degree; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      row.push(xValues.reduce((sum, x) => sum + Math.pow(x, i + j), 0));
    }
    matrix.push(row);
    rhs.push(xValues.reduce((sum, x, k) => sum + Math.pow(x, i) * yValues[k], 0));
  }

  // Solve using Gaussian elimination
  const coefficients = solveLinearSystem(matrix, rhs);
  if (!coefficients) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  // Calculate R²
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;
  const ssTot = yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = xValues.reduce((acc, x, i) => {
    let predicted = 0;
    for (let j = 0; j <= degree; j++) {
      predicted += coefficients[j] * Math.pow(x, j);
    }
    return acc + Math.pow(yValues[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate points
  const minX = Math.min(...xValues) - backward;
  const maxX = Math.max(...xValues) + forward;
  const step = (maxX - minX) / 100;
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x += step) {
    let y = 0;
    for (let j = 0; j <= degree; j++) {
      y += coefficients[j] * Math.pow(x, j);
    }
    points.push([x, y]);
  }

  // Build equation string
  let equation = 'y = ';
  for (let i = degree; i >= 0; i--) {
    const coef = coefficients[i];
    if (i === degree) {
      equation += `${coef.toFixed(4)}x^${i}`;
    } else if (i > 1) {
      equation += ` ${coef >= 0 ? '+' : ''} ${coef.toFixed(4)}x^${i}`;
    } else if (i === 1) {
      equation += ` ${coef >= 0 ? '+' : ''} ${coef.toFixed(4)}x`;
    } else {
      equation += ` ${coef >= 0 ? '+' : ''} ${coef.toFixed(4)}`;
    }
  }

  return { points, equation, rSquared, coefficients };
}

// Power: y = a * x^b
export function calculatePowerTrendline(
  xValues: number[],
  yValues: number[],
  forward: number = 0
): TrendlineResult {
  const n = xValues.length;
  if (n < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  // Filter out non-positive values
  const validIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (xValues[i] > 0 && yValues[i] > 0) {
      validIndices.push(i);
    }
  }

  if (validIndices.length < 2) {
    return { points: [], equation: 'N/A', rSquared: 0, coefficients: [] };
  }

  const logX = validIndices.map(i => Math.log(xValues[i]));
  const logY = validIndices.map(i => Math.log(yValues[i]));
  const validY = validIndices.map(i => yValues[i]);

  // Linear regression on log-log
  const m = logX.length;
  const sumLogX = logX.reduce((a, b) => a + b, 0);
  const sumLogY = logY.reduce((a, b) => a + b, 0);
  const sumLogXLogY = logX.reduce((acc, x, i) => acc + x * logY[i], 0);
  const sumLogX2 = logX.reduce((acc, x) => acc + x * x, 0);

  const b = (m * sumLogXLogY - sumLogX * sumLogY) / (m * sumLogX2 - sumLogX * sumLogX);
  const a = Math.exp((sumLogY - b * sumLogX) / m);

  // Calculate R²
  const yMean = validY.reduce((a, b) => a + b, 0) / m;
  const ssTot = validY.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssRes = validIndices.reduce((acc, i) => {
    const predicted = a * Math.pow(xValues[i], b);
    return acc + Math.pow(yValues[i] - predicted, 2);
  }, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate points
  const minX = Math.max(0.1, Math.min(...xValues));
  const maxX = Math.max(...xValues) + forward;
  const step = (maxX - minX) / 100;
  const points: [number, number][] = [];
  for (let x = minX; x <= maxX; x += step) {
    if (x > 0) {
      const y = a * Math.pow(x, b);
      if (isFinite(y)) {
        points.push([x, y]);
      }
    }
  }

  const equation = `y = ${a.toFixed(4)}x^${b.toFixed(4)}`;

  return { points, equation, rSquared, coefficients: [a, b] };
}

// Moving Average
export function calculateMovingAverage(
  xValues: number[],
  yValues: number[],
  period: number = 3
): TrendlineResult {
  const n = yValues.length;
  if (n < period) {
    return { points: [], equation: `${period}-period MA`, rSquared: 0, coefficients: [] };
  }

  const points: [number, number][] = [];
  for (let i = period - 1; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += yValues[i - j];
    }
    points.push([xValues[i], sum / period]);
  }

  return {
    points,
    equation: `${period}-period Moving Average`,
    rSquared: 0, // R² not applicable for MA
    coefficients: [period],
  };
}

// Helper: Solve linear system using Gaussian elimination
function solveLinearSystem(matrix: number[][], rhs: number[]): number[] | null {
  const n = matrix.length;
  const aug: number[][] = matrix.map((row, i) => [...row, rhs[i]]);

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    if (Math.abs(aug[col][col]) < 1e-10) {
      return null; // Singular matrix
    }

    // Eliminate
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const solution: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= aug[i][j] * solution[j];
    }
    solution[i] /= aug[i][i];
  }

  return solution;
}

// Main function to calculate trendline based on config
export function calculateTrendline(
  xValues: number[],
  yValues: number[],
  config: TrendlineConfig
): TrendlineResult {
  switch (config.type) {
    case 'linear':
      return calculateLinearTrendline(xValues, yValues, config.forward || 0, config.backward || 0);
    case 'exponential':
      return calculateExponentialTrendline(xValues, yValues, config.forward || 0, config.backward || 0);
    case 'logarithmic':
      return calculateLogarithmicTrendline(xValues, yValues, config.forward || 0);
    case 'polynomial':
      return calculatePolynomialTrendline(xValues, yValues, config.degree || 2, config.forward || 0, config.backward || 0);
    case 'power':
      return calculatePowerTrendline(xValues, yValues, config.forward || 0);
    case 'moving-average':
      return calculateMovingAverage(xValues, yValues, config.period || 3);
    default:
      return calculateLinearTrendline(xValues, yValues);
  }
}

// Default trendline configs
export const DEFAULT_TRENDLINE_CONFIGS: Record<TrendlineType, Partial<TrendlineConfig>> = {
  linear: { type: 'linear', displayEquation: true, displayRSquared: true },
  exponential: { type: 'exponential', displayEquation: true, displayRSquared: true },
  logarithmic: { type: 'logarithmic', displayEquation: true, displayRSquared: true },
  polynomial: { type: 'polynomial', degree: 2, displayEquation: true, displayRSquared: true },
  power: { type: 'power', displayEquation: true, displayRSquared: true },
  'moving-average': { type: 'moving-average', period: 3 },
};
