// ═══════════════════════════════════════════════════════════════════════════
// FILE MENU - WPS Office Style File Operations
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  FileDown,
  FileImage,
  Printer,
  Mail,
  Lock,
  RotateCcw,
  HelpCircle,
  Settings,
  ChevronRight,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  FileText,
  FileCode,
  Globe,
  Shield,
  Database,
  History,
  Upload
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';
import { loggers } from '@/utils/logger';
import './FileMenu.css';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RecentFile {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  thumbnail?: string;
  workbookData?: string; // JSON stringified workbook data for quick restore
}

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  hasSubmenu?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface FileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Files Hook
// ─────────────────────────────────────────────────────────────────────────────

const useRecentFiles = () => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('excelai-recent-files');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentFiles(parsed.map((f: RecentFile) => ({
          ...f,
          lastOpened: new Date(f.lastOpened)
        })));
      } catch (e) {
        loggers.ui.error('Failed to parse recent files:', e);
      }
    } else {
      // Demo data
      setRecentFiles([
        {
          id: '1',
          name: 'Sales Report Q4.xlsx',
          path: '/Documents/Reports/',
          lastOpened: new Date()
        },
        {
          id: '2',
          name: 'Budget 2026.xlsx',
          path: '/Documents/Finance/',
          lastOpened: new Date(Date.now() - 86400000)
        },
        {
          id: '3',
          name: 'Customer Data.csv',
          path: '/Downloads/',
          lastOpened: new Date(Date.now() - 172800000)
        }
      ]);
    }
  }, []);

  const addRecentFile = useCallback((file: Omit<RecentFile, 'id' | 'lastOpened'>) => {
    setRecentFiles(prev => {
      const newFile: RecentFile = {
        ...file,
        id: Date.now().toString(),
        lastOpened: new Date()
      };
      // Remove any existing entry with the same name and add the new one
      const updated = [newFile, ...prev.filter(f => f.name !== file.name)].slice(0, 10);
      // Store in localStorage (limit data size to prevent quota issues)
      try {
        localStorage.setItem('excelai-recent-files', JSON.stringify(updated));
      } catch (e) {
        // If localStorage is full, remove oldest files and try again
        const reducedFiles = updated.slice(0, 5).map(f => ({
          ...f,
          workbookData: undefined // Remove data to save space
        }));
        localStorage.setItem('excelai-recent-files', JSON.stringify(reducedFiles));
      }
      return updated;
    });
  }, []);

  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
    localStorage.removeItem('excelai-recent-files');
  }, []);

  return { recentFiles, addRecentFile, clearRecentFiles };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const MenuItemComponent: React.FC<{
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <>
    {item.divider && <div className="file-menu__divider" />}
    <button
      className={`file-menu__item ${isActive ? 'file-menu__item--active' : ''}`}
      onClick={onClick}
    >
      <span className="file-menu__item-icon">{item.icon}</span>
      <span className="file-menu__item-label">{item.label}</span>
      {item.shortcut && (
        <span className="file-menu__item-shortcut">{item.shortcut}</span>
      )}
      {item.hasSubmenu && (
        <ChevronRight className="file-menu__item-arrow" size={14} />
      )}
    </button>
  </>
);

const RecentFileItem: React.FC<{
  file: RecentFile;
  onClick: () => void;
}> = ({ file, onClick }) => {
  const getTimeLabel = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.csv')) return <FileText size={20} />;
    if (name.endsWith('.json')) return <FileCode size={20} />;
    return <FileSpreadsheet size={20} />;
  };

  return (
    <button className="recent-file" onClick={onClick}>
      <div className="recent-file__icon">
        {getFileIcon(file.name)}
      </div>
      <div className="recent-file__info">
        <span className="recent-file__name">{file.name}</span>
        <span className="recent-file__path">{file.path}</span>
      </div>
      <span className="recent-file__time">{getTimeLabel(file.lastOpened)}</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Submenus
// ─────────────────────────────────────────────────────────────────────────────

const NewSubmenu: React.FC<{ onSelect: (type: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('blank')}>
      <FileSpreadsheet size={18} />
      <div>
        <span className="file-menu__submenu-title">Blank Workbook</span>
        <span className="file-menu__submenu-desc">Start with an empty spreadsheet</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('template')}>
      <FileText size={18} />
      <div>
        <span className="file-menu__submenu-title">From Template</span>
        <span className="file-menu__submenu-desc">Choose from pre-built templates</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('import')}>
      <Upload size={18} />
      <div>
        <span className="file-menu__submenu-title">Import Data</span>
        <span className="file-menu__submenu-desc">Import from CSV, JSON, or other sources</span>
      </div>
    </button>
  </div>
);

