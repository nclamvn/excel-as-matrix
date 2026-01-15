import React, { useState } from 'react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useFindStore } from '../../stores/findStore';
import { ImportDialog, ExportDialog } from '../FileIO';
import { useFileImport } from '../../hooks/useFileImport';
import { useFileExport } from '../../hooks/useFileExport';
import { UndoRedoButtons } from '../UndoRedo';

interface ToolbarProps {
  workbookName: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ workbookName }) => {
  const { sheets, activeSheetId } = useWorkbookStore();
  const { open: openFind } = useFindStore();
  const { importFromPreview, isImporting, progress } = useFileImport();
  const { exportWorkbook } = useFileExport();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const activeSheet = activeSheetId ? sheets[activeSheetId] : null;
  const sheetNames = Object.values(sheets).map((s) => s.name);

  return (
    <div className="toolbar">
      {/* App name */}
      <div className="flex items-center gap-3 px-2">
        <div className="font-bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          <span className="text-green-800">Excel</span>
          <span className="text-gray-400"> - </span>
          <span className="text-amber-700">Claude Code</span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <span className="text-sm text-gray-600">
          {workbookName || 'Untitled Workbook'}
        </span>
        {activeSheet && (
          <span className="text-xs text-gray-500">/ {activeSheet.name}</span>
        )}
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <UndoRedoButtons />

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Find */}
      <button
        className="toolbar-btn"
        onClick={() => openFind(false)}
        title="Find (Ctrl+F)"
      >
        Find
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* File Operations */}
      <div className="flex items-center gap-1">
        <button
          className="toolbar-btn"
          onClick={() => setShowImportDialog(true)}
          title="Import file"
        >
          Import
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setShowExportDialog(true)}
          title="Export workbook"
        >
          Export
        </button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Status */}
      <div className="text-xs text-gray-500 px-2">
        v1.0.0
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={(data, options) => {
          importFromPreview(data, options);
          setShowImportDialog(false);
        }}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={async (_format, options) => {
          await exportWorkbook(options);
        }}
        sheetNames={sheetNames}
      />

      {/* Import Loading Overlay */}
      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl p-6 min-w-[300px]">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Importing Data...</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{progress}% complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
