// ============================================================
// SHAPES STORE — Zustand Store for Shape Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  ShapeObject,
  ShapeStyle,
  ShapeTextStyle,
  ShapeSelection,
  DEFAULT_SHAPE_STYLE,
  DEFAULT_TEXT_STYLE,
} from '../types/shapes';
import { getShapeById } from '../data/shapeDefinitions';

interface ShapesStore {
  // State
  shapes: Record<string, ShapeObject[]>;  // sheetId -> shapes
  selection: ShapeSelection;
  recentShapeIds: string[];
  clipboard: ShapeObject | null;

  // Shape CRUD
  addShape: (sheetId: string, shapeId: string, x: number, y: number) => string;
  updateShape: (sheetId: string, id: string, updates: Partial<ShapeObject>) => void;
  deleteShape: (sheetId: string, id: string) => void;
  duplicateShape: (sheetId: string, id: string) => string | null;

  // Selection
  selectShape: (id: string | null) => void;
  clearSelection: () => void;
  setSelectionState: (updates: Partial<ShapeSelection>) => void;

  // Style
  updateShapeStyle: (sheetId: string, id: string, style: Partial<ShapeStyle>) => void;
  updateShapeText: (sheetId: string, id: string, text: Partial<ShapeTextStyle>) => void;

  // Position & Size
  moveShape: (sheetId: string, id: string, x: number, y: number) => void;
  resizeShape: (sheetId: string, id: string, width: number, height: number) => void;
  rotateShape: (sheetId: string, id: string, rotation: number) => void;

  // Z-Index
  bringToFront: (sheetId: string, id: string) => void;
  sendToBack: (sheetId: string, id: string) => void;
  bringForward: (sheetId: string, id: string) => void;
  sendBackward: (sheetId: string, id: string) => void;

  // Clipboard
  copyShape: (sheetId: string, id: string) => void;
  pasteShape: (sheetId: string, x: number, y: number) => string | null;

  // Getters
  getShapesForSheet: (sheetId: string) => ShapeObject[];
  getShapeById: (sheetId: string, id: string) => ShapeObject | undefined;
  getSelectedShape: (sheetId: string) => ShapeObject | undefined;
}

