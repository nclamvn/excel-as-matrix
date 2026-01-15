import { toCellRef } from '../types/cell';

const API_BASE = '/api';

// ===== Types =====

export interface WorkbookResponse {
  id: string;
  name: string;
  sheets: SheetResponse[];
}

export interface SheetResponse {
  id: string;
  name: string;
  index: number;
}

export interface CellResponse {
  row: number;
  col: number;
  value: string | null;
  formula: string | null;
  display_value: string;
}

export interface CommandResponse {
  success: boolean;
  event_ids: string[];
  error: string | null;
}

export interface CreateWorkbookRequest {
  name: string;
}

export interface CreateSheetRequest {
  name: string;
}

export interface UpdateCellRequest {
  value?: string;
  formula?: string;
}

// ===== API Client =====

// ===== AI Types =====

export interface AISessionResponse {
  id: string;
  workbook_id: string;
  sheet_id: string;
  budget_limit: string;
  created_at: string;
  expires_at: string;
}

export interface AIChatRequest {
  message: string;
  selected_range?: {
    sheet_id: string;
    start_row: number;
    start_col: number;
    end_row: number;
    end_col: number;
  };
  auto_execute?: boolean;
}

export interface AIChatResponse {
  message: string;
  tool_calls_count: number;
  proposed_action?: AIActionSummary;
  sandbox_id?: string;
  tokens_used: number;
  confidence: number;
}

export interface AIActionSummary {
  id: string;
  description: string;
  state: string;
  affected_cells: number;
  confidence: number;
  creates_formulas: boolean;
}

export interface AIActionDetail {
  id: string;
  session_id: string;
  state: string;
  description: string;
  reasoning: string;
  confidence: number;
  evidence_count: number;
  tests_count: number;
  tests_passed: boolean;
  trust_score: number;
  affected_cells: number;
  creates_formulas: boolean;
  structural_changes: boolean;
  created_at: string;
}

export interface SandboxResponse {
  id: string;
  action_id: string;
  state: string;
  description: string;
  diff_count: number;
  created_at: string;
}

export interface DiffResponse {
  sheet_id: string;
  row: number;
  col: number;
  cell_ref: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  old_formula: string | null;
  new_formula: string | null;
}

export interface PRResponse {
  id: string;
  sandbox_id: string;
  title: string;
  description: string;
  status: string;
  confidence: number;
  created_at: string;
}

export interface AIStatsResponse {
  active_sessions: number;
  total_sessions: number;
  total_actions: number;
  pending_actions: number;
}

