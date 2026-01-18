// ============================================================
// CHART TEMPLATE STORE — Manage Chart Templates and Color Schemes
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ChartTemplate,
  ChartTemplateCategory,
  ColorScheme,
  BUILT_IN_CHART_TEMPLATES,
  CHART_COLOR_SCHEMES,
} from '../types/visualization';

interface ChartTemplateState {
  customTemplates: ChartTemplate[];
  customColorSchemes: ColorScheme[];
  favoriteTemplateIds: string[];
  recentTemplateIds: string[];
}

interface ChartTemplateActions {
  // Templates
  getTemplates: (category?: ChartTemplateCategory) => ChartTemplate[];
  getTemplateById: (id: string) => ChartTemplate | undefined;
  createCustomTemplate: (template: Omit<ChartTemplate, 'id' | 'createdAt' | 'isBuiltIn'>) => ChartTemplate;
  updateCustomTemplate: (id: string, updates: Partial<ChartTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => ChartTemplate | undefined;

  // Favorites
  toggleFavorite: (templateId: string) => void;
  isFavorite: (templateId: string) => boolean;
  getFavoriteTemplates: () => ChartTemplate[];

  // Recent
  addToRecent: (templateId: string) => void;
  getRecentTemplates: () => ChartTemplate[];
  clearRecentTemplates: () => void;

  // Color Schemes
  getColorSchemes: () => ColorScheme[];
  createCustomColorScheme: (scheme: Omit<ColorScheme, 'id'>) => ColorScheme;
  deleteCustomColorScheme: (id: string) => void;

  // Search & Filter
  searchTemplates: (query: string) => ChartTemplate[];
}

export const useChartTemplateStore = create<ChartTemplateState & ChartTemplateActions>()(
  persist(
    (set, get) => ({
      customTemplates: [],
      customColorSchemes: [],
      favoriteTemplateIds: [],
      recentTemplateIds: [],

      getTemplates: (category) => {
        const builtIn = BUILT_IN_CHART_TEMPLATES.map(t => ({
          ...t,
          createdAt: undefined,
        })) as ChartTemplate[];
        const custom = get().customTemplates;
        const all = [...builtIn, ...custom];

        if (category) {
          return all.filter(t => t.category === category);
        }
        return all;
      },

      getTemplateById: (id) => {
        const builtIn = BUILT_IN_CHART_TEMPLATES.find(t => t.id === id);
        if (builtIn) {
          return { ...builtIn, createdAt: undefined } as ChartTemplate;
        }
        return get().customTemplates.find(t => t.id === id);
      },

      createCustomTemplate: (template) => {
        const newTemplate: ChartTemplate = {
          ...template,
          id: crypto.randomUUID(),
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          customTemplates: [...state.customTemplates, newTemplate],
        }));

        return newTemplate;
      },

      updateCustomTemplate: (id, updates) => {
        set(state => ({
          customTemplates: state.customTemplates.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteCustomTemplate: (id) => {
        set(state => ({
          customTemplates: state.customTemplates.filter(t => t.id !== id),
          favoriteTemplateIds: state.favoriteTemplateIds.filter(fid => fid !== id),
          recentTemplateIds: state.recentTemplateIds.filter(rid => rid !== id),
        }));
      },

      duplicateTemplate: (id) => {
        const template = get().getTemplateById(id);
        if (!template) return undefined;

        const newTemplate: ChartTemplate = {
          ...template,
          id: crypto.randomUUID(),
          name: `${template.name} (Copy)`,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          customTemplates: [...state.customTemplates, newTemplate],
        }));

        return newTemplate;
      },

      toggleFavorite: (templateId) => {
        set(state => {
          const isFav = state.favoriteTemplateIds.includes(templateId);
          return {
            favoriteTemplateIds: isFav
              ? state.favoriteTemplateIds.filter(id => id !== templateId)
              : [...state.favoriteTemplateIds, templateId],
          };
        });
      },

      isFavorite: (templateId) => {
        return get().favoriteTemplateIds.includes(templateId);
      },

      getFavoriteTemplates: () => {
        const { favoriteTemplateIds, getTemplateById } = get();
        return favoriteTemplateIds
          .map(id => getTemplateById(id))
          .filter((t): t is ChartTemplate => t !== undefined);
      },

      addToRecent: (templateId) => {
        set(state => {
          const filtered = state.recentTemplateIds.filter(id => id !== templateId);
          const updated = [templateId, ...filtered].slice(0, 10); // Keep last 10
          return { recentTemplateIds: updated };
        });
      },

      getRecentTemplates: () => {
        const { recentTemplateIds, getTemplateById } = get();
        return recentTemplateIds
          .map(id => getTemplateById(id))
          .filter((t): t is ChartTemplate => t !== undefined);
      },

      clearRecentTemplates: () => {
        set({ recentTemplateIds: [] });
      },

      getColorSchemes: () => {
        return [...CHART_COLOR_SCHEMES, ...get().customColorSchemes];
      },

      createCustomColorScheme: (scheme) => {
        const newScheme: ColorScheme = {
          ...scheme,
          id: crypto.randomUUID(),
        };

        set(state => ({
          customColorSchemes: [...state.customColorSchemes, newScheme],
        }));

        return newScheme;
      },

      deleteCustomColorScheme: (id) => {
        set(state => ({
          customColorSchemes: state.customColorSchemes.filter(s => s.id !== id),
        }));
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().getTemplates().filter(t =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'excelai-chart-templates',
    }
  )
);

export default useChartTemplateStore;
