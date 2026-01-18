import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CellRenderer, CellSkeleton, EmptyCell } from '../VirtualGrid/CellRenderer';
import type { CellData } from '../VirtualGrid/CellRenderer';

describe('CellRenderer', () => {
  const defaultProps = {
    row: 0,
    col: 0,
    data: null as CellData | null,
    width: 100,
    height: 25,
    isSelected: false,
    isInRange: false,
    isEditing: false,
    onClick: vi.fn(),
    onDoubleClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders empty cell when no data', () => {
      render(<CellRenderer {...defaultProps} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toBeInTheDocument();
    });

    it('renders display value', () => {
      const data: CellData = {
        value: 'Hello',
        displayValue: 'Hello',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('renders numeric display value', () => {
      const data: CellData = {
        value: 100,
        displayValue: '100',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays error message', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        error: '#DIV/0!',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      expect(screen.getByText('#DIV/0!')).toBeInTheDocument();
    });

    it('displays loading indicator', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        isLoading: true,
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has gridcell role', () => {
      render(<CellRenderer {...defaultProps} />);

      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });

    it('sets aria-selected for selected cells', () => {
      render(<CellRenderer {...defaultProps} isSelected={true} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-rowindex', () => {
      render(<CellRenderer {...defaultProps} row={5} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('aria-rowindex', '6');
    });

    it('sets aria-colindex', () => {
      render(<CellRenderer {...defaultProps} col={3} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('aria-colindex', '4');
    });

    it('has tabIndex 0 when selected', () => {
      render(<CellRenderer {...defaultProps} isSelected={true} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('tabIndex', '0');
    });

    it('has tabIndex -1 when not selected', () => {
      render(<CellRenderer {...defaultProps} isSelected={false} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('data attributes', () => {
    it('sets data-row attribute', () => {
      render(<CellRenderer {...defaultProps} row={5} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('data-row', '5');
    });

    it('sets data-col attribute', () => {
      render(<CellRenderer {...defaultProps} col={3} />);

      expect(screen.getByRole('gridcell')).toHaveAttribute('data-col', '3');
    });
  });

  describe('interactions', () => {
    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<CellRenderer {...defaultProps} onClick={onClick} />);

      fireEvent.click(screen.getByRole('gridcell'));

      expect(onClick).toHaveBeenCalled();
    });

    it('calls onDoubleClick when double-clicked', () => {
      const onDoubleClick = vi.fn();
      render(<CellRenderer {...defaultProps} onDoubleClick={onDoubleClick} />);

      fireEvent.doubleClick(screen.getByRole('gridcell'));

      expect(onDoubleClick).toHaveBeenCalled();
    });
  });

  describe('formatting', () => {
    it('applies bold formatting', () => {
      const data: CellData = {
        value: 'Bold',
        displayValue: 'Bold',
        format: { bold: true },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ fontWeight: 'bold' });
    });

    it('applies italic formatting', () => {
      const data: CellData = {
        value: 'Italic',
        displayValue: 'Italic',
        format: { italic: true },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ fontStyle: 'italic' });
    });

    it('applies underline formatting', () => {
      const data: CellData = {
        value: 'Underline',
        displayValue: 'Underline',
        format: { underline: true },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ textDecoration: 'underline' });
    });

    it('applies background color', () => {
      const data: CellData = {
        value: 'Colored',
        displayValue: 'Colored',
        format: { backgroundColor: '#ff0000' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('applies text color', () => {
      const data: CellData = {
        value: 'Colored',
        displayValue: 'Colored',
        format: { textColor: '#0000ff' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ color: '#0000ff' });
    });

    it('applies font size', () => {
      const data: CellData = {
        value: 'Large',
        displayValue: 'Large',
        format: { fontSize: 16 },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ fontSize: '16px' });
    });

    it('applies font family', () => {
      const data: CellData = {
        value: 'Font',
        displayValue: 'Font',
        format: { fontFamily: 'Arial' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ fontFamily: 'Arial' });
    });

    it('applies left alignment', () => {
      const data: CellData = {
        value: 'Left',
        displayValue: 'Left',
        format: { align: 'left' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ justifyContent: 'flex-start' });
    });

    it('applies center alignment', () => {
      const data: CellData = {
        value: 'Center',
        displayValue: 'Center',
        format: { align: 'center' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ justifyContent: 'center' });
    });

    it('applies right alignment', () => {
      const data: CellData = {
        value: 'Right',
        displayValue: 'Right',
        format: { align: 'right' },
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ justifyContent: 'flex-end' });
    });

    it('auto-aligns numbers to right', () => {
      const data: CellData = {
        value: 100,
        displayValue: '100',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ justifyContent: 'flex-end' });
    });

    it('auto-aligns text to left', () => {
      const data: CellData = {
        value: 'Text',
        displayValue: 'Text',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ justifyContent: 'flex-start' });
    });
  });

  describe('selection styling', () => {
    it('applies selected style when selected', () => {
      render(<CellRenderer {...defaultProps} isSelected={true} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ outline: '2px solid #2563eb' });
    });

    it('does not apply selected style when editing', () => {
      render(<CellRenderer {...defaultProps} isSelected={true} isEditing={true} />);

      const cell = screen.getByRole('gridcell');
      // Outline should not be applied when editing
      expect(cell).not.toHaveStyle({ outline: '2px solid #2563eb' });
    });

    it('applies range style when in range', () => {
      render(<CellRenderer {...defaultProps} isInRange={true} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ backgroundColor: 'rgba(37, 99, 235, 0.1)' });
    });

    it('preserves background color when in range with format', () => {
      const data: CellData = {
        value: 'Test',
        displayValue: 'Test',
        format: { backgroundColor: '#ffff00' },
      };

      render(<CellRenderer {...defaultProps} data={data} isInRange={true} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ backgroundColor: '#ffff00' });
    });
  });

  describe('error styling', () => {
    it('applies error background', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        error: '#REF!',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ backgroundColor: '#fef2f2' });
    });

    it('applies error text color', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        error: '#VALUE!',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ color: '#dc2626' });
    });
  });

  describe('loading styling', () => {
    it('applies loading background', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        isLoading: true,
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ backgroundColor: '#f9fafb' });
    });
  });

  describe('tooltip', () => {
    it('shows formula in tooltip', () => {
      const data: CellData = {
        value: 100,
        displayValue: '100',
        formula: '=SUM(A1:A10)',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('title', expect.stringContaining('Formula: =SUM(A1:A10)'));
    });

    it('shows error in tooltip', () => {
      const data: CellData = {
        value: null,
        displayValue: '',
        error: '#DIV/0!',
      };

      render(<CellRenderer {...defaultProps} data={data} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveAttribute('title', expect.stringContaining('Error: #DIV/0!'));
    });
  });

  describe('dimensions', () => {
    it('applies width', () => {
      render(<CellRenderer {...defaultProps} width={150} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ width: '150px' });
    });

    it('applies height', () => {
      render(<CellRenderer {...defaultProps} height={30} />);

      const cell = screen.getByRole('gridcell');
      expect(cell).toHaveStyle({ height: '30px' });
    });
  });
});

