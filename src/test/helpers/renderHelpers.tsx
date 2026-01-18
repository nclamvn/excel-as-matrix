// Component render helpers for testing
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// Test Wrapper Providers
// ═══════════════════════════════════════════════════════════════════════════

interface WrapperProps {
  children: ReactNode;
}

// Default wrapper that provides common context
function DefaultWrapper({ children }: WrapperProps): ReactElement {
  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Custom Render Functions
// ═══════════════════════════════════════════════════════════════════════════

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<WrapperProps>;
}

interface CustomRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

// Custom render with user event setup
export function renderWithUser(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const { wrapper: Wrapper = DefaultWrapper, ...renderOptions } = options;

  const user = userEvent.setup();

  const result = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...result,
    user,
  };
}

// Render without wrapper
export function renderPlain(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, options);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Simulation Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Simulate keyboard event
export function createKeyboardEvent(
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    code: options.code || key,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    ...options,
  });
}

// Simulate mouse event
export function createMouseEvent(
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'dblclick',
  options: Partial<MouseEventInit> = {}
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: options.clientX || 0,
    clientY: options.clientY || 0,
    button: options.button || 0,
    ctrlKey: options.ctrlKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
    metaKey: options.metaKey || false,
    ...options,
  });
}

// Simulate wheel event
export function createWheelEvent(deltaY: number, options: Partial<WheelEventInit> = {}): WheelEvent {
  return new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY,
    deltaMode: 0,
    ctrlKey: options.ctrlKey || false,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Canvas Testing Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Get mock canvas context
export function getMockCanvasContext() {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    clip: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    // Drawing state
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '11px Arial',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
  };
}

// Create mock canvas element
export function createMockCanvas(width: number = 800, height: number = 600) {
  const context = getMockCanvasContext();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext = vi.fn().mockReturnValue(context);
  return { canvas, context };
}

// ═══════════════════════════════════════════════════════════════════════════
// Grid Testing Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Calculate cell position in virtual grid
export function getCellPosition(
  row: number,
  col: number,
  options: {
    rowHeight?: number;
    colWidth?: number;
    headerHeight?: number;
    headerWidth?: number;
  } = {}
): { x: number; y: number; width: number; height: number } {
  const {
    rowHeight = 24,
    colWidth = 100,
    headerHeight = 28,
    headerWidth = 50,
  } = options;

  return {
    x: headerWidth + col * colWidth,
    y: headerHeight + row * rowHeight,
    width: colWidth,
    height: rowHeight,
  };
}

// Simulate click on cell
export function simulateCellClick(
  element: HTMLElement,
  row: number,
  col: number,
  options: {
    rowHeight?: number;
    colWidth?: number;
    headerHeight?: number;
    headerWidth?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
  } = {}
): void {
  const pos = getCellPosition(row, col, options);
  const event = createMouseEvent('click', {
    clientX: pos.x + pos.width / 2,
    clientY: pos.y + pos.height / 2,
    shiftKey: options.shiftKey,
    ctrlKey: options.ctrlKey,
  });

  element.dispatchEvent(event);
}

// Simulate double click on cell
export function simulateCellDoubleClick(
  element: HTMLElement,
  row: number,
  col: number,
  options: {
    rowHeight?: number;
    colWidth?: number;
    headerHeight?: number;
    headerWidth?: number;
  } = {}
): void {
  const pos = getCellPosition(row, col, options);
  const event = createMouseEvent('dblclick', {
    clientX: pos.x + pos.width / 2,
    clientY: pos.y + pos.height / 2,
  });

  element.dispatchEvent(event);
}

// ═══════════════════════════════════════════════════════════════════════════
// Async Testing Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Wait for condition to be true
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

// Wait for element to be visible
export async function waitForElement(
  container: HTMLElement,
  selector: string,
  options: { timeout?: number } = {}
): Promise<HTMLElement> {
  const { timeout = 5000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = container.querySelector(selector);
    if (element) return element as HTMLElement;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Mock Component Factories
// ═══════════════════════════════════════════════════════════════════════════

// Create mock ref
export function createMockRef<T>(value: T | null = null) {
  return { current: value };
}

// Create mock event handlers
export function createMockEventHandlers() {
  return {
    onClick: vi.fn(),
    onDoubleClick: vi.fn(),
    onMouseDown: vi.fn(),
    onMouseUp: vi.fn(),
    onMouseMove: vi.fn(),
    onKeyDown: vi.fn(),
    onKeyUp: vi.fn(),
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onScroll: vi.fn(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Snapshot Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Remove dynamic attributes for snapshot testing
export function normalizeForSnapshot(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove dynamic IDs
  clone.querySelectorAll('[id]').forEach((el) => {
    if (el.id.match(/\d+/)) {
      el.removeAttribute('id');
    }
  });

  // Remove timestamp-based classes
  clone.querySelectorAll('[class]').forEach((el) => {
    const className = el.className;
    if (typeof className === 'string' && className.match(/\d{10,}/)) {
      el.className = className.replace(/\d{10,}/g, 'TIMESTAMP');
    }
  });

  return clone.outerHTML;
}

// ═══════════════════════════════════════════════════════════════════════════
// Accessibility Helpers
// ═══════════════════════════════════════════════════════════════════════════

// Check if element is accessible
export function checkAccessibility(element: HTMLElement): {
  hasRole: boolean;
  hasLabel: boolean;
  isKeyboardAccessible: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const hasRole = !!element.getAttribute('role') || ['button', 'input', 'a'].includes(element.tagName.toLowerCase());

  const hasLabel =
    !!element.getAttribute('aria-label') ||
    !!element.getAttribute('aria-labelledby') ||
    !!element.querySelector('label');

  const isKeyboardAccessible =
    element.tabIndex >= 0 ||
    ['button', 'input', 'a', 'select', 'textarea'].includes(element.tagName.toLowerCase());

  if (!hasRole) {
    issues.push('Element lacks role attribute');
  }
  if (!hasLabel) {
    issues.push('Element lacks accessible label');
  }
  if (!isKeyboardAccessible) {
    issues.push('Element is not keyboard accessible');
  }

  return { hasRole, hasLabel, isKeyboardAccessible, issues };
}

export default {
  renderWithUser,
  renderPlain,
  createKeyboardEvent,
  createMouseEvent,
  createWheelEvent,
  getMockCanvasContext,
  createMockCanvas,
  getCellPosition,
  simulateCellClick,
  simulateCellDoubleClick,
  waitFor,
  waitForElement,
  createMockRef,
  createMockEventHandlers,
  normalizeForSnapshot,
  checkAccessibility,
};
