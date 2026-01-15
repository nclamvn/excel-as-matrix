// Phase 4: Sharing & Audit Types

export interface ShareLink {
  id: string;
  workbookId: string;
  token: string;
  url: string;
  linkType: ShareLinkType;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  useCount: number;
  remainingUses?: number;
  requireLogin: boolean;
  hasPassword: boolean;
  isActive: boolean;
  isValid: boolean;
}

export type ShareLinkType = 'View' | 'Comment' | 'Edit';

export interface CreateShareLinkRequest {
  linkType: ShareLinkType;
  expiresInHours?: number;
  maxUses?: number;
  requireLogin?: boolean;
  allowedDomains?: string[];
  password?: string;
}

export interface ShareLinkInfo {
  workbookId: string;
  linkType: ShareLinkType;
  requireLogin: boolean;
  hasPassword: boolean;
  allowedDomains?: string[];
  isValid: boolean;
  expiresAt?: string;
}

export interface ShareAccess {
  workbookId: string;
  role: string;
  linkId: string;
}

export interface ValidateShareRequest {
  password?: string;
  email?: string;
}

// Audit types
export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  action: AuditAction;
  description: string;
  userId?: string;
  workbookId?: string;
  sheetId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction = 'Success' | 'Failure' | 'Denied' | 'Warning';

export type AuditEventType =
  // Auth events
  | 'Login'
  | 'Logout'
  | 'TokenRefresh'
  | 'PasswordChange'
  | 'AccountLocked'
  // Permission events
  | 'PermissionGranted'
  | 'PermissionRevoked'
  | 'PermissionDenied'
  | 'RoleChanged'
  // Data events
  | 'WorkbookCreated'
  | 'WorkbookDeleted'
  | 'WorkbookViewed'
  | 'SheetCreated'
  | 'SheetDeleted'
  | 'CellUpdated'
  | 'BulkUpdate'
  | 'DataExported'
  | 'DataImported'
  // Sharing events
  | 'ShareLinkCreated'
  | 'ShareLinkRevoked'
  | 'ShareLinkAccessed'
  | 'ShareLinkExpired'
  // Collaboration events
  | 'SessionStarted'
  | 'SessionEnded'
  | 'ConflictDetected'
  | 'ConflictResolved'
  // Admin events
  | 'UserCreated'
  | 'UserDeleted'
  | 'UserSuspended'
  | 'TeamCreated'
  | 'TeamDeleted'
  | 'SettingsChanged'
  | 'SystemEvent';

export interface AuditQuery {
  userId?: string;
  workbookId?: string;
  eventType?: AuditEventType;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  events: AuditEvent[];
  total: number;
  hasMore: boolean;
}

// Permission change request
export interface GrantPermissionRequest {
  granteeType: 'User' | 'Team' | 'Anyone';
  granteeId?: string;
  role: 'Editor' | 'Commenter' | 'Viewer';
}

export interface RevokePermissionRequest {
  granteeType: 'User' | 'Team' | 'Anyone';
  granteeId?: string;
}
