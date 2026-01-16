// ═══════════════════════════════════════════════════════════════════════════
// AI TOOLS — Spreadsheet Operations (Blueprint §5.2)
// ═══════════════════════════════════════════════════════════════════════════

import type { AITool, AIToolCall, AIProposedAction, AISource } from '../types';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { getCellKey, colToLetter, parseCellRef } from '../../types/cell';

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const AI_TOOLS: AITool[] = [
  {
    name: 'read_range',
    description: 'Đọc giá trị và formulas từ một range trong spreadsheet',
    parameters: [
      {
        name: 'range',
        type: 'string',
        description: 'Range address (e.g., "A1", "A1:B10", "Sheet1!A1:C5")',
        required: true,
      },
      {
        name: 'includeFormulas',
        type: 'boolean',
        description: 'Include formulas in addition to values',
        required: false,
        default: true,
      },
    ],
    requiresApproval: false,
    riskLevel: 'low',
  },
  {
    name: 'write_range',
    description: 'Ghi giá trị hoặc formulas vào cells. Cần approval nếu >10 cells.',
    parameters: [
      {
        name: 'range',
        type: 'string',
        description: 'Target range address',
        required: true,
      },
      {
        name: 'values',
        type: 'array',
        description: '2D array of values to write',
        required: true,
      },
      {
        name: 'type',
        type: 'string',
        description: 'Type of content: "value" or "formula"',
        required: false,
        default: 'value',
      },
    ],
    requiresApproval: true,
    riskLevel: 'medium',
  },
  {
    name: 'get_dependencies',
    description: 'Lấy danh sách cells mà một cell phụ thuộc vào (upstream) và cells phụ thuộc vào nó (downstream)',
    parameters: [
      {
        name: 'cell',
        type: 'string',
        description: 'Cell address (e.g., "A1")',
        required: true,
      },
      {
        name: 'direction',
        type: 'string',
        description: '"upstream" (precedents), "downstream" (dependents), or "both"',
        required: false,
        default: 'both',
      },
    ],
    requiresApproval: false,
    riskLevel: 'low',
  },
  {
    name: 'search_cells',
    description: 'Tìm kiếm cells chứa giá trị hoặc formula cụ thể',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query (text or regex)',
        required: true,
      },
      {
        name: 'searchIn',
        type: 'string',
        description: '"values", "formulas", or "both"',
        required: false,
        default: 'both',
      },
      {
        name: 'matchCase',
        type: 'boolean',
        description: 'Case-sensitive search',
        required: false,
        default: false,
      },
    ],
    requiresApproval: false,
    riskLevel: 'low',
  },
  {
    name: 'propose_action',
    description: 'Đề xuất một action cần user approve trước khi thực hiện',
    parameters: [
      {
        name: 'actionType',
        type: 'string',
        description: 'Type: "write", "delete", "format", "formula", "bulk"',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Human-readable description of the action',
        required: true,
      },
      {
        name: 'changes',
        type: 'array',
        description: 'Array of changes to apply',
        required: true,
      },
    ],
    requiresApproval: true,
    riskLevel: 'medium',
  },
  {
    name: 'get_sheet_info',
    description: 'Lấy thông tin tổng quan về sheet hiện tại',
    parameters: [],
    requiresApproval: false,
    riskLevel: 'low',
  },
  {
    name: 'get_selection',
    description: 'Lấy thông tin về vùng đang được chọn',
    parameters: [],
    requiresApproval: false,
    riskLevel: 'low',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool Executor
// ─────────────────────────────────────────────────────────────────────────────

export class AIToolExecutor {
  private getWorkbookStore() {
    return useWorkbookStore.getState();
  }

  private getSelectionStore() {
    return useSelectionStore.getState();
  }

  // Helper to parse address
  private parseAddress(address: string): { row: number; col: number } {
    const pos = parseCellRef(address);
    if (!pos) {
      throw new Error(`Invalid cell address: ${address}`);
    }
    return pos;
  }

  // Execute a tool call
  async execute(toolCall: AIToolCall): Promise<{
    result: unknown;
    sources: AISource[];
    proposedAction?: AIProposedAction;
  }> {
    const { tool, arguments: args } = toolCall;

    switch (tool) {
      case 'read_range':
        return this.readRange(args.range as string, args.includeFormulas as boolean ?? true);

      case 'write_range':
        return this.writeRange(
          args.range as string,
          args.values as unknown[][],
          args.type as string ?? 'value'
        );

      case 'get_dependencies':
        return this.getDependencies(
          args.cell as string,
          args.direction as string ?? 'both'
        );

      case 'search_cells':
        return this.searchCells(
          args.query as string,
          args.searchIn as string ?? 'both',
          args.matchCase as boolean ?? false
        );

      case 'propose_action':
        return this.proposeAction(
          args.actionType as string,
          args.description as string,
          args.changes as unknown[]
        );

      case 'get_sheet_info':
        return this.getSheetInfo();

      case 'get_selection':
        return this.getSelection();

      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Implementations
  // ─────────────────────────────────────────────────────────────────────────

  private readRange(range: string, includeFormulas: boolean): {
    result: unknown;
    sources: AISource[];
  } {
    const store = this.getWorkbookStore();
    const { sheets, activeSheetId } = store;

    if (!activeSheetId) {
      return { result: null, sources: [] };
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      return { result: null, sources: [] };
    }

    // Parse range
    const { startRow, startCol, endRow, endCol } = this.parseRange(range);
    const values: unknown[][] = [];
    const formulas: (string | null)[][] = [];
    const sources: AISource[] = [];

    for (let row = startRow; row <= endRow; row++) {
      const rowValues: unknown[] = [];
      const rowFormulas: (string | null)[] = [];

      for (let col = startCol; col <= endCol; col++) {
        const key = getCellKey(row, col);
        const cell = sheet.cells[key];
        const address = `${colToLetter(col)}${row + 1}`;

        rowValues.push(cell?.value ?? null);
        rowFormulas.push(cell?.formula ?? null);

        if (cell) {
          sources.push({
            type: cell.formula ? 'formula' : 'cell',
            reference: address,
            value: cell.value,
            notation: `[📍${address}]`,
          });
        }
      }

      values.push(rowValues);
      if (includeFormulas) {
        formulas.push(rowFormulas);
      }
    }

    return {
      result: {
        range,
        values,
        formulas: includeFormulas ? formulas : undefined,
        rowCount: endRow - startRow + 1,
        colCount: endCol - startCol + 1,
      },
      sources,
    };
  }

  private writeRange(
    range: string,
    values: unknown[][],
    type: string
  ): {
    result: unknown;
    sources: AISource[];
    proposedAction: AIProposedAction;
  } {
    const { startRow, startCol, endRow, endCol } = this.parseRange(range);
    const cellCount = (endRow - startRow + 1) * (endCol - startCol + 1);

    // Always create a proposed action for writes
    const proposedAction: AIProposedAction = {
      id: `action-${Date.now()}`,
      type: type === 'formula' ? 'formula' : 'write',
      description: `Ghi ${cellCount} cells trong range ${range}`,
      preview: {
        before: { range, values: [] }, // Will be filled by executor
        after: { range, values: values as (string | number | boolean | null)[][] },
        changes: [],
      },
      riskLevel: cellCount > 100 ? 'high' : cellCount > 10 ? 'medium' : 'low',
      affectedCells: cellCount,
      status: 'pending',
      createdAt: new Date(),
    };

    return {
      result: { proposed: true, actionId: proposedAction.id },
      sources: [],
      proposedAction,
    };
  }

  private getDependencies(
    cell: string,
    direction: string
  ): {
    result: unknown;
    sources: AISource[];
  } {
    const store = this.getWorkbookStore();
    const { sheets, activeSheetId } = store;

    if (!activeSheetId) {
      return { result: null, sources: [] };
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      return { result: null, sources: [] };
    }

    const { row, col } = this.parseAddress(cell);
    const key = getCellKey(row, col);
    const cellData = sheet.cells[key];
    const sources: AISource[] = [];

    // Parse formula for precedents (upstream)
    const precedents: string[] = [];
    if (cellData?.formula) {
      const matches = cellData.formula.match(/[A-Z]+[0-9]+/g) || [];
      precedents.push(...matches);
    }

    // Find dependents (downstream) - cells that reference this cell
    const dependents: string[] = [];
    for (const [otherKey, otherCell] of Object.entries(sheet.cells)) {
      if (otherCell.formula?.includes(cell)) {
        const [r, c] = otherKey.split(':').map(Number);
        dependents.push(`${colToLetter(c)}${r + 1}`);
      }
    }

    if (cellData) {
      sources.push({
        type: 'cell',
        reference: cell,
        value: cellData.value,
        notation: `[📍${cell}]`,
      });
    }

    return {
      result: {
        cell,
        precedents: direction !== 'downstream' ? precedents : undefined,
        dependents: direction !== 'upstream' ? dependents : undefined,
        formula: cellData?.formula,
      },
      sources,
    };
  }

  private searchCells(
    query: string,
    searchIn: string,
    matchCase: boolean
  ): {
    result: unknown;
    sources: AISource[];
  } {
    const store = this.getWorkbookStore();
    const { sheets, activeSheetId } = store;

    if (!activeSheetId) {
      return { result: [], sources: [] };
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      return { result: [], sources: [] };
    }

    const results: Array<{ cell: string; value: unknown; formula?: string }> = [];
    const sources: AISource[] = [];
    const searchQuery = matchCase ? query : query.toLowerCase();

    for (const [key, cell] of Object.entries(sheet.cells)) {
      const [row, col] = key.split(':').map(Number);
      const address = `${colToLetter(col)}${row + 1}`;

      let matches = false;

      // Search in values
      if (searchIn !== 'formulas' && cell.value != null) {
        const valueStr = matchCase
          ? String(cell.value)
          : String(cell.value).toLowerCase();
        if (valueStr.includes(searchQuery)) {
          matches = true;
        }
      }

      // Search in formulas
      if (searchIn !== 'values' && cell.formula) {
        const formulaStr = matchCase ? cell.formula : cell.formula.toLowerCase();
        if (formulaStr.includes(searchQuery)) {
          matches = true;
        }
      }

      if (matches) {
        results.push({
          cell: address,
          value: cell.value,
          formula: cell.formula ?? undefined,
        });
        sources.push({
          type: cell.formula ? 'formula' : 'cell',
          reference: address,
          value: cell.value,
          notation: `[📍${address}]`,
        });
      }
    }

    return {
      result: {
        query,
        matches: results.length,
        results: results.slice(0, 50), // Limit results
      },
      sources,
    };
  }

  private proposeAction(
    actionType: string,
    description: string,
    changes: unknown[]
  ): {
    result: unknown;
    sources: AISource[];
    proposedAction: AIProposedAction;
  } {
    const proposedAction: AIProposedAction = {
      id: `action-${Date.now()}`,
      type: actionType as AIProposedAction['type'],
      description,
      preview: {
        before: { range: '', values: [] },
        after: { range: '', values: [] },
        changes: changes as AIProposedAction['preview']['changes'],
      },
      riskLevel: changes.length > 100 ? 'high' : changes.length > 10 ? 'medium' : 'low',
      affectedCells: changes.length,
      status: 'pending',
      createdAt: new Date(),
    };

    return {
      result: { proposed: true, actionId: proposedAction.id },
      sources: [],
      proposedAction,
    };
  }

  private getSheetInfo(): {
    result: unknown;
    sources: AISource[];
  } {
    const store = this.getWorkbookStore();
    const { sheets, activeSheetId, sheetOrder } = store;

    if (!activeSheetId) {
      return { result: null, sources: [] };
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      return { result: null, sources: [] };
    }

    const cellCount = Object.keys(sheet.cells).length;
    const formulaCount = Object.values(sheet.cells).filter((c) => c.formula).length;

    // Find used range
    let maxRow = 0;
    let maxCol = 0;
    for (const key of Object.keys(sheet.cells)) {
      const [row, col] = key.split(':').map(Number);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }

    const usedRange = cellCount > 0
      ? `A1:${colToLetter(maxCol)}${maxRow + 1}`
      : 'Empty';

    return {
      result: {
        id: sheet.id,
        name: sheet.name,
        index: sheetOrder.indexOf(activeSheetId),
        totalSheets: sheetOrder.length,
        usedRange,
        cellCount,
        formulaCount,
      },
      sources: [],
    };
  }

  private getSelection(): {
    result: unknown;
    sources: AISource[];
  } {
    const selectionStore = this.getSelectionStore();
    const workbookStore = this.getWorkbookStore();

    const { selectedCell, selectionRange } = selectionStore;
    const { sheets, activeSheetId } = workbookStore;

    if (!selectedCell || !activeSheetId) {
      return { result: null, sources: [] };
    }

    const sheet = sheets[activeSheetId];
    if (!sheet) {
      return { result: null, sources: [] };
    }

    const sources: AISource[] = [];
    const address = `${colToLetter(selectedCell.col)}${selectedCell.row + 1}`;
    const key = getCellKey(selectedCell.row, selectedCell.col);
    const cell = sheet.cells[key];

    if (cell) {
      sources.push({
        type: cell.formula ? 'formula' : 'cell',
        reference: address,
        value: cell.value,
        notation: `[📍${address}]`,
      });
    }

    let rangeInfo = null;
    if (selectionRange) {
      const startAddr = `${colToLetter(selectionRange.start.col)}${selectionRange.start.row + 1}`;
      const endAddr = `${colToLetter(selectionRange.end.col)}${selectionRange.end.row + 1}`;
      rangeInfo = {
        range: `${startAddr}:${endAddr}`,
        rowCount: Math.abs(selectionRange.end.row - selectionRange.start.row) + 1,
        colCount: Math.abs(selectionRange.end.col - selectionRange.start.col) + 1,
      };
    }

    return {
      result: {
        activeCell: address,
        value: cell?.value ?? null,
        formula: cell?.formula ?? null,
        range: rangeInfo,
      },
      sources,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private parseRange(range: string): {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } {
    // Handle single cell
    if (!range.includes(':')) {
      const { row, col } = this.parseAddress(range);
      return { startRow: row, startCol: col, endRow: row, endCol: col };
    }

    // Handle range
    const [start, end] = range.split(':');
    const startAddr = this.parseAddress(start);
    const endAddr = this.parseAddress(end);

    return {
      startRow: Math.min(startAddr.row, endAddr.row),
      startCol: Math.min(startAddr.col, endAddr.col),
      endRow: Math.max(startAddr.row, endAddr.row),
      endCol: Math.max(startAddr.col, endAddr.col),
    };
  }
}

// Export singleton
export const aiToolExecutor = new AIToolExecutor();
