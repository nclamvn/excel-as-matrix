// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE CONNECTOR — Import data from CSV, JSON, API URLs
// Feeds into Power Query transform pipeline
// ═══════════════════════════════════════════════════════════════════════════

import type { DataTable, DataRow, CellValue } from './index';
import { loggers } from '@/utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DataSourceType = 'csv' | 'json' | 'api' | 'clipboard' | 'sheet';

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  config: DataSourceConfig;
  lastFetched: number | null;
}

export interface DataSourceConfig {
  // CSV
  csvDelimiter?: string;
  csvHasHeaders?: boolean;
  csvEncoding?: string;

  // JSON
  jsonPath?: string; // JSONPath-like expression for nested data

  // API
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST';
  apiHeaders?: Record<string, string>;
  apiBody?: string;
  apiRefreshInterval?: number; // seconds

  // Sheet
  sheetId?: string;
  sheetRange?: string;
}

export interface DataSourceResult {
  data: DataTable;
  columns: string[];
  rowCount: number;
  source: DataSource;
  fetchedAt: number;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DataSourceConnector Class
// ─────────────────────────────────────────────────────────────────────────────

export class DataSourceConnector {
  /**
   * Fetch data from a data source
   */
  async fetch(source: DataSource): Promise<DataSourceResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      let data: DataTable;

      switch (source.type) {
        case 'csv':
          data = await this.fetchCSV(source.config);
          break;
        case 'json':
          data = await this.fetchJSON(source.config);
          break;
        case 'api':
          data = await this.fetchAPI(source.config);
          break;
        case 'clipboard':
          data = await this.fetchClipboard();
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      loggers.ai.info(`DataSource: fetched ${data.length} rows from ${source.type} in ${Date.now() - startTime}ms`);

      return {
        data,
        columns,
        rowCount: data.length,
        source: { ...source, lastFetched: Date.now() },
        fetchedAt: Date.now(),
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(msg);
      return {
        data: [],
        columns: [],
        rowCount: 0,
        source,
        fetchedAt: Date.now(),
        errors,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CSV
  // ─────────────────────────────────────────────────────────────────────────

  async fetchCSV(_config: DataSourceConfig): Promise<DataTable> {
    // For file-based CSV, the content should be passed via config
    throw new Error('CSV source requires file content. Use parseCSVText() instead.');
  }

  parseCSVText(text: string, config: DataSourceConfig = {}): DataTable {
    const delimiter = config.csvDelimiter || ',';
    const hasHeaders = config.csvHasHeaders !== false; // default true

    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length === 0) return [];

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = hasHeaders
      ? parseRow(lines[0])
      : parseRow(lines[0]).map((_, i) => `Column${i + 1}`);

    const startRow = hasHeaders ? 1 : 0;
    const data: DataTable = [];

    for (let i = startRow; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      const row: DataRow = {};
      for (let j = 0; j < headers.length; j++) {
        const raw = values[j] ?? '';
        row[headers[j]] = this.inferType(raw);
      }
      data.push(row);
    }

    return data;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JSON
  // ─────────────────────────────────────────────────────────────────────────

  async fetchJSON(_config: DataSourceConfig): Promise<DataTable> {
    throw new Error('JSON source requires file content. Use parseJSONText() instead.');
  }

  parseJSONText(text: string, config: DataSourceConfig = {}): DataTable {
    const parsed = JSON.parse(text);
    let data: unknown[];

    // Navigate to jsonPath if provided
    if (config.jsonPath) {
      const pathParts = config.jsonPath.replace(/^\$\.?/, '').split('.');
      let current: unknown = parsed;
      for (const part of pathParts) {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        } else {
          throw new Error(`Invalid JSON path: ${config.jsonPath}`);
        }
      }
      data = Array.isArray(current) ? current : [current];
    } else {
      data = Array.isArray(parsed) ? parsed : [parsed];
    }

    // Flatten objects to DataRow
    return data.map((item) => {
      if (typeof item !== 'object' || item === null) {
        return { value: item as CellValue };
      }
      return this.flattenObject(item as Record<string, unknown>);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API URL
  // ─────────────────────────────────────────────────────────────────────────

  async fetchAPI(config: DataSourceConfig): Promise<DataTable> {
    if (!config.apiUrl) throw new Error('API URL is required');

    const response = await fetch(config.apiUrl, {
      method: config.apiMethod || 'GET',
      headers: {
        'Accept': 'application/json',
        ...config.apiHeaders,
      },
      body: config.apiMethod === 'POST' ? config.apiBody : undefined,
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('json')) {
      return this.parseJSONText(text, config);
    } else if (contentType.includes('csv') || contentType.includes('text/plain')) {
      return this.parseCSVText(text, config);
    }

    // Try JSON first, then CSV
    try {
      return this.parseJSONText(text, config);
    } catch {
      return this.parseCSVText(text, config);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Clipboard
  // ─────────────────────────────────────────────────────────────────────────

  async fetchClipboard(): Promise<DataTable> {
    const text = await navigator.clipboard.readText();

    // Detect TSV (from Excel copy)
    if (text.includes('\t')) {
      return this.parseCSVText(text, { csvDelimiter: '\t' });
    }

    // Try CSV
    if (text.includes(',')) {
      return this.parseCSVText(text);
    }

    // Try JSON
    try {
      return this.parseJSONText(text);
    } catch {
      // Single column of values
      return text.split('\n').filter(Boolean).map((line) => ({ value: this.inferType(line.trim()) }));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private inferType(raw: string): CellValue {
    if (raw === '' || raw === 'null' || raw === 'NULL') return null;
    if (raw === 'true' || raw === 'TRUE') return true;
    if (raw === 'false' || raw === 'FALSE') return false;

    const num = Number(raw);
    if (!isNaN(num) && raw.trim() !== '') return num;

    return raw;
  }

  private flattenObject(obj: Record<string, unknown>, prefix = ''): DataRow {
    const row: DataRow = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        row[fullKey] = null;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        row[fullKey] = value;
      } else if (Array.isArray(value)) {
        row[fullKey] = JSON.stringify(value);
      } else if (typeof value === 'object') {
        Object.assign(row, this.flattenObject(value as Record<string, unknown>, fullKey));
      }
    }

    return row;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export function createDataSource(type: DataSourceType, name: string, config: DataSourceConfig = {}): DataSource {
  return {
    id: `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    name,
    config,
    lastFetched: null,
  };
}

export const dataSourceConnector = new DataSourceConnector();
