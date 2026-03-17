import { Shortcut, ALL_SHORTCUTS } from './shortcuts';
import { loggers } from '@/utils/logger';

export type ShortcutHandler = (shortcut: Shortcut, event: KeyboardEvent) => void;

interface ShortcutBinding {
  shortcut: Shortcut;
  handler: ShortcutHandler;
}

export class ShortcutManager {
  private bindings: Map<string, ShortcutBinding[]> = new Map();
  private enabled: boolean = true;
  private customMappings: Map<string, string> = new Map();

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.loadCustomMappings();
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  on(action: string, handler: ShortcutHandler): () => void {
    const shortcuts = ALL_SHORTCUTS.filter((s) => s.action === action);

    for (const shortcut of shortcuts) {
      const keys = this.getEffectiveKeys(shortcut);
      const existing = this.bindings.get(keys) || [];
      existing.push({ shortcut, handler });
      this.bindings.set(keys, existing);
    }

    return () => {
      for (const shortcut of shortcuts) {
        const keys = this.getEffectiveKeys(shortcut);
        const existing = this.bindings.get(keys) || [];
        const filtered = existing.filter((b) => b.handler !== handler);
        if (filtered.length > 0) {
          this.bindings.set(keys, filtered);
        } else {
          this.bindings.delete(keys);
        }
      }
    };
  }

  customize(shortcutId: string, newKeys: string): boolean {
    const shortcut = ALL_SHORTCUTS.find((s) => s.id === shortcutId);
    if (!shortcut) return false;

    const conflict = this.findConflict(newKeys, shortcutId);
    if (conflict) {
      loggers.shortcuts.warn(`Shortcut conflict: ${newKeys} is already used by ${conflict.id}`);
      return false;
    }

    this.customMappings.set(shortcutId, newKeys);
    this.saveCustomMappings();
    this.rebuildBindings();

    return true;
  }

  resetShortcut(shortcutId: string) {
    this.customMappings.delete(shortcutId);
    this.saveCustomMappings();
    this.rebuildBindings();
  }

  resetAll() {
    this.customMappings.clear();
    this.saveCustomMappings();
    this.rebuildBindings();
  }

  private getEffectiveKeys(shortcut: Shortcut): string {
    return (this.customMappings.get(shortcut.id) || shortcut.keys).toLowerCase();
  }

  private findConflict(keys: string, excludeId: string): Shortcut | null {
    const normalizedKeys = keys.toLowerCase();

    for (const shortcut of ALL_SHORTCUTS) {
      if (shortcut.id === excludeId) continue;

      const effectiveKeys = this.getEffectiveKeys(shortcut);
      if (effectiveKeys === normalizedKeys) {
        return shortcut;
      }
    }

    return null;
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return;

    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    const keys = this.buildKeyString(event);
    const bindings = this.bindings.get(keys);

    if (!bindings || bindings.length === 0) return;

    for (const binding of bindings) {
      if (isInput && !binding.shortcut.global) continue;

      if (binding.shortcut.when && !this.checkCondition(binding.shortcut.when)) continue;

      if (binding.shortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }

      binding.handler(binding.shortcut, event);
    }
  }

  private buildKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    let key = event.key.toLowerCase();

    if (key === ' ') key = 'space';

    if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
      parts.push(key);
    }

    return parts.join('+');
  }

  private checkCondition(condition: string): boolean {
    switch (condition) {
      case 'editing':
        return document.activeElement?.classList.contains('cell-editor') || false;
      case 'selecting':
        return !document.activeElement?.classList.contains('cell-editor');
      default:
        return true;
    }
  }

  private rebuildBindings() {
    const handlers = new Map<string, ShortcutHandler[]>();

    for (const [, bindings] of this.bindings) {
      for (const binding of bindings) {
        const action = binding.shortcut.action;
        const existing = handlers.get(action) || [];
        existing.push(binding.handler);
        handlers.set(action, existing);
      }
    }

    this.bindings.clear();

    for (const [action, actionHandlers] of handlers) {
      for (const handler of actionHandlers) {
        this.on(action, handler);
      }
    }
  }

  private loadCustomMappings() {
    try {
      const stored = localStorage.getItem('excel-shortcuts');
      if (stored) {
        const mappings = JSON.parse(stored);
        this.customMappings = new Map(Object.entries(mappings));
      }
    } catch (e) {
      loggers.shortcuts.warn('Failed to load custom shortcuts:', e);
    }
  }

  private saveCustomMappings() {
    try {
      const mappings = Object.fromEntries(this.customMappings);
      localStorage.setItem('excel-shortcuts', JSON.stringify(mappings));
    } catch (e) {
      loggers.shortcuts.warn('Failed to save custom shortcuts:', e);
    }
  }

  getAllShortcuts(): Array<Shortcut & { currentKeys: string; isCustomized: boolean }> {
    return ALL_SHORTCUTS.map((s) => ({
      ...s,
      currentKeys: this.getEffectiveKeys(s),
      isCustomized: this.customMappings.has(s.id),
    }));
  }
}

export const shortcutManager = new ShortcutManager();
