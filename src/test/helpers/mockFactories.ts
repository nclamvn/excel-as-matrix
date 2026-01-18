// Mock data factories for testing
import { vi } from 'vitest';
import type { CellData, Sheet, CellFormat, CellRange } from '../../types/cell';
import type {
  FormulaResult,
  CellDependency,
  FormulaValue,
  CellReference,
  ASTNode,
} from '../../engine/types';

// Counter for unique IDs
let idCounter = 0;
const resetIdCounter = () => {
  idCounter = 0;
};
const nextId = (prefix: string = 'id') => `${prefix}-${++idCounter}`;

// ═══════════════════════════════════════════════════════════════════════════
// Cell & Sheet Factories
// ═══════════════════════════════════════════════════════════════════════════

export function createMockCellData(overrides: Partial<CellData> = {}): CellData {
  return {
    value: null,
    formula: null,
    displayValue: '',
    format: undefined,
    ...overrides,
  };
}

export function createMockSheet(overrides: Partial<Sheet> = {}): Sheet {
  return {
    id: nextId('sheet'),
    name: `Sheet${idCounter}`,
    index: 0,
    cells: {},
    columnWidths: {},
    rowHeights: {},
    ...overrides,
  };
}

export function createMockCellFormat(overrides: Partial<CellFormat> = {}): CellFormat {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 11,
    fontFamily: 'Arial',
    textColor: '#000000',
    backgroundColor: undefined,
    horizontalAlign: 'left',
    verticalAlign: 'middle',
    numberFormat: undefined,
    wrapText: false,
    ...overrides,
  };
}

