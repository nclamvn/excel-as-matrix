// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT ASSEMBLER — Main context assembly pipeline (Blueprint §5.3)
// ═══════════════════════════════════════════════════════════════════════════

import type {
  AssembledContext,
  ContextConfig,
  ParsedIntent,
  SerializedRange,
  CellSnapshot,
  TruncationRecord,
} from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { IntentParser } from './IntentParser';
import { TokenEstimator } from './TokenEstimator';
import { ContextSerializer } from './ContextSerializer';
import { getCellKey, colToLetter, parseCellRef } from '../../types/cell';

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ContextConfig = {
  maxTokens: 50000,
  priorityWeights: {
    directReference: 0.4,
    upstreamDeps: 0.25,
    downstreamDeps: 0.1,
    schemaContext: 0.15,
    recentEvents: 0.1,
  },
  truncationStrategy: 'hierarchical',
};

// ─────────────────────────────────────────────────────────────────────────────
// Context Assembler Class
// ─────────────────────────────────────────────────────────────────────────────

export class ContextAssembler {
  private config: ContextConfig;
  private intentParser: IntentParser;
  private tokenEstimator: TokenEstimator;
  private serializer: ContextSerializer;

  constructor(config: Partial<ContextConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.intentParser = new IntentParser();
    this.tokenEstimator = new TokenEstimator();
    this.serializer = new ContextSerializer();
  }

  /**
   * Main entry point: Assemble context for AI
   * Blueprint §5.3.2: Context Assembly Pipeline
   */
  async assembleContext(
    userMessage: string,
    conversationHistory: string[] = []
  ): Promise<AssembledContext> {
    const startTime = performance.now();
    const truncatedItems: TruncationRecord[] = [];
    const warnings: string[] = [];

    // Step 1: Parse user intent to identify referenced entities
    const intent = await this.intentParser.parse(userMessage, conversationHistory);

    // Step 2: Get current selection state
    const selectionStore = useSelectionStore.getState();
    const selectedCell = selectionStore.selectedCell;
    const selectionRange = selectionStore.selectionRange;

    // Step 3: Calculate token budgets by priority
    const budgets = this.calculateBudgets();

    // Step 4: Assemble direct data (highest priority)
    const directData = await this.assembleDirectData(
      intent,
      selectedCell,
      selectionRange,
      budgets.directReference,
      truncatedItems
    );

    // Step 5: Assemble dependency context
    const dependencyContext = await this.assembleDependencyContext(
      directData.ranges,
      budgets.upstreamDeps + budgets.downstreamDeps,
      truncatedItems
    );

    // Step 6: Assemble schema context
    const schemaContext = await this.assembleSchemaContext(
      budgets.schemaContext,
      truncatedItems
    );

    // Step 7: Assemble event context (recent changes)
    const eventContext = await this.assembleEventContext(
      budgets.recentEvents,
      truncatedItems
    );

    // Calculate totals
    const totalTokens =
      directData.tokensUsed +
      dependencyContext.tokensUsed +
      schemaContext.tokensUsed +
      eventContext.tokensUsed;

    const assemblyTime = performance.now() - startTime;

    return {
      directData,
      dependencyContext,
      schemaContext,
      eventContext,
      metadata: {
        totalTokens,
        budgetRemaining: this.config.maxTokens - totalTokens,
        truncatedItems,
        warnings,
        assemblyTime,
      },
    };
  }

  /**
   * Calculate token budgets based on priority weights
   */
  private calculateBudgets(): Record<string, number> {
    const { maxTokens, priorityWeights } = this.config;

    return {
      directReference: Math.floor(maxTokens * priorityWeights.directReference),
      upstreamDeps: Math.floor(maxTokens * priorityWeights.upstreamDeps),
      downstreamDeps: Math.floor(maxTokens * priorityWeights.downstreamDeps),
      schemaContext: Math.floor(maxTokens * priorityWeights.schemaContext),
      recentEvents: Math.floor(maxTokens * priorityWeights.recentEvents),
    };
  }

