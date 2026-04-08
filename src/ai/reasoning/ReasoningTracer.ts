// ═══════════════════════════════════════════════════════════════════════════
// REASONING TRACER — Records step-by-step AI decision chains
// Each trace captures: what was considered, why an action was chosen,
// confidence level, and data sources consulted
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ReasoningStepType =
  | 'context_read'    // Read data from spreadsheet
  | 'intent_parse'    // Parsed user intent
  | 'tool_select'     // Chose which tool to use
  | 'tool_execute'    // Executed a tool
  | 'data_analyze'    // Analyzed data patterns
  | 'formula_build'   // Constructed a formula
  | 'decision'        // Made a decision
  | 'confidence_check'// Assessed confidence
  | 'clarify'         // Asked for clarification
  | 'output';         // Generated final response

export interface ReasoningStep {
  id: string;
  type: ReasoningStepType;
  title: string;
  description: string;
  confidence: number; // 0-1
  durationMs: number;
  inputs: string[];   // What data/context was used
  output: string;     // What was produced
  metadata?: Record<string, unknown>;
}

export interface ReasoningTrace {
  id: string;
  conversationId: string;
  messageId: string;
  steps: ReasoningStep[];
  totalDurationMs: number;
  overallConfidence: number;
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ReasoningTracer Class
// ─────────────────────────────────────────────────────────────────────────────

export class ReasoningTracer {
  private currentTrace: ReasoningTrace | null = null;
  private stepCounter = 0;
  private traces: ReasoningTrace[] = [];
  private readonly MAX_TRACES = 50;

  /**
   * Start a new reasoning trace for a message
   */
  startTrace(conversationId: string, messageId: string): ReasoningTrace {
    this.currentTrace = {
      id: crypto.randomUUID(),
      conversationId,
      messageId,
      steps: [],
      totalDurationMs: 0,
      overallConfidence: 1.0,
      createdAt: Date.now(),
    };
    this.stepCounter = 0;
    return this.currentTrace;
  }

  /**
   * Add a step to the current trace
   */
  addStep(
    type: ReasoningStepType,
    title: string,
    description: string,
    options: {
      confidence?: number;
      durationMs?: number;
      inputs?: string[];
      output?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): ReasoningStep {
    if (!this.currentTrace) {
      this.startTrace('unknown', 'unknown');
    }

    this.stepCounter++;
    const step: ReasoningStep = {
      id: `step-${this.stepCounter}`,
      type,
      title,
      description,
      confidence: options.confidence ?? 1.0,
      durationMs: options.durationMs ?? 0,
      inputs: options.inputs ?? [],
      output: options.output ?? '',
      metadata: options.metadata,
    };

    this.currentTrace!.steps.push(step);
    this.currentTrace!.totalDurationMs += step.durationMs;

    // Overall confidence = product of all step confidences
    this.currentTrace!.overallConfidence = this.currentTrace!.steps.reduce(
      (acc, s) => acc * s.confidence,
      1.0
    );

    loggers.ai.debug(`Reasoning: [${type}] ${title} (confidence: ${step.confidence})`);

    return step;
  }

  /**
   * Convenience: trace a context read
   */
  traceContextRead(range: string, cellCount: number): ReasoningStep {
    return this.addStep('context_read', `Read ${range}`, `Loaded ${cellCount} cells from ${range}`, {
      confidence: 1.0,
      inputs: [range],
      output: `${cellCount} cells`,
    });
  }

  /**
   * Convenience: trace intent parsing
   */
  traceIntentParse(userMessage: string, intent: string, confidence: number): ReasoningStep {
    return this.addStep('intent_parse', `Parsed intent: ${intent}`, `User asked: "${userMessage.slice(0, 80)}..."`, {
      confidence,
      inputs: [userMessage.slice(0, 100)],
      output: intent,
    });
  }

  /**
   * Convenience: trace tool selection
   */
  traceToolSelect(toolName: string, reason: string, alternatives: string[] = []): ReasoningStep {
    return this.addStep('tool_select', `Selected tool: ${toolName}`, reason, {
      confidence: 0.9,
      inputs: alternatives.length > 0 ? [`Considered: ${alternatives.join(', ')}`] : [],
      output: toolName,
      metadata: { alternatives },
    });
  }

  /**
   * Convenience: trace tool execution
   */
  traceToolExecute(toolName: string, args: string, result: string, durationMs: number): ReasoningStep {
    return this.addStep('tool_execute', `Executed: ${toolName}`, `Args: ${args} → Result: ${result}`, {
      durationMs,
      inputs: [args],
      output: result,
    });
  }

  /**
   * Convenience: trace a decision
   */
  traceDecision(decision: string, reasoning: string, confidence: number): ReasoningStep {
    return this.addStep('decision', decision, reasoning, {
      confidence,
      output: decision,
    });
  }

  /**
   * Convenience: trace formula construction
   */
  traceFormulaBuild(formula: string, explanation: string): ReasoningStep {
    return this.addStep('formula_build', `Built formula: ${formula}`, explanation, {
      confidence: 0.95,
      output: formula,
    });
  }

  /**
   * Complete the current trace
   */
  completeTrace(): ReasoningTrace | null {
    if (!this.currentTrace) return null;

    const trace = this.currentTrace;
    this.traces.push(trace);

    // Trim old traces
    while (this.traces.length > this.MAX_TRACES) {
      this.traces.shift();
    }

    this.currentTrace = null;
    return trace;
  }

  /**
   * Get the current in-progress trace
   */
  getCurrentTrace(): ReasoningTrace | null {
    return this.currentTrace;
  }

  /**
   * Get a trace by message ID
   */
  getTraceForMessage(messageId: string): ReasoningTrace | undefined {
    return this.traces.find((t) => t.messageId === messageId);
  }

  /**
   * Get all stored traces
   */
  getAllTraces(): ReasoningTrace[] {
    return [...this.traces];
  }

  /**
   * Get the most recent trace
   */
  getLastTrace(): ReasoningTrace | undefined {
    return this.traces[this.traces.length - 1];
  }

  /**
   * Clear all traces
   */
  clear(): void {
    this.traces = [];
    this.currentTrace = null;
    this.stepCounter = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

export const reasoningTracer = new ReasoningTracer();
