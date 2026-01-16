// =============================================================================
// COMMENT THREAD — Threaded comments UI (Blueprint §6.4)
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import type {
  Comment,
  CommentThread as CommentThreadType,
  CollaborationUser,
} from '../../collaboration/types';
import { UserAvatar } from './CollaboratorsList';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface CommentThreadProps {
  thread: CommentThreadType;
  currentUser: CollaborationUser;
  onReply: (content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onResolve: () => void;
  onReopen: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface SingleCommentProps {
  comment: Comment;
  currentUser: CollaborationUser;
  onEdit: (content: string) => void;
  onDelete: () => void;
  isFirst?: boolean;
}

// -----------------------------------------------------------------------------
// Format relative time
// -----------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// -----------------------------------------------------------------------------
// Single Comment Component
// -----------------------------------------------------------------------------

const SingleComment: React.FC<SingleCommentProps> = ({
  comment,
  currentUser,
  onEdit,
  onDelete,
  isFirst = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAuthor = comment.author.id === currentUser.id;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editContent.length,
        editContent.length
      );
    }
  }, [isEditing, editContent.length]);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div
      className={`comment ${isFirst ? 'comment--first' : 'comment--reply'} ${comment.resolved ? 'comment--resolved' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="comment__header">
        <UserAvatar user={comment.author} size="sm" />
        <div className="comment__meta">
          <span className="comment__author">{comment.author.name}</span>
          <span className="comment__time">
            {formatRelativeTime(comment.createdAt)}
            {comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
              <span className="comment__edited">(edited)</span>
            )}
          </span>
        </div>
        {isAuthor && showActions && !isEditing && (
          <div className="comment__actions">
            <button
              className="comment__action"
              onClick={() => setIsEditing(true)}
              title="Edit"
            >
              <EditIcon />
            </button>
            <button
              className="comment__action comment__action--delete"
              onClick={onDelete}
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="comment__edit">
          <textarea
            ref={textareaRef}
            className="comment__textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="comment__edit-actions">
            <button
              className="comment__btn comment__btn--secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button
              className="comment__btn comment__btn--primary"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="comment__content">{comment.content}</p>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Comment Thread Component
// -----------------------------------------------------------------------------

export const CommentThread: React.FC<CommentThreadProps> = ({
  thread,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
  isExpanded = true,
  onToggleExpand,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const rootComment = thread.comments[0];
  const replies = thread.comments.slice(1);

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitReply();
    } else if (e.key === 'Escape') {
      setIsReplying(false);
      setReplyContent('');
    }
  };

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  if (!rootComment) return null;

  return (
    <div className={`comment-thread ${thread.resolved ? 'comment-thread--resolved' : ''}`}>
      {/* Thread header */}
      <div className="comment-thread__header">
        <span className="comment-thread__cell">{thread.cellRef}</span>
        {thread.resolved && (
          <span className="comment-thread__resolved-badge">Resolved</span>
        )}
        {onToggleExpand && (
          <button
            className="comment-thread__toggle"
            onClick={onToggleExpand}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Root comment */}
          <SingleComment
            comment={rootComment}
            currentUser={currentUser}
            onEdit={(content) => onEdit(rootComment.id, content)}
            onDelete={() => onDelete(rootComment.id)}
            isFirst
          />

          {/* Replies */}
          {replies.length > 0 && (
            <div className="comment-thread__replies">
              {replies.map((reply) => (
                <SingleComment
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onEdit={(content) => onEdit(reply.id, content)}
                  onDelete={() => onDelete(reply.id)}
                />
              ))}
            </div>
          )}

          {/* Reply input */}
          {isReplying ? (
            <div className="comment-thread__reply-form">
              <textarea
                ref={replyInputRef}
                className="comment__textarea"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
              />
              <div className="comment__edit-actions">
                <button
                  className="comment__btn comment__btn--secondary"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="comment__btn comment__btn--primary"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-thread__actions">
              <button
                className="comment-thread__action"
                onClick={() => setIsReplying(true)}
              >
                Reply
              </button>
              {thread.resolved ? (
                <button
                  className="comment-thread__action"
                  onClick={onReopen}
                >
                  Reopen
                </button>
              ) : (
                <button
                  className="comment-thread__action comment-thread__action--resolve"
                  onClick={onResolve}
                >
                  Resolve
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Comment Panel (sidebar view)
// -----------------------------------------------------------------------------

interface CommentPanelProps {
  threads: CommentThreadType[];
  currentUser: CollaborationUser;
  onReply: (threadId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  showResolved?: boolean;
  onToggleResolved?: () => void;
}

export const CommentPanel: React.FC<CommentPanelProps> = ({
  threads,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReopen,
  showResolved = false,
  onToggleResolved,
}) => {
  const filteredThreads = showResolved
    ? threads
    : threads.filter((t) => !t.resolved);

  const resolvedCount = threads.filter((t) => t.resolved).length;

  return (
    <div className="comment-panel">
      <div className="comment-panel__header">
        <h3 className="comment-panel__title">Comments</h3>
        <span className="comment-panel__count">
          {filteredThreads.length} {showResolved ? 'total' : 'open'}
        </span>
        {onToggleResolved && resolvedCount > 0 && (
          <button
            className="comment-panel__toggle-resolved"
            onClick={onToggleResolved}
          >
            {showResolved ? 'Hide' : 'Show'} resolved ({resolvedCount})
          </button>
        )}
      </div>

      <div className="comment-panel__list">
        {filteredThreads.length === 0 ? (
          <div className="comment-panel__empty">
            <CommentIcon />
            <p>No comments yet</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <CommentThread
              key={thread.id}
              thread={thread}
              currentUser={currentUser}
              onReply={(content) => onReply(thread.id, content)}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={() => onResolve(thread.id)}
              onReopen={() => onReopen(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Simple Icons
// -----------------------------------------------------------------------------

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const CommentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default CommentThread;
