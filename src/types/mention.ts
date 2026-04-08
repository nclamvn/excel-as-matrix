// ============================================================
// MENTION TYPES
// ============================================================

export interface Mention {
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
}

export interface MentionNotification {
  id: string;
  type: 'mention';
  workbookId: string;
  sheetId: string;
  cellId: string;
  commentId: string;
  mentionedBy: string;
  mentionedByName: string;
  mentionedUserId: string;
  preview: string;
  createdAt: number;
  read: boolean;
}

export interface UserSuggestion {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
