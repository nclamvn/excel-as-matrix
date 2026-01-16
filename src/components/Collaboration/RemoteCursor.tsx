// =============================================================================
// REMOTE CURSOR — Shows other users' cursor positions (Blueprint §6.3)
// =============================================================================

import React, { useEffect, useState } from 'react';
import type { RemoteCursor as RemoteCursorType, CollaborationUser } from '../../collaboration/types';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface RemoteCursorProps {
  cursor: RemoteCursorType;
  cellWidth: number;
  cellHeight: number;
  getCellPosition: (row: number, col: number) => { x: number; y: number } | null;
  showLabel?: boolean;
  fadeTimeout?: number;
}

interface RemoteCursorsOverlayProps {
  cursors: RemoteCursorType[];
  cellWidth: number;
  cellHeight: number;
  getCellPosition: (row: number, col: number) => { x: number; y: number } | null;
  showLabels?: boolean;
}

// -----------------------------------------------------------------------------
// Single Remote Cursor
// -----------------------------------------------------------------------------

export const RemoteCursor: React.FC<RemoteCursorProps> = ({
  cursor,
  cellWidth,
  cellHeight,
  getCellPosition,
  showLabel = true,
  fadeTimeout = 3000,
}) => {
  const [isActive, setIsActive] = useState(true);
  const [isFading, setIsFading] = useState(false);

  // Fade out cursor after inactivity
  useEffect(() => {
    setIsActive(true);
    setIsFading(false);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, fadeTimeout);

    const hideTimer = setTimeout(() => {
      setIsActive(false);
    }, fadeTimeout + 500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [cursor.position.row, cursor.position.col, cursor.position.timestamp, fadeTimeout]);

  const position = getCellPosition(cursor.position.row, cursor.position.col);
  if (!position || !isActive) return null;

  const { user } = cursor;

  return (
    <div
      className={`remote-cursor ${isFading ? 'remote-cursor--fading' : ''} ${cursor.isTyping ? 'remote-cursor--typing' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: cellWidth,
        height: cellHeight,
        '--cursor-color': user.color,
      } as React.CSSProperties}
    >
      {/* Cursor border */}
      <div
        className="remote-cursor__border"
        style={{ borderColor: user.color }}
      />

      {/* User label */}
      {showLabel && (
        <div
          className="remote-cursor__label"
          style={{ backgroundColor: user.color }}
        >
          <span className="remote-cursor__name">{user.name}</span>
          {cursor.isTyping && (
            <span className="remote-cursor__typing">
              <span className="remote-cursor__typing-dot" />
              <span className="remote-cursor__typing-dot" />
              <span className="remote-cursor__typing-dot" />
            </span>
          )}
        </div>
      )}

      {/* Caret indicator */}
      <div
        className="remote-cursor__caret"
        style={{ backgroundColor: user.color }}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// Remote Cursors Overlay (for grid)
// -----------------------------------------------------------------------------

export const RemoteCursorsOverlay: React.FC<RemoteCursorsOverlayProps> = ({
  cursors,
  cellWidth,
  cellHeight,
  getCellPosition,
  showLabels = true,
}) => {
  if (cursors.length === 0) return null;

  return (
    <div className="remote-cursors-overlay">
      {cursors.map((cursor) => (
        <RemoteCursor
          key={cursor.user.id}
          cursor={cursor}
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
// Cursor Label Only (for minimap or compact view)
// -----------------------------------------------------------------------------

interface CursorLabelProps {
  user: CollaborationUser;
  position: string; // e.g., "A1", "B5"
  isTyping?: boolean;
}

export const CursorLabel: React.FC<CursorLabelProps> = ({
  user,
  position,
  isTyping = false,
}) => {
  return (
    <div
      className="cursor-label"
      style={{ backgroundColor: user.color }}
    >
      <span className="cursor-label__name">{user.name}</span>
      <span className="cursor-label__position">{position}</span>
      {isTyping && <span className="cursor-label__typing">typing...</span>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Hook for cursor position calculation
// -----------------------------------------------------------------------------

interface CellBounds {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function useVisibleCursors(
  allCursors: RemoteCursorType[],
  visibleBounds: CellBounds,
  currentSheetId: string
): RemoteCursorType[] {
  return allCursors.filter((cursor) => {
    // Only show cursors on current sheet
    if (cursor.position.sheetId !== currentSheetId) return false;

    // Check if cursor is within visible bounds
    const { row, col } = cursor.position;
    return (
      row >= visibleBounds.startRow &&
      row <= visibleBounds.endRow &&
      col >= visibleBounds.startCol &&
      col <= visibleBounds.endCol
    );
  });
}

export default RemoteCursor;
