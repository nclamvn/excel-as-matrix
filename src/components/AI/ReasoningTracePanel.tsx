// ═══════════════════════════════════════════════════════════════════════════
// REASONING TRACE PANEL — Expandable view of AI decision chain
// Shows step-by-step reasoning for each AI response
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Brain,
  Search,
  Wrench,
  Target,
  Sparkles,
  HelpCircle,
  CheckCircle,
  FunctionSquare,
} from 'lucide-react';
import type { ReasoningTrace, ReasoningStep, ReasoningStepType } from '../../ai/reasoning/ReasoningTracer';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Step Type Config
// ─────────────────────────────────────────────────────────────────────────────

const STEP_CONFIG: Record<ReasoningStepType, { icon: React.ReactNode; color: string; label: string }> = {
  context_read: { icon: <Search size={14} />, color: 'text-blue-500', label: 'Read Data' },
  intent_parse: { icon: <Brain size={14} />, color: 'text-purple-500', label: 'Parse Intent' },
  tool_select: { icon: <Wrench size={14} />, color: 'text-orange-500', label: 'Select Tool' },
  tool_execute: { icon: <Target size={14} />, color: 'text-green-500', label: 'Execute' },
  data_analyze: { icon: <Sparkles size={14} />, color: 'text-cyan-500', label: 'Analyze' },
  formula_build: { icon: <FunctionSquare size={14} />, color: 'text-amber-500', label: 'Build Formula' },
  decision: { icon: <CheckCircle size={14} />, color: 'text-emerald-500', label: 'Decision' },
  confidence_check: { icon: <Target size={14} />, color: 'text-yellow-500', label: 'Confidence' },
  clarify: { icon: <HelpCircle size={14} />, color: 'text-rose-500', label: 'Clarify' },
  output: { icon: <Sparkles size={14} />, color: 'text-indigo-500', label: 'Output' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

interface ReasoningTracePanelProps {
  trace: ReasoningTrace | null;
}

export const ReasoningTracePanel: React.FC<ReasoningTracePanelProps> = ({ trace }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  if (!trace || trace.steps.length === 0) return null;

  const confidencePercent = Math.round(trace.overallConfidence * 100);
  const confidenceColor =
    confidencePercent >= 80 ? 'text-emerald-500' :
    confidencePercent >= 50 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div
      className={`
        mt-2 rounded-lg border text-xs
        ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-200 bg-neutral-50'}
      `}
      data-testid="reasoning-trace"
    >
      {/* Header — always visible */}
      <button type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg
          transition-colors
          ${isDark ? 'hover:bg-neutral-700/50' : 'hover:bg-neutral-100'}
        `}
        aria-expanded={isExpanded}
        aria-label="Toggle reasoning trace"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Brain size={14} className="text-purple-500" />
        <span className={isDark ? 'text-neutral-300' : 'text-neutral-600'}>
          Reasoning ({trace.steps.length} steps)
        </span>
        <span className={`ml-auto font-mono ${confidenceColor}`}>
          {confidencePercent}% confidence
        </span>
        <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>
          {trace.totalDurationMs}ms
        </span>
      </button>

      {/* Steps — expandable */}
      {isExpanded && (
        <div className={`px-3 pb-3 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
          <div className="mt-2 space-y-1">
            {trace.steps.map((step, idx) => (
              <ReasoningStepItem key={step.id} step={step} index={idx} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ReasoningStepItem: React.FC<{
  step: ReasoningStep;
  index: number;
  isDark: boolean;
}> = ({ step, index, isDark }) => {
  const [showDetails, setShowDetails] = useState(false);
  const config = STEP_CONFIG[step.type] || STEP_CONFIG.decision;

  const confidencePercent = Math.round(step.confidence * 100);

  return (
    <div
      className={`
        rounded-md
        ${isDark ? 'hover:bg-neutral-700/30' : 'hover:bg-white'}
      `}
    >
      <button type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
      >
        {/* Step number */}
        <span className={`w-5 text-center font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {index + 1}
        </span>

        {/* Icon */}
        <span className={config.color}>{config.icon}</span>

        {/* Title */}
        <span className={`flex-1 truncate ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
          {step.title}
        </span>

        {/* Confidence badge */}
        <span
          className={`
            px-1.5 py-0.5 rounded font-mono
            ${confidencePercent >= 80
              ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
              : confidencePercent >= 50
                ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'
                : isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-700'
            }
          `}
        >
          {confidencePercent}%
        </span>

        {/* Duration */}
        {step.durationMs > 0 && (
          <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>
            {step.durationMs}ms
          </span>
        )}

        {showDetails ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Details */}
      {showDetails && (
        <div className={`ml-7 mr-2 mb-2 pl-3 border-l-2 ${isDark ? 'border-neutral-600' : 'border-neutral-300'}`}>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            {step.description}
          </p>

          {step.inputs.length > 0 && (
            <div className="mt-1">
              <span className={`font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Inputs: </span>
              {step.inputs.map((input, i) => (
                <span key={i} className={`font-mono ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  {input}{i < step.inputs.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {step.output && (
            <div className="mt-1">
              <span className={`font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Output: </span>
              <span className={`font-mono ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {step.output}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReasoningTracePanel;
