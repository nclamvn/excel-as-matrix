import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { SheetContextMenu } from '../SheetTabs/SheetContextMenu';

export const SheetTabs2026: React.FC = () => {
  const { sheets, activeSheetId, setActiveSheet, addSheet } = useWorkbookStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sheetId: string } | null>(null);

  const sheetList = Object.values(sheets);

  const handleContextMenu = (e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sheetId });
  };

  const handleAddSheet = () => {
    const newSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet${sheetList.length + 1}`,
      index: sheetList.length,
      cells: {},
    };
    addSheet(newSheet);
  };

  return (
    <div className="sheet-tabs-2026">
      <div className="sheet-tabs-2026__nav">
        <button className="sheet-tabs-2026__nav-btn" title="Previous sheets">
          <ChevronLeft />
        </button>
        <button className="sheet-tabs-2026__nav-btn" title="Next sheets">
          <ChevronRight />
        </button>
      </div>

      <div className="sheet-tabs-2026__list">
        {sheetList.map((sheet) => (
          <button
            key={sheet.id}
            className={`sheet-tab-2026 ${sheet.id === activeSheetId ? 'sheet-tab-2026--active' : ''}`}
            onClick={() => setActiveSheet(sheet.id)}
            onContextMenu={(e) => handleContextMenu(e, sheet.id)}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      <button
        className="sheet-tabs-2026__add"
        onClick={handleAddSheet}
        title="Add sheet"
      >
        <Plus />
      </button>

      {contextMenu && (
        <SheetContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sheetId={contextMenu.sheetId}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
