// =============================================================================
// NL MACRO PARSER — Parse natural language to macros/workflows
// =============================================================================

import type {
  Workflow,
  WorkflowStep,
  MacroTrigger,
  ScheduleConfig,
  ActionType,
} from './types';

/**
 * Parse result
 */
export interface NLMacroParseResult {
  understood: boolean;
  suggestedName: string;
  workflow: Workflow;
  trigger: MacroTrigger;
  clarificationNeeded?: string;
  confidence: number;
}

/**
 * Detected action from NL
 */
interface DetectedAction {
  type: ActionType;
  params: Record<string, unknown>;
  label: string;
}

/**
 * Parse natural language to macro/workflow
 */
export class NLMacroParser {
  /**
   * Parse natural language description
   */
  async parse(description: string): Promise<NLMacroParseResult> {
    const normalized = description.toLowerCase().trim();

    // Detect trigger type
    const trigger = this.detectTrigger(normalized);

    // Detect actions
    const actions = this.detectActions(normalized);

    if (actions.length === 0) {
      return {
        understood: false,
        suggestedName: '',
        workflow: this.createEmptyWorkflow(),
        trigger,
        clarificationNeeded: 'Could not understand the requested actions',
        confidence: 0,
      };
    }

    // Generate workflow
    const workflow = this.createWorkflow(actions);

    // Generate name
    const name = this.generateName(actions, trigger);

    // Calculate confidence
    const confidence = Math.min(0.3 + actions.length * 0.2, 0.95);

    return {
      understood: true,
      suggestedName: name,
      workflow,
      trigger,
      confidence,
    };
  }

  /**
   * Get suggestions for a partial query
   */
  getSuggestions(partial: string): string[] {
    const suggestions: string[] = [];
    const p = partial.toLowerCase();

    // Schedule suggestions
    if (p.includes('every') || p.includes('daily') || p.includes('weekly')) {
      suggestions.push('Every Monday, create a sales report');
      suggestions.push('Daily at 9am, send summary email');
      suggestions.push('Weekly, export data to PDF');
    }

    // Data operation suggestions
    if (p.includes('clean') || p.includes('data')) {
      suggestions.push('Clean the data and remove duplicates');
      suggestions.push('When data changes, format the table');
    }

    // Report suggestions
    if (p.includes('report') || p.includes('export')) {
      suggestions.push('Create a report and email to team');
      suggestions.push('Export to PDF and send notification');
    }

    // Chart suggestions
    if (p.includes('chart') || p.includes('visual')) {
      suggestions.push('Create a chart from selected data');
      suggestions.push('Generate sales chart and add to dashboard');
    }

    return suggestions.slice(0, 5);
  }

  // ═══════════════════════════════════════════════════════════════
  // TRIGGER DETECTION
  // ═══════════════════════════════════════════════════════════════

