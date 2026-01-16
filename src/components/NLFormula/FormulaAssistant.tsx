// =============================================================================
// FORMULA ASSISTANT — Side panel AI assistant for formulas
// =============================================================================

import React, { useState, useCallback } from 'react';
import { nlFormulaEngine } from '../../nlformula';
import type { CellContext, InterpretationResult } from '../../nlformula/types';
import { FormulaExplanation as FormulaExplanationComponent } from './FormulaExplanation';
import { FormulaDebugPanel } from './FormulaDebugPanel';

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface FormulaAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormula: string;
  context: CellContext;
  onInsertFormula: (formula: string) => void;
  language?: 'en' | 'vi';
}

// -----------------------------------------------------------------------------
// Tab Types
// -----------------------------------------------------------------------------

type AssistantTab = 'create' | 'explain' | 'debug' | 'examples';

// -----------------------------------------------------------------------------
// Formula Assistant Component
// -----------------------------------------------------------------------------

export const FormulaAssistant: React.FC<FormulaAssistantProps> = ({
  isOpen,
  onClose,
  currentFormula,
  context,
  onInsertFormula,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('create');
  const [nlInput, setNlInput] = useState('');
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle NL interpretation
  const handleInterpret = useCallback(async () => {
    if (!nlInput.trim()) return;

    setIsProcessing(true);
    try {
      const result = await nlFormulaEngine.interpret({
        text: nlInput,
        language: language === 'vi' ? 'vi' : 'en',
        context,
      });
      setInterpretation(result);
    } catch {
      setInterpretation(null);
    } finally {
      setIsProcessing(false);
    }
  }, [nlInput, language, context]);

  // Handle formula insertion
  const handleInsert = useCallback(() => {
    if (interpretation?.formula) {
      onInsertFormula(interpretation.formula);
      setNlInput('');
      setInterpretation(null);
    }
  }, [interpretation, onInsertFormula]);

  // Handle example click
  const handleExampleClick = useCallback((example: string) => {
    setNlInput(example);
    setActiveTab('create');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="formula-assistant">
      {/* Header */}
      <div className="formula-assistant__header">
        <h3 className="formula-assistant__title">
          <AssistantIcon /> Formula Assistant
        </h3>
        <button className="formula-assistant__close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {/* Tabs */}
      <div className="formula-assistant__tabs">
        <button
          className={`formula-assistant__tab ${activeTab === 'create' ? 'formula-assistant__tab--active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          className={`formula-assistant__tab ${activeTab === 'explain' ? 'formula-assistant__tab--active' : ''}`}
          onClick={() => setActiveTab('explain')}
        >
          Explain
        </button>
        <button
          className={`formula-assistant__tab ${activeTab === 'debug' ? 'formula-assistant__tab--active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          Debug
        </button>
        <button
          className={`formula-assistant__tab ${activeTab === 'examples' ? 'formula-assistant__tab--active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          Examples
        </button>
      </div>

      {/* Content */}
      <div className="formula-assistant__content">
        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="formula-assistant__create">
            <p className="formula-assistant__description">
              {language === 'vi'
                ? 'Mô tả công thức bạn muốn bằng ngôn ngữ tự nhiên:'
                : 'Describe the formula you want in natural language:'}
            </p>

            <div className="formula-assistant__input-group">
              <textarea
                className="formula-assistant__textarea"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'Ví dụ: Tính tổng cột A khi cột B là "Hoàn thành"'
                    : 'e.g., Sum column A where column B is "Complete"'
                }
                rows={3}
              />
              <button
                className="formula-assistant__button formula-assistant__button--primary"
                onClick={handleInterpret}
                disabled={isProcessing || !nlInput.trim()}
              >
                {isProcessing ? 'Processing...' : 'Generate Formula'}
              </button>
            </div>

            {/* Interpretation Result */}
            {interpretation && (
              <div className="formula-assistant__result">
                {interpretation.success ? (
                  <>
                    <div className="formula-assistant__formula">
                      <code>{interpretation.formula}</code>
                      <span className="formula-assistant__confidence">
                        {Math.round(interpretation.confidence * 100)}% confident
                      </span>
                    </div>
                    <p className="formula-assistant__explanation">
                      {interpretation.explanation}
                    </p>
                    <div className="formula-assistant__result-actions">
                      <button
                        className="formula-assistant__button formula-assistant__button--primary"
                        onClick={handleInsert}
                      >
                        Insert Formula
                      </button>
                      <button
                        className="formula-assistant__button formula-assistant__button--secondary"
                        onClick={() => setInterpretation(null)}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="formula-assistant__error">
                    <p>{interpretation.error}</p>
                    {interpretation.suggestions && interpretation.suggestions.length > 0 && (
                      <div className="formula-assistant__suggestions">
                        <span>Try:</span>
                        <ul>
                          {interpretation.suggestions.map((s, i) => (
                            <li key={i} onClick={() => setNlInput(s)}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explain Tab */}
        {activeTab === 'explain' && (
          <div className="formula-assistant__explain">
            {currentFormula && currentFormula.startsWith('=') ? (
              <FormulaExplanationComponent
                formula={currentFormula}
                context={context}
                language={language}
                expanded
              />
            ) : (
              <div className="formula-assistant__empty">
                <EmptyIcon />
                <p>
                  {language === 'vi'
                    ? 'Chọn một ô có công thức để xem giải thích'
                    : 'Select a cell with a formula to see its explanation'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="formula-assistant__debug">
            {currentFormula && currentFormula.startsWith('=') ? (
              <FormulaDebugPanel
                formula={currentFormula}
                onApplyFix={onInsertFormula}
              />
            ) : (
              <div className="formula-assistant__empty">
                <EmptyIcon />
                <p>
                  {language === 'vi'
                    ? 'Chọn một ô có công thức để kiểm tra lỗi'
                    : 'Select a cell with a formula to check for errors'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="formula-assistant__examples">
            <ExampleCategory
              title={language === 'vi' ? 'Phép tính cơ bản' : 'Basic Calculations'}
              examples={
                language === 'vi'
                  ? [
                      'Tính tổng cột A',
                      'Tính trung bình cột B',
                      'Đếm số ô trong cột C',
                    ]
                  : [
                      'Sum of column A',
                      'Average of column B',
                      'Count cells in column C',
                    ]
              }
              onExampleClick={handleExampleClick}
            />
            <ExampleCategory
              title={language === 'vi' ? 'Tính toán có điều kiện' : 'Conditional Calculations'}
              examples={
                language === 'vi'
                  ? [
                      'Tổng A khi B là "Hoàn thành"',
                      'Đếm A khi B lớn hơn 100',
                      'Trung bình A khi B là "Active"',
                    ]
                  : [
                      'Sum A where B is "Complete"',
                      'Count A when B is greater than 100',
                      'Average A if B equals "Active"',
                    ]
              }
              onExampleClick={handleExampleClick}
            />
            <ExampleCategory
              title={language === 'vi' ? 'Tra cứu' : 'Lookups'}
              examples={
                language === 'vi'
                  ? [
                      'Tìm giá trị A1 trong cột B',
                      'Tra cứu tên theo ID',
                    ]
                  : [
                      'Look up A1 in column B',
                      'Find name by ID',
                    ]
              }
              onExampleClick={handleExampleClick}
            />
            <ExampleCategory
              title={language === 'vi' ? 'Logic' : 'Logic'}
              examples={
                language === 'vi'
                  ? [
                      'Nếu A1 > 100 thì "Cao" ngược lại "Thấp"',
                      'Nếu A1 trống thì 0 ngược lại A1',
                    ]
                  : [
                      'If A1 > 100 then "High" else "Low"',
                      'If A1 is empty then 0 otherwise A1',
                    ]
              }
              onExampleClick={handleExampleClick}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="formula-assistant__footer">
        <span className="formula-assistant__hint">
          {language === 'vi' ? 'Hỗ trợ tiếng Việt và tiếng Anh' : 'Supports English and Vietnamese'}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Example Category Component
// -----------------------------------------------------------------------------

interface ExampleCategoryProps {
  title: string;
  examples: string[];
  onExampleClick: (example: string) => void;
}

const ExampleCategory: React.FC<ExampleCategoryProps> = ({
  title,
  examples,
  onExampleClick,
}) => (
  <div className="formula-assistant__example-category">
    <h4 className="formula-assistant__example-title">{title}</h4>
    <ul className="formula-assistant__example-list">
      {examples.map((example, index) => (
        <li
          key={index}
          className="formula-assistant__example-item"
          onClick={() => onExampleClick(example)}
        >
          {example}
        </li>
      ))}
    </ul>
  </div>
);

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const AssistantIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10H5a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2z" />
    <path d="M12 15v7" />
    <path d="M8 22h8" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

export default FormulaAssistant;
