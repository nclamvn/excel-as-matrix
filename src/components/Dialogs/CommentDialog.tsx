import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface CommentDialogProps {
  row: number;
  col: number;
  onClose: () => void;
}

export const CommentDialog: React.FC<CommentDialogProps> = ({ row, col, onClose }) => {
  const { addComment, editComment, deleteComment, getComment } = useWorkbookStore();
  const { showToast } = useUIStore();

  const existingComment = getComment(row, col);
  const [commentText, setCommentText] = useState(existingComment?.text || '');
  const isEditing = !!existingComment;

  useEffect(() => {
    if (existingComment) {
      setCommentText(existingComment.text);
    }
  }, [existingComment]);

  const handleSave = () => {
    if (!commentText.trim()) {
      showToast('Please enter a comment', 'warning');
      return;
    }

    if (isEditing) {
      editComment(row, col, commentText.trim());
      showToast('Comment updated', 'success');
    } else {
      addComment(row, col, commentText.trim());
      showToast('Comment added', 'success');
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(row, col);
      showToast('Comment deleted', 'success');
      onClose();
    }
  };

  // Convert to cell reference
  const colLetter = String.fromCharCode(65 + (col % 26));
  const cellRef = `${colLetter}${row + 1}`;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog comment-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>
            <MessageSquare className="w-4 h-4" />
            {isEditing ? 'Edit Comment' : 'Add Comment'}
          </h3>
          <button className="dialog-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="dialog-content">
          <div className="comment-cell-info">
            <span className="cell-ref">Cell: {cellRef}</span>
            {existingComment && (
              <span className="comment-author">By: {existingComment.author}</span>
            )}
          </div>

          <div className="comment-input-section">
            <label className="field-label">Comment:</label>
            <textarea
              className="comment-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment here..."
              rows={4}
              autoFocus
            />
          </div>
        </div>

        <div className="dialog-footer">
          {isEditing && (
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {isEditing ? 'Update' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
