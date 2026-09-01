// ═══════════════════════════════════════════════════════════════════════════
// AI RUNTIME — Main AI Interface (Blueprint §5.3, §5.4)
// ═══════════════════════════════════════════════════════════════════════════

// Use crypto.randomUUID instead of uuid package
const uuidv4 = () => crypto.randomUUID();
const MAX_AI_WRITE_CELLS = 10_000;
const MAX_AI_CELL_TEXT_LENGTH = 32_767;
import type {
  AIMessage,
  AIToolCall,
  AIContext,
  AIConversation,
  AIProposedAction,
  AIConfig,
  AIActionHistory,
  AssembledContext,
  GroundingReport,
  AIAvailability,
} from './types';
import { DEFAULT_AI_CONFIG } from './types';
import { ClaudeAPIClient, AI_SYSTEM_PROMPT } from '../services/claudeAPI';
import { AI_TOOLS, AIToolExecutor } from './tools';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';
import { getCellKey, parseCellRef, toCellRef } from '../types/cell';

// Context & Grounding imports
import { ContextAssembler } from './context/ContextAssembler';
import { GroundingManager } from './grounding/GroundingManager';
import { SourceTracker } from './grounding/SourceTracker';

// Audit imports
import { aiUsageLogger } from '../audit/AIUsageLogger';

// Reasoning trace
import { reasoningTracer } from './reasoning/ReasoningTracer';

// Proficiency
import { proficiencyTracker } from './proficiency/ProficiencyTracker';

// ─────────────────────────────────────────────────────────────────────────────
// AI Runtime Class
// ─────────────────────────────────────────────────────────────────────────────

export class AIRuntime {
  private client: ClaudeAPIClient;
  private executor: AIToolExecutor;
  private config: AIConfig;
  private conversation: AIConversation | null = null;

  // Context & Grounding (Blueprint §5.3, §5.4)
  private contextAssembler: ContextAssembler;
  private groundingManager: GroundingManager;
  private sourceTracker: SourceTracker;
  private lastAssembledContext: AssembledContext | null = null;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.client = new ClaudeAPIClient(this.config);
    this.executor = new AIToolExecutor();

    // Initialize context & grounding systems
    this.contextAssembler = new ContextAssembler();
    this.groundingManager = new GroundingManager();
    this.sourceTracker = new SourceTracker();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  setApiKey(key: string): void {
    this.client.setApiKey(key);
    this.config.apiKey = key;
    this.config.mockMode = false;
  }

  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    this.client.updateConfig(this.config);
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  getAvailability(): Promise<AIAvailability> {
    return this.client.getAvailability();
  }

