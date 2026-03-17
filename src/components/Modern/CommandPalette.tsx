import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  Copy, Scissors, Clipboard, ClipboardPaste,
  FileDown, FilePlus, FileText,
  Undo2, Redo2, Trash2,
  Filter, SortAsc, SortDesc,
  Calculator, Plus, Minus,
  Settings, HelpCircle, Keyboard, Search as SearchIcon,
  Grid, Eye, EyeOff, Maximize2, Minimize2,
  Rows, Columns, Moon, Sun, RefreshCw
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';
import { useUIStore } from '../../stores/uiStore';
import { useFindStore } from '../../stores/findStore';

interface Command {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  icon: React.ElementType;
  group: string;
  action: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get store actions
  const workbook = useWorkbookStore();
  const ui = useUIStore();
  const find = useFindStore();

  // Build commands list with real actions
  const commands: Command[] = useMemo(() => [
    // === File ===
    {
      id: 'new-sheet',
      title: 'New Sheet',
      description: 'Add a new sheet to workbook',
      shortcut: '⇧⌘N',
      icon: FilePlus,
      group: 'File',
      action: () => {
        const sheets = Object.values(workbook.sheets);
        const newName = `Sheet${sheets.length + 1}`;
        workbook.addSheet({
          id: crypto.randomUUID(),
          name: newName,
          index: sheets.length,
          cells: {}
        });
        ui.showToast(`Created "${newName}"`, 'success');
      }
    },
    {
      id: 'duplicate-sheet',
      title: 'Duplicate Sheet',
      description: 'Create a copy of current sheet',
      icon: Copy,
      group: 'File',
      action: () => {
        if (workbook.activeSheetId) {
          workbook.duplicateSheet(workbook.activeSheetId);
          ui.showToast('Sheet duplicated', 'success');
        }
      }
    },
    {
      id: 'rename-sheet',
      title: 'Rename Sheet',
      description: 'Rename current sheet',
      icon: FileText,
      group: 'File',
      action: () => {
        ui.openDialog('sheetProperties');
      }
    },
    {
      id: 'delete-sheet',
      title: 'Delete Sheet',
      description: 'Delete current sheet',
      icon: Trash2,
      group: 'File',
      action: () => {
        const sheets = Object.values(workbook.sheets);
        if (sheets.length > 1 && workbook.activeSheetId) {
          const sheet = workbook.sheets[workbook.activeSheetId];
          workbook.deleteSheet(workbook.activeSheetId);
          ui.showToast(`Deleted "${sheet?.name}"`, 'info');
        } else {
          ui.showToast('Cannot delete the only sheet', 'warning');
        }
      },
      disabled: Object.keys(workbook.sheets).length <= 1
    },
    {
      id: 'export-csv',
      title: 'Export as CSV',
      description: 'Download sheet as CSV file',
      icon: FileDown,
      group: 'File',
      action: () => {
        if (!workbook.activeSheetId) return;
        const sheet = workbook.sheets[workbook.activeSheetId];
        if (!sheet) return;

        // Build CSV content
        const cells = sheet.cells;
        const rows: string[][] = [];
        let maxRow = 0, maxCol = 0;

        Object.keys(cells).forEach(key => {
          const [r, c] = key.split(':').map(Number);
          maxRow = Math.max(maxRow, r);
          maxCol = Math.max(maxCol, c);
        });

        for (let r = 0; r <= maxRow; r++) {
          const row: string[] = [];
          for (let c = 0; c <= maxCol; c++) {
            const cell = cells[getCellKey(r, c)];
            row.push(cell?.displayValue ?? cell?.value?.toString() ?? '');
          }
          rows.push(row);
        }

        const csv = rows.map(row =>
          row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sheet.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        ui.showToast('Exported to CSV', 'success');
      }
    },

    // === Edit ===
    {
      id: 'undo',
      title: 'Undo',
      description: 'Undo last action',
      shortcut: '⌘Z',
      icon: Undo2,
      group: 'Edit',
      action: () => {
        workbook.undo();
      },
      disabled: !workbook.canUndo()
    },
    {
      id: 'redo',
      title: 'Redo',
      description: 'Redo last action',
      shortcut: '⇧⌘Z',
      icon: Redo2,
      group: 'Edit',
      action: () => {
        workbook.redo();
      },
      disabled: !workbook.canRedo()
    },
    {
      id: 'copy',
      title: 'Copy',
      description: 'Copy selected cells',
      shortcut: '⌘C',
      icon: Copy,
      group: 'Edit',
      action: () => {
        workbook.copy();
        ui.showToast('Copied to clipboard', 'info');
      }
    },
    {
      id: 'cut',
      title: 'Cut',
      description: 'Cut selected cells',
      shortcut: '⌘X',
      icon: Scissors,
      group: 'Edit',
      action: () => {
        workbook.cut();
        ui.showToast('Cut to clipboard', 'info');
      }
    },
    {
      id: 'paste',
      title: 'Paste',
      description: 'Paste from clipboard',
      shortcut: '⌘V',
      icon: Clipboard,
      group: 'Edit',
      action: () => {
        workbook.paste();
      }
    },
    {
      id: 'paste-values',
      title: 'Paste Values Only',
      description: 'Paste only values, no formulas',
      shortcut: '⇧⌘V',
      icon: ClipboardPaste,
      group: 'Edit',
      action: () => {
        workbook.paste('values');
      }
    },
    {
      id: 'find-replace',
      title: 'Find & Replace',
      description: 'Search and replace text',
      shortcut: '⌘F',
      icon: SearchIcon,
      group: 'Edit',
      action: () => {
        find.open();
      }
    },

    // === Insert ===
    {
      id: 'insert-row-above',
      title: 'Insert Row Above',
      description: 'Add row above current selection',
      icon: Plus,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.insertRow(cell.row);
          ui.showToast('Row inserted', 'success');
        }
      }
    },
    {
      id: 'insert-row-below',
      title: 'Insert Row Below',
      description: 'Add row below current selection',
      icon: Rows,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.insertRow(cell.row + 1);
          ui.showToast('Row inserted', 'success');
        }
      }
    },
    {
      id: 'insert-column-left',
      title: 'Insert Column Left',
      description: 'Add column to the left',
      icon: Plus,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.insertColumn(cell.col);
          ui.showToast('Column inserted', 'success');
        }
      }
    },
    {
      id: 'insert-column-right',
      title: 'Insert Column Right',
      description: 'Add column to the right',
      icon: Columns,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.insertColumn(cell.col + 1);
          ui.showToast('Column inserted', 'success');
        }
      }
    },
    {
      id: 'delete-row',
      title: 'Delete Row',
      description: 'Remove current row',
      icon: Minus,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.deleteRow(cell.row);
          ui.showToast('Row deleted', 'info');
        }
      }
    },
    {
      id: 'delete-column',
      title: 'Delete Column',
      description: 'Remove current column',
      icon: Minus,
      group: 'Insert',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.deleteColumn(cell.col);
          ui.showToast('Column deleted', 'info');
        }
      }
    },

    // === Format ===
    {
      id: 'bold',
      title: 'Bold',
      description: 'Toggle bold text',
      shortcut: '⌘B',
      icon: Bold,
      group: 'Format',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell && workbook.activeSheetId) {
          const current = workbook.sheets[workbook.activeSheetId]?.cells[getCellKey(cell.row, cell.col)];
          workbook.applyFormat({ bold: !current?.format?.bold });
        }
      }
    },
    {
      id: 'italic',
      title: 'Italic',
      description: 'Toggle italic text',
      shortcut: '⌘I',
      icon: Italic,
      group: 'Format',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell && workbook.activeSheetId) {
          const current = workbook.sheets[workbook.activeSheetId]?.cells[getCellKey(cell.row, cell.col)];
          workbook.applyFormat({ italic: !current?.format?.italic });
        }
      }
    },
    {
      id: 'underline',
      title: 'Underline',
      description: 'Toggle underline',
      shortcut: '⌘U',
      icon: Underline,
      group: 'Format',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell && workbook.activeSheetId) {
          const current = workbook.sheets[workbook.activeSheetId]?.cells[getCellKey(cell.row, cell.col)];
          workbook.applyFormat({ underline: !current?.format?.underline });
        }
      }
    },
    {
      id: 'align-left',
      title: 'Align Left',
      icon: AlignLeft,
      group: 'Format',
      action: () => {
        workbook.applyFormat({ align: 'left' });
      }
    },
    {
      id: 'align-center',
      title: 'Align Center',
      icon: AlignCenter,
      group: 'Format',
      action: () => {
        workbook.applyFormat({ align: 'center' });
      }
    },
    {
      id: 'align-right',
      title: 'Align Right',
      icon: AlignRight,
      group: 'Format',
      action: () => {
        workbook.applyFormat({ align: 'right' });
      }
    },
    {
      id: 'clear-format',
      title: 'Clear Formatting',
      description: 'Remove all formatting from selection',
      icon: RefreshCw,
      group: 'Format',
      action: () => {
        workbook.clearFormat();
        ui.showToast('Formatting cleared', 'info');
      }
    },
    {
      id: 'format-cells',
      title: 'Format Cells...',
      description: 'Open format cells dialog',
      shortcut: '⌘1',
      icon: Settings,
      group: 'Format',
      action: () => {
        ui.openDialog('formatCells');
      }
    },

    // === Data ===
    {
      id: 'sort-asc',
      title: 'Sort A → Z',
      description: 'Sort column ascending',
      icon: SortAsc,
      group: 'Data',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.sort({ column: cell.col, direction: 'asc' });
          ui.showToast('Sorted ascending', 'success');
        }
      }
    },
    {
      id: 'sort-desc',
      title: 'Sort Z → A',
      description: 'Sort column descending',
      icon: SortDesc,
      group: 'Data',
      action: () => {
        const cell = workbook.selectedCell;
        if (cell) {
          workbook.sort({ column: cell.col, direction: 'desc' });
          ui.showToast('Sorted descending', 'success');
        }
      }
    },
    {
      id: 'filter',
      title: 'Toggle Filter',
      description: 'Enable/disable filter on data',
      shortcut: '⌘⇧L',
      icon: Filter,
      group: 'Data',
      action: () => {
        workbook.toggleFilter();
        ui.showToast(workbook.filterEnabled ? 'Filter enabled' : 'Filter disabled', 'info');
      }
    },

    // === View ===
    {
      id: 'zoom-in',
      title: 'Zoom In',
      description: 'Increase zoom level',
      shortcut: '⌘+',
      icon: Maximize2,
      group: 'View',
      action: () => {
        workbook.setZoom(Math.min(200, workbook.zoom + 10));
      }
    },
    {
      id: 'zoom-out',
      title: 'Zoom Out',
      description: 'Decrease zoom level',
      shortcut: '⌘-',
      icon: Minimize2,
      group: 'View',
      action: () => {
        workbook.setZoom(Math.max(50, workbook.zoom - 10));
      }
    },
    {
      id: 'zoom-100',
      title: 'Zoom 100%',
      description: 'Reset to default zoom',
      shortcut: '⌘0',
      icon: Maximize2,
      group: 'View',
      action: () => {
        workbook.setZoom(100);
      }
    },
    {
      id: 'toggle-gridlines',
      title: 'Toggle Gridlines',
      description: workbook.showGridlines ? 'Hide gridlines' : 'Show gridlines',
      icon: Grid,
      group: 'View',
      action: () => {
        workbook.setShowGridlines(!workbook.showGridlines);
      }
    },
    {
      id: 'toggle-headings',
      title: 'Toggle Row/Column Headings',
      description: workbook.showHeadings ? 'Hide headings' : 'Show headings',
      icon: workbook.showHeadings ? Eye : EyeOff,
      group: 'View',
      action: () => {
        workbook.setShowHeadings(!workbook.showHeadings);
      }
    },
    {
      id: 'toggle-formula-bar',
      title: 'Toggle Formula Bar',
      description: ui.formulaBarVisible ? 'Hide formula bar' : 'Show formula bar',
      icon: Calculator,
      group: 'View',
      action: () => {
        ui.toggleFormulaBar();
      }
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Dark Mode',
      description: `Switch to ${ui.resolvedTheme === 'dark' ? 'light' : 'dark'} mode`,
      icon: ui.resolvedTheme === 'dark' ? Sun : Moon,
      group: 'View',
      action: () => {
        ui.toggleTheme();
      }
    },

    // === Help ===
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all shortcuts',
      shortcut: '⌘/',
      icon: Keyboard,
      group: 'Help',
      action: () => {
        ui.openDialog('preferences');
      }
    },
    {
      id: 'about',
      title: 'About',
      description: 'About Excel Clone',
      icon: HelpCircle,
      group: 'Help',
      action: () => {
        ui.openDialog('about');
      }
    },
  ], [workbook, ui, find]);

  const filteredCommands = useMemo(() =>
    commands.filter(cmd =>
      !cmd.disabled && (
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
        cmd.group.toLowerCase().includes(query.toLowerCase())
      )
    ),
    [commands, query]
  );

  // Group commands
  const groupedCommands = useMemo(() =>
    filteredCommands.reduce((acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    }, {} as Record<string, Command[]>),
    [filteredCommands]
  );

  const flatCommands = useMemo(() =>
    Object.values(groupedCommands).flat(),
    [groupedCommands]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, flatCommands, selectedIndex, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-palette__header">
          <div className="cmd-palette__icon">
            <Search />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette__input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="cmd-palette__shortcut">ESC</span>
        </div>

        <div className="cmd-palette__results">
          {Object.entries(groupedCommands).map(([group, cmds]) => (
            <div key={group} className="cmd-palette__group">
              <div className="cmd-palette__group-title">{group}</div>
              {cmds.map((cmd) => {
                const index = currentIndex++;
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    className={`cmd-palette__item ${index === selectedIndex ? 'cmd-palette__item--selected' : ''}`}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="cmd-palette__item-icon">
                      <Icon />
                    </div>
                    <div className="cmd-palette__item-content">
                      <div className="cmd-palette__item-title">{cmd.title}</div>
                      {cmd.description && (
                        <div className="cmd-palette__item-desc">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <span className="cmd-palette__item-shortcut">{cmd.shortcut}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {flatCommands.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-4)' }}>
              No commands found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
