// ═══════════════════════════════════════════════════════════════════════════
// SOLVER ENGINE — Goal Seek + Linear/Nonlinear Solver
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalSeekParams {
  /** Function that takes the variable value and returns the formula result */
  evaluate: (x: number) => number;
  /** Target value to seek */
  targetValue: number;
  /** Initial guess for the variable */
  initialGuess: number;
  /** Maximum iterations */
  maxIterations?: number;
  /** Convergence tolerance */
  tolerance?: number;
}

export interface GoalSeekResult {
  found: boolean;
  value: number;
  iterations: number;
  error: number;
}

export interface SolverParams {
  /** Objective function: returns value to minimize/maximize */
  objective: (vars: number[]) => number;
  /** Initial variable values */
  initialValues: number[];
  /** Variable bounds: [min, max] per variable */
  bounds?: Array<[number, number]>;
  /** Constraints: returns true if constraint satisfied */
  constraints?: Array<(vars: number[]) => boolean>;
  /** 'min' or 'max' */
  goal: 'minimize' | 'maximize';
  /** Maximum iterations */
  maxIterations?: number;
  /** Convergence tolerance */
  tolerance?: number;
}

export interface SolverResult {
  found: boolean;
  values: number[];
  objectiveValue: number;
  iterations: number;
  status: 'optimal' | 'max_iterations' | 'infeasible' | 'unbounded';
}

export interface ConstraintDef {
  type: 'le' | 'ge' | 'eq'; // <=, >=, =
  evaluate: (vars: number[]) => number;
  rhs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal Seek — Newton-Raphson with bisection fallback
// ─────────────────────────────────────────────────────────────────────────────

export function goalSeek(params: GoalSeekParams): GoalSeekResult {
  const {
    evaluate,
    targetValue,
    initialGuess,
    maxIterations = 100,
    tolerance = 1e-7,
  } = params;

  const f = (x: number) => evaluate(x) - targetValue;

  let x = initialGuess;
  let iterations = 0;

  // Newton-Raphson
  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    const fx = f(x);

    if (Math.abs(fx) < tolerance) {
      return { found: true, value: x, iterations, error: Math.abs(fx) };
    }

    // Numerical derivative
    const h = Math.max(Math.abs(x) * 1e-8, 1e-10);
    const fpx = (f(x + h) - f(x - h)) / (2 * h);

    if (Math.abs(fpx) < 1e-15) {
      // Derivative too small — switch to bisection
      break;
    }

    const xNew = x - fx / fpx;

    // Check for convergence
    if (Math.abs(xNew - x) < tolerance) {
      return { found: true, value: xNew, iterations, error: Math.abs(f(xNew)) };
    }

    x = xNew;
  }

  // Bisection fallback — find bracket first
  let lo = initialGuess - 100;
  let hi = initialGuess + 100;
  let fLo = f(lo);
  let fHi = f(hi);

  // Try to find a bracket
  for (let expand = 0; expand < 20 && fLo * fHi > 0; expand++) {
    lo -= 100 * (expand + 1);
    hi += 100 * (expand + 1);
    fLo = f(lo);
    fHi = f(hi);
  }

  if (fLo * fHi > 0) {
    return { found: false, value: x, iterations, error: Math.abs(f(x)) };
  }

  // Bisection
  for (let i = iterations; i < maxIterations; i++) {
    iterations++;
    const mid = (lo + hi) / 2;
    const fMid = f(mid);

    if (Math.abs(fMid) < tolerance || (hi - lo) / 2 < tolerance) {
      return { found: true, value: mid, iterations, error: Math.abs(fMid) };
    }

    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }

