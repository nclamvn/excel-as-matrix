// =============================================================================
// ACTION RECORDER — Record user actions and convert to workflows
// =============================================================================

import type {
  RecordedAction,
  RecordingSession,
  Workflow,
  WorkflowStep,
  ActionType,
} from './types';

/**
 * User action from the application
 */
interface UserAction {
  type: string;
  sheetId?: string;
  sheetName?: string;
  range?: string;
  params?: Record<string, unknown>;
  beforeState?: unknown;
  afterState?: unknown;
}

/**
 * Group of similar actions
 */
interface ActionGroup {
  type: ActionType;
  actions: RecordedAction[];
}

/**
 * Record user actions and convert to workflows
 */
export class ActionRecorder {
  private currentSession: RecordingSession | null = null;

  /**
   * Start recording
   */
  start(): RecordingSession {
    this.currentSession = {
      id: crypto.randomUUID(),
      startedAt: new Date(),
      actions: [],
      status: 'recording',
    };
    return this.currentSession;
  }

  /**
   * Pause recording
   */
  pause(): RecordingSession | null {
    if (this.currentSession) {
      this.currentSession.status = 'paused';
    }
    return this.currentSession;
  }

  /**
   * Resume recording
   */
  resume(): RecordingSession | null {
    if (this.currentSession) {
      this.currentSession.status = 'recording';
    }
    return this.currentSession;
  }

  /**
   * Stop recording
   */
  stop(): RecordingSession | null {
    if (this.currentSession) {
      this.currentSession.status = 'stopped';
      this.currentSession.endedAt = new Date();
    }
    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Record an action
   */
  recordAction(action: UserAction): RecordingSession | null {
    if (!this.currentSession || this.currentSession.status !== 'recording') {
      return null;
    }

    const recorded = this.convertToRecordedAction(action);
    if (recorded) {
      this.currentSession.actions.push(recorded);
    }

    return this.currentSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  /**
   * Convert recording session to workflow
   */
  toWorkflow(session: RecordingSession): Workflow {
    const steps: WorkflowStep[] = [];

    // Group similar consecutive actions
    const grouped = this.groupActions(session.actions);

    for (let i = 0; i < grouped.length; i++) {
      const group = grouped[i];

      steps.push({
        id: crypto.randomUUID(),
        order: i + 1,
        type: 'action',
        action: {
          id: crypto.randomUUID(),
          type: group.type,
          params: this.extractParams(group),
        },
        enabled: true,
        label: this.generateLabel(group),
      });
    }

    return {
      id: crypto.randomUUID(),
      name: 'Recorded Workflow',
      steps,
      variables: [],
      onError: 'stop',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private convertToRecordedAction(action: UserAction): RecordedAction | null {
    // Map user action to recorded action
    const actionMap: Record<string, ActionType> = {
      'cell_edit': 'apply_formula',
      'range_copy': 'copy_range',
      'range_paste': 'paste_range',
      'range_clear': 'clear_range',
      'row_insert': 'insert_rows',
      'row_delete': 'delete_rows',
      'format_change': 'format_cells',
      'sort': 'sort_data',
      'filter': 'filter_data',
      'chart_create': 'create_chart',
      'sheet_add': 'add_sheet',
      'sheet_delete': 'delete_sheet',
    };

    const type = actionMap[action.type];
    if (!type) return null;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      sheetId: action.sheetId,
      sheetName: action.sheetName,
      range: action.range,
      params: action.params || {},
      beforeState: action.beforeState,
      afterState: action.afterState,
    };
  }

  private groupActions(actions: RecordedAction[]): ActionGroup[] {
    const groups: ActionGroup[] = [];
    let currentGroup: ActionGroup | null = null;

    for (const action of actions) {
      if (!currentGroup || !this.canGroup(currentGroup.type, action.type)) {
        currentGroup = {
          type: action.type,
          actions: [action],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.actions.push(action);
      }
    }

    return groups;
  }

  private canGroup(type1: ActionType, type2: ActionType): boolean {
    // Group similar actions (e.g., multiple format changes)
    const groupable: ActionType[] = ['format_cells', 'apply_formula'];
    return type1 === type2 && groupable.includes(type1);
  }

  private extractParams(group: ActionGroup): Record<string, unknown> {
    const action = group.actions[0];
    const params: Record<string, unknown> = { ...action.params };

    // Add range info
    if (group.actions.length === 1) {
      params.range = action.range;
    } else {
      // Combine ranges
      params.ranges = group.actions.map(a => a.range);
    }

    return params;
  }

  private generateLabel(group: ActionGroup): string {
    const labels: Record<ActionType, string> = {
      copy_range: 'Copy range',
      paste_range: 'Paste',
      clear_range: 'Clear cells',
      delete_rows: 'Delete rows',
      insert_rows: 'Insert rows',
      filter_data: 'Apply filter',
      sort_data: 'Sort data',
      find_replace: 'Find and replace',
      remove_duplicates: 'Remove duplicates',
      apply_formula: 'Apply formula',
      fill_formula: 'Fill formula',
      recalculate: 'Recalculate',
      format_cells: 'Format cells',
      conditional_format: 'Conditional format',
      auto_fit: 'Auto fit columns',
      merge_cells: 'Merge cells',
      create_chart: 'Create chart',
      update_chart: 'Update chart',
      delete_chart: 'Delete chart',
      add_sheet: 'Add sheet',
      delete_sheet: 'Delete sheet',
      rename_sheet: 'Rename sheet',
      copy_sheet: 'Copy sheet',
      import_data: 'Import data',
      export_pdf: 'Export to PDF',
      export_excel: 'Export to Excel',
      export_csv: 'Export to CSV',
      save_file: 'Save file',
      send_email: 'Send email',
      send_slack: 'Send Slack message',
      show_notification: 'Show notification',
      http_request: 'HTTP request',
      run_script: 'Run script',
      ai_clean_data: 'AI clean data',
      ai_create_chart: 'AI create chart',
      ai_formula: 'AI formula',
      ai_analyze: 'AI analyze',
    };

    const base = labels[group.type] || group.type;
    return group.actions.length > 1 ? `${base} (×${group.actions.length})` : base;
  }
}