export const useShapesStore = create<ShapesStore>()(
  persist(
    (set, get) => ({
      shapes: {},
      selection: {
        shapeId: null,
        isResizing: false,
        isRotating: false,
        isDragging: false,
        resizeHandle: null,
      },
      recentShapeIds: [],
      clipboard: null,

      // ─────────────────────────────────────────────────────────
      // SHAPE CRUD
      // ─────────────────────────────────────────────────────────

      addShape: (sheetId, shapeId, x, y) => {
        const shapeDef = getShapeById(shapeId);
        if (!shapeDef) return '';

        const id = nanoid(8);
        const shapes = get().shapes[sheetId] || [];
        const maxZ = shapes.length > 0
          ? Math.max(...shapes.map(s => s.zIndex))
          : 0;

        const newShape: ShapeObject = {
          id,
          shapeId,
          sheetId,
          x,
          y,
          width: shapeDef.defaultWidth,
          height: shapeDef.defaultHeight,
          rotation: 0,
          style: { ...DEFAULT_SHAPE_STYLE },
          textStyle: shapeDef.hasText ? { ...DEFAULT_TEXT_STYLE } : undefined,
          locked: false,
          hidden: false,
          zIndex: maxZ + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Update recent shapes
        const recentIds = [shapeId, ...get().recentShapeIds.filter(rid => rid !== shapeId)].slice(0, 8);

        set(state => ({
          shapes: {
            ...state.shapes,
            [sheetId]: [...(state.shapes[sheetId] || []), newShape],
          },
          selection: { ...state.selection, shapeId: id },
          recentShapeIds: recentIds,
        }));

        return id;
      },

      updateShape: (sheetId, id, updates) => {
        set(state => ({
          shapes: {
            ...state.shapes,
            [sheetId]: (state.shapes[sheetId] || []).map(shape =>
              shape.id === id
                ? { ...shape, ...updates, updatedAt: Date.now() }
                : shape
            ),
          },
        }));
      },

      deleteShape: (sheetId, id) => {
        set(state => ({
          shapes: {
            ...state.shapes,
            [sheetId]: (state.shapes[sheetId] || []).filter(s => s.id !== id),
          },
          selection: state.selection.shapeId === id
            ? { ...state.selection, shapeId: null }
            : state.selection,
        }));
      },

      duplicateShape: (sheetId, id) => {
        const shape = get().getShapeById(sheetId, id);
        if (!shape) return null;

        const newId = nanoid(8);
        const shapes = get().shapes[sheetId] || [];
        const maxZ = Math.max(...shapes.map(s => s.zIndex), 0);

        const newShape: ShapeObject = {
          ...shape,
          id: newId,
          x: shape.x + 20,
          y: shape.y + 20,
          zIndex: maxZ + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          shapes: {
            ...state.shapes,
            [sheetId]: [...(state.shapes[sheetId] || []), newShape],
          },
          selection: { ...state.selection, shapeId: newId },
        }));

        return newId;
      },

      // ─────────────────────────────────────────────────────────
      // SELECTION
      // ─────────────────────────────────────────────────────────

      selectShape: (id) => {
        set(state => ({
          selection: { ...state.selection, shapeId: id },
        }));
      },

      clearSelection: () => {
        set(state => ({
          selection: {
            ...state.selection,
            shapeId: null,
            isResizing: false,
            isRotating: false,
            isDragging: false,
            resizeHandle: null,
          },
        }));
      },

      setSelectionState: (updates) => {
        set(state => ({
          selection: { ...state.selection, ...updates },
        }));
      },

      // ─────────────────────────────────────────────────────────
      // STYLE
      // ─────────────────────────────────────────────────────────

      updateShapeStyle: (sheetId, id, style) => {
        const shape = get().getShapeById(sheetId, id);
        if (!shape) return;

        get().updateShape(sheetId, id, {
          style: { ...shape.style, ...style },
        });
      },

      updateShapeText: (sheetId, id, text) => {
        const shape = get().getShapeById(sheetId, id);
        if (!shape || !shape.textStyle) return;

        get().updateShape(sheetId, id, {
          textStyle: { ...shape.textStyle, ...text },
        });
      },

      // ─────────────────────────────────────────────────────────
      // POSITION & SIZE
      // ─────────────────────────────────────────────────────────

      moveShape: (sheetId, id, x, y) => {
        get().updateShape(sheetId, id, { x, y });
      },

      resizeShape: (sheetId, id, width, height) => {
        get().updateShape(sheetId, id, {
          width: Math.max(20, width),
          height: Math.max(20, height),
        });
      },

      rotateShape: (sheetId, id, rotation) => {
        get().updateShape(sheetId, id, { rotation: rotation % 360 });
      },

      // ─────────────────────────────────────────────────────────
      // Z-INDEX
      // ─────────────────────────────────────────────────────────

      bringToFront: (sheetId, id) => {
        const shapes = get().shapes[sheetId] || [];
        const maxZ = Math.max(...shapes.map(s => s.zIndex), 0);
        get().updateShape(sheetId, id, { zIndex: maxZ + 1 });
      },

      sendToBack: (sheetId, id) => {
        const shapes = get().shapes[sheetId] || [];
        const minZ = Math.min(...shapes.map(s => s.zIndex), 0);
        get().updateShape(sheetId, id, { zIndex: minZ - 1 });
      },

      bringForward: (sheetId, id) => {
        const shape = get().getShapeById(sheetId, id);
        if (shape) {
          get().updateShape(sheetId, id, { zIndex: shape.zIndex + 1 });
        }
      },

      sendBackward: (sheetId, id) => {
        const shape = get().getShapeById(sheetId, id);
        if (shape) {
          get().updateShape(sheetId, id, { zIndex: shape.zIndex - 1 });
        }
      },

      // ─────────────────────────────────────────────────────────
      // CLIPBOARD
      // ─────────────────────────────────────────────────────────

      copyShape: (sheetId, id) => {
        const shape = get().getShapeById(sheetId, id);
        if (shape) {
          set({ clipboard: { ...shape } });
        }
      },

      pasteShape: (sheetId, x, y) => {
        const clipboard = get().clipboard;
        if (!clipboard) return null;

        const id = nanoid(8);
        const shapes = get().shapes[sheetId] || [];
        const maxZ = Math.max(...shapes.map(s => s.zIndex), 0);

        const newShape: ShapeObject = {
          ...clipboard,
          id,
          sheetId,
          x,
          y,
          zIndex: maxZ + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          shapes: {
            ...state.shapes,
            [sheetId]: [...(state.shapes[sheetId] || []), newShape],
          },
          selection: { ...state.selection, shapeId: id },
        }));

        return id;
      },

      // ─────────────────────────────────────────────────────────
      // GETTERS
      // ─────────────────────────────────────────────────────────

      getShapesForSheet: (sheetId) => {
        return (get().shapes[sheetId] || [])
          .filter(s => !s.hidden)
          .sort((a, b) => a.zIndex - b.zIndex);
      },

      getShapeById: (sheetId, id) => {
        return (get().shapes[sheetId] || []).find(s => s.id === id);
      },

      getSelectedShape: (sheetId) => {
        const { shapeId } = get().selection;
        if (!shapeId) return undefined;
        return get().getShapeById(sheetId, shapeId);
      },
    }),
    {
      name: 'excelai-shapes',
      partialize: (state) => ({
        shapes: state.shapes,
        recentShapeIds: state.recentShapeIds,
      }),
    }
  )
);

export default useShapesStore;
