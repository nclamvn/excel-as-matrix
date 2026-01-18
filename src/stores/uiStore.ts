import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Dialog types
type DialogType =
  | 'findReplace'
  | 'formatCells'
  | 'insertChart'
  | 'sortRange'
  | 'filterOptions'
  | 'sheetProperties'
  | 'insertFunction'
  | 'conditionalFormat'
  | 'dataValidation'
  | 'nameManager'
  | 'protectSheet'
  | 'print'
  | 'pageSetup'
  | 'preferences'
  | 'about'
  | 'fillSeries';

// Sidebar panel types
type SidebarPanel =
  | 'none'
  | 'format'
  | 'formulas'
  | 'comments'
  | 'history'
  | 'ai';

// Toast notification types
interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// UI State
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';

  // Command Palette
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;

  // Dialogs
  activeDialog: DialogType | null;
  dialogProps: Record<string, unknown>;

  // Sidebar
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;

  // Context Menu
  contextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuType: 'cell' | 'row' | 'column' | 'sheet' | null;

  // Notifications
  toasts: Toast[];

  // Layout
  ribbonCollapsed: boolean;
  formulaBarVisible: boolean;
  statusBarVisible: boolean;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // Mobile
  isMobile: boolean;
  mobileMenuOpen: boolean;
}

// UI Actions
interface UIActions {
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;

  // Command Palette
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteQuery: (query: string) => void;

  // Dialogs
  openDialog: (dialog: DialogType, props?: Record<string, unknown>) => void;
  closeDialog: () => void;

  // Sidebar
  openSidebar: (panel?: SidebarPanel) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setSidebarWidth: (width: number) => void;

  // Context Menu
  openContextMenu: (x: number, y: number, type: 'cell' | 'row' | 'column' | 'sheet') => void;
  closeContextMenu: () => void;

  // Notifications
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Layout
  toggleRibbon: () => void;
  toggleFormulaBar: () => void;
  toggleStatusBar: () => void;

  // Loading
  setLoading: (loading: boolean, message?: string) => void;

  // Mobile
  setMobile: (isMobile: boolean) => void;
  toggleMobileMenu: () => void;
}

// Detect system theme
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// Detect mobile
function detectMobile(): boolean {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768;
  }
  return false;
}

// Generate unique ID for toasts
let toastId = 0;
function generateToastId(): string {
  return `toast-${++toastId}`;
}

// Initial state
const initialState: UIState = {
  // Theme
  theme: 'system',
  resolvedTheme: getSystemTheme(),

  // Command Palette
  commandPaletteOpen: false,
  commandPaletteQuery: '',

  // Dialogs
  activeDialog: null,
  dialogProps: {},

  // Sidebar
  sidebarOpen: false,
  sidebarPanel: 'none',
  sidebarWidth: 320,

  // Context Menu
  contextMenuOpen: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuType: null,

  // Notifications
  toasts: [],

  // Layout
  ribbonCollapsed: false,
  formulaBarVisible: true,
  statusBarVisible: true,

  // Loading
  isLoading: false,
  loadingMessage: null,

  // Mobile
  isMobile: detectMobile(),
  mobileMenuOpen: false,
};

// Create the store
export const useUIStore = create<UIState & UIActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // Theme
        setTheme: (theme) => {
          const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
          set({ theme, resolvedTheme });

          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', resolvedTheme);
          }
        },

        toggleTheme: () => {
          const { resolvedTheme } = get();
          const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },

        // Command Palette
        openCommandPalette: () => set({ commandPaletteOpen: true, commandPaletteQuery: '' }),
        closeCommandPalette: () => set({ commandPaletteOpen: false, commandPaletteQuery: '' }),
        toggleCommandPalette: () => {
          const { commandPaletteOpen } = get();
          if (commandPaletteOpen) {
            get().closeCommandPalette();
          } else {
            get().openCommandPalette();
          }
        },
        setCommandPaletteQuery: (query) => set({ commandPaletteQuery: query }),

        // Dialogs
        openDialog: (dialog, props = {}) => set({
          activeDialog: dialog,
          dialogProps: props,
          // Close other overlays
          commandPaletteOpen: false,
          contextMenuOpen: false,
        }),
        closeDialog: () => set({ activeDialog: null, dialogProps: {} }),

        // Sidebar
        openSidebar: (panel = 'format') => set({
          sidebarOpen: true,
          sidebarPanel: panel
        }),
        closeSidebar: () => set({ sidebarOpen: false }),
        toggleSidebar: () => {
          const { sidebarOpen } = get();
          set({ sidebarOpen: !sidebarOpen });
        },
        setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
        setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(600, width)) }),

        // Context Menu
        openContextMenu: (x, y, type) => set({
          contextMenuOpen: true,
          contextMenuPosition: { x, y },
          contextMenuType: type,
        }),
        closeContextMenu: () => set({
          contextMenuOpen: false,
          contextMenuType: null
        }),

        // Notifications
        showToast: (message, type = 'info', duration = 3000) => {
          const id = generateToastId();
          const toast: Toast = { id, message, type, duration };

          set((state) => ({ toasts: [...state.toasts, toast] }));

          // Auto-dismiss
          if (duration > 0) {
            setTimeout(() => {
              get().dismissToast(id);
            }, duration);
          }
        },
        dismissToast: (id) => set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        })),
        clearToasts: () => set({ toasts: [] }),

        // Layout
        toggleRibbon: () => set((state) => ({ ribbonCollapsed: !state.ribbonCollapsed })),
        toggleFormulaBar: () => set((state) => ({ formulaBarVisible: !state.formulaBarVisible })),
        toggleStatusBar: () => set((state) => ({ statusBarVisible: !state.statusBarVisible })),

        // Loading
        setLoading: (loading, message) => set({
          isLoading: loading,
          loadingMessage: message
        }),

        // Mobile
        setMobile: (isMobile) => set({ isMobile }),
        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      }),
      {
        name: 'excel-ui-settings',
        partialize: (state) => ({
          theme: state.theme,
          ribbonCollapsed: state.ribbonCollapsed,
          formulaBarVisible: state.formulaBarVisible,
          statusBarVisible: state.statusBarVisible,
          sidebarWidth: state.sidebarWidth,
        }),
      }
    )
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const state = useUIStore.getState();
  state.setTheme(state.theme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useUIStore.getState().theme;
    if (currentTheme === 'system') {
      useUIStore.setState({ resolvedTheme: e.matches ? 'dark' : 'light' });
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

  // Listen for resize (mobile detection)
  window.addEventListener('resize', () => {
    useUIStore.setState({ isMobile: detectMobile() });
  });
}

// Selector hooks for common use cases
export const useTheme = () => useUIStore((state) => state.resolvedTheme);
export const useDialog = () => useUIStore((state) => ({
  activeDialog: state.activeDialog,
  dialogProps: state.dialogProps
}));
export const useSidebar = () => useUIStore((state) => ({
  open: state.sidebarOpen,
  panel: state.sidebarPanel,
  width: state.sidebarWidth,
}));
export const useToasts = () => useUIStore((state) => state.toasts);
export const useLoading = () => useUIStore((state) => ({
  isLoading: state.isLoading,
  message: state.loadingMessage,
}));
