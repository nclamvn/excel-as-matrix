import React from 'react';
import { Save, Undo2, Redo2, Printer, Mail } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';
import { PremiumTooltip } from '../Premium/PremiumTooltip';

interface QuickAccessButtonProps {
  icon: React.ElementType;
  tooltip: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({
  icon: Icon,
  tooltip,
  shortcut,
  onClick,
  disabled,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="quick-access-bar__btn"
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon />
      </button>
      {showTooltip && buttonRef.current && (
        <PremiumTooltip
          title={tooltip}
          shortcut={shortcut}
          anchorEl={buttonRef.current}
        />
      )}
    </div>
  );
};

export const QuickAccessBar: React.FC = () => {
  const { workbookName, undo, redo, canUndo, canRedo } = useWorkbookStore();
  const { showToast } = useUIStore();

  const handleSave = () => {
    // Save to localStorage
    const state = useWorkbookStore.getState();
    const saveData = {
      workbookId: state.workbookId,
      workbookName: state.workbookName,
      sheets: state.sheets,
      sheetOrder: state.sheetOrder,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('excelai-workbook', JSON.stringify(saveData));
    showToast('Workbook saved', 'success');
  };

  const handleUndo = () => {
    if (canUndo()) {
      undo();
      showToast('Undo', 'info');
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      redo();
      showToast('Redo', 'info');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    // Copy workbook URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
  };

  return (
    <div className="quick-access-bar">
      <div className="quick-access-bar__actions">
        <QuickAccessButton
          icon={Save}
          tooltip="Save"
          shortcut="Ctrl+S"
          onClick={handleSave}
        />
        <QuickAccessButton
          icon={Undo2}
          tooltip="Undo"
          shortcut="Ctrl+Z"
          onClick={handleUndo}
        />
        <QuickAccessButton
          icon={Redo2}
          tooltip="Redo"
          shortcut="Ctrl+Y"
          onClick={handleRedo}
        />
        <div className="quick-access-bar__divider" />
        <QuickAccessButton
          icon={Printer}
          tooltip="Print"
          shortcut="Ctrl+P"
          onClick={handlePrint}
        />
        <QuickAccessButton
          icon={Mail}
          tooltip="Share via Email"
          onClick={handleShare}
        />
      </div>

      <span className="quick-access-bar__title">
        {workbookName || 'Untitled Workbook'}
      </span>
    </div>
  );
};
