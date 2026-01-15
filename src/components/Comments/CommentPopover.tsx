import React, { useState } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';

interface CommentPopoverProps {
  row: number;
  col: number;
  position: { x: number; y: number };
  onClose: () => void;
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({
  row,
  col,
  position,
  onClose,
}) => {
  const { addComment, editComment, deleteComment, getComment } = useWorkbookStore();
  const existingComment = getComment(row, col);

  const [text, setText] = useState(existingComment?.text || '');
  const isEditing = !!existingComment;

  const handleSave = () => {
    if (text.trim()) {
      if (isEditing) {
        editComment(row, col, text.trim());
      } else {
        addComment(row, col, text.trim());
      }
      onClose();
    }
  };

  const handleDelete = () => {
    deleteComment(row, col);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="comment-popover"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="comment-header">
        <div className="comment-header-left">
          <MessageSquare size={14} />
          <span className="comment-author">
            {existingComment?.author || 'New Comment'}
          </span>
        </div>
        <button className="comment-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {existingComment && (
        <div className="comment-date">
          {new Date(existingComment.createdAt).toLocaleString()}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        autoFocus
        rows={3}
      />

      <div className="comment-footer">
        <span className="comment-hint">Ctrl+Enter to save</span>
        <div className="comment-actions">
          {isEditing && (
            <button className="comment-btn-delete" onClick={handleDelete}>
              <Trash2 size={14} />
            </button>
          )}
          <button
            className="comment-btn-save"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            <Send size={14} />
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Comment indicator for cells with comments
export const CommentIndicator: React.FC = () => (
  <div className="comment-indicator" />
);
