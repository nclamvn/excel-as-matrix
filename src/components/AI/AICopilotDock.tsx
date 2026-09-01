// ═══════════════════════════════════════════════════════════════════════════
// AI COPILOT DOCK — Main Container Component
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect } from 'react';
import { X, MessageSquare, Zap, Eye, History, Sparkles } from 'lucide-react';
import { useAIStore } from '../../stores/aiStore';
import type { AICopilotTab } from '../../ai/types';
import { ChatPanel } from './ChatPanel';
import { ActionsPanel } from './ActionsPanel';
import { ContextPanel } from './ContextPanel';
import { HistoryPanel } from './HistoryPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Tab Configuration
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: AICopilotTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={16} /> },
  { id: 'context', label: 'Context', icon: <Eye size={16} /> },
  { id: 'history', label: 'History', icon: <History size={16} /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const AICopilotDock: React.FC = () => {
  const isOpen = useAIStore((state) => state.isOpen);
  const activeTab = useAIStore((state) => state.activeTab);
  const pendingActions = useAIStore((state) => state.pendingActions);
  const availability = useAIStore((state) => state.availability);
  const closePanel = useAIStore((state) => state.closePanel);
  const setActiveTab = useAIStore((state) => state.setActiveTab);
  const refreshAvailability = useAIStore((state) => state.refreshAvailability);

  useEffect(() => {
    if (isOpen) void refreshAvailability();
  }, [isOpen, refreshAvailability]);

  const statusLabel =
    availability.mode === 'configured'
      ? availability.transport === 'server-proxy'
        ? 'Live · Server'
        : 'Live · Browser key'
      : availability.mode === 'mock'
        ? 'Demo'
        : availability.mode === 'checking'
          ? 'Checking'
          : 'Offline';

  const handleTabChange = useCallback(
    (tab: AICopilotTab) => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  if (!isOpen) return null;

  return (
    <div className="ai-copilot-dock">
      {/* Header */}
      <div className="ai-copilot-header">
        <div className="ai-copilot-title">
          <Sparkles size={18} className="ai-copilot-icon" />
          <span>AI Copilot</span>
          <span
            className={`ai-copilot-badge ai-copilot-badge--${availability.mode}`}
            data-testid="ai-runtime-status"
            title={availability.reason}
          >
            {statusLabel}
          </span>
        </div>
        <div className="ai-copilot-actions">
          <button
            type="button"
            className="ai-copilot-btn ai-copilot-btn--icon"
            onClick={closePanel}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-copilot-tabs">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={`ai-copilot-tab ${activeTab === tab.id ? 'ai-copilot-tab--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === 'actions' && pendingActions.length > 0 && (
              <span className="ai-copilot-badge ai-copilot-badge--count">
                {pendingActions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ai-copilot-content">
        {activeTab === 'chat' && <ChatPanel />}
        {activeTab === 'actions' && <ActionsPanel />}
        {activeTab === 'context' && <ContextPanel />}
        {activeTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  );
};

export default AICopilotDock;
