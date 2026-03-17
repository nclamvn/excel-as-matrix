import { FunctionDef } from '../types';
import { mathFunctions } from './math';
import { textFunctions } from './text';
import { logicalFunctions } from './logical';
import { dateFunctions } from './date';
import { statisticalFunctions } from './statistical';
import { lookupFunctions } from './lookup';
import { financialFunctions } from './financial';
import { arrayFunctions } from './array';
import { lambdaFunctions } from './lambda';
import { engineeringFunctions } from './engineering';
import { databaseFunctions } from './database';
import { infoFunctions } from './info';
import { webFunctions } from './web';
import { mathExtraFunctions } from './math_extra';
import { compatibilityFunctions } from './compatibility';

// Combine all functions
const allFunctions: FunctionDef[] = [
  ...mathFunctions,
  ...textFunctions,
  ...logicalFunctions,
  ...dateFunctions,
  ...statisticalFunctions,
  ...lookupFunctions,
  ...financialFunctions,
  ...arrayFunctions,
  ...lambdaFunctions,
  ...engineeringFunctions,
  ...databaseFunctions,
  ...infoFunctions,
  ...webFunctions,
  ...mathExtraFunctions,
  ...compatibilityFunctions,
];

// Create lookup map for fast function resolution
export const functionRegistry: Map<string, FunctionDef> = new Map();

for (const fn of allFunctions) {
  functionRegistry.set(fn.name.toUpperCase(), fn);
}

// Get function by name
export function getFunction(name: string): FunctionDef | undefined {
  return functionRegistry.get(name.toUpperCase());
}

// Check if function exists
export function hasFunction(name: string): boolean {
  return functionRegistry.has(name.toUpperCase());
}

// Get list of all function names
export function getAllFunctionNames(): string[] {
  return Array.from(functionRegistry.keys()).sort();
}

// Export individual function groups
export { mathFunctions, textFunctions, logicalFunctions, dateFunctions, statisticalFunctions, lookupFunctions, financialFunctions, arrayFunctions, lambdaFunctions, engineeringFunctions, databaseFunctions, infoFunctions, webFunctions, mathExtraFunctions, compatibilityFunctions };

// Export utils
export * from './utils';
