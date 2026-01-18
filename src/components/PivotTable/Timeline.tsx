// ============================================================
// TIMELINE COMPONENT — Date Range Filter for Pivot Tables
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useSlicerStore } from '../../stores/slicerStore';
import { usePivotStore } from '../../stores/pivotStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { Timeline as TimelineType, TimelineLevel, PivotTable } from '../../types/pivot';
import './PivotTable.css';

interface TimelineProps {
  timeline: TimelineType;
  pivot: PivotTable;
  onPositionChange?: (x: number, y: number) => void;
}

interface TimelinePeriod {
  label: string;
  start: Date;
  end: Date;
  isSelected: boolean;
}

// TimelineLevel labels for UI reference
// const LEVEL_LABELS: Record<TimelineLevel, string> = {
//   years: 'Years',
//   quarters: 'Quarters',
//   months: 'Months',
//   days: 'Days',
// };

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  pivot,
  onPositionChange,
}) => {
  const {
    setTimelineRange,
    setTimelineLevel,
    clearTimelineSelection,
    deleteTimeline,
    selectTimeline,
    updateTimelinePosition,
  } = useSlicerStore();
  const { setFilter, removeFilter } = usePivotStore();
  const { getCellValue } = useWorkbookStore();

  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  // Get date range from source data
  const dateRange = useMemo(() => {
    const fieldDef = pivot.fields.find(f => f.id === timeline.fieldId);
    if (!fieldDef || fieldDef.dataType !== 'date') return { min: null, max: null, dates: [] };

    const rangeMatch = pivot.sourceRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
    if (!rangeMatch) return { min: null, max: null, dates: [] };

    const startCol = rangeMatch[1].toUpperCase().charCodeAt(0) - 65;
    const startRow = parseInt(rangeMatch[2], 10) - 1;
    const endRow = parseInt(rangeMatch[4], 10) - 1;

    const colIndex = fieldDef.sourceColumn;
    const dates: Date[] = [];

    for (let r = startRow + 1; r <= endRow; r++) {
      const rawValue = getCellValue(pivot.sourceSheetId, r, startCol + colIndex);
      if (rawValue !== null && rawValue !== undefined && typeof rawValue !== 'boolean') {
        // Handle both Date objects and date strings
        const value = rawValue as string | number | Date;
        const date = value instanceof Date ? value : new Date(String(value));
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }
    }

    if (dates.length === 0) return { min: null, max: null, dates: [] };

    dates.sort((a, b) => a.getTime() - b.getTime());
    return {
      min: dates[0],
      max: dates[dates.length - 1],
      dates,
    };
  }, [pivot, timeline.fieldId, getCellValue]);

  // Generate periods based on level
  const periods = useMemo((): TimelinePeriod[] => {
    if (!dateRange.min || !dateRange.max) return [];

    const result: TimelinePeriod[] = [];
    const current = new Date(dateRange.min);

    while (current <= dateRange.max) {
      let label: string;
      let periodEnd: Date;

      switch (timeline.level) {
        case 'years':
          label = current.getFullYear().toString();
          periodEnd = new Date(current.getFullYear(), 11, 31, 23, 59, 59);
          break;
        case 'quarters':
          const quarter = Math.floor(current.getMonth() / 3) + 1;
          label = `Q${quarter} ${current.getFullYear()}`;
          periodEnd = new Date(current.getFullYear(), quarter * 3, 0, 23, 59, 59);
          break;
        case 'months':
          label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'days':
          label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          periodEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59);
          break;
        default:
          label = current.toISOString();
          periodEnd = new Date(current);
      }

      const periodStart = new Date(current);
      const isSelected = timeline.startDate && timeline.endDate
        ? !(periodEnd < timeline.startDate || periodStart > timeline.endDate)
        : false;

      result.push({
        label,
        start: periodStart,
        end: periodEnd,
        isSelected,
      });

      // Move to next period
      switch (timeline.level) {
        case 'years':
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'quarters':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'months':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'days':
          current.setDate(current.getDate() + 1);
          break;
      }
    }

    return result;
  }, [dateRange, timeline.level, timeline.startDate, timeline.endDate]);

  // Handle period click
  const handlePeriodClick = (period: TimelinePeriod, e: React.MouseEvent) => {
    if (e.shiftKey && timeline.startDate) {
      // Extend selection
      const newStart = period.start < timeline.startDate ? period.start : timeline.startDate;
      const newEnd = period.end > (timeline.endDate || timeline.startDate) ? period.end : timeline.endDate || timeline.startDate;
      setTimelineRange(timeline.id, newStart, newEnd);
      updatePivotFilter(newStart, newEnd);
    } else if (period.isSelected) {
      // Deselect
      clearTimelineSelection(timeline.id);
      removeFilter(pivot.id, timeline.fieldId);
    } else {
      // New selection
      setTimelineRange(timeline.id, period.start, period.end);
      updatePivotFilter(period.start, period.end);
    }
  };

  const updatePivotFilter = (start: Date, end: Date) => {
    // Filter dates within the selected range
    const selectedDates = dateRange.dates.filter(d => d >= start && d <= end);
    if (selectedDates.length === 0 || selectedDates.length === dateRange.dates.length) {
      removeFilter(pivot.id, timeline.fieldId);
    } else {
      setFilter(pivot.id, {
        fieldId: timeline.fieldId,
        selectedValues: selectedDates,
        excludeMode: false,
      });
    }
  };

  // Clear filter
  const handleClearFilter = () => {
    clearTimelineSelection(timeline.id);
    removeFilter(pivot.id, timeline.fieldId);
  };

  // Delete timeline
  const handleDelete = () => {
    removeFilter(pivot.id, timeline.fieldId);
    deleteTimeline(timeline.id);
  };

  // Change level
  const handleLevelChange = (level: TimelineLevel) => {
    setTimelineLevel(timeline.id, level);
    clearTimelineSelection(timeline.id);
    removeFilter(pivot.id, timeline.fieldId);
    setShowMenu(false);
  };

  // Scroll
  const handleScroll = (direction: 'left' | 'right') => {
    const periodWidth = 80;
    const visiblePeriods = Math.floor(timeline.position.width / periodWidth);
    const maxOffset = Math.max(0, periods.length - visiblePeriods);

    if (direction === 'left') {
      setScrollOffset(Math.max(0, scrollOffset - 1));
    } else {
      setScrollOffset(Math.min(maxOffset, scrollOffset + 1));
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.timeline-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - timeline.position.x,
        y: e.clientY - timeline.position.y,
      });
      selectTimeline(timeline.id);
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updateTimelinePosition(timeline.id, { x: newX, y: newY });
      onPositionChange?.(newX, newY);
    }
  }, [isDragging, dragOffset, timeline.id, updateTimelinePosition, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const hasActiveFilter = timeline.startDate && timeline.endDate;

  return (
    <div
      className={`timeline ${isDragging ? 'dragging' : ''}`}
      style={{
        left: timeline.position.x,
        top: timeline.position.y,
        width: timeline.position.width,
        height: timeline.position.height,
        borderColor: timeline.style.borderColor,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      {timeline.showHeader && (
        <div
          className="timeline-header"
          style={{
            backgroundColor: timeline.style.headerColor,
            color: timeline.style.headerTextColor,
          }}
        >
          <div className="timeline-title">
            <Calendar size={14} />
            <span>{timeline.name}</span>
          </div>
          <div className="timeline-level">
            <select
              value={timeline.level}
              onChange={e => handleLevelChange(e.target.value as TimelineLevel)}
              onClick={e => e.stopPropagation()}
            >
              <option value="years">Years</option>
              <option value="quarters">Quarters</option>
              <option value="months">Months</option>
              <option value="days">Days</option>
            </select>
          </div>
          <div className="timeline-actions">
            {hasActiveFilter && (
              <button
                className="timeline-action-btn"
                onClick={handleClearFilter}
                title="Clear Filter"
              >
                <X size={14} />
              </button>
            )}
            <button
              className="timeline-action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {showMenu && (
            <div className="timeline-menu" onClick={e => e.stopPropagation()}>
              <button onClick={handleClearFilter}>
                <X size={14} />
                Clear Selection
              </button>
              <div className="menu-divider" />
              <button onClick={handleDelete} className="danger">
                <Trash2 size={14} />
                Remove Timeline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline Bar */}
      <div className="timeline-body">
        {scrollOffset > 0 && (
          <button
            className="timeline-scroll-btn left"
            onClick={() => handleScroll('left')}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="timeline-periods">
          {periods.slice(scrollOffset, scrollOffset + 10).map((period, index) => (
            <button
              key={index}
              className={`timeline-period ${period.isSelected ? 'selected' : ''}`}
              style={{
                backgroundColor: period.isSelected
                  ? timeline.style.selectedColor
                  : timeline.style.unselectedColor,
                color: period.isSelected
                  ? timeline.style.headerTextColor
                  : '#666',
              }}
              onClick={e => handlePeriodClick(period, e)}
              title={`${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {scrollOffset + 10 < periods.length && (
          <button
            className="timeline-scroll-btn right"
            onClick={() => handleScroll('right')}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Selection info */}
      {hasActiveFilter && (
        <div className="timeline-selection-info">
          {timeline.startDate?.toLocaleDateString()} - {timeline.endDate?.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default Timeline;
