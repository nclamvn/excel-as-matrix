import React, { useState } from 'react';
import { SheetTab } from './SheetTab';
import { SheetNavigation } from './SheetNavigation';
import { AddSheetButton } from './AddSheetButton';
import { SheetContextMenu } from './SheetContextMenu';
import { useWorkbookStore } from '../../stores/workbookStore';

export const SheetTabBar: React.FC = () => {
  const { sheets, activeSheetId, setActiveSheet, addSheet, renameSheet } = useWorkbookStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sheetId: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, sheetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, sheetId });
  };

  const sheetList = Object.values(sheets);

  return (
    <div className="sheet-tab-bar">
      <SheetNavigation />

      <div className="sheet-tabs-container">
        {sheetList.map((sheet) => (
          <SheetTab
            key={sheet.id}
            id={sheet.id}
            name={sheet.name}
            color={sheet.tabColor}
            isActive={sheet.id === activeSheetId}
            onClick={() => setActiveSheet(sheet.id)}
            onContextMenu={(e) => handleContextMenu(e, sheet.id)}
            onRename={renameSheet}
          />
        ))}
        <AddSheetButton onClick={() => {
          const newSheet = {
            id: `sheet-${Date.now()}`,
            name: `Sheet${sheetList.length + 1}`,
            index: sheetList.length,
            cells: {},
          };
          addSheet(newSheet);
        }} />
      </div>

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