  /**
   * Assemble direct data (cells user is asking about)
   */
  private async assembleDirectData(
    intent: ParsedIntent,
    selectedCell: { row: number; col: number } | null,
    selectionRange: { start: { row: number; col: number }; end: { row: number; col: number } } | null,
    tokenBudget: number,
    truncatedItems: TruncationRecord[]
  ): Promise<AssembledContext['directData']> {
    const ranges: SerializedRange[] = [];
    let tokensUsed = 0;
    let totalCells = 0;

    // 1. Add explicitly referenced cells from intent
    for (const entity of intent.entities) {
      if (entity.resolved && entity.resolvedRef) {
        try {
          const range = this.serializer.serializeRange(entity.resolvedRef);
          const tokens = this.tokenEstimator.estimateRange(range);

          if (tokensUsed + tokens <= tokenBudget) {
            ranges.push(range);
            tokensUsed += tokens;
            totalCells += range.cellCount;
          } else {
            truncatedItems.push({
              itemType: 'referenced_range',
              originalSize: tokens,
              truncatedSize: 0,
              reason: 'Token budget exceeded',
            });
          }
        } catch {
          // Invalid range, skip
        }
      }
    }

    // 2. Add current selection
    if (selectionRange) {
      const rangeRef = this.getRangeRef(selectionRange);
      try {
        const range = this.serializer.serializeRange(rangeRef);
        const tokens = this.tokenEstimator.estimateRange(range);

        if (tokensUsed + tokens <= tokenBudget) {
          ranges.push(range);
          tokensUsed += tokens;
          totalCells += range.cellCount;
        }
      } catch {
        // Invalid range, skip
      }
    } else if (selectedCell) {
      const cellRef = this.getCellRef(selectedCell.row, selectedCell.col);
      try {
        const range = this.serializer.serializeRange(cellRef);
        const tokens = this.tokenEstimator.estimateRange(range);

        if (tokensUsed + tokens <= tokenBudget) {
          ranges.push(range);
          tokensUsed += tokens;
          totalCells += 1;
        }
      } catch {
        // Invalid ref, skip
      }
    }

    // 3. Add surrounding context (cells around selection)
    if (selectedCell && tokensUsed < tokenBudget * 0.8) {
      const surroundingRange = this.getSurroundingRange(selectedCell, 5);
      try {
        const range = this.serializer.serializeRange(surroundingRange);
        const tokens = this.tokenEstimator.estimateRange(range);

        if (tokensUsed + tokens <= tokenBudget) {
          ranges.push(range);
          tokensUsed += tokens;
          totalCells += range.cellCount;
        }
      } catch {
        // Invalid range, skip
      }
    }

    return { ranges, totalCells, tokensUsed };
  }

