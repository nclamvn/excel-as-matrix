import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { FontPicker } from '../../Toolbar/FontPicker';
import { FontSizePicker } from '../../Toolbar/FontSizePicker';
import { ColorPicker } from '../../Toolbar/ColorPicker';
import { BorderSelector } from '../../Toolbar/BorderSelector';
import {
  Bold, Italic, Underline,
  ChevronUp, ChevronDown, PaintBucket, Type
} from 'lucide-react';
import { useFormatStore } from '../../../stores/formatStore';

export const FontGroup: React.FC = () => {
  const {
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    bold, toggleBold,
    italic, toggleItalic,
    underline, toggleUnderline,
    textColor, setTextColor,
    backgroundColor, setBackgroundColor,
  } = useFormatStore();

  return (
    <RibbonGroup label="Font" showDialogLauncher>
      <div className="font-group-layout">
        {/* Row 1: Font family and size */}
        <div className="font-row">
          <FontPicker value={fontFamily} onChange={setFontFamily} />
          <FontSizePicker value={fontSize} onChange={setFontSize} />
          <button className="size-button" onClick={() => setFontSize(fontSize + 1)} title="Increase Font Size">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button className="size-button" onClick={() => setFontSize(Math.max(1, fontSize - 1))} title="Decrease Font Size">
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Row 2: Formatting buttons */}
        <div className="font-row">
          <RibbonButton
            icon={Bold}
            label="Bold"
            active={bold}
            onClick={toggleBold}
            title="Bold (Ctrl+B)"
          />
          <RibbonButton
            icon={Italic}
            label="Italic"
            active={italic}
            onClick={toggleItalic}
            title="Italic (Ctrl+I)"
          />
          <RibbonButton
            icon={Underline}
            label="Underline"
            active={underline}
            onClick={toggleUnderline}
            title="Underline (Ctrl+U)"
          />
          <BorderSelector />
          <ColorPicker
            icon={PaintBucket}
            value={backgroundColor}
            onChange={setBackgroundColor}
            title="Fill Color"
          />
          <ColorPicker
            icon={Type}
            value={textColor}
            onChange={setTextColor}
            title="Font Color"
          />
        </div>
      </div>
    </RibbonGroup>
  );
};
