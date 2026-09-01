// ═══════════════════════════════════════════════════════════════════════════
// AI COST ANALYTICS DASHBOARD — Token usage, cost estimates, PII stats
// Reads from AIUsageLogger session stats and audit log
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Coins,
  Shield,
  Clock,
  TrendingUp,
  RefreshCw,
  Zap,
  MessageSquare,
  Wrench,
  Brain,
} from 'lucide-react';
import { aiUsageLogger, type AIUsageStats } from '../../audit/AIUsageLogger';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Cost Constants (Claude API pricing approximation)
// ─────────────────────────────────────────────────────────────────────────────

const COST_PER_INPUT_TOKEN = 3 / 1_000_000; // $3/MTok (Sonnet)
const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000; // $15/MTok (Sonnet)
// Approximate input/output ratio: 60% input, 40% output
const ESTIMATED_COST_PER_TOKEN = COST_PER_INPUT_TOKEN * 0.6 + COST_PER_OUTPUT_TOKEN * 0.4;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CostAnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const refreshStats = useCallback(() => {
    setStats(aiUsageLogger.getSessionStats());
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [refreshStats]);

  if (!stats) return null;

  const estimatedCost = stats.totalTokens * ESTIMATED_COST_PER_TOKEN;
  const errorRate =
    stats.totalRequests > 0 ? ((stats.totalErrors / stats.totalRequests) * 100).toFixed(1) : '0';

  // Action breakdown
  const actionEntries = Object.entries(stats.byAction).sort(([, a], [, b]) => b - a);

  return (
    <div
      className={`p-4 space-y-4 ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
      data-testid="cost-analytics-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-500" />
          AI Usage Analytics
        </h3>
        <button
          type="button"
          onClick={refreshStats}
          className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-neutral-100'}`}
          aria-label="Refresh stats"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Zap size={16} className="text-amber-500" />}
          label="Total Tokens"
          value={formatNumber(stats.totalTokens)}
          isDark={isDark}
        />
        <StatCard
          icon={<Coins size={16} className="text-emerald-500" />}
          label="Est. Cost"
          value={`$${estimatedCost.toFixed(4)}`}
          isDark={isDark}
        />
        <StatCard
          icon={<MessageSquare size={16} className="text-blue-500" />}
          label="Requests"
          value={String(stats.totalRequests)}
          isDark={isDark}
        />
        <StatCard
          icon={<Shield size={16} className="text-purple-500" />}
          label="PII Redacted"
          value={String(stats.totalPIIRedacted)}
          isDark={isDark}
        />
      </div>

      {/* Performance Metrics */}
      <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
        <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <TrendingUp size={14} />
          Performance
        </h4>
        <div className="space-y-2">
          <MetricRow
            label="Avg tokens/request"
            value={
              stats.totalRequests > 0 ? Math.round(stats.averageTokensPerRequest).toString() : '—'
            }
            isDark={isDark}
          />
          <MetricRow
            label="Avg response time"
            value={stats.totalRequests > 0 ? `${Math.round(stats.averageDurationMs)}ms` : '—'}
            isDark={isDark}
          />
          <MetricRow
            label="Error rate"
            value={`${errorRate}%`}
            alert={Number(errorRate) > 5}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Action Breakdown */}
      {actionEntries.length > 0 && (
        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <Wrench size={14} />
            By Action
          </h4>
          <div className="space-y-1.5">
            {actionEntries.map(([action, count]) => {
              const percentage =
                stats.totalRequests > 0 ? Math.round((count / stats.totalRequests) * 100) : 0;

              return (
                <div key={action} className="flex items-center gap-2">
                  <ActionIcon action={action} />
                  <span
                    className={`flex-1 text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}
                  >
                    {formatActionName(action)}
                  </span>
                  <span className="text-xs font-mono">{count}</span>
                  <div
                    className="w-16 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Projection */}
      {stats.totalRequests > 0 && (
        <div
          className={`p-3 rounded-lg border ${isDark ? 'border-amber-800 bg-amber-900/10' : 'border-amber-200 bg-amber-50'}`}
        >
          <h4 className="text-xs font-medium mb-1 flex items-center gap-1.5">
            <Brain size={14} className="text-amber-500" />
            Session Projection
          </h4>
          <p className={`text-xs ${isDark ? 'text-amber-300/70' : 'text-amber-700'}`}>
            At current rate: ~{formatNumber(Math.round(stats.averageTokensPerRequest * 100))}{' '}
            tokens/100 requests = ~$
            {(stats.averageTokensPerRequest * 100 * ESTIMATED_COST_PER_TOKEN).toFixed(3)}
          </p>
        </div>
      )}

      {/* Empty state */}
      {stats.totalRequests === 0 && (
        <div className={`text-center py-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
          <Clock size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">No AI usage yet this session</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}> = ({ icon, label, value, isDark }) => (
  <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span
        className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}
      >
        {label}
      </span>
    </div>
    <div className="text-lg font-semibold font-mono">{value}</div>
  </div>
);

const MetricRow: React.FC<{
  label: string;
  value: string;
  alert?: boolean;
  isDark: boolean;
}> = ({ label, value, alert, isDark }) => (
  <div className="flex items-center justify-between text-xs">
    <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>{label}</span>
    <span className={`font-mono ${alert ? 'text-rose-500 font-medium' : ''}`}>{value}</span>
  </div>
);

const ActionIcon: React.FC<{ action: string }> = ({ action }) => {
  if (action.startsWith('chat')) return <MessageSquare size={12} className="text-blue-400" />;
  if (action.startsWith('tool')) return <Wrench size={12} className="text-orange-400" />;
  if (action.startsWith('suggestion')) return <Zap size={12} className="text-purple-400" />;
  return <BarChart3 size={12} className="text-neutral-400" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatActionName(action: string): string {
  return action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default CostAnalyticsDashboard;
