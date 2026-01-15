import { useState } from 'react';
import { useTableStore } from '../../stores/tableStore';
import { Table, TableColumn } from '../../types/cell';

interface TableManagerProps {
  sheetId: string;
  onClose: () => void;
}

export const TableManager: React.FC<TableManagerProps> = ({ sheetId, onClose }) => {
  const { tables, getTablesBySheet, addTable, removeTable, updateTable, addColumn, removeColumn } = useTableStore();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');

  const sheetTables = getTablesBySheet(sheetId);
  const selectedTable = selectedTableId ? tables[selectedTableId] : null;

  const handleCreateTable = () => {
    if (!newTableName.trim()) return;

    const now = new Date().toISOString();
    const newTable: Table = {
      id: crypto.randomUUID(),
      name: newTableName.trim(),
      sheetId,
      startRow: 0,
      startCol: 0,
      columns: [
        { id: crypto.randomUUID(), name: 'Column1', index: 0, hidden: false },
      ],
      rowCount: 0,
      hasHeaderRow: true,
      hasTotalRow: false,
      style: {
        name: 'Default',
        headerBackgroundColor: '#4472C4',
        headerTextColor: '#FFFFFF',
        alternateRowColor: '#D9E2F3',
      },
      createdAt: now,
      updatedAt: now,
    };

    addTable(newTable);
    setSelectedTableId(newTable.id);
    setNewTableName('');
    setIsCreating(false);
  };

  const handleAddColumn = () => {
    if (!selectedTable || !newColumnName.trim()) return;

    const column: TableColumn = {
      id: crypto.randomUUID(),
      name: newColumnName.trim(),
      index: selectedTable.columns.length,
      hidden: false,
    };

    addColumn(selectedTable.id, column);
    setNewColumnName('');
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      removeTable(tableId);
      if (selectedTableId === tableId) {
        setSelectedTableId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Table Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Table List */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Tables in Sheet</h3>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + New Table
              </button>
            </div>

            {/* Create Table Form */}
            {isCreating && (
              <div className="mb-3 p-3 bg-gray-50 rounded border">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Table name"
                  className="w-full px-2 py-1 border rounded mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTable}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); setNewTableName(''); }}
                    className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Table List */}
            {sheetTables.length === 0 ? (
              <p className="text-gray-500 text-sm">No tables in this sheet</p>
            ) : (
              <div className="space-y-1">
                {sheetTables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                      selectedTableId === table.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <div>
                      <span className="font-medium">{table.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {table.columns.length} columns, {table.rowCount} rows
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Table Details */}
          {selectedTable && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Table: {selectedTable.name}</h3>

              {/* Columns */}
              <div className="mb-3">
                <h4 className="text-sm font-medium mb-2">Columns</h4>
                <div className="space-y-1">
                  {selectedTable.columns.map((col) => (
                    <div key={col.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{col.name}</span>
                      <button
                        onClick={() => removeColumn(selectedTable.id, col.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Column */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="New column name"
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                  <button
                    onClick={handleAddColumn}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTable.hasHeaderRow}
                    onChange={(e) => updateTable(selectedTable.id, { hasHeaderRow: e.target.checked })}
                  />
                  <span className="text-sm">Has header row</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTable.hasTotalRow}
                    onChange={(e) => updateTable(selectedTable.id, { hasTotalRow: e.target.checked })}
                  />
                  <span className="text-sm">Has total row</span>
                </label>
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
