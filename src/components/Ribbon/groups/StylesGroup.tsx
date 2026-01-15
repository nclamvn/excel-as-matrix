import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { Table, Palette, BarChart3 } from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';

export const StylesGroup: React.FC = () => {
  const { applyFormat, clearFormat } = useWorkbookStore();
  const { showToast } = useUIStore();

  const applyStyle = (styleName: string, format: Parameters<typeof applyFormat>[0]) => {
    applyFormat(format);
    showToast(`Applied ${styleName} style`, 'success');
  };

  return (
    <RibbonGroup label="Styles">
      <div className="styles-group-layout">
        <RibbonDropdown
          icon={BarChart3}
          label="Conditional Formatting"
          size="large"
          options={[
            { id: 'highlight', label: 'Highlight Cell Rules', onClick: () => showToast('Conditional formatting coming soon', 'info') },
            { id: 'top-bottom', label: 'Top/Bottom Rules', onClick: () => showToast('Top/Bottom rules coming soon', 'info') },
            { id: 'data-bars', label: 'Data Bars', onClick: () => showToast('Data bars coming soon', 'info') },
            { id: 'color-scales', label: 'Color Scales', onClick: () => showToast('Color scales coming soon', 'info') },
            { id: 'icon-sets', label: 'Icon Sets', onClick: () => showToast('Icon sets coming soon', 'info') },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'new-rule', label: 'New Rule...', onClick: () => showToast('New rule dialog coming soon', 'info') },
            { id: 'clear-rules', label: 'Clear Rules', onClick: () => { clearFormat(); showToast('Rules cleared', 'success'); } },
            { id: 'manage-rules', label: 'Manage Rules...', onClick: () => showToast('Manage rules coming soon', 'info') },
          ]}
        />
        <RibbonDropdown
          icon={Table}
          label="Format as Table"
          size="large"
          options={[
            { id: 'light', label: 'Light', onClick: () => applyStyle('Light Table', { backgroundColor: '#f5f5f5' }) },
            { id: 'medium', label: 'Medium', onClick: () => applyStyle('Medium Table', { backgroundColor: '#e3f2fd' }) },
            { id: 'dark', label: 'Dark', onClick: () => applyStyle('Dark Table', { backgroundColor: '#424242', textColor: '#ffffff' }) },
          ]}
        />
        <RibbonDropdown
          icon={Palette}
          label="Cell Styles"
          size="large"
          options={[
            { id: 'normal', label: 'Normal', onClick: () => { clearFormat(); showToast('Applied Normal style', 'success'); } },
            { id: 'good', label: 'Good', onClick: () => applyStyle('Good', { backgroundColor: '#c8e6c9', textColor: '#2e7d32' }) },
            { id: 'bad', label: 'Bad', onClick: () => applyStyle('Bad', { backgroundColor: '#ffcdd2', textColor: '#c62828' }) },
            { id: 'neutral', label: 'Neutral', onClick: () => applyStyle('Neutral', { backgroundColor: '#fff9c4', textColor: '#f57f17' }) },
          ]}
        />
      </div>
    </RibbonGroup>
  );
};
