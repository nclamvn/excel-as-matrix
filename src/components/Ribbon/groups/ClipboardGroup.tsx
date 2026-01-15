import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonSplitButton } from '../RibbonSplitButton';
import { RibbonButton } from '../RibbonButton';
import { Clipboard, ClipboardCopy, ClipboardPaste, Scissors, Paintbrush } from 'lucide-react';
import { useWorkbookStore } from '../../../stores/workbookStore';
import { useUIStore } from '../../../stores/uiStore';

export const ClipboardGroup: React.FC = () => {
  const { copy, cut, paste } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handlePaste = (type?: string) => {
    const mode = type === 'values' ? 'values'
      : type === 'formulas' ? 'formulas'
      : type === 'formatting' ? 'formatting'
      : 'all';
    paste(mode);
    showToast('Pasted', 'success');
  };

  const handleCut = () => {
    cut();
    showToast('Cut to clipboard', 'info');
  };

  const handleCopy = () => {
    copy();
    showToast('Copied to clipboard', 'info');
  };

  return (
    <RibbonGroup label="Clipboard" showDialogLauncher>
      <div className="clipboard-group-layout">
        <RibbonSplitButton
          icon={ClipboardPaste}
          label="Paste"
          onClick={() => handlePaste()}
          size="large"
          options={[
            { id: 'paste', label: 'Paste', icon: ClipboardPaste, onClick: () => handlePaste() },
            { id: 'paste-values', label: 'Paste Values', icon: Clipboard, onClick: () => handlePaste('values') },
            { id: 'paste-formulas', label: 'Paste Formulas', icon: Clipboard, onClick: () => handlePaste('formulas') },
            { id: 'paste-formatting', label: 'Paste Formatting', icon: Paintbrush, onClick: () => handlePaste('formatting') },
            { id: 'paste-special', label: 'Paste Special...', icon: Clipboard, onClick: () => handlePaste('special') },
          ]}
        />
        <div className="clipboard-buttons">
          <RibbonButton icon={Scissors} label="Cut" onClick={handleCut} title="Cut (Ctrl+X)" />
          <RibbonButton icon={ClipboardCopy} label="Copy" onClick={handleCopy} title="Copy (Ctrl+C)" />
          <RibbonButton icon={Paintbrush} label="Format Painter" title="Format Painter" />
        </div>
      </div>
    </RibbonGroup>
  );
};
