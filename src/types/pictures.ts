// ============================================================
// PICTURE TYPE DEFINITIONS
// ============================================================

export interface PictureObject {
  id: string;
  sheetId: string;

  // Source
  src: string;              // Base64 or URL
  originalName?: string;    // Original filename

  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;    // For aspect ratio
  originalHeight: number;
  rotation: number;

  // Style
  opacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow?: PictureShadow;

  // Crop (percentages)
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;

  // State
  locked: boolean;
  hidden: boolean;
  zIndex: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface PictureShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

export interface PictureSelection {
  pictureId: string | null;
  isResizing: boolean;
  isDragging: boolean;
  isCropping: boolean;
  resizeHandle: ResizeHandle | null;
}

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se'
  | 'rotate';

export const DEFAULT_PICTURE_STYLE = {
  opacity: 1,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#000000',
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
};

// Supported image types
export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
