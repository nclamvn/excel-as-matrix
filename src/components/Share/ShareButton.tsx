// ============================================================
// SHARE BUTTON - Main share button in toolbar
// ============================================================

import React, { useState } from 'react';
import { ShareDialog } from './ShareDialog';
import { Share2, Loader2 } from 'lucide-react';
import './Share.css';

interface ShareButtonProps {
  isSyncing?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ isSyncing = false }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button className="share-button" onClick={() => setShowDialog(true)}>
        {isSyncing ? (
          <Loader2 size={16} className="share-icon spinning" />
        ) : (
          <Share2 size={16} className="share-icon" />
        )}
        <span>Share</span>
      </button>

      {showDialog && <ShareDialog onClose={() => setShowDialog(false)} />}
    </>
  );
};

export default ShareButton;
