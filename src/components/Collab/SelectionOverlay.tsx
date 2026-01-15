// Phase 4: Selection Overlay - Shows other users' selections
import React from 'react';
import { useSelectionOverlays } from '../../hooks/usePresence';

interface SelectionOverlayProps {
  sheetId: string;
  visibleRows: { start: number; end: number };
  visibleCols: { start: number; end: number };
  getSelectionBounds: (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number
  ) => { x: number; y: number; width: number; height: number } | null;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  sheetId,
  visibleRows,
  visibleCols,
  getSelectionBounds,
}) => {
  const overlays = useSelectionOverlays({ sheetId, visibleRows, visibleCols });

  return (
    <div className="selection-overlays" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {overlays.map((overlay) => {
        const bounds = getSelectionBounds(
          overlay.startRow,
          overlay.startCol,
          overlay.endRow,
          overlay.endCol
        );
        if (!bounds) return null;

        return (
          <SelectionHighlight
            key={overlay.userId}
            displayName={overlay.displayName}
            color={overlay.color}
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
          />
        );
      })}
    </div>
  );
};

interface SelectionHighlightProps {
  displayName: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  displayName,
  color,
  x,
  y,
  width,
  height,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        pointerEvents: 'none',
      }}
    >
      {/* Selection fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}`,
          borderRadius: 2,
        }}
      />

      {/* User label at top-right corner */}
      <div
        style={{
          position: 'absolute',
          top: -18,
          right: 0,
          padding: '2px 6px',
          backgroundColor: color,
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 500,
          color: 'white',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        {displayName}
      </div>
    </div>
  );
};

// Component for showing cell-level editing indicators
interface CellEditingIndicatorProps {
  color: string;
  userName: string;
}

export const CellEditingIndicator: React.FC<CellEditingIndicatorProps> = ({
  color,
  userName,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        border: `2px solid ${color}`,
        borderRadius: 2,
        pointerEvents: 'none',
        animation: 'pulse 2s infinite',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: 0,
          padding: '1px 4px',
          backgroundColor: color,
          borderRadius: 2,
          fontSize: 9,
          color: 'white',
          whiteSpace: 'nowrap',
        }}
      >
        {userName} editing...
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default SelectionOverlay;
