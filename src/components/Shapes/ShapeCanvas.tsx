// ============================================================
// SHAPE CANVAS — Overlay for rendering shapes
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { useShapesStore } from '../../stores/shapesStore';
import { ShapeRenderer } from './ShapeRenderer';
import { ResizeHandle } from '../../types/shapes';
import './Shapes.css';

interface ShapeCanvasProps {
  sheetId: string;
}

export const ShapeCanvas: React.FC<ShapeCanvasProps> = ({ sheetId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; shapeX: number; shapeY: number } | null>(null);
  const resizeStart = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    shapeX: number;
    shapeY: number;
  } | null>(null);

  const {
    getShapesForSheet,
    selection,
    selectShape,
    clearSelection,
    setSelectionState,
    moveShape,
    resizeShape,
    deleteShape,
    getShapeById,
  } = useShapesStore();

  const shapes = getShapesForSheet(sheetId);
  const selectedShape = selection.shapeId
    ? getShapeById(sheetId, selection.shapeId)
    : null;

  // Handle mouse down on canvas (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  // Handle shape selection
  const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    const shape = getShapeById(sheetId, shapeId);
    if (!shape || shape.locked) return;

    selectShape(shapeId);

    // Start dragging
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      shapeX: shape.x,
      shapeY: shape.y,
    };
    setSelectionState({ isDragging: true });
  };

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    if (!selectedShape) return;

    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: selectedShape.width,
      height: selectedShape.height,
      shapeX: selectedShape.x,
      shapeY: selectedShape.y,
    };
    setSelectionState({ isResizing: true, resizeHandle: handle });
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selection.shapeId) return;

    // Dragging
    if (selection.isDragging && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      moveShape(
        sheetId,
        selection.shapeId,
        dragStart.current.shapeX + dx,
        dragStart.current.shapeY + dy
      );
    }

    // Resizing
    if (selection.isResizing && resizeStart.current && selection.resizeHandle) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;

      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newX = resizeStart.current.shapeX;
      let newY = resizeStart.current.shapeY;

      const handle = selection.resizeHandle;

      // Calculate new dimensions based on handle
      if (handle.includes('e')) {
        newWidth = resizeStart.current.width + dx;
      }
      if (handle.includes('w')) {
        newWidth = resizeStart.current.width - dx;
        newX = resizeStart.current.shapeX + dx;
      }
      if (handle.includes('s')) {
        newHeight = resizeStart.current.height + dy;
      }
      if (handle.includes('n')) {
        newHeight = resizeStart.current.height - dy;
        newY = resizeStart.current.shapeY + dy;
      }

      // Apply minimum size
      if (newWidth >= 20 && newHeight >= 20) {
        resizeShape(sheetId, selection.shapeId, newWidth, newHeight);
        if (handle.includes('w') || handle.includes('n')) {
          moveShape(sheetId, selection.shapeId, newX, newY);
        }
      }
    }
  }, [selection, sheetId, moveShape, resizeShape]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    dragStart.current = null;
    resizeStart.current = null;
    setSelectionState({
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
    });
  }, [setSelectionState]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selection.shapeId) return;

      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteShape(sheetId, selection.shapeId);
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.shapeId, sheetId, deleteShape, clearSelection]);

  // Mouse event listeners
  useEffect(() => {
    if (selection.isDragging || selection.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [selection.isDragging, selection.isResizing, handleMouseMove, handleMouseUp]);

  if (shapes.length === 0) return null;

  return (
    <div
      ref={canvasRef}
      className="shape-canvas"
      onClick={handleCanvasClick}
    >
      {shapes.map(shape => (
        <div
          key={shape.id}
          className={`shape-wrapper ${selection.shapeId === shape.id ? 'selected' : ''}`}
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
            zIndex: shape.zIndex,
          }}
          onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
        >
          <ShapeRenderer shape={shape} />

          {/* Selection handles */}
          {selection.shapeId === shape.id && !shape.locked && (
            <div className="shape-handles">
              {(['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as ResizeHandle[]).map(handle => (
                <div
                  key={handle}
                  className={`resize-handle handle-${handle}`}
                  onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                />
              ))}
              {/* Rotate handle */}
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleResizeMouseDown(e, 'rotate')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ShapeCanvas;
