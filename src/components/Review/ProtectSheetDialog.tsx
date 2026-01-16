// ============================================================
// PROTECT SHEET DIALOG
// ============================================================

import React, { useState } from 'react';
import { useProtectionStore } from '../../stores/protectionStore';
import { DEFAULT_SHEET_PROTECTION } from '../../types/protection';
import { X, Shield, ShieldOff } from 'lucide-react';
import './Protection.css';

interface ProtectSheetDialogProps {
  sheetId: string;
  onClose: () => void;
}

export const ProtectSheetDialog: React.FC<ProtectSheetDialogProps> = ({ sheetId, onClose }) => {
  const { sheetProtection, protectSheet, unprotectSheet, isSheetProtected } = useProtectionStore();

  const isProtected = isSheetProtected(sheetId);
  const currentProtection = sheetProtection[sheetId] || DEFAULT_SHEET_PROTECTION;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [options, setOptions] = useState(currentProtection.allowedActions);
  const [error, setError] = useState('');

  const handleProtect = () => {
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    protectSheet(sheetId, password || undefined, options);
    onClose();
  };

  const handleUnprotect = () => {
    if (currentProtection.passwordHash && !password) {
      setError('Password required to unprotect');
      return;
    }

    const success = unprotectSheet(sheetId, password || undefined);
    if (!success) {
      setError('Incorrect password');
      return;
    }
    onClose();
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatOptionLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog protect-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            {isProtected ? (
              <><ShieldOff size={20} /> Unprotect Sheet</>
            ) : (
              <><Shield size={20} /> Protect Sheet</>
            )}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-content">
          {isProtected ? (
            <div className="unprotect-section">
              <p>This sheet is currently protected.</p>
              {currentProtection.passwordHash && (
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to unprotect"
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Password (optional):</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              {password && (
                <div className="form-group">
                  <label>Confirm Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                  />
                </div>
              )}

              <div className="options-section">
                <label>Allow users to:</label>
                <div className="options-grid">
                  {Object.entries(options).map(([key, value]) => (
                    <label key={key} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleOption(key as keyof typeof options)}
                      />
                      <span>{formatOptionLabel(key)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="dialog-footer">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={isProtected ? handleUnprotect : handleProtect}
          >
            {isProtected ? 'Unprotect' : 'Protect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectSheetDialog;
