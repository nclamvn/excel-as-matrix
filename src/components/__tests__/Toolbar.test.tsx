import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../Toolbar/Toolbar';

// Mock stores
const mockWorkbookStore = {
  sheets: {
    'sheet-1': { id: 'sheet-1', name: 'Sheet1' },
    'sheet-2': { id: 'sheet-2', name: 'Sheet2' },
  },
  activeSheetId: 'sheet-1',
};

const mockFindStore = {
  open: vi.fn(),
};

const mockFileImport = {
  importFromPreview: vi.fn(),
  isImporting: false,
  progress: 0,
};

const mockFileExport = {
  exportWorkbook: vi.fn(),
};

vi.mock('../../stores/workbookStore', () => ({
  useWorkbookStore: vi.fn(() => mockWorkbookStore),
}));

vi.mock('../../stores/findStore', () => ({
  useFindStore: vi.fn(() => mockFindStore),
}));

vi.mock('../../hooks/useFileImport', () => ({
  useFileImport: vi.fn(() => mockFileImport),
}));

vi.mock('../../hooks/useFileExport', () => ({
  useFileExport: vi.fn(() => mockFileExport),
}));

// Mock ImportDialog and ExportDialog
vi.mock('../FileIO', () => ({
  ImportDialog: vi.fn(({ isOpen, onClose, onImport }) =>
    isOpen ? (
      <div data-testid="import-dialog">
        <button data-testid="import-close" onClick={onClose}>Close</button>
        <button data-testid="import-confirm" onClick={() => onImport({}, {})}>Import</button>
      </div>
    ) : null
  ),
  ExportDialog: vi.fn(({ isOpen, onClose, onExport, sheetNames }) =>
    isOpen ? (
      <div data-testid="export-dialog">
        <span data-testid="sheet-count">{sheetNames.length} sheets</span>
        <button data-testid="export-close" onClick={onClose}>Close</button>
        <button data-testid="export-confirm" onClick={() => onExport('xlsx', {})}>Export</button>
      </div>
    ) : null
  ),
}));

// Mock UndoRedoButtons
vi.mock('../UndoRedo', () => ({
  UndoRedoButtons: () => <div data-testid="undo-redo-buttons">Undo/Redo</div>,
}));

describe('Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    Object.assign(mockFileImport, {
      importFromPreview: vi.fn(),
      isImporting: false,
      progress: 0,
    });
    Object.assign(mockWorkbookStore, {
      sheets: {
        'sheet-1': { id: 'sheet-1', name: 'Sheet1' },
        'sheet-2': { id: 'sheet-2', name: 'Sheet2' },
      },
      activeSheetId: 'sheet-1',
    });
  });

  describe('Rendering', () => {
    it('should render the toolbar', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('Claude Code')).toBeInTheDocument();
    });

    it('should display workbook name', () => {
      render(<Toolbar workbookName="My Workbook" />);
      expect(screen.getByText('My Workbook')).toBeInTheDocument();
    });

    it('should display "Untitled Workbook" when no name provided', () => {
      render(<Toolbar workbookName="" />);
      expect(screen.getByText('Untitled Workbook')).toBeInTheDocument();
    });

    it('should display active sheet name', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('/ Sheet1')).toBeInTheDocument();
    });

    it('should render UndoRedoButtons', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByTestId('undo-redo-buttons')).toBeInTheDocument();
    });

    it('should render Find button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Find')).toBeInTheDocument();
    });

    it('should render Import button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('should render Export button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render version number', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });
  });

  describe('Find Functionality', () => {
    it('should open find dialog when Find button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Find'));
      expect(mockFindStore.open).toHaveBeenCalledWith(false);
    });
  });

  describe('Import Dialog', () => {
    it('should open import dialog when Import button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Import'));
      expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
    });

    it('should close import dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Import'));
      expect(screen.getByTestId('import-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('import-close'));
      expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
    });

    it('should call importFromPreview and close dialog when import is confirmed', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Import'));
      await user.click(screen.getByTestId('import-confirm'));

      expect(mockFileImport.importFromPreview).toHaveBeenCalled();
      expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Export Dialog', () => {
    it('should open export dialog when Export button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Export'));
      expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    });

    it('should pass sheet names to export dialog', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Export'));
      expect(screen.getByTestId('sheet-count')).toHaveTextContent('2 sheets');
    });

    it('should close export dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Export'));
      expect(screen.getByTestId('export-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('export-close'));
      expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument();
    });

    it('should call exportWorkbook when export is confirmed', async () => {
      const user = userEvent.setup();
      render(<Toolbar workbookName="Test Workbook" />);

      await user.click(screen.getByText('Export'));
      await user.click(screen.getByTestId('export-confirm'));

      expect(mockFileExport.exportWorkbook).toHaveBeenCalled();
    });
  });

  describe('Import Loading State', () => {
    it('should show loading overlay when importing', () => {
      Object.assign(mockFileImport, {
        isImporting: true,
        progress: 50,
      });

      render(<Toolbar workbookName="Test Workbook" />);

      expect(screen.getByText('Importing Data...')).toBeInTheDocument();
      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });

    it('should show progress bar during import', () => {
      Object.assign(mockFileImport, {
        isImporting: true,
        progress: 75,
      });

      const { container } = render(<Toolbar workbookName="Test Workbook" />);

      const progressBar = container.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('should not show loading overlay when not importing', () => {
      Object.assign(mockFileImport, {
        isImporting: false,
        progress: 0,
      });

      render(<Toolbar workbookName="Test Workbook" />);

      expect(screen.queryByText('Importing Data...')).not.toBeInTheDocument();
    });
  });

  describe('No Active Sheet', () => {
    it('should not display sheet name when no active sheet', () => {
      Object.assign(mockWorkbookStore, {
        sheets: {},
        activeSheetId: null,
      });

      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.queryByText(/^\/ /)).not.toBeInTheDocument();
    });
  });

  describe('Button Titles', () => {
    it('should have correct title for Find button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Find')).toHaveAttribute('title', 'Find (Ctrl+F)');
    });

    it('should have correct title for Import button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Import')).toHaveAttribute('title', 'Import file');
    });

    it('should have correct title for Export button', () => {
      render(<Toolbar workbookName="Test Workbook" />);
      expect(screen.getByText('Export')).toHaveAttribute('title', 'Export workbook');
    });
  });
});

describe('Toolbar Styling', () => {
  it('should have toolbar class on container', () => {
    const { container } = render(<Toolbar workbookName="Test Workbook" />);
    expect(container.querySelector('.toolbar')).toBeInTheDocument();
  });

  it('should apply correct font styling to brand', () => {
    render(<Toolbar workbookName="Test Workbook" />);

    const excelText = screen.getByText('Excel');
    expect(excelText).toHaveClass('text-green-800');

    const claudeText = screen.getByText('Claude Code');
    expect(claudeText).toHaveClass('text-amber-700');
  });
});
