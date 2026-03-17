import { useCallback, useEffect, useRef, useState } from 'react';
import { loggers } from '@/utils/logger';
import type {
  CalcWorkerMessage,
  CalcWorkerResponse,
  FormulaContext,
  BulkFormulaRequest,
  CalculationResult,
  AggregateOperation,
  DependencyGraph,
  CellMap,
  FormulaMap,
} from '../workers/calc.worker';

export interface CalcWorkerState {
  isReady: boolean;
  isCalculating: boolean;
  progress: number;
  error: string | null;
}

export interface UseCalcWorkerResult {
  // State
  state: CalcWorkerState;

  // Operations
  evaluateFormula: (formula: string, context: FormulaContext) => Promise<CalculationResult>;
  bulkCalculate: (formulas: BulkFormulaRequest[]) => Promise<CalculationResult[]>;
  aggregate: (operation: AggregateOperation, values: number[]) => Promise<number>;
  buildDependencyGraph: (formulas: FormulaMap) => Promise<DependencyGraph>;

  // Control
  cancel: (id: string) => void;
  terminate: () => void;
}

// Worker singleton
let workerInstance: Worker | null = null;
let workerRefCount = 0;

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/calc.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  workerRefCount++;
  return workerInstance;
}

function releaseWorker(): void {
  workerRefCount--;
  if (workerRefCount === 0 && workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}

// Generate unique IDs
let idCounter = 0;
function generateId(): string {
  return `calc-${Date.now()}-${idCounter++}`;
}

export function useCalcWorker(): UseCalcWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  const [state, setState] = useState<CalcWorkerState>({
    isReady: false,
    isCalculating: false,
    progress: 0,
    error: null,
  });

  // Initialize worker
  useEffect(() => {
    workerRef.current = getWorker();

    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<CalcWorkerResponse>) => {
      const message = event.data;
      const pending = pendingRef.current.get(message.id);

      switch (message.type) {
        case 'RESULT':
          pending?.resolve(message.result);
          pendingRef.current.delete(message.id);
          setState((s) => ({ ...s, isCalculating: false }));
          break;

        case 'BULK_RESULT':
          pending?.resolve(message.results);
          pendingRef.current.delete(message.id);
          setState((s) => ({ ...s, isCalculating: false, progress: 0 }));
          break;

        case 'AGGREGATE_RESULT':
          pending?.resolve(message.result);
          pendingRef.current.delete(message.id);
          setState((s) => ({ ...s, isCalculating: false }));
          break;

        case 'DEPENDENCY_GRAPH':
          pending?.resolve(message.graph);
          pendingRef.current.delete(message.id);
          setState((s) => ({ ...s, isCalculating: false }));
          break;

        case 'ERROR':
          pending?.reject(new Error(message.error));
          pendingRef.current.delete(message.id);
          setState((s) => ({
            ...s,
            isCalculating: false,
            error: message.error,
          }));
          break;

        case 'PROGRESS':
          setState((s) => ({
            ...s,
            progress: (message.progress / message.total) * 100,
          }));
          break;

        case 'CANCELLED':
          pending?.reject(new Error('Calculation cancelled'));
          pendingRef.current.delete(message.id);
          setState((s) => ({ ...s, isCalculating: false }));
          break;
      }
    };

    worker.onerror = (error) => {
      loggers.worker.error('Calc worker error:', error);
      setState((s) => ({
        ...s,
        isReady: false,
        error: error.message,
      }));
    };

    setState((s) => ({ ...s, isReady: true }));

    return () => {
      releaseWorker();
    };
  }, []);

  // Send message to worker
  const sendMessage = useCallback(<T,>(message: CalcWorkerMessage): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      pendingRef.current.set(message.id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      setState((s) => ({ ...s, isCalculating: true, error: null }));
      workerRef.current.postMessage(message);
    });
  }, []);

  // Evaluate single formula
  const evaluateFormula = useCallback(
    async (formula: string, context: FormulaContext): Promise<CalculationResult> => {
      const id = generateId();
      return sendMessage<CalculationResult>({
        type: 'EVALUATE_FORMULA',
        id,
        formula,
        context,
      });
    },
    [sendMessage]
  );

  // Bulk calculate formulas
  const bulkCalculate = useCallback(
    async (formulas: BulkFormulaRequest[]): Promise<CalculationResult[]> => {
      const id = generateId();
      return sendMessage<CalculationResult[]>({
        type: 'BULK_CALCULATE',
        id,
        formulas,
      });
    },
    [sendMessage]
  );

  // Aggregate operation
  const aggregate = useCallback(
    async (operation: AggregateOperation, values: number[]): Promise<number> => {
      const id = generateId();
      return sendMessage<number>({
        type: 'AGGREGATE',
        id,
        operation,
        values,
      });
    },
    [sendMessage]
  );

  // Build dependency graph
  const buildDependencyGraph = useCallback(
    async (formulas: FormulaMap): Promise<DependencyGraph> => {
      const id = generateId();
      return sendMessage<DependencyGraph>({
        type: 'BUILD_DEPENDENCY_GRAPH',
        id,
        formulas,
      });
    },
    [sendMessage]
  );

  // Cancel operation
  const cancel = useCallback((id: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL', id });
    }
  }, []);

  // Terminate worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setState({ isReady: false, isCalculating: false, progress: 0, error: null });
    }
  }, []);

  return {
    state,
    evaluateFormula,
    bulkCalculate,
    aggregate,
    buildDependencyGraph,
    cancel,
    terminate,
  };
}

// Hook for batch calculation with debouncing
export function useBatchCalculation(delay: number = 100) {
  const { state, bulkCalculate } = useCalcWorker();
  const pendingRef = useRef<BulkFormulaRequest[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const resolversRef = useRef<Map<string, (result: CalculationResult) => void>>(new Map());

  const queueCalculation = useCallback(
    (cellKey: string, formula: string): Promise<CalculationResult> => {
      return new Promise((resolve) => {
        pendingRef.current.push({ cellKey, formula });
        resolversRef.current.set(cellKey, resolve);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout for batch processing
        timeoutRef.current = setTimeout(async () => {
          const formulas = [...pendingRef.current];
          pendingRef.current = [];

          try {
            const results = await bulkCalculate(formulas);
            for (const result of results) {
              const resolver = resolversRef.current.get(result.cellKey);
              if (resolver) {
                resolver(result);
                resolversRef.current.delete(result.cellKey);
              }
            }
          } catch (error) {
            loggers.worker.error('Batch calculation failed:', error);
            // Resolve all pending with error state
            for (const { cellKey } of formulas) {
              const resolver = resolversRef.current.get(cellKey);
              if (resolver) {
                resolver({
                  cellKey,
                  value: null,
                  displayValue: '#ERROR!',
                  error: error instanceof Error ? error.message : 'Unknown error',
                });
                resolversRef.current.delete(cellKey);
              }
            }
          }
        }, delay);
      });
    },
    [bulkCalculate, delay]
  );

  return {
    state,
    queueCalculation,
    pendingCount: pendingRef.current.length,
  };
}

// Export types
export type {
  CalcWorkerMessage,
  CalcWorkerResponse,
  FormulaContext,
  BulkFormulaRequest,
  CalculationResult,
  AggregateOperation,
  DependencyGraph,
  CellMap,
  FormulaMap,
};