  refreshAvailability(): Promise<AIAvailability> {
    return this.client.refreshAvailability();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Conversation Management
  // ─────────────────────────────────────────────────────────────────────────

  startConversation(): AIConversation {
    this.conversation = {
      id: uuidv4(),
      messages: [],
      context: this.buildContext(),
      pendingActions: [],
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.conversation;
  }

  getConversation(): AIConversation | null {
    return this.conversation;
  }

  clearConversation(): void {
    this.conversation = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Context Building
  // ─────────────────────────────────────────────────────────────────────────

  private buildContext(): AIContext {
    const workbookState = useWorkbookStore.getState();
    const selectionState = useSelectionStore.getState();
    const activeSheetId = workbookState.activeSheetId;
    const sheet = activeSheetId ? workbookState.sheets[activeSheetId] : null;

    // Build sheet context
    const sheetContext = {
      id: sheet?.id || 'unknown',
      name: sheet?.name || 'Sheet1',
      usedRange: this.calculateUsedRange(sheet),
      cellCount: sheet ? Object.keys(sheet.cells).length : 0,
      formulaCount: sheet ? Object.values(sheet.cells).filter((c) => c.formula).length : 0,
    };

    // Build selection context from selectionStore
    const selectedCell = selectionState.selectedCell;
    const selectionRange = selectionState.selectionRange;
    let selectionContext;

    if (selectedCell && sheet) {
      const startRow = selectionRange?.start.row ?? selectedCell.row;
      const endRow = selectionRange?.end.row ?? selectedCell.row;
      const startCol = selectionRange?.start.col ?? selectedCell.col;
      const endCol = selectionRange?.end.col ?? selectedCell.col;

      const values: unknown[][] = [];
      for (let r = startRow; r <= endRow; r++) {
        const row: unknown[] = [];
        for (let c = startCol; c <= endCol; c++) {
          const cellId = `${r}-${c}`;
          row.push(sheet.cells[cellId]?.value ?? null);
        }
        values.push(row);
      }

      selectionContext = {
        range: this.selectionToRange({ startRow, endRow, startCol, endCol }),
        values,
        cellCount: (endRow - startRow + 1) * (endCol - startCol + 1),
      };
    }

    return {
      selection: selectionContext,
      sheet: sheetContext,
      recentCells: [],
    };
  }

  private calculateUsedRange(sheet: { cells: Record<string, { value?: unknown }> } | null): string {
    if (!sheet || Object.keys(sheet.cells).length === 0) {
      return 'A1';
    }

    let maxRow = 0;
    let maxCol = 0;

    for (const cellId of Object.keys(sheet.cells)) {
      const [row, col] = cellId.split('-').map(Number);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }

    return `A1:${this.colToLetter(maxCol)}${maxRow + 1}`;
  }

  private selectionToRange(selection: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  }): string {
    const start = `${this.colToLetter(selection.startCol)}${selection.startRow + 1}`;
    const end = `${this.colToLetter(selection.endCol)}${selection.endRow + 1}`;
    return start === end ? start : `${start}:${end}`;
  }

  private colToLetter(col: number): string {
    let result = '';
    let n = col;
    while (n >= 0) {
      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Message Handling
  // ─────────────────────────────────────────────────────────────────────────

  async sendMessage(content: string, _onStream?: (chunk: string) => void): Promise<AIMessage> {
    if (!this.conversation) {
      this.startConversation();
    }

    // Add user message
    const userMessage: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.conversation!.messages.push(userMessage);

    // Track proficiency signal
    proficiencyTracker.recordAIInteraction();

    // Start reasoning trace
    const msgId = userMessage.id;
    reasoningTracer.startTrace(this.conversation!.id, msgId);
    reasoningTracer.traceIntentParse(content, 'analyzing', 0.9);

    // Update context
    this.conversation!.context = this.buildContext();
    reasoningTracer.traceContextRead(
      this.conversation!.context.sheet?.usedRange || 'A1',
      this.conversation!.context.sheet?.cellCount || 0
    );

    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt();

    try {
      // Send to Claude
      const response = await this.client.sendMessage(
        this.conversation!.messages,
        AI_TOOLS,
        systemPrompt
      );

      // Process tool calls
      const processedToolCalls: AIToolCall[] = [];
      for (const toolCall of response.toolCalls) {
        const result = await this.processToolCall(toolCall);
        processedToolCalls.push(result);
      }

      // Complete reasoning trace
      reasoningTracer.addStep(
        'output',
        'Generated response',
        `Response: ${response.message.slice(0, 100)}...`,
        { confidence: 0.9, output: `${response.tokensUsed} tokens` }
      );
      const trace = reasoningTracer.completeTrace();

      // Create assistant message
      const assistantMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          tokensUsed: response.tokensUsed,
          toolCalls: processedToolCalls,
          reasoningTraceId: trace?.id,
        },
      };

      this.conversation!.messages.push(assistantMessage);
      this.conversation!.updatedAt = new Date();

      return assistantMessage;
    } catch (error) {
      const errorMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Xin lỗi, đã xảy ra lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      this.conversation!.messages.push(errorMessage);
      return errorMessage;
    }
  }

  async *streamMessage(
    content: string
  ): AsyncGenerator<{ type: 'text' | 'tool' | 'done'; content: string | AIToolCall }> {
    if (!this.conversation) {
      this.startConversation();
    }

    // Add user message
    const userMessage: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.conversation!.messages.push(userMessage);

    // Update context
    this.conversation!.context = this.buildContext();

    const systemPrompt = this.buildSystemPrompt();

    let fullText = '';
    const toolCalls: AIToolCall[] = [];

    for await (const chunk of this.client.streamMessage(
      this.conversation!.messages,
      AI_TOOLS,
      systemPrompt
    )) {
      if (chunk.type === 'text') {
        fullText += chunk.content;
        yield { type: 'text', content: chunk.content as string };
      } else if (chunk.type === 'tool') {
        const processedTool = await this.processToolCall(chunk.content as AIToolCall);
        toolCalls.push(processedTool);
        yield { type: 'tool', content: processedTool };
      }
    }

    // Create final assistant message
    const assistantMessage: AIMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: fullText,
      timestamp: new Date(),
      metadata: {
        toolCalls,
      },
    };

    this.conversation!.messages.push(assistantMessage);
    this.conversation!.updatedAt = new Date();

    yield { type: 'done', content: fullText };
  }

  private buildSystemPrompt(): string {
    const context = this.conversation?.context;
    let contextInfo = '';

    if (context?.selection) {
      contextInfo += `\n\n## Current Selection\n- Range: ${context.selection.range}\n- Cells: ${context.selection.cellCount}`;
    }

    if (context?.sheet) {
      contextInfo += `\n\n## Active Sheet\n- Name: ${context.sheet.name}\n- Used Range: ${context.sheet.usedRange}\n- Total Cells: ${context.sheet.cellCount}\n- Formulas: ${context.sheet.formulaCount}`;
    }

    // Add cross-sheet context from assembled context
    if (this.lastAssembledContext) {
      const meta = this.lastAssembledContext.metadata;
      const schema = this.lastAssembledContext.schemaContext;

      contextInfo += `\n\n## Context Assembly\n- Tokens Used: ${meta.totalTokens}\n- Budget Remaining: ${meta.budgetRemaining}`;

      if (meta.warnings.length > 0) {
        contextInfo += `\n- Warnings: ${meta.warnings.join(', ')}`;
      }

      // Cross-sheet awareness
      if (schema.tables.length > 0) {
        contextInfo += `\n\n## Workbook Structure (${schema.tables.length} sheets)`;
        for (const table of schema.tables) {
          contextInfo += `\n- **${table.name}**: ${table.range}, ${table.rowCount} rows`;
          if (table.hasHeaders && table.columns.length > 0) {
            contextInfo += `, columns: [${table.columns.slice(0, 10).join(', ')}${table.columns.length > 10 ? '...' : ''}]`;
          }
        }
      }

      // Cross-sheet references
      if (schema.semanticTypes.length > 0) {
        contextInfo += `\n\n## Cross-Sheet References`;
        for (const ref of schema.semanticTypes.slice(0, 20)) {
          contextInfo += `\n- ${ref}`;
        }
        if (schema.semanticTypes.length > 20) {
          contextInfo += `\n- ... and ${schema.semanticTypes.length - 20} more`;
        }
      }
    }

    // Autonomy mode instruction
    if (this.config.autonomyMode === 'autopilot') {
      contextInfo += `\n\n## Autonomy Mode: AUTOPILOT
You may execute low-risk read operations and small writes (≤${this.config.autoApprove.maxCells} cells) without asking for approval. Always ask before high-risk or bulk operations.`;
    } else {
      contextInfo += `\n\n## Autonomy Mode: COPILOT
Always propose changes and wait for user approval before executing writes. Use propose_action for any modifications.`;
    }

    // User proficiency adaptation
    contextInfo += proficiencyTracker.getSystemPromptAddon();

    // Add grounding instructions
    contextInfo += `\n\n## Grounding Requirements
When making claims about data, always cite your sources using these markers:
- [📍CellRef] for direct cell reads (e.g., [📍A1] = 100)
- [🔢Formula] for computed values (e.g., [🔢SUM(A1:A10)] = 550)
- [🤔] for inferred conclusions with reasoning
- Use Sheet1!A1 notation for cross-sheet references`;

    return AI_SYSTEM_PROMPT + contextInfo;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Processing
  // ─────────────────────────────────────────────────────────────────────────

  private async processToolCall(toolCall: AIToolCall): Promise<AIToolCall> {
    const tool = AI_TOOLS.find((t) => t.name === toolCall.tool);
    const startTime = Date.now();

    if (!tool) {
      aiUsageLogger
        .logToolExecution({
          conversationId: this.conversation?.id || 'unknown',
          toolName: toolCall.tool,
          inputSummary: 'unknown tool',
          outputSummary: 'failed',
          durationMs: Date.now() - startTime,
          status: 'error',
          errorMessage: `Unknown tool: ${toolCall.tool}`,
        })
        .catch(() => {});

      return {
        ...toolCall,
        status: 'failed',
        error: `Unknown tool: ${toolCall.tool}`,
      };
    }

    // Check if approval is needed
    if (tool.requiresApproval && !this.shouldAutoApprove(toolCall, tool)) {
      // Create pending action
      const action = this.createPendingAction(toolCall);
      try {
        await aiUsageLogger.logToolExecution({
          conversationId: this.conversation?.id || 'unknown',
          workbookId: action.workbookId,
          toolName: toolCall.tool,
          inputSummary: `actionId=${action.id}; sheetId=${action.sheetId}; range=${action.preview.after.range}`,
          outputSummary: `proposed ${action.affectedCells} cells; pending approval`,
          durationMs: Date.now() - startTime,
          status: 'pending',
        });
      } catch (error) {
        return {
          ...toolCall,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Could not persist action audit',
        };
      }
      this.conversation?.pendingActions.push(action);

      return {
        ...toolCall,
        status: 'pending',
      };
    }

    // Execute tool
    try {
      const result = await this.executor.execute(toolCall);

      aiUsageLogger
        .logToolExecution({
          conversationId: this.conversation?.id || 'unknown',
          toolName: toolCall.tool,
          inputSummary: JSON.stringify(toolCall.arguments).slice(0, 200),
          outputSummary: 'success',
          durationMs: Date.now() - startTime,
          status: 'success',
        })
        .catch(() => {});

      return {
        ...toolCall,
        status: 'executed',
        result,
      };
    } catch (error) {
      aiUsageLogger
        .logToolExecution({
          conversationId: this.conversation?.id || 'unknown',
          toolName: toolCall.tool,
          inputSummary: JSON.stringify(toolCall.arguments).slice(0, 200),
          outputSummary: 'failed',
          durationMs: Date.now() - startTime,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Execution failed',
        })
        .catch(() => {});

      return {
        ...toolCall,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  private shouldAutoApprove(toolCall: AIToolCall, tool: (typeof AI_TOOLS)[number]): boolean {
    // Writes stay on the explicit preview/approval path until their transactional
    // executor has the same audit and rollback guarantees as manual approval.
    if (toolCall.tool === 'write_range') return false;

    // Autopilot mode: auto-approve low-risk actions
    if (this.config.autonomyMode === 'autopilot') {
      // Never auto-approve high-risk in any mode
      if (tool.riskLevel === 'high') return false;

      // In autopilot, approve low-risk automatically
      if (tool.riskLevel === 'low') return true;

      return true;
    }

    // Copilot mode: use explicit autoApprove settings
    if (!this.config.autoApprove.enabled) {
      return false;
    }

    if (!this.config.autoApprove.riskLevels.includes(tool.riskLevel as 'low' | 'medium')) {
      return false;
    }

    return true;
  }

  /**
   * Set the AI autonomy mode
   */
  setAutonomyMode(mode: 'copilot' | 'autopilot'): void {
    this.config.autonomyMode = mode;
    this.client.updateConfig(this.config);
  }

  /**
   * Get current autonomy mode
   */
  getAutonomyMode(): 'copilot' | 'autopilot' {
    return this.config.autonomyMode;
  }

  private createPendingAction(toolCall: AIToolCall): AIProposedAction {
    if (toolCall.tool === 'write_range') {
      const range = String(toolCall.arguments.range || '');
      const values = toolCall.arguments.values as (string | number | boolean | null)[][];
      const requestedType = toolCall.arguments.type ?? 'value';
      if (requestedType !== 'value' && requestedType !== 'formula') {
        throw new Error(`Unsupported write type: ${String(requestedType)}`);
      }
      const type = requestedType;
      const target = this.validateWritePayload(range, values);
      if (
        type === 'formula' &&
        values.some((row) =>
          row.some((value) => typeof value !== 'string' || !value.startsWith('='))
        )
      ) {
        throw new Error('Formula writes require formula strings beginning with =');
      }
      const workbook = useWorkbookStore.getState();
      const sheetId = workbook.activeSheetId;
      if (!sheetId || !workbook.sheets[sheetId]) {
        throw new Error('Cannot propose a write without an active sheet');
      }
      const before = this.snapshotRange(sheetId, range);
      const formulas =
        type === 'formula'
          ? values.map((row) => row.map((value) => (typeof value === 'string' ? value : null)))
          : undefined;
      const changes = values.flatMap((rowValues, rowOffset) =>
        rowValues.map((value, colOffset) => ({
          cell: toCellRef(target.start.row + rowOffset, target.start.col + colOffset),
          field: type as 'value' | 'formula',
          oldValue:
            type === 'formula'
              ? (before.formulas?.[rowOffset]?.[colOffset] ?? null)
              : before.values[rowOffset][colOffset],
          newValue: value,
        }))
      );
      const affectedCells = target.rows * target.cols;
      return {
        id: uuidv4(),
        sheetId,
        workbookId: workbook.workbookId,
        type: type === 'formula' ? 'formula' : 'write',
        description: `Write ${affectedCells} cells in ${range}`,
        preview: {
          before,
          after: { range, values, formulas },
          changes,
        },
        riskLevel: affectedCells > 100 ? 'high' : affectedCells > 10 ? 'medium' : 'low',
        affectedCells,
        status: 'pending',
        createdAt: new Date(),
        toolCall,
      };
    }

    return {
      id: uuidv4(),
      type: 'bulk',
      description: `Execute ${toolCall.tool}`,
      preview: {
        before: { range: '', values: [] },
        after: { range: '', values: [] },
        changes: [],
      },
      riskLevel: 'medium',
      affectedCells: 0,
      status: 'pending',
      createdAt: new Date(),
      toolCall,
    };
  }

  private validateWritePayload(
    range: string,
    values: (string | number | boolean | null)[][]
  ): { start: { row: number; col: number }; rows: number; cols: number } {
    const [startRef, endRef = startRef] = range.split(':');
    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);
    if (!start || !end || start.row > end.row || start.col > end.col) {
      throw new Error(`Invalid action range: ${range}`);
    }
    const rows = end.row - start.row + 1;
    const cols = end.col - start.col + 1;
    if (rows * cols > MAX_AI_WRITE_CELLS) {
      throw new Error(`AI writes are limited to ${MAX_AI_WRITE_CELLS} cells per approval`);
    }
    if (
      !Array.isArray(values) ||
      values.length !== rows ||
      values.some((row) => !Array.isArray(row) || row.length !== cols) ||
      values.some((row) =>
        row.some(
          (value) =>
            (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) ||
            (typeof value === 'number' && !Number.isFinite(value)) ||
            (typeof value === 'string' && value.length > MAX_AI_CELL_TEXT_LENGTH)
        )
      )
    ) {
      throw new Error(`Write payload must exactly match ${range} (${rows}x${cols})`);
    }
    return { start, rows, cols };
  }

  private snapshotRange(sheetId: string, range: string) {
    const target = this.validateWritePayload(range, this.emptyRangeValues(range));
    const workbook = useWorkbookStore.getState();
    const sheet = workbook.sheets[sheetId];
    if (!sheet) throw new Error(`Action sheet no longer exists: ${sheetId}`);
    const values: (string | number | boolean | null)[][] = [];
    const formulas: (string | null)[][] = [];
    for (let rowOffset = 0; rowOffset < target.rows; rowOffset += 1) {
      const rowValues: (string | number | boolean | null)[] = [];
      const rowFormulas: (string | null)[] = [];
      for (let colOffset = 0; colOffset < target.cols; colOffset += 1) {
        const row = target.start.row + rowOffset;
        const col = target.start.col + colOffset;
        const cell = sheet?.cells[getCellKey(row, col)];
        rowValues.push((cell?.value as string | number | boolean | null | undefined) ?? null);
        rowFormulas.push(cell?.formula ?? null);
      }
      values.push(rowValues);
      formulas.push(rowFormulas);
    }
    return { range, values, formulas };
  }

  private emptyRangeValues(range: string): null[][] {
    const [startRef, endRef = startRef] = range.split(':');
    const start = parseCellRef(startRef);
    const end = parseCellRef(endRef);
    if (!start || !end || start.row > end.row || start.col > end.col) {
      throw new Error(`Invalid action range: ${range}`);
    }
    return Array.from({ length: end.row - start.row + 1 }, () =>
      Array.from({ length: end.col - start.col + 1 }, () => null)
    );
  }

  private applySnapshot(sheetId: string, snapshot: AIProposedAction['preview']['after']): void {
    const target = this.validateWritePayload(snapshot.range, snapshot.values);
    const workbook = useWorkbookStore.getState();
    if (!workbook.sheets[sheetId]) throw new Error(`Action sheet no longer exists: ${sheetId}`);
    snapshot.values.forEach((rowValues, rowOffset) => {
      rowValues.forEach((value, colOffset) => {
        const formula =
          snapshot.formulas?.[rowOffset]?.[colOffset] ??
          (typeof value === 'string' && value.startsWith('=') ? value : null);
        workbook.updateCell(sheetId, target.start.row + rowOffset, target.start.col + colOffset, {
          value,
          formula,
          displayValue: value == null ? '' : String(value),
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Action Management
  // ─────────────────────────────────────────────────────────────────────────

  getPendingActions(): AIProposedAction[] {
    return this.conversation?.pendingActions || [];
  }

  /** Deterministic entry point for trusted callers that already have a write payload. */
  async proposeWriteAction(
    range: string,
    values: (string | number | boolean | null)[][],
    type: 'value' | 'formula' = 'value'
  ): Promise<AIProposedAction> {
    if (!this.conversation) this.startConversation();
    const toolCall: AIToolCall = {
      id: uuidv4(),
      tool: 'write_range',
      arguments: { range, values, type },
      status: 'pending',
      timestamp: new Date(),
    };
    const processed = await this.processToolCall(toolCall);
    if (processed.status === 'failed') {
      throw new Error(processed.error || 'Could not create write proposal');
    }
    const action = this.conversation?.pendingActions.find(
      (candidate) => candidate.toolCall?.id === toolCall.id
    );
    if (!action) throw new Error('Write proposal was not retained for approval');
    return action;
  }

  async approveAction(actionId: string): Promise<boolean> {
    if (!this.conversation) return false;

    const actionIndex = this.conversation.pendingActions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return false;

    const action = this.conversation.pendingActions[actionIndex];
    if (action.status !== 'pending' || action.toolCall?.tool !== 'write_range' || !action.sheetId) {
      return false;
    }
    action.status = 'approved';
    action.toolCall.status = 'approved';

    const conversationId = this.conversation.id;
    const auditContext = {
      conversationId,
      workbookId: action.workbookId,
      toolName: action.toolCall.tool,
    };
    let applied = false;
    try {
      this.validateWritePayload(action.preview.after.range, action.preview.after.values);
      await aiUsageLogger.logToolDecision({
        ...auditContext,
        actionId,
        approved: true,
      });
      this.applySnapshot(action.sheetId, action.preview.after);
      applied = true;
      await aiUsageLogger.logToolExecution({
        ...auditContext,
        inputSummary: `actionId=${actionId}; sheetId=${action.sheetId}; range=${action.preview.after.range}`,
        outputSummary: `applied ${action.affectedCells} cells`,
        durationMs: 0,
        status: 'success',
      });
    } catch {
      if (applied) {
        try {
          this.applySnapshot(action.sheetId, action.preview.before);
        } catch {
          // Preserve the pending action so the failure is visible and retryable.
        }
      }
      action.status = 'pending';
      action.toolCall.status = 'pending';
      return false;
    }

    action.status = 'executed';
    action.toolCall.status = 'executed';
    action.executedAt = new Date();

    // Move to history
    const historyEntry: AIActionHistory = {
      id: uuidv4(),
      action,
      outcome: 'success',
      executedBy: 'user',
      timestamp: new Date(),
    };
    this.conversation.history.push(historyEntry);
    this.conversation.pendingActions.splice(actionIndex, 1);

    return true;
  }

  async rollbackAction(historyId: string): Promise<boolean> {
    if (!this.conversation) return false;
    const entry = this.conversation.history.find((item) => item.id === historyId);
    if (!entry || entry.outcome !== 'success' || !entry.action.sheetId) return false;
    entry.outcome = 'reverted';
    try {
      this.applySnapshot(entry.action.sheetId, entry.action.preview.before);
      await aiUsageLogger.logToolExecution({
        conversationId: this.conversation.id,
        workbookId: entry.action.workbookId,
        toolName: 'write_range.rollback',
        inputSummary: `historyId=${historyId}; actionId=${entry.action.id}; sheetId=${entry.action.sheetId}`,
        outputSummary: `restored ${entry.action.affectedCells} cells`,
        durationMs: 0,
        status: 'success',
      });
    } catch {
      try {
        this.applySnapshot(entry.action.sheetId, entry.action.preview.after);
      } catch {
        // The entry remains successful so the rollback can be retried visibly.
      }
      entry.outcome = 'success';
      return false;
    }
    entry.revertedAt = new Date();
    return true;
  }

  async rejectAction(actionId: string): Promise<boolean> {
    if (!this.conversation) return false;

    const actionIndex = this.conversation.pendingActions.findIndex((a) => a.id === actionId);
    if (actionIndex === -1) return false;

    const action = this.conversation.pendingActions[actionIndex];
    if (action.status !== 'pending') return false;
    action.status = 'rejected';
    if (action.toolCall) action.toolCall.status = 'rejected';
    try {
      await aiUsageLogger.logToolDecision({
        conversationId: this.conversation.id,
        workbookId: action.workbookId,
        toolName: action.toolCall?.tool ?? action.type,
        actionId,
        approved: false,
      });
    } catch {
      action.status = 'pending';
      if (action.toolCall) action.toolCall.status = 'pending';
      return false;
    }
    this.conversation.pendingActions.splice(actionIndex, 1);

    return true;
  }

  getHistory(): AIActionHistory[] {
    return this.conversation?.history || [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Context Assembly (Blueprint §5.3)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Assemble context for a user message
   * Uses smart token budgeting to prioritize relevant data
   */
  async assembleContext(userMessage: string): Promise<AssembledContext> {
    const conversationHistory =
      this.conversation?.messages.filter((m) => m.role === 'user').map((m) => m.content) || [];

    this.lastAssembledContext = await this.contextAssembler.assembleContext(
      userMessage,
      conversationHistory
    );

    return this.lastAssembledContext;
  }

  /**
   * Get the last assembled context
   */
  getLastAssembledContext(): AssembledContext | null {
    return this.lastAssembledContext;
  }

  /**
   * Get context assembler for direct access
   */
  getContextAssembler(): ContextAssembler {
    return this.contextAssembler;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Grounding System (Blueprint §5.4)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Track a cell read for grounding
   */
  trackCellRead(ref: string, sheetName?: string) {
    return this.sourceTracker.trackCellRead(ref, sheetName);
  }

  /**
   * Track a range read for grounding
   */
  trackRangeRead(rangeRef: string, sheetName?: string) {
    return this.sourceTracker.trackRangeRead(rangeRef, sheetName);
  }

  /**
   * Create a grounded claim from direct cell read
   */
  createDirectReadClaim(statement: string, cellRef: string, value: unknown, sheetName?: string) {
    // Also track the read
    this.sourceTracker.trackCellRead(cellRef, sheetName);
    return this.groundingManager.createDirectReadClaim(statement, cellRef, value, sheetName);
  }

  /**
   * Create a grounded claim from computation
   */
  createComputedClaim(statement: string, formula: string, result: unknown, sourceCells: string[]) {
    // Track formula evaluation
    this.sourceTracker.trackFormulaEval(formula, result);
    return this.groundingManager.createComputedClaim(statement, formula, result, sourceCells);
  }

  /**
   * Create an inferred claim
   */
  createInferredClaim(statement: string, reasoning: string, supportingEvidence: string[]) {
    return this.groundingManager.createInferredClaim(statement, reasoning, supportingEvidence);
  }

  /**
   * Verify a specific claim
   */
  async verifyClaim(claimId: string) {
    return this.groundingManager.verifyClaim(claimId);
  }

  /**
   * Verify all claims
   */
  async verifyAllClaims() {
    return this.groundingManager.verifyAllClaims();
  }

  /**
   * Get grounding report
   */
  getGroundingReport(): GroundingReport {
    return this.groundingManager.generateReport();
  }

  /**
   * Get all claims
   */
  getClaims() {
    return this.groundingManager.getClaims();
  }

  /**
   * Check for changed sources since last read
   */
  getChangedSources() {
    return this.sourceTracker.getChangedSources();
  }

  /**
   * Get source tracker stats
   */
  getSourceTrackerStats() {
    return this.sourceTracker.getStats();
  }

  /**
   * Clear grounding data (for new conversation)
   */
  clearGrounding(): void {
    this.groundingManager.clear();
    this.sourceTracker.clear();
    this.lastAssembledContext = null;
  }

  /**
   * Get grounding manager for direct access
   */
  getGroundingManager(): GroundingManager {
    return this.groundingManager;
  }

  /**
   * Get source tracker for direct access
   */
  getSourceTracker(): SourceTracker {
    return this.sourceTracker;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

let runtimeInstance: AIRuntime | null = null;

export function getAIRuntime(): AIRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new AIRuntime();
  }
  return runtimeInstance;
}

export function resetAIRuntime(): void {
  runtimeInstance = null;
}
