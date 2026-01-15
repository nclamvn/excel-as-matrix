// Phase 4: User Cursors - Shows other users' cursor positions
import React from 'react';
import { useRemoteCursors } from '../../hooks/usePresence';

interface UserCursorsProps {
  sheetId: string;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
  getCellPosition: (row: number, col: number) => { x: number; y: number; width: number; height: number } | null;
}

export const UserCursors: React.FC<UserCursorsProps> = ({
  sheetId,
  visibleRows,
  visibleCols,
  getCellPosition,
}) => {
  const cursors = useRemoteCursors({ sheetId, visibleRows, visibleCols });

  return (
    <div className="user-cursors" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {cursors.map((cursor) => {
        const position = getCellPosition(cursor.row, cursor.col);
        if (!position) return null;

        return (
          <CursorIndicator
            key={cursor.userId}
            displayName={cursor.displayName}
            avatarUrl={cursor.avatarUrl}
            color={cursor.color}
            x={position.x}
            y={position.y}
            cellWidth={position.width}
            cellHeight={position.height}
          />
        );
      })}
    </div>
  );
};

interface CursorIndicatorProps {
  displayName: string;
  avatarUrl?: string;
  color: string;
  x: number;
  y: number;
  cellWidth: number;
  cellHeight: number;
}

const CursorIndicator: React.FC<CursorIndicatorProps> = ({
  displayName,
  avatarUrl,
  color,
  x,
  y,
  cellWidth,
  cellHeight,
}) => {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: cellWidth,
        height: cellHeight,
        pointerEvents: 'none',
      }}
    >
      {/* Cell highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `2px solid ${color}`,
          borderRadius: 2,
          backgroundColor: `${color}15`,
        }}
      />

      {/* Name tag */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 6px',
          backgroundColor: color,
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 500,
          color: 'white',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
        )}
        {displayName}
      </div>

      {/* Cursor pointer */}
      <svg
        style={{
          position: 'absolute',
          top: -4,
          left: -4,
          width: 16,
          height: 16,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        }}
        viewBox="0 0 16 16"
      >
        <path
          d="M0 0 L16 12 L8 12 L4 16 Z"
          fill={color}
        />
      </svg>
    </div>
  );
};

export default UserCursors;