export function createMockRange(overrides: Partial<CellRange> = {}): CellRange {
  return {
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Formula Engine Factories
// ═══════════════════════════════════════════════════════════════════════════

export function createMockFormulaResult(overrides: Partial<FormulaResult> = {}): FormulaResult {
  return {
    value: 0,
    displayValue: '0',
    error: undefined,
    dependencies: [],
    ...overrides,
  };
}

export function createMockCellDependency(overrides: Partial<CellDependency> = {}): CellDependency {
  return {
    sheetId: 'sheet-1',
    row: 0,
    col: 0,
    ...overrides,
  };
}

export function createMockCellReference(overrides: Partial<CellReference> = {}): CellReference {
  return {
    col: 0,
    row: 0,
    colAbsolute: false,
    rowAbsolute: false,
    sheetName: undefined,
    ...overrides,
  };
}

export function createMockASTNode(type: string, overrides: Partial<ASTNode> = {}): ASTNode {
  return {
    type: type as ASTNode['type'],
    ...overrides,
  };
}

// Create mock data provider for formula engine
export function createMockDataProvider(cells: Record<string, FormulaValue> = {}) {
  return {
    getCellValue: vi.fn((sheetId: string, row: number, col: number) => {
      const key = `${sheetId}:${row}:${col}`;
      return cells[key] ?? null;
    }),
    getCellFormula: vi.fn((_sheetId: string, _row: number, _col: number) => {
      return undefined;
    }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Collaboration Factories
// ═══════════════════════════════════════════════════════════════════════════

export interface MockCollaborationUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string;
}

export interface MockSyncMessage {
  id: string;
  type: string;
  documentId: string;
  userId: string;
  timestamp: number;
  payload: unknown;
  vectorClock: Record<string, number>;
  sequence: number;
}

export interface MockUserSession {
  user: MockCollaborationUser;
  sessionId: string;
  documentId: string;
  status: string;
  connectedAt: Date;
  lastActiveAt: Date;
  activeSheet: string;
  deviceType: string;
  clientVersion: string;
}

export function createMockUser(overrides: Partial<MockCollaborationUser> = {}): MockCollaborationUser {
  const id = nextId('user');
  return {
    id,
    name: `User ${idCounter}`,
    email: `user${idCounter}@test.com`,
    color: '#3b82f6',
    ...overrides,
  };
}

export function createMockSyncMessage(overrides: Partial<MockSyncMessage> = {}): MockSyncMessage {
  return {
    id: nextId('msg'),
    type: 'event_broadcast',
    documentId: 'doc-1',
    userId: 'user-1',
    timestamp: Date.now(),
    payload: {},
    vectorClock: {},
    sequence: 0,
    ...overrides,
  };
}

export function createMockUserSession(overrides: Partial<MockUserSession> = {}): MockUserSession {
  const user = createMockUser();
  return {
    user,
    sessionId: nextId('session'),
    documentId: 'doc-1',
    status: 'connected',
    connectedAt: new Date(),
    lastActiveAt: new Date(),
    activeSheet: 'sheet-1',
    deviceType: 'desktop',
    clientVersion: '1.0.0',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Factories
// ═══════════════════════════════════════════════════════════════════════════

export interface MockAIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsed?: number;
    toolCalls?: MockToolCall[];
  };
}

export interface MockToolCall {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  status?: 'pending' | 'executed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface MockAIConversation {
  id: string;
  messages: MockAIMessage[];
  context: Record<string, unknown>;
  pendingActions: unknown[];
  history: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export function createMockAIMessage(overrides: Partial<MockAIMessage> = {}): MockAIMessage {
  return {
    id: nextId('msg'),
    role: 'user',
    content: 'Test message',
    timestamp: new Date(),
    ...overrides,
  };
}

export function createMockToolCall(overrides: Partial<MockToolCall> = {}): MockToolCall {
  return {
    id: nextId('tool'),
    tool: 'read_range',
    arguments: { range: 'A1:A10' },
    status: 'pending',
    ...overrides,
  };
}

export function createMockAIConversation(overrides: Partial<MockAIConversation> = {}): MockAIConversation {
  return {
    id: nextId('conv'),
    messages: [],
    context: {},
    pendingActions: [],
    history: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Cleaner Factories
// ═══════════════════════════════════════════════════════════════════════════

export interface MockCleaningIssue {
  id: string;
  type: 'duplicate' | 'outlier' | 'missing' | 'inconsistent' | 'invalid';
  severity: 'low' | 'medium' | 'high';
  row: number;
  col: number;
  currentValue: unknown;
  suggestedValue?: unknown;
  description: string;
}

export interface MockQualityReport {
  score: number;
  totalRows: number;
  totalColumns: number;
  issues: MockCleaningIssue[];
  metrics: {
    completeness: number;
    consistency: number;
    accuracy: number;
    uniqueness: number;
  };
}

export function createMockCleaningIssue(overrides: Partial<MockCleaningIssue> = {}): MockCleaningIssue {
  return {
    id: nextId('issue'),
    type: 'duplicate',
    severity: 'medium',
    row: 0,
    col: 0,
    currentValue: 'duplicate value',
    suggestedValue: undefined,
    description: 'Duplicate value detected',
    ...overrides,
  };
}

export function createMockQualityReport(overrides: Partial<MockQualityReport> = {}): MockQualityReport {
  return {
    score: 85,
    totalRows: 100,
    totalColumns: 5,
    issues: [],
    metrics: {
      completeness: 0.95,
      consistency: 0.90,
      accuracy: 0.88,
      uniqueness: 0.85,
    },
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Factories
// ═══════════════════════════════════════════════════════════════════════════

// Create mock clipboard data
export function createMockClipboardData(
  cells: Record<string, CellData>,
  mode: 'copy' | 'cut' = 'copy'
) {
  return {
    cells,
    range: createMockRange(),
    mode,
    sourceSheetId: 'sheet-1',
  };
}

// Create mock history snapshot
export function createMockHistorySnapshot(sheets: Record<string, Sheet> = {}) {
  return {
    sheets,
    timestamp: Date.now(),
  };
}

// Generate large dataset for stress tests
export function generateLargeDataset(
  rows: number,
  cols: number,
  options: {
    includeFormulas?: boolean;
    includeFormatting?: boolean;
    valueGenerator?: (row: number, col: number) => string | number | null;
  } = {}
): Record<string, CellData> {
  const cells: Record<string, CellData> = {};
  const { includeFormulas = false, includeFormatting = false, valueGenerator } = options;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row}:${col}`;
      let value: string | number | null;

      if (valueGenerator) {
        value = valueGenerator(row, col);
      } else {
        value = row * cols + col;
      }

      const cell: CellData = {
        value,
        formula: null,
        displayValue: String(value ?? ''),
      };

      // Add formula to some cells
      if (includeFormulas && row > 0 && col === 0 && row % 10 === 0) {
        cell.formula = `=SUM(A1:A${row})`;
        cell.displayValue = '[formula]';
      }

      // Add formatting to some cells
      if (includeFormatting && (row + col) % 5 === 0) {
        cell.format = createMockCellFormat({
          bold: row % 2 === 0,
          backgroundColor: col % 2 === 0 ? '#f3f4f6' : undefined,
        });
      }

      cells[key] = cell;
    }
  }

  return cells;
}

// Generate random data
export function generateRandomData(
  rows: number,
  cols: number,
  types: Array<'string' | 'number' | 'date' | 'boolean' | 'empty'> = ['number']
): Record<string, CellData> {
  const cells: Record<string, CellData> = {};

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row}:${col}`;
      const type = types[col % types.length];

      let value: string | number | boolean | null;

      switch (type) {
        case 'string':
          value = `Text_${row}_${col}`;
          break;
        case 'number':
          value = Math.round(Math.random() * 10000) / 100;
          break;
        case 'date':
          value = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          break;
        case 'boolean':
          value = Math.random() > 0.5;
          break;
        case 'empty':
          value = null;
          break;
        default:
          value = null;
      }

      cells[key] = createMockCellData({
        value,
        displayValue: String(value ?? ''),
      });
    }
  }

  return cells;
}

// Reset factory state
export { resetIdCounter };

export default {
  createMockCellData,
  createMockSheet,
  createMockCellFormat,
  createMockRange,
  createMockFormulaResult,
  createMockCellDependency,
  createMockCellReference,
  createMockASTNode,
  createMockDataProvider,
  createMockUser,
  createMockSyncMessage,
  createMockUserSession,
  createMockAIMessage,
  createMockToolCall,
  createMockAIConversation,
  createMockCleaningIssue,
  createMockQualityReport,
  createMockClipboardData,
  createMockHistorySnapshot,
  generateLargeDataset,
  generateRandomData,
  resetIdCounter,
};
