// =============================================================================
// RECORDING INDICATOR — Show recording status
// =============================================================================

import React from 'react';
import type { RecordingSession } from '../../macros/types';

interface RecordingIndicatorProps {
  session: RecordingSession;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ session }) => {
  return (
    <div className="recording-indicator">
      <div className="recording-status">
        <span className="recording-dot" />
        <span className="recording-text">
          {session.status === 'paused' ? 'Recording Paused' : 'Recording...'}
        </span>
      </div>
      <div className="recording-stats">
        <span>{session.actions.length} actions recorded</span>
      </div>
    </div>
  );
};

export default RecordingIndicator;
