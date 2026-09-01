// ═══════════════════════════════════════════════════════════════════════════
// COMPETITIVE LANDING PAGE — "Why ExcelAI" with comparison tables
// Hero, feature pillars, vs Excel/Sheets/Airtable, social proof, CTA
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import {
  Sparkles,
  Shield,
  Zap,
  Globe,
  Users,
  Check,
  X,
  Minus,
  ArrowRight,
  Brain,
  Table2,
  FunctionSquare,
  Lock,
  Wifi,
  Keyboard,
} from 'lucide-react';

interface CompetitiveLandingProps {
  onEnterApp: () => void;
  onViewPricing?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Brain size={24} className="text-purple-500" />,
    title: 'AI That Understands Your Data',
    description:
      'Not just autocomplete — a copilot that reads your formulas, understands dependencies, and explains its reasoning.',
  },
  {
    icon: <Table2 size={24} className="text-blue-500" />,
    title: '162 Formula Functions',
    description:
      'Every Excel function you rely on — from VLOOKUP to LAMBDA — plus AI-powered natural language formulas.',
  },
  {
    icon: <Shield size={24} className="text-emerald-500" />,
    title: 'Enterprise Security',
    description:
      'SOC2 controls, PII redaction, field-level encryption, SCIM provisioning, and immutable audit logs.',
  },
  {
    icon: <Zap size={24} className="text-amber-500" />,
    title: 'Workflow Automation',
    description:
      'Record macros, build workflows in plain English, trigger via webhooks. No VBA required.',
  },
  {
    icon: <Globe size={24} className="text-cyan-500" />,
    title: 'Works Everywhere',
    description:
      'PWA with offline mode, mobile grid, and real-time collaboration. Your spreadsheet, anywhere.',
  },
  {
    icon: <Users size={24} className="text-rose-500" />,
    title: 'Real-Time Collaboration',
    description:
      'CRDT-based conflict resolution, presence indicators, threaded comments, and track changes.',
  },
];

type ComparisonValue = 'yes' | 'no' | 'partial' | string;

interface ComparisonRow {
  feature: string;
  excelai: ComparisonValue;
  excel: ComparisonValue;
  sheets: ComparisonValue;
  airtable: ComparisonValue;
}

const COMPARISON: ComparisonRow[] = [
  {
    feature: 'AI Copilot (built-in)',
    excelai: 'yes',
    excel: 'partial',
    sheets: 'partial',
    airtable: 'no',
  },
  {
    feature: 'Natural Language Formulas',
    excelai: 'yes',
    excel: 'no',
    sheets: 'no',
    airtable: 'no',
  },
  { feature: 'AI Reasoning Traces', excelai: 'yes', excel: 'no', sheets: 'no', airtable: 'no' },
  { feature: 'Proactive Data Insights', excelai: 'yes', excel: 'no', sheets: 'no', airtable: 'no' },
  { feature: 'Formula Functions', excelai: '162', excel: '500+', sheets: '400+', airtable: '30+' },
  {
    feature: 'Real-Time Collaboration',
    excelai: 'yes',
    excel: 'yes',
    sheets: 'yes',
    airtable: 'yes',
  },
  { feature: 'Offline Mode', excelai: 'yes', excel: 'yes', sheets: 'partial', airtable: 'no' },
  { feature: 'Crash Recovery', excelai: 'yes', excel: 'yes', sheets: 'yes', airtable: 'yes' },
  {
    feature: 'Workflow Automation',
    excelai: 'yes',
    excel: 'partial',
    sheets: 'partial',
    airtable: 'yes',
  },
  { feature: 'PII Auto-Redaction', excelai: 'yes', excel: 'no', sheets: 'no', airtable: 'no' },
  { feature: 'Field Encryption', excelai: 'yes', excel: 'no', sheets: 'no', airtable: 'no' },
  {
    feature: 'Immutable Audit Log',
    excelai: 'yes',
    excel: 'no',
    sheets: 'partial',
    airtable: 'partial',
  },
  { feature: 'SCIM Provisioning', excelai: 'yes', excel: 'yes', sheets: 'yes', airtable: 'yes' },
  {
    feature: 'Data Residency (EU/US/APAC)',
    excelai: 'yes',
    excel: 'yes',
    sheets: 'partial',
    airtable: 'partial',
  },
  { feature: 'Plugin Marketplace', excelai: 'yes', excel: 'yes', sheets: 'yes', airtable: 'yes' },
  { feature: 'Open Pricing', excelai: 'yes', excel: 'partial', sheets: 'yes', airtable: 'yes' },
];

