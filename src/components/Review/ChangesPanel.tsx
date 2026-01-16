// ============================================================
// CHANGES PANEL
// ============================================================

import React from 'react';
import { useTrackChangesStore } from '../../stores/trackChangesStore';
import { X, Check, Pencil, Plus, Minus, History } from 'lucide-react';
import './TrackChanges.css';

interface ChangesPanelProps {
  sheetId: string;
}

export const ChangesPanel: React.FC<ChangesPanelProps> = ({ sheetId }) => {
  const {
    getChangesForSheet,
    getPendingChanges,
    toggleChangesPanel,
    acceptChange,
    rejectChange,
    selectedChangeId,
    setSelectedChange,
  } = useTrackChangesStore();

  const changes = getChangesForSheet(sheetId);
  const pendingCount = getPendingChanges(sheetId).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'cellEdit': return <Pencil size={16} />;
      case 'rowInsert': return <Plus size={16} />;
      case 'rowDelete': return <Minus size={16} />;
      case 'colInsert': return <Plus size={16} />;
      case 'colDelete': return <Minus size={16} />;
      default: return <Pencil size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <div className="changes-panel">
      <div className="panel-header">
        <h3>Change History ({pendingCount} pending)</h3>
        <button className="close-btn" onClick={toggleChangesPanel}>
          <X size={18} />
        </button>
      </div>

      <div className="changes-list">
        {changes.length === 0 ? (
          <div className="empty-state">
            <History size={48} color="#ccc" />
            <p>No changes recorded</p>
            <span>Enable "Track Changes" to start recording</span>
          </div>
        ) : (
          changes.map(change => (
            <div
              key={change.id}
              className={`change-item ${selectedChangeId === change.id ? 'selected' : ''}`}
              onClick={() => setSelectedChange(change.id)}
            >
              <div className="change-icon">{getChangeIcon(change.type)}</div>
              <div className="change-details">
                <div className="change-type">
                  {change.type.replace(/([A-Z])/g, ' $1').trim()}
                  {change.cellRef && <span className="cell-ref"> at {change.cellRef}</span>}
                </div>
                {change.oldValue !== undefined && (
                  <div className="change-values">
                    <span className="old-value">{String(change.oldValue)}</span>
                    <span className="arrow">→</span>
                    <span className="new-value">{String(change.newValue)}</span>
                  </div>
                )}
                <div className="change-time">{formatTime(change.timestamp)}</div>
              </div>
              <div className="change-status">
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(change.status) }}
                >
                  {change.status}
                </span>
                {change.status === 'pending' && (
                  <div className="change-actions">
                    <button
                      onClick={(e) => { e.stopPropagation(); acceptChange(change.id, sheetId); }}
                      title="Accept"
                      className="accept-btn"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rejectChange(change.id, sheetId); }}
                      title="Reject"
                      className="reject-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChangesPanel;
