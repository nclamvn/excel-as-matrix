// Phase 11: GDPR Tools Component
// Data export, erasure requests, and consent management

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  Trash2,
  FileText,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { loggers } from '@/utils/logger';

interface DataSubjectRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  requestedAt: string;
  completedAt?: string;
  processedBy?: string;
  notes?: string;
}

interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  consentType: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  ipAddress: string;
  userAgent: string;
}

const REQUEST_TYPES = [
  { value: 'access', label: 'Data Access', icon: Eye, description: 'Request a copy of personal data' },
  { value: 'erasure', label: 'Data Erasure', icon: Trash2, description: 'Right to be forgotten' },
  { value: 'portability', label: 'Data Portability', icon: Download, description: 'Export data in portable format' },
  { value: 'rectification', label: 'Rectification', icon: FileText, description: 'Correct inaccurate data' },
  { value: 'restriction', label: 'Restriction', icon: Shield, description: 'Restrict processing' },
  { value: 'objection', label: 'Objection', icon: XCircle, description: 'Object to processing' },
];

export const GDPRTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'consents' | 'export'>('requests');
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'consents') {
      fetchConsents();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/gdpr/requests?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch DSR requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/gdpr/consents?search=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConsents(data.consents);
      }
    } catch (error) {
      loggers.admin.error('Failed to fetch consent records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/gdpr/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        fetchRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      loggers.admin.error(`Failed to ${action} request:`, error);
    }
  };

  const getStatusBadge = (status: DataSubjectRequest['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    const icons = {
      pending: <Clock className="w-3 h-3" />,
      processing: <RefreshCw className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const requestType = REQUEST_TYPES.find((t) => t.value === type);
    return requestType?.label || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GDPR Compliance Tools</h1>
          <p className="text-gray-500 mt-1">Manage data subject requests and consent records</p>
        </div>
        <button
          onClick={() => setShowNewRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Data Subject Requests
        </button>
        <button
          onClick={() => setActiveTab('consents')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'consents'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Consent Records
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'export'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bulk Export
        </button>
      </div>

      {/* Data Subject Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {REQUEST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchRequests}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-gray-900">{request.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                        <div className="text-xs text-gray-500">{request.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{getTypeLabel(request.type)}</span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Consent Records Tab */}
      {activeTab === 'consents' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consent Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Loading consent records...
                    </td>
                  </tr>
                ) : consents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No consent records found
                    </td>
                  </tr>
                ) : (
                  consents.map((consent) => (
                    <tr key={consent.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{consent.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{consent.consentType}</span>
                      </td>
                      <td className="px-4 py-3">
                        {consent.granted ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(consent.grantedAt || consent.revokedAt || '')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-500">{consent.ipAddress}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Bulk Export Tab */}
      {activeTab === 'export' && <BulkExportPanel />}

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onProcess={handleProcessRequest}
        />
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSuccess={() => {
            setShowNewRequestModal(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

// Bulk Export Panel
const BulkExportPanel: React.FC = () => {
  const [email, setEmail] = useState('');
  const [format, setFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!email) return;

    setExporting(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ email, format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-${email}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess(true);
      }
    } catch (error) {
      loggers.admin.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export User Data</h3>
      <p className="text-gray-500 mb-6">
        Export all data associated with a user for GDPR data portability compliance.
      </p>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'json' | 'csv' | 'xml')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
        </div>

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Export completed successfully</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={!email || exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>
    </div>
  );
};

// Request Details Modal
interface RequestDetailsModalProps {
  request: DataSubjectRequest;
  onClose: () => void;
  onProcess: (id: string, action: 'approve' | 'reject', notes?: string) => void;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ request, onClose, onProcess }) => {
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setProcessing(true);
    await onProcess(request.id, action, notes);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Request ID</label>
              <div className="font-mono text-sm text-gray-900">{request.id}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Type</label>
              <div className="text-gray-900">
                {REQUEST_TYPES.find((t) => t.value === request.type)?.label}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">User</label>
            <div className="text-gray-900">{request.userName}</div>
            <div className="text-sm text-gray-500">{request.userEmail}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Requested</label>
              <div className="text-gray-900">
                {new Date(request.requestedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <div>{request.status}</div>
            </div>
          </div>

          {request.reason && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Reason</label>
              <div className="text-gray-900">{request.reason}</div>
            </div>
          )}

          {request.status === 'pending' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add notes about this request..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve & Process'}
                </button>
              </div>
            </>
          )}

          {request.status !== 'pending' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// New Request Modal
interface NewRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    userEmail: '',
    type: 'access',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/gdpr/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">New Data Subject Request</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for request..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GDPRTools;
