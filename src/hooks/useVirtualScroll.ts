import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer, VirtualItem, Virtualizer } from '@tanstack/react-virtual';

export interface VirtualScrollConfig {
  totalRows: number;
  totalCols: number;
  rowHeight: number;
  colWidth: number | ((index: number) => number);
  overscan?: number;
  estimateSize?: boolean;
}

export interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVirtualizer = Virtualizer<any, any>;

export interface VirtualScrollResult {
  // Container ref
  containerRef: React.RefObject<HTMLDivElement>;

  // Row virtualizer
  rowVirtualizer: AnyVirtualizer;

  // Column virtualizer
  colVirtualizer: AnyVirtualizer;

  // Visible items
  virtualRows: VirtualItem[];
  virtualCols: VirtualItem[];

  // Scroll position
  scrollTop: number;
  scrollLeft: number;

  // Visible range (for data fetching)
  visibleRange: VisibleRange;

  // Total size
  totalWidth: number;
  totalHeight: number;

  // Scroll to cell
  scrollToCell: (row: number, col: number) => void;

  // Check if cell is visible
  isCellVisible: (row: number, col: number) => boolean;

  // Performance metrics
  metrics: VirtualScrollMetrics;
}

export interface VirtualScrollMetrics {
  visibleCells: number;
  renderTime: number;
  fps: number;
  memoryUsage: number;
}

// Column width cache for variable-width columns
const columnWidthCache = new Map<string, number>();

export function useVirtualScroll(config: VirtualScrollConfig): VirtualScrollResult {
  const {
    totalRows,
    totalCols,
    rowHeight,
    colWidth,
    overscan = 5,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [metrics, setMetrics] = useState<VirtualScrollMetrics>({
    visibleCells: 0,
    renderTime: 0,
    fps: 60,
    memoryUsage: 0,
  });
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);

  // Get column width (supports both fixed and variable widths)
  const getColumnWidth = useCallback(
    (index: number): number => {
      if (typeof colWidth === 'number') {
        return colWidth;
      }

      const cacheKey = `col-${index}`;
      if (columnWidthCache.has(cacheKey)) {
        return columnWidthCache.get(cacheKey)!;
      }

      const width = colWidth(index);
      columnWidthCache.set(cacheKey, width);
      return width;
    },
    [colWidth]
  );

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    getItemKey: (index) => `row-${index}`,
  });

  // Column virtualizer (horizontal)
  const colVirtualizer = useVirtualizer({
    count: totalCols,
    getScrollElement: () => containerRef.current,
    estimateSize: getColumnWidth,
    horizontal: true,
    overscan,
    getItemKey: (index) => `col-${index}`,
  });

  // Virtual items
  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();

  // Calculate visible range
  const visibleRange = useMemo<VisibleRange>(() => {
    if (virtualRows.length === 0 || virtualCols.length === 0) {
      return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
    }

    return {
      startRow: virtualRows[0].index,
      endRow: virtualRows[virtualRows.length - 1].index,
      startCol: virtualCols[0].index,
      endCol: virtualCols[virtualCols.length - 1].index,
    };
  }, [virtualRows, virtualCols]);

  // Total size
  const totalWidth = colVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize();

  // Track scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setScrollLeft(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to cell
  const scrollToCell = useCallback(
    (row: number, col: number) => {
      rowVirtualizer.scrollToIndex(row, { align: 'center', behavior: 'smooth' });
      colVirtualizer.scrollToIndex(col, { align: 'center', behavior: 'smooth' });
    },
    [rowVirtualizer, colVirtualizer]
  );

  // Check if cell is visible
  const isCellVisible = useCallback(
    (row: number, col: number): boolean => {
      return (
        row >= visibleRange.startRow &&
        row <= visibleRange.endRow &&
        col >= visibleRange.startCol &&
        col <= visibleRange.endCol
      );
    },
    [visibleRange]
  );

  // Update performance metrics
  useEffect(() => {
    const visibleCells = virtualRows.length * virtualCols.length;

    // Calculate FPS
    frameCount.current++;
    const now = performance.now();
    const elapsed = now - lastFrameTime.current;

    if (elapsed >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      frameCount.current = 0;
      lastFrameTime.current = now;

      // Estimate memory usage
      const memoryUsage = visibleCells * 200; // ~200 bytes per cell estimate

      setMetrics({
        visibleCells,
        renderTime: elapsed / frameCount.current,
        fps,
        memoryUsage,
      });
    }
  }, [virtualRows.length, virtualCols.length]);

  return {
    containerRef,
    rowVirtualizer,
    colVirtualizer,
    virtualRows,
    virtualCols,
    scrollTop,
    scrollLeft,
    visibleRange,
    totalWidth,
    totalHeight,
    scrollToCell,
    isCellVisible,
    metrics,
  };
}

// Hook for infinite scrolling with data loading
export interface InfiniteScrollConfig extends VirtualScrollConfig {
  loadMore: (range: VisibleRange) => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

export function useInfiniteVirtualScroll(config: InfiniteScrollConfig) {
  const { loadMore, hasMore, isLoading, ...virtualConfig } = config;
  const virtualScroll = useVirtualScroll(virtualConfig);
  const prevRange = useRef<VisibleRange | null>(null);

  // Load more data when visible range changes
  useEffect(() => {
    const { visibleRange } = virtualScroll;

    // Check if range has changed significantly
    if (
      prevRange.current &&
      Math.abs(prevRange.current.startRow - visibleRange.startRow) < 10 &&
      Math.abs(prevRange.current.startCol - visibleRange.startCol) < 10
    ) {
      return;
    }

    prevRange.current = visibleRange;

    if (hasMore && !isLoading) {
      loadMore(visibleRange);
    }
  }, [virtualScroll, loadMore, hasMore, isLoading]);

  return {
    ...virtualScroll,
    hasMore,
    isLoading,
  };
}

// Utility to calculate optimal chunk size based on viewport
export function calculateChunkSize(
  viewportWidth: number,
  viewportHeight: number,
  cellWidth: number,
  cellHeight: number
): { rows: number; cols: number } {
  const visibleRows = Math.ceil(viewportHeight / cellHeight);
  const visibleCols = Math.ceil(viewportWidth / cellWidth);

  // Add buffer (2x visible area)
  return {
    rows: visibleRows * 2,
    cols: visibleCols * 2,
  };
}

// Clear column width cache (call when column widths change)
export function clearColumnWidthCache(): void {
  columnWidthCache.clear();
}
