// ============================================================
// BACKGROUND DIALOG
// ============================================================

import React, { useState, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { usePrintStore } from '../../stores/printStore';
import './PageLayout.css';

interface BackgroundDialogProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundDialog: React.FC<BackgroundDialogProps> = ({
  sheetId,
  isOpen,
  onClose,
}) => {
  const { getSettings, setBackground } = usePrintStore();
  const settings = getSettings(sheetId);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    settings.background || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApply = () => {
    setBackground(sheetId, previewUrl || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="background-overlay" onClick={onClose}>
      <div className="background-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Sheet Background</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <p className="dialog-description">
            Select an image to use as the sheet background. The image will be
            tiled across the sheet.
          </p>

          <div
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Background preview" />
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={32} />
                <p>Click to upload or drag and drop</p>
                <span>PNG, JPG, GIF up to 5MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="background-options">
            <h3>Preview</h3>
            <div className="sheet-preview">
              <div
                className="preview-grid"
                style={{
                  backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                  backgroundSize: '50px 50px',
                }}
              >
                <div className="preview-cells">
                  <div className="cell">A1</div>
                  <div className="cell">B1</div>
                  <div className="cell">C1</div>
                  <div className="cell">A2</div>
                  <div className="cell">B2</div>
                  <div className="cell">C2</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundDialog;
