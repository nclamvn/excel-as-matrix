// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING TOUR — 5-step guided introduction for new users
// Steps: Welcome → Basic Editing → AI Copilot → Formulas → Shortcuts
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Table2,
  MessageSquare,
  FunctionSquare,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour Steps
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ExcelAI',
    description:
      'Your AI-powered spreadsheet that understands your data. Let us show you the essentials.',
    icon: <Sparkles size={32} className="text-emerald-500" />,
    tips: [
      'ExcelAI works like Excel — with AI superpowers built in',
      'Import your existing .xlsx, .csv, or .xls files',
      'Works offline with automatic sync when you reconnect',
    ],
  },
  {
    id: 'editing',
    title: 'Basic Editing',
    description: 'Click any cell to select it. Type to enter data. Press Enter to confirm.',
    icon: <Table2 size={32} className="text-blue-500" />,
    tips: [
      'Double-click a cell to edit its contents',
      'Tab moves to the next cell, Shift+Tab moves back',
      'Drag the corner of a selection to auto-fill',
      'Right-click for contextual actions',
    ],
  },
  {
    id: 'ai-copilot',
    title: 'AI Copilot',
    description: 'Your intelligent assistant that helps with formulas, analysis, and data tasks.',
    icon: <MessageSquare size={32} className="text-purple-500" />,
    tips: [
      'Press Cmd+K to open the AI command palette',
      'Ask questions in natural language: "Sum column A"',
      'AI always cites its sources with cell references',
      "Review and approve AI changes before they're applied",
    ],
  },
  {
    id: 'formulas',
    title: 'Smart Formulas',
    description: 'Type formulas directly or describe what you need in plain English.',
    icon: <FunctionSquare size={32} className="text-orange-500" />,
    tips: [
      'Type = to start a formula (e.g., =SUM(A1:A10))',
      '162 functions across 17 categories available',
      'AI can write complex formulas for you — just describe what you need',
      'Formula errors show helpful explanations',
    ],
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Work faster with these essential shortcuts.',
    icon: <Keyboard size={32} className="text-teal-500" />,
    tips: [
      'Cmd+K — AI Command Palette',
      'Cmd+Z / Cmd+Shift+Z — Undo / Redo',
      'Cmd+C / Cmd+V — Copy / Paste',
      'Cmd+S — Save workbook',
      'Ctrl+Space — Autocomplete formula',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Storage key
// ─────────────────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'excelai-onboarding-completed';

function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // Storage not available
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const OnboardingTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  // Show on first visit
  useEffect(() => {
    if (!isOnboardingCompleted()) {
      // Small delay so the app renders first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    markOnboardingCompleted();
    setIsVisible(false);
  }, []);

  const handleFinish = useCallback(() => {
    markOnboardingCompleted();
    setIsVisible(false);
  }, []);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      data-testid="onboarding-tour"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
          ${isDark ? 'bg-neutral-900' : 'bg-white'}
        `}
      >
        {/* Progress bar */}
        <div className={`h-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkip}
          className={`
            absolute top-4 right-4 p-1.5 rounded-full z-10
            ${isDark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}
          `}
          aria-label="Skip tour"
          data-testid="onboarding-skip"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${
                    idx === currentStep
                      ? 'w-8 bg-emerald-500'
                      : idx < currentStep
                        ? 'w-4 bg-emerald-300'
                        : `w-4 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`
                  }
                `}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mb-4">{step.icon}</div>

          {/* Title */}
          <h2
            className={`text-xl font-bold mb-2 ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}
          >
            {step.title}
          </h2>

          {/* Description */}
          <p
            className={`text-sm mb-5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
          >
            {step.description}
          </p>

          {/* Tips */}
          <div className="space-y-2.5">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}
                  `}
                >
                  <Check size={12} />
                </div>
                <span
                  className={`text-sm leading-snug ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
                >
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with navigation */}
        <div
          className={`
            flex items-center justify-between px-8 py-4
            border-t
            ${isDark ? 'border-neutral-800' : 'border-neutral-100'}
          `}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${
                isFirst
                  ? 'opacity-0 cursor-default'
                  : isDark
                    ? 'text-neutral-400 hover:bg-neutral-800'
                    : 'text-neutral-500 hover:bg-neutral-100'
              }
            `}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* Step counter */}
          <span className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>

          {/* Next / Finish button */}
          {isLast ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              data-testid="onboarding-finish"
            >
              Get Started
              <Sparkles size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              data-testid="onboarding-next"
            >
              Next
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Reset onboarding state (for testing or settings)
 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
}

export default OnboardingTour;
