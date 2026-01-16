// ============================================================
// COMMENT PANEL
// ============================================================

import React, { useState } from 'react';
import { useCommentsStore } from '../../stores/commentsStore';
import { CommentThread } from './CommentThread';
import { X, Search, MessageSquare } from 'lucide-react';
import './Comments.css';

interface CommentPanelProps {
  sheetId: string;
}

export const CommentPanel: React.FC<CommentPanelProps> = ({ sheetId }) => {
  const [searchText, setSearchText] = useState('');

  const {
    getCommentsForSheet,
    toggleCommentsPanel,
    filter,
    setFilter,
  } = useCommentsStore();

  const comments = getCommentsForSheet(sheetId);

  const filteredComments = searchText
    ? comments.filter(c =>
        c.content.toLowerCase().includes(searchText.toLowerCase()) ||
        c.replies.some(r => r.content.toLowerCase().includes(searchText.toLowerCase()))
      )
    : comments;

  return (
    <div className="comment-panel">
      <div className="panel-header">
        <h3>Comments ({comments.length})</h3>
        <button className="close-btn" onClick={toggleCommentsPanel}>
          <X size={18} />
        </button>
      </div>

      <div className="panel-toolbar">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filter.showResolved}
            onChange={(e) => setFilter({ showResolved: e.target.checked })}
          />
          Show resolved
        </label>
      </div>

      <div className="comments-list">
        {filteredComments.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} color="#ccc" />
            <p>No comments yet</p>
            <span>Select a cell and click "New Comment"</span>
          </div>
        ) : (
          filteredComments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              sheetId={sheetId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentPanel;
