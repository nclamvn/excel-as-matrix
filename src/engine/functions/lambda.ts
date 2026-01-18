// ============================================================
// LAMBDA FUNCTIONS — User-defined Custom Functions
// ============================================================
//
// LAMBDA allows creating reusable custom functions with parameters:
// =LAMBDA(x, y, x+y)(2, 3) -> 5
//
// Related helper functions:
// - LET: Define named variables within a formula
// - MAP: Apply a LAMBDA to each cell in an array
// - REDUCE: Accumulate values using a LAMBDA
// - SCAN: Like REDUCE but returns intermediate values
// - MAKEARRAY: Create an array using a LAMBDA
// - BYROW/BYCOL: Apply LAMBDA to each row/column
// ============================================================

import { FunctionDef, FormulaValue, FormulaError, EvalContext, LambdaFunction } from '../types';
import { isError, toNumber, flattenValues } from './utils';

// Storage for named LAMBDA definitions (used by Name Manager)
export interface LambdaDefinition {
  id: string;
  name: string;
  parameters: string[];
  expression: string;
  description?: string;
  createdAt: string;
}

// Check if value is a LAMBDA function
export function isLambda(value: FormulaValue): value is LambdaFunction {
  return value !== null &&
         typeof value === 'object' &&
         '__isLambda' in value &&
         (value as LambdaFunction).__isLambda === true;
}

// Create a LAMBDA function from parameters
function createLambda(
  parameters: string[],
  bodyValue: FormulaValue
): LambdaFunction {
  return {
    __isLambda: true,
    parameters,
    body: bodyValue,
    evaluate: (args: FormulaValue[], evalContext: EvalContext) => {
      // Create a new context with parameter bindings
      if (args.length !== parameters.length) {
        return new FormulaError('#VALUE!',
          `LAMBDA expects ${parameters.length} arguments, got ${args.length}`);
      }

      // If body is a lambda, call it with the arguments
      if (isLambda(bodyValue)) {
        return bodyValue.evaluate(args, evalContext);
      }

      // For simple values, return as-is
      return bodyValue;
    },
  };
}