  private detectTrigger(text: string): MacroTrigger {
    // Schedule triggers
    const schedulePatterns: { pattern: RegExp; config: Partial<ScheduleConfig> }[] = [
      {
        pattern: /every\s+day|daily|mỗi\s+ngày|hàng\s+ngày/i,
        config: { type: 'daily', timeOfDay: '09:00' }
      },
      {
        pattern: /every\s+monday|on\s+mondays|thứ\s+hai/i,
        config: { type: 'weekly', daysOfWeek: [1] }
      },
      {
        pattern: /every\s+tuesday|thứ\s+ba/i,
        config: { type: 'weekly', daysOfWeek: [2] }
      },
      {
        pattern: /every\s+wednesday|thứ\s+tư/i,
        config: { type: 'weekly', daysOfWeek: [3] }
      },
      {
        pattern: /every\s+thursday|thứ\s+năm/i,
        config: { type: 'weekly', daysOfWeek: [4] }
      },
      {
        pattern: /every\s+friday|thứ\s+sáu/i,
        config: { type: 'weekly', daysOfWeek: [5] }
      },
      {
        pattern: /every\s+week|weekly|hàng\s+tuần/i,
        config: { type: 'weekly', daysOfWeek: [1] }
      },
      {
        pattern: /every\s+month|monthly|hàng\s+tháng/i,
        config: { type: 'monthly', dayOfMonth: 1 }
      },
      {
        pattern: /every\s+(\d+)\s*(?:min|minute)/i,
        config: { type: 'interval', intervalMinutes: 0 }
      },
      {
        pattern: /every\s+(\d+)\s*(?:hour)/i,
        config: { type: 'interval', intervalMinutes: 60 }
      },
    ];

    for (const { pattern, config } of schedulePatterns) {
      const match = text.match(pattern);
      if (match) {
        const scheduleConfig = { ...config } as ScheduleConfig;
        if (scheduleConfig.type === 'interval' && match[1]) {
          scheduleConfig.intervalMinutes = parseInt(match[1]) * (text.includes('hour') ? 60 : 1);
        }
        return {
          type: 'schedule',
          config: { schedule: scheduleConfig },
          enabled: true,
        };
      }
    }

    // Time of day pattern
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      const timeOfDay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        type: 'schedule',
        config: { schedule: { type: 'daily', timeOfDay } },
        enabled: true,
      };
    }

    // Data change triggers
    if (/when\s+(?:data|value|cell)\s+(?:change|update)/i.test(text) ||
        /khi\s+(?:dữ liệu|giá trị)\s+(?:thay đổi)/i.test(text)) {
      return {
        type: 'data_change',
        config: { changeType: 'any' },
        enabled: true,
      };
    }

    // File open trigger
    if (/when\s+(?:file|workbook)\s+(?:open|load)/i.test(text)) {
      return {
        type: 'file_open',
        config: {},
        enabled: true,
      };
    }

    // Default to manual
    return {
      type: 'manual',
      config: {},
      enabled: true,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTION DETECTION
  // ═══════════════════════════════════════════════════════════════

  private detectActions(text: string): DetectedAction[] {
    const actions: DetectedAction[] = [];

    const actionPatterns: { pattern: RegExp; type: ActionType; extractParams: (m: RegExpMatchArray) => Record<string, unknown> }[] = [
      // Reports & Exports
      {
        pattern: /(?:create|generate|make)\s+(?:a\s+)?(?:sales\s+)?report/i,
        type: 'export_pdf',
        extractParams: () => ({ filename: 'report.pdf' }),
      },
      {
        pattern: /export\s+(?:to\s+)?pdf/i,
        type: 'export_pdf',
        extractParams: () => ({ filename: 'export.pdf' }),
      },
      {
        pattern: /export\s+(?:to\s+)?excel/i,
        type: 'export_excel',
        extractParams: () => ({ filename: 'export.xlsx' }),
      },
      {
        pattern: /export\s+(?:to\s+)?csv/i,
        type: 'export_csv',
        extractParams: () => ({ filename: 'export.csv' }),
      },

      // Data cleaning
      {
        pattern: /(?:clean|cleaning)\s+(?:the\s+)?data/i,
        type: 'ai_clean_data',
        extractParams: () => ({}),
      },
      {
        pattern: /làm\s+sạch\s+dữ\s+liệu/i,
        type: 'ai_clean_data',
        extractParams: () => ({}),
      },
      {
        pattern: /(?:remove|delete)\s+duplicate/i,
        type: 'remove_duplicates',
        extractParams: () => ({}),
      },
      {
        pattern: /xóa\s+trùng\s+lặp/i,
        type: 'remove_duplicates',
        extractParams: () => ({}),
      },

      // Sorting & Filtering
      {
        pattern: /sort\s+(?:by\s+)?(\w+)/i,
        type: 'sort_data',
        extractParams: (m) => ({ column: m[1] }),
      },
      {
        pattern: /filter\s+(?:by\s+)?(\w+)/i,
        type: 'filter_data',
        extractParams: (m) => ({ column: m[1] }),
      },

      // Charts
      {
        pattern: /(?:create|make|add)\s+(?:a\s+)?chart/i,
        type: 'ai_create_chart',
        extractParams: () => ({}),
      },
      {
        pattern: /tạo\s+biểu\s+đồ/i,
        type: 'ai_create_chart',
        extractParams: () => ({}),
      },
      {
        pattern: /(?:create|make)\s+(?:a\s+)?(line|bar|pie|column)\s+chart/i,
        type: 'create_chart',
        extractParams: (m) => ({ chartType: m[1] }),
      },

      // Formatting
      {
        pattern: /format\s+(?:the\s+)?(?:data|cells|table)/i,
        type: 'format_cells',
        extractParams: () => ({}),
      },
      {
        pattern: /định\s+dạng/i,
        type: 'format_cells',
        extractParams: () => ({}),
      },

      // Notifications & Email
      {
        pattern: /(?:send|email)\s+(?:to\s+)?([^\s,]+@[^\s,]+)/i,
        type: 'send_email',
        extractParams: (m) => ({ to: m[1], subject: 'Automated Report', body: '' }),
      },
      {
        pattern: /send\s+(?:an?\s+)?email/i,
        type: 'send_email',
        extractParams: () => ({ to: '', subject: 'Automated Report', body: '' }),
      },
      {
        pattern: /gửi\s+email/i,
        type: 'send_email',
        extractParams: () => ({ to: '', subject: 'Báo cáo tự động', body: '' }),
      },
      {
        pattern: /(?:notify|alert|send\s+notification)\s*(?:me|us)?/i,
        type: 'show_notification',
        extractParams: () => ({ message: 'Macro completed', type: 'success' }),
      },
      {
        pattern: /thông\s+báo/i,
        type: 'show_notification',
        extractParams: () => ({ message: 'Macro hoàn thành', type: 'success' }),
      },

      // Copy & Paste
      {
        pattern: /copy\s+(?:the\s+)?data/i,
        type: 'copy_range',
        extractParams: () => ({}),
      },
      {
        pattern: /paste/i,
        type: 'paste_range',
        extractParams: () => ({}),
      },

      // Vietnamese patterns
      {
        pattern: /tạo\s+báo\s+cáo/i,
        type: 'export_pdf',
        extractParams: () => ({ filename: 'bao-cao.pdf' }),
      },
      {
        pattern: /xuất\s+pdf/i,
        type: 'export_pdf',
        extractParams: () => ({ filename: 'export.pdf' }),
      },
      {
        pattern: /xuất\s+excel/i,
        type: 'export_excel',
        extractParams: () => ({ filename: 'export.xlsx' }),
      },

      // AI Actions
      {
        pattern: /ai\s+(?:help|assist|analyze)/i,
        type: 'ai_analyze',
        extractParams: () => ({}),
      },
      {
        pattern: /phân\s+tích/i,
        type: 'ai_analyze',
        extractParams: () => ({}),
      },
    ];

    for (const { pattern, type, extractParams } of actionPatterns) {
      const match = text.match(pattern);
      if (match) {
        actions.push({
          type,
          params: extractParams(match),
          label: this.getActionLabel(type),
        });
      }
    }

    return actions;
  }

  // ═══════════════════════════════════════════════════════════════
  // WORKFLOW CREATION
  // ═══════════════════════════════════════════════════════════════

  private createWorkflow(actions: DetectedAction[]): Workflow {
    const steps: WorkflowStep[] = actions.map((action, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      type: 'action',
      action: {
        id: crypto.randomUUID(),
        type: action.type,
        params: action.params,
      },
      enabled: true,
      label: action.label,
    }));

    return {
      id: crypto.randomUUID(),
      name: 'Generated Workflow',
      steps,
      variables: [],
      onError: 'stop',
    };
  }

  private createEmptyWorkflow(): Workflow {
    return {
      id: crypto.randomUUID(),
      name: 'Empty Workflow',
      steps: [],
      variables: [],
      onError: 'stop',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private generateName(actions: DetectedAction[], trigger: MacroTrigger): string {
    const actionNames = actions.slice(0, 2).map(a => a.label).join(' + ');

    let triggerName = '';
    if (trigger.type === 'schedule') {
      const schedule = trigger.config.schedule;
      if (schedule?.type === 'daily') triggerName = 'Daily';
      else if (schedule?.type === 'weekly') triggerName = 'Weekly';
      else if (schedule?.type === 'monthly') triggerName = 'Monthly';
      else if (schedule?.type === 'interval') triggerName = 'Recurring';
    } else if (trigger.type === 'data_change') {
      triggerName = 'On Change';
    }

    return triggerName ? `${triggerName} ${actionNames}` : actionNames || 'New Macro';
  }

  private getActionLabel(type: ActionType): string {
    const labels: Record<ActionType, string> = {
      copy_range: 'Copy',
      paste_range: 'Paste',
      clear_range: 'Clear',
      delete_rows: 'Delete Rows',
      insert_rows: 'Insert Rows',
      filter_data: 'Filter',
      sort_data: 'Sort',
      find_replace: 'Find/Replace',
      remove_duplicates: 'Remove Duplicates',
      apply_formula: 'Apply Formula',
      fill_formula: 'Fill Formula',
      recalculate: 'Recalculate',
      format_cells: 'Format',
      conditional_format: 'Conditional Format',
      auto_fit: 'Auto Fit',
      merge_cells: 'Merge',
      create_chart: 'Create Chart',
      update_chart: 'Update Chart',
      delete_chart: 'Delete Chart',
      add_sheet: 'Add Sheet',
      delete_sheet: 'Delete Sheet',
      rename_sheet: 'Rename Sheet',
      copy_sheet: 'Copy Sheet',
      import_data: 'Import',
      export_pdf: 'Export PDF',
      export_excel: 'Export Excel',
      export_csv: 'Export CSV',
      save_file: 'Save',
      send_email: 'Send Email',
      send_slack: 'Send Slack',
      show_notification: 'Notify',
      http_request: 'HTTP Request',
      run_script: 'Run Script',
      ai_clean_data: 'AI Clean',
      ai_create_chart: 'AI Chart',
      ai_formula: 'AI Formula',
      ai_analyze: 'AI Analyze',
    };

    return labels[type] || type;
  }
}
