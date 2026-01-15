import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useUIStore } from '../../stores/uiStore';

interface SortLevel {
  column: number;
  direction: 'asc' | 'desc';
}

interface CustomSortDialogProps {
  onClose: () => void;
}

// Helper to convert column number to letter
const colToLetter = (col: number): string => {
  let result = '';
  col += 1;
  while (col > 0) {
    const remainder = (col - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result;
};

export const CustomSortDialog: React.FC<CustomSortDialogProps> = ({ onClose }) => {
  const [sortLevels, setSortLevels] = useState<SortLevel[]>([
    { column: 0, direction: 'asc' }
  ]);
  const [hasHeaders, setHasHeaders] = useState(true);
  const { sort, selectionRange } = useWorkbookStore();
  const { showToast } = useUIStore();

  const addLevel = () => {
    if (sortLevels.length < 5) {
      setSortLevels([...sortLevels, { column: sortLevels.length, direction: 'asc' }]);
    }
  };

  const removeLevel = (index: number) => {
    if (sortLevels.length > 1) {
      setSortLevels(sortLevels.filter((_, i) => i !== index));
    }
  };

  const updateLevel = (index: number, field: keyof SortLevel, value: number | 'asc' | 'desc') => {
    const updated = [...sortLevels];
    if (field === 'column') {
      updated[index] = { ...updated[index], column: value as number };
    } else {
      updated[index] = { ...updated[index], direction: value as 'asc' | 'desc' };
    }
    setSortLevels(updated);
  };

  const handleSort = () => {
    // Apply sorts in order (first level first)
    sortLevels.forEach(level => {
      sort({ column: level.column, direction: level.direction });
    });
    showToast(`Sorted by ${sortLevels.length} level(s)`, 'success');
    onClose();
  };

  // Generate column options based on selection or default to A-Z
  const maxCol = selectionRange
    ? Math.max(selectionRange.end.col, 25)
    : 25;

  const columnOptions = Array.from({ length: maxCol + 1 }, (_, i) => ({
    value: i,
    label: colToLetter(i)
  }));

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog custom-sort-dialog" onClick={e => e.stopPropagation()} style={{ width: 450 }}>
        <div className="dialog-header">
          <h2>Custom Sort</h2>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="dialog-body">
          <label className="dialog-checkbox" style={{ marginBottom: '16px' }}>
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={e => setHasHeaders(e.target.checked)}
            />
            My data has headers
          </label>

          <div className="sort-levels">
            {sortLevels.map((level, index) => (
              <div key={index} className="sort-level">
                <span className="sort-level-label">
                  {index === 0 ? 'Sort by' : 'Then by'}
                </span>

                <select
                  value={level.column}
                  onChange={e => updateLevel(index, 'column', parseInt(e.target.value))}
                  className="sort-level-select"
                >
                  {columnOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      Column {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={level.direction}
                  onChange={e => updateLevel(index, 'direction', e.target.value as 'asc' | 'desc')}
                  className="sort-level-select"
                >
                  <option value="asc">A to Z</option>
                  <option value="desc">Z to A</option>
                </select>

                <button
                  className="sort-level-icon"
                  title={level.direction === 'asc' ? 'Ascending' : 'Descending'}
                  onClick={() => updateLevel(index, 'direction', level.direction === 'asc' ? 'desc' : 'asc')}
                >
                  {level.direction === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
                </button>

                {sortLevels.length > 1 && (
                  <button
                    className="sort-level-remove"
                    onClick={() => removeLevel(index)}
                    title="Remove level"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {sortLevels.length < 5 && (
            <button className="btn-add-level" onClick={addLevel}>
              <Plus size={16} />
              Add Level
            </button>
          )}
        </div>

        <div className="dialog-footer">
          <button className="dialog-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dialog-btn-primary" onClick={handleSort}>
            Sort
          </button>
        </div>
      </div>
    </div>
  );
};
