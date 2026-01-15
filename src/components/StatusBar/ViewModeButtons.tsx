import React, { useState } from 'react';
import { LayoutGrid, Columns, FileText } from 'lucide-react';

type ViewMode = 'normal' | 'page-layout' | 'page-break';

export const ViewModeButtons: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('normal');

  return (
    <div className="view-mode-buttons">
      <button
        className={`view-mode-btn ${viewMode === 'normal' ? 'active' : ''}`}
        onClick={() => setViewMode('normal')}
        title="Normal View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        className={`view-mode-btn ${viewMode === 'page-layout' ? 'active' : ''}`}
        onClick={() => setViewMode('page-layout')}
        title="Page Layout View"
      >
        <FileText className="w-4 h-4" />
      </button>
      <button
        className={`view-mode-btn ${viewMode === 'page-break' ? 'active' : ''}`}
        onClick={() => setViewMode('page-break')}
        title="Page Break Preview"
      >
        <Columns className="w-4 h-4" />
      </button>
    </div>
  );
};
