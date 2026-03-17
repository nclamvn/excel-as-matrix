// ═══════════════════════════════════════════════════════════════════════════
// POWER QUERY STORE — Manage query pipelines
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  QueryPipeline,
  TransformStep,
  TransformResult,
  DataTable,
  executePipeline,
  createStep,
  TransformType,
} from '../powerquery';

interface PowerQueryState {
  pipelines: Record<string, QueryPipeline>;
  activePipelineId: string | null;
  previewData: TransformResult | null;
  isExecuting: boolean;

  // Actions
  createPipeline: (name: string, sourceSheetId: string) => string;
  deletePipeline: (id: string) => void;
  setActivePipeline: (id: string | null) => void;
  addStep: (pipelineId: string, type: TransformType, params: Record<string, unknown>, label?: string) => void;
  removeStep: (pipelineId: string, stepId: string) => void;
  toggleStep: (pipelineId: string, stepId: string) => void;
  moveStep: (pipelineId: string, stepId: string, direction: 'up' | 'down') => void;
  updateStepParams: (pipelineId: string, stepId: string, params: Record<string, unknown>) => void;
  executePreview: (pipelineId: string, sourceData: DataTable) => void;
  setSteps: (pipelineId: string, steps: TransformStep[]) => void;
}

export const usePowerQueryStore = create<PowerQueryState>()(
  persist(
    (set, get) => ({
      pipelines: {},
      activePipelineId: null,
      previewData: null,
      isExecuting: false,

      createPipeline: (name, sourceSheetId) => {
        const id = `pq-${Date.now()}`;
        const pipeline: QueryPipeline = {
          id,
          name,
          sourceSheetId,
          steps: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          pipelines: { ...state.pipelines, [id]: pipeline },
          activePipelineId: id,
        }));
        return id;
      },

      deletePipeline: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.pipelines;
          return {
            pipelines: rest,
            activePipelineId: state.activePipelineId === id ? null : state.activePipelineId,
          };
        });
      },

      setActivePipeline: (id) => set({ activePipelineId: id, previewData: null }),

      addStep: (pipelineId, type, params, label) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          const step = createStep(type, params, label);
          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: {
                ...pipeline,
                steps: [...pipeline.steps, step],
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      removeStep: (pipelineId, stepId) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: {
                ...pipeline,
                steps: pipeline.steps.filter((s) => s.id !== stepId),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      toggleStep: (pipelineId, stepId) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: {
                ...pipeline,
                steps: pipeline.steps.map((s) =>
                  s.id === stepId ? { ...s, enabled: !s.enabled } : s
                ),
              },
            },
          };
        });
      },

      moveStep: (pipelineId, stepId, direction) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          const steps = [...pipeline.steps];
          const idx = steps.findIndex((s) => s.id === stepId);
          if (idx === -1) return state;

          const newIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= steps.length) return state;

          [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];

          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: { ...pipeline, steps },
            },
          };
        });
      },

      updateStepParams: (pipelineId, stepId, params) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: {
                ...pipeline,
                steps: pipeline.steps.map((s) =>
                  s.id === stepId ? { ...s, params: { ...s.params, ...params } } : s
                ),
              },
            },
          };
        });
      },

      executePreview: (pipelineId, sourceData) => {
        const pipeline = get().pipelines[pipelineId];
        if (!pipeline) return;

        set({ isExecuting: true });
        try {
          const result = executePipeline(sourceData, pipeline.steps);
          set({ previewData: result, isExecuting: false });
        } catch {
          set({ isExecuting: false });
        }
      },

      setSteps: (pipelineId, steps) => {
        set((state) => {
          const pipeline = state.pipelines[pipelineId];
          if (!pipeline) return state;

          return {
            pipelines: {
              ...state.pipelines,
              [pipelineId]: { ...pipeline, steps, updatedAt: new Date().toISOString() },
            },
          };
        });
      },
    }),
    {
      name: 'excelai-powerquery',
    }
  )
);
