// ═══════════════════════════════════════════════════════════════════════════
// AI RUNTIME — Main AI Interface (Blueprint §5.3, §5.4)
// ═══════════════════════════════════════════════════════════════════════════

// Use crypto.randomUUID instead of uuid package
const uuidv4 = () => crypto.randomUUID();
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
} from './types';
import { DEFAULT_AI_CONFIG } from './types';
import { ClaudeAPIClient, AI_SYSTEM_PROMPT } from '../services/claudeAPI';
import { AI_TOOLS, AIToolExecutor } from './tools';
import { useWorkbookStore } from '../stores/workbookStore';
import { useSelectionStore } from '../stores/selectionStore';

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
      formulaCount: sheet
        ? Object.values(sheet.cells).filter((c) => c.formula).length
        : 0,
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

  private calculateUsedRange(
    sheet: { cells: Record<string, { value?: unknown }> } | null
  ): string {
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

  async sendMessage(
    content: string,
    _onStream?: (chunk: string) => void
  ): Promise<AIMessage> {
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
      reasoningTracer.addStep('output', 'Generated response',
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
      aiUsageLogger.logToolExecution({
        conversationId: this.conversation?.id || 'unknown',
        toolName: toolCall.tool,
        inputSummary: 'unknown tool',
        outputSummary: 'failed',
        durationMs: Date.now() - startTime,
        status: 'error',
        errorMessage: `Unknown tool: ${toolCall.tool}`,
      }).catch(() => {});

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
      this.conversation?.pendingActions.push(action);

      aiUsageLogger.logToolExecution({
        conversationId: this.conversation?.id || 'unknown',
        toolName: toolCall.tool,
        inputSummary: JSON.stringify(toolCall.arguments).slice(0, 200),
        outputSummary: 'pending approval',
        durationMs: Date.now() - startTime,
        status: 'pending',
      }).catch(() => {});

      return {
        ...toolCall,
        status: 'pending',
      };
    }

    // Execute tool
    try {
      const result = await this.executor.execute(toolCall);

      aiUsageLogger.logToolExecution({
        conversationId: this.conversation?.id || 'unknown',
        toolName: toolCall.tool,
        inputSummary: JSON.stringify(toolCall.arguments).slice(0, 200),
        outputSummary: 'success',
        durationMs: Date.now() - startTime,
        status: 'success',
      }).catch(() => {});

      return {
        ...toolCall,
        status: 'executed',
        result,
      };
    } catch (error) {
      aiUsageLogger.logToolExecution({
        conversationId: this.conversation?.id || 'unknown',
        toolName: toolCall.tool,
        inputSummary: JSON.stringify(toolCall.arguments).slice(0, 200),
        outputSummary: 'failed',
        durationMs: Date.now() - startTime,
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Execution failed',
      }).catch(() => {});

      return {
        ...toolCall,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Execution failed',
      };
    }
  }

  private shouldAutoApprove(
    toolCall: AIToolCall,
    tool: (typeof AI_TOOLS)[number]
  ): boolean {
    // Autopilot mode: auto-approve low-risk actions
    if (this.config.autonomyMode === 'autopilot') {
      // Never auto-approve high-risk in any mode
      if (tool.riskLevel === 'high') return false;

      // In autopilot, approve low-risk automatically
      if (tool.riskLevel === 'low') return true;

      // Medium risk: check cell count
      if (toolCall.tool === 'write_range') {
        const values = toolCall.arguments.values as unknown[][];
        if (values) {
          const cellCount = values.reduce((acc, row) => acc + row.length, 0);
          return cellCount <= this.config.autoApprove.maxCells;
        }
      }

      return true;
    }

    // Copilot mode: use explicit autoApprove settings
    if (!this.config.autoApprove.enabled) {
      return false;
    }

    if (!this.config.autoApprove.riskLevels.includes(tool.riskLevel as 'low' | 'medium')) {
      return false;
    }

    // Check cell count for write operations
    if (toolCall.tool === 'write_range') {
      const values = toolCall.arguments.values as unknown[][];
      if (values) {
        const cellCount = values.reduce((acc, row) => acc + row.length, 0);
        if (cellCount > this.config.autoApprove.maxCells) {
          return false;
        }
      }
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
    return {
      id: uuidv4(),
      type: toolCall.tool === 'write_range' ? 'write' : 'bulk',
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
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Action Management
  // ─────────────────────────────────────────────────────────────────────────

  getPendingActions(): AIProposedAction[] {
    return this.conversation?.pendingActions || [];
  }

  async approveAction(actionId: string): Promise<boolean> {
    if (!this.conversation) return false;

    const actionIndex = this.conversation.pendingActions.findIndex(
      (a) => a.id === actionId
    );
    if (actionIndex === -1) return false;

    const action = this.conversation.pendingActions[actionIndex];
    action.status = 'approved';
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

    // Log approval
    aiUsageLogger.logToolDecision({
      conversationId: this.conversation.id,
      toolName: action.type,
      actionId,
      approved: true,
    }).catch(() => {});

    return true;
  }

  async rejectAction(actionId: string): Promise<boolean> {
    if (!this.conversation) return false;

    const actionIndex = this.conversation.pendingActions.findIndex(
      (a) => a.id === actionId
    );
    if (actionIndex === -1) return false;

    const action = this.conversation.pendingActions[actionIndex];
    action.status = 'rejected';

    this.conversation.pendingActions.splice(actionIndex, 1);

    // Log rejection
    aiUsageLogger.logToolDecision({
      conversationId: this.conversation.id,
      toolName: action.type,
      actionId,
      approved: false,
    }).catch(() => {});

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
    const conversationHistory = this.conversation?.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content) || [];

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
  createDirectReadClaim(
    statement: string,
    cellRef: string,
    value: unknown,
    sheetName?: string
  ) {
    // Also track the read
    this.sourceTracker.trackCellRead(cellRef, sheetName);
    return this.groundingManager.createDirectReadClaim(statement, cellRef, value, sheetName);
  }

  /**
   * Create a grounded claim from computation
   */
  createComputedClaim(
    statement: string,
    formula: string,
    result: unknown,
    sourceCells: string[]
  ) {
    // Track formula evaluation
    this.sourceTracker.trackFormulaEval(formula, result);
    return this.groundingManager.createComputedClaim(statement, formula, result, sourceCells);
  }

  /**
   * Create an inferred claim
   */
  createInferredClaim(
    statement: string,
    reasoning: string,
    supportingEvidence: string[]
  ) {
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