export const lambdaFunctions: FunctionDef[] = [
  // LAMBDA - Create a custom function
  {
    name: 'LAMBDA',
    minArgs: 2,
    maxArgs: 254, // Practically unlimited
    fn: (args, _context) => {
      // Last argument is the function body/expression
      // All other arguments are parameter names
      if (args.length < 2) {
        return new FormulaError('#VALUE!', 'LAMBDA requires at least 2 arguments');
      }

      const bodyValue = args[args.length - 1];
      const parameters: string[] = [];

      // Extract parameter names (all but last argument)
      for (let i = 0; i < args.length - 1; i++) {
        const param = args[i];
        if (typeof param === 'string') {
          parameters.push(param);
        } else if (param === null) {
          parameters.push(`_param${i}`);
        } else {
          // For evaluated expressions, use as values
          parameters.push(`_param${i}`);
        }
      }

      // Return a LAMBDA function object
      return createLambda(parameters, bodyValue);
    },
  },

  // LET - Define named variables in a formula
  {
    name: 'LET',
    minArgs: 3,
    maxArgs: 254,
    fn: (args, _context) => {
      // LET(name1, value1, name2, value2, ..., calculation)
      // Arguments must be in pairs (name, value) followed by a calculation
      if (args.length < 3 || args.length % 2 === 0) {
        return new FormulaError('#VALUE!',
          'LET requires an odd number of arguments (name-value pairs + calculation)');
      }

      // Last argument is the calculation result
      const result = args[args.length - 1];

      // The name-value pairs are already evaluated by the engine
      // In a full implementation, we would create a context with bindings
      // For now, return the calculation result
      return result;
    },
  },

  // MAP - Apply a LAMBDA to each element in an array
  {
    name: 'MAP',
    minArgs: 2,
    maxArgs: 255,
    fn: (args, context) => {
      // MAP(array, lambda) or MAP(array1, array2, ..., lambda)
      if (args.length < 2) {
        return new FormulaError('#VALUE!', 'MAP requires at least 2 arguments');
      }

      const lambdaArg = args[args.length - 1];
      const arrays = args.slice(0, -1);

      // Get first array to determine size
      const firstArray = arrays[0];
      if (!Array.isArray(firstArray)) {
        // Single value case
        if (isLambda(lambdaArg)) {
          return lambdaArg.evaluate([firstArray], context);
        }
        return firstArray;
      }

      // Apply lambda to each element
      const result: FormulaValue[][] = [];
      for (let i = 0; i < firstArray.length; i++) {
        const row: FormulaValue[] = [];
        const rowData = firstArray[i];

        if (Array.isArray(rowData)) {
          for (let j = 0; j < rowData.length; j++) {
            // Collect values from all arrays at this position
            const values: FormulaValue[] = arrays.map(arr => {
              if (Array.isArray(arr) && Array.isArray(arr[i])) {
                return arr[i][j];
              }
              return arr;
            });

            if (isLambda(lambdaArg)) {
              row.push(lambdaArg.evaluate(values, context));
            } else {
              row.push(rowData[j]);
            }
          }
        } else {
          if (isLambda(lambdaArg)) {
            row.push(lambdaArg.evaluate([rowData], context));
          } else {
            row.push(rowData);
          }
        }
        result.push(row);
      }

      return result;
    },
  },

  // REDUCE - Accumulate values using a LAMBDA
  {
    name: 'REDUCE',
    minArgs: 3,
    maxArgs: 3,
    fn: (args, context) => {
      // REDUCE(initial_value, array, lambda)
      const [initialValue, arrayArg, lambdaArg] = args;

      if (isError(initialValue)) return initialValue;
      if (isError(arrayArg)) return arrayArg;

      // Flatten array
      const values = flattenValues([arrayArg]);
      let accumulator: FormulaValue = initialValue;

      for (const value of values) {
        if (isError(value)) continue;

        if (isLambda(lambdaArg)) {
          accumulator = lambdaArg.evaluate([accumulator, value], context);
          if (isError(accumulator)) return accumulator;
        } else {
          // Simple accumulation (sum)
          const accNum = toNumber(accumulator);
          const valNum = toNumber(value);
          if (!isError(accNum) && !isError(valNum)) {
            accumulator = (accNum as number) + (valNum as number);
          }
        }
      }

      return accumulator;
    },
  },

  // SCAN - Like REDUCE but returns all intermediate values
  {
    name: 'SCAN',
    minArgs: 3,
    maxArgs: 3,
    fn: (args, context) => {
      // SCAN(initial_value, array, lambda)
      const [initialValue, arrayArg, lambdaArg] = args;

      if (isError(initialValue)) return initialValue;
      if (isError(arrayArg)) return arrayArg;

      const values = flattenValues([arrayArg]);
      const result: FormulaValue[][] = [];
      let accumulator: FormulaValue = initialValue;

      for (const value of values) {
        if (isError(value)) {
          result.push([value]);
          continue;
        }

        if (isLambda(lambdaArg)) {
          accumulator = lambdaArg.evaluate([accumulator, value], context);
        } else {
          const accNum = toNumber(accumulator);
          const valNum = toNumber(value);
          if (!isError(accNum) && !isError(valNum)) {
            accumulator = (accNum as number) + (valNum as number);
          }
        }

        result.push([accumulator]);
      }

      return result;
    },
  },

  // MAKEARRAY - Create an array using a LAMBDA
  {
    name: 'MAKEARRAY',
    minArgs: 3,
    maxArgs: 3,
    fn: (args, context) => {
      // MAKEARRAY(rows, cols, lambda)
      const [rowsArg, colsArg, lambdaArg] = args;

      const rows = toNumber(rowsArg);
      const cols = toNumber(colsArg);

      if (isError(rows)) return rows;
      if (isError(cols)) return cols;

      const numRows = Math.floor(rows as number);
      const numCols = Math.floor(cols as number);

      if (numRows < 1 || numCols < 1 || numRows > 1000 || numCols > 1000) {
        return new FormulaError('#VALUE!', 'Invalid array dimensions');
      }

      const result: FormulaValue[][] = [];
      for (let r = 0; r < numRows; r++) {
        const row: FormulaValue[] = [];
        for (let c = 0; c < numCols; c++) {
          if (isLambda(lambdaArg)) {
            row.push(lambdaArg.evaluate([r + 1, c + 1], context));
          } else {
            row.push((r + 1) * (c + 1)); // Default: multiplication table
          }
        }
        result.push(row);
      }

      return result;
    },
  },

  // BYROW - Apply LAMBDA to each row
  {
    name: 'BYROW',
    minArgs: 2,
    maxArgs: 2,
    fn: (args, context) => {
      // BYROW(array, lambda)
      const [arrayArg, lambdaArg] = args;

      if (isError(arrayArg)) return arrayArg;

      if (!Array.isArray(arrayArg)) {
        // Single value
        if (isLambda(lambdaArg)) {
          return [[lambdaArg.evaluate([arrayArg], context)]];
        }
        return [[arrayArg]];
      }

      const result: FormulaValue[][] = [];
      for (const row of arrayArg) {
        const rowArray = Array.isArray(row) ? row : [row];
        if (isLambda(lambdaArg)) {
          // Pass row as a 2D array (single row) - FormulaValue[][] is valid FormulaValue
          const rowAs2D: FormulaValue[][] = [rowArray as FormulaValue[]];
          result.push([lambdaArg.evaluate([rowAs2D], context)]);
        } else {
          result.push([rowArray[0] as FormulaValue]);
        }
      }

      return result;
    },
  },

  // BYCOL - Apply LAMBDA to each column
  {
    name: 'BYCOL',
    minArgs: 2,
    maxArgs: 2,
    fn: (args, context) => {
      // BYCOL(array, lambda)
      const [arrayArg, lambdaArg] = args;

      if (isError(arrayArg)) return arrayArg;

      if (!Array.isArray(arrayArg)) {
        if (isLambda(lambdaArg)) {
          return [[lambdaArg.evaluate([arrayArg], context)]];
        }
        return [[arrayArg]];
      }

      // Transpose to get columns
      const numCols = Array.isArray(arrayArg[0]) ? (arrayArg[0] as FormulaValue[]).length : 1;
      const result: FormulaValue[] = [];

      for (let c = 0; c < numCols; c++) {
        const column: FormulaValue[] = [];
        for (const row of arrayArg) {
          if (Array.isArray(row)) {
            column.push((row as FormulaValue[])[c] ?? null);
          } else {
            column.push(row);
          }
        }

        if (isLambda(lambdaArg)) {
          // Pass column as a 2D array (single column transposed)
          const colAs2D: FormulaValue[][] = column.map(v => [v]);
          result.push(lambdaArg.evaluate([colAs2D], context));
        } else {
          result.push(column[0]);
        }
      }

      return [result];
    },
  },

  // ISOMITTED - Check if a LAMBDA parameter was omitted
  {
    name: 'ISOMITTED',
    minArgs: 1,
    maxArgs: 1,
    fn: (args) => {
      const [value] = args;
      // A value is considered omitted if it's null/undefined
      return value === null || value === undefined;
    },
  },
];