// ===== API Client =====

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== Workbook =====

  async createWorkbook(name: string): Promise<WorkbookResponse> {
    return this.request<WorkbookResponse>('/workbooks', {
      method: 'POST',
      body: JSON.stringify({ name } as CreateWorkbookRequest),
    });
  }

  async getWorkbook(workbookId: string): Promise<WorkbookResponse> {
    return this.request<WorkbookResponse>(`/workbooks/${workbookId}`);
  }

  // ===== Sheet =====

  async createSheet(workbookId: string, name: string): Promise<SheetResponse> {
    return this.request<SheetResponse>(`/workbooks/${workbookId}/sheets`, {
      method: 'POST',
      body: JSON.stringify({ name } as CreateSheetRequest),
    });
  }

  async getSheet(workbookId: string, sheetId: string): Promise<SheetResponse> {
    return this.request<SheetResponse>(
      `/workbooks/${workbookId}/sheets/${sheetId}`
    );
  }

  // ===== Cells =====

  async getCells(workbookId: string, sheetId: string): Promise<CellResponse[]> {
    return this.request<CellResponse[]>(
      `/workbooks/${workbookId}/sheets/${sheetId}/cells`
    );
  }

  async getCell(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number
  ): Promise<CellResponse> {
    const cellRef = toCellRef(row, col);
    return this.request<CellResponse>(
      `/workbooks/${workbookId}/sheets/${sheetId}/cells/${cellRef}`
    );
  }

  async updateCell(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number,
    data: UpdateCellRequest
  ): Promise<CommandResponse> {
    const cellRef = toCellRef(row, col);
    return this.request<CommandResponse>(
      `/workbooks/${workbookId}/sheets/${sheetId}/cells/${cellRef}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // ===== Convenience Methods =====

  async setCellValue(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number,
    value: string
  ): Promise<CommandResponse> {
    return this.updateCell(workbookId, sheetId, row, col, { value });
  }

  async setCellFormula(
    workbookId: string,
    sheetId: string,
    row: number,
    col: number,
    formula: string
  ): Promise<CommandResponse> {
    return this.updateCell(workbookId, sheetId, row, col, { formula });
  }

  // ===== Commands =====

  async executeCommand(command: object): Promise<CommandResponse> {
    return this.request<CommandResponse>('/commands', {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  async clearRange(
    workbookId: string,
    sheetId: string,
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ): Promise<CommandResponse> {
    return this.executeCommand({
      type: 'ClearRange',
      workbook_id: workbookId,
      sheet_id: sheetId,
      start_row: startRow,
      start_col: startCol,
      end_row: endRow,
      end_col: endCol,
    });
  }

  // ===== AI Sessions =====

  async createAISession(
    workbookId: string,
    sheetId: string,
    budgetLimit: string = 'standard'
  ): Promise<AISessionResponse> {
    return this.request<AISessionResponse>('/ai/sessions', {
      method: 'POST',
      body: JSON.stringify({
        workbook_id: workbookId,
        sheet_id: sheetId,
        budget_limit: budgetLimit,
      }),
    });
  }

  async getAISession(sessionId: string): Promise<AISessionResponse> {
    return this.request<AISessionResponse>(`/ai/sessions/${sessionId}`);
  }

  // ===== AI Chat =====

  async chat(
    sessionId: string,
    message: string,
    selectedRange?: AIChatRequest['selected_range'],
    autoExecute: boolean = false
  ): Promise<AIChatResponse> {
    return this.request<AIChatResponse>(`/ai/sessions/${sessionId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        selected_range: selectedRange,
        auto_execute: autoExecute,
      } as AIChatRequest),
    });
  }

  // ===== AI Actions =====

  async getAIAction(actionId: string): Promise<AIActionDetail> {
    return this.request<AIActionDetail>(`/ai/actions/${actionId}`);
  }

  async approveAIAction(actionId: string, userId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/ai/actions/${actionId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async rejectAIAction(actionId: string, reason: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/ai/actions/${actionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async createSandboxForAction(actionId: string): Promise<SandboxResponse> {
    return this.request<SandboxResponse>(`/ai/actions/${actionId}/sandbox`, {
      method: 'POST',
    });
  }

  // ===== Sandboxes =====

  async getSandbox(sandboxId: string): Promise<SandboxResponse> {
    return this.request<SandboxResponse>(`/ai/sandboxes/${sandboxId}`);
  }

  async getSandboxDiffs(sandboxId: string): Promise<DiffResponse[]> {
    return this.request<DiffResponse[]>(`/ai/sandboxes/${sandboxId}/diffs`);
  }

  async createPR(sandboxId: string): Promise<PRResponse> {
    return this.request<PRResponse>(`/ai/sandboxes/${sandboxId}/pr`, {
      method: 'POST',
    });
  }

  async mergeSandbox(sandboxId: string, userId: string): Promise<{ success: boolean; commands_executed: number }> {
    return this.request<{ success: boolean; commands_executed: number }>(
      `/ai/sandboxes/${sandboxId}/merge`,
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }
    );
  }

  // ===== AI Stats =====

  async getAIStats(): Promise<AIStatsResponse> {
    return this.request<AIStatsResponse>('/ai/stats');
  }
}

export const apiClient = new ApiClient();
