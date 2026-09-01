/**
 * Version History Panel — slide-out panel showing workbook snapshots.
 * Reads from versionStore (IndexedDB-backed).
 */
import { useEffect, useState } from 'react';
import { useVersionStore } from '@/stores/versionStore';
import { WorkbookSnapshot } from '@/types/version';
import './VersionHistory.css';

interface VersionHistoryPanelProps {
  workbookId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (snapshot: WorkbookSnapshot) => void;
  onPreview: (snapshot: WorkbookSnapshot) => void;
}

export function VersionHistoryPanel({
  workbookId,
  isOpen,
  onClose,
  onRestore,
  onPreview,
}: VersionHistoryPanelProps) {
  const { snapshots, isLoading, loadSnapshots } = useVersionStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workbookId) {
      loadSnapshots(workbookId);
    }
  }, [isOpen, workbookId, loadSnapshots]);

  // Close selected when panel closes
  useEffect(() => {
    if (!isOpen) setSelectedId(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="version-history-panel">
      <div className="vh-header">
        <h3>Version History</h3>
        <button type="button" className="vh-close" onClick={onClose} title="Close">
          &times;
        </button>
      </div>

      <div className="vh-content">
        {isLoading ? (
          <div className="vh-empty">Loading versions...</div>
        ) : snapshots.length === 0 ? (
          <div className="vh-empty">
            <p>No versions saved yet</p>
            <p className="vh-hint">Versions are auto-saved every 5 minutes</p>
          </div>
        ) : (
          <div className="vh-list">
            {snapshots.map((snap, index) => (
              <VersionItem
                key={snap.id}
                snapshot={snap}
                isCurrent={index === 0}
                isSelected={selectedId === snap.id}
                onSelect={() => setSelectedId(selectedId === snap.id ? null : snap.id)}
                onPreview={() => onPreview(snap)}
                onRestore={() => {
                  if (confirm('Restore to this version? Current state will be saved first.')) {
                    onRestore(snap);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="vh-footer">
        <span>
          {snapshots.length} version{snapshots.length !== 1 ? 's' : ''}
        </span>
        <span className="vh-hint">Auto-saved every 5 min</span>
      </div>
    </div>
  );
}

interface VersionItemProps {
  snapshot: WorkbookSnapshot;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onRestore: () => void;
}

function VersionItem({
  snapshot,
  isCurrent,
  isSelected,
  onSelect,
  onPreview,
  onRestore,
}: VersionItemProps) {
  return (
    <div className={`vh-item ${isSelected ? 'vh-item--selected' : ''}`} onClick={onSelect}>
      <div className="vh-item-header">
        <span className="vh-time">{timeAgo(snapshot.timestamp)}</span>
        {isCurrent && <span className="vh-badge">Current</span>}
      </div>

      <div className="vh-item-meta">
        <span className="vh-user">{snapshot.createdByName}</span>
        <span className="vh-desc">{snapshot.description}</span>
      </div>

      <div className="vh-item-details">
        <span>{formatDate(snapshot.timestamp)}</span>
        <span>{formatSize(snapshot.sizeBytes)}</span>
      </div>

      {isSelected && (
        <div className="vh-item-actions">
          <button
            type="button"
            className="vh-btn vh-btn--secondary"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            Preview
          </button>
          {!isCurrent && (
            <button
              type="button"
              className="vh-btn vh-btn--primary"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
            >
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default VersionHistoryPanel;
