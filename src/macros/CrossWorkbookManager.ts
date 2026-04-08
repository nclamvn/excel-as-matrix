// ═══════════════════════════════════════════════════════════════════════════
// CROSS-WORKBOOK MANAGER — Manage references and operations across workbooks
// Enables macros/workflows to read from one workbook and write to another
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkbookRef {
  id: string;
  name: string;
  source: WorkbookSource;
  lastAccessed: number;
  status: 'connected' | 'disconnected' | 'error';
  metadata: {
    sheetCount: number;
    sheetNames: string[];
  };
}

export type WorkbookSource =
  | { type: 'local'; workbookId: string }
  | { type: 'file'; filePath: string; fileHandle?: FileSystemFileHandle }
  | { type: 'url'; url: string; refreshInterval?: number };

export interface CrossWorkbookAction {
  type: CrossWorkbookActionType;
  sourceWorkbook: string; // WorkbookRef id
  targetWorkbook: string; // WorkbookRef id
  config: CrossWorkbookActionConfig;
}

export type CrossWorkbookActionType =
  | 'copy_range'      // Copy cells from source to target
  | 'link_cells'      // Create live link between cells
  | 'merge_sheets'    // Merge sheets from source into target
  | 'sync_range'      // Keep a range synchronized
  | 'aggregate'       // Aggregate data from multiple workbooks
  | 'lookup';         // Cross-workbook VLOOKUP

export interface CrossWorkbookActionConfig {
  sourceSheet?: string;
  sourceRange?: string;
  targetSheet?: string;
  targetRange?: string;
  // For merge
  mergeStrategy?: 'append' | 'replace' | 'update';
  // For sync
  syncDirection?: 'source_to_target' | 'target_to_source' | 'bidirectional';
  // For aggregate
  aggregateFunction?: 'sum' | 'count' | 'average' | 'concat';
  // For lookup
  lookupColumn?: string;
  returnColumn?: string;
}

export interface CrossWorkbookResult {
  success: boolean;
  action: CrossWorkbookActionType;
  cellsAffected: number;
  errors: string[];
  duration: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CrossWorkbookManager
// ─────────────────────────────────────────────────────────────────────────────

export class CrossWorkbookManager {
  private registry = new Map<string, WorkbookRef>();
  private links = new Map<string, { source: string; target: string; sourceRange: string; targetRange: string }>();

