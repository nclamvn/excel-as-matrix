// Phase 5: Pivot Table Component
// Interactive pivot table with expand/collapse and drag-drop fields

import React, { useCallback } from 'react';
import { usePivotStore } from '../../stores/pivotStore';
import type { PivotTable as PivotTableType, PivotResult, PivotRow as PivotRowType } from '../../types/visualization';

interface PivotTableProps {
  pivot: PivotTableType;
  result?: PivotResult;
  onEdit?: () => void;
}

export const PivotTable: React.FC<PivotTableProps> = ({ pivot, result, onEdit: _onEdit }) => {
  const { toggleGroup, expandedGroups } = usePivotStore();
  const expanded = expandedGroups.get(pivot.id) || new Set();

  const isExpanded = useCallback(
    (groupKey: string) => expanded.has(groupKey),
    [expanded]
  );

  const handleToggle = useCallback(
    (groupKey: string) => {
      toggleGroup(pivot.id, groupKey);
    },
    [pivot.id, toggleGroup]
  );

  if (!result || result.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 p-8">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p>Drag fields to build your pivot table</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse text-sm">
        {/* Headers */}
        {result.headers.map((headerRow, rowIndex) => (
          <thead key={`header-row-${rowIndex}`}>
            <tr>
              {headerRow.map((header, colIndex) => (
                <th
                  key={`header-${rowIndex}-${colIndex}`}
                  colSpan={header.span}
                  className={`px-3 py-2 text-left font-medium border ${
                    header.isValue ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}
                  style={{
                    backgroundColor: header.isValue ? undefined : pivot.style.headerBackground,
                    color: header.isValue ? undefined : pivot.style.headerForeground,
                    borderColor: pivot.style.borderColor,
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
        ))}

        {/* Data Rows */}
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <PivotRow
              key={`row-${rowIndex}`}
              row={row}
              pivot={pivot}
              isExpanded={isExpanded(row.groupKey)}
              onToggle={() => handleToggle(row.groupKey)}
            />
          ))}

          {/* Grand Total Row */}
          {pivot.options.showGrandTotalRow && result.grandTotals.length > 0 && (
            <tr className="font-semibold" style={{ backgroundColor: pivot.style.grandTotalBackground }}>
              {result.grandTotals.map((cell, colIndex) => (
                <td
                  key={`grand-total-${colIndex}`}
                  className="px-3 py-2 border"
                  style={{
                    borderColor: pivot.style.borderColor,
                    textAlign: (cell.style?.textAlign || (colIndex === 0 ? 'left' : 'right')) as React.CSSProperties['textAlign'],
                  }}
                >
                  {colIndex === 0 ? 'Grand Total' : cell.formatted}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

interface PivotRowProps {
  row: PivotRowType;
  pivot: PivotTableType;
  isExpanded: boolean;
  onToggle: () => void;
}

const PivotRow: React.FC<PivotRowProps> = ({ row, pivot, isExpanded, onToggle }) => {
  const indent = row.level * 16;

  return (
    <tr
      className={`
        ${row.isSubtotal ? 'font-medium bg-gray-50' : ''}
        ${row.isGrandTotal ? 'font-semibold' : ''}
        hover:bg-blue-50 transition-colors
      `}
      style={{
        backgroundColor: row.isSubtotal
          ? pivot.style.grandTotalBackground
          : row.isGrandTotal
          ? pivot.style.grandTotalBackground
          : undefined,
      }}
    >
      {row.cells.map((cell, colIndex) => {
        const isFirstCell = colIndex === 0;
        const canExpand = isFirstCell && row.level > 0 && !row.isSubtotal && !row.isGrandTotal;

        return (
          <td
            key={`cell-${colIndex}`}
            className={`px-3 py-2 border ${cell.isHeader ? 'font-medium' : ''}`}
            style={{
              paddingLeft: isFirstCell ? `${indent + 12}px` : undefined,
              borderColor: pivot.style.borderColor,
              textAlign: (cell.style?.textAlign || (isFirstCell ? 'left' : 'right')) as React.CSSProperties['textAlign'],
              backgroundColor: cell.style?.backgroundColor,
            }}
          >
            <div className="flex items-center gap-1">
              {canExpand && (
                <button
                  onClick={onToggle}
                  className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <span>{cell.formatted}</span>
            </div>
          </td>
        );
      })}
    </tr>
  );
};
