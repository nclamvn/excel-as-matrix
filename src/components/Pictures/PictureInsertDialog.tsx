// ============================================================
// PICTURE INSERT DIALOG
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Link,
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { usePicturesStore } from '../../stores/picturesStore';
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../../types/pictures';
import './Pictures.css';

interface PictureInsertDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
}

type InsertMode = 'upload' | 'url';

export const PictureInsertDialog: React.FC<PictureInsertDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
}) => {
  const [mode, setMode] = useState<InsertMode>('upload');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addPicture } = usePicturesStore();

  // Load image and get dimensions
  const loadImage = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };

  // Process file
  const processFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError('Unsupported image format. Please use PNG, JPEG, GIF, WebP, SVG, or BMP.');
      return;
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size exceeds 10MB limit.');
      return;
    }

    setIsLoading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Get dimensions
      const { width, height } = await loadImage(base64);

      // Add picture
      addPicture(sheetId, base64, width, height, file.name);
      onClose();
    } catch (err) {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle URL insert
  const handleUrlInsert = async () => {
    if (!url.trim()) {
      setError('Please enter an image URL.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Validate URL
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // Load and get dimensions
      const { width, height } = await loadImage(url);

      // Add picture
      addPicture(sheetId, url, width, height, url.split('/').pop());
      onClose();
    } catch (err) {
      setError('Failed to load image from URL. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      setError('Please drop an image file.');
    }
  }, [sheetId]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog picture-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Insert Picture</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); setError(null); }}
            >
              <Upload size={16} />
              From Device
            </button>
            <button
              className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
              onClick={() => { setMode('url'); setError(null); }}
            >
              <Link size={16} />
              From URL
            </button>
          </div>

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                hidden
              />

              {isLoading ? (
                <div className="upload-loading">
                  <Loader2 size={40} className="spinner" />
                  <span>Processing image...</span>
                </div>
              ) : (
                <>
                  <ImageIcon size={48} className="upload-icon" />
                  <div className="upload-text">
                    <span className="primary-text">
                      Drag & drop an image here
                    </span>
                    <span className="secondary-text">
                      or click to browse
                    </span>
                  </div>
                  <div className="upload-hint">
                    Supports: PNG, JPEG, GIF, WebP, SVG, BMP (max 10MB)
                  </div>
                </>
              )}
            </div>
          )}

          {/* URL Mode */}
          {mode === 'url' && (
            <div className="url-input-section">
              <label>Image URL:</label>
              <input
                type="url"
                className="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                disabled={isLoading}
              />
              <div className="url-hint">
                Enter a direct link to an image file
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          {mode === 'url' && (
            <button
              className="btn-primary"
              onClick={handleUrlInsert}
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Loading...
                </>
              ) : (
                'Insert'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PictureInsertDialog;
