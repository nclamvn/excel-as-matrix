/**
 * Filter View types — personal saved filter/sort configurations.
 * Each user can create multiple filter views per sheet without
 * affecting other users' views (like Google Sheets Filter Views).
 */

export interface FilterCondition {
  column: number;
  operator: FilterOperator;
  value: string | number | boolean | null;
  value2?: string | number | null; // For 'between'
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

export interface SortCondition {
  column: number;
  direction: 'asc' | 'desc';
}

export interface FilterView {
  id: string;
  name: string;
  sheetId: string;
  workbookId: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
  filters: FilterCondition[];
  sorts: SortCondition[];
  hiddenColumns: number[];
  hiddenRows: number[];
  isPersonal: boolean;
}
