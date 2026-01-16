// ============================================================
// SPARKLINE STORE — Zustand Store for Sparkline Management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  Sparkline,
  SparklineType,
  SparklineStyle,
  SparklineGroup,
  DEFAULT_SPARKLINE_STYLE,
} from '../types/sparkline';

interface SparklineStore {
  // State
  sparklines: Record<string, Sparkline[]>;  // sheetId -> sparklines
  groups: Record<string, SparklineGroup>;

  // CRUD
  addSparkline: (
    sheetId: string,
    type: SparklineType,
    dataRange: string,
    locationCell: string,
    row: number,
    col: number
  ) => string;
  updateSparkline: (sheetId: string, id: string, updates: Partial<Sparkline>) => void;
  deleteSparkline: (sheetId: string, id: string) => void;

  // Batch operations
  addSparklineRange: (
    sheetId: string,
    type: SparklineType,
    dataRanges: string[],
    locationCells: { cell: string; row: number; col: number }[]
  ) => string[];
  deleteSparklineRange: (sheetId: string, ids: string[]) => void;

  // Style
  updateSparklineStyle: (sheetId: string, id: string, style: Partial<SparklineStyle>) => void;
  applyStyleToGroup: (groupId: string, style: Partial<SparklineStyle>) => void;

  // Grouping
  createGroup: (sparklineIds: string[]) => string;
  ungroupSparklines: (groupId: string) => void;

  // Getters
  getSparklinesForSheet: (sheetId: string) => Sparkline[];
  getSparklineAtCell: (sheetId: string, row: number, col: number) => Sparkline | undefined;
  getSparklineById: (sheetId: string, id: string) => Sparkline | undefined;

  // Clear
  clearSparklinesForSheet: (sheetId: string) => void;
}

export const useSparklineStore = create<SparklineStore>()(
  persist(
    (set, get) => ({
      sparklines: {},
      groups: {},

      addSparkline: (sheetId, type, dataRange, locationCell, row, col) => {
        const id = nanoid(8);

        const newSparkline: Sparkline = {
          id,
          sheetId,
          type,
          dataRange,
          locationCell,
          locationRow: row,
          locationCol: col,
          style: { ...DEFAULT_SPARKLINE_STYLE },
          rightToLeft: false,
          dateAxis: false,
        };

        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [...(state.sparklines[sheetId] || []), newSparkline],
          },
        }));

        return id;
      },

      updateSparkline: (sheetId, id, updates) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).map(sp =>
              sp.id === id ? { ...sp, ...updates } : sp
            ),
          },
        }));
      },

      deleteSparkline: (sheetId, id) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).filter(sp => sp.id !== id),
          },
        }));
      },

      addSparklineRange: (sheetId, type, dataRanges, locationCells) => {
        const ids: string[] = [];
        const groupId = nanoid(8);

        const newSparklines: Sparkline[] = dataRanges.map((dataRange, i) => {
          const id = nanoid(8);
          ids.push(id);

          return {
            id,
            sheetId,
            type,
            dataRange,
            locationCell: locationCells[i].cell,
            locationRow: locationCells[i].row,
            locationCol: locationCells[i].col,
            style: { ...DEFAULT_SPARKLINE_STYLE },
            rightToLeft: false,
            dateAxis: false,
            groupId,
          };
        });

        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [...(state.sparklines[sheetId] || []), ...newSparklines],
          },
          groups: {
            ...state.groups,
            [groupId]: {
              id: groupId,
              sparklineIds: ids,
              sharedStyle: true,
            },
          },
        }));

        return ids;
      },

      deleteSparklineRange: (sheetId, ids) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: (state.sparklines[sheetId] || []).filter(
              sp => !ids.includes(sp.id)
            ),
          },
        }));
      },

      updateSparklineStyle: (sheetId, id, style) => {
        const sparkline = get().getSparklineById(sheetId, id);
        if (!sparkline) return;

        get().updateSparkline(sheetId, id, {
          style: { ...sparkline.style, ...style },
        });
      },

      applyStyleToGroup: (groupId, style) => {
        const group = get().groups[groupId];
        if (!group) return;

        // Find all sparklines in group and update their styles
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sp.groupId === groupId) {
              get().updateSparklineStyle(sheetId, sp.id, style);
            }
          });
        });
      },

      createGroup: (sparklineIds) => {
        const groupId = nanoid(8);

        set(state => ({
          groups: {
            ...state.groups,
            [groupId]: {
              id: groupId,
              sparklineIds,
              sharedStyle: true,
            },
          },
        }));

        // Update sparklines with group ID
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sparklineIds.includes(sp.id)) {
              get().updateSparkline(sheetId, sp.id, { groupId });
            }
          });
        });

        return groupId;
      },

      ungroupSparklines: (groupId) => {
        const group = get().groups[groupId];
        if (!group) return;

        // Remove group ID from sparklines
        Object.entries(get().sparklines).forEach(([sheetId, sparklines]) => {
          sparklines.forEach(sp => {
            if (sp.groupId === groupId) {
              get().updateSparkline(sheetId, sp.id, { groupId: undefined });
            }
          });
        });

        // Remove group
        set(state => {
          const { [groupId]: _, ...rest } = state.groups;
          return { groups: rest };
        });
      },

      getSparklinesForSheet: (sheetId) => {
        return get().sparklines[sheetId] || [];
      },

      getSparklineAtCell: (sheetId, row, col) => {
        return (get().sparklines[sheetId] || []).find(
          sp => sp.locationRow === row && sp.locationCol === col
        );
      },

      getSparklineById: (sheetId, id) => {
        return (get().sparklines[sheetId] || []).find(sp => sp.id === id);
      },

      clearSparklinesForSheet: (sheetId) => {
        set(state => ({
          sparklines: {
            ...state.sparklines,
            [sheetId]: [],
          },
        }));
      },
    }),
    {
      name: 'excelai-sparklines',
      partialize: (state) => ({
        sparklines: state.sparklines,
        groups: state.groups,
      }),
    }
  )
);

export default useSparklineStore;
