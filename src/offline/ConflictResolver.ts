// Phase 10: Conflict Resolver
// Handles sync conflicts between local and server data

import { offlineDB, OfflineCell, CellValue, ConflictInfo } from './OfflineDB';
export type { ConflictInfo };

// === Types ===

export type ConflictResolution = 'local' | 'server' | 'merge' | 'manual';

export interface ResolvedConflict {
  cellId: string;
  resolution: ConflictResolution;
  finalValue: CellValue;
}

export interface ConflictResolutionStrategy {
  // Automatic resolution strategies
  lastWriterWins: boolean;
  preferServer: boolean;
  preferLocal: boolean;
  // Custom merge function
  mergeFunction?: (local: CellValue, server: CellValue) => CellValue;
}

export interface ConflictContext {
  conflict: ConflictInfo;
  localCell?: OfflineCell;
  strategy: ConflictResolutionStrategy;
}

// === Default Strategies ===

export const defaultStrategy: ConflictResolutionStrategy = {
  lastWriterWins: true,
  preferServer: false,
  preferLocal: false,
};

export const serverWinsStrategy: ConflictResolutionStrategy = {
  lastWriterWins: false,
  preferServer: true,
  preferLocal: false,
};

export const localWinsStrategy: ConflictResolutionStrategy = {
  lastWriterWins: false,
  preferServer: false,
  preferLocal: true,
};

// === Conflict Resolver Class ===

class ConflictResolver {
  private pendingConflicts: Map<string, ConflictInfo> = new Map();
  private resolvedConflicts: Map<string, ResolvedConflict> = new Map();
  private strategy: ConflictResolutionStrategy = defaultStrategy;

  // === Configuration ===

  setStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategy = strategy;
  }

  getStrategy(): ConflictResolutionStrategy {
    return this.strategy;
  }

  // === Conflict Management ===

  addConflict(conflict: ConflictInfo): void {
    this.pendingConflicts.set(conflict.cellId, conflict);
  }

  addConflicts(conflicts: ConflictInfo[]): void {
    conflicts.forEach((conflict) => this.addConflict(conflict));
  }

  getConflict(cellId: string): ConflictInfo | undefined {
    return this.pendingConflicts.get(cellId);
  }

  getPendingConflicts(): ConflictInfo[] {
    return Array.from(this.pendingConflicts.values());
  }

  getPendingConflictCount(): number {
    return this.pendingConflicts.size;
  }

  hasConflicts(): boolean {
    return this.pendingConflicts.size > 0;
  }

  clearConflicts(): void {
    this.pendingConflicts.clear();
    this.resolvedConflicts.clear();
  }

  // === Auto Resolution ===

  async autoResolve(conflict: ConflictInfo): Promise<ResolvedConflict> {
    let resolution: ConflictResolution;
    let finalValue: CellValue;

    if (this.strategy.preferServer) {
      resolution = 'server';
      finalValue = conflict.serverValue;
    } else if (this.strategy.preferLocal) {
      resolution = 'local';
      finalValue = conflict.localValue;
    } else if (this.strategy.lastWriterWins) {
      if (conflict.localTimestamp > conflict.serverTimestamp) {
        resolution = 'local';
        finalValue = conflict.localValue;
      } else {
        resolution = 'server';
        finalValue = conflict.serverValue;
      }
    } else if (this.strategy.mergeFunction) {
      resolution = 'merge';
      finalValue = this.strategy.mergeFunction(conflict.localValue, conflict.serverValue);
    } else {
      // Default to server
      resolution = 'server';
      finalValue = conflict.serverValue;
    }

    const resolved: ResolvedConflict = {
      cellId: conflict.cellId,
      resolution,
      finalValue,
    };

    await this.applyResolution(resolved);
    return resolved;
  }

  async autoResolveAll(): Promise<ResolvedConflict[]> {
    const results: ResolvedConflict[] = [];
    for (const conflict of this.pendingConflicts.values()) {
      const resolved = await this.autoResolve(conflict);
      results.push(resolved);
    }
    return results;
  }

  // === Manual Resolution ===

  async resolveWithLocal(cellId: string): Promise<ResolvedConflict | null> {
    const conflict = this.pendingConflicts.get(cellId);
    if (!conflict) return null;

    const resolved: ResolvedConflict = {
      cellId,
      resolution: 'local',
      finalValue: conflict.localValue,
    };

    await this.applyResolution(resolved);
    return resolved;
  }

  async resolveWithServer(cellId: string): Promise<ResolvedConflict | null> {
    const conflict = this.pendingConflicts.get(cellId);
    if (!conflict) return null;

    const resolved: ResolvedConflict = {
      cellId,
      resolution: 'server',
      finalValue: conflict.serverValue,
    };

    await this.applyResolution(resolved);
    return resolved;
  }

  async resolveWithValue(cellId: string, value: CellValue): Promise<ResolvedConflict | null> {
    const conflict = this.pendingConflicts.get(cellId);
    if (!conflict) return null;

    const resolved: ResolvedConflict = {
      cellId,
      resolution: 'manual',
      finalValue: value,
    };

    await this.applyResolution(resolved);
    return resolved;
  }

  // === Apply Resolution ===

  private async applyResolution(resolved: ResolvedConflict): Promise<void> {
    const { cellId, finalValue } = resolved;

    // Update local cell
    const localCell = await offlineDB.getCell(cellId);
    if (localCell) {
      localCell.value = finalValue;
      localCell.displayValue = String(finalValue ?? '');
      localCell.dirty = resolved.resolution !== 'server'; // Mark dirty if not using server value
      localCell.updatedAt = Date.now();
      await offlineDB.saveCell(localCell);
    }

    // Remove from pending and add to resolved
    this.pendingConflicts.delete(cellId);
    this.resolvedConflicts.set(cellId, resolved);

    // If resolution is local or manual, need to push to server
    if (resolved.resolution === 'local' || resolved.resolution === 'manual') {
      const parsed = offlineDB.parseCellId(cellId);
      if (parsed && localCell) {
        await offlineDB.addPendingChange({
          workbookId: localCell.workbookId,
          sheetId: parsed.sheetId,
          cellId,
          type: 'cell',
          operation: 'update',
          data: {
            row: parsed.row,
            col: parsed.col,
            value: finalValue,
            formula: localCell.formula,
            conflictResolved: true,
          },
          timestamp: Date.now(),
          retryCount: 0,
        });
      }
    }
  }

  // === Batch Operations ===

  async resolveAllWithLocal(): Promise<ResolvedConflict[]> {
    const results: ResolvedConflict[] = [];
    for (const cellId of this.pendingConflicts.keys()) {
      const resolved = await this.resolveWithLocal(cellId);
      if (resolved) results.push(resolved);
    }
    return results;
  }

  async resolveAllWithServer(): Promise<ResolvedConflict[]> {
    const results: ResolvedConflict[] = [];
    for (const cellId of this.pendingConflicts.keys()) {
      const resolved = await this.resolveWithServer(cellId);
      if (resolved) results.push(resolved);
    }
    return results;
  }

  // === History ===

  getResolvedConflicts(): ResolvedConflict[] {
    return Array.from(this.resolvedConflicts.values());
  }

  getResolution(cellId: string): ResolvedConflict | undefined {
    return this.resolvedConflicts.get(cellId);
  }
}

// Export singleton instance
export const conflictResolver = new ConflictResolver();

// === Merge Functions ===

export const mergeFunctions = {
  // Concatenate string values
  concatenate: (local: CellValue, server: CellValue): CellValue => {
    if (typeof local === 'string' && typeof server === 'string') {
      return `${local} | ${server}`;
    }
    return server;
  },

  // Sum numeric values
  sum: (local: CellValue, server: CellValue): CellValue => {
    const localNum = typeof local === 'number' ? local : parseFloat(String(local));
    const serverNum = typeof server === 'number' ? server : parseFloat(String(server));
    if (!isNaN(localNum) && !isNaN(serverNum)) {
      return localNum + serverNum;
    }
    return server;
  },

  // Take max of numeric values
  max: (local: CellValue, server: CellValue): CellValue => {
    const localNum = typeof local === 'number' ? local : parseFloat(String(local));
    const serverNum = typeof server === 'number' ? server : parseFloat(String(server));
    if (!isNaN(localNum) && !isNaN(serverNum)) {
      return Math.max(localNum, serverNum);
    }
    return server;
  },

  // Take min of numeric values
  min: (local: CellValue, server: CellValue): CellValue => {
    const localNum = typeof local === 'number' ? local : parseFloat(String(local));
    const serverNum = typeof server === 'number' ? server : parseFloat(String(server));
    if (!isNaN(localNum) && !isNaN(serverNum)) {
      return Math.min(localNum, serverNum);
    }
    return server;
  },
};
