// ═══════════════════════════════════════════════════════════════════════════
// TOUCH GESTURES HOOK - Mobile Touch Support for Canvas Grid
// Provides pinch-to-zoom, swipe-scroll, long-press, double-tap, sheet switching
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkbookStore } from '../stores/workbookStore';

// ── Types ──────────────────────────────────────────────────────────────────

interface TouchPosition {
  x: number;
  y: number;
}

interface GestureState {
  /** Current zoom level (synced with workbookStore or local fallback) */
  zoom: number;
  /** Current scroll position */
  scrollTop: number;
  scrollLeft: number;
  /** Whether a long-press is active */
  isLongPress: boolean;
  /** Position of long-press for context menu placement */
  longPressPosition: TouchPosition | null;
  /** Whether a double-tap was detected */
  isDoubleTap: boolean;
  /** Sheet switch direction: -1 = previous, 1 = next, 0 = none */
  sheetSwipeDirection: -1 | 0 | 1;
  /** Whether the user is currently performing a pinch gesture */
  isPinching: boolean;
  /** Whether the user is currently scrolling via touch */
  isScrolling: boolean;
}

interface UseTouchGesturesOptions {
  /** Minimum pinch distance change (px) to trigger zoom update */
  pinchThreshold?: number;
  /** Duration in ms for long-press detection */
  longPressDuration?: number;
  /** Maximum time between taps for double-tap (ms) */
  doubleTapInterval?: number;
  /** Minimum horizontal swipe distance for sheet switch (px) */
  sheetSwipeThreshold?: number;
  /** Minimum vertical swipe distance to count as scroll (px) */
  scrollThreshold?: number;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
  /** Callback when scroll position changes */
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  /** Callback for long-press context menu */
  onLongPress?: (position: TouchPosition) => void;
  /** Callback for double-tap (enter edit mode) */
  onDoubleTap?: (position: TouchPosition) => void;
  /** Callback for two-finger sheet switch */
  onSheetSwipe?: (direction: -1 | 1) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_PINCH_THRESHOLD = 10;
const DEFAULT_LONG_PRESS_DURATION = 500;
const DEFAULT_DOUBLE_TAP_INTERVAL = 300;
const DEFAULT_SHEET_SWIPE_THRESHOLD = 100;
const DEFAULT_SCROLL_THRESHOLD = 5;
const MIN_ZOOM = 25;
const MAX_ZOOM = 400;

// ── Utilities ──────────────────────────────────────────────────────────────

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTouchGestures(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseTouchGesturesOptions = {}
) {
  const {
    pinchThreshold = DEFAULT_PINCH_THRESHOLD,
    longPressDuration = DEFAULT_LONG_PRESS_DURATION,
    doubleTapInterval = DEFAULT_DOUBLE_TAP_INTERVAL,
    sheetSwipeThreshold = DEFAULT_SHEET_SWIPE_THRESHOLD,
    scrollThreshold = DEFAULT_SCROLL_THRESHOLD,
    onZoomChange,
    onScroll,
    onLongPress,
    onDoubleTap,
    onSheetSwipe,
  } = options;

  // Store zoom — use workbookStore if setZoom is available
  const storeZoom = useWorkbookStore((state) => state.zoom);
  const storeSetZoom = useWorkbookStore((state) => state.setZoom);

  // Determine if store zoom management is available
  const hasStoreZoom = typeof storeSetZoom === 'function';

  // Local fallback zoom (used only if store doesn't have setZoom)
  const [localZoom, setLocalZoom] = useState(storeZoom ?? 100);
  const currentZoom = hasStoreZoom ? storeZoom : localZoom;

  // Gesture state
  const [gestureState, setGestureState] = useState<GestureState>({
    zoom: currentZoom,
    scrollTop: 0,
    scrollLeft: 0,
    isLongPress: false,
    longPressPosition: null,
    isDoubleTap: false,
    sheetSwipeDirection: 0,
    isPinching: false,
    isScrolling: false,
  });

  // Refs for tracking touch state without re-renders
  const touchStartRef = useRef<TouchPosition | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);
  const initialZoomRef = useRef<number>(currentZoom);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPositionRef = useRef<TouchPosition | null>(null);
  const twoFingerStartRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const scrollPositionRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const isTouchActiveRef = useRef(false);
  const gestureTypeRef = useRef<'none' | 'scroll' | 'pinch' | 'longpress'>('none');

