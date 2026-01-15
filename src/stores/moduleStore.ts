import { create } from 'zustand';
import { Module, ModuleExport, ModuleImport } from '../types/cell';

interface ModuleState {
  // Module registry
  modules: Record<string, Module>;
  modulesBySheet: Record<string, string[]>; // sheetId -> moduleIds
  modulesByName: Record<string, string>; // moduleName -> moduleId

  // Actions
  addModule: (module: Module) => void;
  updateModule: (moduleId: string, updates: Partial<Module>) => void;
  removeModule: (moduleId: string) => void;
  addExport: (moduleId: string, export_: ModuleExport) => void;
  updateExport: (moduleId: string, exportName: string, updates: Partial<ModuleExport>) => void;
  removeExport: (moduleId: string, exportName: string) => void;
  addImport: (moduleId: string, import_: ModuleImport) => void;
  removeImport: (moduleId: string, importName: string) => void;

  // Getters
  getModule: (moduleId: string) => Module | undefined;
  getModuleByName: (name: string) => Module | undefined;
  getModulesBySheet: (sheetId: string) => Module[];
  getModuleAtCell: (sheetId: string, row: number, col: number) => Module | undefined;
  resolveReference: (qualifiedName: string) => { module: Module; cellRef: string } | undefined;
  getExport: (moduleId: string, exportName: string) => ModuleExport | undefined;
  getPublicExports: (moduleId: string) => ModuleExport[];

  // Reset
  reset: () => void;
}

const initialState = {
  modules: {} as Record<string, Module>,
  modulesBySheet: {} as Record<string, string[]>,
  modulesByName: {} as Record<string, string>,
};

export const useModuleStore = create<ModuleState>()((set, get) => ({
  ...initialState,

  addModule: (module) => {
    set((state) => {
      const modules = { ...state.modules, [module.id]: module };
      const modulesBySheet = { ...state.modulesBySheet };
      if (!modulesBySheet[module.sheetId]) {
        modulesBySheet[module.sheetId] = [];
      }
      modulesBySheet[module.sheetId] = [...modulesBySheet[module.sheetId], module.id];
      const modulesByName = { ...state.modulesByName, [module.name]: module.id };

      return { modules, modulesBySheet, modulesByName };
    });
  },

  updateModule: (moduleId, updates) => {
    set((state) => {
      const existing = state.modules[moduleId];
      if (!existing) return state;

      const oldName = existing.name;
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };

      const modulesByName = { ...state.modulesByName };
      if (updates.name && updates.name !== oldName) {
        delete modulesByName[oldName];
        modulesByName[updates.name] = moduleId;
      }

      return {
        modules: { ...state.modules, [moduleId]: updated },
        modulesByName,
      };
    });
  },

  removeModule: (moduleId) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const { [moduleId]: _, ...modules } = state.modules;
      const modulesBySheet = { ...state.modulesBySheet };
      if (modulesBySheet[module.sheetId]) {
        modulesBySheet[module.sheetId] = modulesBySheet[module.sheetId].filter(id => id !== moduleId);
      }
      const { [module.name]: __, ...modulesByName } = state.modulesByName;

      return { modules, modulesBySheet, modulesByName };
    });
  },

  addExport: (moduleId, export_) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const updated = {
        ...module,
        exports: [...module.exports, export_],
        updatedAt: new Date().toISOString(),
      };

      return { modules: { ...state.modules, [moduleId]: updated } };
    });
  },

  updateExport: (moduleId, exportName, updates) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const exports = module.exports.map(exp =>
        exp.name === exportName ? { ...exp, ...updates } : exp
      );

      const updated = {
        ...module,
        exports,
        updatedAt: new Date().toISOString(),
      };

      return { modules: { ...state.modules, [moduleId]: updated } };
    });
  },

  removeExport: (moduleId, exportName) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const updated = {
        ...module,
        exports: module.exports.filter(exp => exp.name !== exportName),
        updatedAt: new Date().toISOString(),
      };

      return { modules: { ...state.modules, [moduleId]: updated } };
    });
  },

  addImport: (moduleId, import_) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const updated = {
        ...module,
        imports: [...module.imports, import_],
        updatedAt: new Date().toISOString(),
      };

      return { modules: { ...state.modules, [moduleId]: updated } };
    });
  },

  removeImport: (moduleId, importName) => {
    set((state) => {
      const module = state.modules[moduleId];
      if (!module) return state;

      const updated = {
        ...module,
        imports: module.imports.filter(imp => imp.name !== importName),
        updatedAt: new Date().toISOString(),
      };

      return { modules: { ...state.modules, [moduleId]: updated } };
    });
  },

  getModule: (moduleId) => {
    return get().modules[moduleId];
  },

  getModuleByName: (name) => {
    const moduleId = get().modulesByName[name];
    return moduleId ? get().modules[moduleId] : undefined;
  },

  getModulesBySheet: (sheetId) => {
    const moduleIds = get().modulesBySheet[sheetId] || [];
    return moduleIds.map(id => get().modules[id]).filter(Boolean);
  },

  getModuleAtCell: (sheetId, row, col) => {
    const modules = get().getModulesBySheet(sheetId);
    return modules.find(module =>
      row >= module.startRow &&
      row <= module.endRow &&
      col >= module.startCol &&
      col <= module.endCol
    );
  },

  resolveReference: (qualifiedName) => {
    const parts = qualifiedName.split('.');
    if (parts.length !== 2) return undefined;

    const [moduleName, exportName] = parts;
    const module = get().getModuleByName(moduleName);
    if (!module) return undefined;

    const export_ = module.exports.find(e => e.name === exportName && e.isPublic);
    if (!export_) return undefined;

    return { module, cellRef: export_.cellRef };
  },

  getExport: (moduleId, exportName) => {
    const module = get().modules[moduleId];
    return module?.exports.find(e => e.name === exportName);
  },

  getPublicExports: (moduleId) => {
    const module = get().modules[moduleId];
    return module?.exports.filter(e => e.isPublic) || [];
  },

  reset: () => {
    set(initialState);
  },
}));
