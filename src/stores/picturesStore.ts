// ============================================================
// PICTURES STORE — Zustand Store for Image Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  PictureObject,
  PictureSelection,
  PictureShadow,
  DEFAULT_PICTURE_STYLE,
} from '../types/pictures';

interface PicturesStore {
  // State
  pictures: Record<string, PictureObject[]>;  // sheetId -> pictures
  selection: PictureSelection;

  // Picture CRUD
  addPicture: (sheetId: string, src: string, width: number, height: number, name?: string) => string;
  updatePicture: (sheetId: string, id: string, updates: Partial<PictureObject>) => void;
  deletePicture: (sheetId: string, id: string) => void;
  duplicatePicture: (sheetId: string, id: string) => string | null;

  // Selection
  selectPicture: (id: string | null) => void;
  clearSelection: () => void;
  setSelectionState: (updates: Partial<PictureSelection>) => void;

  // Position & Size
  movePicture: (sheetId: string, id: string, x: number, y: number) => void;
  resizePicture: (sheetId: string, id: string, width: number, height: number, maintainAspect?: boolean) => void;
  rotatePicture: (sheetId: string, id: string, rotation: number) => void;

  // Style
  updatePictureStyle: (sheetId: string, id: string, style: Partial<PictureObject>) => void;
  setShadow: (sheetId: string, id: string, shadow: PictureShadow | undefined) => void;

  // Crop
  setCrop: (sheetId: string, id: string, crop: { top: number; bottom: number; left: number; right: number }) => void;
  resetCrop: (sheetId: string, id: string) => void;

  // Z-Index
  bringToFront: (sheetId: string, id: string) => void;
  sendToBack: (sheetId: string, id: string) => void;

  // Getters
  getPicturesForSheet: (sheetId: string) => PictureObject[];
  getPictureById: (sheetId: string, id: string) => PictureObject | undefined;
  getSelectedPicture: (sheetId: string) => PictureObject | undefined;
}

