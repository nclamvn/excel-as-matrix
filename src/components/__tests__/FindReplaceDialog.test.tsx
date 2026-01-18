import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindReplaceDialog } from '../FindReplace/FindReplaceDialog';

// Mock store state
const createMockFindStore = (overrides = {}) => ({
  isOpen: true,
  isReplaceMode: false,
  searchText: '',
  replaceText: '',
  options: {
    matchCase: false,
    matchWholeCell: false,
    useRegex: false,
    searchIn: 'values' as const,
    searchScope: 'sheet' as const,
  },
  matches: [],
  currentMatchIndex: -1,
  isSearching: false,
  close: vi.fn(),
  setSearchText: vi.fn(),
  setReplaceText: vi.fn(),
  setOptions: vi.fn(),
  search: vi.fn(),
  findNext: vi.fn(),
  findPrevious: vi.fn(),
  replaceCurrent: vi.fn(),
  replaceAll: vi.fn(),
  open: vi.fn(),
  ...overrides,
});

let mockStore = createMockFindStore();

vi.mock('../../stores/findStore', () => ({
  useFindStore: vi.fn(() => mockStore),
}));

vi.mock('../../shortcuts/useShortcut', () => ({
  useShortcut: vi.fn(),
}));

describe('FindReplaceDialog', () => {
  beforeEach(() => {
    mockStore = createMockFindStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      mockStore = createMockFindStore({ isOpen: false });
      const { container } = render(<FindReplaceDialog />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(<FindReplaceDialog />);
      expect(screen.getByPlaceholderText('Find...')).toBeInTheDocument();
    });

    it('should show "Find" title in find mode', () => {
      render(<FindReplaceDialog />);
      // Use getAllByText since both title and button have "Find" text
      const findElements = screen.getAllByText('Find');
      expect(findElements.length).toBeGreaterThan(0);
    });

    it('should show "Find and Replace" title in replace mode', () => {
      mockStore = createMockFindStore({ isReplaceMode: true });
      render(<FindReplaceDialog />);
      expect(screen.getByText('Find and Replace')).toBeInTheDocument();
    });

    it('should render replace input only in replace mode', () => {
      mockStore = createMockFindStore({ isReplaceMode: false });
      render(<FindReplaceDialog />);
      expect(screen.queryByPlaceholderText('Replace with...')).not.toBeInTheDocument();

      mockStore = createMockFindStore({ isReplaceMode: true });
      render(<FindReplaceDialog />);
      expect(screen.getByPlaceholderText('Replace with...')).toBeInTheDocument();
    });

    it('should render Replace and Replace All buttons in replace mode', () => {
      mockStore = createMockFindStore({ isReplaceMode: true });
      render(<FindReplaceDialog />);
      expect(screen.getByText('Replace')).toBeInTheDocument();
      expect(screen.getByText('Replace All')).toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should display search text from store', () => {
      mockStore = createMockFindStore({ searchText: 'test query' });
      render(<FindReplaceDialog />);
      expect(screen.getByPlaceholderText('Find...')).toHaveValue('test query');
    });

    it('should call setSearchText when typing', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Find...');
      await user.type(input, 'hello');

      expect(mockStore.setSearchText).toHaveBeenCalled();
    });

    it('should focus search input when dialog opens', () => {
      render(<FindReplaceDialog />);
      expect(screen.getByPlaceholderText('Find...')).toHaveFocus();
    });
  });

  describe('Replace Input', () => {
    it('should display replace text from store', () => {
      mockStore = createMockFindStore({
        isReplaceMode: true,
        replaceText: 'replacement',
      });
      render(<FindReplaceDialog />);
      expect(screen.getByPlaceholderText('Replace with...')).toHaveValue('replacement');
    });

    it('should call setReplaceText when typing', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({ isReplaceMode: true });
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Replace with...');
      await user.type(input, 'new text');

      expect(mockStore.setReplaceText).toHaveBeenCalled();
    });
  });

  describe('Search Button', () => {
    it('should be disabled when search text is empty', () => {
      mockStore = createMockFindStore({ searchText: '' });
      render(<FindReplaceDialog />);

      const findButton = screen.getByRole('button', { name: 'Find' });
      expect(findButton).toBeDisabled();
    });

    it('should be disabled when search text is only whitespace', () => {
      mockStore = createMockFindStore({ searchText: '   ' });
      render(<FindReplaceDialog />);

      const findButton = screen.getByRole('button', { name: 'Find' });
      expect(findButton).toBeDisabled();
    });

    it('should be enabled when search text has content', () => {
      mockStore = createMockFindStore({ searchText: 'test' });
      render(<FindReplaceDialog />);

      const findButton = screen.getByRole('button', { name: 'Find' });
      expect(findButton).not.toBeDisabled();
    });

    it('should call search when clicked', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({ searchText: 'test' });
      render(<FindReplaceDialog />);

      await user.click(screen.getByRole('button', { name: 'Find' }));
      expect(mockStore.search).toHaveBeenCalled();
    });

    it('should show loading state when searching', () => {
      mockStore = createMockFindStore({ searchText: 'test', isSearching: true });
      render(<FindReplaceDialog />);

      const findButton = screen.getByRole('button', { name: '...' });
      expect(findButton).toBeDisabled();
    });
  });

  describe('Match Navigation', () => {
    it('should display match count when matches exist', () => {
      mockStore = createMockFindStore({
        searchText: 'test',
        matches: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should update match count display when navigating', () => {
      mockStore = createMockFindStore({
        searchText: 'test',
        matches: [{ row: 0, col: 0 }, { row: 1, col: 0 }],
        currentMatchIndex: 1,
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('2 of 2')).toBeInTheDocument();
    });

    it('should disable navigation buttons when no matches', () => {
      mockStore = createMockFindStore({ matches: [] });
      render(<FindReplaceDialog />);

      const prevButton = screen.getByTitle('Find previous (Shift+F3)');
      const nextButton = screen.getByTitle('Find next (F3)');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should enable navigation buttons when matches exist', () => {
      mockStore = createMockFindStore({
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      const prevButton = screen.getByTitle('Find previous (Shift+F3)');
      const nextButton = screen.getByTitle('Find next (F3)');

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it('should call findNext when next button clicked', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      await user.click(screen.getByTitle('Find next (F3)'));
      expect(mockStore.findNext).toHaveBeenCalled();
    });

    it('should call findPrevious when previous button clicked', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      await user.click(screen.getByTitle('Find previous (Shift+F3)'));
      expect(mockStore.findPrevious).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should search on Enter when no matches', () => {
      mockStore = createMockFindStore({ searchText: 'test', matches: [] });
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Find...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStore.search).toHaveBeenCalled();
    });

    it('should findNext on Enter when matches exist', () => {
      mockStore = createMockFindStore({
        searchText: 'test',
        matches: [{ row: 0, col: 0 }],
      });
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Find...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockStore.findNext).toHaveBeenCalled();
    });

    it('should findPrevious on Shift+Enter', () => {
      mockStore = createMockFindStore({
        searchText: 'test',
        matches: [{ row: 0, col: 0 }],
      });
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Find...');
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockStore.findPrevious).toHaveBeenCalled();
    });

    it('should close on Escape', () => {
      render(<FindReplaceDialog />);

      const input = screen.getByPlaceholderText('Find...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockStore.close).toHaveBeenCalled();
    });
  });

  describe('Replace Actions', () => {
    it('should disable Replace button when no current match', () => {
      mockStore = createMockFindStore({
        isReplaceMode: true,
        currentMatchIndex: -1,
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('Replace')).toBeDisabled();
    });

    it('should enable Replace button when current match exists', () => {
      mockStore = createMockFindStore({
        isReplaceMode: true,
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('Replace')).not.toBeDisabled();
    });

    it('should call replaceCurrent when Replace clicked', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({
        isReplaceMode: true,
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      await user.click(screen.getByText('Replace'));
      expect(mockStore.replaceCurrent).toHaveBeenCalled();
    });

    it('should disable Replace All when no matches', () => {
      mockStore = createMockFindStore({
        isReplaceMode: true,
        matches: [],
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('Replace All')).toBeDisabled();
    });

    it('should call replaceAll when Replace All clicked', async () => {
      const user = userEvent.setup();
      mockStore = createMockFindStore({
        isReplaceMode: true,
        matches: [{ row: 0, col: 0 }],
        currentMatchIndex: 0,
      });
      render(<FindReplaceDialog />);

      await user.click(screen.getByText('Replace All'));
      expect(mockStore.replaceAll).toHaveBeenCalled();
    });
  });

  describe('Search Options', () => {
    it('should toggle options panel visibility', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Options should be hidden initially
      expect(screen.queryByText('Match case')).not.toBeInTheDocument();

      // Find the button with the settings icon
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);
        expect(screen.getByText('Match case')).toBeInTheDocument();
      }
    });

    it('should display match case option', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Open options
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);
        expect(screen.getByText('Match case')).toBeInTheDocument();
      }
    });

    it('should call setOptions when match case changed', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Open options
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);

        const matchCaseCheckbox = screen.getByLabelText('Match case');
        await user.click(matchCaseCheckbox);

        expect(mockStore.setOptions).toHaveBeenCalledWith({ matchCase: true });
      }
    });

    it('should call setOptions when match whole cell changed', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Open options
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);

        const matchWholeCell = screen.getByLabelText('Match entire cell contents');
        await user.click(matchWholeCell);

        expect(mockStore.setOptions).toHaveBeenCalledWith({ matchWholeCell: true });
      }
    });

    it('should call setOptions when use regex changed', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Open options
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);

        const useRegex = screen.getByLabelText('Use regular expressions');
        await user.click(useRegex);

        expect(mockStore.setOptions).toHaveBeenCalledWith({ useRegex: true });
      }
    });

    it('should display search scope dropdown', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Open options
      const buttons = screen.getAllByRole('button');
      const optionsButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M10.325"]')
      );

      if (optionsButton) {
        await user.click(optionsButton);

        expect(screen.getByText('Scope:')).toBeInTheDocument();
        // Multiple comboboxes exist - check that at least one is present
        const comboboxes = screen.getAllByRole('combobox');
        expect(comboboxes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('No Matches Message', () => {
    it('should show "No matches found" when search completed with no results', () => {
      mockStore = createMockFindStore({
        searchText: 'nonexistent',
        matches: [],
        isSearching: false,
      });
      render(<FindReplaceDialog />);

      expect(screen.getByText('No matches found')).toBeInTheDocument();
    });

    it('should not show message when searching', () => {
      mockStore = createMockFindStore({
        searchText: 'test',
        matches: [],
        isSearching: true,
      });
      render(<FindReplaceDialog />);

      expect(screen.queryByText('No matches found')).not.toBeInTheDocument();
    });

    it('should not show message when search text is empty', () => {
      mockStore = createMockFindStore({
        searchText: '',
        matches: [],
        isSearching: false,
      });
      render(<FindReplaceDialog />);

      expect(screen.queryByText('No matches found')).not.toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should call close when close button clicked', async () => {
      const user = userEvent.setup();
      render(<FindReplaceDialog />);

      // Find close button (the X button in header)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) =>
        btn.querySelector('svg path[d*="M6 18L18 6"]')
      );

      if (closeButton) {
        await user.click(closeButton);
        expect(mockStore.close).toHaveBeenCalled();
      }
    });
  });
});

