// Phase 5: Dashboard Store
// State management for interactive dashboards

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Dashboard,
  DashboardWidget,
  DashboardFilter,
  WidgetPosition,
  DashboardTheme,
  DEFAULT_THEMES,
  FilterValue,
} from '../types/visualization';

interface DashboardState {
  dashboards: Map<string, Dashboard>;
  activeDashboardId: string | null;
  selectedWidgetId: string | null;
  editingWidgetId: string | null;
  activeFilters: Map<string, Map<string, FilterValue[]>>;
  isEditMode: boolean;
  isPresentationMode: boolean;
  loading: boolean;
  error: string | null;
}

// Type for persisted dashboard state (serialized to localStorage)
interface PersistedDashboardState {
  dashboards?: [string, Dashboard][];
}

interface DashboardActions {
  // Dashboard CRUD
  createDashboard: (workbookId: string, name: string) => Dashboard;
  updateDashboard: (dashboardId: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (dashboardId: string) => void;
  duplicateDashboard: (dashboardId: string) => Dashboard | null;

  // Widget management
  addWidget: (dashboardId: string, widget: DashboardWidget) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  updateWidgetPosition: (dashboardId: string, widgetId: string, position: WidgetPosition) => void;
  updateWidgetPositions: (dashboardId: string, updates: { id: string; position: WidgetPosition }[]) => void;

  // Filter management
  addDashboardFilter: (dashboardId: string, filter: DashboardFilter) => void;
  updateDashboardFilter: (dashboardId: string, filterId: string, updates: Partial<DashboardFilter>) => void;
  removeDashboardFilter: (dashboardId: string, filterId: string) => void;
  setFilterValue: (dashboardId: string, filterId: string, values: FilterValue[]) => void;
  clearFilters: (dashboardId: string) => void;

  // Theme
  setTheme: (dashboardId: string, theme: DashboardTheme) => void;

  // Selection & UI state
  setActiveDashboard: (dashboardId: string | null) => void;
  selectWidget: (widgetId: string | null) => void;
  startEditingWidget: (widgetId: string | null) => void;
  setEditMode: (editMode: boolean) => void;
  setPresentationMode: (presentationMode: boolean) => void;

  // Loading
  getDashboardsByWorkbook: (workbookId: string) => Dashboard[];
  getActiveFiltersForWidget: (dashboardId: string, widgetId: string) => Map<string, FilterValue[]>;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: DashboardState = {
  dashboards: new Map(),
  activeDashboardId: null,
  selectedWidgetId: null,
  editingWidgetId: null,
  activeFilters: new Map(),
  isEditMode: true,
  isPresentationMode: false,
  loading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState & DashboardActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        createDashboard: (workbookId, name) => {
          const dashboard: Dashboard = {
            id: crypto.randomUUID(),
            workbookId,
            name,
            layout: {
              layoutType: 'Grid',
              columns: 12,
              rowHeight: 80,
              margin: [10, 10],
              padding: [10, 10],
              isDraggable: true,
              isResizable: true,
              preventCollision: true,
            },
            widgets: [],
            filters: [],
            theme: DEFAULT_THEMES.default,
            settings: {
              autoRefresh: false,
              refreshInterval: 300,
              showToolbar: true,
              showFilters: true,
              allowExport: true,
              allowFullscreen: true,
              viewMode: 'Edit',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => {
            const dashboards = new Map(state.dashboards);
            dashboards.set(dashboard.id, dashboard);
            return { dashboards, activeDashboardId: dashboard.id };
          });

          return dashboard;
        },

        updateDashboard: (dashboardId, updates) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                ...updates,
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        deleteDashboard: (dashboardId) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const activeFilters = new Map(state.activeFilters);
            dashboards.delete(dashboardId);
            activeFilters.delete(dashboardId);
            return {
              dashboards,
              activeFilters,
              activeDashboardId:
                state.activeDashboardId === dashboardId ? null : state.activeDashboardId,
            };
          });
        },

