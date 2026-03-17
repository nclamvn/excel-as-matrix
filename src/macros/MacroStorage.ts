// =============================================================================
// MACRO STORAGE — Persist and load macros
// =============================================================================

import type { Macro } from './types';
import { loggers } from '@/utils/logger';

const STORAGE_KEY = 'excel_ai_macros';
const STORAGE_VERSION = 1;

interface StorageData {
  version: number;
  macros: Macro[];
  lastUpdated: string;
}

/**
 * Persist and load macros
 */
export class MacroStorage {
  /**
   * Save all macros
   */
  saveAll(macros: Macro[]): void {
    const data: StorageData = {
      version: STORAGE_VERSION,
      macros: macros.map(m => this.serializeMacro(m)),
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      loggers.macro.error('Failed to save macros:', error);
    }
  }

  /**
   * Load all macros
   */
  loadAll(): Macro[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const data: StorageData = JSON.parse(stored);

      // Handle version migrations
      if (data.version !== STORAGE_VERSION) {
        return this.migrateMacros(data);
      }

      return data.macros.map(m => this.deserializeMacro(m));
    } catch (error) {
      loggers.macro.error('Failed to load macros:', error);
      return [];
    }
  }

  /**
   * Save a single macro
   */
  save(macro: Macro): void {
    const macros = this.loadAll();
    const index = macros.findIndex(m => m.id === macro.id);

    if (index >= 0) {
      macros[index] = macro;
    } else {
      macros.push(macro);
    }

    this.saveAll(macros);
  }

  /**
   * Delete a macro
   */
  delete(macroId: string): void {
    const macros = this.loadAll();
    const filtered = macros.filter(m => m.id !== macroId);
    this.saveAll(filtered);
  }

  /**
   * Get a single macro
   */
  get(macroId: string): Macro | null {
    const macros = this.loadAll();
    return macros.find(m => m.id === macroId) || null;
  }

  /**
   * Export macros to JSON
   */
  export(macroIds?: string[]): string {
    let macros = this.loadAll();

    if (macroIds && macroIds.length > 0) {
      macros = macros.filter(m => macroIds.includes(m.id));
    }

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
      macros,
    }, null, 2);
  }

  /**
   * Import macros from JSON
   */
  import(json: string, merge: boolean = true): number {
    try {
      const data = JSON.parse(json);

      if (!data.macros || !Array.isArray(data.macros)) {
        throw new Error('Invalid import format');
      }

      const importedMacros = data.macros.map((m: Macro) => ({
        ...this.deserializeMacro(m),
        id: crypto.randomUUID(), // New ID to avoid conflicts
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (merge) {
        const existing = this.loadAll();
        this.saveAll([...existing, ...importedMacros]);
      } else {
        this.saveAll(importedMacros);
      }

      return importedMacros.length;
    } catch (error) {
      loggers.macro.error('Failed to import macros:', error);
      return 0;
    }
  }

  /**
   * Clear all macros
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get storage usage
   */
  getStorageUsage(): { used: number; total: number; macroCount: number } {
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const macros = this.loadAll();

    return {
      used: stored.length * 2, // UTF-16 = 2 bytes per char
      total: 5 * 1024 * 1024, // ~5MB typical localStorage limit
      macroCount: macros.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════

  private serializeMacro(macro: Macro): Macro {
    return {
      ...macro,
      createdAt: macro.createdAt instanceof Date
        ? macro.createdAt
        : new Date(macro.createdAt),
      updatedAt: macro.updatedAt instanceof Date
        ? macro.updatedAt
        : new Date(macro.updatedAt),
      lastRunAt: macro.lastRunAt
        ? (macro.lastRunAt instanceof Date ? macro.lastRunAt : new Date(macro.lastRunAt))
        : undefined,
    };
  }

  private deserializeMacro(data: Macro): Macro {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastRunAt: data.lastRunAt ? new Date(data.lastRunAt) : undefined,
    };
  }

  private migrateMacros(data: StorageData): Macro[] {
    // Handle migrations from older versions
    // Add migration logic as versions change
    // Add migration logic as versions change
    return data.macros.map(m => this.deserializeMacro(m));
  }
}
