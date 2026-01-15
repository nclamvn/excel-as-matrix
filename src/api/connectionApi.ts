// Phase 9: Connection API Client
// API client for data connections

import type {
  Connection,
  ConnectionConfig,
  DataQuery,
  QueryParameter,
  QueryResult,
  RefreshSchedule,
  ScheduledJob,
} from '../stores/connectionStore';

const API_BASE = '/api/data';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// === Connection API ===

export async function listConnections(): Promise<Connection[]> {
  const response = await fetchApi<Record<string, unknown>[]>('/connections');
  return response.map(mapConnection);
}

export async function createConnection(
  name: string,
  config: ConnectionConfig
): Promise<Connection> {
  const response = await fetchApi<Record<string, unknown>>('/connections', {
    method: 'POST',
    body: JSON.stringify({ name, config: mapConfigToApi(config) }),
  });
  return mapConnection(response);
}

export async function getConnection(id: string): Promise<Connection> {
  const response = await fetchApi<Record<string, unknown>>(`/connections/${id}`);
  return mapConnection(response);
}

export async function updateConnection(
  id: string,
  name?: string,
  config?: ConnectionConfig
): Promise<Connection> {
  const response = await fetchApi<Record<string, unknown>>(`/connections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name,
      config: config ? mapConfigToApi(config) : undefined,
    }),
  });
  return mapConnection(response);
}

export async function deleteConnection(id: string): Promise<void> {
  await fetchApi<void>(`/connections/${id}`, {
    method: 'DELETE',
  });
}

export async function testConnection(id: string): Promise<boolean> {
  try {
    await fetchApi<unknown>(`/connections/${id}/test`, {
      method: 'POST',
    });
    return true;
  } catch {
    return false;
  }
}

export async function connect(id: string): Promise<void> {
  await fetchApi<void>(`/connections/${id}/connect`, {
    method: 'POST',
  });
}

export async function disconnect(id: string): Promise<void> {
  await fetchApi<void>(`/connections/${id}/disconnect`, {
    method: 'POST',
  });
}

// === Query API ===

export async function listQueries(): Promise<DataQuery[]> {
  const response = await fetchApi<Record<string, unknown>[]>('/queries');
  return response.map(mapQuery);
}

export async function createQuery(query: Omit<DataQuery, 'id'>): Promise<DataQuery> {
  const response = await fetchApi<Record<string, unknown>>('/queries', {
    method: 'POST',
    body: JSON.stringify({
      name: query.name,
      connection_id: query.connectionId,
      query: query.query,
      target_sheet: query.targetSheet,
      target_range: query.targetRange,
      parameters: query.parameters,
      refresh_schedule: query.refreshSchedule,
    }),
  });
  return mapQuery(response);
}

export async function getQuery(id: string): Promise<DataQuery> {
  const response = await fetchApi<Record<string, unknown>>(`/queries/${id}`);
  return mapQuery(response);
}

export async function deleteQuery(id: string): Promise<void> {
  await fetchApi<void>(`/queries/${id}`, {
    method: 'DELETE',
  });
}

export async function executeQuery(
  id: string,
  parameters?: QueryParameter[]
): Promise<QueryResult> {
  const response = await fetchApi<QueryResult>(`/queries/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify({ parameters: parameters || [] }),
  });
  return response;
}

// === Scheduler API ===

export async function listJobs(): Promise<ScheduledJob[]> {
  const response = await fetchApi<Record<string, unknown>[]>('/jobs');
  return response.map(mapJob);
}

export async function scheduleJob(
  queryId: string,
  schedule: RefreshSchedule
): Promise<ScheduledJob> {
  const response = await fetchApi<Record<string, unknown>>('/jobs', {
    method: 'POST',
    body: JSON.stringify({
      query_id: queryId,
      schedule: mapScheduleToApi(schedule),
    }),
  });
  return mapJob(response);
}

export async function getJob(id: string): Promise<ScheduledJob> {
  const response = await fetchApi<Record<string, unknown>>(`/jobs/${id}`);
  return mapJob(response);
}

export async function unscheduleJob(id: string): Promise<void> {
  await fetchApi<void>(`/jobs/${id}`, {
    method: 'DELETE',
  });
}

export async function enableJob(id: string): Promise<void> {
  await fetchApi<void>(`/jobs/${id}/enable`, {
    method: 'POST',
  });
}

export async function disableJob(id: string): Promise<void> {
  await fetchApi<void>(`/jobs/${id}/disable`, {
    method: 'POST',
  });
}

export async function triggerJob(id: string): Promise<QueryResult> {
  const response = await fetchApi<QueryResult>(`/jobs/${id}/trigger`, {
    method: 'POST',
  });
  return response;
}

// === Mappers ===

function mapConnection(data: Record<string, unknown>): Connection {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | undefined,
    connectionType: data.connection_type as Connection['connectionType'],
    status: data.status as Connection['status'],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    lastConnected: data.last_connected as string | undefined,
    lastError: data.last_error as string | undefined,
  };
}

function mapQuery(data: Record<string, unknown>): DataQuery {
  return {
    id: data.id as string,
    name: data.name as string,
    connectionId: data.connection_id as string,
    query: data.query as string,
    targetSheet: data.target_sheet as string,
    targetRange: data.target_range as string,
  };
}

function mapJob(data: Record<string, unknown>): ScheduledJob {
  const schedule = data.schedule as Record<string, unknown>;
  return {
    id: data.id as string,
    queryId: data.query_id as string,
    schedule: {
      type: schedule.type as RefreshSchedule['type'],
      seconds: schedule.seconds as number | undefined,
      expression: schedule.expression as string | undefined,
    },
    lastRun: data.last_run as string | undefined,
    nextRun: data.next_run as string | undefined,
    enabled: data.enabled as boolean,
    runCount: data.run_count as number,
    errorCount: data.error_count as number,
    lastError: data.last_error as string | undefined,
  };
}

function mapConfigToApi(config: ConnectionConfig): Record<string, unknown> {
  switch (config.type) {
    case 'postgres':
      return { type: 'postgres', ...config.postgres };
    case 'mysql':
      return { type: 'mysql', ...config.mysql };
    case 'sqlite':
      return { type: 'sqlite', ...config.sqlite };
    case 'rest_api':
      return { type: 'rest_api', ...config.rest_api };
    case 'websocket':
      return { type: 'websocket', ...config.websocket };
    default:
      return { type: config.type };
  }
}

function mapScheduleToApi(schedule: RefreshSchedule): Record<string, unknown> {
  switch (schedule.type) {
    case 'manual':
      return { type: 'manual' };
    case 'interval':
      return { type: 'interval', seconds: schedule.seconds };
    case 'cron':
      return { type: 'cron', expression: schedule.expression };
    default:
      return { type: 'manual' };
  }
}

// Export ConnectionConfig type for the component
export type { ConnectionConfig };
