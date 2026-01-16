// =============================================================================
// REMOTE SELECTION — Shows other users' selected ranges (Blueprint §6.3)
// =============================================================================

import React from 'react';
import type { RemoteSelection as RemoteSelectionType, CollaborationUser } from '../../collaboration/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface RemoteSelectionProps {
  selection: RemoteSelectionType;
  cellWidth: number;
  cellHeight: number;
  getCellPosition: (row: number, col: number) => { x: number; y: number } | null;
  showLabel?: boolean;
}

interface RemoteSelectionsOverlayProps {
  selections: RemoteSelectionType[];
  cellWidth: number;
  cellHeight: number;
  getCellPosition: (row: number, col: number) => { x: number; y: number } | null;
  showLabels?: boolean;
}

// -----------------------------------------------------------------------------
// Single Remote Selection
// -----------------------------------------------------------------------------

export const RemoteSelection: React.FC<RemoteSelectionProps> = ({
  selection,
  cellWidth,
  cellHeight,
  getCellPosition,
  showLabel = true,
}) => {
  const { user, range } = selection;

  // Get positions for start and end cells
  const startPos = getCellPosition(range.startRow, range.startCol);
  const endPos = getCellPosition(range.endRow, range.endCol);

  if (!startPos || !endPos) return null;

  // Calculate selection bounds
  const left = Math.min(startPos.x, endPos.x);
  const top = Math.min(startPos.y, endPos.y);
  const width = Math.abs(endPos.x - startPos.x) + cellWidth;
  const height = Math.abs(endPos.y - startPos.y) + cellHeight;

  // Calculate cell count
  const rowCount = Math.abs(range.endRow - range.startRow) + 1;
  const colCount = Math.abs(range.endCol - range.startCol) + 1;
  const cellCount = rowCount * colCount;

  return (
    <div
      className="remote-selection"
      style={{
        left,
        top,
        width,
        height,
        '--selection-color': user.color,
        backgroundColor: `${user.color}20`,
        borderColor: user.color,
      } as React.CSSProperties}
    >
      {/* Selection border */}
      <div
        className="remote-selection__border"
        style={{ borderColor: user.color }}
      />

      {/* User label */}
      {showLabel && (
        <div
          className="remote-selection__label"
          style={{ backgroundColor: user.color }}
        >
          <span className="remote-selection__name">{user.name}</span>
          {cellCount > 1 && (
            <span className="remote-selection__count">
              {rowCount}x{colCount}
            </span>
          )}
        </div>
      )}

      {/* Corner indicators */}
      <div
        className="remote-selection__corner remote-selection__corner--tl"
        style={{ backgroundColor: user.color }}
      />
      <div
        className="remote-selection__corner remote-selection__corner--tr"
        style={{ backgroundColor: user.color }}
      />
      <div
        className="remote-selection__corner remote-selection__corner--bl"
        style={{ backgroundColor: user.color }}
      />
      <div
        className="remote-selection__corner remote-selection__corner--br"
        style={{ backgroundColor: user.color }}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Remote Selections Overlay (for grid)
// -----------------------------------------------------------------------------

export const RemoteSelectionsOverlay: React.FC<RemoteSelectionsOverlayProps> = ({
  selections,
  cellWidth,
  cellHeight,
  getCellPosition,
  showLabels = true,
}) => {
  if (selections.length === 0) return null;

  return (
    <div className="remote-selections-overlay">
      {selections.map((selection) => (
        <RemoteSelection
          key={selection.user.id}
          selection={selection}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          getCellPosition={getCellPosition}
          showLabel={showLabels}
        />
      ))}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Selection Info (for status bar)
// -----------------------------------------------------------------------------

interface SelectionInfoProps {
  user: CollaborationUser;
  range: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
}

export const SelectionInfo: React.FC<SelectionInfoProps> = ({ user, range }) => {
  const colToLetter = (col: number): string => {
    let result = '';
    let c = col + 1;
    while (c > 0) {
      c--;
      result = String.fromCharCode(65 + (c % 26)) + result;
      c = Math.floor(c / 26);
    }
    return result;
  };

  const startRef = `${colToLetter(range.startCol)}${range.startRow + 1}`;
  const endRef = `${colToLetter(range.endCol)}${range.endRow + 1}`;
  const rangeText = startRef === endRef ? startRef : `${startRef}:${endRef}`;

  return (
    <div className="selection-info" style={{ borderColor: user.color }}>
      <span
        className="selection-info__dot"
        style={{ backgroundColor: user.color }}
      />
      <span className="selection-info__name">{user.name}</span>
      <span className="selection-info__range">{rangeText}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Hook for visible selections
// -----------------------------------------------------------------------------

interface CellBounds {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function useVisibleSelections(
  allSelections: RemoteSelectionType[],
  visibleBounds: CellBounds,
  currentSheetId: string
): RemoteSelectionType[] {
  return allSelections.filter((selection) => {
    // Only show selections on current sheet
    if (selection.range.sheetId !== currentSheetId) return false;

    // Check if selection intersects with visible bounds
    const { startRow, startCol, endRow, endCol } = selection.range;
    return !(
      endRow < visibleBounds.startRow ||
      startRow > visibleBounds.endRow ||
      endCol < visibleBounds.startCol ||
      startCol > visibleBounds.endCol
    );
  });
}

export default RemoteSelection;
