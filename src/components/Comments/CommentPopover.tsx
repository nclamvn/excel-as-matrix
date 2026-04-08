import React, { useState, useMemo } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { MentionInput } from './MentionInput';
import type { Mention, UserSuggestion } from '../../types/mention';

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
  const [mentions, setMentions] = useState<Mention[]>([]);
  const isEditing = !!existingComment;

  const localUser = usePresenceStore((s) => s.localUser);
  const remoteUsers = usePresenceStore((s) => s.remoteUsers);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const userSuggestions: UserSuggestion[] = useMemo(() => {
    const suggestions: UserSuggestion[] = [];
    if (localUser) {
      suggestions.push({
        id: localUser.userId,
        name: localUser.displayName,
        email: `${localUser.userId}@team`,
        avatar: localUser.avatarUrl,
      });
    }
    for (const user of remoteUsers.values()) {
      suggestions.push({
        id: user.userId,
        name: user.displayName,
        email: `${user.userId}@team`,
        avatar: user.avatarUrl,
      });
    }
    return suggestions;
  }, [localUser, remoteUsers]);

  const handleChange = (value: string, newMentions: Mention[]) => {
    setText(value);
    setMentions(newMentions);
  };

  const handleSave = () => {
    if (text.trim()) {
      if (isEditing) {
        editComment(row, col, text.trim());
      } else {
        addComment(row, col, text.trim());
      }

      // Trigger notifications for mentioned users
      for (const mention of mentions) {
        const mentioned = userSuggestions.find(
          (u) => u.name.toLowerCase() === mention.userName.toLowerCase()
        );
        if (mentioned && mentioned.id !== localUser?.userId) {
          addNotification({
            type: 'mention',
            workbookId: localUser?.workbookId || '',
            sheetId: localUser?.sheetId || '',
            cellId: `${row}:${col}`,
            commentId: '',
            mentionedBy: localUser?.userId || 'anonymous',
            mentionedByName: localUser?.displayName || 'Someone',
            mentionedUserId: mentioned.id,
            preview: text.trim(),
          });
        }
      }

      onClose();
    }
  };

  const handleDelete = () => {
    deleteComment(row, col);
    onClose();
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
        <button type="button" className="comment-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {existingComment && (
        <div className="comment-date">
          {new Date(existingComment.createdAt).toLocaleString()}
        </div>
      )}

      <MentionInput
        value={text}
        onChange={handleChange}
        onSubmit={handleSave}
        placeholder="Add a comment... Type @ to mention"
        users={userSuggestions}
        rows={3}
      />

      <div className="comment-footer">
        <span className="comment-hint">Ctrl+Enter to save</span>
        <div className="comment-actions">
          {isEditing && (
            <button type="button" className="comment-btn-delete" onClick={handleDelete}>
              <Trash2 size={14} />
            </button>
          )}
          <button type="button"
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
