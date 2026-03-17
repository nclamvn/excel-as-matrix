// Phase 9: Connection Manager Component
// UI for managing data connections

import React, { useState, useEffect } from 'react';
import { useConnectionStore, ConnectionType, ConnectionStatus, ConnectionConfig } from '../../stores/connectionStore';
import * as connectionApi from '../../api/connectionApi';
import { loggers } from '@/utils/logger';

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({ isOpen, onClose }) => {
  const {
    connections,
    queries,
    jobs,
    selectedConnectionId,
    isLoading,
    error,
    setConnections,
    setQueries,
    setJobs,
    setSelectedConnectionId,
    setLoading,
    setError,
    updateConnection,
    removeConnection,
  } = useConnectionStore();

  const [activeTab, setActiveTab] = useState<'connections' | 'queries' | 'schedule'>('connections');
  const [showNewConnection, setShowNewConnection] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conns, qs, js] = await Promise.all([
        connectionApi.listConnections(),
        connectionApi.listQueries(),
        connectionApi.listJobs(),
      ]);
      setConnections(conns);
      setQueries(qs);
      setJobs(js);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    updateConnection(id, { status: 'testing' });
    const success = await connectionApi.testConnection(id);
    updateConnection(id, {
      status: success ? 'disconnected' : 'error',
      lastError: success ? undefined : 'Connection test failed',
    });
  };

  const handleConnect = async (id: string) => {
    try {
      updateConnection(id, { status: 'connecting' });
      await connectionApi.connect(id);
      updateConnection(id, { status: 'connected' });
    } catch (err) {
      updateConnection(id, {
        status: 'error',
        lastError: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await connectionApi.disconnect(id);
      updateConnection(id, { status: 'disconnected' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Delete this connection? All associated queries will also be deleted.')) {
      return;
    }
    try {
      await connectionApi.deleteConnection(id);
      removeConnection(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-gray-500';
      case 'error':
        return 'text-red-600';
      case 'connecting':
      case 'testing':
        return 'text-amber-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: ConnectionType): string => {
    switch (type) {
      case 'postgres':
        return 'PG';
      case 'mysql':
        return 'My';
      case 'sqlite':
        return 'SQ';
      case 'rest_api':
        return 'API';
      case 'websocket':
        return 'WS';
      default:
        return '??';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Data Connections</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'connections'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            Connections ({connections.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'queries'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('queries')}
          >
            Queries ({queries.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'schedule'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule ({jobs.length})
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              &times;
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : activeTab === 'connections' ? (
            <div className="space-y-3">
              {/* New connection button */}
              <button
                onClick={() => setShowNewConnection(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500"
              >
                + New Connection
              </button>

              {/* Connection list */}
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className={`border rounded-lg p-4 ${
                    selectedConnectionId === conn.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedConnectionId(conn.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center font-mono text-sm font-bold text-gray-600">
                        {getTypeIcon(conn.connectionType)}
                      </div>
                      <div>
                        <div className="font-medium">{conn.name}</div>
                        <div className="text-xs text-gray-500">
                          {conn.connectionType} &bull;{' '}
                          <span className={getStatusColor(conn.status)}>
                            {conn.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(conn.id);
                        }}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                      >
                        Test
                      </button>
                      {conn.status === 'connected' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(conn.id);
                          }}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(conn.id);
                          }}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Connect
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConnection(conn.id);
                        }}
                        className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {conn.lastError && (
                    <div className="mt-2 text-xs text-red-500">
                      Error: {conn.lastError}
                    </div>
                  )}
                </div>
              ))}

              {connections.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No connections yet. Click "New Connection" to add one.
                </div>
              )}
            </div>
          ) : activeTab === 'queries' ? (
            <QueryList />
          ) : (
            <ScheduleList />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <button
            onClick={loadData}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* New Connection Dialog */}
      {showNewConnection && (
        <NewConnectionDialog onClose={() => setShowNewConnection(false)} onCreated={loadData} />
      )}
    </div>
  );
};

// Query List Component
const QueryList: React.FC = () => {
  const { queries, connections, setLastQueryResult } = useConnectionStore();

  const handleExecute = async (queryId: string) => {
    try {
      const result = await connectionApi.executeQuery(queryId);
      setLastQueryResult(result);
    } catch (err) {
      loggers.ui.error('Query execution failed:', err);
    }
  };

  const handleDelete = async (queryId: string) => {
    if (!confirm('Delete this query?')) return;
    await connectionApi.deleteQuery(queryId);
  };

  return (
    <div className="space-y-3">
      {queries.map((query) => {
        const connection = connections.find((c) => c.id === query.connectionId);
        return (
          <div key={query.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{query.name}</div>
                <div className="text-xs text-gray-500">
                  Connection: {connection?.name || 'Unknown'} &bull; Target:{' '}
                  {query.targetSheet}!{query.targetRange}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExecute(query.id)}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Execute
                </button>
                <button
                  onClick={() => handleDelete(query.id)}
                  className="px-3 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded font-mono text-xs overflow-x-auto">
              {query.query}
            </div>
          </div>
        );
      })}
      {queries.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No queries yet. Create a query to fetch data from a connection.
        </div>
      )}
    </div>
  );
};

// Schedule List Component
const ScheduleList: React.FC = () => {
  const { jobs, queries, updateJob } = useConnectionStore();

  const handleToggle = async (jobId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await connectionApi.enableJob(jobId);
      } else {
        await connectionApi.disableJob(jobId);
      }
      updateJob(jobId, { enabled });
    } catch (err) {
      loggers.ui.error('Toggle failed:', err);
    }
  };

  const handleTrigger = async (jobId: string) => {
    try {
      await connectionApi.triggerJob(jobId);
      updateJob(jobId, { lastRun: new Date().toISOString() });
    } catch (err) {
      loggers.ui.error('Trigger failed:', err);
    }
  };

  const formatSchedule = (schedule: { type: string; seconds?: number; expression?: string }) => {
    switch (schedule.type) {
      case 'manual':
        return 'Manual';
      case 'interval':
        return `Every ${schedule.seconds} seconds`;
      case 'cron':
        return `Cron: ${schedule.expression}`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const query = queries.find((q) => q.id === job.queryId);
        return (
          <div key={job.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{query?.name || 'Unknown Query'}</div>
                <div className="text-xs text-gray-500">
                  {formatSchedule(job.schedule)} &bull; Runs: {job.runCount} &bull;
                  Errors: {job.errorCount}
                </div>
                {job.nextRun && (
                  <div className="text-xs text-blue-500">
                    Next: {new Date(job.nextRun).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={job.enabled}
                    onChange={(e) => handleToggle(job.id, e.target.checked)}
                  />
                  Enabled
                </label>
                <button
                  onClick={() => handleTrigger(job.id)}
                  className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  Run Now
                </button>
              </div>
            </div>
            {job.lastError && (
              <div className="mt-2 text-xs text-red-500">Last error: {job.lastError}</div>
            )}
          </div>
        );
      })}
      {jobs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No scheduled jobs. Schedule a query to refresh data automatically.
        </div>
      )}
    </div>
  );
};

// New Connection Dialog
interface NewConnectionDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const NewConnectionDialog: React.FC<NewConnectionDialogProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ConnectionType>('postgres');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [sqlitePath, setSqlitePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addConnection } = useConnectionStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let config: ConnectionConfig;

      switch (type) {
        case 'postgres':
        case 'mysql':
          config = {
            type,
            [type]: {
              host,
              port,
              database,
              username,
              password,
              ssl_mode: 'disable' as const,
            },
          };
          break;
        case 'sqlite':
          config = {
            type: 'sqlite',
            sqlite: {
              path: sqlitePath,
              read_only: false,
              create_if_missing: true,
            },
          };
          break;
        case 'rest_api':
          config = {
            type: 'rest_api',
            rest_api: {
              base_url: baseUrl,
              auth: { type: 'none' },
            },
          };
          break;
        case 'websocket':
          config = {
            type: 'websocket',
            websocket: {
              url: baseUrl,
              auth: { type: 'none' },
            },
          };
          break;
        default:
          throw new Error('Invalid connection type');
      }

      const newConnection = await connectionApi.createConnection(name, config);
      addConnection(newConnection);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-[500px]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">New Connection</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Connection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ConnectionType)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="rest_api">REST API</option>
              <option value="websocket">WebSocket</option>
            </select>
          </div>

          {(type === 'postgres' || type === 'mysql') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Database</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'sqlite' && (
            <div>
              <label className="block text-sm font-medium mb-1">Database Path</label>
              <input
                type="text"
                value={sqlitePath}
                onChange={(e) => setSqlitePath(e.target.value)}
                placeholder="/path/to/database.db or :memory:"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {(type === 'rest_api' || type === 'websocket') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'rest_api' ? 'Base URL' : 'WebSocket URL'}
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  type === 'rest_api' ? 'https://api.example.com' : 'wss://ws.example.com'
                }
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionManager;
