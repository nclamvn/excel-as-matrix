// ============================================================
// COMMENT THREAD
// ============================================================

import React, { useState } from 'react';
import { useCommentsStore } from '../../stores/commentsStore';
import { CellComment } from '../../types/comments';
import { Check, RotateCcw, Pencil, Trash2, X } from 'lucide-react';

interface CommentThreadProps {
  comment: CellComment;
  sheetId: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ comment, sheetId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');

  const {
    updateComment,
    deleteComment,
    addReply,
    deleteReply,
    resolveComment,
    reopenComment,
    setActiveComment,
    activeCommentId,
    getAuthor,
  } = useCommentsStore();

  const author = getAuthor(comment.authorId);
  const isActive = activeCommentId === comment.id;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSave = () => {
    updateComment(comment.id, editContent, sheetId);
    setIsEditing(false);
  };

  const handleReply = () => {
    if (replyContent.trim()) {
      addReply(comment.id, replyContent, sheetId);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div
      className={`comment-thread ${isActive ? 'active' : ''} ${comment.resolved ? 'resolved' : ''}`}
      onClick={() => setActiveComment(comment.id)}
    >
      <div className="comment-header">
        <div
          className="author-avatar"
          style={{ backgroundColor: author?.color || '#888' }}
        >
          {author?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="comment-meta">
          <span className="author-name">{author?.name || 'Unknown'}</span>
          <span className="comment-cell">{comment.cellRef}</span>
          <span className="comment-time">{formatTime(comment.createdAt)}</span>
        </div>
        <div className="comment-actions">
          {comment.resolved ? (
            <button onClick={(e) => { e.stopPropagation(); reopenComment(comment.id, sheetId); }} title="Reopen">
              <RotateCcw size={14} />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); resolveComment(comment.id, sheetId); }} title="Resolve">
              <Check size={14} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteComment(comment.id, sheetId); }} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="comment-editor">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="editor-actions">
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>Cancel</button>
            <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="primary">Save</button>
          </div>
        </div>
      ) : (
        <div className="comment-content">{comment.content || <em>Empty comment</em>}</div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => {
            const replyAuthor = getAuthor(reply.authorId);
            return (
              <div key={reply.id} className="reply-item">
                <div className="reply-header">
                  <div
                    className="author-avatar small"
                    style={{ backgroundColor: replyAuthor?.color || '#888' }}
                  >
                    {replyAuthor?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="author-name">{replyAuthor?.name}</span>
                  <span className="reply-time">{formatTime(reply.createdAt)}</span>
                  <button
                    className="delete-reply"
                    onClick={(e) => { e.stopPropagation(); deleteReply(comment.id, reply.id, sheetId); }}
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="reply-content">{reply.content}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Input */}
      {!comment.resolved && (
        <div className="reply-area">
          {isReplying ? (
            <div className="reply-editor">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <div className="editor-actions">
                <button onClick={(e) => { e.stopPropagation(); setIsReplying(false); }}>Cancel</button>
                <button onClick={(e) => { e.stopPropagation(); handleReply(); }} className="primary">Reply</button>
              </div>
            </div>
          ) : (
            <button className="reply-btn" onClick={(e) => { e.stopPropagation(); setIsReplying(true); }}>
              Reply...
            </button>
          )}
        </div>
      )}

      {comment.resolved && <div className="resolved-badge"><Check size={12} /> Resolved</div>}
    </div>
  );
};

export default CommentThread;
