import React, { ReactNode } from 'react';

interface RibbonGroupProps {
  label: string;
  children: ReactNode;
  showDialogLauncher?: boolean;
  onDialogLaunch?: () => void;
}

export const RibbonGroup: React.FC<RibbonGroupProps> = ({
  label,
  children,
  showDialogLauncher = false,
  onDialogLaunch,
}) => {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-content">
        {children}
      </div>
      <div className="ribbon-group-label">
        <span>{label}</span>
        {showDialogLauncher && (
          <button
            className="dialog-launcher"
            onClick={onDialogLaunch}
            title={`${label} Settings`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 0h6v6H0zM8 8h2v2H8z" fill="currentColor" />
              <path d="M7 3l3 3M3 7l3 3" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
