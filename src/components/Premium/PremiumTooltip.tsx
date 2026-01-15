import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PremiumTooltipProps {
  title: string;
  shortcut?: string;
  description?: string;
  anchorEl: HTMLElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const PremiumTooltip: React.FC<PremiumTooltipProps> = ({
  title,
  shortcut,
  description,
  anchorEl,
  position = 'bottom',
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    const offset = 4;

    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
      default:
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
    }

    setCoords({ top, left });
  }, [anchorEl, position]);

  const transformStyle = position === 'top' || position === 'bottom'
    ? 'translateX(-50%)'
    : position === 'left'
      ? 'translate(-100%, -50%)'
      : 'translateY(-50%)';

  const tooltipContent = (
    <div
      className="premium-tooltip"
      style={{
        top: coords.top,
        left: coords.left,
        transform: transformStyle,
      }}
    >
      <div className="premium-tooltip__content">
        <span className="premium-tooltip__title">{title}</span>
        {shortcut && (
          <span className="premium-tooltip__shortcut">{shortcut}</span>
        )}
        {description && (
          <span className="premium-tooltip__description">{description}</span>
        )}
      </div>
    </div>
  );

  return createPortal(tooltipContent, document.body);
};
