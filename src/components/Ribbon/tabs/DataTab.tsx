import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { RibbonDropdown } from '../RibbonDropdown';
import {
  Database, RefreshCw, Table, ArrowDownAZ, Filter,
  SplitSquareHorizontal, CheckSquare, Sparkles, GitCompare
} from 'lucide-react';

export const DataTab: React.FC = () => {
  return (
    <div className="ribbon-tab-content data-tab">
      {/* Get & Transform Data */}
      <RibbonGroup label="Get & Transform Data">
        <RibbonDropdown
          icon={Database}
          label="Get Data"
          size="large"
          options={[
            { id: 'from-file', label: 'From File', onClick: () => {} },
            { id: 'from-database', label: 'From Database', onClick: () => {} },
            { id: 'from-web', label: 'From Web', onClick: () => {} },
            { id: 'from-other', label: 'From Other Sources', onClick: () => {} },
          ]}
        />
        <RibbonButton icon={RefreshCw} label="Refresh All" size="large" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Queries & Connections */}
      <RibbonGroup label="Queries & Connections">
        <RibbonButton icon={Table} label="Queries & Connections" size="large" />
        <RibbonButton icon={Database} label="Properties" />
        <RibbonButton icon={Database} label="Edit Links" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Sort & Filter */}
      <RibbonGroup label="Sort & Filter">
        <RibbonButton icon={ArrowDownAZ} label="Sort A-Z" />
        <RibbonButton icon={ArrowDownAZ} label="Sort Z-A" />
        <RibbonButton icon={ArrowDownAZ} label="Sort" />
        <RibbonButton icon={Filter} label="Filter" />
        <RibbonButton icon={Filter} label="Clear" />
        <RibbonButton icon={Filter} label="Reapply" />
        <RibbonButton icon={Filter} label="Advanced" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Data Tools */}
      <RibbonGroup label="Data Tools">
        <RibbonButton icon={SplitSquareHorizontal} label="Text to Columns" />
        <RibbonButton icon={Sparkles} label="Flash Fill" />
        <RibbonButton icon={GitCompare} label="Remove Duplicates" />
        <RibbonButton icon={CheckSquare} label="Data Validation" />
      </RibbonGroup>
    </div>
  );
};
