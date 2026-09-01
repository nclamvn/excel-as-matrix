// ============================================================
// MENTION INPUT — Textarea with @mention autocomplete
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import type { Mention, UserSuggestion } from '../../types/mention';
import './Mention.css';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  onSubmit: () => void;
  placeholder?: string;
  users: UserSuggestion[];
  rows?: number;
}

function parseMentions(text: string): Mention[] {
  const mentions: Mention[] = [];
  const regex = /@(\w+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      userId: '',
      userName: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  return mentions;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a comment... Type @ to mention',
  users,
  rows = 3,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart || 0;
      setCursorPosition(cursor);

      const textBeforeCursor = newValue.slice(0, cursor);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);

      if (atMatch) {
        setSearchQuery(atMatch[1]);
        setShowSuggestions(true);
        setSuggestionIndex(0);
      } else {
        setShowSuggestions(false);
      }

      const mentions = parseMentions(newValue);
      onChange(newValue, mentions);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (user: UserSuggestion) => {
      const textBeforeCursor = value.slice(0, cursorPosition);
      const textAfterCursor = value.slice(cursorPosition);
      const atIndex = textBeforeCursor.lastIndexOf('@');

      const newValue = textBeforeCursor.slice(0, atIndex) + `@${user.name} ` + textAfterCursor;
      const mentions = parseMentions(newValue);
      onChange(newValue, mentions);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [value, cursorPosition, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showSuggestions && filteredUsers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSuggestionIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSuggestionIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filteredUsers[suggestionIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[suggestionIndex]);
        } else if (e.key === 'Escape') {
          setShowSuggestions(false);
        }
        return;
      }

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, filteredUsers, suggestionIndex, insertMention, onSubmit]
  );

  return (
    <div className="mention-input-container">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="mention-input"
        rows={rows}
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <div className="mention-suggestions" role="listbox">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              role="option"
              aria-selected={index === suggestionIndex}
              className={`suggestion-item ${index === suggestionIndex ? 'active' : ''}`}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSuggestionIndex(index)}
            >
              <div className="suggestion-avatar">
                {user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0).toUpperCase()}
              </div>
              <div className="suggestion-info">
                <span className="suggestion-name">{user.name}</span>
                <span className="suggestion-email">{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