  // ── Zoom setter ─────────────────────────────────────────────────────────

  const setZoom = useCallback(
    (newZoom: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(newZoom)));
      if (hasStoreZoom) {
        storeSetZoom(clamped);
      } else {
        setLocalZoom(clamped);
      }
      setGestureState((prev) => ({ ...prev, zoom: clamped }));
      onZoomChange?.(clamped);
    },
    [hasStoreZoom, storeSetZoom, onZoomChange]
  );

  // Keep gesture state zoom in sync with store
  useEffect(() => {
    setGestureState((prev) => ({ ...prev, zoom: currentZoom }));
  }, [currentZoom]);

  // ── Clear long-press timer ──────────────────────────────────────────────

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ── Touch Start ─────────────────────────────────────────────────────────

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      isTouchActiveRef.current = true;
      gestureTypeRef.current = 'none';

      const touches = e.touches;

      if (touches.length === 1) {
        const touch = touches[0];
        const position: TouchPosition = { x: touch.clientX, y: touch.clientY };
        touchStartRef.current = position;

        // Check for double-tap
        const now = Date.now();
        const lastTap = lastTapTimeRef.current;
        const lastPos = lastTapPositionRef.current;

        if (
          lastPos &&
          now - lastTap < doubleTapInterval &&
          Math.abs(position.x - lastPos.x) < 30 &&
          Math.abs(position.y - lastPos.y) < 30
        ) {
          // Double-tap detected
          e.preventDefault();
          clearLongPress();
          setGestureState((prev) => ({ ...prev, isDoubleTap: true }));
          onDoubleTap?.(position);

          // Reset double-tap tracking
          lastTapTimeRef.current = 0;
          lastTapPositionRef.current = null;
          return;
        }

        // Start long-press timer
        clearLongPress();
        longPressTimerRef.current = setTimeout(() => {
          if (isTouchActiveRef.current && gestureTypeRef.current === 'none') {
            gestureTypeRef.current = 'longpress';
            setGestureState((prev) => ({
              ...prev,
              isLongPress: true,
              longPressPosition: position,
            }));
            onLongPress?.(position);
          }
        }, longPressDuration);
      } else if (touches.length === 2) {
        // Two-finger gesture start
        e.preventDefault();
        clearLongPress();

        const touch1 = touches[0];
        const touch2 = touches[1];
        const distance = getDistance(touch1, touch2);

        initialPinchDistanceRef.current = distance;
        initialZoomRef.current = currentZoom;
        twoFingerStartRef.current = {
          x1: touch1.clientX,
          y1: touch1.clientY,
          x2: touch2.clientX,
          y2: touch2.clientY,
        };

        gestureTypeRef.current = 'pinch';
        setGestureState((prev) => ({ ...prev, isPinching: true }));
      }
    },
    [currentZoom, doubleTapInterval, longPressDuration, clearLongPress, onDoubleTap, onLongPress]
  );

  // ── Touch Move ──────────────────────────────────────────────────────────

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 1 && gestureTypeRef.current !== 'pinch') {
        const touch = touches[0];
        const start = touchStartRef.current;
        if (!start) return;

        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved beyond threshold, cancel long-press and enter scroll mode
        if (distance > scrollThreshold) {
          clearLongPress();

          if (gestureTypeRef.current === 'none' || gestureTypeRef.current === 'scroll') {
            gestureTypeRef.current = 'scroll';

            const newTop = Math.max(0, scrollPositionRef.current.top - dy);
            const newLeft = Math.max(0, scrollPositionRef.current.left - dx);

            scrollPositionRef.current = { top: newTop, left: newLeft };
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };

            setGestureState((prev) => ({
              ...prev,
              scrollTop: newTop,
              scrollLeft: newLeft,
              isScrolling: true,
            }));
            onScroll?.(newTop, newLeft);
          }
        }
      } else if (touches.length === 2) {
        e.preventDefault();
        clearLongPress();

        const touch1 = touches[0];
        const touch2 = touches[1];

        // Pinch-to-zoom
        const distance = getDistance(touch1, touch2);
        const initialDistance = initialPinchDistanceRef.current;

        if (initialDistance > 0 && Math.abs(distance - initialDistance) > pinchThreshold) {
          const scale = distance / initialDistance;
          const newZoom = initialZoomRef.current * scale;
          setZoom(newZoom);
        }

        // Two-finger swipe detection for sheet switching
        // (tracked but only committed on touchEnd)
      }
    },
    [scrollThreshold, pinchThreshold, clearLongPress, setZoom, onScroll]
  );

  // ── Touch End ───────────────────────────────────────────────────────────

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      clearLongPress();

      const touches = e.changedTouches;

      // Check for two-finger horizontal swipe (sheet switching)
      if (twoFingerStartRef.current && touches.length >= 1) {
        const startData = twoFingerStartRef.current;
        // Use the last changed touch positions to calculate total swipe
        const endX1 = touches[0]?.clientX ?? startData.x1;
        const endX2 = touches.length > 1 ? touches[1].clientX : endX1;

        const startMidX = (startData.x1 + startData.x2) / 2;
        const endMidX = (endX1 + endX2) / 2;
        const swipeDelta = endMidX - startMidX;

        if (Math.abs(swipeDelta) > sheetSwipeThreshold) {
          const direction: -1 | 1 = swipeDelta < 0 ? 1 : -1;
          setGestureState((prev) => ({ ...prev, sheetSwipeDirection: direction }));
          onSheetSwipe?.(direction);

          // Reset after a frame
          requestAnimationFrame(() => {
            setGestureState((prev) => ({ ...prev, sheetSwipeDirection: 0 }));
          });
        }

        twoFingerStartRef.current = null;
      }

      // Record tap time for double-tap detection (only single finger taps)
      if (e.touches.length === 0 && gestureTypeRef.current === 'none') {
        lastTapTimeRef.current = Date.now();
        if (touchStartRef.current) {
          lastTapPositionRef.current = { ...touchStartRef.current };
        }
      }

      // Reset state when all fingers are lifted
      if (e.touches.length === 0) {
        isTouchActiveRef.current = false;
        gestureTypeRef.current = 'none';
        touchStartRef.current = null;
        initialPinchDistanceRef.current = 0;

        setGestureState((prev) => ({
          ...prev,
          isLongPress: false,
          isDoubleTap: false,
          isPinching: false,
          isScrolling: false,
        }));
      }
    },
    [clearLongPress, sheetSwipeThreshold, onSheetSwipe]
  );

  // ── Touch Cancel ────────────────────────────────────────────────────────

  const handleTouchCancel = useCallback(() => {
    clearLongPress();
    isTouchActiveRef.current = false;
    gestureTypeRef.current = 'none';
    touchStartRef.current = null;
    initialPinchDistanceRef.current = 0;
    twoFingerStartRef.current = null;

    setGestureState((prev) => ({
      ...prev,
      isLongPress: false,
      longPressPosition: null,
      isDoubleTap: false,
      isPinching: false,
      isScrolling: false,
      sheetSwipeDirection: 0,
    }));
  }, [clearLongPress]);

  // ── Attach event listeners ──────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false for touchmove/touchstart to allow preventDefault
    const touchStartOptions: AddEventListenerOptions = { passive: false };
    const touchMoveOptions: AddEventListenerOptions = { passive: false };

    container.addEventListener('touchstart', handleTouchStart, touchStartOptions);
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
      clearLongPress();
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, clearLongPress]);

  // ── Public API ──────────────────────────────────────────────────────────

  /** Programmatically update the scroll position (e.g., from external scroll events) */
  const setScrollPosition = useCallback((top: number, left: number) => {
    scrollPositionRef.current = { top, left };
    setGestureState((prev) => ({ ...prev, scrollTop: top, scrollLeft: left }));
  }, []);

  /** Reset all gesture state */
  const resetGestures = useCallback(() => {
    clearLongPress();
    isTouchActiveRef.current = false;
    gestureTypeRef.current = 'none';
    touchStartRef.current = null;
    initialPinchDistanceRef.current = 0;
    twoFingerStartRef.current = null;
    lastTapTimeRef.current = 0;
    lastTapPositionRef.current = null;

    setGestureState({
      zoom: currentZoom,
      scrollTop: scrollPositionRef.current.top,
      scrollLeft: scrollPositionRef.current.left,
      isLongPress: false,
      longPressPosition: null,
      isDoubleTap: false,
      sheetSwipeDirection: 0,
      isPinching: false,
      isScrolling: false,
    });
  }, [clearLongPress, currentZoom]);

  return {
    gestureState,
    setZoom,
    setScrollPosition,
    resetGestures,
  };
}

export type { TouchPosition, GestureState, UseTouchGesturesOptions };
