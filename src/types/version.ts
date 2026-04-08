/**
 * Version History types for workbook snapshots.
 */

export interface WorkbookSnapshot {
  id: string;
  workbookId: string;
  version: number;
  timestamp: number;
  createdBy: string;
  createdByName: string;
  description: string;

  /** Serialized workbook data (sheets + metadata) */
  data: SnapshotData;

  /** Approximate size in bytes for storage management */
  sizeBytes: number;
}

export interface SnapshotData {
  sheets: Record<string, SheetSnapshotData>;
  sheetOrder: string[];
  workbookName: string;
}

export interface SheetSnapshotData {
  id: string;
  name: string;
  cells: Record<string, unknown>;
}

export interface SnapshotChangeSummary {
  cellsModified: number;
  sheetsAdded: string[];
  sheetsRemoved: string[];
}
