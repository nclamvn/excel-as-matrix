// ═══════════════════════════════════════════════════════════════════════════
// AI AUTONOMY MODE TOGGLE — Switch between Copilot and Autopilot modes
// Copilot: AI suggests, user approves all changes
// Autopilot: AI auto-executes low-risk actions, user approves high-risk
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { Shield, Zap } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { getAIRuntime } from '../../ai/AIRuntime';
import type { AIAutonomyMode } from '../../ai/types';

interface AutonomyModeToggleProps {
  mode: AIAutonomyMode;
  onModeChange: (mode: AIAutonomyMode) => void;
  compact?: boolean;
}

export const AutonomyModeToggle: React.FC<AutonomyModeToggleProps> = ({
  mode,
  onModeChange,
  compact = false,
}) => {
  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const handleToggle = useCallback(() => {
    const newMode: AIAutonomyMode = mode === 'copilot' ? 'autopilot' : 'copilot';
    onModeChange(newMode);
    getAIRuntime().setAutonomyMode(newMode);
  }, [mode, onModeChange]);

  const isCopilot = mode === 'copilot';

  if (compact) {
    return (
      <button type="button"
        onClick={handleToggle}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
          transition-all duration-200
          ${isCopilot
            ? isDark
              ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            : isDark
              ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }
        `}
        title={isCopilot ? 'Copilot: AI suggests, you approve' : 'Autopilot: AI executes low-risk actions automatically'}
        aria-label={`AI mode: ${mode}. Click to switch.`}
        data-testid="autonomy-mode-toggle"
      >
        {isCopilot ? <Shield size={14} /> : <Zap size={14} />}
        {isCopilot ? 'Copilot' : 'Autopilot'}
      </button>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-1 p-1 rounded-lg
        ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}
      `}
      role="radiogroup"
      aria-label="AI autonomy mode"
      data-testid="autonomy-mode-group"
    >
      {/* Copilot */}
      <button type="button"
        onClick={() => { onModeChange('copilot'); getAIRuntime().setAutonomyMode('copilot'); }}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${isCopilot
            ? isDark
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-blue-600 text-white shadow-sm'
            : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-700'
          }
        `}
        role="radio"
        aria-checked={isCopilot}
        aria-label="Copilot mode: AI suggests, you approve all changes"
      >
        <Shield size={14} />
        Copilot
      </button>

      {/* Autopilot */}
      <button type="button"
        onClick={() => { onModeChange('autopilot'); getAIRuntime().setAutonomyMode('autopilot'); }}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200
          ${!isCopilot
            ? isDark
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-600 text-white shadow-sm'
            : isDark
              ? 'text-neutral-400 hover:text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-700'
          }
        `}
        role="radio"
        aria-checked={!isCopilot}
        aria-label="Autopilot mode: AI auto-executes low-risk actions"
      >
        <Zap size={14} />
        Autopilot
      </button>
    </div>
  );
};

export default AutonomyModeToggle;
