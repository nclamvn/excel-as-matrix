// ============================================================
// SHAPES DROPDOWN MENU
// ============================================================

import React, { useState, useRef } from 'react';
import { Shapes, ChevronRight } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useShapesStore } from '../../stores/shapesStore';
import {
  SHAPES_BY_CATEGORY,
  getRecentShapes,
} from '../../data/shapeDefinitions';
import {
  ShapeCategory,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from '../../types/shapes';
import './Shapes.css';

interface ShapesDropdownProps {
  sheetId: string;
}

export const ShapesDropdown: React.FC<ShapesDropdownProps> = ({ sheetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ShapeCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { addShape, recentShapeIds } = useShapesStore();

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setActiveCategory(null);
  });

  const handleSelectShape = (shapeId: string) => {
    // Add shape at center of visible area
    const gridElement = document.querySelector('.grid-container') ||
                       document.querySelector('.canvas-grid-container') ||
                       document.querySelector('.flex-1.overflow-hidden');
    const rect = gridElement?.getBoundingClientRect();
    const x = rect ? rect.width / 2 - 75 : 200;
    const y = rect ? rect.height / 2 - 50 : 200;

    addShape(sheetId, shapeId, x, y);
    setIsOpen(false);
    setActiveCategory(null);
  };

  const recentShapes = getRecentShapes(recentShapeIds);

  return (
    <div className="shapes-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-2026__btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Insert Shapes"
      >
        <Shapes size={16} />
        <span>Shapes</span>
      </button>

      {isOpen && (
        <div className="shapes-menu">
          {/* Recent Shapes */}
          {recentShapes.length > 0 && (
            <div className="shapes-section">
              <div className="section-title">Recently Used</div>
              <div className="shapes-grid recent">
                {recentShapes.map(shape => (
                  <button
                    key={shape.id}
                    className="shape-item"
                    onClick={() => handleSelectShape(shape.id)}
                    title={shape.name}
                  >
                    <svg viewBox={shape.viewBox} className="shape-preview">
                      <path
                        d={shape.path}
                        fill={shape.isLine ? 'none' : '#4285F4'}
                        stroke="#1a73e8"
                        strokeWidth="3"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="shapes-categories">
            {CATEGORY_ORDER.map(category => (
              <div
                key={category}
                className={`category-item ${activeCategory === category ? 'active' : ''}`}
                onMouseEnter={() => setActiveCategory(category)}
              >
                <span className="category-label">{CATEGORY_LABELS[category]}</span>
                <ChevronRight size={16} />

                {/* Subcategory Panel */}
                {activeCategory === category && (
                  <div className="shapes-submenu">
                    <div className="submenu-title">{CATEGORY_LABELS[category]}</div>
                    <div className="shapes-grid">
                      {SHAPES_BY_CATEGORY[category].map(shape => (
                        <button
                          key={shape.id}
                          className="shape-item"
                          onClick={() => handleSelectShape(shape.id)}
                          title={shape.name}
                        >
                          <svg viewBox={shape.viewBox} className="shape-preview">
                            <path
                              d={shape.path}
                              fill={shape.isLine ? 'none' : '#4285F4'}
                              stroke="#1a73e8"
                              strokeWidth="3"
                            />
                          </svg>
                          <span className="shape-name">{shape.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShapesDropdown;
