// ═══════════════════════════════════════════════════════════════════════════
// COMPLIANCE DASHBOARD — SOC2 control status visualization
// Shows real-time health of all compliance controls
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  Download,
  Lock,
  Cloud,
  Eye,
  UserCheck,
  Cpu,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ControlCheck {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'not_configured';
  evidence: string;
  lastChecked: string;
}

interface HealthResponse {
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    notConfigured: number;
    score: number;
    ready: boolean;
  };
  controls: ControlCheck[];
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  security: { icon: <Lock size={14} />, label: 'Security' },
  availability: { icon: <Cloud size={14} />, label: 'Availability' },
  confidentiality: { icon: <Eye size={14} />, label: 'Confidentiality' },
  privacy: { icon: <UserCheck size={14} />, label: 'Privacy' },
  processing_integrity: { icon: <Cpu size={14} />, label: 'Processing Integrity' },
};

const STATUS_CONFIG = {
  pass: { icon: <CheckCircle size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Pass' },
  fail: { icon: <XCircle size={14} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', label: 'Fail' },
  warning: { icon: <AlertTriangle size={14} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Warning' },
  not_configured: { icon: <Settings size={14} />, color: 'text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800', label: 'Not Configured' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const ComplianceDashboard: React.FC = () => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/health');
      if (!res.ok) throw new Error('Failed to fetch compliance status');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const handleExportEvidence = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance/evidence');
      const evidence = await res.json();
      const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soc2-evidence-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, []);

  // Group controls by category
  const grouped = data?.controls.reduce((acc, ctrl) => {
    if (!acc[ctrl.category]) acc[ctrl.category] = [];
    acc[ctrl.category].push(ctrl);
    return acc;
  }, {} as Record<string, ControlCheck[]>) || {};

  return (
    <div className={`p-6 max-w-4xl mx-auto ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`} data-testid="compliance-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield size={20} className="text-emerald-500" />
            SOC2 Compliance Dashboard
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Trust Service Criteria control status
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={fetchHealth}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'}`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button type="button"
            onClick={handleExportEvidence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Download size={14} />
            Export Evidence
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${isDark ? 'bg-rose-900/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
          {error} — Make sure the server is running.
        </div>
      )}

      {/* Score Card */}
      {data && (
        <div className={`p-5 rounded-xl mb-6 border ${data.summary.ready
          ? isDark ? 'border-emerald-800 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50'
          : isDark ? 'border-amber-800 bg-amber-900/10' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold font-mono">
                {data.summary.score}%
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {data.summary.passed}/{data.summary.total} controls passing
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <StatBadge label="Pass" count={data.summary.passed} color="emerald" />
              <StatBadge label="Fail" count={data.summary.failed} color="rose" />
              <StatBadge label="Warn" count={data.summary.warnings} color="amber" />
              <StatBadge label="N/A" count={data.summary.notConfigured} color="neutral" />
            </div>
          </div>
          <div className={`mt-3 text-xs font-medium ${data.summary.ready ? 'text-emerald-600' : 'text-amber-600'}`}>
            {data.summary.ready ? 'Audit-ready: all critical controls passing' : 'Action required: resolve failing controls before audit'}
          </div>
        </div>
      )}

      {/* Controls by Category */}
      {data && Object.entries(grouped).map(([category, controls]) => {
        const catConfig = CATEGORY_CONFIG[category] || { icon: <Shield size={14} />, label: category };
        const isExpanded = expandedCategory === category;
        const allPass = controls.every((c) => c.status === 'pass');

        return (
          <div key={category} className={`mb-3 rounded-lg border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
            <button type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left ${isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-neutral-50'}`}
            >
              {catConfig.icon}
              <span className="text-sm font-semibold flex-1">{catConfig.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${allPass
                ? isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                : isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700'
              }`}>
                {controls.filter((c) => c.status === 'pass').length}/{controls.length}
              </span>
            </button>

            {isExpanded && (
              <div className={`px-4 pb-3 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                {controls.map((ctrl) => {
                  const st = STATUS_CONFIG[ctrl.status];
                  return (
                    <div key={ctrl.id} className="flex items-start gap-3 py-2.5">
                      <span className={`mt-0.5 ${st.color}`}>{st.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{ctrl.id}</span>
                          <span className="text-sm font-medium">{ctrl.name}</span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{ctrl.description}</p>
                        <p className={`text-xs mt-1 font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Evidence: {ctrl.evidence}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StatBadge: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className="text-center">
    <div className={`text-lg font-bold text-${color}-500`}>{count}</div>
    <div className="text-[10px] text-neutral-400">{label}</div>
  </div>
);

export default ComplianceDashboard;
