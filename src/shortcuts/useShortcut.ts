import { useEffect, useCallback } from 'react';
import { shortcutManager, ShortcutHandler } from './ShortcutManager';
import { Shortcut } from './shortcuts';

export function useShortcut(action: string, handler: ShortcutHandler, deps: React.DependencyList = []) {
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    const unsubscribe = shortcutManager.on(action, stableHandler);
    return unsubscribe;
  }, [action, stableHandler]);
}

export function useShortcuts(
  actions: Record<string, ShortcutHandler>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    for (const [action, handler] of Object.entries(actions)) {
      unsubscribes.push(shortcutManager.on(action, handler));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, deps);
}

export function useShortcutInfo(action: string): Shortcut | undefined {
  return shortcutManager.getAllShortcuts().find((s) => s.action === action);
}
