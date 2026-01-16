// =============================================================================
// NL MACRO INPUT — Natural language macro creation
// =============================================================================

import React, { useState } from 'react';

interface NLMacroInputProps {
  onCreate: (description: string) => Promise<void>;
}

export const NLMacroInput: React.FC<NLMacroInputProps> = ({ onCreate }) => {
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isCreating) return;

    setIsCreating(true);
    await onCreate(description.trim());
    setDescription('');
    setIsCreating(false);
  };

  const examples = [
    'Every Monday, create a weekly sales report and email it to team@company.com',
    'When data changes, clean duplicates and format the table',
    'Generate a PDF report with charts and send notification',
    'Hàng tuần, tạo báo cáo và gửi email cho quản lý',
    'Khi có dữ liệu mới, làm sạch và tạo biểu đồ',
  ];

  return (
    <div className="nl-macro-input">
      <div className="input-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <div>
          <h3>Create Macro with AI</h3>
          <p>Describe what you want to automate</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Every Monday, create a sales report and email it to my manager..."
            rows={4}
            disabled={isCreating}
          />
          <button type="submit" disabled={!description.trim() || isCreating}>
            {isCreating ? (
              <div className="spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      <div className="examples">
        <span className="examples-label">Examples:</span>
        <div className="example-list">
          {examples.map((ex, i) => (
            <button
              key={i}
              className="example-item"
              onClick={() => setDescription(ex)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span>{ex}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NLMacroInput;