  /**
   * Assemble dependency context (upstream and downstream)
   */
  private async assembleDependencyContext(
    directRanges: SerializedRange[],
    tokenBudget: number,
    _truncatedItems: TruncationRecord[]
  ): Promise<AssembledContext['dependencyContext']> {
    const store = useWorkbookStore.getState();
    const activeSheetId = store.activeSheetId;
    const sheet = activeSheetId ? store.sheets[activeSheetId] : null;

    const upstreamCells: CellSnapshot[] = [];
    const downstreamCells: CellSnapshot[] = [];
    const formulaChain: string[] = [];
    let tokensUsed = 0;

    if (!sheet) {
      return { upstreamCells, downstreamCells, formulaChain, tokensUsed };
    }

    // Get all cells from direct ranges
    const directCells = new Set<string>();
    for (const range of directRanges) {
      this.getCellsInRange(range.ref).forEach((ref) => directCells.add(ref));
    }

    // For each direct cell, find dependencies
    for (const cellRef of directCells) {
      if (tokensUsed >= tokenBudget) break;

      const pos = parseCellRef(cellRef);
      if (!pos) continue;

      const key = getCellKey(pos.row, pos.col);
      const cell = sheet.cells[key];

      if (!cell?.formula) continue;

      // Extract upstream dependencies from formula
      const deps = this.extractDependencies(cell.formula);

      for (const depRef of deps) {
        if (tokensUsed >= tokenBudget) break;

        const depPos = parseCellRef(depRef);
        if (!depPos) continue;

        const depKey = getCellKey(depPos.row, depPos.col);
        const depCell = sheet.cells[depKey];

        const snapshot: CellSnapshot = {
          ref: depRef,
          value: depCell?.value ?? null,
          formula: depCell?.formula ?? null,
          format: depCell?.format ? JSON.stringify(depCell.format) : null,
          dependencies: depCell?.formula
            ? this.extractDependencies(depCell.formula)
            : [],
          dependents: [],
        };

        const tokens = this.tokenEstimator.estimateSnapshot(snapshot);
        if (tokensUsed + tokens <= tokenBudget) {
          upstreamCells.push(snapshot);
          tokensUsed += tokens;

          if (snapshot.formula) {
            formulaChain.push(`${depRef}: ${snapshot.formula}`);
          }
        }
      }
    }

    // Find downstream dependents (cells that reference direct cells)
    const remainingBudget = tokenBudget - tokensUsed;
    if (remainingBudget > 0) {
      for (const [key, cell] of Object.entries(sheet.cells)) {
        if (tokensUsed >= tokenBudget) break;

        if (cell.formula) {
          const deps = this.extractDependencies(cell.formula);
          const hasDirectDep = deps.some((d) =>
            directCells.has(d.toUpperCase())
          );

          if (hasDirectDep) {
            const [row, col] = key.split(':').map(Number);
            const ref = this.getCellRef(row, col);

            const snapshot: CellSnapshot = {
              ref,
              value: cell.value ?? null,
              formula: cell.formula,
              format: cell.format ? JSON.stringify(cell.format) : null,
              dependencies: deps,
              dependents: [],
            };

            const tokens = this.tokenEstimator.estimateSnapshot(snapshot);
            if (tokensUsed + tokens <= tokenBudget) {
              downstreamCells.push(snapshot);
              tokensUsed += tokens;
            }
          }
        }
      }
    }

    return { upstreamCells, downstreamCells, formulaChain, tokensUsed };
  }

  /**
   * Assemble schema context (tables, named ranges)
   */
  private async assembleSchemaContext(
    _tokenBudget: number,
    _truncatedItems: TruncationRecord[]
  ): Promise<AssembledContext['schemaContext']> {
    // For now, return minimal schema context
    // This would be expanded when we implement tables/named ranges
    return {
      tables: [],
      namedRanges: [],
      semanticTypes: [],
      tokensUsed: 0,
    };
  }

  /**
   * Assemble event context (recent changes)
   */
  private async assembleEventContext(
    _tokenBudget: number,
    _truncatedItems: TruncationRecord[]
  ): Promise<AssembledContext['eventContext']> {
    // For now, return empty event context
    // This would be populated from event store when implemented
    return {
      recentChanges: [],
      tokensUsed: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getCellRef(row: number, col: number): string {
    return `${colToLetter(col)}${row + 1}`;
  }

  private getRangeRef(range: {
    start: { row: number; col: number };
    end: { row: number; col: number };
  }): string {
    return `${this.getCellRef(range.start.row, range.start.col)}:${this.getCellRef(range.end.row, range.end.col)}`;
  }

  private getSurroundingRange(
    cell: { row: number; col: number },
    padding: number
  ): string {
    const startRow = Math.max(0, cell.row - padding);
    const startCol = Math.max(0, cell.col - padding);
    const endRow = cell.row + padding;
    const endCol = cell.col + padding;

    return `${this.getCellRef(startRow, startCol)}:${this.getCellRef(endRow, endCol)}`;
  }

  private getCellsInRange(rangeRef: string): string[] {
    const cells: string[] = [];
    const [startRef, endRef] = rangeRef.split(':');

    if (!endRef) {
      return [startRef.toUpperCase()];
    }

    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);

    if (!start || !end) return [];

    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.col; col <= end.col; col++) {
        cells.push(this.getCellRef(row, col));
      }
    }

    return cells;
  }

  private extractDependencies(formula: string): string[] {
    const cellRefs = formula.match(/[A-Z]+\d+/gi) || [];
    return [...new Set(cellRefs.map((r) => r.toUpperCase()))];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ContextConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextConfig {
    return { ...this.config };
  }
}

// Export singleton
export const contextAssembler = new ContextAssembler();
