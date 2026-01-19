// ============================================================
// PIVOT TABLE RENDERER — Renders the Pivot Table Grid
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, BarChart2, Filter, Calendar } from 'lucide-react';
import { usePivotStore } from '../../stores/pivotStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSlicerStore } from '../../stores/slicerStore';
import { PivotTable, PivotResult, PivotCellData, PivotCellValue } from '../../types/pivot';
import { calculatePivot } from './pivotEngine';
import { PivotChartDialog } from './PivotChartDialog';
import { InsertSlicerDialog } from './InsertSlicerDialog';
import { Slicer } from './Slicer';
import { Timeline } from './Timeline';
import './PivotTable.css';

interface PivotTableRendererProps {
  pivot: PivotTable;
  onCellClick?: (cell: PivotCellData) => void;
}

export const PivotTableRenderer: React.FC<PivotTableRendererProps> = ({
  pivot,
  onCellClick,
}) => {
  const { toggleRowExpansion, markForRefresh } = usePivotStore();
  const { getCellValue } = useWorkbookStore();
  const { getSlicersForPivot, getTimelinesForPivot } = useSlicerStore();

  const [showChartDialog, setShowChartDialog] = useState(false);
  const [showSlicerDialog, setShowSlicerDialog] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);

  // Get slicers and timelines for this pivot
  const slicers = getSlicersForPivot(pivot.id);
  const timelines = getTimelinesForPivot(pivot.id);

  // Check if there are any date fields for timeline
  const hasDateFields = pivot.fields.some(f => f.dataType === 'date');

  // Get source data from the workbook
  const sourceData = useMemo(() => {
    const match = pivot.sourceRange.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!match) return [];

    const startCol = match[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(match[2], 10) - 1;
    const endCol = match[3].toUpperCase().charCodeAt(0) - 65;
    const endRow = parseInt(match[4], 10) - 1;

    const data: PivotCellValue[][] = [];
    for (let row = startRow; row <= endRow; row++) {
      const rowData: PivotCellValue[] = [];
      for (let col = startCol; col <= endCol; col++) {
        rowData.push(getCellValue(pivot.sourceSheetId, row, col));
      }
      data.push(rowData);
    }
    return data;
  }, [pivot.sourceSheetId, pivot.sourceRange, getCellValue, pivot.lastRefreshed]);

  // Calculate the pivot result
  const result: PivotResult = useMemo(() => {
    if (sourceData.length === 0) {
      return {
        cells: [[{
          value: 'No data',
          formattedValue: 'No data',
          isHeader: true,
          isTotal: false,
          isSubtotal: false,
          rowPath: [],
          colPath: [],
          level: 0,
          isCollapsible: false,
          isExpanded: true,
        }]],
        rowCount: 1,
        colCount: 1,
      };
    }
    return calculatePivot(pivot, sourceData);
  }, [pivot, sourceData]);

  const handleToggleExpand = useCallback((rowKey: string) => {
    toggleRowExpansion(pivot.id, rowKey);
  }, [pivot.id, toggleRowExpansion]);

  const handleRefresh = useCallback(() => {
    markForRefresh(pivot.id);
  }, [pivot.id, markForRefresh]);

  const renderCell = (cell: PivotCellData, rowIndex: number, colIndex: number) => {
    const cellClasses = [
      'pivot-cell',
      cell.isHeader ? 'header' : 'data',
      cell.isTotal ? 'total' : '',
      cell.isSubtotal ? 'subtotal' : '',
      cell.isCollapsible ? 'collapsible' : '',
    ].filter(Boolean).join(' ');

    const style: React.CSSProperties = {
      paddingLeft: cell.isHeader && cell.level > 0 ? `${cell.level * 16 + 8}px` : undefined,
    };

    return (
      <td
        key={`${rowIndex}-${colIndex}`}
        className={cellClasses}
        style={style}
        onClick={() => onCellClick?.(cell)}
      >
        {cell.isCollapsible && (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(cell.rowPath.join('|'));
            }}
          >
            {cell.isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        )}
        <span className="cell-value">{cell.formattedValue}</span>
      </td>
    );
  };

  return (
    <div className="pivot-table-renderer">
      <div className="pivot-table-header">
        <span className="pivot-table-name">{pivot.name}</span>
        <div className="pivot-header-actions">
          <button
            className="pivot-action-btn"
            onClick={() => setShowSlicerDialog(true)}
            title="Insert Slicer"
          >
            <Filter size={14} />
          </button>
          {hasDateFields && (
            <button
              className="pivot-action-btn"
              onClick={() => setShowTimelineDialog(true)}
              title="Insert Timeline"
            >
              <Calendar size={14} />
            </button>
          )}
          <button
            className="pivot-chart-btn"
            onClick={() => setShowChartDialog(true)}
            title="Create Pivot Chart"
          >
            <BarChart2 size={14} />
          </button>
          <button
            className="pivot-refresh-btn"
            onClick={handleRefresh}
            title="Refresh pivot table"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="pivot-table-scroll">
        <table className="pivot-table">
          <tbody>
            {result.cells.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pivot-table-footer">
        <span className="pivot-info">
          {result.rowCount} rows × {result.colCount} columns
        </span>
        <span className="pivot-refresh-time">
          Last refreshed: {new Date(pivot.lastRefreshed).toLocaleTimeString()}
        </span>
      </div>

      {/* Slicers */}
      {slicers.map(slicer => (
        <Slicer
          key={slicer.id}
          slicer={slicer}
          pivot={pivot}
        />
      ))}

      {/* Timelines */}
      {timelines.map(timeline => (
        <Timeline
          key={timeline.id}
          timeline={timeline}
          pivot={pivot}
        />
      ))}

      {/* Dialogs */}
      <PivotChartDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        pivot={pivot}
      />

      <InsertSlicerDialog
        isOpen={showSlicerDialog}
        onClose={() => setShowSlicerDialog(false)}
        pivot={pivot}
        mode="slicer"
      />

      <InsertSlicerDialog
        isOpen={showTimelineDialog}
        onClose={() => setShowTimelineDialog(false)}
        pivot={pivot}
        mode="timeline"
      />
    </div>
  );
};

export default PivotTableRenderer;
