import React, { useState } from 'react';
import {
  ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { SheetContextMenu } from './SheetContextMenu';

export const SheetTabBarPremium: React.FC = () => {
  const { sheets, activeSheetId, setActiveSheet, addSheet } = useWorkbookStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sheetId: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sheetId });
  };

  const sheetList = Object.values(sheets);

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
    <div className="sheet-tabs-premium">
      {/* Navigation Buttons */}
      <div className="sheet-tabs__nav">
        <button className="sheet-tabs__nav-btn" title="First Sheet">
          <ChevronFirst />
        </button>
        <button className="sheet-tabs__nav-btn" title="Previous Sheet">
          <ChevronLeft />
        </button>
        <button className="sheet-tabs__nav-btn" title="Next Sheet">
          <ChevronRight />
        </button>
        <button className="sheet-tabs__nav-btn" title="Last Sheet">
          <ChevronLast />
        </button>
      </div>

      <div className="sheet-tabs__divider" />

      {/* Sheet Tabs */}
      <div className="sheet-tabs__container">
        {sheetList.map((sheet) => (
          <button
            key={sheet.id}
            className={`sheet-tab-premium ${sheet.id === activeSheetId ? 'sheet-tab-premium--active' : ''}`}
            onClick={() => setActiveSheet(sheet.id)}
            onContextMenu={(e) => handleContextMenu(e, sheet.id)}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      {/* Add Sheet Button */}
      <button
        className="sheet-tabs__add-btn"
        onClick={handleAddSheet}
        title="New Sheet"
      >
        <Plus />
      </button>

      {/* Context Menu */}
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