describe('CellSkeleton', () => {
  it('renders skeleton cell', () => {
    render(<CellSkeleton width={100} height={25} />);

    const skeleton = document.querySelector('.virtual-cell-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies dimensions', () => {
    render(<CellSkeleton width={150} height={30} />);

    const skeleton = document.querySelector('.virtual-cell-skeleton');
    expect(skeleton).toHaveStyle({ width: '150px', height: '30px' });
  });

  it('has loading animation element', () => {
    render(<CellSkeleton width={100} height={25} />);

    const skeleton = document.querySelector('.virtual-cell-skeleton');
    expect(skeleton?.children.length).toBeGreaterThan(0);
  });
});

describe('EmptyCell', () => {
  it('renders empty cell', () => {
    render(<EmptyCell width={100} height={25} />);

    const empty = document.querySelector('.virtual-cell-empty');
    expect(empty).toBeInTheDocument();
  });

  it('applies dimensions', () => {
    render(<EmptyCell width={120} height={28} />);

    const empty = document.querySelector('.virtual-cell-empty');
    expect(empty).toHaveStyle({ width: '120px', height: '28px' });
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<EmptyCell width={100} height={25} onClick={onClick} />);

    const empty = document.querySelector('.virtual-cell-empty');
    if (empty) {
      fireEvent.click(empty);
    }

    expect(onClick).toHaveBeenCalled();
  });
});
