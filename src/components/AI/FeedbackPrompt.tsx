// =============================================================================
// FEEDBACK PROMPT — Get user feedback (Blueprint §5.7)
// =============================================================================

import React, { useState } from 'react';
import type { FeedbackType, FeedbackCategory, UserFeedback } from '../../ai/conversation/types';
import { FEEDBACK_CATEGORIES } from '../../ai/conversation/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FeedbackPromptProps {
  conversationId: string;
  onSubmit: (feedback: Omit<UserFeedback, 'id' | 'providedAt'>) => void;
  onDismiss?: () => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({
  conversationId,
  onSubmit,
  onDismiss,
  className = '',
}) => {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [correction, setCorrection] = useState('');
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleQuickFeedback = (feedbackType: FeedbackType) => {
    if (feedbackType === 'thumbs_up') {
      onSubmit({
        conversationId,
        type: 'thumbs_up',
        rating: 5,
      });
    } else if (feedbackType === 'thumbs_down') {
      setType('thumbs_down');
      setShowDetails(true);
    }
  };

  const handleSubmit = () => {
    if (!type) return;

    onSubmit({
      conversationId,
      type,
      rating: rating || undefined,
      comment: comment || undefined,
      correction: correction || undefined,
      categories: categories.length > 0 ? categories : undefined,
    });
  };

  const toggleCategory = (category: FeedbackCategory) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Quick feedback view
  if (!showDetails) {
    return (
      <div className={`feedback-prompt feedback-prompt--quick ${className}`}>
        <span className="feedback-prompt__question">
          Was this helpful?
        </span>
        <div className="feedback-prompt__quick-actions">
          <button
            className="feedback-prompt__thumb feedback-prompt__thumb--up"
            onClick={() => handleQuickFeedback('thumbs_up')}
            title="Yes, this was helpful"
          >
            👍
          </button>
          <button
            className="feedback-prompt__thumb feedback-prompt__thumb--down"
            onClick={() => handleQuickFeedback('thumbs_down')}
            title="No, something was wrong"
          >
            👎
          </button>
          {onDismiss && (
            <button
              className="feedback-prompt__dismiss"
              onClick={onDismiss}
            >
              Not now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Detailed feedback view
  return (
    <div className={`feedback-prompt feedback-prompt--detailed ${className}`}>
      <div className="feedback-prompt__header">
        <h4 className="feedback-prompt__title">Help us improve</h4>
        <button
          className="feedback-prompt__close"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>

      {/* Rating */}
      <div className="feedback-prompt__section">
        <label className="feedback-prompt__label">How would you rate this?</label>
        <div className="feedback-prompt__rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`feedback-prompt__star ${
                star <= rating ? 'feedback-prompt__star--active' : ''
              }`}
              onClick={() => setRating(star)}
            >
              {star <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* What went wrong */}
      {type === 'thumbs_down' && (
        <div className="feedback-prompt__section">
          <label className="feedback-prompt__label">What went wrong?</label>
          <div className="feedback-prompt__categories">
            {FEEDBACK_CATEGORIES.map((category) => (
              <button
                key={category}
                className={`feedback-prompt__category ${
                  categories.includes(category)
                    ? 'feedback-prompt__category--selected'
                    : ''
                }`}
                onClick={() => toggleCategory(category)}
              >
                {formatCategory(category)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment */}
      <div className="feedback-prompt__section">
        <label className="feedback-prompt__label">
          Any additional comments? (optional)
        </label>
        <textarea
          className="feedback-prompt__textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more..."
          rows={2}
        />
      </div>

      {/* Correction */}
      {type === 'thumbs_down' && (
        <div className="feedback-prompt__section">
          <label className="feedback-prompt__label">
            What should have happened? (optional)
          </label>
          <textarea
            className="feedback-prompt__textarea"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Describe the expected behavior..."
            rows={2}
          />
        </div>
      )}

      {/* Actions */}
      <div className="feedback-prompt__actions">
        <button
          className="feedback-prompt__cancel"
          onClick={onDismiss}
        >
          Cancel
        </button>
        <button
          className="feedback-prompt__submit"
          onClick={handleSubmit}
          disabled={!type || rating === 0}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mini Feedback
// -----------------------------------------------------------------------------

interface MiniFeedbackProps {
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  className?: string;
}

export const MiniFeedback: React.FC<MiniFeedbackProps> = ({
  onThumbsUp,
  onThumbsDown,
  className = '',
}) => {
  return (
    <div className={`mini-feedback ${className}`}>
      <button
        className="mini-feedback__btn mini-feedback__btn--up"
        onClick={onThumbsUp}
        title="Good response"
      >
        👍
      </button>
      <button
        className="mini-feedback__btn mini-feedback__btn--down"
        onClick={onThumbsDown}
        title="Bad response"
      >
        👎
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Feedback Card
// -----------------------------------------------------------------------------

interface FeedbackCardProps {
  feedback: UserFeedback;
  className?: string;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  className = '',
}) => {
  return (
    <div className={`feedback-card ${className}`}>
      <div className="feedback-card__header">
        <span className="feedback-card__icon">
          {getFeedbackIcon(feedback.type)}
        </span>
        <span className="feedback-card__type">
          {formatFeedbackType(feedback.type)}
        </span>
        {feedback.rating && (
          <span className="feedback-card__rating">
            {'★'.repeat(feedback.rating)}
            {'☆'.repeat(5 - feedback.rating)}
          </span>
        )}
        <span className="feedback-card__time">
          {formatTime(feedback.providedAt)}
        </span>
      </div>

      {feedback.comment && (
        <p className="feedback-card__comment">{feedback.comment}</p>
      )}

      {feedback.correction && (
        <p className="feedback-card__correction">
          <strong>Expected:</strong> {feedback.correction}
        </p>
      )}

      {feedback.categories && feedback.categories.length > 0 && (
        <div className="feedback-card__categories">
          {feedback.categories.map((category) => (
            <span key={category} className="feedback-card__category">
              {formatCategory(category)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatCategory(category: FeedbackCategory): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getFeedbackIcon(type: FeedbackType): string {
  switch (type) {
    case 'thumbs_up':
      return '👍';
    case 'thumbs_down':
      return '👎';
    case 'correction':
      return '✏️';
    case 'suggestion':
      return '💡';
  }
}

function formatFeedbackType(type: FeedbackType): string {
  switch (type) {
    case 'thumbs_up':
      return 'Positive';
    case 'thumbs_down':
      return 'Negative';
    case 'correction':
      return 'Correction';
    case 'suggestion':
      return 'Suggestion';
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}

export default FeedbackPrompt;
