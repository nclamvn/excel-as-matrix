// ============================================================
// PICTURE TOOLBAR — Formatting options for selected picture
// ============================================================

import React, { useState } from 'react';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  RotateCw,
  Sun,
  Square,
} from 'lucide-react';
import { usePicturesStore } from '../../stores/picturesStore';
import './Pictures.css';

interface PictureToolbarProps {
  sheetId: string;
}

export const PictureToolbar: React.FC<PictureToolbarProps> = ({ sheetId }) => {
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [showBorderOptions, setShowBorderOptions] = useState(false);

  const {
    getSelectedPicture,
    updatePictureStyle,
    updatePicture,
    deletePicture,
    duplicatePicture,
    bringToFront,
    sendToBack,
    rotatePicture,
  } = usePicturesStore();

  const selectedPicture = getSelectedPicture(sheetId);

  if (!selectedPicture) return null;

  const handleRotate = () => {
    rotatePicture(sheetId, selectedPicture.id, selectedPicture.rotation + 90);
  };

  const handleOpacityChange = (opacity: number) => {
    updatePictureStyle(sheetId, selectedPicture.id, { opacity });
  };

  const handleBorderRadiusChange = (borderRadius: number) => {
    updatePictureStyle(sheetId, selectedPicture.id, { borderRadius });
  };

  const handleBorderWidthChange = (borderWidth: number) => {
    updatePictureStyle(sheetId, selectedPicture.id, { borderWidth });
  };

  const toggleLock = () => {
    updatePicture(sheetId, selectedPicture.id, { locked: !selectedPicture.locked });
  };

  return (
    <div className="picture-toolbar">
      {/* Rotate */}
      <button
        className="toolbar-btn"
        onClick={handleRotate}
        title="Rotate 90deg"
      >
        <RotateCw size={18} />
      </button>

      {/* Opacity */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => {
            setShowOpacitySlider(!showOpacitySlider);
            setShowBorderOptions(false);
          }}
          title="Opacity"
        >
          <Sun size={18} />
        </button>
        {showOpacitySlider && (
          <div className="slider-popup">
            <label>Opacity: {Math.round(selectedPicture.opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedPicture.opacity}
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Border */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => {
            setShowBorderOptions(!showBorderOptions);
            setShowOpacitySlider(false);
          }}
          title="Border & Corners"
        >
          <Square size={18} />
        </button>
        {showBorderOptions && (
          <div className="border-popup">
            <div className="border-option">
              <label>Corner Radius: {selectedPicture.borderRadius}px</label>
              <input
                type="range"
                min="0"
                max="50"
                value={selectedPicture.borderRadius}
                onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}
              />
            </div>
            <div className="border-option">
              <label>Border Width: {selectedPicture.borderWidth}px</label>
              <input
                type="range"
                min="0"
                max="10"
                value={selectedPicture.borderWidth}
                onChange={(e) => handleBorderWidthChange(parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Z-Index */}
      <button
        className="toolbar-btn"
        onClick={() => bringToFront(sheetId, selectedPicture.id)}
        title="Bring to Front"
      >
        <ArrowUp size={18} />
      </button>
      <button
        className="toolbar-btn"
        onClick={() => sendToBack(sheetId, selectedPicture.id)}
        title="Send to Back"
      >
        <ArrowDown size={18} />
      </button>

      <div className="toolbar-divider" />

      {/* Actions */}
      <button
        className="toolbar-btn"
        onClick={() => duplicatePicture(sheetId, selectedPicture.id)}
        title="Duplicate"
      >
        <Copy size={18} />
      </button>
      <button
        className="toolbar-btn"
        onClick={toggleLock}
        title={selectedPicture.locked ? 'Unlock' : 'Lock'}
      >
        {selectedPicture.locked ? <Lock size={18} /> : <Unlock size={18} />}
      </button>
      <button
        className="toolbar-btn delete"
        onClick={() => deletePicture(sheetId, selectedPicture.id)}
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default PictureToolbar;
