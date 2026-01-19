// ============================================================
// SLICER STORE — Zustand Store for Slicers and Timelines
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Slicer,
  Timeline,
  SlicerStyle,
  TimelineStyle,
  TimelineLevel,
  SortOrder,
  PivotCellValue,
  DEFAULT_SLICER_STYLE,
  DEFAULT_TIMELINE_STYLE,
} from '../types/pivot';

interface SlicerStore {
  // Slicers
  slicers: Record<string, Slicer>;

  // Timelines
  timelines: Record<string, Timeline>;

  // Selected slicer/timeline for editing
  selectedSlicerId: string | null;
  selectedTimelineId: string | null;

  // Slicer CRUD
  createSlicer: (
    pivotId: string,
    fieldId: string,
    name: string,
    position?: { x: number; y: number }
  ) => Slicer;
  updateSlicer: (id: string, updates: Partial<Slicer>) => void;
  deleteSlicer: (id: string) => void;
  getSlicer: (id: string) => Slicer | null;
  getSlicersForPivot: (pivotId: string) => Slicer[];

  // Slicer selection
  toggleSlicerValue: (slicerId: string, value: PivotCellValue) => void;
  setSlicerValues: (slicerId: string, values: PivotCellValue[]) => void;
  clearSlicerSelection: (slicerId: string) => void;
  selectAllSlicerValues: (slicerId: string, allValues: PivotCellValue[]) => void;

  // Slicer options
  setSlicerColumns: (slicerId: string, columns: number) => void;
  setSlicerSort: (slicerId: string, sortOrder: SortOrder) => void;
  setSlicerStyle: (slicerId: string, style: Partial<SlicerStyle>) => void;
  setSlicerMultiSelect: (slicerId: string, multiSelect: boolean) => void;

  // Timeline CRUD
  createTimeline: (
    pivotId: string,
    fieldId: string,
    name: string,
    position?: { x: number; y: number }
  ) => Timeline;
  updateTimeline: (id: string, updates: Partial<Timeline>) => void;
  deleteTimeline: (id: string) => void;
  getTimeline: (id: string) => Timeline | null;
  getTimelinesForPivot: (pivotId: string) => Timeline[];

  // Timeline selection
  setTimelineRange: (timelineId: string, startDate: Date | null, endDate: Date | null) => void;
  setTimelineLevel: (timelineId: string, level: TimelineLevel) => void;
  clearTimelineSelection: (timelineId: string) => void;

  // Timeline options
  setTimelineStyle: (timelineId: string, style: Partial<TimelineStyle>) => void;

  // UI state
  selectSlicer: (id: string | null) => void;
  selectTimeline: (id: string | null) => void;

  // Position updates
  updateSlicerPosition: (id: string, position: Partial<Slicer['position']>) => void;
  updateTimelinePosition: (id: string, position: Partial<Timeline['position']>) => void;

  // Cleanup
  deleteSlicersForPivot: (pivotId: string) => void;
  deleteTimelinesForPivot: (pivotId: string) => void;
}

