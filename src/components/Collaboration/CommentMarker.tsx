// =============================================================================
// COMMENT MARKER — Cell comment indicator (Blueprint §6.4)
// =============================================================================

import React from 'react';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface CommentMarkerProps {
  hasComments: boolean;
  commentCount?: number;
  hasUnresolved?: boolean;
  onClick?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md';
}

// -----------------------------------------------------------------------------
// Comment Marker Component
// -----------------------------------------------------------------------------

export const CommentMarker: React.FC<CommentMarkerProps> = ({
  hasComments,
  commentCount = 0,
  hasUnresolved = true,
  onClick,
  position = 'top-right',
  size = 'sm',
}) => {
  if (!hasComments) return null;

  const positionClasses: Record<string, string> = {
    'top-right': 'comment-marker--top-right',
    'top-left': 'comment-marker--top-left',
    'bottom-right': 'comment-marker--bottom-right',
    'bottom-left': 'comment-marker--bottom-left',
  };

  return (
    <button
      className={`comment-marker ${positionClasses[position]} comment-marker--${size} ${hasUnresolved ? 'comment-marker--unresolved' : 'comment-marker--resolved'}`}
      onClick={onClick}
      title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
      aria-label={`View ${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
    >
      {/* Triangle indicator */}
      <span className="comment-marker__triangle" />

      {/* Count badge (only show for multiple comments) */}
      {commentCount > 1 && size === 'md' && (
        <span className="comment-marker__count">{commentCount}</span>
      )}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Comment Cell Overlay (shows on hover)
// -----------------------------------------------------------------------------

interface CommentCellOverlayProps {
  cellRef: string;
  hasComments: boolean;
  isHovered: boolean;
  onClick: () => void;
}

export const CommentCellOverlay: React.FC<CommentCellOverlayProps> = ({
  cellRef,
  hasComments,
  isHovered,
  onClick,
}) => {
  if (!isHovered && !hasComments) return null;

  return (
    <div className="comment-cell-overlay">
      {hasComments ? (
        <CommentMarker
          hasComments
          onClick={onClick}
        />
      ) : (
        isHovered && (
          <button
            className="comment-cell-overlay__add"
            onClick={onClick}
            title={`Add comment to ${cellRef}`}
          >
            <AddCommentIcon />
          </button>
        )
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// New Comment Input (inline)
// -----------------------------------------------------------------------------

interface NewCommentInputProps {
  cellRef: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export const NewCommentInput: React.FC<NewCommentInputProps> = ({
  cellRef,
  onSubmit,
  onCancel,
  autoFocus = true,
}) => {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="new-comment-input">
      <div className="new-comment-input__header">
        <span className="new-comment-input__cell">{cellRef}</span>
        <button
          className="new-comment-input__close"
          onClick={onCancel}
          title="Cancel"
        >
          <CloseIcon />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="new-comment-input__textarea"
        placeholder="Add a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />
      <div className="new-comment-input__actions">
        <button
          className="new-comment-input__btn new-comment-input__btn--secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="new-comment-input__btn new-comment-input__btn--primary"
          onClick={handleSubmit}
          disabled={!content.trim()}
        >
          Comment
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const AddCommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 8v4M10 10h4" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export default CommentMarker;
