// ============================================================
// SHAPE TOOLBAR — Formatting options for selected shape
// ============================================================

import React, { useState } from 'react';
import {
  Palette,
  PenLine,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { useShapesStore } from '../../stores/shapesStore';
import { SHAPE_FILL_PRESETS, SHAPE_STROKE_PRESETS } from '../../data/shapeDefinitions';
import './Shapes.css';

interface ShapeToolbarProps {
  sheetId: string;
}

export const ShapeToolbar: React.FC<ShapeToolbarProps> = ({ sheetId }) => {
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const {
    getSelectedShape,
    updateShapeStyle,
    updateShape,
    deleteShape,
    duplicateShape,
    bringToFront,
    sendToBack,
  } = useShapesStore();

  const selectedShape = getSelectedShape(sheetId);

  if (!selectedShape) return null;

  const handleFillChange = (color: string) => {
    updateShapeStyle(sheetId, selectedShape.id, { fill: color });
    setShowFillPicker(false);
  };

  const handleStrokeChange = (color: string) => {
    updateShapeStyle(sheetId, selectedShape.id, { stroke: color });
    setShowStrokePicker(false);
  };

  const handleStrokeWidthChange = (width: number) => {
    updateShapeStyle(sheetId, selectedShape.id, { strokeWidth: width });
  };

  const toggleLock = () => {
    updateShape(sheetId, selectedShape.id, { locked: !selectedShape.locked });
  };

  return (
    <div className="shape-toolbar">
      {/* Fill Color */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => {
            setShowFillPicker(!showFillPicker);
            setShowStrokePicker(false);
          }}
          title="Fill Color"
        >
          <Palette size={18} />
          <span
            className="color-indicator"
            style={{ background: selectedShape.style.fill }}
          />
        </button>
        {showFillPicker && (
          <div className="color-picker">
            <div className="color-picker-title">Fill Color</div>
            <div className="color-grid">
              {SHAPE_FILL_PRESETS.map(color => (
                <button
                  key={color}
                  className={`color-swatch ${selectedShape.style.fill === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleFillChange(color)}
                />
              ))}
            </div>
            <button
              className="no-fill-btn"
              onClick={() => updateShapeStyle(sheetId, selectedShape.id, { fillOpacity: 0 })}
            >
              No Fill
            </button>
          </div>
        )}
      </div>

      {/* Stroke Color */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => {
            setShowStrokePicker(!showStrokePicker);
            setShowFillPicker(false);
          }}
          title="Outline Color"
        >
          <PenLine size={18} />
          <span
            className="color-indicator"
            style={{ background: selectedShape.style.stroke }}
          />
        </button>
        {showStrokePicker && (
          <div className="color-picker">
            <div className="color-picker-title">Outline Color</div>
            <div className="color-grid">
              {SHAPE_STROKE_PRESETS.map(color => (
                <button
                  key={color}
                  className={`color-swatch ${selectedShape.style.stroke === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleStrokeChange(color)}
                />
              ))}
            </div>
            <div className="stroke-width-section">
              <label>Width:</label>
              <input
                type="range"
                min="0"
                max="10"
                value={selectedShape.style.strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
              />
              <span>{selectedShape.style.strokeWidth}px</span>
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Actions */}
      <button
        className="toolbar-btn"
        onClick={() => bringToFront(sheetId, selectedShape.id)}
        title="Bring to Front"
      >
        <ArrowUp size={18} />
      </button>
      <button
        className="toolbar-btn"
        onClick={() => sendToBack(sheetId, selectedShape.id)}
        title="Send to Back"
      >
        <ArrowDown size={18} />
      </button>

      <div className="toolbar-divider" />

      <button
        className="toolbar-btn"
        onClick={() => duplicateShape(sheetId, selectedShape.id)}
        title="Duplicate"
      >
        <Copy size={18} />
      </button>
      <button
        className="toolbar-btn"
        onClick={toggleLock}
        title={selectedShape.locked ? 'Unlock' : 'Lock'}
      >
        {selectedShape.locked ? <Lock size={18} /> : <Unlock size={18} />}
      </button>
      <button
        className="toolbar-btn delete"
        onClick={() => deleteShape(sheetId, selectedShape.id)}
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ShapeToolbar;
