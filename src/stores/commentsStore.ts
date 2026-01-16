// ============================================================
// COMMENTS STORE
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CellComment,
  CommentReply,
  CommentAuthor,
  CellNote,
  CommentFilter,
  AUTHOR_COLORS,
} from '../types/comments';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 10);

interface CommentsStore {
  comments: Record<string, CellComment[]>;
  notes: Record<string, CellNote[]>;
  authors: CommentAuthor[];
  currentUserId: string;
  activeCommentId: string | null;
  showCommentsPanel: boolean;
  showAllComments: boolean;
  filter: CommentFilter;

  // Comment Actions
  addComment: (sheetId: string, cellRef: string, content: string) => string;
  updateComment: (commentId: string, content: string, sheetId: string) => void;
  deleteComment: (commentId: string, sheetId: string) => void;

  // Reply Actions
  addReply: (commentId: string, content: string, sheetId: string) => void;
  deleteReply: (commentId: string, replyId: string, sheetId: string) => void;

  // Resolution
  resolveComment: (commentId: string, sheetId: string) => void;
  reopenComment: (commentId: string, sheetId: string) => void;

  // Navigation
  setActiveComment: (commentId: string | null) => void;
  goToNextComment: (sheetId: string) => void;
  goToPrevComment: (sheetId: string) => void;

  // Notes
  addNote: (sheetId: string, cellRef: string, content: string) => string;
  updateNote: (noteId: string, content: string, sheetId: string) => void;
  deleteNote: (noteId: string, sheetId: string) => void;

  // UI State
  toggleCommentsPanel: () => void;
  toggleShowAllComments: () => void;
  setFilter: (filter: Partial<CommentFilter>) => void;

  // Getters
  getCommentsForCell: (sheetId: string, cellRef: string) => CellComment[];
  getCommentsForSheet: (sheetId: string) => CellComment[];
  getNoteForCell: (sheetId: string, cellRef: string) => CellNote | undefined;
  getAuthor: (authorId: string) => CommentAuthor | undefined;
}

const extractMentions = (content: string): string[] => {
  const matches = content.match(/@(\w+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
};

export const useCommentsStore = create<CommentsStore>()(
  persist(
    (set, get) => ({
      comments: {},
      notes: {},
      authors: [{ id: 'user1', name: 'You', color: AUTHOR_COLORS[0] }],
      currentUserId: 'user1',
      activeCommentId: null,
      showCommentsPanel: false,
      showAllComments: true,
      filter: { showResolved: false },

      addComment: (sheetId, cellRef, content) => {
        const id = generateId();
        const { currentUserId } = get();

        const newComment: CellComment = {
          id,
          cellRef,
          sheetId,
          authorId: currentUserId,
          content,
          replies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolved: false,
          mentions: extractMentions(content),
        };

        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: [...(state.comments[sheetId] || []), newComment],
          },
          activeCommentId: id,
          showCommentsPanel: true,
        }));

        return id;
      },

      updateComment: (commentId, content, sheetId) => {
        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).map(c =>
              c.id === commentId
                ? { ...c, content, updatedAt: new Date().toISOString(), mentions: extractMentions(content) }
                : c
            ),
          },
        }));
      },

      deleteComment: (commentId, sheetId) => {
        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).filter(c => c.id !== commentId),
          },
          activeCommentId: state.activeCommentId === commentId ? null : state.activeCommentId,
        }));
      },

      addReply: (commentId, content, sheetId) => {
        const { currentUserId } = get();
        const reply: CommentReply = {
          id: generateId(),
          authorId: currentUserId,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mentions: extractMentions(content),
        };

        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).map(c =>
              c.id === commentId
                ? { ...c, replies: [...c.replies, reply], updatedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      deleteReply: (commentId, replyId, sheetId) => {
        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).map(c =>
              c.id === commentId
                ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
                : c
            ),
          },
        }));
      },

      resolveComment: (commentId, sheetId) => {
        const { currentUserId } = get();
        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).map(c =>
              c.id === commentId
                ? { ...c, resolved: true, resolvedBy: currentUserId, resolvedAt: new Date().toISOString() }
                : c
            ),
          },
        }));
      },

      reopenComment: (commentId, sheetId) => {
        set((state) => ({
          comments: {
            ...state.comments,
            [sheetId]: (state.comments[sheetId] || []).map(c =>
              c.id === commentId
                ? { ...c, resolved: false, resolvedBy: undefined, resolvedAt: undefined }
                : c
            ),
          },
        }));
      },

      setActiveComment: (commentId) => set({ activeCommentId: commentId }),

      goToNextComment: (sheetId) => {
        const { comments, activeCommentId, filter } = get();
        let sheetComments = comments[sheetId] || [];
        if (!filter.showResolved) {
          sheetComments = sheetComments.filter(c => !c.resolved);
        }
        if (sheetComments.length === 0) return;

        const currentIndex = sheetComments.findIndex(c => c.id === activeCommentId);
        const nextIndex = (currentIndex + 1) % sheetComments.length;
        set({ activeCommentId: sheetComments[nextIndex].id });
      },

      goToPrevComment: (sheetId) => {
        const { comments, activeCommentId, filter } = get();
        let sheetComments = comments[sheetId] || [];
        if (!filter.showResolved) {
          sheetComments = sheetComments.filter(c => !c.resolved);
        }
        if (sheetComments.length === 0) return;

        const currentIndex = sheetComments.findIndex(c => c.id === activeCommentId);
        const prevIndex = currentIndex <= 0 ? sheetComments.length - 1 : currentIndex - 1;
        set({ activeCommentId: sheetComments[prevIndex].id });
      },

      addNote: (sheetId, cellRef, content) => {
        const id = generateId();
        const note: CellNote = {
          id,
          cellRef,
          sheetId,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          notes: {
            ...state.notes,
            [sheetId]: [...(state.notes[sheetId] || []), note],
          },
        }));

        return id;
      },

      updateNote: (noteId, content, sheetId) => {
        set((state) => ({
          notes: {
            ...state.notes,
            [sheetId]: (state.notes[sheetId] || []).map(n =>
              n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
            ),
          },
        }));
      },

      deleteNote: (noteId, sheetId) => {
        set((state) => ({
          notes: {
            ...state.notes,
            [sheetId]: (state.notes[sheetId] || []).filter(n => n.id !== noteId),
          },
        }));
      },

      toggleCommentsPanel: () => set((state) => ({ showCommentsPanel: !state.showCommentsPanel })),
      toggleShowAllComments: () => set((state) => ({ showAllComments: !state.showAllComments })),
      setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),

      getCommentsForCell: (sheetId, cellRef) => {
        return (get().comments[sheetId] || []).filter(c => c.cellRef === cellRef);
      },

      getCommentsForSheet: (sheetId) => {
        const { comments, filter } = get();
        let sheetComments = comments[sheetId] || [];

        if (!filter.showResolved) {
          sheetComments = sheetComments.filter(c => !c.resolved);
        }

        if (filter.searchText) {
          const search = filter.searchText.toLowerCase();
          sheetComments = sheetComments.filter(c =>
            c.content.toLowerCase().includes(search) ||
            c.replies.some(r => r.content.toLowerCase().includes(search))
          );
        }

        return sheetComments.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      getNoteForCell: (sheetId, cellRef) => {
        return (get().notes[sheetId] || []).find(n => n.cellRef === cellRef);
      },

      getAuthor: (authorId) => get().authors.find(a => a.id === authorId),
    }),
    {
      name: 'excelai-comments',
      partialize: (state) => ({
        comments: state.comments,
        notes: state.notes,
        authors: state.authors,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
