// ═══════════════════════════════════════════════════════════════════════════
// CHAT PANEL — AI Conversation Interface
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Loader2, AlertCircle, Trash2, Bot, User, X, Calculator, BarChart3, Zap } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import type { AIMessage } from '../../ai/types';

// ─────────────────────────────────────────────────────────────────────────────
// Message Component
// ─────────────────────────────────────────────────────────────────────────────

const ChatMessage: React.FC<{ message: AIMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={`ai-chat-message ${isUser ? 'ai-chat-message--user' : ''} ${isSystem ? 'ai-chat-message--system' : ''}`}
    >
      <div className="ai-chat-message-avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="ai-chat-message-content">
        <div className="ai-chat-message-text">{message.content}</div>
        {message.metadata?.tokensUsed && (
          <div className="ai-chat-message-meta">
            {message.metadata.tokensUsed} tokens
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Streaming Indicator
// ─────────────────────────────────────────────────────────────────────────────

const StreamingMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="ai-chat-message">
      <div className="ai-chat-message-avatar">
        <Bot size={16} />
      </div>
      <div className="ai-chat-message-content">
        <div className="ai-chat-message-text">
          {text}
          <span className="ai-chat-cursor">|</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const ChatPanel: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useAIStore((state) => state.messages);
  const isLoading = useAIStore((state) => state.isLoading);
  const isStreaming = useAIStore((state) => state.isStreaming);
  const streamingText = useAIStore((state) => state.streamingText);
  const currentInput = useAIStore((state) => state.currentInput);
  const error = useAIStore((state) => state.error);
  const config = useAIStore((state) => state.config);

  const setCurrentInput = useAIStore((state) => state.setCurrentInput);
  const sendMessage = useAIStore((state) => state.sendMessage);
  const streamMessage = useAIStore((state) => state.streamMessage);
  const clearMessages = useAIStore((state) => state.clearMessages);
  const clearError = useAIStore((state) => state.clearError);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    if (!currentInput.trim() || isLoading) return;

    // Use streaming in mock mode for better UX
    if (config.mockMode) {
      await streamMessage(currentInput);
    } else {
      await sendMessage(currentInput);
    }
  }, [currentInput, isLoading, config.mockMode, sendMessage, streamMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentInput(e.target.value);
    },
    [setCurrentInput]
  );

  return (
    <div className="ai-chat-panel">
      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="ai-welcome">
            {/* Title */}
            <h2 className="ai-welcome-title">
              AI Copilot
            </h2>
            <p className="ai-welcome-subtitle">
              Trợ lý thông minh cho spreadsheet
            </p>

            {/* Feature Cards */}
            <div className="ai-welcome-features">
              <div className="ai-feature-card">
                <Calculator size={18} />
                <span>Formulas</span>
              </div>
              <div className="ai-feature-card">
                <BarChart3 size={18} />
                <span>Phân tích</span>
              </div>
              <div className="ai-feature-card">
                <Zap size={18} />
                <span>Tự động hóa</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="ai-welcome-suggestions">
              <p className="ai-suggestions-label">Thử hỏi:</p>
              <div className="ai-suggestion-pills">
                <button
                  className="ai-suggestion-pill"
                  onClick={() => setCurrentInput('Tính tổng cột A')}
                >
                  Tính tổng cột A
                </button>
                <button
                  className="ai-suggestion-pill"
                  onClick={() => setCurrentInput('Tìm giá trị lớn nhất')}
                >
                  Giá trị lớn nhất
                </button>
                <button
                  className="ai-suggestion-pill"
                  onClick={() => setCurrentInput('Giải thích formula này')}
                >
                  Giải thích formula
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isStreaming && streamingText && (
          <StreamingMessage text={streamingText} />
        )}

        {isLoading && !isStreaming && (
          <div className="ai-chat-loading">
            <Loader2 size={16} className="ai-chat-spinner" />
            <span>Đang suy nghĩ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="ai-chat-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={clearError} className="ai-chat-error-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="ai-chat-input-container">
        <div className="ai-chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder="Hỏi AI về spreadsheet..."
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button
            className="ai-chat-send-btn"
            onClick={handleSend}
            disabled={!currentInput.trim() || isLoading}
          >
            {isLoading ? <Loader2 size={18} className="ai-chat-spinner" /> : <ArrowRight size={18} />}
          </button>
        </div>
        <div className="ai-chat-input-footer">
          <button
            className="ai-chat-clear-btn"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            <Trash2 size={14} />
            <span>Xóa chat</span>
          </button>
          {config.mockMode && (
            <span className="ai-chat-mode-indicator">Demo Mode</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