  return { found: false, value: (lo + hi) / 2, iterations, error: Math.abs(f((lo + hi) / 2)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Solver — GRG (Generalized Reduced Gradient) for nonlinear
// ─────────────────────────────────────────────────────────────────────────────

export function solve(params: SolverParams): SolverResult {
  const {
    objective,
    initialValues,
    bounds,
    constraints = [],
    goal,
    maxIterations = 1000,
    tolerance = 1e-8,
  } = params;

  const n = initialValues.length;
  let vars = [...initialValues];
  let bestObj = goal === 'maximize' ? -Infinity : Infinity;
  let bestVars = [...vars];

  // Evaluate objective (negate for maximize since we minimize internally)
  const eval_ = (v: number[]) => goal === 'maximize' ? -objective(v) : objective(v);

  // Check constraints
  const feasible = (v: number[]) => {
    if (bounds) {
      for (let i = 0; i < n; i++) {
        if (v[i] < bounds[i][0] || v[i] > bounds[i][1]) return false;
      }
    }
    return constraints.every((c) => c(v));
  };

  // Gradient approximation
  const gradient = (v: number[]): number[] => {
    const grad = new Array(n);
    const fv = eval_(v);
    for (let i = 0; i < n; i++) {
      const h = Math.max(Math.abs(v[i]) * 1e-8, 1e-10);
      const vp = [...v];
      vp[i] += h;
      grad[i] = (eval_(vp) - fv) / h;
    }
    return grad;
  };

  // Clamp to bounds
  const clamp = (v: number[]): number[] => {
    if (!bounds) return v;
    return v.map((val, i) => Math.max(bounds[i][0], Math.min(bounds[i][1], val)));
  };

  let stepSize = 0.1;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations++;

    if (!feasible(vars)) {
      // Project back to feasible region
      vars = clamp(vars);
    }

    const obj = eval_(vars);
    const realObj = goal === 'maximize' ? -obj : obj;

    if ((goal === 'minimize' && realObj < bestObj) || (goal === 'maximize' && realObj > bestObj)) {
      bestObj = realObj;
      bestVars = [...vars];
    }

    const grad = gradient(vars);
    const gradNorm = Math.sqrt(grad.reduce((s, g) => s + g * g, 0));

    if (gradNorm < tolerance) {
      return {
        found: true,
        values: bestVars,
        objectiveValue: bestObj,
        iterations,
        status: 'optimal',
      };
    }

    // Line search with backtracking
    let alpha = stepSize;
    let newVars: number[];
    let newObj: number;

    for (let ls = 0; ls < 20; ls++) {
      newVars = clamp(vars.map((v, j) => v - alpha * grad[j]));
      newObj = eval_(newVars);

      if (newObj < obj - tolerance && feasible(newVars)) {
        vars = newVars;
        stepSize = Math.min(alpha * 1.2, 1.0);
        break;
      }
      alpha *= 0.5;

      if (ls === 19) {
        // Step too small, use best step
        vars = clamp(vars.map((v, j) => v - alpha * grad[j]));
        stepSize = alpha;
      }
    }
  }

  return {
    found: bestObj !== (goal === 'maximize' ? -Infinity : Infinity),
    values: bestVars,
    objectiveValue: bestObj,
    iterations,
    status: iterations >= maxIterations ? 'max_iterations' : 'optimal',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simplex Method for Linear Programming
// ─────────────────────────────────────────────────────────────────────────────

export interface SimplexParams {
  /** Objective coefficients (maximize c^T * x) */
  c: number[];
  /** Constraint matrix A (A*x <= b) */
  A: number[][];
  /** Constraint RHS */
  b: number[];
  /** Whether to minimize (default: maximize) */
  minimize?: boolean;
}

export function simplex(params: SimplexParams): SolverResult {
  const { c, A, b, minimize = false } = params;
  const m = A.length; // constraints
  const n = c.length; // variables

  // Build tableau: [A | I | b] with objective row
  const tableau: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row = [...A[i]];
    // Add slack variables
    for (let j = 0; j < m; j++) {
      row.push(i === j ? 1 : 0);
    }
    row.push(b[i]);
    tableau.push(row);
  }

  // Objective row
  const objRow = c.map((v) => minimize ? v : -v);
  for (let j = 0; j < m; j++) objRow.push(0);
  objRow.push(0);
  tableau.push(objRow);

  const basis = Array.from({ length: m }, (_, i) => n + i);
  let iterations = 0;

  // Simplex iterations
  for (let iter = 0; iter < 1000; iter++) {
    iterations++;
    const objRowIdx = tableau.length - 1;

    // Find pivot column (most negative coefficient in objective row)
    let pivotCol = -1;
    let minVal = -1e-10;
    for (let j = 0; j < n + m; j++) {
      if (tableau[objRowIdx][j] < minVal) {
        minVal = tableau[objRowIdx][j];
        pivotCol = j;
      }
    }

    if (pivotCol === -1) {
      // Optimal
      const values = new Array(n).fill(0);
      for (let i = 0; i < m; i++) {
        if (basis[i] < n) {
          values[basis[i]] = tableau[i][n + m];
        }
      }
      return {
        found: true,
        values,
        objectiveValue: minimize ? tableau[objRowIdx][n + m] : -tableau[objRowIdx][n + m],
        iterations,
        status: 'optimal',
      };
    }

    // Find pivot row (minimum ratio test)
    let pivotRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivotCol] > 1e-10) {
        const ratio = tableau[i][n + m] / tableau[i][pivotCol];
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRow = i;
        }
      }
    }

    if (pivotRow === -1) {
      return { found: false, values: new Array(n).fill(0), objectiveValue: 0, iterations, status: 'unbounded' };
    }

    // Pivot
    const pivotVal = tableau[pivotRow][pivotCol];
    for (let j = 0; j <= n + m; j++) {
      tableau[pivotRow][j] /= pivotVal;
    }

    for (let i = 0; i <= m; i++) {
      if (i !== pivotRow) {
        const factor = tableau[i][pivotCol];
        for (let j = 0; j <= n + m; j++) {
          tableau[i][j] -= factor * tableau[pivotRow][j];
        }
      }
    }

    basis[pivotRow] = pivotCol;
  }

  return { found: false, values: new Array(n).fill(0), objectiveValue: 0, iterations, status: 'max_iterations' };
}
