/**
 * Preview Banner — shown at the top when previewing a historical version.
 */
import { WorkbookSnapshot } from '@/types/version';

interface PreviewBannerProps {
  snapshot: WorkbookSnapshot;
  onRestore: () => void;
  onCancel: () => void;
}

export function PreviewBanner({ snapshot, onRestore, onCancel }: PreviewBannerProps) {
  const date = new Date(snapshot.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="vh-preview-banner">
      <div className="vh-preview-info">
        <span className="vh-preview-icon">&#128065;</span>
        <span>
          Previewing version from <strong>{date}</strong>
          {snapshot.createdByName && ` by ${snapshot.createdByName}`}
        </span>
      </div>
      <div className="vh-preview-actions">
        <button type="button" className="vh-btn vh-btn--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="vh-btn vh-btn--restore" onClick={onRestore}>
          Restore this version
        </button>
      </div>
    </div>
  );
}
