import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { RibbonDropdown } from '../RibbonDropdown';
import {
  Table, Image, Shapes, BarChart3, LineChart, PieChart,
  Sparkles, Link, MessageSquare, Type, Sigma
} from 'lucide-react';

export const InsertTab: React.FC = () => {
  return (
    <div className="ribbon-tab-content insert-tab">
      {/* Tables */}
      <RibbonGroup label="Tables">
        <RibbonButton icon={Table} label="Table" size="large" />
        <RibbonButton icon={Table} label="PivotTable" size="large" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Illustrations */}
      <RibbonGroup label="Illustrations">
        <RibbonButton icon={Image} label="Pictures" size="large" />
        <RibbonButton icon={Shapes} label="Shapes" size="large" />
        <RibbonButton icon={Sparkles} label="Icons" size="large" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Charts */}
      <RibbonGroup label="Charts">
        <RibbonDropdown
          icon={BarChart3}
          label="Column"
          size="large"
          options={[
            { id: 'clustered', label: 'Clustered Column', onClick: () => {} },
            { id: 'stacked', label: 'Stacked Column', onClick: () => {} },
            { id: '100-stacked', label: '100% Stacked Column', onClick: () => {} },
          ]}
        />
        <RibbonDropdown
          icon={LineChart}
          label="Line"
          size="large"
          options={[
            { id: 'line', label: 'Line', onClick: () => {} },
            { id: 'line-markers', label: 'Line with Markers', onClick: () => {} },
            { id: 'stacked-line', label: 'Stacked Line', onClick: () => {} },
          ]}
        />
        <RibbonDropdown
          icon={PieChart}
          label="Pie"
          size="large"
          options={[
            { id: 'pie', label: 'Pie', onClick: () => {} },
            { id: 'doughnut', label: 'Doughnut', onClick: () => {} },
          ]}
        />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Links */}
      <RibbonGroup label="Links">
        <RibbonButton icon={Link} label="Link" size="large" />
        <RibbonButton icon={MessageSquare} label="Comment" size="large" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Text */}
      <RibbonGroup label="Text">
        <RibbonButton icon={Type} label="Text Box" size="large" />
        <RibbonButton icon={Sigma} label="Equation" size="large" />
      </RibbonGroup>
    </div>
  );
};