export const usePicturesStore = create<PicturesStore>()(
  persist(
    (set, get) => ({
      pictures: {},
      selection: {
        pictureId: null,
        isResizing: false,
        isDragging: false,
        isCropping: false,
        resizeHandle: null,
      },

      // ─────────────────────────────────────────────────────────
      // PICTURE CRUD
      // ─────────────────────────────────────────────────────────

      addPicture: (sheetId, src, width, height, name) => {
        const id = nanoid(8);
        const pictures = get().pictures[sheetId] || [];
        const maxZ = pictures.length > 0
          ? Math.max(...pictures.map(p => p.zIndex))
          : 0;

        // Calculate initial position (center of visible area)
        const x = 100;
        const y = 100;

        // Scale down if too large
        const maxWidth = 600;
        const maxHeight = 400;
        let finalWidth = width;
        let finalHeight = height;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          finalWidth = width * scale;
          finalHeight = height * scale;
        }

        const newPicture: PictureObject = {
          id,
          sheetId,
          src,
          originalName: name,
          x,
          y,
          width: finalWidth,
          height: finalHeight,
          originalWidth: width,
          originalHeight: height,
          rotation: 0,
          ...DEFAULT_PICTURE_STYLE,
          locked: false,
          hidden: false,
          zIndex: maxZ + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          pictures: {
            ...state.pictures,
            [sheetId]: [...(state.pictures[sheetId] || []), newPicture],
          },
          selection: { ...state.selection, pictureId: id },
        }));

        return id;
      },

      updatePicture: (sheetId, id, updates) => {
        set(state => ({
          pictures: {
            ...state.pictures,
            [sheetId]: (state.pictures[sheetId] || []).map(pic =>
              pic.id === id
                ? { ...pic, ...updates, updatedAt: Date.now() }
                : pic
            ),
          },
        }));
      },

      deletePicture: (sheetId, id) => {
        set(state => ({
          pictures: {
            ...state.pictures,
            [sheetId]: (state.pictures[sheetId] || []).filter(p => p.id !== id),
          },
          selection: state.selection.pictureId === id
            ? { ...state.selection, pictureId: null }
            : state.selection,
        }));
      },

      duplicatePicture: (sheetId, id) => {
        const picture = get().getPictureById(sheetId, id);
        if (!picture) return null;

        const newId = nanoid(8);
        const pictures = get().pictures[sheetId] || [];
        const maxZ = Math.max(...pictures.map(p => p.zIndex), 0);

        const newPicture: PictureObject = {
          ...picture,
          id: newId,
          x: picture.x + 20,
          y: picture.y + 20,
          zIndex: maxZ + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set(state => ({
          pictures: {
            ...state.pictures,
            [sheetId]: [...(state.pictures[sheetId] || []), newPicture],
          },
          selection: { ...state.selection, pictureId: newId },
        }));

        return newId;
      },

      // ─────────────────────────────────────────────────────────
      // SELECTION
      // ─────────────────────────────────────────────────────────

      selectPicture: (id) => {
        set(state => ({
          selection: { ...state.selection, pictureId: id },
        }));
      },

      clearSelection: () => {
        set(state => ({
          selection: {
            ...state.selection,
            pictureId: null,
            isResizing: false,
            isDragging: false,
            isCropping: false,
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
      // POSITION & SIZE
      // ─────────────────────────────────────────────────────────

      movePicture: (sheetId, id, x, y) => {
        get().updatePicture(sheetId, id, { x, y });
      },

      resizePicture: (sheetId, id, width, height, maintainAspect = false) => {
        const picture = get().getPictureById(sheetId, id);
        if (!picture) return;

        let finalWidth = Math.max(20, width);
        let finalHeight = Math.max(20, height);

        if (maintainAspect) {
          const aspectRatio = picture.originalWidth / picture.originalHeight;
          // Determine which dimension changed more
          const widthChange = Math.abs(width - picture.width);
          const heightChange = Math.abs(height - picture.height);

          if (widthChange > heightChange) {
            finalHeight = finalWidth / aspectRatio;
          } else {
            finalWidth = finalHeight * aspectRatio;
          }
        }

        get().updatePicture(sheetId, id, { width: finalWidth, height: finalHeight });
      },

      rotatePicture: (sheetId, id, rotation) => {
        get().updatePicture(sheetId, id, { rotation: rotation % 360 });
      },

      // ─────────────────────────────────────────────────────────
      // STYLE
      // ─────────────────────────────────────────────────────────

      updatePictureStyle: (sheetId, id, style) => {
        get().updatePicture(sheetId, id, style);
      },

      setShadow: (sheetId, id, shadow) => {
        get().updatePicture(sheetId, id, { shadow });
      },

      // ─────────────────────────────────────────────────────────
      // CROP
      // ─────────────────────────────────────────────────────────

      setCrop: (sheetId, id, crop) => {
        get().updatePicture(sheetId, id, {
          cropTop: crop.top,
          cropBottom: crop.bottom,
          cropLeft: crop.left,
          cropRight: crop.right,
        });
      },

      resetCrop: (sheetId, id) => {
        get().updatePicture(sheetId, id, {
          cropTop: 0,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
        });
      },

      // ─────────────────────────────────────────────────────────
      // Z-INDEX
      // ─────────────────────────────────────────────────────────

      bringToFront: (sheetId, id) => {
        const pictures = get().pictures[sheetId] || [];
        const maxZ = Math.max(...pictures.map(p => p.zIndex), 0);
        get().updatePicture(sheetId, id, { zIndex: maxZ + 1 });
      },

      sendToBack: (sheetId, id) => {
        const pictures = get().pictures[sheetId] || [];
        const minZ = Math.min(...pictures.map(p => p.zIndex), 0);
        get().updatePicture(sheetId, id, { zIndex: minZ - 1 });
      },

      // ─────────────────────────────────────────────────────────
      // GETTERS
      // ─────────────────────────────────────────────────────────

      getPicturesForSheet: (sheetId) => {
        return (get().pictures[sheetId] || [])
          .filter(p => !p.hidden)
          .sort((a, b) => a.zIndex - b.zIndex);
      },

      getPictureById: (sheetId, id) => {
        return (get().pictures[sheetId] || []).find(p => p.id === id);
      },

      getSelectedPicture: (sheetId) => {
        const { pictureId } = get().selection;
        if (!pictureId) return undefined;
        return get().getPictureById(sheetId, pictureId);
      },
    }),
    {
      name: 'excelai-pictures',
      partialize: (state) => ({
        pictures: state.pictures,
      }),
    }
  )
);

export default usePicturesStore;
