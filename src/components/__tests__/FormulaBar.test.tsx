import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use vi.hoisted to define mock functions BEFORE vi.mock hoisting
const {
  mockSetIsEditing,
  mockGetCellFormula,
  mockGetCellDisplayValue,
  mockUpdateCell,
  mockSetCellFormula,
  mockSetCellValue,
  mockGetCell,
  mockSelectedCellRef,
} = vi.hoisted(() => ({
  mockSetIsEditing: vi.fn(),
  mockGetCellFormula: vi.fn().mockReturnValue(''),
  mockGetCellDisplayValue: vi.fn().mockReturnValue(''),
  mockUpdateCell: vi.fn(),
  mockSetCellFormula: vi.fn().mockResolvedValue({ success: true }),
  mockSetCellValue: vi.fn().mockResolvedValue({ success: true }),
  mockGetCell: vi.fn().mockResolvedValue({
    value: 'test',
    formula: null,
    display_value: 'test',
  }),
  mockSelectedCellRef: { current: { row: 0, col: 0 } as { row: number; col: number } | null },
}));

// Connect mocks to vi.mock factories
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: () => ({
    selectedCell: mockSelectedCellRef.current,
    isEditing: false,
    setIsEditing: mockSetIsEditing,
  }),
}));

vi.mock('../../stores/workbookStore', () => ({
  useWorkbookStore: () => ({
    getCellFormula: mockGetCellFormula,
    getCellDisplayValue: mockGetCellDisplayValue,
    updateCell: mockUpdateCell,
  }),
}));

vi.mock('../../api/client', () => ({
  apiClient: {
    setCellFormula: mockSetCellFormula,
    setCellValue: mockSetCellValue,
    getCell: mockGetCell,
  },
}));

vi.mock('../../types/cell', () => ({
  toCellRef: vi.fn().mockImplementation((row: number, col: number) => {
    const colLetter = String.fromCharCode(65 + col);
    return `${colLetter}${row + 1}`;
  }),
}));

import { FormulaBar } from '../FormulaBar/FormulaBar';

describe('FormulaBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable state
    mockSelectedCellRef.current = { row: 0, col: 0 };
    // Reset mock return values to defaults
    mockGetCellFormula.mockReturnValue('');
    mockGetCellDisplayValue.mockReturnValue('');
    mockSetCellFormula.mockResolvedValue({ success: true });
    mockSetCellValue.mockResolvedValue({ success: true });
    mockGetCell.mockResolvedValue({
      value: 'test',
      formula: null,
      display_value: 'test',
    });
  });

  describe('rendering', () => {
    it('renders formula bar', () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays cell reference', () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByText('A1')).toBeInTheDocument();
    });

    it('displays fx button', () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByText('fx')).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByPlaceholderText('Enter value or formula...')).toBeInTheDocument();
    });
  });

  describe('cell reference display', () => {
    it('updates cell reference when selection changes', () => {
      const { rerender } = render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      mockSelectedCellRef.current = { row: 2, col: 3 };
      rerender(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByText('D3')).toBeInTheDocument();
    });

    it('shows empty when no cell selected', () => {
      mockSelectedCellRef.current = null;
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      // Cell reference should be empty
      expect(screen.queryByText('A1')).not.toBeInTheDocument();
    });
  });

  describe('input value', () => {
    it('displays formula for selected cell', () => {
      mockGetCellFormula.mockReturnValue('=SUM(A1:A10)');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByDisplayValue('=SUM(A1:A10)')).toBeInTheDocument();
    });

    it('displays value when no formula', () => {
      mockGetCellFormula.mockReturnValue('');
      mockGetCellDisplayValue.mockReturnValue('Hello');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    it('prefers formula over display value', () => {
      mockGetCellFormula.mockReturnValue('=A1+B1');
      mockGetCellDisplayValue.mockReturnValue('100');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      expect(screen.getByDisplayValue('=A1+B1')).toBeInTheDocument();
    });

    it('updates when typing', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'New Value');

      expect(input).toHaveValue('New Value');
    });
  });

  describe('focus behavior', () => {
    it('sets isEditing to true on focus', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      expect(mockSetIsEditing).toHaveBeenCalledWith(true);
    });
  });

  describe('submit behavior', () => {
    it('submits on Enter key', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test Value');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetCellValue).toHaveBeenCalled();
      });
    });

    it('submits formula when starts with =', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '=SUM(A1:A5)');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetCellFormula).toHaveBeenCalledWith(
          'wb-1',
          'sheet-1',
          0,
          0,
          '=SUM(A1:A5)'
        );
      });
    });

    it('submits value when not formula', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Regular Value');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetCellValue).toHaveBeenCalledWith(
          'wb-1',
          'sheet-1',
          0,
          0,
          'Regular Value'
        );
      });
    });

    it('updates cell in store after successful submit', async () => {
      mockGetCell.mockResolvedValue({
        value: 100,
        formula: '=50+50',
        display_value: '100',
      });

      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '=50+50');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockUpdateCell).toHaveBeenCalled();
      });
    });

    it('sets isEditing to false after submit', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test');
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetIsEditing).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('cancel behavior', () => {
    it('cancels on Escape key', async () => {
      mockGetCellDisplayValue.mockReturnValue('Original');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'New Value');
      await userEvent.keyboard('{Escape}');

      expect(mockSetIsEditing).toHaveBeenCalledWith(false);
    });

    it('restores original value on Escape', async () => {
      mockGetCellDisplayValue.mockReturnValue('Original');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, 'New Value');
      await userEvent.keyboard('{Escape}');

      expect(input).toHaveValue('Original');
    });

    it('restores formula on Escape if cell has formula', async () => {
      mockGetCellFormula.mockReturnValue('=A1');
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, '=B1');
      await userEvent.keyboard('{Escape}');

      expect(input).toHaveValue('=A1');
    });
  });

  describe('error handling', () => {
    it('handles API error gracefully', async () => {
      mockSetCellValue.mockRejectedValue(new Error('API Error'));

      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test');
      await userEvent.keyboard('{Enter}');

      // Should not throw
      await waitFor(() => {
        expect(mockSetCellValue).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('does not submit when no cell selected', async () => {
      mockSelectedCellRef.current = null;
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test');
      await userEvent.keyboard('{Enter}');

      expect(mockSetCellValue).not.toHaveBeenCalled();
    });

    it('handles empty value', async () => {
      render(<FormulaBar workbookId="wb-1" sheetId="sheet-1" />);

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSetCellValue).toHaveBeenCalledWith(
          'wb-1',
          'sheet-1',
          0,
          0,
          ''
        );
      });
    });
  });
});
