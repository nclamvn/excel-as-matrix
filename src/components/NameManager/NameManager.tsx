import { useState } from 'react';
import { useNamedRangeStore } from '../../stores/namedRangeStore';
import { NamedRange, RangeScope } from '../../types/cell';

interface NameManagerProps {
  sheetId: string;
  onClose: () => void;
}

export const NameManager: React.FC<NameManagerProps> = ({ sheetId, onClose }) => {
  const {
    ranges,
    listAll,
    addRange,
    removeRange,
    updateRange,
  } = useNamedRangeStore();

  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'workbook' | 'sheet'>('all');

  // New range form state
  const [newName, setNewName] = useState('');
  const [newRefersTo, setNewRefersTo] = useState('');
  const [newScope, setNewScope] = useState<'workbook' | 'sheet'>('workbook');
  const [newComment, setNewComment] = useState('');

  const allRanges = listAll();
  const selectedRange = selectedRangeId ? ranges[selectedRangeId] : null;

  // Filter ranges
  const filteredRanges = allRanges.filter((range) => {
    if (filter === 'workbook') return range.scope === 'workbook';
    if (filter === 'sheet') return range.scope !== 'workbook';
    return true;
  });

  const handleCreate = () => {
    if (!newName.trim() || !newRefersTo.trim()) return;

    const now = new Date().toISOString();
    const scope: RangeScope = newScope === 'workbook' ? 'workbook' : { sheet: sheetId };

    const newRange: NamedRange = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      refersTo: newRefersTo.trim(),
      scope,
      comment: newComment.trim() || undefined,
      hidden: false,
      createdAt: now,
      updatedAt: now,
    };

    addRange(newRange);
    setSelectedRangeId(newRange.id);
    resetForm();
    setIsCreating(false);
  };

  const resetForm = () => {
    setNewName('');
    setNewRefersTo('');
    setNewScope('workbook');
    setNewComment('');
  };

  const handleDelete = (rangeId: string) => {
    if (confirm('Are you sure you want to delete this named range?')) {
      removeRange(rangeId);
      if (selectedRangeId === rangeId) {
        setSelectedRangeId(null);
      }
    }
  };

  const getScopeLabel = (scope: RangeScope): string => {
    return scope === 'workbook' ? 'Workbook' : 'Sheet';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[650px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Name Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New
            </button>
            {selectedRange && (
              <button
                onClick={() => handleDelete(selectedRange.id)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Names</option>
              <option value="workbook">Workbook Scope</option>
              <option value="sheet">Sheet Scope</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Create Form */}
          {isCreating && (
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-medium mb-3">New Named Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., TaxRate"
                    className="w-full px-2 py-1 border rounded"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Refers To</label>
                  <input
                    type="text"
                    value={newRefersTo}
                    onChange={(e) => setNewRefersTo(e.target.value)}
                    placeholder="e.g., Sheet1!$A$1 or $B$1:$B$10"
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Scope</label>
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as 'workbook' | 'sheet')}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="workbook">Workbook</option>
                    <option value="sheet">Current Sheet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment (optional)</label>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Description"
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); resetForm(); }}
                    className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Range List */}
          <div className="p-4">
            {filteredRanges.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No named ranges defined
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Value</th>
                    <th className="text-left py-2 px-2">Scope</th>
                    <th className="text-left py-2 px-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRanges.map((range) => (
                    <tr
                      key={range.id}
                      className={`border-b cursor-pointer ${
                        selectedRangeId === range.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRangeId(range.id)}
                    >
                      <td className="py-2 px-2 font-medium">{range.name}</td>
                      <td className="py-2 px-2 font-mono text-xs">{range.refersTo}</td>
                      <td className="py-2 px-2">{getScopeLabel(range.scope)}</td>
                      <td className="py-2 px-2 text-gray-500">{range.comment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Selected Range Details */}
          {selectedRange && !isCreating && (
            <div className="p-4 border-t bg-gray-50">
              <h3 className="font-medium mb-3">Edit: {selectedRange.name}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Refers To</label>
                  <input
                    type="text"
                    value={selectedRange.refersTo}
                    onChange={(e) => updateRange(selectedRange.id, { refersTo: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <input
                    type="text"
                    value={selectedRange.comment || ''}
                    onChange={(e) => updateRange(selectedRange.id, { comment: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
