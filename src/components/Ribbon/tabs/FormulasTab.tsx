import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { RibbonDropdown } from '../RibbonDropdown';
import {
  FunctionSquare, Calculator, FileText, Clock, Database,
  Search, GitBranch, AlertTriangle, CheckCircle
} from 'lucide-react';

export const FormulasTab: React.FC = () => {
  return (
    <div className="ribbon-tab-content formulas-tab">
      {/* Function Library */}
      <RibbonGroup label="Function Library">
        <RibbonButton icon={FunctionSquare} label="Insert Function" size="large" />
        <RibbonDropdown
          icon={Calculator}
          label="AutoSum"
          options={[
            { id: 'sum', label: 'Sum', onClick: () => {} },
            { id: 'average', label: 'Average', onClick: () => {} },
            { id: 'count', label: 'Count', onClick: () => {} },
            { id: 'max', label: 'Max', onClick: () => {} },
            { id: 'min', label: 'Min', onClick: () => {} },
          ]}
        />
        <RibbonButton icon={Calculator} label="Financial" />
        <RibbonButton icon={GitBranch} label="Logical" />
        <RibbonButton icon={FileText} label="Text" />
        <RibbonButton icon={Clock} label="Date & Time" />
        <RibbonButton icon={Search} label="Lookup & Reference" />
        <RibbonButton icon={Calculator} label="Math & Trig" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Defined Names */}
      <RibbonGroup label="Defined Names">
        <RibbonButton icon={Database} label="Name Manager" size="large" />
        <RibbonButton icon={Database} label="Define Name" />
        <RibbonButton icon={Database} label="Use in Formula" />
        <RibbonButton icon={Database} label="Create from Selection" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Formula Auditing */}
      <RibbonGroup label="Formula Auditing">
        <RibbonButton icon={GitBranch} label="Trace Precedents" />
        <RibbonButton icon={GitBranch} label="Trace Dependents" />
        <RibbonButton icon={AlertTriangle} label="Error Checking" />
        <RibbonButton icon={CheckCircle} label="Evaluate Formula" />
        <RibbonButton icon={Search} label="Watch Window" />
      </RibbonGroup>

      <div className="ribbon-separator" />

      {/* Calculation */}
      <RibbonGroup label="Calculation">
        <RibbonDropdown
          icon={Calculator}
          label="Calculation Options"
          options={[
            { id: 'automatic', label: 'Automatic', onClick: () => {} },
            { id: 'manual', label: 'Manual', onClick: () => {} },
          ]}
        />
        <RibbonButton icon={Calculator} label="Calculate Now" />
        <RibbonButton icon={Calculator} label="Calculate Sheet" />
      </RibbonGroup>
    </div>
  );
};
