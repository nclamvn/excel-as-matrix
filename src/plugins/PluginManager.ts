// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN MANAGER — Framework for third-party extensions
// Handles: manifest parsing, lifecycle, sandboxed API, registry
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  icon?: string;
  category: PluginCategory;
  permissions: PluginPermission[];
  entrypoint: string; // JS module path or inline code
  toolbar?: PluginToolbarItem[];
  functions?: PluginFunction[];
  settings?: PluginSetting[];
}

export type PluginCategory =
  | 'data' // Data connectors, import/export
  | 'analysis' // Statistical, ML, visualization
  | 'formatting' // Themes, templates, styles
  | 'productivity' // Automation, shortcuts
  | 'integration' // External services (Slack, email)
  | 'ai' // AI-powered features
  | 'other';

export type PluginPermission =
  | 'cells:read' // Read cell values
  | 'cells:write' // Write cell values
  | 'sheets:read' // Read sheet metadata
  | 'sheets:write' // Create/delete sheets
  | 'ui:toolbar' // Add toolbar buttons
  | 'ui:sidebar' // Add sidebar panels
  | 'ui:dialog' // Show dialogs
  | 'network:fetch' // Make HTTP requests
  | 'storage:local'; // Local storage access

export interface PluginToolbarItem {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  action: string; // Function name to call
}

export interface PluginFunction {
  name: string;
  description: string;
  parameters: Array<{ name: string; type: string; description: string }>;
  returns: string;
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default: unknown;
  options?: Array<{ value: unknown; label: string }>;
}

export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface InstalledPlugin {
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: number;
  enabledAt: number | null;
  settings: Record<string, unknown>;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin API (exposed to plugins in sandboxed context)
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginAPI {
  // Cell operations
  getCellValue: (sheet: string, row: number, col: number) => unknown;
  setCellValue: (sheet: string, row: number, col: number, value: unknown) => void;
  getRange: (sheet: string, range: string) => unknown[][];
  setRange: (sheet: string, range: string, values: unknown[][]) => void;

  // Sheet operations
  getSheetNames: () => string[];
  getActiveSheet: () => string;
  createSheet: (name: string) => string;

  // UI
  showToast: (message: string, type?: 'info' | 'error' | 'success') => void;
  showDialog: (title: string, content: string) => Promise<boolean>;

  // Storage
  getStorage: (key: string) => unknown;
  setStorage: (key: string, value: unknown) => void;

  // Network (restricted)
  fetch: (url: string, options?: RequestInit) => Promise<Response>;

  // Plugin info
  getPluginId: () => string;
  getSettings: () => Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PluginManager Class
// ─────────────────────────────────────────────────────────────────────────────

export class PluginManager {
  private plugins = new Map<string, InstalledPlugin>();
  private handlers = new Map<string, (api: PluginAPI) => void>();
  private readonly STORAGE_KEY = 'excelai-plugins';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Install a plugin from manifest
   */
  install(manifest: PluginManifest): InstalledPlugin {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    const plugin: InstalledPlugin = {
      manifest,
      status: 'installed',
      installedAt: Date.now(),
      enabledAt: null,
      settings: this.getDefaultSettings(manifest),
    };

    this.plugins.set(manifest.id, plugin);
    this.saveToStorage();

    loggers.admin.info(`Plugin installed: ${manifest.name} v${manifest.version}`);
    return plugin;
  }

  /**
   * Uninstall a plugin
   */
  uninstall(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    // Disable first if enabled
    if (plugin.status === 'enabled') {
      this.disable(pluginId);
    }

    this.plugins.delete(pluginId);
    this.handlers.delete(pluginId);
    this.saveToStorage();

    loggers.admin.info(`Plugin uninstalled: ${plugin.manifest.name}`);
    return true;
  }

  /**
   * Enable a plugin
   */
  enable(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.status = 'enabled';
    plugin.enabledAt = Date.now();
    plugin.error = undefined;
    this.saveToStorage();

    loggers.admin.info(`Plugin enabled: ${plugin.manifest.name}`);
    return true;
  }

  /**
   * Disable a plugin
   */
  disable(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.status = 'disabled';
    this.handlers.delete(pluginId);
    this.saveToStorage();

    loggers.admin.info(`Plugin disabled: ${plugin.manifest.name}`);
    return true;
  }

  /**
   * Get all installed plugins
   */
  getAll(): InstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins only
   */
  getEnabled(): InstalledPlugin[] {
    return this.getAll().filter((p) => p.status === 'enabled');
  }

  /**
   * Get a specific plugin
   */
  get(pluginId: string): InstalledPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Update plugin settings
   */
  updateSettings(pluginId: string, settings: Record<string, unknown>): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.settings = { ...plugin.settings, ...settings };
    this.saveToStorage();
    return true;
  }

  /**
   * Get all toolbar items from enabled plugins
   */
  getToolbarItems(): Array<PluginToolbarItem & { pluginId: string }> {
    const items: Array<PluginToolbarItem & { pluginId: string }> = [];

    for (const plugin of this.getEnabled()) {
      if (plugin.manifest.toolbar) {
        for (const item of plugin.manifest.toolbar) {
          items.push({ ...item, pluginId: plugin.manifest.id });
        }
      }
    }

    return items;
  }

  /**
   * Get all custom functions from enabled plugins
   */
  getCustomFunctions(): Array<PluginFunction & { pluginId: string }> {
    const functions: Array<PluginFunction & { pluginId: string }> = [];

    for (const plugin of this.getEnabled()) {
      if (plugin.manifest.functions) {
        for (const fn of plugin.manifest.functions) {
          functions.push({ ...fn, pluginId: plugin.manifest.id });
        }
      }
    }

    return functions;
  }

  /**
   * Check if a plugin has a specific permission
   */
  hasPermission(pluginId: string, permission: PluginPermission): boolean {
    const plugin = this.plugins.get(pluginId);
    return plugin?.manifest.permissions.includes(permission) ?? false;
  }

  /**
   * Get plugin count by status
   */
  getCounts(): Record<PluginStatus, number> {
    const counts: Record<PluginStatus, number> = {
      installed: 0,
      enabled: 0,
      disabled: 0,
      error: 0,
    };

    for (const plugin of this.plugins.values()) {
      counts[plugin.status]++;
    }

    return counts;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as InstalledPlugin[];
        for (const plugin of data) {
          this.plugins.set(plugin.manifest.id, plugin);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.plugins.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable
    }
  }

  private getDefaultSettings(manifest: PluginManifest): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    if (manifest.settings) {
      for (const setting of manifest.settings) {
        defaults[setting.key] = setting.default;
      }
    }
    return defaults;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const pluginManager = new PluginManager();
