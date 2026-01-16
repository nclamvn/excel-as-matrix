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

export interface CellChange {
  id: string;
  type: ChangeType;
  sheetId: string;
  cellRef?: string;
  range?: string;
  oldValue?: any;
  newValue?: any;
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