export const useSlicerStore = create<SlicerStore>()(
  persist(
    (set, get) => ({
      slicers: {},
      timelines: {},
      selectedSlicerId: null,
      selectedTimelineId: null,

      // Slicer CRUD
      createSlicer: (pivotId, fieldId, name, position) => {
        const id = `slicer_${Date.now()}`;
        const slicer: Slicer = {
          id,
          pivotId,
          fieldId,
          name,
          position: {
            x: position?.x ?? 50,
            y: position?.y ?? 50,
            width: 180,
            height: 200,
          },
          selectedValues: [],
          multiSelect: true,
          columns: 1,
          showHeader: true,
          sortOrder: 'asc',
          style: { ...DEFAULT_SLICER_STYLE },
        };

        set(state => ({
          slicers: { ...state.slicers, [id]: slicer },
          selectedSlicerId: id,
        }));

        return slicer;
      },

      updateSlicer: (id, updates) => {
        set(state => {
          const existing = state.slicers[id];
          if (!existing) return state;
          return {
            slicers: { ...state.slicers, [id]: { ...existing, ...updates } },
          };
        });
      },

      deleteSlicer: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.slicers;
          return {
            slicers: rest,
            selectedSlicerId: state.selectedSlicerId === id ? null : state.selectedSlicerId,
          };
        });
      },

      getSlicer: (id) => get().slicers[id] || null,

      getSlicersForPivot: (pivotId) => {
        return Object.values(get().slicers).filter(s => s.pivotId === pivotId);
      },

      // Slicer selection
      toggleSlicerValue: (slicerId, value) => {
        set(state => {
          const slicer = state.slicers[slicerId];
          if (!slicer) return state;

          let newValues: PivotCellValue[];
          if (slicer.multiSelect) {
            // Toggle value in/out of selection
            if (slicer.selectedValues.includes(value)) {
              newValues = slicer.selectedValues.filter(v => v !== value);
            } else {
              newValues = [...slicer.selectedValues, value];
            }
          } else {
            // Single select - replace selection
            newValues = slicer.selectedValues.includes(value) ? [] : [value];
          }

          return {
            slicers: {
              ...state.slicers,
              [slicerId]: { ...slicer, selectedValues: newValues },
            },
          };
        });
      },

      setSlicerValues: (slicerId, values) => {
        get().updateSlicer(slicerId, { selectedValues: values });
      },

      clearSlicerSelection: (slicerId) => {
        get().updateSlicer(slicerId, { selectedValues: [] });
      },

      selectAllSlicerValues: (slicerId, allValues) => {
        get().updateSlicer(slicerId, { selectedValues: [...allValues] });
      },

      // Slicer options
      setSlicerColumns: (slicerId, columns) => {
        get().updateSlicer(slicerId, { columns: Math.max(1, columns) });
      },

      setSlicerSort: (slicerId, sortOrder) => {
        get().updateSlicer(slicerId, { sortOrder });
      },

      setSlicerStyle: (slicerId, style) => {
        const slicer = get().slicers[slicerId];
        if (slicer) {
          get().updateSlicer(slicerId, { style: { ...slicer.style, ...style } });
        }
      },

      setSlicerMultiSelect: (slicerId, multiSelect) => {
        const slicer = get().slicers[slicerId];
        if (slicer) {
          // If switching to single select and multiple values are selected, keep only the first
          const selectedValues = !multiSelect && slicer.selectedValues.length > 1
            ? [slicer.selectedValues[0]]
            : slicer.selectedValues;
          get().updateSlicer(slicerId, { multiSelect, selectedValues });
        }
      },

      // Timeline CRUD
      createTimeline: (pivotId, fieldId, name, position) => {
        const id = `timeline_${Date.now()}`;
        const timeline: Timeline = {
          id,
          pivotId,
          fieldId,
          name,
          position: {
            x: position?.x ?? 50,
            y: position?.y ?? 50,
            width: 400,
            height: 100,
          },
          level: 'months',
          startDate: null,
          endDate: null,
          showHeader: true,
          showScrollbar: true,
          style: { ...DEFAULT_TIMELINE_STYLE },
        };

        set(state => ({
          timelines: { ...state.timelines, [id]: timeline },
          selectedTimelineId: id,
        }));

        return timeline;
      },

      updateTimeline: (id, updates) => {
        set(state => {
          const existing = state.timelines[id];
          if (!existing) return state;
          return {
            timelines: { ...state.timelines, [id]: { ...existing, ...updates } },
          };
        });
      },

      deleteTimeline: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.timelines;
          return {
            timelines: rest,
            selectedTimelineId: state.selectedTimelineId === id ? null : state.selectedTimelineId,
          };
        });
      },

      getTimeline: (id) => get().timelines[id] || null,

      getTimelinesForPivot: (pivotId) => {
        return Object.values(get().timelines).filter(t => t.pivotId === pivotId);
      },

      // Timeline selection
      setTimelineRange: (timelineId, startDate, endDate) => {
        get().updateTimeline(timelineId, { startDate, endDate });
      },

      setTimelineLevel: (timelineId, level) => {
        get().updateTimeline(timelineId, { level });
      },

      clearTimelineSelection: (timelineId) => {
        get().updateTimeline(timelineId, { startDate: null, endDate: null });
      },

      // Timeline options
      setTimelineStyle: (timelineId, style) => {
        const timeline = get().timelines[timelineId];
        if (timeline) {
          get().updateTimeline(timelineId, { style: { ...timeline.style, ...style } });
        }
      },

      // UI state
      selectSlicer: (id) => set({ selectedSlicerId: id }),
      selectTimeline: (id) => set({ selectedTimelineId: id }),

      // Position updates
      updateSlicerPosition: (id, position) => {
        const slicer = get().slicers[id];
        if (slicer) {
          get().updateSlicer(id, { position: { ...slicer.position, ...position } });
        }
      },

      updateTimelinePosition: (id, position) => {
        const timeline = get().timelines[id];
        if (timeline) {
          get().updateTimeline(id, { position: { ...timeline.position, ...position } });
        }
      },

      // Cleanup
      deleteSlicersForPivot: (pivotId) => {
        set(state => {
          const newSlicers = Object.fromEntries(
            Object.entries(state.slicers).filter(([_, s]) => s.pivotId !== pivotId)
          );
          return { slicers: newSlicers };
        });
      },

      deleteTimelinesForPivot: (pivotId) => {
        set(state => {
          const newTimelines = Object.fromEntries(
            Object.entries(state.timelines).filter(([_, t]) => t.pivotId !== pivotId)
          );
          return { timelines: newTimelines };
        });
      },
    }),
    {
      name: 'excelai-slicers',
      partialize: (state) => ({
        slicers: state.slicers,
        timelines: state.timelines,
      }),
    }
  )
);

export default useSlicerStore;
