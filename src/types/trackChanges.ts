// ============================================================
// TRACK CHANGES TYPES
// ============================================================

export type ChangeType =
  | 'cellEdit'
  | 'cellFormat'
  | 'rowInsert'
  | 'rowDelete'
  | 'colInsert'
  | 'colDelete'
  | 'sheetInsert'
  | 'sheetDelete'
  | 'sheetRename';

// Cell values can be string, number, boolean, null, or objects (for format changes)
export type CellChangeValue = string | number | boolean | null | Record<string, unknown>;

export interface CellChange {
  id: string;
  type: ChangeType;
  sheetId: string;
  cellRef?: string;
  range?: string;
  oldValue?: CellChangeValue;
  newValue?: CellChangeValue;
  authorId: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface TrackChangesSettings {
  enabled: boolean;
  highlightChanges: boolean;
  highlightColor: string;
}

export const DEFAULT_TRACK_SETTINGS: TrackChangesSettings = {
  enabled: false,
  highlightChanges: true,
  highlightColor: '#E2EFDA',
};
