import React from 'react';
import { RibbonGroupPremium } from '../RibbonGroupPremium';
import { CompactButton, CompactSplitButton } from '../../Toolbar/CompactButton';
import {
  Clipboard, Scissors, Copy, ClipboardPaste,
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  Percent, DollarSign,
  Plus, Trash2, Settings,
  Search, SortAsc,
  PaintBucket, Type, Palette
} from 'lucide-react';
import { useFormatStore } from '../../../stores/formatStore';

export const HomeTabPremium: React.FC = () => {
  const {
    bold, toggleBold,
    italic, toggleItalic,
    underline, toggleUnderline,
    align, setAlign,
  } = useFormatStore();

  return (
    <>
      {/* Clipboard Group */}
      <RibbonGroupPremium label="Clipboard">
        <CompactSplitButton
          icon={ClipboardPaste}
          tooltip="Paste"
          shortcut="Ctrl+V"
          size="lg"
          onMainClick={() => navigator.clipboard.readText()}
        />
        <div className="btn-group btn-group--vertical">
          <CompactButton
            icon={Scissors}
            tooltip="Cut"
            shortcut="Ctrl+X"
          />
          <CompactButton
            icon={Copy}
            tooltip="Copy"
            shortcut="Ctrl+C"
          />
          <CompactButton
            icon={Clipboard}
            tooltip="Format Painter"
          />
        </div>
      </RibbonGroupPremium>

      {/* Font Group */}
      <RibbonGroupPremium label="Font" showDialogLauncher>
        <div className="btn-group btn-group--vertical">
          <div className="btn-group">
            <select className="premium-select font-picker-premium">
              <option>Calibri</option>
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>IBM Plex Sans</option>
            </select>
            <input
              type="text"
              className="premium-input font-size-premium"
              defaultValue="11"
            />
          </div>
          <div className="btn-group">
            <CompactButton
              icon={Bold}
              tooltip="Bold"
              shortcut="Ctrl+B"
              variant={bold ? 'active' : 'default'}
              onClick={toggleBold}
            />
            <CompactButton
              icon={Italic}
              tooltip="Italic"
              shortcut="Ctrl+I"
              variant={italic ? 'active' : 'default'}
              onClick={toggleItalic}
            />
            <CompactButton
              icon={Underline}
              tooltip="Underline"
              shortcut="Ctrl+U"
              variant={underline ? 'active' : 'default'}
              onClick={toggleUnderline}
            />
            <div className="btn-divider" />
            <CompactButton
              icon={PaintBucket}
              tooltip="Fill Color"
              hasDropdown
              className="color-btn-premium"
            />
            <CompactButton
              icon={Type}
              tooltip="Font Color"
              hasDropdown
              className="color-btn-premium"
            />
          </div>
        </div>
      </RibbonGroupPremium>

      {/* Alignment Group */}
      <RibbonGroupPremium label="Alignment" showDialogLauncher>
        <div className="btn-group btn-group--vertical">
          <div className="btn-group">
            <CompactButton
              icon={AlignLeft}
              tooltip="Align Left"
              variant={align === 'left' ? 'active' : 'default'}
              onClick={() => setAlign('left')}
            />
            <CompactButton
              icon={AlignCenter}
              tooltip="Center"
              variant={align === 'center' ? 'active' : 'default'}
              onClick={() => setAlign('center')}
            />
            <CompactButton
              icon={AlignRight}
              tooltip="Align Right"
              variant={align === 'right' ? 'active' : 'default'}
              onClick={() => setAlign('right')}
            />
          </div>
        </div>
      </RibbonGroupPremium>

      {/* Number Group */}
      <RibbonGroupPremium label="Number" showDialogLauncher>
        <div className="btn-group btn-group--vertical">
          <select className="premium-select number-format-premium">
            <option>General</option>
            <option>Number</option>
            <option>Currency</option>
            <option>Accounting</option>
            <option>Date</option>
            <option>Percentage</option>
            <option>Text</option>
          </select>
          <div className="btn-group">
            <CompactButton
              icon={DollarSign}
              tooltip="Accounting Number Format"
              hasDropdown
            />
            <CompactButton
              icon={Percent}
              tooltip="Percent Style"
            />
            <CompactButton
              tooltip="Comma Style"
            >
              <span style={{ fontSize: '11px', fontWeight: 500 }}>,</span>
            </CompactButton>
          </div>
        </div>
      </RibbonGroupPremium>

      {/* Styles Group */}
      <RibbonGroupPremium label="Styles">
        <CompactButton
          icon={Palette}
          label="Conditional"
          size="lg"
          hasDropdown
          tooltip="Conditional Formatting"
        />
        <CompactButton
          label="Format as Table"
          size="lg"
          hasDropdown
          tooltip="Format as Table"
        />
        <CompactButton
          label="Cell Styles"
          size="lg"
          hasDropdown
          tooltip="Cell Styles"
        />
      </RibbonGroupPremium>

      {/* Cells Group */}
      <RibbonGroupPremium label="Cells">
        <CompactButton
          icon={Plus}
          label="Insert"
          size="lg"
          hasDropdown
          tooltip="Insert Cells"
        />
        <CompactButton
          icon={Trash2}
          label="Delete"
          size="lg"
          hasDropdown
          tooltip="Delete Cells"
        />
        <CompactButton
          icon={Settings}
          label="Format"
          size="lg"
          hasDropdown
          tooltip="Format Cells"
        />
      </RibbonGroupPremium>

      {/* Editing Group */}
      <RibbonGroupPremium label="Editing">
        <div className="btn-group btn-group--vertical">
          <CompactButton
            icon={SortAsc}
            label="Sort & Filter"
            hasDropdown
            tooltip="Sort & Filter"
          />
          <CompactButton
            icon={Search}
            label="Find & Select"
            hasDropdown
            tooltip="Find & Select"
            shortcut="Ctrl+F"
          />
        </div>
      </RibbonGroupPremium>
    </>
  );
};
