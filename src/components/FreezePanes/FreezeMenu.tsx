import React from 'react';

interface FreezeMenuProps {
  frozenRows: number;
  frozenCols: number;
  selectedRow: number;
  selectedCol: number;
  onFreeze: (rows: number, cols: number) => void;
  onClose: () => void;
}

export const FreezeMenu: React.FC<FreezeMenuProps> = ({
  frozenRows,
  frozenCols,
  selectedRow,
  selectedCol,
  onFreeze,
  onClose,
}) => {
  const hasFrozen = frozenRows > 0 || frozenCols > 0;

  const handleFreezeAtSelection = () => {
    onFreeze(selectedRow, selectedCol);
    onClose();
  };

  const handleFreezeTopRow = () => {
    onFreeze(1, 0);
    onClose();
  };

  const handleFreezeFirstColumn = () => {
    onFreeze(0, 1);
    onClose();
  };

  const handleUnfreeze = () => {
    onFreeze(0, 0);
    onClose();
  };

  return (
    <div className="absolute z-50 bg-white border rounded-lg shadow-lg py-1 min-w-48">
      {hasFrozen ? (
        <button
          onClick={handleUnfreeze}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <span>Unfreeze Panes</span>
        </button>
      ) : (
        <>
          <button
            onClick={handleFreezeAtSelection}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <div>Freeze Panes</div>
              <div className="text-xs text-gray-500">
                Freeze above and left of selection
              </div>
            </div>
          </button>

          <button
            onClick={handleFreezeTopRow}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Freeze Top Row</span>
          </button>

          <button
            onClick={handleFreezeFirstColumn}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Freeze First Column</span>
          </button>
        </>
      )}
    </div>
  );
};

export default FreezeMenu;
