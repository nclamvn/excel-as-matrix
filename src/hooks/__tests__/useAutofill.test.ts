import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock stores
const mockWorkbookStore = {
  sheets: {
    'sheet-1': {
      cells: {
        '0,0': { value: 1 },
        '1,0': { value: 2 },
        '2,0': { value: 3 },
        '0,1': { value: 'Item 1' },
        '1,1': { value: 'Item 2' },
        '2,1': { value: 'Item 3' },
      },
    },
  },
  setCellValue: vi.fn(),
};

const mockUndoStore = {
  push: vi.fn(),
};

vi.mock('../../stores/workbookStore', () => ({
  useWorkbookStore: {
    getState: () => mockWorkbookStore,
  },
}));

vi.mock('../../stores/undoStore', () => ({
  useUndoStore: {
    getState: () => mockUndoStore,
  },
}));

vi.mock('../../utils/fillSeriesUtils', () => ({
  detectPattern: vi.fn().mockImplementation((values) => {
    if (values.every((v: unknown) => typeof v === 'number')) {
      const nums = values as number[];
      if (nums.length >= 2) {
        const step = nums[1] - nums[0];
        return { type: 'linear', step };
      }
    }
    return { type: 'copy' };
  }),
  generateSeriesValues: vi.fn().mockImplementation((values, pattern, count) => {
    const result = [];
    if (pattern.type === 'linear' && typeof values[values.length - 1] === 'number') {
      const lastNum = values[values.length - 1] as number;
      for (let i = 1; i <= count; i++) {
        result.push(lastNum + (pattern.step || 1) * i);
      }
    } else {
      for (let i = 0; i < count; i++) {
        result.push(values[i % values.length]);
      }
    }
    return result;
  }),
}));

import { useAutofill } from '../useAutofill';

describe('useAutofill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkbookStore.setCellValue.mockClear();
    mockUndoStore.push.mockClear();
  });

  describe('detectPattern', () => {
    it('detects numeric series pattern', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern([1, 2, 3]);

      expect(pattern.type).toBe('series');
      expect(pattern.step).toBe(1);
    });

    it('detects copy pattern for non-series', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern(['A', 'B', 'C']);

      expect(pattern.type).toBe('copy');
    });

    it('detects date pattern', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern(['2024-01-01', '2024-01-02']);

      expect(pattern.detectedPattern).toBeDefined();
    });

    it('detects day name pattern', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern(['Monday', 'Tuesday', 'Wednesday']);

      expect(pattern.detectedPattern).toBeDefined();
    });

    it('detects month name pattern', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern(['January', 'February', 'March']);

      expect(pattern.detectedPattern).toBeDefined();
    });

    it('handles single value', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern([1]);

      expect(pattern.type).toBeDefined();
    });

    it('handles empty array', () => {
      const { result } = renderHook(() => useAutofill());

      const pattern = result.current.detectPattern([]);

      expect(pattern.type).toBe('copy');
    });
  });

  describe('autofill', () => {
    describe('fill down', () => {
      it('fills cells downward with numeric series', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
            'down'
          );
        });

        expect(mockWorkbookStore.setCellValue).toHaveBeenCalled();
      });

      it('fills correct number of cells', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
            'down'
          );
        });

        // Should fill 3 additional cells (rows 3, 4, 5)
        expect(mockWorkbookStore.setCellValue).toHaveBeenCalledTimes(3);
      });

      it('adds undo entry', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
            'down'
          );
        });

        expect(mockUndoStore.push).toHaveBeenCalled();
      });

      it('undo entry has correct type', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
            'down'
          );
        });

        expect(mockUndoStore.push).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'AUTOFILL',
          })
        );
      });

      it('undo entry has undo and redo functions', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
            'down'
          );
        });

        const undoEntry = mockUndoStore.push.mock.calls[0][0];
        expect(typeof undoEntry.undo).toBe('function');
        expect(typeof undoEntry.redo).toBe('function');
      });
    });

    describe('fill up', () => {
      it('fills cells upward', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 2, startCol: 0, endRow: 4, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 4, endCol: 0 },
            'up'
          );
        });

        expect(mockWorkbookStore.setCellValue).toHaveBeenCalled();
      });
    });

    describe('fill right', () => {
      it('fills cells to the right', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 0, endCol: 2 },
            { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
            'right'
          );
        });

        expect(mockWorkbookStore.setCellValue).toHaveBeenCalled();
      });

      it('fills correct number of columns', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 0, endCol: 2 },
            { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
            'right'
          );
        });

        // Should fill 3 additional cells (cols 3, 4, 5)
        expect(mockWorkbookStore.setCellValue).toHaveBeenCalledTimes(3);
      });
    });

    describe('fill left', () => {
      it('fills cells to the left', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 3, endRow: 0, endCol: 5 },
            { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
            'left'
          );
        });

        expect(mockWorkbookStore.setCellValue).toHaveBeenCalled();
      });
    });

    describe('multi-column fill', () => {
      it('fills multiple columns simultaneously', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 1 },
            { startRow: 0, startCol: 0, endRow: 5, endCol: 1 },
            'down'
          );
        });

        // 3 rows x 2 columns = 6 cells
        expect(mockWorkbookStore.setCellValue).toHaveBeenCalledTimes(6);
      });
    });

    describe('edge cases', () => {
      it('handles missing sheet gracefully', () => {
        const { result } = renderHook(() => useAutofill());

        // Should not throw
        expect(() => {
          act(() => {
            result.current.autofill(
              'non-existent-sheet',
              { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
              { startRow: 0, startCol: 0, endRow: 5, endCol: 0 },
              'down'
            );
          });
        }).not.toThrow();

        // Should not call setCellValue
        expect(mockWorkbookStore.setCellValue).not.toHaveBeenCalled();
      });

      it('handles same source and target range', () => {
        const { result } = renderHook(() => useAutofill());

        act(() => {
          result.current.autofill(
            'sheet-1',
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            { startRow: 0, startCol: 0, endRow: 2, endCol: 0 },
            'down'
          );
        });

        // No cells to fill
        expect(mockWorkbookStore.setCellValue).not.toHaveBeenCalled();
      });

      it('handles empty cells', () => {
        mockWorkbookStore.sheets['sheet-1'].cells = {
          '0,0': { value: null },
          '1,0': { value: null },
        };

        const { result } = renderHook(() => useAutofill());

        // Should not throw
        expect(() => {
          act(() => {
            result.current.autofill(
              'sheet-1',
              { startRow: 0, startCol: 0, endRow: 1, endCol: 0 },
              { startRow: 0, startCol: 0, endRow: 3, endCol: 0 },
              'down'
            );
          });
        }).not.toThrow();
      });
    });
  });

  describe('return value', () => {
    it('returns autofill function', () => {
      const { result } = renderHook(() => useAutofill());

      expect(typeof result.current.autofill).toBe('function');
    });

    it('returns detectPattern function', () => {
      const { result } = renderHook(() => useAutofill());

      expect(typeof result.current.detectPattern).toBe('function');
    });
  });
});
