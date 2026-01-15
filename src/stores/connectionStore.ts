// Phase 9: Connection Store
// State management for data connections

import { create } from 'zustand';

export type ConnectionType = 'postgres' | 'mysql' | 'sqlite' | 'rest_api' | 'websocket';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting' | 'testing';
export type AuthMethodType = 'none' | 'api_key' | 'bearer' | 'basic' | 'oauth2';
export type ApiKeyLocation = 'header' | 'query';
export type SslMode = 'disable' | 'prefer' | 'require' | 'verify_ca' | 'verify_full';
export type RefreshScheduleType = 'manual' | 'interval' | 'cron';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: SslMode;
  pool_min?: number;
  pool_max?: number;
  connection_timeout_secs?: number;
}

export interface SqliteConfig {
  path: string;
  read_only?: boolean;
  create_if_missing?: boolean;
}

export interface AuthMethod {
  type: AuthMethodType;
  key_name?: string;
  key_value?: string;
  location?: ApiKeyLocation;
  token?: string;
  username?: string;
  password?: string;
  client_id?: string;
  client_secret?: string;
  token_url?: string;
  scopes?: string[];
}

export interface RestApiConfig {
  base_url: string;
  auth: AuthMethod;
  headers?: [string, string][];
  timeout_secs?: number;
  rate_limit_per_minute?: number;
}

export interface WebSocketConfig {
  url: string;
  auth: AuthMethod;
  headers?: [string, string][];
  reconnect_delay_secs?: number;
  max_reconnect_attempts?: number;
  heartbeat_interval_secs?: number;
  subscribe_message?: string;
}

export interface ConnectionConfig {
  type: ConnectionType;
  postgres?: DatabaseConfig;
  mysql?: DatabaseConfig;
  sqlite?: SqliteConfig;
  rest_api?: RestApiConfig;
  websocket?: WebSocketConfig;
}

export interface Connection {
  id: string;
  name: string;
  description?: string;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
  lastConnected?: string;
  lastError?: string;
}

export interface RefreshSchedule {
  type: RefreshScheduleType;
  seconds?: number;
  expression?: string;
}

export interface QueryParameter {
  name: string;
  value: unknown;
  param_type?: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';
}

export interface DataQuery {
  id: string;
  name: string;
  connectionId: string;
  query: string;
  targetSheet: string;
  targetRange: string;
  parameters?: QueryParameter[];
  refreshSchedule?: RefreshSchedule;
}

export interface ScheduledJob {
  id: string;
  queryId: string;
  schedule: RefreshSchedule;
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
  runCount: number;
  errorCount: number;
  lastError?: string;
}

export interface QueryResult {
  columns: { name: string; data_type: string; nullable: boolean }[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
  error?: string;
}

interface ConnectionState {
  connections: Connection[];
  queries: DataQuery[];
  jobs: ScheduledJob[];
  selectedConnectionId: string | null;
  selectedQueryId: string | null;
  isLoading: boolean;
  error: string | null;
  lastQueryResult: QueryResult | null;

  // Actions
  setConnections: (connections: Connection[]) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  setQueries: (queries: DataQuery[]) => void;
  addQuery: (query: DataQuery) => void;
  removeQuery: (id: string) => void;
  setJobs: (jobs: ScheduledJob[]) => void;
  addJob: (job: ScheduledJob) => void;
  updateJob: (id: string, updates: Partial<ScheduledJob>) => void;
  removeJob: (id: string) => void;
  setSelectedConnectionId: (id: string | null) => void;
  setSelectedQueryId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastQueryResult: (result: QueryResult | null) => void;
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  connections: [],
  queries: [],
  jobs: [],
  selectedConnectionId: null,
  selectedQueryId: null,
  isLoading: false,
  error: null,
  lastQueryResult: null,

  setConnections: (connections) => set({ connections }),

  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection],
    })),

  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    })),

  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
      queries: state.queries.filter((q) => q.connectionId !== id),
      selectedConnectionId:
        state.selectedConnectionId === id ? null : state.selectedConnectionId,
    })),

  setQueries: (queries) => set({ queries }),

  addQuery: (query) =>
    set((state) => ({
      queries: [...state.queries, query],
    })),

  removeQuery: (id) =>
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
      jobs: state.jobs.filter((j) => j.queryId !== id),
      selectedQueryId: state.selectedQueryId === id ? null : state.selectedQueryId,
    })),

  setJobs: (jobs) => set({ jobs }),

  addJob: (job) =>
    set((state) => ({
      jobs: [...state.jobs, job],
    })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)),
    })),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),

  setSelectedConnectionId: (id) => set({ selectedConnectionId: id }),

  setSelectedQueryId: (id) => set({ selectedQueryId: id }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setLastQueryResult: (result) => set({ lastQueryResult: result }),
}));
