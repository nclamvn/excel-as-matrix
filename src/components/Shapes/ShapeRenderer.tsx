// ============================================================
// SHAPE RENDERER — Renders individual shape SVG
// ============================================================

import React from 'react';
import { ShapeObject } from '../../types/shapes';
import { getShapeById } from '../../data/shapeDefinitions';

interface ShapeRendererProps {
  shape: ShapeObject;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ shape }) => {
  const shapeDef = getShapeById(shape.shapeId);
  if (!shapeDef) return null;

  const { style, textStyle } = shape;

  return (
    <div className="shape-renderer">
      <svg
        viewBox={shapeDef.viewBox}
        className="shape-svg"
        style={{
          filter: style.shadow
            ? `drop-shadow(${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color})`
            : undefined,
        }}
      >
        <path
          d={shapeDef.path}
          fill={shapeDef.isLine ? 'none' : style.fill}
          fillOpacity={shapeDef.isLine ? 0 : style.fillOpacity}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Text content */}
      {textStyle && textStyle.text && (
        <div
          className="shape-text"
          style={{
            fontSize: textStyle.fontSize,
            fontFamily: textStyle.fontFamily,
            fontWeight: textStyle.fontWeight,
            fontStyle: textStyle.fontStyle,
            color: textStyle.color,
            textAlign: textStyle.align,
            justifyContent:
              textStyle.verticalAlign === 'top' ? 'flex-start' :
              textStyle.verticalAlign === 'bottom' ? 'flex-end' : 'center',
          }}
        >
          {textStyle.text}
        </div>
      )}
    </div>
  );
};

export default ShapeRenderer;
