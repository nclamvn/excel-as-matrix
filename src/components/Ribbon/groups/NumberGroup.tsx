import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import { NumberFormatDropdown } from '../../Toolbar/NumberFormatDropdown';
import { DollarSign, Percent, Hash } from 'lucide-react';
import { useFormatStore } from '../../../stores/formatStore';

const NUMBER_FORMATS = [
  { id: 'general', label: 'General' },
  { id: 'number', label: 'Number' },
  { id: 'currency', label: 'Currency' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'short-date', label: 'Short Date' },
  { id: 'long-date', label: 'Long Date' },
  { id: 'time', label: 'Time' },
  { id: 'percentage', label: 'Percentage' },
  { id: 'fraction', label: 'Fraction' },
  { id: 'scientific', label: 'Scientific' },
  { id: 'text', label: 'Text' },
];

export const NumberGroup: React.FC = () => {
  const { numberFormat, setNumberFormat } = useFormatStore();

  return (
    <RibbonGroup label="Number" showDialogLauncher>
      <div className="number-group-layout">
        {/* Number format dropdown */}
        <NumberFormatDropdown
          value={numberFormat}
          onChange={setNumberFormat}
          options={NUMBER_FORMATS}
        />

        {/* Format buttons */}
        <div className="number-buttons">
          <RibbonButton
            icon={DollarSign}
            label="Accounting"
            title="Accounting Number Format"
            onClick={() => setNumberFormat('$#,##0.00')}
          />
          <RibbonButton
            icon={Percent}
            label="Percent"
            title="Percent Style"
            onClick={() => setNumberFormat('0.00%')}
          />
          <RibbonButton
            icon={Hash}
            label="Comma"
            title="Comma Style"
            onClick={() => setNumberFormat('#,##0.00')}
          />
        </div>
      </div>
    </RibbonGroup>
  );
};
