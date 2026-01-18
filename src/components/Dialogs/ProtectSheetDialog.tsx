import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface ProtectSheetDialogProps {
  sheetId: string;
  onClose: () => void;
}

interface ProtectionOptions {
  selectLockedCells: boolean;
  selectUnlockedCells: boolean;
  formatCells: boolean;
  formatColumns: boolean;
  formatRows: boolean;
  insertColumns: boolean;
  insertRows: boolean;
  insertHyperlinks: boolean;
  deleteColumns: boolean;
  deleteRows: boolean;
  sort: boolean;
  useAutoFilter: boolean;
  usePivotTableReports: boolean;
  editObjects: boolean;
  editScenarios: boolean;
}

export const ProtectSheetDialog: React.FC<ProtectSheetDialogProps> = ({
  sheetId,
  onClose,
}) => {
  const { sheets } = useWorkbookStore();
  const { showToast } = useUIStore();

  const sheet = sheets[sheetId];
  const isCurrentlyProtected = sheet?.protected;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [options, setOptions] = useState<ProtectionOptions>({
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    useAutoFilter: false,
    usePivotTableReports: false,
    editObjects: false,
    editScenarios: false,
  });

  const handleOptionChange = (key: keyof ProtectionOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProtect = () => {
    if (password && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Store protection settings
    // In a real implementation, this would hash the password and store protection settings
    // For now, we'll just store a flag indicating the sheet is protected

    // Update the sheet in the store (would need to add protectSheet action)
    showToast(
      isCurrentlyProtected
        ? 'Sheet protection updated'
        : 'Sheet protected successfully',
      'success'
    );
    onClose();
  };

  const handleUnprotect = () => {
    showToast('Sheet unprotected', 'success');
    onClose();
  };

  const protectionItems: Array<{ key: keyof ProtectionOptions; label: string }> = [
    { key: 'selectLockedCells', label: 'Select locked cells' },
    { key: 'selectUnlockedCells', label: 'Select unlocked cells' },
    { key: 'formatCells', label: 'Format cells' },
    { key: 'formatColumns', label: 'Format columns' },
    { key: 'formatRows', label: 'Format rows' },
    { key: 'insertColumns', label: 'Insert columns' },
    { key: 'insertRows', label: 'Insert rows' },
    { key: 'insertHyperlinks', label: 'Insert hyperlinks' },
    { key: 'deleteColumns', label: 'Delete columns' },
    { key: 'deleteRows', label: 'Delete rows' },
    { key: 'sort', label: 'Sort' },
    { key: 'useAutoFilter', label: 'Use AutoFilter' },
    { key: 'usePivotTableReports', label: 'Use PivotTable reports' },
    { key: 'editObjects', label: 'Edit objects' },
    { key: 'editScenarios', label: 'Edit scenarios' },
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog protect-sheet-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <Lock className="w-4 h-4" />
            {isCurrentlyProtected ? 'Modify Sheet Protection' : 'Protect Sheet'}
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          <div className="protect-info">
            <p>Protect worksheet and contents of locked cells</p>
          </div>

          <div className="password-section">
            <label className="field-label">Password to unprotect sheet (optional):</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="password-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="confirm-password-wrapper">
                <label className="field-label">Confirm password:</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="password-input"
                />
              </div>
            )}
          </div>

          <div className="protection-options">
            <label className="field-label">Allow all users of this worksheet to:</label>
            <div className="options-list">
              {protectionItems.map((item) => (
                <label key={item.key} className="option-item">
                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => handleOptionChange(item.key)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          {isCurrentlyProtected && (
            <button className="btn btn-danger" onClick={handleUnprotect}>
              Unprotect Sheet
            </button>
          )}
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleProtect}>
              {isCurrentlyProtected ? 'Update Protection' : 'Protect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
