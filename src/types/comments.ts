// ============================================================
// COMMENT TYPES
// ============================================================

export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  color: string;
}

export interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mentions: string[];
}

export interface CellComment {
  id: string;
  cellRef: string;
  sheetId: string;
  authorId: string;
  content: string;
  replies: CommentReply[];
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  mentions: string[];
}

export interface CellNote {
  id: string;
  cellRef: string;
  sheetId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  backgroundColor?: string;
}

export interface CommentFilter {
  showResolved: boolean;
  authorId?: string;
  searchText?: string;
}

export const AUTHOR_COLORS = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853',
  '#9334E6', '#FF6D01', '#46BDC6', '#7BAAF7',
];
