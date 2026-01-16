// ============================================================
// TEXT ORIENTATION DIALOG
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TextOrientationDialogProps {
  onClose: () => void;
  onApply: (angle: number) => void;
  initialAngle?: number;
}

export const TextOrientationDialog: React.FC<TextOrientationDialogProps> = ({
  onClose,
  onApply,
  initialAngle = 0,
}) => {
  const [angle, setAngle] = useState(initialAngle);

  const handleAngleChange = (value: number) => {
    setAngle(Math.max(-90, Math.min(90, value)));
  };

  const presets = [-90, -45, 0, 45, 90];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog orientation-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Text Orientation</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="orientation-preview-section">
            <div className="angle-dial">
              <div
                className="dial-indicator"
                style={{ transform: `rotate(${-angle}deg)` }}
              />
              <div className="dial-text" style={{ transform: `rotate(${-angle}deg)` }}>
                Text
              </div>
              {/* Degree markers */}
              <div className="degree-markers">
                {presets.map(deg => (
                  <div
                    key={deg}
                    className={`degree-marker ${angle === deg ? 'active' : ''}`}
                    style={{
                      transform: `rotate(${-deg}deg) translateY(-55px)`,
                    }}
                    onClick={() => setAngle(deg)}
                  >
                    {deg}°
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="angle-input-section">
            <label>Degrees:</label>
            <div className="angle-input-group">
              <input
                type="range"
                min="-90"
                max="90"
                value={angle}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
              />
              <input
                type="number"
                min="-90"
                max="90"
                value={angle}
                onChange={(e) => handleAngleChange(parseInt(e.target.value) || 0)}
              />
              <span>°</span>
            </div>
          </div>

          <div className="preset-buttons">
            {presets.map(deg => (
              <button
                key={deg}
                className={`preset-btn ${angle === deg ? 'active' : ''}`}
                onClick={() => setAngle(deg)}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onApply(angle)}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextOrientationDialog;
