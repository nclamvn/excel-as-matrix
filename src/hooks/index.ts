// Phase 4: Hooks
export { useWebSocket } from './useWebSocket';
export { usePresence, useCellPresence, useSelectionOverlays, useRemoteCursors } from './usePresence';
export { usePermissions, useCan, useRoleGate, useCellEditable } from './usePermissions';

// Phase 10: Offline Hooks
export { useNetworkStatus, getConnectionQuality } from './useNetworkStatus';
export { useOffline, useOfflineWorkbooks, useStorageQuota } from './useOffline';
