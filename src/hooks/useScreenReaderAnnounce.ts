// ═══════════════════════════════════════════════════════════════════════════
// SCREEN READER ANNOUNCEMENTS — WCAG 2.1 AA Compliance
// Live region for announcing spreadsheet actions to assistive technology
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react';

type Politeness = 'polite' | 'assertive';

interface AnnounceOptions {
  /** 'polite' waits for current speech, 'assertive' interrupts */
  politeness?: Politeness;
  /** Clear after this many ms (0 = never) */
  clearAfter?: number;
}

/**
 * Hook for announcing messages to screen readers via ARIA live regions.
 * Creates a visually hidden live region in the DOM.
 */
export function useScreenReaderAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live regions if they don't exist
    if (!document.getElementById('sr-announce-polite')) {
      const polite = document.createElement('div');
      polite.id = 'sr-announce-polite';
      polite.setAttribute('role', 'status');
      polite.setAttribute('aria-live', 'polite');
      polite.setAttribute('aria-atomic', 'true');
      Object.assign(polite.style, srOnlyStyle);
      document.body.appendChild(polite);
      politeRef.current = polite;
    } else {
      politeRef.current = document.getElementById('sr-announce-polite') as HTMLDivElement;
    }

    if (!document.getElementById('sr-announce-assertive')) {
      const assertive = document.createElement('div');
      assertive.id = 'sr-announce-assertive';
      assertive.setAttribute('role', 'alert');
      assertive.setAttribute('aria-live', 'assertive');
      assertive.setAttribute('aria-atomic', 'true');
      Object.assign(assertive.style, srOnlyStyle);
      document.body.appendChild(assertive);
      assertiveRef.current = assertive;
    } else {
      assertiveRef.current = document.getElementById('sr-announce-assertive') as HTMLDivElement;
    }

    return () => {
      // Don't remove on unmount — other components may still need them
    };
  }, []);

  const announce = useCallback((message: string, options: AnnounceOptions = {}) => {
    const { politeness = 'polite', clearAfter = 5000 } = options;
    const el = politeness === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;

    // Force re-announcement by clearing first
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = message;
    });

    if (clearAfter > 0) {
      setTimeout(() => {
        if (el.textContent === message) {
          el.textContent = '';
        }
      }, clearAfter);
    }
  }, []);

  const announceCell = useCallback((col: number, row: number, value: string, formula?: string | null) => {
    const colLetter = String.fromCharCode(65 + col);
    const cellRef = `${colLetter}${row + 1}`;
    const content = formula ? `${cellRef}, formula ${formula}, value ${value}` : `${cellRef}, ${value || 'empty'}`;
    announce(content);
  }, [announce]);

  const announceAction = useCallback((action: string) => {
    announce(action, { politeness: 'assertive', clearAfter: 3000 });
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, { politeness: 'assertive', clearAfter: 5000 });
  }, [announce]);

  return { announce, announceCell, announceAction, announceError };
}

// Visually hidden but accessible to screen readers
const srOnlyStyle: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

/**
 * Utility: Generate ARIA label for a cell
 */
export function getCellAriaLabel(col: number, row: number, value: string, formula?: string | null): string {
  const colLetter = String.fromCharCode(65 + col);
  const cellRef = `${colLetter}${row + 1}`;
  if (formula) {
    return `Cell ${cellRef}, formula ${formula}, result ${value}`;
  }
  return `Cell ${cellRef}, ${value || 'empty'}`;
}

/**
 * Utility: Generate ARIA label for a range
 */
export function getRangeAriaLabel(
  startCol: number, startRow: number,
  endCol: number, endRow: number
): string {
  const sc = String.fromCharCode(65 + startCol);
  const ec = String.fromCharCode(65 + endCol);
  return `Range ${sc}${startRow + 1} to ${ec}${endRow + 1}`;
}