const SaveAsSubmenu: React.FC<{ onSelect: (format: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('xlsx')}>
      <FileSpreadsheet size={18} />
      <div>
        <span className="file-menu__submenu-title">Excel Workbook (.xlsx)</span>
        <span className="file-menu__submenu-desc">Standard Excel format</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('xls')}>
      <FileSpreadsheet size={18} />
      <div>
        <span className="file-menu__submenu-title">Excel 97-2003 (.xls)</span>
        <span className="file-menu__submenu-desc">Compatible with older Excel versions</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('csv')}>
      <FileText size={18} />
      <div>
        <span className="file-menu__submenu-title">CSV (Comma delimited)</span>
        <span className="file-menu__submenu-desc">Plain text format</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('json')}>
      <FileCode size={18} />
      <div>
        <span className="file-menu__submenu-title">JSON</span>
        <span className="file-menu__submenu-desc">JavaScript Object Notation</span>
      </div>
    </button>
  </div>
);

const PrintSubmenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('print')}>
      <Printer size={18} />
      <div>
        <span className="file-menu__submenu-title">Print</span>
        <span className="file-menu__submenu-desc">Print current sheet</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('preview')}>
      <FileText size={18} />
      <div>
        <span className="file-menu__submenu-title">Print Preview</span>
        <span className="file-menu__submenu-desc">Preview before printing</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('settings')}>
      <Settings size={18} />
      <div>
        <span className="file-menu__submenu-title">Page Setup</span>
        <span className="file-menu__submenu-desc">Configure page layout and margins</span>
      </div>
    </button>
  </div>
);

const EncryptSubmenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('password')}>
      <Lock size={18} />
      <div>
        <span className="file-menu__submenu-title">Set Password</span>
        <span className="file-menu__submenu-desc">Protect workbook with password</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('sheet')}>
      <Shield size={18} />
      <div>
        <span className="file-menu__submenu-title">Protect Sheet</span>
        <span className="file-menu__submenu-desc">Lock cells and formulas</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('remove')}>
      <Lock size={18} />
      <div>
        <span className="file-menu__submenu-title">Remove Protection</span>
        <span className="file-menu__submenu-desc">Remove password or protection</span>
      </div>
    </button>
  </div>
);

const BackupSubmenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('backup')}>
      <Database size={18} />
      <div>
        <span className="file-menu__submenu-title">Create Backup</span>
        <span className="file-menu__submenu-desc">Save a backup copy</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('restore')}>
      <RotateCcw size={18} />
      <div>
        <span className="file-menu__submenu-title">Restore Backup</span>
        <span className="file-menu__submenu-desc">Restore from previous backup</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('history')}>
      <History size={18} />
      <div>
        <span className="file-menu__submenu-title">Version History</span>
        <span className="file-menu__submenu-desc">View and restore previous versions</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('autosave')}>
      <Clock size={18} />
      <div>
        <span className="file-menu__submenu-title">Auto-save Settings</span>
        <span className="file-menu__submenu-desc">Configure automatic backups</span>
      </div>
    </button>
  </div>
);

const HelpSubmenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => (
  <div className="file-menu__submenu">
    <button className="file-menu__submenu-item" onClick={() => onSelect('guide')}>
      <HelpCircle size={18} />
      <div>
        <span className="file-menu__submenu-title">User Guide</span>
        <span className="file-menu__submenu-desc">Learn how to use ExcelAI</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('shortcuts')}>
      <FileText size={18} />
      <div>
        <span className="file-menu__submenu-title">Keyboard Shortcuts</span>
        <span className="file-menu__submenu-desc">View all shortcuts</span>
      </div>
    </button>
    <button className="file-menu__submenu-item" onClick={() => onSelect('about')}>
      <Globe size={18} />
      <div>
        <span className="file-menu__submenu-title">About ExcelAI</span>
        <span className="file-menu__submenu-desc">Version and license info</span>
      </div>
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const FileMenu: React.FC<FileMenuProps> = ({ isOpen, onClose }) => {
  const [activeMenu, setActiveMenu] = useState<string>('open');
  const { recentFiles, clearRecentFiles, addRecentFile } = useRecentFiles();
  const {
    workbookName,
    sheets,
    sheetOrder,
    activeSheetId,
    setWorkbook,
    addSheet,
    batchUpdateCells
  } = useWorkbookStore();

  // Menu items configuration
  const menuItems: MenuItem[] = [
    { id: 'new', label: 'New', shortcut: 'N', icon: <FilePlus size={18} />, hasSubmenu: true },
    { id: 'open', label: 'Open', shortcut: 'O', icon: <FolderOpen size={18} />, hasSubmenu: true },
    { id: 'save', label: 'Save', shortcut: 'S', icon: <Save size={18} /> },
    { id: 'saveas', label: 'Save As', shortcut: 'A', icon: <SaveAll size={18} />, hasSubmenu: true },
    { id: 'pdf', label: 'Export to PDF', shortcut: 'F', icon: <FileDown size={18} />, divider: true },
    { id: 'picture', label: 'Export to Picture', shortcut: 'G', icon: <FileImage size={18} /> },
    { id: 'print', label: 'Print', shortcut: 'P', icon: <Printer size={18} />, hasSubmenu: true },
    { id: 'email', label: 'Send E-mail', shortcut: 'M', icon: <Mail size={18} />, divider: true },
    { id: 'encrypt', label: 'Encrypt', shortcut: 'E', icon: <Lock size={18} />, hasSubmenu: true },
    { id: 'backup', label: 'Backup and Recovery', shortcut: 'K', icon: <RotateCcw size={18} />, hasSubmenu: true },
    { id: 'help', label: 'Help', shortcut: 'H', icon: <HelpCircle size={18} />, hasSubmenu: true, divider: true },
    { id: 'options', label: 'Options', shortcut: 'L', icon: <Settings size={18} /> },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const menuItem = menuItems.find(
        item => item.shortcut?.toLowerCase() === e.key.toLowerCase()
      );
      if (menuItem) {
        e.preventDefault();
        setActiveMenu(menuItem.id);
        if (!menuItem.hasSubmenu) {
          handleMenuAction(menuItem.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle menu actions
  const handleMenuAction = useCallback((action: string, subAction?: string) => {
    switch (action) {
      case 'new':
        if (subAction === 'blank') {
          window.location.reload();
        } else if (subAction === 'import') {
          // Trigger file input for import
          document.getElementById('file-input-open')?.click();
        }
        break;
      case 'open':
        // Trigger file input
        document.getElementById('file-input-open')?.click();
        break;
      case 'save':
      case 'saveas':
        handleExport(subAction || 'xlsx');
        break;
      case 'pdf':
        handleExportPDF();
        break;
      case 'picture':
        handleExportPicture();
        break;
      case 'print':
        if (subAction === 'print' || !subAction) {
          window.print();
        }
        break;
      case 'email':
        handleSendEmail();
        break;
      case 'options':
        // Open settings modal
        break;
    }
  }, []);

  const handleExport = useCallback((format: string) => {
    // Build export data from current state
    const exportData = {
      name: workbookName,
      sheets: sheetOrder.map(id => {
        const sheet = sheets[id];
        return {
          id: sheet.id,
          name: sheet.name,
          cells: sheet.cells
        };
      })
    };

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = convertToCSV(exportData);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      default:
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'xlsx.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workbookName || 'Untitled'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }, [workbookName, sheets, sheetOrder, onClose]);

  const handleExportPDF = useCallback(() => {
    // Use browser print to PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        h1 { color: #166534; }
      </style>
    `;

    let html = `<!DOCTYPE html><html><head><title>${workbookName}</title>${styles}</head><body>`;
    html += `<h1>${workbookName || 'Untitled Workbook'}</h1>`;

    // Convert sheets to HTML tables
    for (const sheetId of sheetOrder) {
      const sheet = sheets[sheetId];
      if (!sheet) continue;

      html += `<h2>${sheet.name}</h2><table>`;

      // Find dimensions
      let maxRow = 0, maxCol = 0;
      Object.keys(sheet.cells).forEach(key => {
        const [row, col] = key.split(':').map(Number);
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      });

      for (let r = 0; r <= Math.min(maxRow, 50); r++) {
        html += '<tr>';
        for (let c = 0; c <= Math.min(maxCol, 20); c++) {
          const cell = sheet.cells[getCellKey(r, c)];
          const value = cell?.displayValue || cell?.value || '';
          html += r === 0 ? `<th>${value}</th>` : `<td>${value}</td>`;
        }
        html += '</tr>';
      }
      html += '</table>';
    }

    html += '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    onClose();
  }, [workbookName, sheets, sheetOrder, onClose]);

  const handleExportPicture = useCallback(() => {
    // Capture grid as image using html2canvas concept
    const grid = document.querySelector('.grid-container');
    if (grid) {
      // For now, show instructions
      alert('To export as picture:\n1. Press Cmd+Shift+4 (Mac) or Win+Shift+S (Windows)\n2. Select the spreadsheet area\n\nFull screenshot export coming soon!');
    }
    onClose();
  }, [onClose]);

  const handleSendEmail = useCallback(() => {
    const subject = encodeURIComponent(`${workbookName || 'Spreadsheet'} - ExcelAI`);
    const body = encodeURIComponent('Please find the attached spreadsheet.\n\nSent from ExcelAI');
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onClose();
  }, [workbookName, onClose]);

  const handleFileOpen = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onClose();
      return;
    }

    const fileName = file.name.toLowerCase();
    loggers.ui.debug('[FileMenu] handleFileOpen called:', fileName, file.size, 'bytes');

    try {
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse XLSX/XLS using SheetJS (binary format — must use ArrayBuffer)
        loggers.ui.debug('[FileMenu] XLSX branch — using importExcelFile');
        const { importExcelFile } = await import('../../utils/excelIO');
        const result = await importExcelFile(file);
        loggers.ui.debug('[FileMenu] Parsed:', result.sheets.length, 'sheets, first sheet cells:', Object.keys(result.sheets[0]?.cells || {}).length);

        const workbookId = `local-${Date.now()}`;
        const name = file.name.replace(/\.[^/.]+$/, '');
        setWorkbook(workbookId, name);

        const importedSheetIds: string[] = [];
        for (let i = 0; i < result.sheets.length; i++) {
          const sheetData = result.sheets[i];
          const sheetId = `sheet-${Date.now()}-${i}`;
          importedSheetIds.push(sheetId);

          addSheet({
            id: sheetId,
            name: sheetData.name || `Sheet${i + 1}`,
            index: i,
            cells: {},
            columnWidths: sheetData.columnWidths,
            rowHeights: sheetData.rowHeights,
            freezePane: sheetData.freezePane,
          });

          const updates: Array<{ row: number; col: number; data: Partial<import('../../types/cell').CellData> }> = [];
          for (const [key, cell] of Object.entries(sheetData.cells)) {
            const [rowStr, colStr] = key.split(':');
            const row = parseInt(rowStr);
            const col = parseInt(colStr);
            updates.push({
              row,
              col,
              data: {
                value: cell.value as string | number | boolean,
                displayValue: cell.displayValue || String(cell.value ?? ''),
                formula: cell.formula || null,
                ...(cell.format ? { format: cell.format } : {}),
              },
            });
          }

          if (updates.length > 0) {
            batchUpdateCells(sheetId, updates);
          }
        }

        // Wire imported charts to chart store
        if (result.charts && result.charts.length > 0) {
          const { useChartStore } = await import('../../stores/chartStore');
          const { populateChartDataFromCells } = await import('../../utils/excelIO');
          const chartStore = useChartStore.getState();
          const typeMap: Record<string, string> = {
            bar: 'Bar', column: 'ColumnClustered', line: 'Line',
            pie: 'Pie', area: 'Area', scatter: 'Scatter', doughnut: 'Doughnut',
          };
          const defaultColors = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948'];
          for (const ic of result.charts) {
            const chartSheetId = importedSheetIds[ic.sheetIndex] || importedSheetIds[0];
            const chartType = (typeMap[ic.type.toLowerCase()] || 'ColumnClustered') as import('../../types/visualization').ChartType;
            const chart = chartStore.createChart(workbookId, chartSheetId, ic.name, chartType);
            if (ic.position) chartStore.updatePosition(chart.id, ic.position);
            // Populate chart data from cells
            const sheetCells = result.sheets[ic.sheetIndex]?.cells;
            if (sheetCells) {
              const chartData = populateChartDataFromCells(ic, sheetCells);
              if (chartData && chartData.categories.length > 0 && chartData.series.length > 0) {
                const seriesData = chartData.series.map((s, idx) => {
                  const vals = s.values;
                  return {
                    id: `series-${idx}`, name: s.name, values: vals,
                    color: defaultColors[idx % defaultColors.length],
                    statistics: {
                      min: Math.min(...vals), max: Math.max(...vals),
                      sum: vals.reduce((a, b) => a + b, 0),
                      avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
                      count: vals.length,
                    },
                  };
                });
                const allValues = seriesData.flatMap(s => s.values);
                const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
                const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
                chartStore.setChartData(chart.id, {
                  chartId: chart.id, chartType,
                  categories: chartData.categories,
                  series: seriesData,
                  bounds: { minValue: minVal, maxValue: maxVal, suggestedMin: minVal >= 0 ? 0 : minVal * 1.1, suggestedMax: maxVal * 1.1 },
                });
              }
            }
          }
        }
      } else if (fileName.endsWith('.json')) {
        // Parse JSON file
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.sheets && Array.isArray(data.sheets)) {
          importExcelAIFormat(data, file.name);
        } else if (Array.isArray(data)) {
          const rows = convertArrayToRows(data);
          importDataToSheet(rows, file.name);
        }
      } else {
        // CSV/TSV — read as text
        const text = await file.text();
        const rows = parseCSV(text);
        importDataToSheet(rows, file.name);
      }

      // Add to recent files
      setTimeout(() => {
        const currentSheets = useWorkbookStore.getState().sheets;
        const sheetOrder = useWorkbookStore.getState().sheetOrder;
        const workbookData = JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          sheets: sheetOrder.map(id => ({
            name: currentSheets[id]?.name,
            cells: currentSheets[id]?.cells || {}
          }))
        });
        addRecentFile({ name: file.name, path: 'Local File', workbookData });
      }, 100);

    } catch (err) {
      loggers.ui.error('Error parsing file:', err);
      alert('Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
    }

    onClose();
  }, [onClose, activeSheetId, batchUpdateCells, setWorkbook, addSheet, addRecentFile]);

  // Parse CSV content
  const parseCSV = (content: string): string[][] => {
    const rows: string[][] = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;

      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      rows.push(row);
    }

    return rows;
  };

  // Convert array of objects to rows
  const convertArrayToRows = (data: Record<string, unknown>[]): string[][] => {
    if (data.length === 0) return [];

    const headers = Object.keys(data[0]);
    const rows: string[][] = [headers];

    for (const item of data) {
      const row = headers.map(h => String(item[h] ?? ''));
      rows.push(row);
    }

    return rows;
  };

  // Import data rows to current sheet
  const importDataToSheet = (rows: string[][], _fileName: string) => {
    if (!activeSheetId || rows.length === 0) return;

    // Create updates for all cells
    const updates: Array<{ row: number; col: number; data: { value: string; displayValue: string } }> = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const value = row[c];
        if (value) {
          updates.push({
            row: r,
            col: c,
            data: { value, displayValue: value }
          });
        }
      }
    }

    // Batch update cells (don't call setWorkbook as it resets sheets)
    batchUpdateCells(activeSheetId, updates);

    // Import complete
  };

  // Import ExcelAI JSON format
  const importExcelAIFormat = (data: { name?: string; sheets: Array<{ name: string; cells: Record<string, { value?: unknown; displayValue?: string }> }> }, fileName: string) => {
    const workbookId = `local-${Date.now()}`;
    const name = data.name || fileName.replace(/\.[^/.]+$/, '');

    setWorkbook(workbookId, name);

    for (let i = 0; i < data.sheets.length; i++) {
      const sheetData = data.sheets[i];
      const sheetId = `sheet-${Date.now()}-${i}`;

      addSheet({
        id: sheetId,
        name: sheetData.name || `Sheet${i + 1}`,
        index: i,
        cells: {}
      });

      // Import cells
      const updates: Array<{ row: number; col: number; data: { value: string; displayValue: string } }> = [];

      for (const [key, cell] of Object.entries(sheetData.cells)) {
        const [row, col] = key.split(':').map(Number);
        const value = String(cell.value ?? '');
        updates.push({
          row,
          col,
          data: { value, displayValue: cell.displayValue || value }
        });
      }

      if (updates.length > 0) {
        batchUpdateCells(sheetId, updates);
      }
    }

  };

  const convertToCSV = (data: { sheets?: Array<{ cells?: Record<string, { value?: unknown; displayValue?: string }> }> }): string => {
    // Simple CSV conversion
    const sheetsData = data?.sheets || [];
    if (sheetsData.length === 0) return '';

    const firstSheet = sheetsData[0];
    const cells = firstSheet.cells || {};

    let maxRow = 0, maxCol = 0;
    Object.keys(cells).forEach(key => {
      const [row, col] = key.split(':').map(Number);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    });

    const rows: string[] = [];
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = cells[getCellKey(r, c)];
        const value = cell?.displayValue || String(cell?.value || '');
        row.push(value);
      }
      rows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    return rows.join('\n');
  };

  // Render submenu content
  const renderSubmenu = () => {
    switch (activeMenu) {
      case 'new':
        return <NewSubmenu onSelect={(type) => handleMenuAction('new', type)} />;
      case 'open':
        return (
          <div className="file-menu__recent">
            <div className="file-menu__recent-header">
              <h3>Recent</h3>
              <button onClick={clearRecentFiles} title="Clear recent files">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="file-menu__recent-list">
              {recentFiles.length > 0 ? (
                recentFiles.map(file => (
                  <RecentFileItem
                    key={file.id}
                    file={file}
                    onClick={() => {
                      // Load recent file from stored data
                      if (file.workbookData) {
                        try {
                          const data = JSON.parse(file.workbookData);
                          if (data.sheets && Array.isArray(data.sheets)) {
                            const workbookId = `local-${Date.now()}`;
                            const name = data.name || file.name.replace(/\.[^/.]+$/, '');

                            setWorkbook(workbookId, name);

                            for (let i = 0; i < data.sheets.length; i++) {
                              const sheetData = data.sheets[i];
                              const sheetId = `sheet-${Date.now()}-${i}`;

                              addSheet({
                                id: sheetId,
                                name: sheetData.name || `Sheet${i + 1}`,
                                index: i,
                                cells: sheetData.cells || {}
                              });
                            }
                          }
                        } catch (err) {
                          loggers.ui.error('Error loading recent file:', err);
                          alert('Could not load file. Please open it again from disk.');
                        }
                      } else {
                        // Demo files or files without saved data
                        alert('This file needs to be opened again from disk.\nClick "Browse Files" to select your file.');
                      }
                      onClose();
                    }}
                  />
                ))
              ) : (
                <div className="file-menu__recent-empty">
                  <FolderOpen size={32} />
                  <p>No recent files</p>
                </div>
              )}
            </div>
            <input
              type="file"
              id="file-input-open"
              accept=".xlsx,.xls,.csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileOpen}
            />
            <button
              className="file-menu__browse-btn"
              onClick={() => document.getElementById('file-input-open')?.click()}
            >
              <FolderOpen size={16} />
              Browse Files
            </button>
          </div>
        );
      case 'saveas':
        return <SaveAsSubmenu onSelect={(format) => handleExport(format)} />;
      case 'print':
        return <PrintSubmenu onSelect={(action) => handleMenuAction('print', action)} />;
      case 'encrypt':
        return <EncryptSubmenu onSelect={(action) => handleMenuAction('encrypt', action)} />;
      case 'backup':
        return <BackupSubmenu onSelect={(action) => handleMenuAction('backup', action)} />;
      case 'help':
        return <HelpSubmenu onSelect={(action) => handleMenuAction('help', action)} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="file-menu__overlay" onClick={onClose}>
      <div className="file-menu" onClick={e => e.stopPropagation()}>
        {/* Sidebar */}
        <div className="file-menu__sidebar">
          {menuItems.map(item => (
            <MenuItemComponent
              key={item.id}
              item={item}
              isActive={activeMenu === item.id}
              onClick={() => {
                setActiveMenu(item.id);
                if (!item.hasSubmenu) {
                  handleMenuAction(item.id);
                }
              }}
            />
          ))}
        </div>

        {/* Content Panel */}
        <div className="file-menu__content">
          {renderSubmenu()}
        </div>
      </div>
    </div>
  );
};

export default FileMenu;
