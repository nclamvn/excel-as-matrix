// =============================================================================
// MACRO ENGINE — Main orchestrator for AI Macros
// =============================================================================

import { ActionRecorder } from './ActionRecorder';
import { WorkflowExecutor } from './WorkflowExecutor';
import { TriggerManager } from './TriggerManager';
import { ActionLibrary } from './ActionLibrary';
import { NLMacroParser } from './NLMacroParser';
import { WorkflowOptimizer } from './WorkflowOptimizer';
import { PatternDetector } from './PatternDetector';
import { MacroStorage } from './MacroStorage';
import type {
  Macro,
  Workflow,
  MacroTrigger,
  MacroExecution,
  RecordingSession,
  ActionDefinition,
  ActionCategory,
  OptimizationSuggestion,
  DetectedPattern,
} from './types';

type ExecutionHandler = (execution: MacroExecution) => void;
type RecordingHandler = (session: RecordingSession) => void;

/**
 * AI Macro Engine
 * Intelligent workflow automation for spreadsheets
 */
export class MacroEngine {
  private recorder: ActionRecorder;
  private executor: WorkflowExecutor;
  private triggerManager: TriggerManager;
  private actionLibrary: ActionLibrary;
  private nlParser: NLMacroParser;
  private optimizer: WorkflowOptimizer;
  private patternDetector: PatternDetector;
  private storage: MacroStorage;

  private macros: Map<string, Macro> = new Map();
  private executions: MacroExecution[] = [];
  private executionHandlers: Set<ExecutionHandler> = new Set();
  private recordingHandlers: Set<RecordingHandler> = new Set();

  constructor() {
    this.recorder = new ActionRecorder();
    this.executor = new WorkflowExecutor();
    this.triggerManager = new TriggerManager(this.runMacro.bind(this));
    this.actionLibrary = new ActionLibrary();
    this.nlParser = new NLMacroParser();
    this.optimizer = new WorkflowOptimizer();
    this.patternDetector = new PatternDetector();
    this.storage = new MacroStorage();

    this.loadMacros();
  }

  // ═══════════════════════════════════════════════════════════════
  // MACRO MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a new macro
   */
  createMacro(name: string, workflow: Workflow, trigger: MacroTrigger): Macro {
    const macro: Macro = {
      id: crypto.randomUUID(),
      name,
      description: '',
      workflow,
      trigger,
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
      enabled: true,
      tags: [],
      settings: {
        timeout: 300000,
        maxRetries: 3,
        retryDelay: 5000,
        logLevel: 'errors',
        keepLogs: 30,
        notifyOnComplete: false,
        notifyOnError: true,
        allowExternalAccess: false,
        allowFileAccess: true,
      },
    };

    this.macros.set(macro.id, macro);
    this.saveMacros();

    if (trigger.enabled) {
      this.triggerManager.register(macro);
    }

    return macro;
  }

  /**
   * Create macro from natural language
   */
  async createFromNL(description: string): Promise<Macro | null> {
    const result = await this.nlParser.parse(description);

    if (!result.understood) {
      return null;
    }

    return this.createMacro(
      result.suggestedName,
      result.workflow,
      result.trigger
    );
  }

  /**
   * Update macro
   */
  updateMacro(macroId: string, updates: Partial<Macro>): Macro | null {
    const macro = this.macros.get(macroId);
    if (!macro) return null;

    Object.assign(macro, updates, { updatedAt: new Date() });
    this.saveMacros();

    // Update trigger registration
    this.triggerManager.unregister(macroId);
    if (macro.trigger.enabled && macro.enabled) {
      this.triggerManager.register(macro);
    }

    return macro;
  }

  /**
   * Delete macro
   */
  deleteMacro(macroId: string): boolean {
    this.triggerManager.unregister(macroId);
    const deleted = this.macros.delete(macroId);
    if (deleted) this.saveMacros();
    return deleted;
  }

  /**
   * Get macro by ID
   */
  getMacro(macroId: string): Macro | undefined {
    return this.macros.get(macroId);
  }

  /**
   * Get all macros
   */
  getAllMacros(): Macro[] {
    return Array.from(this.macros.values());
  }

