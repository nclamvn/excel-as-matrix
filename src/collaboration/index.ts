// =============================================================================
// COLLABORATION — Module exports
// =============================================================================

// Types
export * from './types';

// Core classes
export { WebSocketClient, MockWebSocketClient } from './WebSocketClient';
export { CRDTEngine, createCRDTEngine } from './CRDTEngine';
export { PresenceManager } from './PresenceManager';
export { CommentManager } from './CommentManager';
export {
  AttributionTracker,
  attributionTracker,
  createAttributionTracker,
} from './AttributionTracker';

// Main manager
export {
  CollaborationManager,
  createCollaborationManager,
  initCollaboration,
  getCollaborationManager,
  type CollaborationConfig,
} from './CollaborationManager';
