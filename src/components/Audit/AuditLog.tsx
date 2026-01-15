// Phase 4: Audit Log - Activity history viewer
import React, { useState, useEffect, useCallback } from 'react';
import { AuditEvent, AuditEventType, AuditAction, AuditQuery } from '../../types/sharing';
import { getAuthHeaders } from '../../stores/authStore';

interface AuditLogProps {
  workbookId?: string;
  userId?: string;
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const API_BASE = 'http://localhost:3001/api';

export const AuditLog: React.FC<AuditLogProps> = ({
  workbookId,
  userId,
  maxItems = 50,
  showFilters = true,
  compact = false,
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEventType | ''>('');
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const fetchAuditLog = useCallback(async (reset = false) => {
    setIsLoading(true);
    setError(null);

    const query: AuditQuery = {
      workbookId,
      userId,
      eventType: eventTypeFilter || undefined,
      action: actionFilter || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      limit: maxItems,
      offset: reset ? 0 : offset,
    };

    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    try {
      const response = await fetch(`${API_BASE}/audit?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit log');
      }

      const data = await response.json();
      setEvents(reset ? data.events : [...events, ...data.events]);
      setHasMore(data.hasMore);
      setOffset(reset ? data.events.length : offset + data.events.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [workbookId, userId, eventTypeFilter, actionFilter, dateRange, maxItems, offset, events]);

  useEffect(() => {
    fetchAuditLog(true);
  }, [workbookId, userId, eventTypeFilter, actionFilter, dateRange.start, dateRange.end]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchAuditLog(false);
    }
  };

  return (
    <div className="audit-log">
      {/* Filters */}
      {showFilters && (
        <div style={filtersStyle}>
          <div style={filterRowStyle}>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as AuditEventType | '')}
              style={filterSelectStyle}
            >
              <option value="">All Events</option>
              <optgroup label="Authentication">
                <option value="Login">Login</option>
                <option value="Logout">Logout</option>
                <option value="TokenRefresh">Token Refresh</option>
                <option value="PasswordChange">Password Change</option>
              </optgroup>
              <optgroup label="Permissions">
                <option value="PermissionGranted">Permission Granted</option>
                <option value="PermissionRevoked">Permission Revoked</option>
                <option value="PermissionDenied">Permission Denied</option>
              </optgroup>
              <optgroup label="Data">
                <option value="WorkbookCreated">Workbook Created</option>
                <option value="WorkbookDeleted">Workbook Deleted</option>
                <option value="CellUpdated">Cell Updated</option>
                <option value="DataExported">Data Exported</option>
              </optgroup>
              <optgroup label="Sharing">
                <option value="ShareLinkCreated">Share Link Created</option>
                <option value="ShareLinkRevoked">Share Link Revoked</option>
                <option value="ShareLinkAccessed">Share Link Accessed</option>
              </optgroup>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | '')}
              style={filterSelectStyle}
            >
              <option value="">All Actions</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
              <option value="Denied">Denied</option>
              <option value="Warning">Warning</option>
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              style={dateInputStyle}
              placeholder="Start date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              style={dateInputStyle}
              placeholder="End date"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={errorStyle}>
          {error}
          <button onClick={() => fetchAuditLog(true)} style={{ marginLeft: 8 }}>
            Retry
          </button>
        </div>
      )}

      {/* Events list */}
      <div style={eventsListStyle}>
        {events.length === 0 && !isLoading ? (
          <div style={emptyStateStyle}>
            <HistoryIcon size={40} color="#d1d5db" />
            <p style={{ marginTop: 12, color: '#6b7280' }}>No activity yet</p>
          </div>
        ) : (
          events.map((event) => (
            <AuditEventItem key={event.id} event={event} compact={compact} />
          ))
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            Loading...
          </div>
        )}

        {hasMore && !isLoading && (
          <button onClick={handleLoadMore} style={loadMoreStyle}>
            Load more
          </button>
        )}
      </div>
    </div>
  );
};

interface AuditEventItemProps {
  event: AuditEvent;
  compact: boolean;
}

const AuditEventItem: React.FC<AuditEventItemProps> = ({ event, compact }) => {
  const getEventIcon = (type: AuditEventType) => {
    if (type.includes('Login') || type.includes('Logout')) return <AuthIcon />;
    if (type.includes('Permission')) return <PermissionIcon />;
    if (type.includes('Share')) return <ShareIcon />;
    if (type.includes('Cell') || type.includes('Workbook') || type.includes('Sheet')) return <DataIcon />;
    return <EventIcon />;
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'Success': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'Failure': return { bg: '#fef2f2', color: '#dc2626' };
      case 'Denied': return { bg: '#fff7ed', color: '#ea580c' };
      case 'Warning': return { bg: '#fefce8', color: '#ca8a04' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return date.toLocaleDateString();
  };

  const actionColors = getActionColor(event.action);

  if (compact) {
    return (
      <div style={compactItemStyle}>
        <span style={compactIconStyle}>{getEventIcon(event.eventType)}</span>
        <span style={{ flex: 1, fontSize: 13 }}>{event.description}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{formatTime(event.timestamp)}</span>
      </div>
    );
  }

  return (
    <div style={eventItemStyle}>
      <div style={eventIconStyle}>
        {getEventIcon(event.eventType)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            {event.description}
          </span>
          <span style={{
            ...actionBadgeStyle,
            backgroundColor: actionColors.bg,
            color: actionColors.color,
          }}>
            {event.action}
          </span>
        </div>

        <div style={eventMetaStyle}>
          <span>{event.eventType}</span>
          {event.userId && <span> by User {event.userId.slice(0, 8)}...</span>}
          {event.ipAddress && <span> from {event.ipAddress}</span>}
        </div>

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div style={metadataStyle}>
            {Object.entries(event.metadata).map(([key, value]) => (
              <span key={key} style={metadataItemStyle}>
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
        {formatTime(event.timestamp)}
      </div>
    </div>
  );
};

// Icons
const HistoryIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const AuthIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z" />
  </svg>
);

const PermissionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 00-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 002.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 001.048-.625 11.775 11.775 0 002.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 00-1.044-1.263 62.467 62.467 0 00-2.887-.87C9.843.266 8.69 0 8 0zm2.146 5.146a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 11.708-.708L7.5 7.793l2.646-2.647z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.5 1a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11 2.5a2.5 2.5 0 11.603 1.628l-6.718 3.12a2.499 2.499 0 010 1.504l6.718 3.12a2.5 2.5 0 11-.488.876l-6.718-3.12a2.5 2.5 0 110-3.256l6.718-3.12A2.5 2.5 0 0111 2.5zm-8.5 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm11 5.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
  </svg>
);

const DataIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z" />
    <path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z" />
  </svg>
);

const EventIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
    <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z" />
  </svg>
);

// Styles
const filtersStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
};

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const filterSelectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 13,
  backgroundColor: 'white',
};

const dateInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 13,
};

const errorStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  borderRadius: 8,
  marginBottom: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const eventsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
};

const eventItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
};

const compactItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
};

const eventIconStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  flexShrink: 0,
};

const compactIconStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6b7280',
  flexShrink: 0,
};

const actionBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 500,
};

const eventMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  marginTop: 4,
};

const metadataStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 8,
};

const metadataItemStyle: React.CSSProperties = {
  padding: '2px 6px',
  backgroundColor: '#f3f4f6',
  borderRadius: 4,
  fontSize: 11,
  color: '#4b5563',
  fontFamily: 'monospace',
};

const loadMoreStyle: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: '#f3f4f6',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  marginTop: 12,
  width: '100%',
};

export default AuditLog;