  /**
   * Enable/disable macro
   */
  setMacroEnabled(macroId: string, enabled: boolean): void {
    const macro = this.macros.get(macroId);
    if (!macro) return;

    macro.enabled = enabled;
    this.saveMacros();

    if (enabled && macro.trigger.enabled) {
      this.triggerManager.register(macro);
    } else {
      this.triggerManager.unregister(macroId);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Run macro manually
   */
  async runMacro(macroId: string, triggerData?: unknown): Promise<MacroExecution> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    const execution: MacroExecution = {
      id: crypto.randomUUID(),
      macroId,
      startedAt: new Date(),
      status: 'running',
      results: [],
      triggeredBy: triggerData ? 'data_change' : 'manual',
      triggerData,
    };

    this.executions.push(execution);
    this.notifyExecutionHandlers(execution);

    try {
      await this.executor.execute(macro.workflow, execution, (stepResult) => {
        execution.results.push(stepResult);
        execution.currentStep = execution.results.length;
        this.notifyExecutionHandlers(execution);
      });

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // Update macro stats
      macro.lastRunAt = new Date();
      macro.runCount++;
      this.saveMacros();

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      execution.error = {
        message: error instanceof Error ? error.message : String(error),
        details: error,
      };
    }

    this.notifyExecutionHandlers(execution);
    return execution;
  }

  /**
   * Cancel running execution
   */
  cancelExecution(executionId: string): void {
    const execution = this.executions.find(e => e.id === executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      this.executor.cancel(executionId);
      this.notifyExecutionHandlers(execution);
    }
  }

  /**
   * Get execution history
   */
  getExecutions(macroId?: string): MacroExecution[] {
    return macroId
      ? this.executions.filter(e => e.macroId === macroId)
      : this.executions;
  }

  // ═══════════════════════════════════════════════════════════════
  // RECORDING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start recording user actions
   */
  startRecording(): RecordingSession {
    const session = this.recorder.start();
    this.notifyRecordingHandlers(session);
    return session;
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    const session = this.recorder.pause();
    if (session) this.notifyRecordingHandlers(session);
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    const session = this.recorder.resume();
    if (session) this.notifyRecordingHandlers(session);
  }

  /**
   * Stop recording and create macro
   */
  stopRecording(name?: string): Macro | null {
    const session = this.recorder.stop();
    if (!session || session.actions.length === 0) {
      return null;
    }

    // Convert recorded actions to workflow
    const workflow = this.recorder.toWorkflow(session);

    // Optimize workflow
    const optimized = this.optimizer.optimize(workflow);

    // Create macro
    return this.createMacro(
      name || `Recorded Macro ${new Date().toLocaleDateString()}`,
      optimized,
      { type: 'manual', config: {}, enabled: true }
    );
  }

  /**
   * Get current recording session
   */
  getRecordingSession(): RecordingSession | null {
    return this.recorder.getCurrentSession();
  }

  /**
   * Record an action (called by event system)
   */
  recordAction(action: unknown): void {
    const session = this.recorder.recordAction(action as Parameters<typeof this.recorder.recordAction>[0]);
    if (session) this.notifyRecordingHandlers(session);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN DETECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyze user actions for patterns
   */
  async analyzePatterns(): Promise<DetectedPattern[]> {
    return this.patternDetector.analyze();
  }

  /**
   * Create macro from detected pattern
   */
  async createFromPattern(patternId: string): Promise<Macro | null> {
    const pattern = this.patternDetector.getPattern(patternId);
    if (!pattern) return null;

    const workflow = this.patternDetector.toWorkflow(pattern);
    return this.createMacro(
      pattern.suggestedName,
      workflow,
      { type: 'manual', config: {}, enabled: true }
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTION LIBRARY
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get available actions
   */
  getAvailableActions(): ActionDefinition[] {
    return this.actionLibrary.getAll();
  }

  /**
   * Get actions by category
   */
  getActionsByCategory(category: ActionCategory): ActionDefinition[] {
    return this.actionLibrary.getByCategory(category);
  }

  /**
   * Search actions
   */
  searchActions(query: string): ActionDefinition[] {
    return this.actionLibrary.search(query);
  }

  /**
   * Get action categories
   */
  getActionCategories(): { category: ActionCategory; label: string; labelVi: string }[] {
    return this.actionLibrary.getCategories();
  }

  // ═══════════════════════════════════════════════════════════════
  // OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Optimize workflow
   */
  optimizeWorkflow(workflow: Workflow): Workflow {
    return this.optimizer.optimize(workflow);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(workflow: Workflow): OptimizationSuggestion[] {
    return this.optimizer.getSuggestions(workflow);
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  onExecution(handler: ExecutionHandler): () => void {
    this.executionHandlers.add(handler);
    return () => this.executionHandlers.delete(handler);
  }

  onRecording(handler: RecordingHandler): () => void {
    this.recordingHandlers.add(handler);
    return () => this.recordingHandlers.delete(handler);
  }

  private notifyExecutionHandlers(execution: MacroExecution): void {
    this.executionHandlers.forEach(h => h(execution));
  }

  private notifyRecordingHandlers(session: RecordingSession): void {
    this.recordingHandlers.forEach(h => h(session));
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════

  private loadMacros(): void {
    const saved = this.storage.loadAll();
    saved.forEach(macro => {
      this.macros.set(macro.id, macro);
      if (macro.enabled && macro.trigger.enabled) {
        this.triggerManager.register(macro);
      }
    });
  }

  private saveMacros(): void {
    this.storage.saveAll(Array.from(this.macros.values()));
  }

  /**
   * Export macros
   */
  exportMacros(macroIds?: string[]): string {
    return this.storage.export(macroIds);
  }

  /**
   * Import macros
   */
  importMacros(json: string, merge: boolean = true): number {
    const count = this.storage.import(json, merge);
    if (count > 0) {
      this.loadMacros();
    }
    return count;
  }
}

// Export singleton
export const macroEngine = new MacroEngine();