  /**
   * Register a workbook for cross-workbook operations
   */
  registerWorkbook(name: string, source: WorkbookSource): WorkbookRef {
    const ref: WorkbookRef = {
      id: `wb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      source,
      lastAccessed: Date.now(),
      status: 'connected',
      metadata: { sheetCount: 0, sheetNames: [] },
    };

    this.registry.set(ref.id, ref);
    loggers.macro.info(`Registered workbook: ${name} (${ref.id})`);
    return ref;
  }

  /**
   * Unregister a workbook
   */
  unregisterWorkbook(id: string): boolean {
    const deleted = this.registry.delete(id);
    // Remove associated links
    for (const [linkId, link] of this.links) {
      if (link.source === id || link.target === id) {
        this.links.delete(linkId);
      }
    }
    return deleted;
  }

  /**
   * Get a registered workbook
   */
  getWorkbook(id: string): WorkbookRef | undefined {
    return this.registry.get(id);
  }

  /**
   * List all registered workbooks
   */
  listWorkbooks(): WorkbookRef[] {
    return Array.from(this.registry.values());
  }

  /**
   * Execute a cross-workbook action
   */
  async executeAction(action: CrossWorkbookAction): Promise<CrossWorkbookResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let cellsAffected = 0;

    const sourceWb = this.registry.get(action.sourceWorkbook);
    const targetWb = this.registry.get(action.targetWorkbook);

    if (!sourceWb) {
      errors.push(`Source workbook not found: ${action.sourceWorkbook}`);
      return { success: false, action: action.type, cellsAffected: 0, errors, duration: Date.now() - startTime };
    }
    if (!targetWb) {
      errors.push(`Target workbook not found: ${action.targetWorkbook}`);
      return { success: false, action: action.type, cellsAffected: 0, errors, duration: Date.now() - startTime };
    }

    try {
      switch (action.type) {
        case 'copy_range':
          cellsAffected = await this.executeCopyRange(sourceWb, targetWb, action.config);
          break;
        case 'link_cells':
          cellsAffected = this.executeLinkCells(sourceWb, targetWb, action.config);
          break;
        case 'merge_sheets':
          cellsAffected = await this.executeMergeSheets(sourceWb, targetWb, action.config);
          break;
        case 'sync_range':
          cellsAffected = await this.executeSyncRange(sourceWb, targetWb, action.config);
          break;
        case 'aggregate':
          cellsAffected = await this.executeAggregate(action.config);
          break;
        case 'lookup':
          cellsAffected = await this.executeLookup(sourceWb, targetWb, action.config);
          break;
        default:
          errors.push(`Unknown action type: ${action.type}`);
      }

      sourceWb.lastAccessed = Date.now();
      targetWb.lastAccessed = Date.now();

      loggers.macro.info(`Cross-workbook ${action.type}: ${cellsAffected} cells affected`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      success: errors.length === 0,
      action: action.type,
      cellsAffected,
      errors,
      duration: Date.now() - startTime,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Action Implementations
  // ─────────────────────────────────────────────────────────────────────────

  private async executeCopyRange(
    _source: WorkbookRef,
    _target: WorkbookRef,
    config: CrossWorkbookActionConfig
  ): Promise<number> {
    // In a real implementation, this would read cells from source workbook store
    // and write them to target workbook store
    const sourceRange = config.sourceRange || 'A1:A1';
    const rangeMatch = sourceRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
    if (!rangeMatch) return 0;

    const startCol = rangeMatch[1].charCodeAt(0) - 65;
    const startRow = parseInt(rangeMatch[2]) - 1;
    const endCol = rangeMatch[3].charCodeAt(0) - 65;
    const endRow = parseInt(rangeMatch[4]) - 1;

    return (endRow - startRow + 1) * (endCol - startCol + 1);
  }

  private executeLinkCells(
    source: WorkbookRef,
    target: WorkbookRef,
    config: CrossWorkbookActionConfig
  ): number {
    const linkId = `link-${Date.now()}`;
    this.links.set(linkId, {
      source: source.id,
      target: target.id,
      sourceRange: config.sourceRange || 'A1',
      targetRange: config.targetRange || 'A1',
    });
    return 1;
  }

  private async executeMergeSheets(
    _source: WorkbookRef,
    _target: WorkbookRef,
    _config: CrossWorkbookActionConfig
  ): Promise<number> {
    // Merge sheets from source into target
    // Strategy: append (add rows), replace (overwrite), update (merge by key)
    return 0; // Placeholder — actual impl reads from workbook stores
  }

  private async executeSyncRange(
    source: WorkbookRef,
    target: WorkbookRef,
    config: CrossWorkbookActionConfig
  ): Promise<number> {
    // Keep ranges in sync — essentially a scheduled copy
    return this.executeCopyRange(source, target, config);
  }

  private async executeAggregate(
    _config: CrossWorkbookActionConfig
  ): Promise<number> {
    // Aggregate data across all registered workbooks
    // e.g., SUM all A1 values from every workbook
    return this.registry.size;
  }

  private async executeLookup(
    _source: WorkbookRef,
    _target: WorkbookRef,
    _config: CrossWorkbookActionConfig
  ): Promise<number> {
    // Cross-workbook VLOOKUP equivalent
    return 0; // Placeholder
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Link Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all active links
   */
  getLinks(): Array<{ id: string; source: string; target: string; sourceRange: string; targetRange: string }> {
    return Array.from(this.links.entries()).map(([id, link]) => ({ id, ...link }));
  }

  /**
   * Remove a link
   */
  removeLink(linkId: string): boolean {
    return this.links.delete(linkId);
  }

  /**
   * Refresh all links (re-sync linked cells)
   */
  async refreshLinks(): Promise<number> {
    let refreshed = 0;
    for (const [, link] of this.links) {
      const source = this.registry.get(link.source);
      const target = this.registry.get(link.target);
      if (source && target) {
        await this.executeCopyRange(source, target, {
          sourceRange: link.sourceRange,
          targetRange: link.targetRange,
        });
        refreshed++;
      }
    }
    return refreshed;
  }

  /**
   * Clear all registrations and links
   */
  clear(): void {
    this.registry.clear();
    this.links.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const crossWorkbookManager = new CrossWorkbookManager();