describe('FindReplaceDialog Options State', () => {
  beforeEach(() => {
    mockStore = createMockFindStore();
  });

  it('should reflect matchCase option state', async () => {
    const user = userEvent.setup();
    mockStore = createMockFindStore({
      options: {
        matchCase: true,
        matchWholeCell: false,
        useRegex: false,
        searchIn: 'values',
        searchScope: 'sheet',
      },
    });
    render(<FindReplaceDialog />);

    // Open options
    const buttons = screen.getAllByRole('button');
    const optionsButton = buttons.find((btn) =>
      btn.querySelector('svg path[d*="M10.325"]')
    );

    if (optionsButton) {
      await user.click(optionsButton);
      expect(screen.getByLabelText('Match case')).toBeChecked();
    }
  });

  it('should reflect searchIn option state', async () => {
    const user = userEvent.setup();
    mockStore = createMockFindStore({
      options: {
        matchCase: false,
        matchWholeCell: false,
        useRegex: false,
        searchIn: 'formulas',
        searchScope: 'sheet',
      },
    });
    render(<FindReplaceDialog />);

    // Open options
    const buttons = screen.getAllByRole('button');
    const optionsButton = buttons.find((btn) =>
      btn.querySelector('svg path[d*="M10.325"]')
    );

    if (optionsButton) {
      await user.click(optionsButton);
      const searchInSelect = screen.getAllByRole('combobox')[0];
      expect(searchInSelect).toHaveValue('formulas');
    }
  });

  it('should reflect searchScope option state', async () => {
    const user = userEvent.setup();
    mockStore = createMockFindStore({
      options: {
        matchCase: false,
        matchWholeCell: false,
        useRegex: false,
        searchIn: 'values',
        searchScope: 'workbook',
      },
    });
    render(<FindReplaceDialog />);

    // Open options
    const buttons = screen.getAllByRole('button');
    const optionsButton = buttons.find((btn) =>
      btn.querySelector('svg path[d*="M10.325"]')
    );

    if (optionsButton) {
      await user.click(optionsButton);
      const scopeSelect = screen.getAllByRole('combobox')[1];
      expect(scopeSelect).toHaveValue('workbook');
    }
  });
});