const STATS = [
  { value: '162', label: 'Formula Functions' },
  { value: '1,875', label: 'Passing Tests' },
  { value: '<3s', label: 'First Load' },
  { value: '18', label: 'SOC2 Controls' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const CompetitiveLanding: React.FC<CompetitiveLandingProps> = ({
  onEnterApp,
  onViewPricing,
}) => {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Sparkles size={20} className="text-emerald-600" />
            <span className="text-emerald-800">Excel</span>
            <span className="text-neutral-400">AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-500">
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Features
            </a>
            <a href="#comparison" className="hover:text-neutral-900 transition-colors">
              Compare
            </a>
            {onViewPricing && (
              <button
                type="button"
                onClick={onViewPricing}
                className="hover:text-neutral-900 transition-colors"
              >
                Pricing
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onEnterApp}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-6">
            <Sparkles size={14} />
            AI-Native Spreadsheet
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            The spreadsheet that
            <br />
            <span className="text-emerald-600">thinks with you</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-8">
            Every formula function you know. AI that understands your data. Enterprise security
            built in. Not bolted on.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              Start Free <ArrowRight size={18} />
            </button>
            <a
              href="#comparison"
              className="px-6 py-3 text-neutral-600 font-medium hover:text-neutral-900 transition-colors"
            >
              See Comparison
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-emerald-600">{stat.value}</div>
                <div className="text-xs text-neutral-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-16 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why teams switch to ExcelAI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">How ExcelAI compares</h2>
          <p className="text-center text-neutral-500 mb-10">
            Honest comparison. Green means better, not perfect.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-500">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-700 bg-emerald-50/50">
                    ExcelAI
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-500">Excel 365</th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-500">
                    Google Sheets
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-neutral-500">Airtable</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-2.5 px-4 text-neutral-700">{row.feature}</td>
                    <td className="py-2.5 px-4 text-center bg-emerald-50/30">
                      <CellValue value={row.excelai} highlight />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <CellValue value={row.excel} />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <CellValue value={row.sheets} />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <CellValue value={row.airtable} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security Badges */}
      <section className="py-16 px-6 bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Enterprise-grade security</h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: <Lock size={20} />, label: 'AES-256 Encryption' },
              { icon: <Shield size={20} />, label: 'SOC2 Controls' },
              { icon: <Keyboard size={20} />, label: 'SCIM 2.0' },
              { icon: <FunctionSquare size={20} />, label: 'PII Redaction' },
              { icon: <Wifi size={20} />, label: 'Offline-First' },
              { icon: <Globe size={20} />, label: 'Data Residency' },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-sm"
              >
                <span className="text-emerald-400">{badge.icon}</span>
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to switch?</h2>
        <p className="text-neutral-500 mb-8 max-w-lg mx-auto">
          Import your existing .xlsx files. Start with the free plan. No credit card required.
        </p>
        <button
          type="button"
          onClick={onEnterApp}
          className="px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors text-lg flex items-center gap-2 mx-auto"
        >
          Get Started Free <ArrowRight size={20} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 px-6 text-center text-xs text-neutral-400">
        ExcelAI 2026. Built with AI, for humans who think in spreadsheets.
      </footer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Cell Renderer
// ─────────────────────────────────────────────────────────────────────────────

const CellValue: React.FC<{ value: ComparisonValue; highlight?: boolean }> = ({
  value,
  highlight,
}) => {
  if (value === 'yes') {
    return (
      <Check
        size={16}
        className={highlight ? 'text-emerald-600 mx-auto' : 'text-emerald-500 mx-auto'}
      />
    );
  }
  if (value === 'no') {
    return <X size={16} className="text-neutral-300 mx-auto" />;
  }
  if (value === 'partial') {
    return <Minus size={16} className="text-amber-400 mx-auto" />;
  }
  // Text value (e.g., "162")
  return (
    <span
      className={`text-xs font-mono ${highlight ? 'font-semibold text-emerald-700' : 'text-neutral-600'}`}
    >
      {value}
    </span>
  );
};

export default CompetitiveLanding;
