import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export const ZoomSlider: React.FC = () => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(Math.min(400, zoom + 10));
  const handleZoomOut = () => setZoom(Math.max(10, zoom - 10));

  return (
    <div className="zoom-slider">
      <button onClick={handleZoomOut} title="Zoom Out">
        <Minus className="w-4 h-4" />
      </button>

      <input
        type="range"
        min="10"
        max="400"
        value={zoom}
        onChange={(e) => setZoom(parseInt(e.target.value))}
        className="zoom-range"
      />

      <button onClick={handleZoomIn} title="Zoom In">
        <Plus className="w-4 h-4" />
      </button>

      <span className="zoom-value">{zoom}%</span>
    </div>
  );
};
