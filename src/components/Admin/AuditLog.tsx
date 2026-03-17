// Phase 11: Audit Log Viewer Component
// View, filter, and export audit logs for compliance

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { loggers } from '@/utils/logger';

interface AuditEvent {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  userEmail: string;
  resource: string;
  resourceId?: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface AuditLogFilters {
  eventType: string;
  userId: string;
  resource: string;
  severity: string;
  success: string;
  startDate: string;
  endDate: string;
  search: string;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'login_failed', label: 'Login Failed' },
  { value: 'data_read', label: 'Data Read' },
  { value: 'data_create', label: 'Data Create' },
  { value: 'data_update', label: 'Data Update' },
  { value: 'data_delete', label: 'Data Delete' },
  { value: 'permission_change', label: 'Permission Change' },
  { value: 'settings_change', label: 'Settings Change' },
  { value: 'export', label: 'Export' },
  { value: 'share', label: 'Share' },
  { value: 'mfa_enabled', label: 'MFA Enabled' },
  { value: 'mfa_disabled', label: 'MFA Disabled' },
  { value: 'password_change', label: 'Password Change' },
];

const RESOURCES = [
  { value: '', label: 'All Resources' },
  { value: 'workbook', label: 'Workbooks' },
  { value: 'sheet', label: 'Sheets' },
  { value: 'cell', label: 'Cells' },
  { value: 'user', label: 'Users' },
  { value: 'role', label: 'Roles' },
  { value: 'settings', label: 'Settings' },
];

export const AuditLog: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    eventType: '',
    userId: '',
    resource: '',
    severity: '',
    success: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const pageSize = 50;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.success) params.append('success', filters.success);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/audit?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        setTotalPages(Math.ceil(data.total / pageSize));
        setTotalEvents(data.total);
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch audit events:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);

      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.resource) params.append('resource', filters.resource);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.success) params.append('success', filters.success);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/audit/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      loggers.admin.error('Failed to export audit log:', error);
    } finally {
      setExporting(false);
    }
  };

  const getSeverityIcon = (severity: AuditEvent['severity']) => {
    const icons = {
      info: <Info className="w-4 h-4 text-blue-500" />,
      warning: <AlertCircle className="w-4 h-4 text-yellow-500" />,
      error: <XCircle className="w-4 h-4 text-red-500" />,
      critical: <AlertCircle className="w-4 h-4 text-red-700" />,
    };
    return icons[severity];
  };

  const getSeverityBadge = (severity: AuditEvent['severity']) => {
    const styles = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      critical: 'bg-red-200 text-red-800',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[severity]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  const getEventLabel = (eventType: string) => {
    const event = EVENT_TYPES.find((e) => e.value === eventType);
    return event?.label || eventType;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">View and export security audit events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Event Type */}
          <select
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Resource */}
          <select
            value={filters.resource}
            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {RESOURCES.map((resource) => (
              <option key={resource.value} value={resource.value}>
                {resource.label}
              </option>
            ))}
          </select>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Success */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.success}
                onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-500">
        Showing {events.length} of {totalEvents.toLocaleString()} events
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading events...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const { date, time } = formatTimestamp(event.timestamp);
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{date}</div>
                      <div className="text-xs text-gray-500">{time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(event.severity)}
                        <span className="font-medium text-gray-900">
                          {getEventLabel(event.eventType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{event.userName}</div>
                      <div className="text-xs text-gray-500">{event.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{event.resource}</div>
                      {event.resourceId && (
                        <div className="text-xs text-gray-500 font-mono">{event.resourceId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getSeverityBadge(event.severity)}</td>
                    <td className="px-4 py-3">
                      {event.success ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View details"
                      >
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

// Event Details Modal
interface EventDetailsModalProps {
  event: AuditEvent;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  const { date, time } = {
    date: new Date(event.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Event ID</label>
              <div className="font-mono text-sm text-gray-900">{event.id}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Event Type</label>
              <div className="text-gray-900">
                {EVENT_TYPES.find((t) => t.value === event.eventType)?.label || event.eventType}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Date</label>
              <div className="text-gray-900">{date}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Time</label>
              <div className="text-gray-900">{time}</div>
            </div>
          </div>

          {/* User Info */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <div className="text-gray-900">{event.userName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="text-gray-900">{event.userEmail}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">User ID</label>
                <div className="font-mono text-sm text-gray-900">{event.userId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">IP Address</label>
                <div className="font-mono text-sm text-gray-900">{event.ipAddress}</div>
              </div>
            </div>
          </div>

          {/* Resource Info */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Resource Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Resource Type</label>
                <div className="text-gray-900">{event.resource}</div>
              </div>
              {event.resourceId && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Resource ID</label>
                  <div className="font-mono text-sm text-gray-900">{event.resourceId}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Action</label>
                <div className="text-gray-900">{event.action}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <div className={event.success ? 'text-green-600' : 'text-red-600'}>
                  {event.success ? 'Success' : 'Failed'}
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          {Object.keys(event.details).length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Additional Details</h3>
              <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          )}

          {/* User Agent */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-500 mb-1">User Agent</label>
            <div className="text-sm text-gray-600 break-all">{event.userAgent}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
