import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { RibbonDropdown } from '../RibbonDropdown';
import {
  LayoutGrid, Columns, Eye, Maximize, ZoomIn, ZoomOut,
  Snowflake, SplitSquareHorizontal, PanelLeft, FileText
} from 'lucide-react';

export const ViewTab: React.FC = () => {
  return (
    <div className="ribbon-tab-content view-tab">
      {/* Workbook Views */}
      <RibbonGroup label="Workbook Views">
        <RibbonButton icon={LayoutGrid} label="Normal" size="large" active />
        <RibbonButton icon={Columns} label="Page Break Preview" size="large" />
        <RibbonButton icon={FileText} label="Page Layout" size="large" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Show */}
      <RibbonGroup label="Show">
        <label className="ribbon-checkbox">
          <input type="checkbox" defaultChecked />
          <span>Gridlines</span>
        </label>
        <label className="ribbon-checkbox">
          <input type="checkbox" defaultChecked />
          <span>Headings</span>
        </label>
        <label className="ribbon-checkbox">
          <input type="checkbox" defaultChecked />
          <span>Formula Bar</span>
        </label>
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Zoom */}
      <RibbonGroup label="Zoom">
        <RibbonButton icon={ZoomIn} label="Zoom" size="large" />
        <RibbonButton icon={Maximize} label="100%" />
        <RibbonButton icon={ZoomOut} label="Zoom to Selection" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Window */}
      <RibbonGroup label="Window">
        <RibbonDropdown
          icon={Snowflake}
          label="Freeze Panes"
          size="large"
          options={[
            { id: 'freeze', label: 'Freeze Panes', onClick: () => {} },
            { id: 'freeze-top', label: 'Freeze Top Row', onClick: () => {} },
            { id: 'freeze-first', label: 'Freeze First Column', onClick: () => {} },
            { id: 'unfreeze', label: 'Unfreeze Panes', onClick: () => {} },
          ]}
        />
        <RibbonButton icon={SplitSquareHorizontal} label="Split" size="large" />
        <RibbonButton icon={PanelLeft} label="Hide" />
        <RibbonButton icon={Eye} label="Unhide" />
      </RibbonGroup>
    </div>
  );
};
