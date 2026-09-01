// ═══════════════════════════════════════════════════════════════════════════
// PLUGIN MARKETPLACE — Browse, install, and manage extensions
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import {
  Package,
  Search,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Database,
  BarChart3,
  Palette,
  Zap,
  Link2,
  Sparkles,
  Box,
} from 'lucide-react';
import {
  pluginManager,
  type InstalledPlugin,
  type PluginCategory,
  type PluginManifest,
} from '../../plugins/PluginManager';
import { useUIStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Category Config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<PluginCategory, { icon: React.ReactNode; label: string }> = {
  data: { icon: <Database size={14} />, label: 'Data' },
  analysis: { icon: <BarChart3 size={14} />, label: 'Analysis' },
  formatting: { icon: <Palette size={14} />, label: 'Formatting' },
  productivity: { icon: <Zap size={14} />, label: 'Productivity' },
  integration: { icon: <Link2 size={14} />, label: 'Integration' },
  ai: { icon: <Sparkles size={14} />, label: 'AI' },
  other: { icon: <Box size={14} />, label: 'Other' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sample Marketplace Plugins (would come from API in production)
// ─────────────────────────────────────────────────────────────────────────────

const MARKETPLACE_PLUGINS: PluginManifest[] = [
  {
    id: 'csv-advanced-import',
    name: 'Advanced CSV Import',
    version: '1.2.0',
    description: 'Import CSV files with custom delimiters, encoding detection, and preview.',
    author: 'ExcelAI Community',
    category: 'data',
    permissions: ['cells:write', 'sheets:write', 'ui:dialog'],
    entrypoint: 'plugins/csv-advanced/index.js',
  },
  {
    id: 'chart-themes',
    name: 'Chart Theme Pack',
    version: '2.0.0',
    description: '20+ professional chart color themes for presentations.',
    author: 'Design Studio',
    category: 'formatting',
    permissions: ['cells:read', 'ui:toolbar'],
    entrypoint: 'plugins/chart-themes/index.js',
  },
  {
    id: 'slack-notifications',
    name: 'Slack Notifications',
    version: '1.0.0',
    description: 'Send Slack messages when cells change or macros complete.',
    author: 'Integration Labs',
    category: 'integration',
    permissions: ['cells:read', 'network:fetch', 'ui:toolbar'],
    entrypoint: 'plugins/slack-notify/index.js',
  },
  {
    id: 'ai-data-insights',
    name: 'AI Data Insights',
    version: '0.9.0',
    description: 'Automatic statistical analysis and insight generation powered by AI.',
    author: 'ExcelAI Labs',
    category: 'ai',
    permissions: ['cells:read', 'ui:sidebar', 'network:fetch'],
    entrypoint: 'plugins/ai-insights/index.js',
  },
  {
    id: 'regex-tools',
    name: 'Regex Tools',
    version: '1.1.0',
    description: 'Extract, replace, and validate data using regular expressions.',
    author: 'Dev Tools',
    category: 'productivity',
    permissions: ['cells:read', 'cells:write', 'ui:dialog'],
    entrypoint: 'plugins/regex-tools/index.js',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'browse' | 'installed';

export const PluginMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PluginCategory | 'all'>('all');
  const [, forceUpdate] = useState(0);

  const resolvedTheme = useUIStore((s) => s.resolvedTheme);
  const showToast = useUIStore((s) => s.showToast);
  const isDark = resolvedTheme === 'dark';

  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  const installed = pluginManager.getAll();
  const installedIds = new Set(installed.map((p) => p.manifest.id));

  // Filter marketplace
  const filteredMarketplace = MARKETPLACE_PLUGINS.filter((p) => {
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const handleInstall = useCallback(
    (manifest: PluginManifest) => {
      pluginManager.install(manifest);
      pluginManager.enable(manifest.id);
      showToast(`Installed ${manifest.name}`, 'info');
      refresh();
    },
    [showToast, refresh]
  );

  const handleUninstall = useCallback(
    (pluginId: string) => {
      const plugin = pluginManager.get(pluginId);
      pluginManager.uninstall(pluginId);
      showToast(`Uninstalled ${plugin?.manifest.name}`, 'info');
      refresh();
    },
    [showToast, refresh]
  );

  const handleToggle = useCallback(
    (pluginId: string, enabled: boolean) => {
      if (enabled) {
        pluginManager.enable(pluginId);
      } else {
        pluginManager.disable(pluginId);
      }
      refresh();
    },
    [refresh]
  );

  const counts = pluginManager.getCounts();

  return (
    <div
      className={`h-full flex flex-col ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
      data-testid="plugin-marketplace"
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Package size={16} className="text-emerald-500" />
          Extensions
          {counts.enabled > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}
            >
              {counts.enabled} active
            </span>
          )}
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <TabButton
            label="Browse"
            active={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
            isDark={isDark}
          />
          <TabButton
            label={`Installed (${installed.length})`}
            active={activeTab === 'installed'}
            onClick={() => setActiveTab('installed')}
            isDark={isDark}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-md border outline-none
              ${
                isDark
                  ? 'bg-neutral-800 border-neutral-600 text-neutral-200 placeholder-neutral-500 focus:border-emerald-500'
                  : 'bg-white border-neutral-300 text-neutral-800 placeholder-neutral-400 focus:border-emerald-500'
              }`}
          />
        </div>

        {/* Category filter */}
        {activeTab === 'browse' && (
          <div className="flex gap-1 mt-2 flex-wrap">
            <CategoryChip
              label="All"
              active={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
              isDark={isDark}
            />
            {(Object.keys(CATEGORY_CONFIG) as PluginCategory[]).map((cat) => (
              <CategoryChip
                key={cat}
                label={CATEGORY_CONFIG[cat].label}
                active={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
                isDark={isDark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'browse' ? (
          filteredMarketplace.map((manifest) => (
            <PluginCard
              key={manifest.id}
              manifest={manifest}
              isInstalled={installedIds.has(manifest.id)}
              onInstall={() => handleInstall(manifest)}
              isDark={isDark}
            />
          ))
        ) : installed.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <Package size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No extensions installed</p>
          </div>
        ) : (
          installed.map((plugin) => (
            <InstalledPluginCard
              key={plugin.manifest.id}
              plugin={plugin}
              onToggle={(enabled) => handleToggle(plugin.manifest.id, enabled)}
              onUninstall={() => handleUninstall(plugin.manifest.id)}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
}> = ({ label, active, onClick, isDark }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors
      ${
        active
          ? isDark
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-600 text-white'
          : isDark
            ? 'text-neutral-400 hover:bg-neutral-700'
            : 'text-neutral-500 hover:bg-neutral-100'
      }`}
  >
    {label}
  </button>
);

const CategoryChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
}> = ({ label, active, onClick, isDark }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors
      ${
        active
          ? isDark
            ? 'bg-emerald-900/40 text-emerald-400'
            : 'bg-emerald-50 text-emerald-700'
          : isDark
            ? 'text-neutral-500 hover:text-neutral-300'
            : 'text-neutral-400 hover:text-neutral-600'
      }`}
  >
    {label}
  </button>
);

const PluginCard: React.FC<{
  manifest: PluginManifest;
  isInstalled: boolean;
  onInstall: () => void;
  isDark: boolean;
}> = ({ manifest, isInstalled, onInstall, isDark }) => {
  const cat = CATEGORY_CONFIG[manifest.category];

  return (
    <div
      className={`p-3 rounded-lg border ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-200 bg-white'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-700' : 'bg-neutral-100'}`}
        >
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold truncate">{manifest.name}</h4>
            <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              v{manifest.version}
            </span>
          </div>
          <p
            className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}
          >
            {manifest.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              by {manifest.author}
            </span>
            <span
              className={`flex items-center gap-0.5 text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}
            >
              <Shield size={10} />
              {manifest.permissions.length} permissions
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onInstall}
          disabled={isInstalled}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
            ${
              isInstalled
                ? isDark
                  ? 'bg-neutral-700 text-neutral-500 cursor-default'
                  : 'bg-neutral-100 text-neutral-400 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
        >
          <Download size={12} />
          {isInstalled ? 'Installed' : 'Install'}
        </button>
      </div>
    </div>
  );
};

const InstalledPluginCard: React.FC<{
  plugin: InstalledPlugin;
  onToggle: (enabled: boolean) => void;
  onUninstall: () => void;
  isDark: boolean;
}> = ({ plugin, onToggle, onUninstall, isDark }) => {
  const isEnabled = plugin.status === 'enabled';

  return (
    <div
      className={`p-3 rounded-lg border ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-200 bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold truncate">{plugin.manifest.name}</h4>
          <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            v{plugin.manifest.version} by {plugin.manifest.author}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          className={`p-1 rounded ${isEnabled ? 'text-emerald-500' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}
          aria-label={isEnabled ? 'Disable' : 'Enable'}
        >
          {isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>

        <button
          type="button"
          onClick={onUninstall}
          className={`p-1 rounded ${isDark ? 'text-neutral-500 hover:text-rose-400' : 'text-neutral-400 hover:text-rose-500'}`}
          aria-label="Uninstall"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default PluginMarketplace;