        duplicateDashboard: (dashboardId) => {
          const { dashboards } = get();
          const original = dashboards.get(dashboardId);
          if (!original) return null;

          const duplicate: Dashboard = {
            ...JSON.parse(JSON.stringify(original)),
            id: crypto.randomUUID(),
            name: `${original.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            widgets: original.widgets.map((w) => ({
              ...w,
              id: crypto.randomUUID(),
            })),
            filters: original.filters.map((f) => ({
              ...f,
              id: crypto.randomUUID(),
            })),
          };

          set((state) => {
            const newDashboards = new Map(state.dashboards);
            newDashboards.set(duplicate.id, duplicate);
            return { dashboards: newDashboards };
          });

          return duplicate;
        },

        addWidget: (dashboardId, widget) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                widgets: [...dashboard.widgets, widget],
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        updateWidget: (dashboardId, widgetId, updates) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                widgets: dashboard.widgets.map((w) =>
                  w.id === widgetId ? { ...w, ...updates } : w
                ),
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        removeWidget: (dashboardId, widgetId) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
                updatedAt: new Date().toISOString(),
              });
            }
            return {
              dashboards,
              selectedWidgetId:
                state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
              editingWidgetId:
                state.editingWidgetId === widgetId ? null : state.editingWidgetId,
            };
          });
        },

        updateWidgetPosition: (dashboardId, widgetId, position) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                widgets: dashboard.widgets.map((w) =>
                  w.id === widgetId ? { ...w, position } : w
                ),
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        updateWidgetPositions: (dashboardId, updates) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              const positionMap = new Map(updates.map((u) => [u.id, u.position]));
              dashboards.set(dashboardId, {
                ...dashboard,
                widgets: dashboard.widgets.map((w) => {
                  const newPosition = positionMap.get(w.id);
                  return newPosition ? { ...w, position: newPosition } : w;
                }),
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        addDashboardFilter: (dashboardId, filter) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                filters: [...dashboard.filters, filter],
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        updateDashboardFilter: (dashboardId, filterId, updates) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                filters: dashboard.filters.map((f) =>
                  f.id === filterId ? { ...f, ...updates } : f
                ),
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        removeDashboardFilter: (dashboardId, filterId) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                filters: dashboard.filters.filter((f) => f.id !== filterId),
                updatedAt: new Date().toISOString(),
              });
            }
            // Also clear active filter values
            const activeFilters = new Map(state.activeFilters);
            const dashboardFilters = activeFilters.get(dashboardId);
            if (dashboardFilters) {
              dashboardFilters.delete(filterId);
            }
            return { dashboards, activeFilters };
          });
        },

        setFilterValue: (dashboardId, filterId, values) => {
          set((state) => {
            const activeFilters = new Map(state.activeFilters);
            if (!activeFilters.has(dashboardId)) {
              activeFilters.set(dashboardId, new Map());
            }
            activeFilters.get(dashboardId)!.set(filterId, values);
            return { activeFilters };
          });
        },

        clearFilters: (dashboardId) => {
          set((state) => {
            const activeFilters = new Map(state.activeFilters);
            activeFilters.set(dashboardId, new Map());
            return { activeFilters };
          });
        },

        setTheme: (dashboardId, theme) => {
          set((state) => {
            const dashboards = new Map(state.dashboards);
            const dashboard = dashboards.get(dashboardId);
            if (dashboard) {
              dashboards.set(dashboardId, {
                ...dashboard,
                theme,
                updatedAt: new Date().toISOString(),
              });
            }
            return { dashboards };
          });
        },

        setActiveDashboard: (dashboardId) => {
          set({ activeDashboardId: dashboardId });
        },

        selectWidget: (widgetId) => {
          set({ selectedWidgetId: widgetId });
        },

        startEditingWidget: (widgetId) => {
          set({ editingWidgetId: widgetId });
        },

        setEditMode: (editMode) => {
          set({ isEditMode: editMode, isPresentationMode: false });
        },

        setPresentationMode: (presentationMode) => {
          set({
            isPresentationMode: presentationMode,
            isEditMode: !presentationMode,
            selectedWidgetId: null,
            editingWidgetId: null,
          });
        },

        getDashboardsByWorkbook: (workbookId) => {
          const { dashboards } = get();
          return Array.from(dashboards.values()).filter((d) => d.workbookId === workbookId);
        },

        getActiveFiltersForWidget: (dashboardId, widgetId) => {
          const { dashboards, activeFilters } = get();
          const dashboard = dashboards.get(dashboardId);
          if (!dashboard) return new Map();

          const dashboardActiveFilters = activeFilters.get(dashboardId);
          if (!dashboardActiveFilters) return new Map();

          const result = new Map<string, FilterValue[]>();
          for (const filter of dashboard.filters) {
            if (filter.affectsWidgets.includes(widgetId) || filter.affectsWidgets.length === 0) {
              const values = dashboardActiveFilters.get(filter.id);
              if (values && values.length > 0) {
                result.set(filter.sourceField, values);
              }
            }
          }
          return result;
        },

        setLoading: (loading) => {
          set({ loading });
        },

        setError: (error) => {
          set({ error });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'dashboard-store',
        partialize: (state) => ({
          dashboards: Array.from(state.dashboards.entries()),
        }),
        merge: (persistedState: unknown, current) => {
          const persisted = persistedState as PersistedDashboardState | undefined;
          return {
            ...current,
            dashboards: new Map(persisted?.dashboards || []),
          };
        },
      }
    ),
    { name: 'dashboard-store' }
  )
);

// Widget factory functions
export function createChartWidget(
  chartId: string,
  title: string,
  position: WidgetPosition
): DashboardWidget {
  return {
    id: crypto.randomUUID(),
    widgetType: 'Chart',
    title,
    position,
    dataSource: { chartId },
    config: {
      showTitle: true,
      showBorder: true,
      showShadow: false,
    },
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 16,
      titleFontSize: 14,
      titleColor: '#333333',
    },
    interactions: [],
  };
}

export function createPivotWidget(
  pivotId: string,
  title: string,
  position: WidgetPosition
): DashboardWidget {
  return {
    id: crypto.randomUUID(),
    widgetType: 'PivotTable',
    title,
    position,
    dataSource: { pivotId },
    config: {
      showTitle: true,
      showBorder: true,
      showShadow: false,
    },
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 16,
      titleFontSize: 14,
      titleColor: '#333333',
    },
    interactions: [],
  };
}

export function createKPIWidget(
  title: string,
  valueCell: string,
  position: WidgetPosition
): DashboardWidget {
  return {
    id: crypto.randomUUID(),
    widgetType: 'KPI',
    title,
    position,
    dataSource: {},
    config: {
      showTitle: true,
      showBorder: true,
      showShadow: false,
      kpiConfig: {
        valueCell,
        comparisonType: 'None',
      },
    },
    style: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderRadius: 8,
      padding: 16,
      titleFontSize: 14,
      titleColor: '#333333',
    },
    interactions: [],
  };
}

export function createTextWidget(
  content: string,
  position: WidgetPosition
): DashboardWidget {
  return {
    id: crypto.randomUUID(),
    widgetType: 'Text',
    position,
    dataSource: {},
    config: {
      showTitle: false,
      showBorder: false,
      showShadow: false,
      textContent: content,
    },
    style: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderRadius: 0,
      padding: 8,
      titleFontSize: 14,
      titleColor: '#333333',
    },
    interactions: [],
  };
}

// Helper to convert react-grid-layout positions
export function fromGridLayout(layout: {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}): WidgetPosition {
  return {
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
    isStatic: false,
  };
}

export function toGridLayout(widget: DashboardWidget): {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
} {
  return {
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: widget.position.minW,
    maxW: widget.position.maxW,
    minH: widget.position.minH,
    maxH: widget.position.maxH,
    static: widget.position.isStatic,
  };
}
