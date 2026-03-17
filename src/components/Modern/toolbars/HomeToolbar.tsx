import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  DollarSign, Percent,
  PaintBucket, Type, ChevronDown,
  Undo2, Redo2
} from 'lucide-react';
import { useFormatStore } from '../../../stores/formatStore';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { CFDropdown } from '../../ConditionalFormatting';
import { TextOrientationDropdown } from '../../TextOrientation';

// Color palette
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
];

const FONTS = [
  'IBM Plex Sans', 'Arial', 'Calibri', 'Times New Roman',
  'Helvetica', 'Georgia', 'Verdana', 'Courier New'
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

export const HomeToolbar: React.FC = () => {
  const {
    fontFamily, fontSize,
    bold, italic, underline,
    textColor, backgroundColor,
    align,
    setFontFamily, setFontSize,
    toggleBold, toggleItalic, toggleUnderline,
    setTextColor, setBackgroundColor,
    setAlign, setNumberFormat,
  } = useFormatStore();

  const undo = useWorkbookStore((state) => state.undo);
  const redo = useWorkbookStore((state) => state.redo);
  const canUndo = useWorkbookStore((state) => state.canUndo);
  const canRedo = useWorkbookStore((state) => state.canRedo);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);

  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const fillColorRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) {
        setShowSizeDropdown(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node)) {
        setShowTextColorPicker(false);
      }
      if (fillColorRef.current && !fillColorRef.current.contains(e.target as Node)) {
        setShowFillColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="toolbar-2026">
      {/* TIP-007: Undo/Redo */}
      <div className="toolbar-2026__group" style={{ gap: 2 }}>
        <button
          className="toolbar-2026__btn"
          title="Undo (Ctrl+Z)"
          onClick={() => undo()}
          disabled={!canUndo()}
          style={{ opacity: canUndo() ? 1 : 0.35 }}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="toolbar-2026__btn"
          title="Redo (Ctrl+Y)"
          onClick={() => redo()}
          disabled={!canRedo()}
          style={{ opacity: canRedo() ? 1 : 0.35 }}
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Font Family */}
      <div className="toolbar-2026__group">
        <div className="toolbar-2026__dropdown" ref={fontRef}>
          <button
            className="toolbar-2026__select"
            style={{ width: 100 }}
            onClick={() => setShowFontDropdown(!showFontDropdown)}
          >
            <span style={{ fontFamily, fontSize: '11px' }}>{fontFamily}</span>
            <ChevronDown size={10} />
          </button>
          {showFontDropdown && (
            <div className="toolbar-2026__dropdown-menu">
              {FONTS.map((font) => (
                <button
                  key={font}
                  className={`toolbar-2026__dropdown-item ${font === fontFamily ? 'active' : ''}`}
                  style={{ fontFamily: font }}
                  onClick={() => {
                    setFontFamily(font);
                    setShowFontDropdown(false);
                  }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="toolbar-2026__dropdown" ref={sizeRef}>
          <button
            className="toolbar-2026__input"
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
          >
            {fontSize}
            <ChevronDown size={10} />
          </button>
          {showSizeDropdown && (
            <div className="toolbar-2026__dropdown-menu toolbar-2026__dropdown-menu--narrow">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  className={`toolbar-2026__dropdown-item ${size === fontSize ? 'active' : ''}`}
                  onClick={() => {
                    setFontSize(size);
                    setShowSizeDropdown(false);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Text Formatting */}
      <div className="toolbar-2026__group">
        <button
          className={`toolbar-2026__btn ${bold ? 'toolbar-2026__btn--active' : ''}`}
          onClick={toggleBold}
          title="Bold (⌘B)"
        >
          <Bold size={15} />
        </button>
        <button
          className={`toolbar-2026__btn ${italic ? 'toolbar-2026__btn--active' : ''}`}
          onClick={toggleItalic}
          title="Italic (⌘I)"
        >
          <Italic size={15} />
        </button>
        <button
          className={`toolbar-2026__btn ${underline ? 'toolbar-2026__btn--active' : ''}`}
          onClick={toggleUnderline}
          title="Underline (⌘U)"
        >
          <Underline size={15} />
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Colors */}
      <div className="toolbar-2026__group">
        {/* Fill Color */}
        <div className="toolbar-2026__color-picker" ref={fillColorRef}>
          <button
            className="toolbar-2026__btn toolbar-2026__btn--color"
            onClick={() => setShowFillColorPicker(!showFillColorPicker)}
            title="Fill Color"
          >
            <PaintBucket size={15} />
            <span
              className="toolbar-2026__color-bar"
              style={{ backgroundColor }}
            />
          </button>
          {showFillColorPicker && (
            <div className="toolbar-2026__color-dropdown">
              <div className="toolbar-2026__color-grid">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`toolbar-2026__color-cell ${color === backgroundColor ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setBackgroundColor(color);
                      setShowFillColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <button
                className="toolbar-2026__color-none"
                onClick={() => {
                  setBackgroundColor('#FFFFFF');
                  setShowFillColorPicker(false);
                }}
              >
                No Fill
              </button>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="toolbar-2026__color-picker" ref={textColorRef}>
          <button
            className="toolbar-2026__btn toolbar-2026__btn--color"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            title="Text Color"
          >
            <Type size={15} />
            <span
              className="toolbar-2026__color-bar"
              style={{ backgroundColor: textColor }}
            />
          </button>
          {showTextColorPicker && (
            <div className="toolbar-2026__color-dropdown">
              <div className="toolbar-2026__color-grid">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`toolbar-2026__color-cell ${color === textColor ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setTextColor(color);
                      setShowTextColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <button
                className="toolbar-2026__color-none"
                onClick={() => {
                  setTextColor('#000000');
                  setShowTextColorPicker(false);
                }}
              >
                Automatic
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Alignment */}
      <div className="toolbar-2026__group">
        <button
          className={`toolbar-2026__btn ${align === 'left' ? 'toolbar-2026__btn--active' : ''}`}
          onClick={() => setAlign('left')}
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button
          className={`toolbar-2026__btn ${align === 'center' ? 'toolbar-2026__btn--active' : ''}`}
          onClick={() => setAlign('center')}
          title="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button
          className={`toolbar-2026__btn ${align === 'right' ? 'toolbar-2026__btn--active' : ''}`}
          onClick={() => setAlign('right')}
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>

        {/* Text Orientation */}
        <TextOrientationDropdown />
      </div>

      <div className="toolbar-2026__divider" />

      {/* Number Format */}
      <div className="toolbar-2026__group">
        <button
          className="toolbar-2026__btn"
          onClick={() => setNumberFormat('$#,##0.00')}
          title="Currency Format"
        >
          <DollarSign size={15} />
        </button>
        <button
          className="toolbar-2026__btn"
          onClick={() => setNumberFormat('0.00%')}
          title="Percent Format"
        >
          <Percent size={15} />
        </button>
      </div>

      <div className="toolbar-2026__divider" />

      {/* Conditional Formatting */}
      <div className="toolbar-2026__group">
        <CFDropdown />
      </div>
    </div>
  );
};
