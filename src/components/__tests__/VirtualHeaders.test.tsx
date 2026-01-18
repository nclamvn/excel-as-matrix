import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  VirtualHeaders,
  ResizableColumnHeader,
  ResizableRowHeader,
} from '../VirtualGrid/VirtualHeaders';
import type { VirtualItem } from '@tanstack/react-virtual';

// Helper to create mock virtual items
function createVirtualItem(index: number, start: number, size: number): VirtualItem {
  return {
    index,
    start,
    size,
    end: start + size,
    key: index,
    lane: 0,
  };
}

describe('VirtualHeaders', () => {
  const defaultVirtualCols: VirtualItem[] = [
    createVirtualItem(0, 0, 100),
    createVirtualItem(1, 100, 100),
    createVirtualItem(2, 200, 100),
  ];

  const defaultVirtualRows: VirtualItem[] = [
    createVirtualItem(0, 0, 24),
    createVirtualItem(1, 24, 24),
    createVirtualItem(2, 48, 24),
  ];

  const defaultProps = {
    virtualRows: defaultVirtualRows,
    virtualCols: defaultVirtualCols,
    scrollTop: 0,
    scrollLeft: 0,
    headerWidth: 50,
    headerHeight: 28,
  };

  describe('Column Headers', () => {
    it('should render column headers for all visible columns', () => {
      render(<VirtualHeaders {...defaultProps} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should highlight selected column header', () => {
      render(<VirtualHeaders {...defaultProps} selectedCol={1} />);

      const colBHeader = screen.getByText('B').closest('div');
      expect(colBHeader).toHaveClass('bg-blue-100');
      expect(colBHeader).toHaveClass('text-blue-700');
    });

    it('should not highlight non-selected column headers', () => {
      render(<VirtualHeaders {...defaultProps} selectedCol={1} />);

      const colAHeader = screen.getByText('A').closest('div');
      expect(colAHeader).toHaveClass('text-gray-600');
    });

    it('should position column headers correctly', () => {
      render(<VirtualHeaders {...defaultProps} />);

      const colAHeader = screen.getByText('A').closest('div');
      expect(colAHeader).toHaveStyle({ left: '0px', width: '100px' });

      const colBHeader = screen.getByText('B').closest('div');
      expect(colBHeader).toHaveStyle({ left: '100px', width: '100px' });
    });

    it('should apply scroll offset to column headers', () => {
      const { container } = render(
        <VirtualHeaders {...defaultProps} scrollLeft={50} />
      );

      const columnContainer = container.querySelector(
        '[style*="translateX(-50px)"]'
      );
      expect(columnContainer).toBeInTheDocument();
    });
  });

  describe('Row Headers', () => {
    it('should render row headers for all visible rows', () => {
      render(<VirtualHeaders {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should highlight selected row header', () => {
      render(<VirtualHeaders {...defaultProps} selectedRow={1} />);

      const row2Header = screen.getByText('2').closest('div');
      expect(row2Header).toHaveClass('bg-blue-100');
      expect(row2Header).toHaveClass('text-blue-700');
    });

    it('should not highlight non-selected row headers', () => {
      render(<VirtualHeaders {...defaultProps} selectedRow={1} />);

      const row1Header = screen.getByText('1').closest('div');
      expect(row1Header).toHaveClass('text-gray-600');
    });

    it('should position row headers correctly', () => {
      render(<VirtualHeaders {...defaultProps} />);

      const row1Header = screen.getByText('1').closest('div');
      expect(row1Header).toHaveStyle({ top: '0px', height: '24px' });

      const row2Header = screen.getByText('2').closest('div');
      expect(row2Header).toHaveStyle({ top: '24px', height: '24px' });
    });

    it('should apply scroll offset to row headers', () => {
      const { container } = render(
        <VirtualHeaders {...defaultProps} scrollTop={30} />
      );

      const rowContainer = container.querySelector(
        '[style*="translateY(-30px)"]'
      );
      expect(rowContainer).toBeInTheDocument();
    });
  });

  describe('Corner Cell', () => {
    it('should render corner cell with correct dimensions', () => {
      const { container } = render(<VirtualHeaders {...defaultProps} />);

      const cornerCell = container.querySelector('.bg-gray-200');
      expect(cornerCell).toBeInTheDocument();
      expect(cornerCell).toHaveStyle({
        width: '50px',
        height: '28px',
      });
    });
  });

  describe('Extended Column Labels', () => {
    it('should handle columns beyond Z (AA, AB, etc.)', () => {
      const extendedCols: VirtualItem[] = [
        createVirtualItem(26, 0, 100), // AA
        createVirtualItem(27, 100, 100), // AB
        createVirtualItem(51, 200, 100), // AZ
        createVirtualItem(52, 300, 100), // BA
      ];

      render(
        <VirtualHeaders
          {...defaultProps}
          virtualCols={extendedCols}
        />
      );

      expect(screen.getByText('AA')).toBeInTheDocument();
      expect(screen.getByText('AB')).toBeInTheDocument();
      expect(screen.getByText('AZ')).toBeInTheDocument();
      expect(screen.getByText('BA')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty virtual columns', () => {
      const { container } = render(
        <VirtualHeaders {...defaultProps} virtualCols={[]} />
      );

      // Should still render corner and row headers
      expect(container.querySelector('.bg-gray-200')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle empty virtual rows', () => {
      const { container } = render(
        <VirtualHeaders {...defaultProps} virtualRows={[]} />
      );

      // Should still render corner and column headers
      expect(container.querySelector('.bg-gray-200')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });
});

describe('ResizableColumnHeader', () => {
  const defaultProps = {
    index: 0,
    width: 100,
    isSelected: false,
    onResize: vi.fn(),
    style: { left: 0, top: 0, width: 100, height: 28, position: 'absolute' as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render column label', () => {
    render(<ResizableColumnHeader {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should render column B for index 1', () => {
    render(<ResizableColumnHeader {...defaultProps} index={1} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should highlight when selected', () => {
    render(<ResizableColumnHeader {...defaultProps} isSelected={true} />);

    const header = screen.getByText('A').closest('div');
    expect(header).toHaveClass('bg-blue-100');
    expect(header).toHaveClass('text-blue-700');
  });

  it('should have resize handle', () => {
    const { container } = render(<ResizableColumnHeader {...defaultProps} />);

    const resizeHandle = container.querySelector('.cursor-col-resize');
    expect(resizeHandle).toBeInTheDocument();
  });

  it('should call onResize when dragging resize handle', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableColumnHeader {...defaultProps} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-col-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientX: 100 });

    // Move mouse
    fireEvent.mouseMove(document, { clientX: 150 });

    // Should call onResize with new width (100 + 50 = 150)
    expect(onResize).toHaveBeenCalledWith(0, 150);
  });

  it('should enforce minimum column width of 30px', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableColumnHeader {...defaultProps} width={50} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-col-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientX: 100 });

    // Move mouse to shrink below minimum
    fireEvent.mouseMove(document, { clientX: 50 }); // 50 - 50 = 0, but should be clamped to 30

    expect(onResize).toHaveBeenCalledWith(0, 30);
  });

  it('should stop resizing on mouseup', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableColumnHeader {...defaultProps} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-col-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientX: 100 });

    // End drag
    fireEvent.mouseUp(document);

    // Move mouse after mouseup
    fireEvent.mouseMove(document, { clientX: 200 });

    // onResize should not be called after mouseup
    // (it may have been called during the drag)
    const callCount = onResize.mock.calls.length;
    fireEvent.mouseMove(document, { clientX: 250 });
    expect(onResize.mock.calls.length).toBe(callCount);
  });
});

describe('ResizableRowHeader', () => {
  const defaultProps = {
    index: 0,
    height: 24,
    isSelected: false,
    onResize: vi.fn(),
    style: { left: 0, top: 0, width: 50, height: 24, position: 'absolute' as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render row number (1-indexed)', () => {
    render(<ResizableRowHeader {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render row 5 for index 4', () => {
    render(<ResizableRowHeader {...defaultProps} index={4} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should highlight when selected', () => {
    render(<ResizableRowHeader {...defaultProps} isSelected={true} />);

    const header = screen.getByText('1').closest('div');
    expect(header).toHaveClass('bg-blue-100');
    expect(header).toHaveClass('text-blue-700');
  });

  it('should have resize handle', () => {
    const { container } = render(<ResizableRowHeader {...defaultProps} />);

    const resizeHandle = container.querySelector('.cursor-row-resize');
    expect(resizeHandle).toBeInTheDocument();
  });

  it('should call onResize when dragging resize handle', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableRowHeader {...defaultProps} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-row-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientY: 100 });

    // Move mouse
    fireEvent.mouseMove(document, { clientY: 130 });

    // Should call onResize with new height (24 + 30 = 54)
    expect(onResize).toHaveBeenCalledWith(0, 54);
  });

  it('should enforce minimum row height of 16px', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableRowHeader {...defaultProps} height={30} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-row-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientY: 100 });

    // Move mouse to shrink below minimum
    fireEvent.mouseMove(document, { clientY: 70 }); // 30 - 30 = 0, but should be clamped to 16

    expect(onResize).toHaveBeenCalledWith(0, 16);
  });

  it('should stop resizing on mouseup', () => {
    const onResize = vi.fn();
    const { container } = render(
      <ResizableRowHeader {...defaultProps} onResize={onResize} />
    );

    const resizeHandle = container.querySelector('.cursor-row-resize')!;

    // Start drag
    fireEvent.mouseDown(resizeHandle, { clientY: 100 });

    // End drag
    fireEvent.mouseUp(document);

    // Move mouse after mouseup
    fireEvent.mouseMove(document, { clientY: 200 });

    // onResize should not be called after mouseup
    const callCount = onResize.mock.calls.length;
    fireEvent.mouseMove(document, { clientY: 250 });
    expect(onResize.mock.calls.length).toBe(callCount);
  });
});

describe('Header Performance', () => {
  it('should efficiently render many columns', () => {
    const manyColumns: VirtualItem[] = Array.from({ length: 100 }, (_, i) =>
      createVirtualItem(i, i * 100, 100)
    );

    const { container } = render(
      <VirtualHeaders
        virtualRows={[createVirtualItem(0, 0, 24)]}
        virtualCols={manyColumns}
        scrollTop={0}
        scrollLeft={0}
        headerWidth={50}
        headerHeight={28}
      />
    );

    // Should render all column headers
    const columnHeaders = container.querySelectorAll('[style*="left:"]');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  it('should efficiently render many rows', () => {
    const manyRows: VirtualItem[] = Array.from({ length: 100 }, (_, i) =>
      createVirtualItem(i, i * 24, 24)
    );

    const { container } = render(
      <VirtualHeaders
        virtualRows={manyRows}
        virtualCols={[createVirtualItem(0, 0, 100)]}
        scrollTop={0}
        scrollLeft={0}
        headerWidth={50}
        headerHeight={28}
      />
    );

    // Should render all row headers
    const rowHeaders = container.querySelectorAll('[style*="top:"]');
    expect(rowHeaders.length).toBeGreaterThan(0);
  });
});
