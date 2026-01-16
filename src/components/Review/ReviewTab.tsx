// ============================================================
// REVIEW TAB - Main Ribbon Tab
// ============================================================

import React, { useState } from 'react';
import { useCommentsStore } from '../../stores/commentsStore';
import { useTrackChangesStore } from '../../stores/trackChangesStore';
import { useProtectionStore } from '../../stores/protectionStore';
import { CommentPanel } from './CommentPanel';
import { ChangesPanel } from './ChangesPanel';
import { ProtectSheetDialog } from './ProtectSheetDialog';
import {
  MessageSquarePlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MessagesSquare,
  FileText,
  Check,
  X,
  CheckCheck,
  XCircle,
  History,
  Shield,
  Lock
} from 'lucide-react';
import './ReviewTab.css';

interface ReviewTabProps {
  sheetId: string;
  selectedCell?: { row: number; col: number } | null;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({ sheetId, selectedCell }) => {
  const [showProtectDialog, setShowProtectDialog] = useState(false);

  const {
    addComment,
    deleteComment,
    goToNextComment,
    goToPrevComment,
    toggleCommentsPanel,
    toggleShowAllComments,
    showCommentsPanel,
    showAllComments,
    activeCommentId,
    getCommentsForSheet,
  } = useCommentsStore();

  const {
    settings: trackSettings,
    toggleTrackChanges,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    toggleChangesPanel,
    showChangesPanel,
    selectedChangeId,
    getPendingChanges,
  } = useTrackChangesStore();

  const { isSheetProtected, isWorkbookProtected } = useProtectionStore();

  const comments = getCommentsForSheet(sheetId);
  const pendingChanges = getPendingChanges(sheetId);

  const handleNewComment = () => {
    if (selectedCell) {
      const cellRef = `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}`;
      addComment(sheetId, cellRef, '');
    }
  };

  const handleDeleteComment = () => {
    if (activeCommentId) {
      deleteComment(activeCommentId, sheetId);
    }
  };

  return (
    <div className="review-tab">
      {/* Comments Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <button
            className="ribbon-btn-large"
            onClick={handleNewComment}
            title="New Comment"
          >
            <MessageSquarePlus size={24} color="#217346" />
            <span className="btn-label">New</span>
            <span className="btn-sublabel">Comment</span>
          </button>

          <div className="ribbon-btn-stack">
            <button
              className="ribbon-btn-small"
              onClick={handleDeleteComment}
              disabled={!activeCommentId}
              title="Delete Comment"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              className="ribbon-btn-small"
              onClick={() => goToPrevComment(sheetId)}
              disabled={comments.length === 0}
              title="Previous Comment"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="ribbon-btn-small"
              onClick={() => goToNextComment(sheetId)}
              disabled={comments.length === 0}
              title="Next Comment"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <div className="ribbon-btn-stack">
            <button
              className={`ribbon-btn-small ${showCommentsPanel ? 'active' : ''}`}
              onClick={toggleCommentsPanel}
            >
              <MessageSquare size={14} /> Show Panel
            </button>
            <button
              className={`ribbon-btn-small ${showAllComments ? 'active' : ''}`}
              onClick={toggleShowAllComments}
            >
              <MessagesSquare size={14} /> Show All
            </button>
          </div>
        </div>
        <div className="ribbon-group-title">Comments</div>
      </div>

      {/* Track Changes Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <button
            className={`ribbon-btn-large ${trackSettings.enabled ? 'active' : ''}`}
            onClick={toggleTrackChanges}
            title="Track Changes"
          >
            <FileText size={24} color={trackSettings.enabled ? '#217346' : '#666'} />
            <span className="btn-label">Track</span>
            <span className="btn-sublabel">{trackSettings.enabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="ribbon-btn-stack">
            <button
              className="ribbon-btn-small"
              onClick={() => selectedChangeId && acceptChange(selectedChangeId, sheetId)}
              disabled={!selectedChangeId}
            >
              <Check size={14} color="#16a34a" /> Accept
            </button>
            <button
              className="ribbon-btn-small"
              onClick={() => selectedChangeId && rejectChange(selectedChangeId, sheetId)}
              disabled={!selectedChangeId}
            >
              <X size={14} color="#dc2626" /> Reject
            </button>
          </div>

          <div className="ribbon-btn-stack">
            <button
              className="ribbon-btn-small"
              onClick={() => acceptAllChanges(sheetId)}
              disabled={pendingChanges.length === 0}
            >
              <CheckCheck size={14} color="#16a34a" /> Accept All
            </button>
            <button
              className="ribbon-btn-small"
              onClick={() => rejectAllChanges(sheetId)}
              disabled={pendingChanges.length === 0}
            >
              <XCircle size={14} color="#dc2626" /> Reject All
            </button>
          </div>

          <button
            className={`ribbon-btn-small ${showChangesPanel ? 'active' : ''}`}
            onClick={toggleChangesPanel}
          >
            <History size={14} /> History ({pendingChanges.length})
          </button>
        </div>
        <div className="ribbon-group-title">Changes</div>
      </div>

      {/* Protection Group */}
      <div className="ribbon-group">
        <div className="ribbon-group-content">
          <button
            className={`ribbon-btn-large ${isSheetProtected(sheetId) ? 'active' : ''}`}
            onClick={() => setShowProtectDialog(true)}
            title="Protect Sheet"
          >
            <Shield size={24} color={isSheetProtected(sheetId) ? '#217346' : '#666'} />
            <span className="btn-label">Protect</span>
            <span className="btn-sublabel">Sheet</span>
          </button>

          <button
            className={`ribbon-btn-small ${isWorkbookProtected() ? 'active' : ''}`}
            title="Protect Workbook"
          >
            <Lock size={14} /> Workbook
          </button>
        </div>
        <div className="ribbon-group-title">Protect</div>
      </div>

      {/* Panels */}
      {showCommentsPanel && <CommentPanel sheetId={sheetId} />}
      {showChangesPanel && <ChangesPanel sheetId={sheetId} />}

      {/* Dialogs */}
      {showProtectDialog && (
        <ProtectSheetDialog
          sheetId={sheetId}
          onClose={() => setShowProtectDialog(false)}
        />
      )}
    </div>
  );
};

export default ReviewTab;
