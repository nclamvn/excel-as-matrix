// ============================================================
// PICTURE CANVAS — Overlay for rendering pictures
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { usePicturesStore } from '../../stores/picturesStore';
import { ResizeHandle } from '../../types/pictures';
import './Pictures.css';

interface PictureCanvasProps {
  sheetId: string;
}

export const PictureCanvas: React.FC<PictureCanvasProps> = ({ sheetId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; picX: number; picY: number } | null>(null);
  const resizeStart = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    picX: number;
    picY: number;
  } | null>(null);

  const {
    getPicturesForSheet,
    selection,
    selectPicture,
    clearSelection,
    setSelectionState,
    movePicture,
    resizePicture,
    deletePicture,
    getPictureById,
  } = usePicturesStore();

  const pictures = getPicturesForSheet(sheetId);
  const selectedPicture = selection.pictureId
    ? getPictureById(sheetId, selection.pictureId)
    : null;

  // Handle canvas click (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection();
    }
  };

  // Handle picture selection
  const handlePictureMouseDown = (e: React.MouseEvent, pictureId: string) => {
    e.stopPropagation();
    const picture = getPictureById(sheetId, pictureId);
    if (!picture || picture.locked) return;

    selectPicture(pictureId);

    // Start dragging
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      picX: picture.x,
      picY: picture.y,
    };
    setSelectionState({ isDragging: true });
  };

  // Handle resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    if (!selectedPicture) return;

    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: selectedPicture.width,
      height: selectedPicture.height,
      picX: selectedPicture.x,
      picY: selectedPicture.y,
    };
    setSelectionState({ isResizing: true, resizeHandle: handle });
  };

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selection.pictureId) return;

    // Dragging
    if (selection.isDragging && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      movePicture(
        sheetId,
        selection.pictureId,
        dragStart.current.picX + dx,
        dragStart.current.picY + dy
      );
    }

    // Resizing
    if (selection.isResizing && resizeStart.current && selection.resizeHandle) {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;

      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newX = resizeStart.current.picX;
      let newY = resizeStart.current.picY;

      const handle = selection.resizeHandle;
      const shiftKey = e.shiftKey; // Hold Shift for aspect ratio

      // Calculate new dimensions based on handle
      if (handle.includes('e')) {
        newWidth = resizeStart.current.width + dx;
      }
      if (handle.includes('w')) {
        newWidth = resizeStart.current.width - dx;
        newX = resizeStart.current.picX + dx;
      }
      if (handle.includes('s')) {
        newHeight = resizeStart.current.height + dy;
      }
      if (handle.includes('n')) {
        newHeight = resizeStart.current.height - dy;
        newY = resizeStart.current.picY + dy;
      }

      // Apply minimum size
      if (newWidth >= 20 && newHeight >= 20) {
        resizePicture(sheetId, selection.pictureId, newWidth, newHeight, shiftKey);
        if (handle.includes('w') || handle.includes('n')) {
          movePicture(sheetId, selection.pictureId, newX, newY);
        }
      }
    }
  }, [selection, sheetId, movePicture, resizePicture]);

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
      if (!selection.pictureId) return;

      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deletePicture(sheetId, selection.pictureId);
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.pictureId, sheetId, deletePicture, clearSelection]);

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

  if (pictures.length === 0) return null;

  return (
    <div
      ref={canvasRef}
      className="picture-canvas"
      onClick={handleCanvasClick}
    >
      {pictures.map(picture => (
        <div
          key={picture.id}
          className={`picture-wrapper ${selection.pictureId === picture.id ? 'selected' : ''}`}
          style={{
            left: picture.x,
            top: picture.y,
            width: picture.width,
            height: picture.height,
            transform: picture.rotation ? `rotate(${picture.rotation}deg)` : undefined,
            zIndex: picture.zIndex + 200, // Above shapes
          }}
          onMouseDown={(e) => handlePictureMouseDown(e, picture.id)}
        >
          <img
            src={picture.src}
            alt={picture.originalName || 'Picture'}
            className="picture-image"
            style={{
              opacity: picture.opacity,
              borderRadius: picture.borderRadius,
              borderWidth: picture.borderWidth,
              borderColor: picture.borderColor,
              borderStyle: picture.borderWidth > 0 ? 'solid' : 'none',
              objectFit: 'cover',
              objectPosition: `${picture.cropLeft}% ${picture.cropTop}%`,
              boxShadow: picture.shadow
                ? `${picture.shadow.offsetX}px ${picture.shadow.offsetY}px ${picture.shadow.blur}px ${picture.shadow.spread}px ${picture.shadow.color}`
                : undefined,
            }}
            draggable={false}
          />

          {/* Selection handles */}
          {selection.pictureId === picture.id && !picture.locked && (
            <div className="picture-handles">
              {(['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as ResizeHandle[]).map(handle => (
                <div
                  key={handle}
                  className={`resize-handle handle-${handle}`}
                  onMouseDown={(e) => handleResizeMouseDown(e, handle)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PictureCanvas;
