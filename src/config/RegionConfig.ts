// ═══════════════════════════════════════════════════════════════════════════
// REGION CONFIG — Multi-region data residency management
// Supports EU, US, APAC regions with compliance metadata
// ═══════════════════════════════════════════════════════════════════════════

import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DataRegion = 'us' | 'eu' | 'apac';

export interface RegionDefinition {
  id: DataRegion;
  name: string;
  flag: string;
  location: string;
  apiEndpoint: string;
  supabaseUrl: string;
  complianceFrameworks: string[];
  dataRetentionDefault: number; // days
}

export interface RegionConfig {
  currentRegion: DataRegion;
  autoDetect: boolean;
  workbookRegions: Record<string, DataRegion>; // workbookId → region
}

export interface RegionComplianceBadge {
  region: DataRegion;
  label: string;
  frameworks: string[];
  dataLocation: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Region Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const REGIONS: Record<DataRegion, RegionDefinition> = {
  us: {
    id: 'us',
    name: 'United States',
    flag: 'US',
    location: 'Virginia, US',
    apiEndpoint: 'https://us.api.excelai.app',
    supabaseUrl: 'https://us.supabase.excelai.app',
    complianceFrameworks: ['SOC2', 'HIPAA', 'CCPA'],
    dataRetentionDefault: 365,
  },
  eu: {
    id: 'eu',
    name: 'European Union',
    flag: 'EU',
    location: 'Frankfurt, DE',
    apiEndpoint: 'https://eu.api.excelai.app',
    supabaseUrl: 'https://eu.supabase.excelai.app',
    complianceFrameworks: ['GDPR', 'SOC2', 'ISO 27001'],
    dataRetentionDefault: 365,
  },
  apac: {
    id: 'apac',
    name: 'Asia Pacific',
    flag: 'SG',
    location: 'Singapore',
    apiEndpoint: 'https://apac.api.excelai.app',
    supabaseUrl: 'https://apac.supabase.excelai.app',
    complianceFrameworks: ['SOC2', 'PDPA'],
    dataRetentionDefault: 365,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RegionManager
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'excelai-region';

class RegionManager {
  private config: RegionConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get the current active region
   */
  getCurrentRegion(): DataRegion {
    return this.config.currentRegion;
  }

  /**
   * Get the region definition for current region
   */
  getRegionDef(): RegionDefinition {
    return REGIONS[this.config.currentRegion];
  }

  /**
   * Set the region (requires restart for full effect)
   */
  setRegion(region: DataRegion): void {
    this.config.currentRegion = region;
    this.saveConfig();
    loggers.admin.info(`Region changed to: ${REGIONS[region].name} (${region})`);
  }

  /**
   * Set region for a specific workbook
   */
  setWorkbookRegion(workbookId: string, region: DataRegion): void {
    this.config.workbookRegions[workbookId] = region;
    this.saveConfig();
  }

  /**
   * Get region for a specific workbook (falls back to current region)
   */
  getWorkbookRegion(workbookId: string): DataRegion {
    return this.config.workbookRegions[workbookId] || this.config.currentRegion;
  }

  /**
   * Get the API endpoint for the current region
   */
  getApiEndpoint(): string {
    return this.getRegionDef().apiEndpoint;
  }

  /**
   * Get the Supabase URL for the current region
   */
  getSupabaseUrl(): string {
    return this.getRegionDef().supabaseUrl;
  }

  /**
   * Get compliance badge for display
   */
  getComplianceBadge(region?: DataRegion): RegionComplianceBadge {
    const r = region || this.config.currentRegion;
    const def = REGIONS[r];
    return {
      region: r,
      label: `${def.flag} ${def.name}`,
      frameworks: def.complianceFrameworks,
      dataLocation: def.location,
    };
  }

  /**
   * Auto-detect region from browser timezone
   */
  detectRegion(): DataRegion {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // EU timezones
      if (tz.startsWith('Europe/') || tz.startsWith('Africa/')) return 'eu';

      // APAC timezones
      if (
        tz.startsWith('Asia/') ||
        tz.startsWith('Australia/') ||
        tz.startsWith('Pacific/')
      ) return 'apac';

      // Default to US
      return 'us';
    } catch {
      return 'us';
    }
  }

  /**
   * Enable/disable auto-detection
   */
  setAutoDetect(enabled: boolean): void {
    this.config.autoDetect = enabled;
    if (enabled) {
      this.config.currentRegion = this.detectRegion();
    }
    this.saveConfig();
  }

  /**
   * Get all available regions
   */
  getAllRegions(): RegionDefinition[] {
    return Object.values(REGIONS);
  }

  /**
   * Get full config
   */
  getConfig(): RegionConfig {
    return { ...this.config };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────────────────────────────────

  private loadConfig(): RegionConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }

    // Default: auto-detect
    return {
      currentRegion: this.detectRegionStatic(),
      autoDetect: true,
      workbookRegions: {},
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch { /* ignore */ }
  }

  private detectRegionStatic(): DataRegion {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.startsWith('Europe/') || tz.startsWith('Africa/')) return 'eu';
      if (tz.startsWith('Asia/') || tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return 'apac';
    } catch { /* ignore */ }
    return 'us';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const regionManager = new RegionManager();
