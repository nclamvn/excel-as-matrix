// Phase 4: Authentication & User Types

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: GlobalRole;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export type GlobalRole = 'SuperAdmin' | 'Admin' | 'Member' | 'Guest';

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
}

export interface TeamMember {
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
}

export type TeamRole = 'Admin' | 'Editor' | 'Viewer';

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  isCurrent: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string;
}

export interface UpdatePreferencesRequest {
  theme?: 'light' | 'dark' | 'system';
  locale?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
}

// Permission types for workbooks
export type WorkbookRole = 'Owner' | 'Editor' | 'Commenter' | 'Viewer';

export interface WorkbookPermission {
  workbookId: string;
  granteeType: 'User' | 'Team' | 'Anyone';
  granteeId?: string;
  role: WorkbookRole;
  grantedBy: string;
  grantedAt: string;
}

export interface PermissionCheck {
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  role: WorkbookRole | null;
}

// Cell-level ACL
export interface CellAcl {
  sheetId: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  allowedUsers: string[];
  allowedTeams: string[];
  denyUsers: string[];
  denyTeams: string[];
}
