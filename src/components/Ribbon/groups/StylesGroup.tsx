import React, { useState } from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonDropdown } from '../RibbonDropdown';
import { Table, Palette, BarChart3, Highlighter, TrendingUp, BarChart, PaintBucket, Shapes, Plus, Trash2, Settings } from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';
import { ConditionalFormattingDialog } from '../../Dialogs/ConditionalFormattingDialog';

export const StylesGroup: React.FC = () => {
  const { applyFormat, clearFormat } = useWorkbookStore();
  const { showToast } = useUIStore();
  const [showCFDialog, setShowCFDialog] = useState(false);

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
            { id: 'highlight', label: 'Highlight Cell Rules', icon: Highlighter, onClick: () => setShowCFDialog(true) },
            { id: 'top-bottom', label: 'Top/Bottom Rules', icon: TrendingUp, onClick: () => setShowCFDialog(true) },
            { id: 'data-bars', label: 'Data Bars', icon: BarChart, onClick: () => setShowCFDialog(true) },
            { id: 'color-scales', label: 'Color Scales', icon: PaintBucket, onClick: () => setShowCFDialog(true) },
            { id: 'icon-sets', label: 'Icon Sets', icon: Shapes, onClick: () => setShowCFDialog(true) },
            { id: 'divider', label: '', onClick: () => {}, divider: true },
            { id: 'new-rule', label: 'New Rule...', icon: Plus, onClick: () => setShowCFDialog(true) },
            { id: 'clear-rules', label: 'Clear Rules', icon: Trash2, onClick: () => { clearFormat(); showToast('Rules cleared', 'success'); } },
            { id: 'manage-rules', label: 'Manage Rules...', icon: Settings, onClick: () => setShowCFDialog(true) },
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

      {/* Conditional Formatting Dialog */}
      {showCFDialog && (
        <ConditionalFormattingDialog onClose={() => setShowCFDialog(false)} />
      )}
    </RibbonGroup>
  );
};
