import React from 'react';

interface RibbonGroupPremiumProps {
  label: string;
  children: React.ReactNode;
  showDialogLauncher?: boolean;
  onDialogLaunch?: () => void;
}

export const RibbonGroupPremium: React.FC<RibbonGroupPremiumProps> = ({
  label,
  children,
  showDialogLauncher = false,
  onDialogLaunch,
}) => {
  return (
    <div className="ribbon-group-premium">
      <div className="ribbon-group__content">
        {children}
      </div>
      <div className="ribbon-group__label">
        {label}
        {showDialogLauncher && (
          <button
            className="ribbon-group__dialog-launcher"
            onClick={onDialogLaunch}
            title={`${label} settings`}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M1 1h4v4H1zM6 3v4H2M7 7" stroke="currentColor" fill="none" strokeWidth="1" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
